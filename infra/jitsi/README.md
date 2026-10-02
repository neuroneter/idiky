# infra/jitsi — Jitsi para las asambleas virtuales

El servicio `jitsi` del entorno de desarrollo: **pod `idiky-jitsi`**, puerto **8085** (la sala,
por HTTP) y **`10000/udp`** (el video). Por qué existe y qué se decidió:
[ADR-0016](../../docs/adr/0016-jitsi-propio-para-las-asambleas-virtuales.md) · T-78.
Cómo está armado el entorno: [`../README.md`](../README.md).

> ⚠️ **Hoy no se puede usar de verdad, y no es un error de configuración.** El video necesita
> que **`10000/udp` sea alcanzable desde internet**, y la regla `Dev` del grupo de seguridad de
> red de Azure solo deja pasar TCP 8080–8083. Mientras no exista esa regla, la sala abre, se ve
> la interfaz y **nadie oye ni ve a nadie**. El túnel de Cloudflare no lo arregla: lleva HTTP,
> no UDP.

## Las piezas

| Contenedor | Imagen | Memoria | Qué hace |
|---|---|---|---|
| `idiky-jitsi-proxy` | `nginx:1.28-alpine` | 64 MB | El único con puerto HTTP. Responde `/salud` y `/revision.txt` y reenvía el resto a `jitsi/web`, WebSocket incluido |
| `idiky-jitsi-web` | `jitsi/web:stable-11031` | 128 MB | La interfaz de la sala. Escucha en el 8000 del pod |
| `idiky-jitsi-prosody` | `jitsi/prosody:stable-11031` | 192 MB | El XMPP: salas y **cuentas**. Lo único que persiste (`~/datos/jitsi/prosody`) |
| `idiky-jitsi-jicofo` | `jitsi/jicofo:stable-11031` | 384 MB | Arma la conferencia y reparte a la gente entre *bridges* |
| `idiky-jitsi-jvb` | `jitsi/jvb:stable-11031` | 640 MB | **El video.** Es el que necesita `10000/udp` |

Los cuatro de Jitsi **no se construyen: se traen** con versión fija (`IDIKY_JITSI_VERSION`),
como `postgres:17-alpine`. La configuración común, sin secretos, está en
[`comun.env`](./comun.env); las claves, en `~/.config/idiky/secretos/jitsi.env`.

`levantar.sh` **copia `comun.env` a `~/.config/idiky/jitsi-comun.env`** y es esa ruta la que
reciben los contenedores. No es un capricho: la unidad de systemd guarda el `--env-file` tal
como se escribió, y la carpeta del despliegue se reemplaza en cada publicación — con una ruta
relativa, el pod no volvería tras reiniciar el servidor. Es lo mismo que se hace con el script
de respaldo de BOB.

## Instalarlo, cuando exista la regla UDP

1. **Pedir la regla en Azure** (no está en nuestras manos, ADR-0014): `10000/udp` desde cualquier
   origen hacia la VM. Añadir `8085/tcp` solo si la sala se va a ver por IP; si va por el túnel
   de Cloudflare, no hace falta.

   Para comprobar que ya pasa, **antes** de instalar nada: un rechazo **al instante** significa
   que Azure deja pasar; un **timeout**, que sigue bloqueado.

2. **Los secretos, una sola vez**, en el servidor:

   ```bash
   ssh idiky@<ip> 'sh -s' < infra/jitsi/secretos.sh
   ```

   Y completar a mano lo que el script no puede inventar (`PUBLIC_URL` y, sobre todo,
   `JVB_ADVERTISE_IPS`, que es la **IP pública** del servidor). Mientras digan `CAMBIAR-POR…`,
   `levantar.sh` se detiene antes de tocar nada.

3. **La foto de LangFlow antes de tocar el servidor** (obligatorio, README §8):

   ```bash
   ssh idiky@<ip> 'sh -s -- --base' < infra/servidor/verificar-vecino.sh
   ```

4. **Desplegar solo este servicio**, desde `origin/main`:

   ```bash
   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main jitsi
   ```

5. **Comprobar LangFlow**: `ssh idiky@<ip> 'sh -s' < infra/servidor/verificar-vecino.sh` tiene
   que decir **«sigue igual»**.

6. **Crear la primera cuenta.** Sin cuenta nadie puede *abrir* una sala (`ENABLE_AUTH=1`):

   ```bash
   ssh idiky@<ip> "podman exec idiky-jitsi-prosody \
     prosodyctl --config /config/prosody.cfg.lua register <usuario> meet.jitsi '<clave>'"
   ```

   Las cuentas viven en `~/datos/jitsi/prosody` y sobreviven a los despliegues. Para entrar a
   una sala **ya abierta** basta el enlace.

## Comprobar que está sano

```bash
ssh idiky@<ip> 'curl -s http://127.0.0.1:8085/salud'                       # ok
ssh idiky@<ip> 'curl -s http://127.0.0.1:8085/revision.txt'                # el commit
ssh idiky@<ip> 'curl -so /dev/null -w "%{http_code}\n" http://127.0.0.1:8085/config.js'   # 200
ssh idiky@<ip> 'podman exec idiky-jitsi-jvb curl -s 127.0.0.1:8080/about/health'          # el video
ssh idiky@<ip> 'podman pod ps; podman logs --tail 50 idiky-jitsi-jvb'
```

## Si algo sale mal

| Síntoma | Qué es |
|---|---|
| **La sala abre y nadie se ve ni se oye** | Lo esperado hoy: `10000/udp` no llega desde internet, o `JVB_ADVERTISE_IPS` no es la IP pública. Es *el* problema de este servicio, no un detalle |
| El navegador dice que no se conecta al servidor | El WebSocket. Suele ser el `proxy_set_header Upgrade` del [`nginx.conf`](./nginx.conf), o alguien le puso la clave del entorno delante: `auth_basic` aquí **rompe** Jitsi (ADR-0016) |
| «No se puede crear la sala» | No hay cuenta: falta el paso 6 |
| El pod arranca y se reinicia solo | Memoria. `jicofo` y `jvb` son JVM con el heap recortado a mano en `comun.env`; el techo de `idiky` es 5 GB **para todo** |
| El siguiente despliegue dice `Quedan … MB libres` | Las imágenes de Jitsi pesan ~1,2 GB y dejaron el disco en el mínimo. Es el punto 4 de los pendientes de ADR-0016 |
| prosody no puede escribir en `/config` | Permisos del volumen: `ssh idiky@<ip> 'podman unshare chown -R 101:101 ~/datos/jitsi/prosody'` y volver a levantar el pod |

## Lo que no está probado

**Nada de este servicio se ha desplegado todavía.** Lo escrito aquí sale de la receta de
[`../nuevo-servicio.md`](../nuevo-servicio.md) y de lo medido en el servidor el 2026-09-26 (los
puertos que llegan, la CPU, la memoria y el disco). Quien lo despliegue por primera vez confirma
y corrige:

- Que `10000/udp` funciona a través de `slirp4netns` sin root, con la IP real de quien llega.
- Que el heap recortado de `jicofo` y `jvb` alcanza para una reunión de prueba.
- Los permisos del volumen de `prosody`.
- El disco que queda libre después de traer las cuatro imágenes.
