# Entrar a BLOKY con Google o Microsoft — cómo registrar las aplicaciones

Guía para el responsable de integración. Es un trámite de una vez en dos consolas: la de Google
Cloud y la de Microsoft Entra. Al final salen **cuatro valores**, que se guardan en el archivo de
secretos del servidor y nunca en el repositorio.

El código ya está construido (CU-B-01, ADR-0008): la puerta muestra los botones «Entrar con
Google» y «Entrar con Microsoft» **sola**, en cuanto la API arranca con estos valores. BLOKY no
crea cuentas con ellos: solo pide al proveedor que confirme **qué correo** tiene la persona y lo
compara con el registrado en BOB (RN-164).

## 0. Antes de empezar: las direcciones de retorno

Cuando la persona termina de entrar en Google o Microsoft, el proveedor la devuelve a BLOKY en
una dirección fija que hay que registrar **exactamente igual** en las dos consolas. Se forma con
`BLOKY_URL_PUBLICA` + `/api/acceso/<proveedor>/retorno`:

| Dónde | `BLOKY_URL_PUBLICA` | Retorno de Google | Retorno de Microsoft |
|---|---|---|---|
| En tu máquina (`npm run dev`) | `http://localhost:5173` | `http://localhost:5173/api/acceso/google/retorno` | `http://localhost:5173/api/acceso/microsoft/retorno` |
| Entorno de desarrollo | `https://bloky-dev.idiky.com` *(propuesto)* | `https://bloky-dev.idiky.com/api/acceso/google/retorno` | `https://bloky-dev.idiky.com/api/acceso/microsoft/retorno` |

**Los dos proveedores exigen `https://`**, salvo para `localhost`. Por eso en el servidor no
sirve `http://20.55.251.120:8083`: hasta que BLOKY Dev tenga dominio con certificado, Google y
Microsoft **solo funcionan en tu máquina**. Registra las dos filas desde ya: la de `localhost`
para probar hoy, la del dominio para cuando exista. Si el nombre cambia, se edita en las consolas
y listo.

## 1. Google

1. Entra a <https://console.cloud.google.com/> con la cuenta de Google Workspace de IDIKY.
2. **Crear un proyecto** (arriba a la izquierda, el selector de proyectos → «Proyecto nuevo»):
   nombre `IDIKY`, sin organización si no aparece ninguna. Espera a que quede seleccionado.
3. Menú ☰ → **APIs y servicios → Pantalla de consentimiento de OAuth** (en consolas nuevas se
   llama **Google Auth Platform → Branding**):
   - Nombre de la aplicación: `BLOKY`. Correo de asistencia: el de operaciones de IDIKY.
   - Público (*Audience*): **Externo**. Deja la aplicación en estado **«En pruebas»**: así solo
     entran los correos que agregues como *test users*, que es lo que queremos en desarrollo.
     Agrega ahí tu correo y los de las personas de prueba.
   - Datos de contacto del desarrollador: tu correo. Guarda.
4. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**. Nombre: `BLOKY Dev`.
   - **Orígenes autorizados de JavaScript:** déjalo vacío (no hace falta).
   - **URI de redireccionamiento autorizados:** agrega las **dos** direcciones de retorno de
     Google de la tabla de arriba, una por línea, sin barra final.
   - Crear. Aparece una ventana con el **ID de cliente** (termina en
     `.apps.googleusercontent.com`) y el **Secreto del cliente**. Cópialos: el secreto se muestra
     una sola vez.
5. No hace falta habilitar ninguna API adicional: el ingreso usa OpenID Connect, que viene
   incluido.

Resultado: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

## 2. Microsoft (sirve para Hotmail, Outlook.com y cuentas de empresa)

1. Entra a <https://entra.microsoft.com/> (o <https://portal.azure.com/> → *Microsoft Entra
   ID*) con una cuenta de Microsoft de IDIKY. Vale una cuenta personal si IDIKY no tiene
   inquilino propio; lo que importa es quién administra el registro.
2. **Identidad → Aplicaciones → Registros de aplicaciones → Nuevo registro**:
   - Nombre: `BLOKY`.
   - **Tipos de cuenta admitidos:** elige **«Cuentas en cualquier directorio organizativo y
     cuentas personales de Microsoft (Skype, Xbox, Outlook.com)»**. Es la única opción con la
     que entra alguien con Hotmail u Outlook.com. Si se elige otra, esas personas ven un error de
     Microsoft y no de BLOKY.
   - **URI de redirección:** plataforma **Web**, y pega la dirección de retorno de Microsoft para
     `localhost`. Registrar.
3. En la aplicación recién creada, **Autenticación → Web → Agregar URI** y agrega la del dominio.
   Guarda. Más abajo, en «Configuración avanzada», deja marcado solo lo que ya viene; no hace
   falta activar tokens implícitos.
4. **Certificados y secretos → Secretos de cliente → Nuevo secreto de cliente**: descripción
   `BLOKY Dev`, vigencia 24 meses. Copia la columna **Valor** (no el «Id. de secreto»): se muestra
   una sola vez. Anota la fecha de vencimiento en el tablero para renovarlo a tiempo.
5. **Permisos de API**: deben estar `openid`, `email` y `profile` de Microsoft Graph (`User.Read`
   suele venir por defecto y no estorba). Si faltan, «Agregar un permiso → Microsoft Graph →
   Permisos delegados» y márcalos.
6. En **Información general** copia el **Id. de aplicación (cliente)**.

Resultado: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` y `MICROSOFT_TENANT_ID=common`
(`common` es lo que permite cuentas personales y de cualquier organización; no uses el id del
inquilino de IDIKY, o Hotmail deja de entrar).

## 3. Dónde van los valores

**Nunca en el repositorio ni en un chat de grupo.** Se pasan por un canal privado y se escriben:

- **En el servidor**, en `~/.config/idiky/secretos/bloky-api.env` (permisos 600), como líneas
  `GOOGLE_CLIENT_ID=…`, `GOOGLE_CLIENT_SECRET=…`, `MICROSOFT_CLIENT_ID=…`,
  `MICROSOFT_CLIENT_SECRET=…`, `MICROSOFT_TENANT_ID=common`. Ahí mismo `BLOKY_URL_PUBLICA` tiene
  que ser la dirección `https://` del dominio. Luego se reinicia el pod
  (`infra/desplegar.sh origin/main bloky` vuelve a levantarlo con el archivo nuevo).
- **En tu máquina**, en `apps/bloky-api/.env` (está en `.gitignore`), con
  `BLOKY_URL_PUBLICA=http://localhost:5173`.

## 4. Cómo se comprueba

1. Arranca la API y la app en local (README de `apps/bloky-api`), escribe la cédula de una
   persona de prueba **que tenga correo en BOB** y mira la pantalla «¿Cómo quieres confirmar que
   eres tú?»: además de «Código por SMS» deben aparecer «Entrar con Google» y «Entrar con
   Microsoft», con la pista `o•••@gmail.com`.
2. Toca uno. El navegador va al proveedor, eliges la cuenta y vuelves a BLOKY:
   - Si el correo de esa cuenta **es** el registrado en BOB, quedas dentro.
   - Si no, vuelves a la puerta con «La cuenta con la que entraste no es el correo registrado en
     IDIKY» (flujo A4 de CU-B-01). BLOKY no dice cuál es el correo correcto.
3. **Errores típicos**
   - *redirect_uri_mismatch* (Google) o *AADSTS50011* (Microsoft): la dirección de retorno no
     está registrada exactamente igual. Revisa `http` vs `https`, el puerto y la barra final.
   - *Access blocked: BLOKY has not completed the Google verification process*: la app está «En
     pruebas» y el correo no está en la lista de *test users*. Agrégalo.
   - *AADSTS700016 / unauthorized_client* con Hotmail: el registro no admite cuentas personales.
     Vuelve al paso 2 y cambia el tipo de cuenta.
   - En el servidor no aparecen los botones: la API no encontró las variables. Revisa el archivo
     de secretos y que el pod se haya reiniciado después de editarlo.
