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
- [ ] **¿Guarda datos?** Hoy no hay nada persistente y ese camino no está probado (§5).
- [ ] **¿Cabe?** Todo `idiky` comparte **1 núcleo y 3 GB**; cada contenedor tiene 256 MB y
      construir usa hasta 2 GB. En `/` quedan unos 6 GB, compartidos con LangFlow.
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
| **8082 – 8099** | **Libres para servicios nuevos de Idiky.** Toma el siguiente y anótalo en esta tabla y en la del README |

- **Para que se vea desde internet** hay que agregar el puerto a la regla `Dev` del grupo de
  seguridad de red en Azure (hoy dice `8080,8081`). Eso lo hace el **responsable de
  integración** en el portal, en *Intervalos de puertos de destino*: `8080,8081,8082`. Sin ese
  paso el puerto no llega desde internet.
- **Aunque no esté en la regla, escucha en todas las interfaces** mientras
  `IDIKY_HOST=0.0.0.0`, y la red virtual de Azure sí llega. Un servicio que no debe salir del
  servidor necesita otro tratamiento (§5).

## 4. Receta: un servicio web nuevo

Ejemplo con `<nombre>` = `docs` y puerto `8082`. Cambia los dos por los tuyos.

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
IDIKY_PUERTO_DOCS="${IDIKY_PUERTO_DOCS:-8082}"

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
   Debe terminar con `idiky-docs responde en 0.0.0.0:8082 con la revision <commit>`.
6. **Comprobar el servicio** desde el servidor (o desde fuera, si ya está en la regla de
   Azure):

   ```bash
   ssh idiky@<ip> 'curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8082/'   # 401: pide clave
   ssh idiky@<ip> 'curl -s http://127.0.0.1:8082/revision.txt'                       # el commit
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

## 5. Lo que el entorno todavía no resuelve

Nada de esto está construido ni probado. Es el camino sugerido para no romper lo que hay;
**el primero que lo haga debe probarlo, dejarlo escrito aquí y quitar el «sin probar»**.

| Necesidad | Hoy | Camino sugerido *(sin probar)* |
|---|---|---|
| **Un servicio que no es nginx** (p. ej. una API) | `levantar.sh` supone el puerto 80, `/salud` y `/revision.txt`, y la clave es de nginx | La API responde ella misma `/salud` y `/revision.txt` en el 80 del contenedor. **Sin nginx delante no hay clave**: no se agrega a la regla de Azure hasta resolver su acceso |
| **Datos persistentes** (base de datos, archivos subidos) | Los contenedores usan `--rm`: no guardan nada | `--volume` a una carpeta dentro de `/home/idiky`, **nunca en `/mnt`**. Si el proceso del contenedor no corre como root, la carpeta se entrega con `podman unshare chown <uid>:<gid> <carpeta>`. Cuidado con el disco. Requiere ADR-0008 |
| **Que dos contenedores se hablen** (API ↔ base de datos) | Cada contenedor tiene su propia red y no se ven por nombre | Un *pod* de Podman (`podman pod create`): sus contenedores comparten `localhost`. Podman 3.4 genera las unidades del pod con `podman generate systemd --new --files --name <pod>`. Exige cambiar `levantar.sh` |
| **Un servicio que no debe salir del servidor** | `IDIKY_HOST` es uno solo para todos | Que `levantar()` reciba el host por servicio y ese se publique en `127.0.0.1`, o meterlo en un pod sin `--publish` |
| **Secretos** (claves de API, contraseña de una base de datos) | Solo existe la clave del entorno | Un archivo en `~idiky/.config/idiky/` con permisos 600, pasado con `--env-file` desde `levantar.sh`. Nunca en el repositorio, en el `Containerfile` ni en la línea de comandos |
| **HTTPS y dominio** | Pendiente (resto de T-35) | **No por el nginx de LangFlow**: 80 y 443 son suyos. Certificado por validación DNS, o una VM propia (ADR-0011) |
| **Compose** | Podman 3.4 no lo trae | No hace falta con pocos servicios. Si llega a hacer falta, ADR |
| **Limitar la CPU de un contenedor** | Sin root no se puede | El techo es por usuario: 1 núcleo y 3 GB para todo `idiky`. Si no alcanza, se discute subirlo, **sin quitárselo a LangFlow** |
| **Tareas programadas** | — | Temporizadores de systemd del usuario (`systemctl --user`), nunca el cron del sistema |

## 6. Si algo sale mal

| Síntoma | Qué mirar |
|---|---|
| El despliegue dice `no respondio en ...` | `ssh idiky@<ip> 'systemctl --user status container-idiky-<nombre> --no-pager; podman logs --tail 50 idiky-<nombre>'` |
| Falla la construcción | Lo publicado sigue en pie. El error sale en la salida de `desplegar.sh` |
| `verificar-vecino.sh` dice que algo cambió | **Revertir primero**: `git revert` del commit y desplegar de nuevo, o detener el servicio nuevo (`systemctl --user disable --now container-idiky-<nombre>`). Investigar después |
| Responde 200 sin clave | Falta el `include` o el servicio no es nginx: **quitarlo de la regla de Azure** hasta arreglarlo |
| Se acaba el disco | `podman system df` y `df -h /`. Nunca borrar nada fuera de `/home/idiky` |
| Otras rarezas | La tabla «Trampas conocidas» del README |
