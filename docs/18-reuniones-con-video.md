# 18 — Reuniones con video: cómo se entra con el pase (BLOKY, ALICE y Jitsi)

> **Para quién:** Justo, que conecta ALICE a las reuniones el 2026-11-05, y cualquiera que toque
> Jitsi o el middleware. Recoge lo hecho el 2026-11-03 y el 2026-11-04 (T-106, primera entrega).
> **Las reglas mandan:** [ADR-0030](./adr/0030-autorizacion-de-las-reuniones-con-video.md),
> RN-302 a RN-317 en [`05-modelo-de-datos.md`](./05-modelo-de-datos.md) y
> [CU-B-15](./casos-de-uso/bloky.md#cu-b-15). Esto explica cómo encaja cada pieza.

## 1. Cómo funciona, en una frase

**Nadie entra a una sala sin un pase que firma el middleware de IDIKY.** La app (BLOKY o ALICE) pide
el pase con la sesión de la persona; el middleware decide si entra y si modera, y firma con su llave
**privada**; Jitsi solo tiene la **pública** y deja entrar a quien trae un pase válido para esa sala.

```
ALICE / BLOKY ──(sesión)──▶ middleware: POST /api/c/:id/reuniones/:rid/entrar
                               │  ¿tiene derecho? ¿ya se puede entrar? ¿modera?
                               ▼
                           pase firmado (JWT RS256, kid idiky-reuniones-1, dura 10 min)
                               │
ALICE / BLOKY ──(pase)────▶ Jitsi (jitsi-dev.idiky.com)
                               │  pide la llave pública al middleware por el kid (una vez, la guarda)
                               ▼
                           entra; modera solo si el pase dice moderator: true
```

## 2. Estado al 2026-11-04 (probado)

| Pieza | Estado | Dónde |
|---|---|---|
| El middleware firma pases | ✅ En BLOKY Dev | `Bloky-Idiky`, `apps/bloky-api/src/reuniones/` (`pase.ts`, `rutas.ts`) |
| La llave pública para Jitsi | ✅ `https://bloky-dev.idiky.com/api/jitsi/llaves/<sha256 de idiky-reuniones-1>.pem` | Misma API, sin sesión |
| Jitsi en modo de pases | ✅ Desplegado | `Jitsi-Streaming-Idiky`, `infra/jitsi/comun.env` (`main` y `develop`) |
| BLOKY manda el pase | ✅ `BLOKY_JITSI_ACEPTA_PASES=si` en el servidor | `~/.config/idiky/secretos/bloky-api.env` |
| «Entrar» en BLOKY | ✅ Daniel y Justo entraron a una reunión real de «Pruebas IDIKY» | `apps/bloky/src/features/reuniones/` |
| ALICE | ⏳ Rama de Justo `feature/T-106-preparar-reuniones-video` en `App-Idiky` (ver §5) | |

**Probado con pases reales** firmados por el middleware: pase de anfitrión → entra como
**moderador**; pase de participante → entra como **participante**; sin pase → Jitsi pide usuario y
contraseña y no entra (ya no hay cuentas).

## 3. El pase

**Pedirlo:** `POST /api/c/:copropiedadId/reuniones/:reunionId/entrar`, sin cuerpo, con la sesión de
la persona (cookie `bloky_sesion`, ver §5.2).

**Respuesta 200:**

```json
{
  "enlace": "https://jitsi-dev.idiky.com/idiky-<20 letras>?jwt=<pase>",
  "rol": "anfitrion | suplente | secretario | participante",
  "modera": true,
  "conPase": true,
  "venceEn": "2026-11-04T19:10:00.000Z",
  "estado": "programada | abierta"
}
```

- `enlace` ya trae todo: el servidor (`https://jitsi-dev.idiky.com`), la sala (el camino, sin la
  barra) y el pase (el parámetro `jwt`). `conPase: false` significa que el middleware no está
  mandando pase (`BLOKY_JITSI_ACEPTA_PASES=no`): con Jitsi en modo de pases, ese enlace no entra.
- **Errores:** `401` sin sesión · `403` sin derecho o todavía temprano (el `mensaje` dice cuál) ·
  `404` no existe · `409` el cliente no está listo en BLOKY · `503` Jitsi no configurado. Todos traen
  `{ error, mensaje }`; `mensaje` está en español y se le puede mostrar a la persona.

**Quién entra y quién modera** (RN-302 a RN-314):

| Persona | Entra | Modera |
|---|---|---|
| Anfitrión | Sí | Sí |
| Suplente | Sí | Solo si abrió la reunión o pulsó «Asumir» |
| Secretario | Sí | Sí |
| Propietario, Administrador o Delegado de la copropiedad | Sí, por derecho | No |
| Cualquier otro | No (`403`): las invitaciones llegan con T-109 | — |

- **Desde cuándo:** 30 minutos antes de la hora; una cancelada o cerrada no entra (RN-312).
- **Dura 10 minutos.** Solo hace falta vigente **al entrar**; si la persona sale y vuelve después,
  la app pide otro pase. No se guarda en disco.

**Lo que lleva adentro** (por si hace falta leerlo; la app **no** lo arma ni lo cambia):

```json
{ "iss": "idiky-middleware", "aud": "jitsi", "sub": "jitsi-dev.idiky.com", "room": "idiky-…",
  "nbf": 0, "exp": 0,
  "context": { "user": { "id": "<personaId>", "name": "<nombre>", "moderator": true },
               "idiky": { "copropiedad": "<id>", "reunion": "<id>", "rol": "anfitrion", "unidad": null, "vota": false } } }
```

## 4. Jitsi en modo de pases (`Jitsi-Streaming-Idiky`, `infra/jitsi/comun.env`)

| Variable | Valor | Por qué |
|---|---|---|
| `AUTH_TYPE` | `jwt` | Se entra con pase, no con cuentas |
| `ENABLE_GUESTS` | `0` | Nadie entra sin pase |
| `JWT_APP_ID`, `JWT_ACCEPTED_ISSUERS` | `idiky-middleware` | El `iss` del pase |
| `JWT_ACCEPTED_AUDIENCES` | `jitsi` | El `aud` del pase |
| `JWT_ASAP_KEYSERVER` | `https://bloky-dev.idiky.com/api/jitsi/llaves` | Jitsi pide ahí `<sha256 del kid>.pem` |
| `JWT_ALLOW_EMPTY` | `0` | Un pase vacío no sirve |
| `XMPP_MUC_MODULES` | `token_affiliation` | Modera quien el pase marca con `moderator: true` |
| `ENABLE_AUTO_OWNER` | `false` | Jicofo no le da el moderador al primero que llega |
| `JICOFO_ENABLE_AUTH` | `0` | **Trampa:** con autenticación, jicofo hace moderador a **todo** el que trae pase. Prosody sigue exigiendo el pase |

**Se despliega** como siempre (`infra/desplegar.sh origin/main jitsi`, desde `idiky`). Para mirar lo
que Jitsi generó: `/config/conf.d/jitsi-meet.cfg.lua` en `idiky-jitsi-prosody` y `/config/jicofo.conf`
en `idiky-jitsi-jicofo`.

**Probar sin app ni sesión** (en el servidor, como `idiky`): el contenedor de la API puede firmar un
pase de prueba con la misma llave. Cambia `room`, `name` y `moderator`; el pase solo vale para esa
sala y por 15 minutos.

```bash
podman exec -w /app idiky-bloky-api node --input-type=module -e '
import { crearFirmadorDePases } from "./dist/reuniones/pase.js";
const f = crearFirmadorDePases(Buffer.from(process.env.BLOKY_JITSI_LLAVE, "base64").toString("utf8"), process.env.BLOKY_JITSI_KID || "idiky-reuniones-1");
const t = Math.floor(Date.now()/1000);
console.log(await f.firmar({ iss:"idiky-middleware", aud:"jitsi", sub:"jitsi-dev.idiky.com", room:"idiky-prueba", nbf:t-60, exp:t+900,
  context:{ user:{ id:"prueba", name:"Prueba", moderator:true }, idiky:{ copropiedad:"prueba", reunion:"prueba", rol:"anfitrion", unidad:null, vota:false } } }));'
```

Se abre `https://jitsi-dev.idiky.com/idiky-prueba?jwt=<pase>`. La llave privada nunca sale del
contenedor ni se imprime.

## 5. ALICE: lo que hay que ajustar mañana

La rama `feature/T-106-preparar-reuniones-video` de `App-Idiky` ya trae el cliente, el SDK
(`jitsi_meet_flutter_sdk`) y un contrato propuesto (`docs/reuniones-video.md`). **El contrato real
quedó distinto en tres cosas:**

| En la rama de ALICE | Lo que hay en el middleware | Qué hacer en ALICE |
|---|---|---|
| `POST …/reuniones/:rid/pase` | `POST …/reuniones/:rid/entrar` | Cambiar el camino |
| `{ servidor, sala, token, rol }` | `{ enlace, rol, modera, conPase, venceEn, estado }` | Sacar `servidor`, `sala` y `token` del `enlace` (§5.1) |
| `rol`: `anfitrion \| invitado` | `anfitrion \| suplente \| secretario \| participante` | Ampliar el tipo; `invitado` llega con T-109 |

Si prefieres que el middleware devuelva también `servidor`, `sala` y `token` por separado, se agrega
sin romper BLOKY: pídeselo a Daniel.

### 5.1 Del enlace al SDK

```dart
final uri = Uri.parse(respuesta['enlace'] as String);
final servidor = '${uri.scheme}://${uri.host}';          // https://jitsi-dev.idiky.com
final sala = uri.pathSegments.first;                     // idiky-xxxxxxxxxxxxxxxxxxxx (tal cual, en minúsculas)
final token = uri.queryParameters['jwt'];                // null si conPase es false
await JitsiMeet().join(JitsiMeetConferenceOptions(serverURL: servidor, room: sala, token: token));
```

- **La sala va exacta:** el pase solo vale para esa `room`. Otra sala, o la misma con otro nombre,
  da «Authentication failed».
- **Sin `token`, no entra:** si `conPase` es `false`, no abras Jitsi; muestra que las reuniones no
  están disponibles todavía.
- El nombre lo pone el pase (`context.user.name`); la app no necesita pedirlo.

### 5.2 La sesión ante el middleware (lo que falta decidir)

Hoy el middleware solo reconoce la cookie **`bloky_sesion`** (httpOnly, `Secure`, 12 h), que pone al
ingresar:

1. `POST /api/acceso/identificar` `{ tipoDocumento, numeroDocumento }` → nombre y canales.
2. `POST /api/acceso/enviar-codigo` (mismo cuerpo) → el SMS con el código.
3. `POST /api/acceso/verificar-codigo` `{ tipoDocumento, numeroDocumento, codigo }` → `Set-Cookie: bloky_sesion=…`.

En Flutter, el cliente HTTP guarda esa cookie y la reenvía (`cookie: bloky_sesion=…`) en
`/entrar`. **No hay bearer**: el `MIDDLEWARE_BEARER` de laboratorio de la rama no lo entiende el
middleware. **Siempre por `https://bloky-dev.idiky.com`**, no por la IP: la cookie es `Secure`.

**Lo abierto:** el ingreso de hoy es el de BLOKY (Administrador, Delegado y los perfiles que ellos
crean). **Cómo entran los propietarios y residentes desde ALICE** es T-87 y el aviso 4: mientras no
se decida, prueba con tu propia persona, que ya entra a «Pruebas IDIKY» y es suplente de la reunión de
prueba. **No construyas otro mecanismo de sesión sin hablarlo con Daniel.**

**Ojo con Twilio:** la cuenta está en prueba y solo manda SMS a **números verificados** (Phone
Numbers → Manage → Verified Caller IDs). Si tu celular no está ahí, no te llega el código.

### 5.3 Cómo probar de punta a punta

1. En BLOKY (`https://bloky-dev.idiky.com`), «Pruebas IDIKY» → Reuniones: programa una para dentro de
   menos de 30 minutos, contigo como anfitrión o suplente (se edita mientras nadie la abra, RN-317).
2. En ALICE: ingresa (§5.2), pide `/entrar` y abre la sala con el SDK. Esperado: `rol` y `modera`
   como en la tabla de §3, y Jitsi te muestra como moderador solo si `modera` es `true`.
3. Al mismo tiempo, alguien entra desde BLOKY con «Entrar»: los dos deben verse en la misma sala.

## 6. Lo que falta (aviso 3 de Justo y CU-B-15)

- **La sala espera al anfitrión:** hoy quien llega primero con pase entra a la sala vacía. El módulo
  `muc_wait_for_host` de esta versión no sirve tal cual: trata como anfitrión a cualquiera con pase.
- **Cámara y micrófono por permiso del secretario.**
- **Jitsi le avisa al middleware quién entra y sale** (la asistencia y el quórum).
- **Invitaciones y «Enviarme el enlace al correo»** (T-109).
- **El voto por unidad** (`vota`, `unidad`) cuando existan unidades y propietarios (CU-B-06, CU-B-07).

## 7. Si algo falla

| Síntoma | Causa | Qué hacer |
|---|---|---|
| Jitsi pide usuario y contraseña | Se entró sin pase (enlace viejo o `conPase: false`) | Entrar desde BLOKY/ALICE con «Entrar» |
| «Authentication failed» | Pase vencido, de otra sala, o Jitsi no alcanza la llave pública | Pedir otro pase; probar que la llave responde (`curl …/api/jitsi/llaves/<sha256>.pem`) |
| «Waiting for a moderator… Log-in» | Jitsi volvió a cuentas internas (se desplegó una versión vieja) | Revisar `AUTH_TYPE` en `infra/jitsi/comun.env` de lo desplegado |
| Un participante sale como moderador | Jicofo con autenticación | `JICOFO_ENABLE_AUTH=0` |
| `403 Todavía es temprano` | Faltan más de 30 minutos | Esperar o editar la hora (RN-317) |
| «IDIKY todavía está preparando tu copropiedad» | El cliente de BOB no se aprovisionó en BLOKY | Botón «Aprovisionar en BLOKY» en BOB |
