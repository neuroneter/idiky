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
dedicado (`idiky`).** Cada contenedor es un nginx que sirve archivos estáticos, publicado en
8080 (PWA) y 8081 (contable) **detrás de una clave**. Los servicios son de systemd del
usuario, y se despliega un commit con `infra/desplegar.sh`.

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

- **Está abierto por HTTP, no por HTTPS** (ver la revisión, abajo). Sobre `http://<ip>` el
  navegador desactiva el *service worker* y la huella (WebAuthn), porque las dos exigen un
  contexto seguro; para probarlas se entra por túnel SSH, porque `localhost` sí cuenta como
  seguro. HTTPS queda pendiente, y **no se hará a través del nginx del otro servicio**: su
  configuración no es de este proyecto.
- **El techo de recursos lo pone systemd, no Podman.** Sin root, Podman no puede limitar la
  CPU, así que el slice del usuario `idiky` tiene un techo de un núcleo y 3 GB. Cubre también
  la construcción y la red de usuario, que es la que recibe el tráfico. Cada contenedor tiene
  además 256 MB.
- **Sin Compose.** No hace falta mientras no haya backend. Cuando ADR-0008 traiga una base
  de datos, esta decisión se revisa: los datos persistentes **nunca** van en `/mnt`, que en
  Azure es un disco temporal que se borra al apagar la VM.
- **El paquete de Podman de Ubuntu habilita por su cuenta** la API como root, el
  auto-update y el arranque de contenedores root. `preparar-servidor.sh` los apaga: Idiky
  no los usa, y el servidor tiene que quedar como estaba.
- **No se agrega ninguna dependencia a los productos.** Las imágenes base son
  `node:22-alpine` (solo para compilar la PWA; no llega a la imagen final) y
  `nginx:1.28-alpine`.

## Revisión — 2026-09-10: abierto al equipo, con clave

La primera versión publicaba solo en `127.0.0.1` y se entraba por túnel SSH. El mismo día se
abrió al equipo: en Azure se agregó la regla `Dev` (prioridad 340, TCP 8080 y 8081).
**Tuvo que quedar abierta a cualquier origen**, porque Mary y Jeimy no tienen IP fija.

Con la regla abierta, la protección no puede ser la red. Por eso, **antes de escuchar hacia
afuera**, se agregaron dos cosas:

| | Qué protege |
|---|---|
| **Clave de acceso** (`auth_basic` en los dos nginx, generada con `clave-acceso.sh`) | Que el demo no lo vea cualquiera que encuentre la IP. Solo quedan sin clave `/salud`, `/revision.txt` y el manifest |
| **Techo de CPU y memoria del usuario `idiky`** | Al otro servicio: el tráfico que llegue a 8080 y 8081 lo atienden procesos de `idiky`, y esos procesos tienen techo |

**La clave es la puerta del entorno, no la autenticación de la app.** Esa sigue fuera del
alcance de la fase 1 (ADR-0004). Viaja sin cifrar mientras no haya HTTPS: sirve para que no
entren escáneres ni curiosos, no para proteger datos reales, y el demo no tiene datos reales.
