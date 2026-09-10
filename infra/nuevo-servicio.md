# Cómo agregar un servicio al entorno de desarrollo

> Para personas y agentes de IA. **Antes, lee [`README.md`](./README.md)**, que explica cómo
> está armado todo, y [ADR-0011](../docs/adr/0011-entorno-de-desarrollo-en-contenedores.md),
> que explica por qué. Esta es la receta.

Un «servicio» es algo que corre en su propio contenedor dentro del usuario `idiky`: hoy son
`idiky-pwa` e `idiky-contable`. Si lo que necesitas es cambiar uno que ya existe, las
secciones 2, 4 y 6 aplican igual.

## 1. Antes de escribir nada

- [ ] **¿En qué producto estás?** Regla n.º 1 de `CLAUDE.md`. Un servicio de infraestructura no
      cambia el código de `apps/pwa` ni de `apps/contable`: los empaqueta.
- [ ] **¿Trae una tecnología nueva** (un backend, una base de datos, un lenguaje)? Entonces
      primero va un ADR. El backend, en particular, es **ADR-0008**, que sigue pendiente.
      `CLAUDE.md` no permite dependencias sin ADR.
- [ ] **¿Se tiene que ver desde internet**, o solo lo usan otros servicios? Decide el puerto y
      cómo se publica (§3 y §5).
- [ ] **¿Guarda datos, tiene varias piezas o no es nginx?** Ya hay un ejemplo probado: el
      sistema de gestión (§5). Cópialo.
- [ ] **¿Cabe?** Todo `idiky` comparte **2 núcleos y 5 GB**; construyendo Strapi llegó a 4,6 GB.
      En `/` quedan unos 4,9 GB, compartidos con LangFlow, y `levantar.sh` no construye con
      menos de 3 GB libres.
- [ ] **Toma la foto de LangFlow** antes de tocar el servidor:
      `ssh idiky@<ip> 'sh -s -- --base' < infra/servidor/verificar-vecino.sh`

## 2. El contrato de un servicio

`levantar.sh` da esto por hecho. **Un servicio que no lo cumple no se despliega**, o se
despliega sin la clave.

| | Regla | Por qué |
|---|---|---|
| **Carpeta** | `infra/<nombre>/` con su `Containerfile` y su configuración | Una carpeta por servicio, como en `apps/` |
| **Nombre** | `<nombre>` en minúsculas, sin tildes ni espacios. Da la imagen `localhost/idiky-<nombre>:actual`, el contenedor `idiky-<nombre>` y la unidad `container-idiky-<nombre>.service` | `levantar.sh` arma los tres a partir de él |
| **Contexto** | La raíz del repositorio: `COPY apps/...`, `COPY infra/<nombre>/...` | Es lo que `levantar.sh` le pasa a `podman build` |
| **Puerto interno** | HTTP en el **80** dentro del contenedor | `levantar.sh` publica `<host>:<puerto>:80` |
| **`GET /salud`** | 200, **sin clave**, rápido | `levantar.sh` lo espera hasta 30 s; si no llega, el despliegue falla |
| **`GET /revision.txt`** | El commit, **sin clave** | Así se sabe qué está publicado. Se escribe con `ARG REVISION` al final del `Containerfile` |
| **Clave** | Si es nginx: `include /etc/nginx/idiky/*.conf;` en el `server`, y `auth_basic off;` en `/salud` y `/revision.txt` | Es lo que pide la clave del entorno (README §6) |
| **Imágenes base** | Registro completo y versión fija: `docker.io/library/nginx:1.28-alpine`, nunca `nginx` ni `:latest` | Que la construcción no dependa del servidor ni cambie sola |
| **Sin privilegios** | Nada de `--privileged`, ni `--network host`, ni puertos del servidor por debajo de 1024 | Podman corre sin root; y 80 y 443 son de LangFlow |
| **Sin secretos en la imagen** | Ni en el `Containerfile` ni en el repositorio | Van en `~idiky/.config/idiky/` (§5) |
| **Encabezado** | Cada archivo dice en un comentario qué servicio es, `T-35 · ADR-0011` y el ADR de su tecnología si trae una | Trazabilidad, como las pantallas con su CU |
| **Comentarios** | Sin tildes en scripts y configuraciones; los `.md`, en español correcto | Convención del repositorio (`docs/08-convenciones.md`) |

## 3. Puertos

| Puerto | De quién |
|---|---|
| 22, 80, 443, 8443, 7860 | **De LangFlow y del servidor. Prohibidos.** |
| 8080 | `idiky-pwa` |
| 8081 | `idiky-contable` |
| 8082 | Pod `idiky-gestion` (sistema de gestión) |
| **8083 – 8099** | **Libres para servicios nuevos de Idiky.** Toma el siguiente y anótalo en esta tabla y en la del README |

- **Para que se vea desde internet** hay que agregar el puerto a la regla `Dev` del grupo de
  seguridad de red en Azure (hoy dice `8080,8081,8082`). Eso lo hace el **responsable de
  integración** en el portal, en *Intervalos de puertos de destino*: `8080,8081,8082,8083`. Sin ese
  paso el puerto no llega desde internet.
- **Aunque no esté en la regla, escucha en todas las interfaces** mientras
  `IDIKY_HOST=0.0.0.0`, y la red virtual de Azure sí llega. Un servicio que no debe salir del
  servidor necesita otro tratamiento (§5).

## 4. Receta: un servicio web nuevo

Ejemplo con `<nombre>` = `docs` y puerto `8083`. Cambia los dos por los tuyos.

### 4.1 La imagen

Copia el ejemplo más parecido y adáptalo:

- **Solo sirve archivos** → copia `infra/contable/`.
- **Compila algo primero** → copia `infra/pwa/` (una etapa que compila y otra con nginx).

```dockerfile
# Imagen de <que es> para el entorno de desarrollo.
# T-35 · ADR-0011. Contexto de construccion: la raiz del repositorio.
#
#   podman build -f infra/docs/Containerfile -t idiky-docs .

# (Solo si compila) Etapa de construccion, con version fija.
FROM docker.io/library/node:22-alpine AS construccion
WORKDIR /app
COPY <ruta>/package.json <ruta>/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY <ruta>/ ./
RUN npm run build

FROM docker.io/library/nginx:1.28-alpine
COPY infra/docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /app/dist/ /usr/share/nginx/html/
# Al final, para no invalidar las capas de arriba en cada commit.
ARG REVISION=sin-revision
RUN echo "$REVISION" > /usr/share/nginx/html/revision.txt
```

### 4.2 La configuración de nginx

Parte de `infra/contable/nginx.conf`. **Lo que no se quita:**

```nginx
server {
    listen 80;
    server_name _;
    server_tokens off;
    root /usr/share/nginx/html;
    index index.html;

    include /etc/nginx/idiky/*.conf;          # la clave del entorno

    location = /salud {
        auth_basic off;
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location = /revision.txt {
        auth_basic off;
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### 4.3 Registrarlo en `levantar.sh`

Cuatro líneas, **cada una en su bloque**, y su puerto en el comentario de cabecera:

```sh
# Arriba, con los otros puertos:
IDIKY_PUERTO_DOCS="${IDIKY_PUERTO_DOCS:-8083}"

# Abajo, respetando el orden: TODO se construye antes de detener nada.
construir pwa
construir contable
construir docs                                   # <-- nuevo
levantar pwa "$IDIKY_PUERTO_PWA"
levantar contable "$IDIKY_PUERTO_CONTABLE"
levantar docs "$IDIKY_PUERTO_DOCS"               # <-- nuevo
esperar pwa "$IDIKY_PUERTO_PWA"
esperar contable "$IDIKY_PUERTO_CONTABLE"
esperar docs "$IDIKY_PUERTO_DOCS"                # <-- nuevo
```

**No pongas un `construir` después de un `levantar`**: si esa construcción falla, los servicios
anteriores ya quedaron detenidos.

### 4.4 Probar, publicar y verificar

1. **Revisa `.dockerignore`** si el servicio tiene carpetas pesadas que no deben viajar.
2. **Opcional, en tu máquina:** `podman build -f infra/docs/Containerfile -t prueba .`
   (o `docker build`, que usa el mismo archivo).
3. **Commit.** `desplegar.sh` publica lo que está en git.
4. **Foto de LangFlow**, si no la tomaste en el §1:
   `ssh idiky@<ip> 'sh -s -- --base' < infra/servidor/verificar-vecino.sh`
5. **Desplegar:** `IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave>.pem infra/desplegar.sh`.
   Debe terminar con `idiky-docs responde en 0.0.0.0:8083 con la revision <commit>`.
6. **Comprobar el servicio** desde el servidor (o desde fuera, si ya está en la regla de
   Azure):

   ```bash
   ssh idiky@<ip> 'curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8083/'   # 401: pide clave
   ssh idiky@<ip> 'curl -s http://127.0.0.1:8083/revision.txt'                       # el commit
   ```
7. **Comprobar LangFlow:** `ssh idiky@<ip> 'sh -s' < infra/servidor/verificar-vecino.sh` tiene
   que decir **«sigue igual»**. Si no, se revierte primero y se investiga después.
8. **Si debe verse desde internet**, pide al responsable que agregue el puerto a la regla `Dev`.
   Para probar que ya pasa, antes incluso de que el servicio exista: un rechazo **al
   instante** significa que Azure deja pasar; un **timeout**, que sigue bloqueado.

### 4.5 Documentar

- [ ] El puerto, en la tabla del §3 y en la del README.
- [ ] La fila del servicio, en la tabla de arriba del README.
- [ ] Su unidad, en «Deshacer todo» del README.
- [ ] Si trae tecnología nueva: su ADR, y la fila en `docs/adr/README.md`.
- [ ] La bitácora (`docs/09-estado-del-proyecto.md`) y el tablero (`docs/11-tablero-de-trabajo.md`).

## 5. Un servicio con datos, varias piezas o que no es nginx: copia el sistema de gestión

**Probado el 2026-09-10** con `infra/gestion/` (Strapi + PostgreSQL). Es el ejemplo a copiar:

| Necesidad | Cómo quedó resuelto | Dónde verlo |
|---|---|---|
| **Varias piezas que se hablan** (API ↔ base de datos) | Un **pod**: sus contenedores comparten red y se alcanzan por `127.0.0.1`. Solo el pod publica puerto | `levantar_gestion()` en `levantar.sh` |
| **Un servicio que no es nginx** | Un nginx dentro del pod es el único con puerto: responde `/salud` y `/revision.txt` y reenvía al servicio. El contrato del §2 se cumple igual | `infra/gestion/nginx.conf`, `proxy.Containerfile` |
| **Una base de datos sin puerto hacia afuera** | Dentro del pod, sin `--publish`. Comprobado: 5432 no aparece en el servidor | `levantar_gestion()` |
| **Datos que persisten** | `--volume` a `$IDIKY_DATOS/<servicio>/` (hoy `~/datos`), **nunca en `/mnt`**. Si el proceso no corre como root, `podman unshare chown <uid>:<gid> <carpeta>`. Comprobado: sobreviven a reiniciar el pod y a un redespliegue que lo recrea | `levantar_gestion()` |
| **Secretos** | Un script que los genera **una vez** en `~/.config/idiky/secretos/` (600) y **nunca los sobrescribe**; `--env-file` en `levantar.sh`, que se detiene antes de tocar nada si faltan | `infra/gestion/secretos.sh` |
| **Orden de arranque** | El servicio espera a su base (conexión TCP) antes de arrancar; sin eso systemd lo reinicia en bucle y se rinde | `infra/gestion/arrancar.sh` |
| **Su propia ruta de salud** | Además de `/salud` del nginx, `esperar <nombre> <puerto> /_health 240` | Final de `levantar.sh` |
| **Una construcción pesada** | `construir <nombre> <archivo> 3g`; y una sola etapa si las dependencias pesan (no se duplican en disco) | `infra/gestion/Containerfile` |
| **Un servicio con su propio login** | **Sin** la clave del entorno si usa la cabecera `Authorization` (tokens): `auth_basic` lo rompería. Su login es la puerta, y el primer administrador se crea **antes** de abrir el puerto en Azure | ADR-0012 |
| **Tareas programadas** | Temporizador de systemd del usuario, instalado por `levantar.sh`; nunca el cron del sistema | `infra/gestion/respaldo.sh` y `idiky-gestion-respaldo.{service,timer}` |
| **Ver la IP real de quien llega** | Pod con `--network slirp4netns:port_handler=slirp4netns` | `levantar_gestion()`. Comprobado: nginx registra la IP pública de quien llega |

**Cómo se registra en `levantar.sh`:** su construcción con su archivo y su memoria, una función
`levantar_<servicio>()` a imagen de `levantar_gestion()`, la comprobación de sus secretos
**antes** de construir nada, y su `esperar`. Las unidades de un pod son
`pod-<pod>.service` (la que se habilita) y `container-<contenedor>.service` (atadas al pod).

## 6. Lo que todavía no está resuelto

**El primero que lo haga debe probarlo, dejarlo escrito aquí y quitar el «sin probar»**.

| Necesidad | Hoy | Camino sugerido *(sin probar)* |
|---|---|---|
| **Un servicio que no debe salir del servidor, sin pod** | `IDIKY_HOST` es uno solo para todos | Que `levantar()` reciba el host por servicio, o meterlo en un pod sin `--publish` (esto último ya funciona: PostgreSQL) |
| **Respaldos fuera del servidor** | Quedan en el mismo disco: protegen de un error, no de perder la VM | Copiarlos a un almacenamiento de Azure u otro sitio |
| **Un disco propio para los datos** | En el disco compartido, con el freno de 3 GB | Disco de datos de Azure montado para `idiky`, y `IDIKY_DATOS` apuntando ahí (ADR-0012) |
| **HTTPS y dominio** | Pendiente (resto de T-35) | **No por el nginx de LangFlow**: 80 y 443 son suyos. Certificado por validación DNS, o una VM propia (ADR-0011) |
| **Compose** | Podman 3.4 no lo trae | No hace falta con pocos servicios. Si llega a hacer falta, ADR |
| **Limitar la CPU de un contenedor** | Sin root no se puede | El techo es por usuario: 2 núcleos y 5 GB para todo `idiky`. Si no alcanza, se discute subirlo, **sin quitárselo a LangFlow** |
| **Reinicio del servidor** | Probado reiniciar el pod, no la VM | En una ventana acordada, con `verificar-vecino.sh` antes y después |

## 7. Si algo sale mal

| Síntoma | Qué mirar |
|---|---|
| El despliegue dice `no respondio en ...` | `ssh idiky@<ip> 'systemctl --user status container-idiky-<nombre> --no-pager; podman logs --tail 50 idiky-<nombre>'`. Si es un pod: `pod-idiky-<nombre>` y los registros de cada contenedor del pod |
| Faltan secretos | `levantar.sh` se detiene antes de tocar nada; se crean con el script de secretos del servicio |
| No construye por disco | `levantar.sh` exige 3 GB libres. Revisar `df -h /` y `podman system df`; **nunca** borrar nada fuera de `/home/idiky` |
| Falla la construcción | Lo publicado sigue en pie. El error sale en la salida de `desplegar.sh` |
| `verificar-vecino.sh` dice que algo cambió | **Revertir primero**: `git revert` del commit y desplegar de nuevo, o detener el servicio nuevo (`systemctl --user disable --now container-idiky-<nombre>`). Investigar después |
| Responde 200 sin clave | Falta el `include` o el servicio no es nginx: **quitarlo de la regla de Azure** hasta arreglarlo |
| Se acaba el disco | `podman system df` y `df -h /`. Nunca borrar nada fuera de `/home/idiky` |
| Otras rarezas | La tabla «Trampas conocidas» del README |
