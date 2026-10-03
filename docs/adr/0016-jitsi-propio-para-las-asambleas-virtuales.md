# ADR-0016 — Jitsi propio para las asambleas virtuales

- **Estado:** **Propuesta** — desplegado y en prueba desde el 2026-10-02; falta la decisión de fondo (§Pendientes, punto 2). Cómo se usa: [`infra/guia-de-jitsi.md`](../../infra/guia-de-jitsi.md)
- **Fecha:** 2026-09-26
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0007](./0007-transmision-en-vivo.md) (hoy Idiky **no** transmite: enlaza
  Zoom o Meet), [ADR-0011](./0011-entorno-de-desarrollo-en-contenedores.md) (el servidor
  compartido y sus límites), [ADR-0014](./0014-https-para-bloky-dev-con-tunel-de-cloudflare.md)
  (HTTPS sin abrir puertos), T-78

## Contexto

Daniel pidió instalar [Jitsi](https://jitsi.org/) en el servidor de desarrollo, en su propio
contenedor, **para las asambleas virtuales** (2026-09-26).

Eso reabre ADR-0007, que está **Aceptada** y dice lo contrario: *«Idiky no transmite video en
ninguna modalidad. Enlaza la herramienta que la copropiedad ya use»*, guardándola en
`Asamblea.enlaceTransmision`. El razonamiento de entonces sigue en pie —la asistencia y el voto
ponderado son lo insustituible, el video es el canal—, así que **Jitsi propio solo se justifica
si aparece algo que el enlace a Zoom o Meet no resuelve**. Eso es lo que falta declarar.

Con Jitsi el video dejaría de ser de un tercero y pasaría a ser de Idiky, con dos consecuencias
que ADR-0007 evitaba a propósito: la sala se cae si el servidor se cae, y la copropiedad
dependería de nuestra capacidad, no de la de Zoom.

### Lo que se comprobó en el servidor el 2026-09-26

Antes de escribir una línea se midió el servidor (`20.55.251.120`), porque Jitsi no es una
aplicación web más: **lleva audio y video en tiempo real**.

| | Lo que hay | Lo que Jitsi pide |
|---|---|---|
| **Puerto del video** | La regla `Dev` de Azure solo deja pasar **TCP 8080, 8081, 8082 y 8083**. Comprobado desde fuera: el 8085 no llega (se queda sin respuesta) | El *videobridge* necesita **`10000/udp` alcanzable desde internet**. Sin eso la sala se ve y no hay audio ni video |
| **El túnel de Cloudflare** | Publica HTTP con certificado, sin abrir puertos (ADR-0014) | **No sirve para el medio**: el túnel no lleva UDP, y el `jvb` ya no trae el respaldo por TCP. El túnel sí puede dar la página (`https://…`) |
| **CPU** | 2 núcleos para **todo** `idiky`, y sin root no se pueden repartir por contenedor | El `jvb` reparte el video de todos con todos, y compite con BOB, BLOKY y las construcciones |
| **Memoria** | 5 GB para todo `idiky`; los topes ya declarados suman 3,5 GB (el uso real en reposo es ~300 MB) | `jicofo` y `jvb` son dos JVM que por defecto piden hasta **3 GB de heap cada una** |
| **Disco** | **4,3 GB libres** en `/`, compartidos con la base de LangFlow, y `levantar.sh` se niega a construir con menos de 3 GB | Las cuatro imágenes de Jitsi pesan **~870 MB comprimidas**, cerca de **1,2 GB en disco** |

## Decisión

**Jitsi se monta como un servicio más del entorno** —`infra/jitsi/`, pod `idiky-jitsi`, puerto
**8085** y **`10000/udp`**— cumpliendo el contrato de
[`infra/nuevo-servicio.md`](../../infra/nuevo-servicio.md), y **queda apagado hasta que exista la
regla UDP en Azure**, porque sin ella no hay video que valga.

Cinco contenedores en un pod, como BOB y BLOKY:

```
pod idiky-jitsi · red propia (slirp4netns, port_handler=slirp4netns: conserva la IP real)
│  publica :8085 → :80  y  :10000/udp → :10000/udp
├── idiky-jitsi-proxy     nginx:1.28-alpine · 64 MB
│     /salud, /revision.txt, y reenvia el resto a jitsi/web (WebSocket incluido)
├── idiky-jitsi-web       jitsi/web:stable-11031 · 128 MB · escucha en 8000
├── idiky-jitsi-prosody   jitsi/prosody:stable-11031 · 192 MB · XMPP
│     volumen ~/datos/jitsi/prosody → /config  (ahi viven las CUENTAS)
├── idiky-jitsi-jicofo    jitsi/jicofo:stable-11031 · 384 MB · heap 256 MB
└── idiky-jitsi-jvb       jitsi/jvb:stable-11031 · 640 MB · heap 512 MB · el VIDEO (10000/udp)
```

Lo que se decide con eso, punto por punto:

1. **Versión fija `stable-11031`** (2026-06-08) en las cuatro imágenes, con el registro
   completo. **No se construyen: se traen**, como `postgres:17-alpine`. Cambiarla es cambiar
   `IDIKY_JITSI_VERSION`.
2. **Los topes de memoria se bajan a la fuerza** (`JICOFO_MAX_MEMORY=256m`,
   `VIDEOBRIDGE_MAX_MEMORY=512m`): con los de fábrica, las dos JVM se comerían el techo de
   `idiky` y el vecino a proteger es LangFlow. Los cinco contenedores suman **1.408 MB**, que
   con los 3.584 MB ya declarados dejan el total en 4.992 MB, justo por debajo del techo de 5 GB.
3. **Sin la clave del entorno**, por la misma razón que BOB: Jitsi habla por WebSocket y por
   tokens, y `auth_basic` lo rompería (README §2, «trampas conocidas»). **La puerta es
   `ENABLE_AUTH=1` con `AUTH_TYPE=internal`: sin cuenta no se puede ABRIR una sala**; para
   entrar a una sala abierta basta el enlace (`ENABLE_GUESTS=1`), y queda la sala de espera
   (`ENABLE_LOBBY=1`). Las cuentas se crean a mano con `prosodyctl`, una por persona que
   convoque.
4. **Solo persiste `prosody`** (`~/datos/jitsi/prosody`), porque ahí viven esas cuentas. Las
   demás piezas regeneran su configuración desde las variables en cada arranque, así que una
   actualización de versión no arrastra configuración vieja.
5. **`JVB_ADVERTISE_IPS` es la IP pública del servidor**, y va en los secretos, no en git: el
   contenedor solo se conoce por su IP privada de Podman, y sin anunciar la pública ningún
   navegador sabe a dónde mandar el video.
6. **El pod usa `port_handler=slirp4netns`**, que conserva la IP real de quien llega. Aquí no es
   un lujo: el `jvb` empareja candidatos ICE por dirección, y con todos llegando de la misma IP
   el emparejamiento no sirve.
7. **`todo` no lo incluye**: `jitsi`, como el túnel, se despliega nombrándolo, y solo el
   responsable de integración.

## Lo que hace falta y no está en nuestras manos

> **Estado al 2026-10-03:** 1 ✅ (regla `Dev-Udp` en Azure, 2026-10-02) · 2 ⏳ · 3 ✅
> (`https://jitsi-dev.idiky.com`, ruta `HTTP` del túnel) · 4 ⚠️ (quedan ~3,3 GB). Lo que salió
> distinto a lo previsto al desplegar —el puerto de `jitsi/web`— está en
> [`infra/guia-de-jitsi.md`](../../infra/guia-de-jitsi.md) §5.

| # | Qué | Quién |
|---|---|---|
| 1 | **Una regla en el grupo de seguridad de red de Azure: `10000/udp` desde cualquier origen** hacia la VM, y `8085/tcp` si la sala se va a ver por IP (si va por el túnel de Cloudflare, el 8085 no hace falta). **ADR-0014 dejó escrito que el equipo no administra la suscripción**: hay que pedirlo a quien sí | Quien administre Azure |
| 2 | **La decisión de fondo**: por qué Jitsi propio y no el enlace a Zoom o Meet de ADR-0007. Sin eso, este ADR no puede pasar de Propuesta | Daniel |
| 3 | **El nombre público**, si se quiere HTTPS: un *public hostname* más en el panel del mismo túnel (`jitsi-dev.idiky.com` → `http://10.0.2.2:8085`). El túnel da la página; **el video sigue necesitando el punto 1** | Daniel (Cloudflare) |
| 4 | **Disco.** Después de instalar Jitsi quedan ~3 GB libres, justo en el mínimo que `levantar.sh` exige para construir: el siguiente despliegue de cualquier servicio puede negarse. Es el empujón que le faltaba al disco de datos propio que ADR-0012 dejó pendiente | Daniel |

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Jitsi en el servidor compartido** (esta) | Es un servicio más, con la receta ya probada; sin costo de licencias | **Depende de un puerto UDP que hoy no existe**; 2 núcleos para todo `idiky`; el disco queda en el mínimo | **Propuesta**, apagada hasta el punto 1 |
| Seguir con el enlace a Zoom o Meet (ADR-0007) | Cero piezas, cero costo, ya decidido y construido | No es «de Idiky»; la grabación queda en manos de la copropiedad | **Es lo vigente** mientras no se declare el punto 2 |
| Jitsi como servicio (8x8 JaaS) o `meet.jit.si` embebido con la API de iframe | Jitsi dentro de BLOKY **hoy**, sin puertos, sin contenedor y sin CPU nuestra | Depende de un tercero y, en JaaS, tiene costo por minuto | Descartada por ahora; es el camino si el punto 1 no llega |
| Una VM propia para Jitsi | 80, 443 y 10000/udp libres; no toca a LangFlow ni al techo de 2 núcleos | Cuesta, y es otro servidor que mantener | El camino serio si las asambleas virtuales con video propio se confirman |

## Consecuencias

- **Nada cambia para el equipo hasta que se despliegue**: `jitsi` no está en `todo`, y sin sus
  secretos `levantar.sh` se detiene antes de tocar nada.
- **Las aplicaciones no saben de Jitsi todavía.** ADR-0007 sigue siendo el que manda en la PWA:
  `Asamblea.enlaceTransmision` guarda un enlace, y un enlace a una sala de Jitsi es un enlace
  como cualquier otro. **Integrarlo de verdad en BLOKY (crear la sala al convocar, entrar desde
  la asamblea, ligar asistencia) es otro trabajo, y otro caso de uso**.
- **El video de una asamblea real no cabe en este servidor.** Con 2 núcleos compartidos, esto
  sirve para probar y para reuniones pequeñas. Una asamblea de verdad, con decenas de cámaras,
  pide la VM propia.
- Si el `jvb` se queda sin el puerto UDP, el síntoma es exactamente este: la sala abre, se ve la
  interfaz, y nadie oye ni ve a nadie. Está escrito en `infra/jitsi/README.md` para no
  perseguirlo dos veces.
