# ADR-0011 — Entorno de desarrollo en contenedores: Podman sin root, en un servidor compartido

- **Estado:** Aceptada
- **Fecha:** 2026-09-10
- **Tarea:** T-35

## Contexto

T-35 pide un entorno donde ver publicadas la PWA y la contable. No hay servidor propio. El
que hay es una **VM Ubuntu 22.04 compartida**, donde ya corre otro servicio (LangFlow,
detrás de nginx, en los puertos 80, 443, 8443 y 7860) **con consumidores que dependen de
él**. Esa es la restricción que manda: **nada de lo que Idiky haga puede cambiar los
puertos, las rutas ni los recursos de ese servicio.**

Otras condiciones:

- **El disco es escaso** (unos 6 GB libres) y **la CPU es compartida** (4 núcleos).
- **El demo no tiene backend** (ADR-0008 sigue pendiente): los dos productos son archivos
  estáticos.
- **La contable no admite compilación** (ADR-0010): publicarla no puede agregarle ningún paso.

## Decisión

**Cada producto corre en su propio contenedor, con Podman sin root y bajo un usuario Linux
dedicado (`idiky`).** Cada contenedor es un nginx que sirve archivos estáticos y queda
publicado **solo en `127.0.0.1`**: 8080 para la PWA y 8081 para la contable. Los servicios
son de systemd del usuario, y se despliega un commit con `infra/desplegar.sh`.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Docker** (paquete de Ubuntu) | Lo más conocido; Compose moderno | El daemon corre como root y reescribe `iptables` y la política de reenvío **en un servidor que no es nuestro**. Pertenecer al grupo `docker` equivale a ser root | Descartada en este servidor |
| **LXD** (ya estaba instalado) | No hay que instalar nada; aislamiento fuerte | No usa imágenes OCI, así que el repositorio no tendría una receta reproducible. Su puente con NAT sí toca la red del servidor | Descartada |
| **nginx y Node directamente en el servidor** | Lo más simple | Se mezcla con el nginx del otro servicio: cualquier error de configuración lo tumba | Descartada |
| **Podman sin root, con usuario propio** | Sin daemon y sin root. La red va en espacio de usuario (`slirp4netns`) y no toca `iptables`. El usuario aparte **no puede leer los archivos del otro servicio**. Los `Containerfile` sirven igual con Docker | Ubuntu 22.04 trae la versión 3.4: sin `podman compose` ni Quadlet. Sin root no se puede limitar la CPU | **Elegida** |

## Consecuencias

**Lo que se vuelve fácil:**

- **Publicar una rama es un comando**, y lo publicado siempre corresponde a un commit: se
  sube con `git archive`, no la carpeta de trabajo. `/revision.txt` dice cuál es.
- **Cada producto sigue siendo de quien es.** La imagen de la contable copia la carpeta tal
  cual: sigue abriéndose con doble clic, y el contenedor solo la publica.
- **Cambiar de servidor no cambia la receta**: el mismo `Containerfile` funciona con Podman o
  Docker en una VM propia.

**Lo que queda difícil o pendiente:**

- **Hoy solo se entra por túnel SSH.** Publicar hacia la red es otra decisión y exige dos
  cosas más: una regla en la red de Azure y **HTTPS**. Sobre `http://<ip>` el navegador
  desactiva el *service worker* y la huella (WebAuthn), porque las dos exigen un contexto
  seguro; `localhost`, que es lo que da el túnel, sí cuenta como seguro. **No se hace pasar
  por el nginx del otro servicio**: su configuración no es de este proyecto.
- **Sin límite de CPU.** Se compensa con la construcción en `nice 15` y un tope de 2 GB de
  memoria, y cada contenedor con 256 MB.
- **Sin Compose.** No hace falta mientras no haya backend. Cuando ADR-0008 traiga una base
  de datos, esta decisión se revisa: los datos persistentes **nunca** van en `/mnt`, que en
  Azure es un disco temporal que se borra al apagar la VM.
- **El paquete de Podman de Ubuntu habilita por su cuenta** la API como root, el
  auto-update y el arranque de contenedores root. `preparar-servidor.sh` los apaga: Idiky
  no los usa, y el servidor tiene que quedar como estaba.
- **No se agrega ninguna dependencia a los productos.** Las imágenes base son
  `node:22-alpine` (solo para compilar la PWA; no llega a la imagen final) y
  `nginx:1.28-alpine`.
