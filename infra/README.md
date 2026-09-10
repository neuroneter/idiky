# infra — entorno de desarrollo de Idiky

Los servicios de Idiky publicados en contenedores, en un servidor compartido con otro servicio
que **no puede verse afectado**. Las decisiones y sus porqués están en
[ADR-0011](../docs/adr/0011-entorno-de-desarrollo-en-contenedores.md) (el entorno) y
[ADR-0012](../docs/adr/0012-sistema-de-gestion-strapi.md) (el sistema de gestión).

> **¿Vas a crear o cambiar un servicio?** Lee este archivo para entender cómo está armado y
> después sigue [`nuevo-servicio.md`](./nuevo-servicio.md), que es la receta paso a paso.

| Servicio | Carpeta | Corre en | Puerto | Quién entra | Qué hace |
|---|---|---|---|---|---|
| PWA | `infra/pwa/` | contenedor `idiky-pwa` | `8080` | Clave del entorno | Compila `apps/pwa` con `npm run build` y la sirve con nginx. **Demo** |
| Contable | `infra/contable/` | contenedor `idiky-contable` | `8081` | Clave del entorno | Copia `apps/contable` **tal cual** (ADR-0010) y la sirve con nginx. **Demo** |
| **BOB** | `infra/gestion/` | **pod** `idiky-gestion`: nginx + Strapi + PostgreSQL | `8082` | **Login de Strapi** | El *back office* con el que IDIKY administra su negocio (`apps/gestion`, ADR-0012) |

## 1. La regla del servidor

**Todo lo de Idiky vive dentro del usuario `idiky`.** No se toca el nginx del servidor, ni el
firewall, ni los puertos 22, 80, 443, 8443 y 7860, ni nada fuera de `/home/idiky`. En el
servidor corre LangFlow, de otro proyecto, y **hay servicios que lo consultan**. Si algo de
Idiky parece necesitar salir de `idiky`, primero se discute con el responsable de
integración.

Y **antes y después de cualquier cambio** se verifica que LangFlow siga igual (§8).

## 2. Cómo está armado

### Del commit al contenedor

```
Tu máquina                                    Servidor · usuario idiky · sin root
──────────                                    ───────────────────────────────────
infra/desplegar.sh
  git archive <commit> ───── ssh ─────▶  ~/fuente/            copia exacta del commit
                                           │
                                           ▼
                                         infra/servidor/levantar.sh
                                           0. ¿están los secretos? (si no, no detiene nada)
                                           1. podman build      nice 15 · tope 2 GB (Strapi: 3 GB)
                                                                y NO construye con < 3 GB libres
                                                                → localhost/idiky-<s>:actual
                                           2. podman create     contenedor, o pod con sus contenedores
                                           3. podman generate systemd --new
                                                                → ~/.config/systemd/user/
                                           4. systemctl --user enable --now …
                                           5. espera GET /salud (30 s) y lee /revision.txt
                                              (gestión: además /_health de Strapi, hasta 240 s)
                                           6. podman image prune --all
```

- **Se publica lo que está en git**, no la carpeta de trabajo. Los cambios sin commit no suben,
  y el script avisa si los hay.
- **Se construye todo antes de detener nada**: si una construcción falla, lo publicado sigue
  en pie.
- Un despliegue completo tarda **unos 3 minutos**; casi todo es Strapi (`npm ci` 29 s y el
  panel 32 s).

### El camino de una petición

```
Navegador
  └─▶ Azure NSG, regla "Dev" (prioridad 340 · TCP 8080,8081,8082 · cualquier origen)
      └─▶ VM :8080   (escucha en todas las interfaces porque IDIKY_HOST=0.0.0.0)
          └─▶ rootlessport + slirp4netns   procesos de idiky: la red va en espacio de
              │                            usuario y no toca iptables
              └─▶ contenedor idiky-pwa :80
                  └─▶ nginx: ¿trae la clave? (auth_basic)
                      └─▶ /usr/share/nginx/html
```

Los puertos que no están en la regla `Dev` **no llegan desde internet** (comprobado: se quedan
sin respuesta). 8082 se agregó a la regla el 2026-09-10, y **nginx registra la IP pública real
de quien llega** (comprobado). Los puertos sí llegan desde la red virtual de Azure (regla por
defecto `AllowVnetInBound`), así que un puerto que escucha en `0.0.0.0` no está oculto del
todo.

### El pod del sistema de gestión

```
pod idiky-gestion · red propia (slirp4netns, port_handler=slirp4netns: conserva la IP real)
│  publica SOLO :8082 → :80
├── idiky-gestion-proxy     nginx:1.28-alpine · 64 MB
│     /salud, /revision.txt, bloquea /api/auth/local/register, reenvía el resto a :1337
├── idiky-gestion-strapi    node:24-alpine · 1,5 GB · usuario node (no root)
│     escucha 127.0.0.1:1337 · espera a PostgreSQL antes de arrancar (arrancar.sh)
│     volumen ~/datos/gestion/uploads → /opt/app/public/uploads
└── idiky-gestion-postgres  postgres:17-alpine · 512 MB
      escucha solo dentro del pod · volumen ~/datos/gestion/postgres
```

- **Un pod es un grupo de contenedores con la misma red**: se hablan por `127.0.0.1`, y desde
  fuera solo se ve el puerto que publica el pod. Por eso PostgreSQL no tiene ningún puerto en el
  servidor.
- **systemd**: `pod-idiky-gestion.service` (la que se habilita) recrea el pod y exige las
  unidades `container-idiky-gestion-*.service`, que están atadas a ella (`BindsTo`).
- **Secretos**: cada contenedor recibe los suyos con `--env-file` desde
  `~/.config/idiky/secretos/` (§9).
- **Sin la clave del entorno.** El panel de Strapi manda su token en la cabecera
  `Authorization`, la misma de `auth_basic`: la clave rompería el panel. La puerta es el login
  de Strapi (ADR-0012).

### Los techos de recursos

```
user-1001.slice ·············· techo: 2 núcleos de CPU y 5 GB   (systemd, preparar-servidor.sh)
└── user@1001.service
    ├── container-idiky-pwa.service ········ 256 MB · 256 procesos
    ├── container-idiky-contable.service ··· 256 MB · 256 procesos
    ├── pod-idiky-gestion.service
    │   ├── proxy ·························· 64 MB
    │   ├── strapi ························· 1,5 GB  (en reposo usa ~140 MB)
    │   └── postgres ······················· 512 MB  (en reposo usa ~90 MB)
    ├── idiky-gestion-respaldo.timer ······· pg_dump diario
    └── construcciones ····················· nice 15 · 2 GB (Strapi: 3 GB)
```

**El techo es por usuario, no por contenedor.** Sin root, Podman no puede limitar la CPU de un
contenedor, así que la protección de LangFlow está en el slice: pase lo que pase dentro de
`idiky`, choca contra ese techo. **Todo servicio nuevo comparte esos 5 GB**; construyendo
Strapi, `idiky` llegó a 4,6 GB.

Subió de 1 núcleo y 3 GB a 2 núcleos y 5 GB con el sistema de gestión. Sigue siendo seguro: la
unidad de LangFlow lo limita a 0,8 núcleos y 4 GB, y el servidor tiene 4 núcleos y 15 GB.

### Las unidades de systemd

Lo que `levantar.sh` genera para un contenedor, tal como está en el servidor
(`~/.config/systemd/user/container-idiky-pwa.service`, recortado):

```ini
[Unit]
Wants=network-online.target
After=network-online.target

[Service]
Restart=on-failure
ExecStart=/usr/bin/podman run --cidfile=%t/%n.ctr-id --cgroups=no-conmon --rm \
  --sdnotify=conmon -d --replace --name idiky-pwa --memory 256m --pids-limit 256 \
  --volume /home/idiky/.config/idiky/nginx:/etc/nginx/idiky:ro \
  --publish 0.0.0.0:8080:80 localhost/idiky-pwa:actual
ExecStop=/usr/bin/podman stop --ignore --cidfile=%t/%n.ctr-id
Type=notify

[Install]
WantedBy=default.target
```

- **La unidad guarda el comando de creación.** Cambiar la memoria, un volumen o un puerto no
  se hace con `systemctl --user restart`: se cambia `levantar.sh` y se vuelve a desplegar.
  **No se editan las unidades a mano**: el siguiente despliegue las reescribe.
- **`--rm` y `--replace`**: el contenedor no guarda nada entre arranques. Lo que persiste va en
  volúmenes, como los de PostgreSQL y los archivos de Strapi.
- **Arranca con el servidor** gracias a *linger*. **No se ha probado con un reinicio real**,
  porque reiniciar afecta a LangFlow: la primera vez que pase, hay que comprobar que volvieron.
  Sí se probó reiniciar el pod de gestión: vuelve en 7 s con sus datos.

### Las imágenes

| Servicio | Construcción | Imagen final |
|---|---|---|
| PWA | `node:22-alpine` · `npm ci` + `npm run build` | `nginx:1.28-alpine` + `dist/` (~64 MB) |
| Contable | — | `nginx:1.28-alpine` + `apps/contable/` (~64 MB) |
| Gestión: Strapi | **Una sola etapa** sobre `node:24-alpine`: `npm ci --include=dev` + `npm run build` | La misma. Con dos etapas, sus ~700 MB de dependencias quedarían duplicados en disco |
| Gestión: proxy | — | `nginx:1.28-alpine` + `nginx.conf` |
| Gestión: base | — | `postgres:17-alpine`, sin construir |

Las seis imágenes suman 1,3 GB; la mayor parte es Strapi.

- **Siempre con el nombre completo del registro** (`docker.io/library/...`) y una versión fija.
  PostgreSQL se fija en la versión mayor (`17`), que es la que decide el formato de los datos;
  las menores traen correcciones de seguridad.
- **El contexto de construcción es la raíz del repositorio.** Por eso los `COPY` dicen
  `apps/...` e `infra/...`. `.dockerignore` deja fuera `.git`, `node_modules`, `dist`, **los
  `.env`** y lo que Strapi genera.
- **`/revision.txt`** se escribe al final de cada imagen con `ARG REVISION`. En gestión lo sirve
  el nginx del pod, y la imagen de Strapi lo lleva como etiqueta.

## 3. Archivos

| Archivo | Dónde corre | Para qué |
|---|---|---|
| `pwa/Containerfile`, `pwa/nginx.conf` | Construcción | El servicio que compila: ejemplo si el nuevo servicio compila algo |
| `contable/Containerfile`, `contable/nginx.conf` | Construcción | El más simple: ejemplo si solo sirve archivos |
| `gestion/Containerfile` | Construcción | Strapi, en una etapa |
| `gestion/proxy.Containerfile`, `gestion/nginx.conf` | Construcción | El nginx del pod |
| `gestion/arrancar.sh` | Dentro del contenedor de Strapi | Espera a PostgreSQL y arranca Strapi |
| `gestion/secretos.sh` | Servidor, como `idiky`, **una vez** | Genera los secretos de gestión |
| `gestion/respaldo.sh`, `idiky-gestion-respaldo.{service,timer}` | Servidor, como `idiky` | El `pg_dump` diario |
| `servidor/preparar-servidor.sh` | Servidor, con sudo, **una vez** | Instala Podman, crea `idiky`, le pone el techo y le autoriza una llave |
| `servidor/levantar.sh` | Servidor, como `idiky` | Construye y (re)crea todo. **Aquí se registra cada servicio** |
| `servidor/clave-acceso.sh` | Servidor, como `idiky` | Pone una clave al azar a la PWA y la contable |
| `servidor/cargar-integraciones.sh` | Tu máquina | Sube las credenciales de BLOKY (Twilio; luego Google y Microsoft) desde `.env.integraciones.local` al servidor |
| `servidor/verificar-vecino.sh` | Servidor, como `idiky` | Foto de LangFlow antes y comparación después (§8) |
| `desplegar.sh` | Tu máquina | Sube un commit y llama a `levantar.sh` |
| `nuevo-servicio.md` | — | La receta para agregar un servicio |
| `../.dockerignore` | Construcción | Lo que no viaja al construir |

## 4. Desplegar

```bash
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave>.pem infra/desplegar.sh              # HEAD
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave>.pem infra/desplegar.sh origin/main  # otra rama
```

La dirección del servidor **no va en el repositorio**; la tiene el responsable de integración.
Para saber qué commit está publicado: `http://<ip>:8080/revision.txt`.

**En un servidor nuevo**, antes del primer despliegue, van los secretos de gestión, una vez:
`ssh idiky@<ip> 'sh -s' < infra/gestion/secretos.sh`. Sin ellos `levantar.sh` se detiene antes
de tocar nada.

## 5. Entrar

**PWA y contable**, con la clave del entorno: `http://<ip>:8080` y `http://<ip>:8081`. La regla
de Azure admite cualquier origen porque el equipo no tiene IP fija; **lo que cierra la puerta
es la clave**.

- **Sin clave solo responden** `/salud`, `/revision.txt` y el manifest de la PWA.
- **Es HTTP, no HTTPS.** La clave viaja sin cifrar, y el navegador apaga el *service worker* y
  la huella, que exigen contexto seguro.

**Gestión**, con el login de Strapi: `http://<ip>:8082/admin`.

Para cualquier cosa que exija contexto seguro, **por túnel** (`localhost` sí cuenta como
seguro):

```bash
ssh -i ~/.ssh/<llave>.pem -N -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 -L 8082:127.0.0.1:8082 idiky@<ip>
# y se abren http://localhost:8080, http://localhost:8081 y http://localhost:8082/admin
```

**Para cerrarlo a internet:** se borra `~idiky/.config/idiky/entorno` y se vuelve a desplegar.
Todo queda escuchando solo en `127.0.0.1`.

## 6. La clave del entorno

Protege la PWA, la contable y todo servicio nuevo que sea un nginx sirviendo archivos. **No
aplica al sistema de gestión** (§2). **No se guarda en claro en ningún sitio ni va al
repositorio**: se comparte por un canal privado. El usuario es `equipo`.

- **Poner una clave al azar**, que se muestra una sola vez:

  ```bash
  ssh idiky@<ip> 'sh -s' < infra/servidor/clave-acceso.sh
  ```

- **Poner una clave elegida** (así se puso la actual, el 2026-09-10). La clave viaja por la
  entrada estándar, no por la línea de comandos del servidor:

  ```bash
  printf '%s\n' 'LA-CLAVE' | ssh idiky@<ip> 'IFS= read -r c; d=~/.config/idiky/nginx;
    printf "equipo:%s\n" "$(printf %s "$c" | openssl passwd -apr1 -stdin)" > "$d/htpasswd.nuevo" &&
    chmod 644 "$d/htpasswd.nuevo" && mv "$d/htpasswd.nuevo" "$d/htpasswd"'
  ```

**Cambiarla toma efecto de inmediato**: nginx lee el archivo en cada petición. Solo la
**primera** vez hace falta volver a desplegar, para que los contenedores monten la carpeta.

**Cómo funciona:** `levantar.sh` monta `~/.config/idiky/nginx/` en `/etc/nginx/idiky/` de cada
contenedor, y cada `nginx.conf` hace `include /etc/nginx/idiky/*.conf;`. Si la carpeta no
existe, el patrón no encuentra archivos y nginx arranca sin clave. `htpasswd` tiene permisos
644 porque lo lee el usuario `nginx` dentro del contenedor; fuera, `/home/idiky` no deja
entrar a otros usuarios del servidor.

**No es la autenticación de la app** (ADR-0004 sigue igual): es la puerta del entorno.

## 7. Operar

Como `idiky` (`ssh idiky@<ip>`):

```bash
podman ps                                            # qué corre y en qué puerto
podman pod ps                                        # los pods
systemctl --user status container-idiky-pwa          # estado de un servicio
systemctl --user status pod-idiky-gestion            # estado del pod de gestión
podman logs --tail 50 idiky-gestion-strapi           # registros de un contenedor
systemctl --user restart pod-idiky-gestion           # reiniciar (no cambia sus parámetros)
podman stats --no-stream                             # memoria y CPU de cada contenedor
podman system df; df -h /                            # disco
systemctl show user-1001.slice -p CPUQuotaPerSecUSec -p MemoryMax   # el techo

# Gestión
podman exec -it idiky-gestion-postgres psql -U gestion -d gestion   # consola de PostgreSQL
systemctl --user start idiky-gestion-respaldo        # un respaldo ahora
systemctl --user list-timers                         # cuándo toca el siguiente
ls -l ~/datos/respaldos/gestion/                     # los respaldos
podman unshare du -sh ~/datos/gestion/postgres       # tamaño real de la base (ver §10)
```

**Dar acceso a otra persona para desplegar:** quien tenga sudo agrega su llave pública a
`/home/idiky/.ssh/authorized_keys`, o vuelve a correr `preparar-servidor.sh` pasándole la llave.
Para **ver** la PWA y la contable basta la clave del §6; para gestión, un usuario de Strapi.

## 8. Verificar que LangFlow sigue igual

**Obligatorio antes y después de cualquier cambio en el servidor**: un despliegue con un
servicio nuevo, un cambio de `levantar.sh` o de `preparar-servidor.sh`, un reinicio.

```bash
ssh idiky@<ip> 'sh -s -- --base' < infra/servidor/verificar-vecino.sh   # antes
# ... el cambio ...
ssh idiky@<ip> 'sh -s'           < infra/servidor/verificar-vecino.sh   # después: debe decir "sigue igual"
```

Compara el estado, el PID y los reinicios de `langflow` y `nginx`; los puertos 22, 80, 443,
8443 y 7860; y el código de las rutas que usan sus consumidores (`/health`, `/api/v1/version`,
el `OPTIONS` previo a `/api/v1/run`, `/ws`, la página de `8443`). **No ejecuta flujos**, porque
tendrían efectos.

**Desde fuera**, que esos puertos respondan igual: `http://<ip>/` → 301,
`https://<ip>/api/v1/version` → 200, `https://<ip>:8443/` → 200.

**Dos falsas alarmas conocidas**, para no perseguirlas:

- **`GET /api/v1/store/tags` → 500** en el log de nginx: es de LangFlow y ya pasaba antes de
  Idiky. El servicio externo al que consulta tiene un certificado inválido.
- **`OPTIONS /api/v1/run/...` con agente `curl/7.81.0`**: es el propio verificador.

## 9. Estado del servidor que no está en git

Lo que un despliegue **no** recrea. Si el servidor se rehace, esto es lo que hay que volver a
poner:

| Dónde | Qué | Lo crea |
|---|---|---|
| `~idiky/.config/idiky/entorno` | `IDIKY_HOST=0.0.0.0` (abierto a internet) | A mano |
| `~idiky/.config/idiky/nginx/acceso.conf` y `htpasswd` | La clave del entorno | `clave-acceso.sh` o el comando del §6 |
| `~idiky/.config/idiky/secretos/gestion-*.env` | Secretos de Strapi y PostgreSQL (600) | `infra/gestion/secretos.sh` |
| `~idiky/.config/idiky/secretos/integraciones.env` | Credenciales de Twilio Verify (600). **Todavía no las usa ningún servicio**: son para **BLOKY**, el sistema de las copropiedades (ADR-0008), que las recibirá con `--env-file`. **BOB no las usa** | `servidor/cargar-integraciones.sh`, desde la máquina de quien tiene los valores |
| `~idiky/datos/gestion/postgres/` | **La base de datos del sistema de gestión** | PostgreSQL, al primer arranque |
| `~idiky/datos/gestion/uploads/` | Archivos subidos a Strapi | Strapi |
| `~idiky/datos/respaldos/gestion/` | Los últimos 7 respaldos | `respaldo.sh` |
| El superadministrador de Strapi | Creado el 2026-09-10 como `admin@idiky.local` antes de abrir el puerto; el responsable de integración lo cambió por sus datos | La API de primer uso de Strapi |
| `~idiky/.config/idiky/vecino-base.txt` | La última foto de LangFlow | `verificar-vecino.sh --base` |
| `~idiky/.config/systemd/user/*.service`, `*.timer` | Las unidades | `levantar.sh`. **No se editan a mano** |
| `~idiky/.local/bin/idiky-gestion-respaldo` | Copia del script de respaldo | `levantar.sh` |
| `~idiky/.config/cni/net.d/87-podman.conflist` | La red por defecto de Podman | Podman |
| `~idiky/fuente/` | Copia del commit publicado | `desplegar.sh` |
| `~idiky/.ssh/authorized_keys` | Llaves de quienes despliegan | `preparar-servidor.sh` |
| `/etc/systemd/system.control/user-1001.slice.d/` | El techo de CPU y memoria | `preparar-servidor.sh` |
| El grupo de seguridad de red de la VM, regla `Dev` | Prioridad 340 · TCP 8080,8081,8082 · origen cualquiera | El responsable, en el portal de Azure |

## 10. Trampas conocidas

Cada una ya costó tiempo una vez:

| Trampa | Qué pasa | Cómo se evita |
|---|---|---|
| El paquete `podman` de Ubuntu | Habilita por su cuenta la API como root, el auto-update y el arranque de contenedores root | `preparar-servidor.sh` los apaga |
| `apt` sin interacción en Ubuntu 22.04 | `needrestart` puede reiniciar servicios del servidor | `NEEDRESTART_MODE=l NEEDRESTART_SUSPEND=1`, ya en `preparar-servidor.sh` |
| nginx y `.webmanifest` | Lo sirve como `application/octet-stream` | `default_type application/manifest+json` en su `location` |
| Cambiar flags con `restart` | No aplica: la unidad guarda el comando de creación | Cambiar `levantar.sh` y desplegar |
| `auth_basic` delante de algo con tokens | Strapi (panel y API) usa la cabecera `Authorization`: la clave lo rompe | Sin clave; la puerta es el login del servicio |
| `du` en la carpeta de PostgreSQL | Dice 4 KB: `idiky` no puede leerla por fuera, es del usuario `postgres` del contenedor | `podman unshare du -sh …` |
| `npm ci` con `NODE_ENV=production` | Omite las `devDependencies` y la compilación falla sin TypeScript | `npm ci --include=dev` |
| Lockfile generado en macOS | Podría faltarle el binario de Linux musl de `sharp`, `rollup` o `esbuild` | Antes de construir, buscarlos en `package-lock.json`. Hoy están |
| Errores `relation … does not exist` en PostgreSQL | Salen en el **primer** arranque de Strapi, cuando crea su esquema | Son normales esa vez; si salen después de un reinicio, no |
| `STRAPI_DISABLE_UPDATE_NOTIFICATION` | Ya no existe en Strapi 5.53 | `logger.updates.enabled: false` en `config/server.ts` |
| Scripts escritos en zsh (macOS) | `"$VAR:e..."` es un modificador de zsh y se come letras: `"$USR:equivocada"` mandó el usuario `quivocada` y curl se quedó pidiendo la clave. Y `set -- $var` no separa palabras | Escribir `"${VAR}:..."`, comillas simples, o `sh -s` en el servidor |
| Buscar un `curl -u` colgado con `pgrep` | curl borra de sus argumentos el valor de `-u` | Buscar por PID padre |
| Probar un puerto de Azure | No saber si falla Azure o el servicio | Rechazo **al instante** = Azure deja pasar; **timeout** = Azure bloquea |
| `/mnt` en Azure | Es un disco temporal: se borra al apagar la VM | Nada que deba persistir va ahí |
| Disco | Unos 4,9 GB libres en `/`, compartidos con la base de datos de LangFlow | `levantar.sh` no construye con menos de 3 GB; `podman image prune --all` tras cada despliegue |
| Reinicio del servidor | No probado con Idiky instalado | Hacerlo en una ventana acordada, con `verificar-vecino.sh` antes y después |

## 11. Deshacer todo

Deja el servidor como estaba antes de Idiky. **Borra la base de datos del sistema de gestión y
sus respaldos**: sácalos antes si hacen falta. Se corre con un usuario con sudo:

```bash
sudo -u idiky XDG_RUNTIME_DIR=/run/user/$(id -u idiky) \
  systemctl --user disable --now container-idiky-pwa container-idiky-contable \
  pod-idiky-gestion idiky-gestion-respaldo.timer
sudo loginctl disable-linger idiky
sudo rm -rf /etc/systemd/system.control/user-$(id -u idiky).slice.d && sudo systemctl daemon-reload
sudo pkill -u idiky; sudo userdel -r idiky
sudo sed -i '/^idiky:/d' /etc/subuid /etc/subgid
sudo apt-get purge podman uidmap slirp4netns fuse-overlayfs conmon crun \
  golang-github-containers-common golang-github-containers-image \
  containernetworking-plugins libslirp0 libyajl2
```

`userdel -r` puede fallar en archivos que quedaron con usuarios del espacio de nombres de
Podman (los de PostgreSQL); en ese caso, `sudo rm -rf /home/idiky`. Los paquetes se nombran uno
por uno a propósito: `apt autoremove` podría llevarse cosas que no son de Idiky. En Azure se
borra la regla `Dev` del grupo de seguridad de red. Si hay servicios nuevos, sus unidades van
también en la primera línea.
