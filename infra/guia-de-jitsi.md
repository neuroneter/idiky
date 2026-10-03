# Guía de Jitsi — las salas de video del entorno de desarrollo

> Cómo entrar, cómo crear cuentas, cómo está armado y qué hacer si falla. La decisión y su
> contexto están en [ADR-0016](../docs/adr/0016-jitsi-propio-para-las-asambleas-virtuales.md);
> el código del servicio, en el repo `Jitsi-Streaming-Idiky` (`infra/jitsi/`), y su registro en
> el servidor, en [`servidor/levantar.sh`](./servidor/levantar.sh). Tarea: T-78.

## 1. Entrar a una sala

**`https://jitsi-dev.idiky.com/<nombre-de-la-sala>`**, por ejemplo
`https://jitsi-dev.idiky.com/prueba-idiky`.

- **Abrir una sala exige cuenta** (`ENABLE_AUTH=1`): quien llega primero pulsa **«Soy el
  anfitrión»** y entra con su usuario y contraseña.
- **Entrar a una sala ya abierta solo exige el enlace.** El invitado espera en la sala de
  espera (`ENABLE_LOBBY=1`) y el anfitrión lo admite.
- **Siempre por `https://`.** Chrome, Safari y Firefox **no prestan cámara ni micrófono** a una
  página `http://`. Por `http://<ip>:8085` la sala abre y no sirve para hablar.
- El nombre que ven los demás lo escribe cada quien al entrar: la cuenta no lo guarda.

## 2. Las cuentas

| Usuario | Para quién | Creada |
|---|---|---|
| `daniel` | Cuenta de prueba de la instalación | 2026-10-02 |
| `ohernandez83` | Daniel Obed Ortega Hernandez | 2026-10-02 |
| `ju2484s` | Justo Soto Bueno | 2026-10-02 |

**Las contraseñas no se escriben en ningún documento ni chat.** Cada persona pone la suya en su
terminal.

**El usuario no puede ser un correo.** Jitsi guarda la cuenta como `usuario@meet.jitsi`, y esa
parte no admite `@`: si alguien escribe `nombre@gmail.com` al iniciar sesión, Jitsi lo toma como
una cuenta de otro dominio y la rechaza. Se usa lo que va antes del `@`.

Las cuentas viven en `~idiky/datos/jitsi/prosody/` y **sobreviven a los despliegues**. Todo se
corre **desde la Terminal del Mac** (no desde el chat de la IA: piden escribir la contraseña):

```bash
# Crear una cuenta (pide la contraseña dos veces, sin mostrarla ni dejarla en el historial)
ssh -t -i ~/.ssh/<llave> idiky@<ip> "podman exec -it idiky-jitsi-prosody prosodyctl --config /config/prosody.cfg.lua adduser <usuario>@meet.jitsi"

# Cambiar la contraseña
ssh -t -i ~/.ssh/<llave> idiky@<ip> "podman exec -it idiky-jitsi-prosody prosodyctl --config /config/prosody.cfg.lua passwd <usuario>@meet.jitsi"

# Borrar una cuenta
ssh -t -i ~/.ssh/<llave> idiky@<ip> "podman exec -it idiky-jitsi-prosody prosodyctl --config /config/prosody.cfg.lua deluser <usuario>@meet.jitsi"

# Ver qué cuentas existen (solo los nombres)
ssh -i ~/.ssh/<llave> idiky@<ip> "podman exec idiky-jitsi-prosody prosodyctl --config /config/prosody.cfg.lua shell 'user:list(\"meet.jitsi\")'"
```

> **No uses `register <usuario> meet.jitsi '<clave>'`**: deja la contraseña escrita en el
> comando y en el historial. Pasó el 2026-10-02: el comando de ejemplo se corrió tal cual y la
> cuenta quedó con la clave `TU-CLAVE` hasta que se cambió con `passwd`.

## 3. Cómo está armado

```
navegador ──https──▶ Cloudflare ──túnel idiky-dev──▶ http://10.0.2.2:8085 ──▶ pod idiky-jitsi
                                                                              │ :8085 → :8090
                                                                              ├─ idiky-jitsi-proxy  nginx de Idiky (8090): /salud, /revision.txt, y el resto a jitsi/web
                                                                              ├─ idiky-jitsi-web    la página de la sala (80 del pod: la imagen lo trae fijo)
                                                                              ├─ idiky-jitsi-prosody XMPP y las cuentas (persiste en ~/datos/jitsi/prosody)
                                                                              ├─ idiky-jitsi-jicofo  arma la conferencia
                                                                              └─ idiky-jitsi-jvb     el VIDEO
navegador ══ audio y video por UDP, directo ══▶ 20.55.251.120:10000/udp ──▶ idiky-jitsi-jvb
```

| Pieza | Valor | Dónde se configura |
|---|---|---|
| Dirección pública | `https://jitsi-dev.idiky.com` | Panel de Cloudflare: túnel `idiky-dev`, *Published application routes* |
| Ruta del túnel | `jitsi-dev.idiky.com` → **`HTTP`** `10.0.2.2:8085` | Igual que `bloky-dev` y `bob-dev`. **Tiene que ser `HTTP`, no `HTTPS`** (§5) |
| Video | `10000/udp`, abierto en Azure (regla `Dev-Udp`, prioridad 1010, desde cualquier origen) | Grupo de seguridad de red de Azure |
| Página por IP | `8085/tcp` (regla `Dev`) | Solo sirve para comprobar `/salud`: sin HTTPS no hay cámara |
| `PUBLIC_URL` | `https://jitsi-dev.idiky.com` | `~idiky/.config/idiky/secretos/jitsi.env` |
| `JVB_ADVERTISE_IPS` | La IP pública del servidor | El mismo archivo. Sin ella el videobridge anuncia su IP privada y no hay video |
| Versión | `stable-11031`, igual en las cuatro imágenes | `IDIKY_JITSI_VERSION` en `levantar.sh` |
| Memoria | proxy 64 MB · web 128 · prosody 192 · jicofo 384 (heap 256) · jvb 640 (heap 512) | `levantar.sh` y `comun.env` |

**Desplegar** (solo el responsable de integración, con la foto de LangFlow antes y después):

```bash
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main jitsi
```

Trae el `origin/main` de `Jitsi-Streaming-Idiky`. `todo` no lo incluye.

## 4. Comprobar que está sano

```bash
curl -s https://jitsi-dev.idiky.com/salud            # ok
curl -s https://jitsi-dev.idiky.com/revision.txt     # el commit publicado
ssh idiky@<ip> 'podman pod ps; podman ps --filter pod=idiky-jitsi'
ssh idiky@<ip> 'podman exec idiky-jitsi-jvb curl -s -o /dev/null -w "%{http_code}\n" 127.0.0.1:8080/about/health'   # 200: el video está sano
ssh idiky@<ip> 'ss -uln | grep ":10000 "'           # el puerto del video escucha
```

**La única prueba que confirma el video** es una reunión de dos personas desde redes distintas
(un computador y un celular con datos): si se ven y se oyen, el UDP llega.

## 5. Lo que ya falló, y por qué

| Fecha | Síntoma | Causa | Arreglo |
|---|---|---|---|
| 2026-10-02 | `/config.js` no respondía; `jitsi/web` decía `bind() to 0.0.0.0:80 failed` | La imagen `jitsi/web` trae `listen 80` fijo en su plantilla e **ignora `HTTP_PORT`**: chocaba con el nginx de Idiky en el 80 del pod | El proxy de Idiky pasó al **8090** del pod y el pod publica `8085 → 8090` (`Jitsi-Streaming-Idiky` `v0.1.1` y `levantar.sh`) |
| 2026-10-02 | `https://jitsi-dev.idiky.com` respondía **502** | La ruta del túnel se creó con servicio `HTTPS`. El registro del túnel decía *«first record does not look like a TLS handshake»*: Jitsi habla HTTP dentro del servidor | La ruta se cambió a **`HTTP`**. El certificado lo pone Cloudflare |
| 2026-10-02 | El Mac decía que `jitsi-dev.idiky.com` no existía, con el DNS ya creado | El Mac guardó la respuesta «no existe» de antes de crear la ruta | Esperar unos minutos. Se comprueba con `dig +short jitsi-dev.idiky.com @1.1.1.1` |

| Si pasa esto | Es esto |
|---|---|
| **La sala abre y nadie se ve ni se oye** | El UDP no llega: la regla `Dev-Udp` de Azure, o `JVB_ADVERTISE_IPS` no es la IP pública |
| El navegador no pide cámara ni micrófono | Se entró por `http://`. Tiene que ser `https://jitsi-dev.idiky.com` |
| «No se puede crear la sala» o pide usuario sin parar | Nadie con cuenta ha abierto la sala; o se escribió el usuario con `@correo` (§2) |
| No conecta al servidor | El WebSocket. Se comprueba que `/xmpp-websocket` responda **101** con `Upgrade: websocket`; nunca poner la clave del entorno (`auth_basic`) delante de Jitsi |
| Un despliegue dice `Quedan … MB libres` | Las imágenes de Jitsi ocupan ~1,2 GB y el disco quedó en ~3,3 GB. Limpiar imágenes sin uso: `ssh idiky@<ip> 'podman image prune --all --force'` |

## 6. Lo que falta

- **La reunión de prueba con video** entre dos personas (T-78).
- **La decisión de fondo** frente a ADR-0007 (por qué Jitsi propio y no el enlace a Zoom o Meet):
  hasta entonces ADR-0016 sigue en *Propuesta*.
- **Integrarlo en BLOKY** —crear la sala al convocar la asamblea y ligarla a la asistencia— es
  otro caso de uso, y se documenta primero en `docs/casos-de-uso/`.
- **Capacidad:** con 2 núcleos compartidos sirve para probar y para reuniones pequeñas. Una
  asamblea con decenas de cámaras pide una VM propia (ADR-0016, alternativas).
