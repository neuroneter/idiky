# apps/bloky-api — la API de BLOKY

El backend del sistema de las copropiedades ([ADR-0008](../../docs/adr/0008-backend-de-bloky.md)).
Node 22 + TypeScript + Fastify, con PostgreSQL. **Lee la identidad en BOB y no la escribe.**

| | |
|---|---|
| **Qué hace hoy** | El ingreso a BLOKY (CU-B-01): identificar a la persona en BOB, código por SMS al celular registrado, o Google/Microsoft con el correo registrado, y la sesión |
| **Datos propios** | `sesion`, `intento_ingreso`, `estado_oauth` (migraciones en `src/datos/migraciones/`) |
| **Reglas** | `src/dominio/reglas.ts`, RN-160 a RN-166, definidas en `docs/05-modelo-de-datos.md` |
| **Puerto** | 3000 dentro del pod; hacia afuera lo publica el nginx del pod en `8083` bajo `/api/` |

## Correr en tu máquina

```bash
cd apps/bloky-api
npm install
BOB_URL=http://127.0.0.1:1337 BOB_API_TOKEN=<token de solo lectura de BOB> npm run dev
```

Sin más variables corre en **modo desarrollo**: las sesiones viven en memoria y el código por
SMS **se simula** (aparece en la respuesta de `enviar-codigo` y en el registro). Para hablar
con un BOB de verdad hace falta un **token de API de solo lectura** creado en el panel de BOB
(Configuración → API Tokens → tipo *Read-only*).

`npm run probar` recorre el caso de uso completo contra un BOB de mentira, sin red.

## Variables

| Variable | Para qué |
|---|---|
| `BLOKY_ENTORNO` | `desarrollo` (por defecto) o `produccion`. En producción nada se simula |
| `BOB_URL`, `BOB_API_TOKEN` | Dónde está BOB y el token de solo lectura |
| `BLOKY_DB_URL` | `postgres://…`; sin ella, memoria (solo desarrollo) |
| `BLOKY_JWT_SECRET` | Firma de la cookie de sesión |
| `BLOKY_URL_PUBLICA` | Con la que la persona llega a BLOKY. Define la cookie y el retorno de Google/Microsoft |
| `BLOKY_HORAS_SESION` | Vigencia de la sesión (12 por defecto, RN-165) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_VERIFY_SERVICE_SID` y `TWILIO_AUTH_TOKEN` o `TWILIO_API_KEY_SID` + `TWILIO_API_KEY_SECRET` | Códigos por SMS |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Entrar con Google. Cómo obtenerlos: [`infra/bloky/credenciales-google-microsoft.md`](../../infra/bloky/credenciales-google-microsoft.md) |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Entrar con Microsoft |
| `YAHOO_CLIENT_ID`, `YAHOO_CLIENT_SECRET` | Entrar con Yahoo (solo con dominio HTTPS: Yahoo no acepta `localhost`) |

## Rutas

| Ruta | Qué hace |
|---|---|
| `POST /api/acceso/identificar` | `{tipoDocumento, numeroDocumento}` → nombre, canales disponibles (con pista) y copropiedades |
| `POST /api/acceso/enviar-codigo` | Manda el código al celular de BOB |
| `POST /api/acceso/verificar-codigo` | `{…, codigo}` → abre la sesión (cookie `bloky_sesion`) |
| `GET /api/acceso/google?tipo=CC&documento=…` | Redirige a Google; `…/microsoft` y `…/yahoo` igual |
| `GET /api/acceso/<proveedor>/retorno` | Vuelve del proveedor, compara el correo con BOB y abre la sesión |
| `GET /api/sesion` | La sesión viva, o 401 |
| `POST /api/salir` | Revoca la sesión y borra la cookie |
| `GET /api/salud` | Estado y canales configurados |
