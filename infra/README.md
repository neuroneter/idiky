# infra — entorno de desarrollo de Idiky

La PWA y la contable publicadas en contenedores, en un servidor compartido con otro servicio
que **no puede verse afectado**. La decisión y sus porqués están en
[ADR-0011](../docs/adr/0011-entorno-de-desarrollo-en-contenedores.md).

> **¿Vas a crear o cambiar un servicio?** Lee este archivo para entender cómo está armado y
> después sigue [`nuevo-servicio.md`](./nuevo-servicio.md), que es la receta paso a paso.

| Servicio | Carpeta | Contenedor | Puerto | Qué hace |
|---|---|---|---|---|
| PWA | `infra/pwa/` | `idiky-pwa` | `8080` | Compila `apps/pwa` con `npm run build` y la sirve con nginx |
| Contable | `infra/contable/` | `idiky-contable` | `8081` | Copia `apps/contable` **tal cual** (ADR-0010) y la sirve con nginx |

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
                                           1. podman build      nice 15 · tope 2 GB
                                                                → localhost/idiky-<s>:actual
                                           2. podman create     256 MB · 256 procesos
                                                                clave montada (solo lectura)
                                                                IDIKY_HOST:<puerto> → 80
                                           3. podman generate systemd --new
                                                                → ~/.config/systemd/user/
                                           4. systemctl --user enable --now container-idiky-<s>
                                           5. espera GET /salud (30 s) y lee /revision.txt
                                           6. podman image prune --all
```

- **Se publica lo que está en git**, no la carpeta de trabajo. Los cambios sin commit no suben,
  y el script avisa si los hay.
- **Se construye todo antes de detener nada**: si una construcción falla, lo publicado sigue
  en pie.
- Un despliegue completo tarda **unos 30 s**.

### El camino de una petición

```
Navegador
  └─▶ Azure NSG, regla "Dev" (prioridad 340 · TCP 8080,8081 · cualquier origen)
      └─▶ VM :8080   (escucha en todas las interfaces porque IDIKY_HOST=0.0.0.0)
          └─▶ rootlessport + slirp4netns   procesos de idiky: la red va en espacio de
              │                            usuario y no toca iptables
              └─▶ contenedor idiky-pwa :80
                  └─▶ nginx: ¿trae la clave? (auth_basic)
                      └─▶ /usr/share/nginx/html
```

Los puertos que no están en la regla `Dev` **no llegan desde internet** (comprobado: se quedan
sin respuesta). Pero sí llegan desde la red virtual de Azure (regla por defecto
`AllowVnetInBound`), así que un puerto que escucha en `0.0.0.0` no está oculto del todo.

### Los techos de recursos

```
user-1001.slice ········ techo: 1 núcleo de CPU y 3 GB   (systemd, preparar-servidor.sh)
└── user@1001.service
    ├── container-idiky-pwa.service ········ contenedor: 256 MB · 256 procesos
    ├── container-idiky-contable.service ··· contenedor: 256 MB · 256 procesos
    └── construcciones ····················· nice 15 · 2 GB
```

**El techo es por usuario, no por contenedor.** Sin root, Podman no puede limitar la CPU de un
contenedor, así que la protección de LangFlow está en el slice: pase lo que pase dentro de
`idiky` —una construcción pesada o tráfico desde internet—, choca contra ese techo. **Todo
servicio nuevo comparte esos 3 GB.**

### El contenedor por dentro

Lo que `levantar.sh` genera para cada servicio, tal como está hoy en el servidor
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
- **`--rm` y `--replace`**: el contenedor no guarda nada entre arranques. Todo lo que tenga que
  persistir va en un volumen (ver `nuevo-servicio.md` §5).
- **Arranca con el servidor** gracias a *linger*. **No se ha probado con un reinicio real**,
  porque reiniciar afecta a LangFlow: la primera vez que pase, hay que comprobar que volvieron.

### Las imágenes

| Servicio | Etapa de construcción | Imagen final | Tamaño |
|---|---|---|---|
| PWA | `docker.io/library/node:22-alpine` · `npm ci` + `npm run build` | `docker.io/library/nginx:1.28-alpine` + `dist/` | ~64 MB |
| Contable | — | `docker.io/library/nginx:1.28-alpine` + `apps/contable/` | ~64 MB |

- **Siempre con el nombre completo del registro** (`docker.io/library/...`) y una versión fija:
  así la construcción no depende de la configuración de registros del servidor y no cambia
  sola.
- **El contexto de construcción es la raíz del repositorio.** Por eso los `COPY` dicen
  `apps/...` e `infra/...`, y `.dockerignore` deja fuera `.git`, `node_modules` y `dist`.
- **`/revision.txt`** se escribe al final de cada imagen con `ARG REVISION`: así cambiar de
  commit no invalida las capas de arriba.

## 3. Archivos

| Archivo | Dónde corre | Para qué |
|---|---|---|
| `pwa/Containerfile`, `pwa/nginx.conf` | Construcción | El servicio que compila: ejemplo a copiar si el nuevo servicio compila algo |
| `contable/Containerfile`, `contable/nginx.conf` | Construcción | El servicio más simple: ejemplo a copiar si el nuevo servicio solo sirve archivos |
| `servidor/preparar-servidor.sh` | Servidor, con sudo, **una vez** | Instala Podman, crea `idiky`, le pone el techo y le autoriza una llave |
| `servidor/levantar.sh` | Servidor, como `idiky` | Construye y (re)crea los contenedores. **Aquí se registra cada servicio** |
| `servidor/clave-acceso.sh` | Servidor, como `idiky` | Pone una clave al azar al entorno |
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

## 5. Entrar

Abierto a internet **con clave**: `http://<ip>:8080` (PWA) y `http://<ip>:8081` (contable).
La regla de Azure admite cualquier origen porque el equipo no tiene IP fija; **lo que cierra
la puerta es la clave**.

- **Sin clave solo responden** `/salud`, `/revision.txt` y el manifest de la PWA.
- **Es HTTP, no HTTPS.** La clave viaja sin cifrar, y el navegador apaga el *service worker* y
  la huella, porque exigen contexto seguro. Para probar esas dos cosas se entra por túnel,
  porque `localhost` sí cuenta como seguro:

  ```bash
  ssh -i ~/.ssh/<llave>.pem -N -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 idiky@<ip>
  # y se abren http://localhost:8080 y http://localhost:8081
  ```
- **Para cerrarlo a internet:** se borra `~idiky/.config/idiky/entorno` y se vuelve a
  desplegar. Queda escuchando solo en `127.0.0.1`.

## 6. La clave

Es la misma para los dos servicios y para todos los que se agreguen con nginx. **No se guarda
en claro en ningún sitio ni va al repositorio**: se comparte por un canal privado. El usuario
es `equipo`.

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
systemctl --user status container-idiky-pwa          # estado del servicio
podman logs --tail 50 idiky-contable                 # registros de nginx
systemctl --user restart container-idiky-contable    # reiniciar uno (no cambia sus parámetros)
podman stats --no-stream                             # memoria y CPU de cada contenedor
podman system df                                     # disco de las imágenes
systemctl show user-1001.slice -p CPUQuotaPerSecUSec -p MemoryMax   # el techo
```

**Dar acceso a otra persona para desplegar:** quien tenga sudo agrega su llave pública a
`/home/idiky/.ssh/authorized_keys`, o vuelve a correr `preparar-servidor.sh` pasándole la llave.
Para **ver** el demo basta la clave del §6.

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
| `~idiky/.config/idiky/vecino-base.txt` | La última foto de LangFlow | `verificar-vecino.sh --base` |
| `~idiky/.config/systemd/user/container-idiky-*.service` | Las unidades | `levantar.sh`. **No se editan a mano** |
| `~idiky/.config/cni/net.d/87-podman.conflist` | La red por defecto de Podman | Podman |
| `~idiky/fuente/` | Copia del commit publicado | `desplegar.sh` |
| `~idiky/.ssh/authorized_keys` | Llaves de quienes despliegan | `preparar-servidor.sh` |
| `/etc/systemd/system.control/user-1001.slice.d/` | El techo de CPU y memoria | `preparar-servidor.sh` |
| El grupo de seguridad de red de la VM, regla `Dev` | Prioridad 340 · TCP 8080,8081 · origen cualquiera | El responsable, en el portal de Azure |

## 10. Trampas conocidas

Cada una ya costó tiempo una vez:

| Trampa | Qué pasa | Cómo se evita |
|---|---|---|
| El paquete `podman` de Ubuntu | Habilita por su cuenta la API como root, el auto-update y el arranque de contenedores root | `preparar-servidor.sh` los apaga |
| `apt` sin interacción en Ubuntu 22.04 | `needrestart` puede reiniciar servicios del servidor | `NEEDRESTART_MODE=l NEEDRESTART_SUSPEND=1`, ya en `preparar-servidor.sh` |
| nginx y `.webmanifest` | Lo sirve como `application/octet-stream` | `default_type application/manifest+json` en su `location` |
| Cambiar flags con `restart` | No aplica: la unidad guarda el comando de creación | Cambiar `levantar.sh` y desplegar |
| Scripts escritos en zsh (macOS) | `"$VAR:e..."` es un modificador de zsh y se come letras: `"$USR:equivocada"` mandó el usuario `quivocada` y curl se quedó pidiendo la clave | Escribir `"${VAR}:..."` o comillas simples |
| Buscar un `curl -u` colgado con `pgrep` | curl borra de sus argumentos el valor de `-u` | Buscar por PID padre |
| Probar un puerto de Azure | No saber si falla Azure o el servicio | Rechazo **al instante** = Azure deja pasar; **timeout** = Azure bloquea |
| `/mnt` en Azure | Es un disco temporal: se borra al apagar la VM | Nada que deba persistir va ahí |
| Disco | Unos 6 GB libres en `/`, compartidos con la base de datos de LangFlow | `podman image prune --all` tras cada despliegue; mirar `df -h /` antes de agregar algo pesado |
| Reinicio del servidor | No probado con Idiky instalado | Hacerlo en una ventana acordada, con `verificar-vecino.sh` antes y después |

## 11. Deshacer todo

Deja el servidor como estaba antes de Idiky. Se corre con un usuario con sudo:

```bash
sudo -u idiky XDG_RUNTIME_DIR=/run/user/$(id -u idiky) \
  systemctl --user disable --now container-idiky-pwa container-idiky-contable
sudo loginctl disable-linger idiky
sudo rm -rf /etc/systemd/system.control/user-$(id -u idiky).slice.d && sudo systemctl daemon-reload
sudo pkill -u idiky; sudo userdel -r idiky
sudo sed -i '/^idiky:/d' /etc/subuid /etc/subgid
sudo apt-get purge podman uidmap slirp4netns fuse-overlayfs conmon crun \
  golang-github-containers-common golang-github-containers-image \
  containernetworking-plugins libslirp0 libyajl2
```

Los paquetes se nombran uno por uno a propósito: `apt autoremove` podría llevarse cosas que no
son de Idiky. En Azure se borra la regla `Dev` del grupo de seguridad de red. Si hay servicios
nuevos, sus unidades van también en la primera línea.
