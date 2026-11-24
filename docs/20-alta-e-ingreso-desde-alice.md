# 20 — El alta y el ingreso desde ALICE (contrato de la API del middleware)

> **Para quién:** Justo (ALICE) y quien construya el lado del middleware.
> **Decisión:** [ADR-0032](./adr/0032-residentes-colaboradores-e-ingreso-de-alice.md) · reglas RN-318 a RN-327 · tareas
> T-120 a T-129.
> **Estado (2026-11-05):** **§1 a §5 construidos y desplegados en BLOKY Dev** (`a2e7311.bloky-015ee35`). Falta el §6 (el
> token en las reuniones) y cerrar sesiones desde BLOKY (T-128). Si algo de aquí cambia, se corrige este documento y se
> avisa en [`avisos/justo.md`](./avisos/justo.md).
>
> **Para probar en Dev (2026-11-15):** el código de ALICE va por **WhatsApp** (Evolution, T-132) cuando el
> middleware tiene `EVOLUTION_*`. La persona debe existir (BLOKY → Unidades → «Crear administrador», con ese celular).
> Twilio sigue para el ingreso de BLOKY; no se quita.
>
> **Al día el 2026-11-21 (lo que cambió para ALICE, todo en BLOKY Dev):**
> - El WhatsApp sale por la instancia oficial **`Idiky_whatsapp`** (T-131, T-132).
> - **Un celular es de una sola persona** y **nadie existe sin documento** (RN-353 a RN-356, T-142): agregar residentes e
>   invitados exige el documento (§5) y el ingreso puede responder `celular_repetido` (§1.1).
> - **Varios países** (ADR-0035, RN-358 a RN-363, T-146): catálogo público de países (§1.0); el celular va con su
>   indicativo y el documento con su país.
> - **Primer ingreso** (RN-356, T-143, **RN-192**): documento que coincida (§2) → correo con código (§2c) → datos básicos
>   (nombre + fecha de nacimiento) → billeteras (§2b). El envío de correo por SES ya funciona
>   ([`infra/correo-ses.md`](../infra/correo-ses.md)); faltan las rutas de §2c en el middleware (lista abajo).
> - **Quién vota** en las reuniones: RN-365 (§6).

Todas las rutas son del **middleware de IDIKY** (BLOKY Dev: `https://bloky-dev.idiky.com`). ALICE no habla con BOB ni con
ninguna base.

---

## 0. Identidad y datos que se capturan (Justo, 2026-11-22; alinea RN-353, RN-354, RN-356)

### Identidad (no se repite)

| Dato | Regla | Por qué |
|---|---|---|
| **Celular** | **Una sola persona** en todo IDIKY (RN-353) | Es el canal del código (WhatsApp) y ancla la sesión |
| **Documento** (país + tipo + número) | **Una sola persona** (RN-354, ADR-0035) | Identifica a la persona; de aquí sale el `hashIdentidad` de las billeteras (RN-298) |

**No** puede haber dos usuarios con el mismo celular, ni dos con el mismo documento. Si se reutilizaran, la passkey del
teléfono y las billeteras en cadena quedarían atadas a la persona equivocada (claves / cuentas repetidas). Eso **es** la
identidad de la persona en IDIKY y en la cadena.

### Datos a capturar (primer ingreso / perfil)

| Campo | Quién lo pone | Notas |
|---|---|---|
| **Tipo de documento** | Administración al crear; la persona **confirma** en el primer ingreso | Obligatorio; catálogo por país (§1.0) |
| **Número de documento** | Igual | Obligatorio; debe **coincidir** con el reportado (`documento_no_coincide`, §2) |
| **Nombre** | Administración; la persona puede completar/ajustar en datos básicos | Obligatorio |
| **Celular** | Administración al crear | Obligatorio; único (arriba). Ingreso con código |
| **Correo electrónico** | La persona en el primer ingreso, **validado con código** (§2c) | Obligatorio para terminar el primer ingreso (RN-356) |
| **Fecha de nacimiento** | La persona en datos básicos | **Aprobada** (Justo + Daniel, 2026-11-22, acuerdo telefónico; **RN-192**). Campo `fecha_nacimiento` (`YYYY-MM-DD`) en el directorio. Obligatoria al cerrar el primer ingreso (T-143) |

Con **tipo + número de documento** (y el secreto de IDIKY) el middleware ya puede calcular `hashIdentidad` y ALICE puede
**crear las billeteras** (§2b) tras la passkey. Nombre, correo y fecha de nacimiento son del perfil; el correo además es
segundo factor (RN-357).

---

## 1. Ingresar

### 1.0 El catálogo de países (antes de ingresar)

`GET /api/app/catalogo-paises` — **público, sin token** (no tiene datos de personas). Lo arma BOB (ADR-0035); el middleware
lo guarda 10 minutos y, si BOB no responde, usa el último que tuvo (o Colombia).

```json
{ "paisPorDefecto": "CO",
  "paises": [{ "codigo": "CO", "nombre": "Colombia", "indicativo": "+57",
    "celularLongitudMinima": 10, "celularLongitudMaxima": 10, "celularEmpiezaCon": ["3"], "celularEjemplo": "3001234567",
    "tipos": [{ "codigo": "CC", "nombre": "Cédula de ciudadanía", "soloNumeros": true, "longitudMinima": 5,
      "longitudMaxima": 10, "patron": null, "ejemplo": "1020304050", "esPasaporte": false, "orden": 1 }, …] }, …] }
```

- Hoy hay **11 países**: CO, VE, EC, PE, MX, AR, CL, ES, US, PA, BR; cada uno con su pasaporte.
- **En la pantalla de ingreso:** selector de país con 🇨🇴 **+57 por defecto**; valida con la regla del país (longitud, con
  qué empieza) y muestra el ejemplo. El 99 % de las personas no cambia nada (RN-360).
- Dentro de la app, `GET /api/app/c/:copropiedadId/catalogo-identidad` (con token) → `{ pais, paises }`: `pais` es el de la
  copropiedad, el que va por defecto en los formularios de §5.

### 1.1 Pedir el código

`POST /api/app/acceso/enviar-codigo`

```json
{ "celular": "3001234567" }
```
o, cuando la persona ya completó su documento:
```json
{ "tipoDocumento": "CC", "numeroDocumento": "52100200" }
```

- El celular va **completo con su indicativo** (`"+525512345678"`). Por compatibilidad, un celular colombiano de 10 dígitos
  que empieza por 3 se acepta sin `+57`.
- Busca a la persona por su celular registrado o por su documento. El código va **siempre al celular registrado** (RN-163).
- En Dev con Evolution, el canal es **WhatsApp** (`canal: "whatsapp"` en la respuesta); si no hay Evolution, SMS/simulado.
- Responde `200 { "pista": "••• •• 4567", "canal": "whatsapp" }` (y `codigoSimulado` solo si el enviador lo expone fuera de producción).
- `404 no_existe` si no hay nadie con ese dato; `403 sin_acceso` si existe pero no tiene nada vigente para ALICE (RN-327);
  `429 bloqueado` tras cinco errores en 15 minutos (RN-166); `422 invalido` si el celular no es válido.
- **`409 celular_repetido`** si ese celular lo tienen dos personas (datos viejos; RN-353): no se escoge una en silencio. ALICE
  muestra el `mensaje` (que hable con la administración).
- `409 sin_celular` si la persona (buscada por documento) no tiene celular; `502` si el WhatsApp o el SMS no salió.

### 1.2 Validar el código

`POST /api/app/acceso/verificar-codigo`

```json
{ "celular": "3001234567", "codigo": "123456" }
```

Responde:

```json
{
  "token": "eyJ…",
  "venceEn": "2026-12-05T15:00:00Z",
  "persona": { "id": "…", "nombre": "Residente T2-502", "documentoCompleto": false, "apariencia": null },
  "lugares": [ … ]
}
```

- `token` va en **cada** llamada siguiente: `Authorization: Bearer <token>`. Dura 30 días; antes de que venza, ALICE pide otro
  con `POST /api/app/sesion/renovar` (§3). Es solo de ALICE: no abre BLOKY, y la cookie de BLOKY no abre ALICE.
- `persona` trae también `hashIdentidad` y las dos billeteras (vacías hasta crearlas), para el alta en la cadena (T-129).
- `documentoCompleto: false` → ALICE pide el documento antes de seguir (§2).
- `lugares` es el listado de RN-326 (§4). `permisosVersion` dice qué versión de la matriz de permisos aplica (§4b).
- `401 codigo_incorrecto` si el código no es o ya venció; `403 sin_acceso` si ya no tiene nada vigente.
- Al validar el código por primera vez, el middleware marca el **primer ingreso** de la persona (RN-364): desde ahí la
  Administración ya no puede corregir su nombre, celular ni documento desde BLOKY.

## 2. Completar el documento (primer ingreso)

`POST /api/app/yo/documento` (con el token)

```json
{ "tipoDocumento": "CC", "numeroDocumento": "52100200", "nombre": "Sandra Ortiz" }
```

- Si el documento **no existe** en el directorio: se le pone a esta persona y se calcula su `hash_identidad` (RN-298).
- Si **ya existe** (la persona está en otra copropiedad): **se unen** (RN-322). La respuesta trae la persona resultante y
  un **token nuevo** (el anterior queda cerrado).
- **RN-356 — Si la Administración ya reportó el documento** (hoy es obligatorio al crear a alguien), el que escribe la
  persona **tiene que coincidir** (tipo y número): si no, **`409 documento_no_coincide`** y no entra. Así se sabe que es la
  persona invitada. Si coincide, responde como `GET /api/app/yo`.
- Responde `200 { persona, lugares, token? }`. `409 documento_de_otra_persona` si ese documento ya tiene otro celular y no
  se pudo confirmar que es la misma persona (en ese caso, la Administración lo resuelve).
- Después, ALICE crea las billeteras con la passkey por las rutas de §2b (T-129, opción A2 de docs/19: el middleware
  proxifica a BOB; la app **no** habla con BOB ni usa `ALTA_QR_JWT`).

## 2b. Alta de billeteras (primer ingreso, T-129)

Con el Bearer de ALICE. Si `persona` ya trae las dos billeteras, se salta.

`POST /api/app/cadena/alta`

- Abre la operación de alta en la cadena (detrás: plugin de BOB con token de servicio).
- Responde `201 { id, challenge, venceEn, estado, tipo }`.
- `422 sin_documento` si aún no hay documento/`hashIdentidad`. `409 ya_tiene_billeteras` si ya existen.

`POST /api/app/cadena/alta/:id/firma`

```json
{
  "telefonoX": "0x…", "telefonoY": "0x…", "tipoAutenticador": "dispositivo",
  "firma": { "r": "…", "s": "…", "challengeIndex": 0, "typeIndex": 0, "authenticatorData": "…", "clientDataJSON": "…" }
}
```

- El teléfono firma el `challenge` con la passkey (RP ID hoy: `bob-dev.idiky.com`).
- Responde `200 { operacion, persona, billeteraTransaccional, billeteraFinanciera, cuentaDia, cuentaFinanciera }`.
- Tras esto, ALICE entra a la app. No hay botón de QR en el ingreso.

**Secreto de servicio (middleware → BOB):** `IDIKY_CADENA_PROXY_TOKEN` en el pod de BOB = el mismo valor que
`BOB_API_TOKEN` en el pod del middleware. `infra/servidor/levantar.sh` lo inyecta al crear BOB (lee
`bloky-api.env`); también se puede fijar a mano con `infra/gestion/conectar-cadena-proxy.sh` (repo `BOB-Idiky`).
Rutas BOB: `/api/cuentas-polygon/servicio/alta` y `…/firma` (`auth: false` + Bearer de servicio).

## 2c. Correo con código y datos básicos (primer ingreso) — T-143 · contrato (2026-11-22)

**Decidido (RN-356, RN-357, RN-192):** el primer ingreso es:

1. Código al **celular** (§1)
2. **Documento** que coincida (§2) → queda `hashIdentidad`
3. **Correo**, validado con un código a ese correo (esta sección)
4. **Datos básicos**: nombre (ajustable) + **fecha de nacimiento** (RN-192)
5. **Billeteras** con passkey (§2b)

Solo entonces entra a la app. Las veces siguientes, solo el código del celular. Cambiar celular o correo: RN-357 (segundo
factor; rutas de cambio **después** del primer ingreso). Después: huella y facial.

**Lo que ya está:** Amazon SES desde `no-responder@idiky.com` ([ADR-0036](./adr/0036-correo-con-amazon-ses.md),
[`infra/correo-ses.md`](../infra/correo-ses.md)). En *sandbox* solo llegan a correos verificados (hoy Daniel y Justo).

### Campos en `persona` (respuestas de `/yo`, verificar-código, documento, etc.)

| Campo JSON | Tipo | Notas |
|---|---|---|
| `documentoCompleto` | boolean | Ya existe (§2) |
| `correo` | string \| null | Correo guardado; si aún no está validado puede ir la pista o null |
| `correoValidado` | boolean | `true` solo tras verificar el código del correo |
| `fechaNacimiento` | string \| null | `YYYY-MM-DD`; null si aún no la dio |

ALICE no deja pasar del paso correspondiente mientras el flag falle. Si el middleware **aún no publica**
`correoValidado` / `fechaNacimiento`, ALICE no bloquea a quien ya tiene billeteras (compatibilidad); en cuanto existan
los campos, manda.

### `POST /api/app/yo/correo/enviar-codigo` (Bearer)

```json
{ "correo": "justo@ejemplo.com" }
```

- Valida formato. Normaliza a minúsculas.
- Si ese correo ya está **validado en otra persona** → `409 correo_de_otra`.
- Guarda el correo como *pendiente de validar* en esta persona (o solo en el reto, a criterio de implementación) y **envía
  el código por SES** (mismo estilo que el código de celular: pocos dígitos, vencimiento corto, límite de intentos).
- Responde `200 { "pista": "jus•••@ejemplo.com", "canal": "correo", "codigoSimulado"?: "…" }` (`codigoSimulado` solo en Dev).
- Errores: `422 correo_invalido` · `429 bloqueado` · `502 correo_fallo` si SES no pudo enviar.

### `POST /api/app/yo/correo/verificar-codigo` (Bearer)

```json
{ "correo": "justo@ejemplo.com", "codigo": "123456" }
```

- Si el código es correcto: marca `correoValidado: true`, guarda `correo`, limpia el reto.
- Responde `200` con la misma forma que `/yo` (`persona`, `lugares`, `token?` si se rota).
- Errores: `401 codigo_incorrecto` / `bloqueado` · `422` si el correo no coincide con el pendiente.

### `PUT /api/app/yo/datos-basicos` (Bearer)

```json
{ "nombre": "Justo Soto", "fechaNacimiento": "1985-03-14" }
```

- Exige `correoValidado: true` (si no → `409 correo_pendiente`).
- `nombre` no vacío; `fechaNacimiento` día calendario válido `YYYY-MM-DD` (no futura; edad razonable a criterio, p. ej. no
  menor de 0 ni mayor de 120 años) → si no, `422 fecha_invalida` / `nombre_invalido`.
- Guarda `nombre` y `fecha_nacimiento` en el directorio.
- Responde `200` forma `/yo`.

### Orden que ALICE aplica tras cada respuesta

`documentoCompleto` → `correoValidado` → `fechaNacimiento` presente → billeteras (§2b) → entrar.

### Tareas del middleware (checklist T-143 — Justo + Daniel)

| # | Tarea | Repo / zona | Estado |
|---|---|---|---|
| M1 | Migración: columna `fecha_nacimiento` (`date`, nullable) en `directorio.persona` | `Bloky-Idiky` | ✅ `014-fecha-nacimiento-y-correo-validado.sql` |
| M2 | Migración / campos: `correo_validado_en` + índice único del correo validado | `Bloky-Idiky` | ✅ misma migración |
| M3 | Exponer en `/yo` (y en verificar-código / documento): `correo`, `correoValidado`, `fechaNacimiento` | `Bloky-Idiky` | ✅ |
| M4 | Reto de código por correo (generar, guardar ~10 min, intentos) | `Bloky-Idiky` | ✅ `acceso/codigos-correo.ts` |
| M5 | `POST /api/app/yo/correo/enviar-codigo` con SES | `Bloky-Idiky` | ✅ |
| M6 | `POST /api/app/yo/correo/verificar-codigo` | `Bloky-Idiky` | ✅ |
| M7 | `PUT /api/app/yo/datos-basicos` (nombre + fecha) | `Bloky-Idiky` | ✅ |
| M8 | Pruebas de humo de las tres rutas + flags en `/yo` | `Bloky-Idiky` | ✅ |
| M9 | Desplegar middleware en BLOKY Dev y probar con correos verificados en SES (Justo / Daniel) | Dev | ⬜ |
| M10 | (Después del primer ingreso) rutas de **cambio** de celular y de correo con 2FA (RN-357) | `Bloky-Idiky` | ⬜ |
| M11 | Acceso SES fuera de *sandbox* (producción) cuando toque | AWS / Daniel | ⬜ |

**ALICE (esta app):** flujo de pantallas del primer ingreso (pasos 3→6) y cliente HTTP de M5–M7. No construir cambio de
celular/correo (M10) hasta que existan esas rutas.

## 3. La sesión

| Ruta | Qué hace |
|---|---|
| `GET /api/app/yo` | La persona y sus `lugares` recalculados (útil al abrir la app); `persona.apariencia` puede ser `null` |
| `GET /api/app/yo/apariencia` | La apariencia guardada, o `null` si aún no la armó (CU-R-34, RN-191) |
| `PUT /api/app/yo/apariencia` | `{ "apariencia": { … } }` — valida RN-261 y guarda en el directorio (mismo campo que BLOKY) |
| `POST /api/app/sesion/renovar` | Un token nuevo con otros 30 días (el anterior queda cerrado) |
| `POST /api/app/salir` | Cierra la sesión |
| `POST /api/app/cadena/alta` | Abre el alta de billeteras (§2b) |
| `POST /api/app/cadena/alta/:id/firma` | Firma del teléfono → billeteras en el directorio |

- **Cada petición recalcula los permisos** con lo vigente: si la Administración bloquea a la persona en una unidad, esa
  unidad desaparece de `lugares` y sus rutas responden `403`, aunque el token siga vivo (RN-324, RN-325).
- `401 sin_sesion` si el token venció o se cerró: ALICE vuelve al §1.

## 4. El listado: dónde está la persona y con qué rol (RN-326)

```json
"lugares": [
  {
    "copropiedadId": "cp-123", "nombre": "Conjunto La Pradera", "api": "https://bloky-dev.idiky.com",
    "unidades": [
      { "unidadId": "…", "codigo": "T2-502", "rol": "propietario" },
      { "unidadId": "…", "codigo": "T1-101", "rol": "invitado", "desde": "2026-11-10", "hasta": "2026-11-20" }
    ],
    "colaborador": null,
    "administracion": null
  },
  {
    "copropiedadId": "cp-456", "nombre": "Edificio Torres del Parque", "api": "https://bloky-dev.idiky.com",
    "unidades": [],
    "colaborador": { "cargo": "vigilante", "espacio": "Portería y vigilancia" },
    "administracion": null
  },
  {
    "copropiedadId": "cp-789", "nombre": "Pruebas IDIKY", "api": "https://bloky-dev.idiky.com",
    "unidades": [],
    "colaborador": null,
    "administracion": { "rol": "delegado" }
  }
]
```

- Solo lo **vigente**: el invitado aparece solo entre `desde` y `hasta`; lo bloqueado o finalizado no aparece.
- `api`: la dirección del middleware que atiende esa copropiedad (ADR-0025 §4). Hoy es siempre la misma.
- `administracion`: si la persona es **Administrador o Delegado** vigente de esa copropiedad (RN-327 ampliada); puede ir
  sin `unidades` ni `colaborador`.
- ALICE muestra el listado; la persona elige **una unidad** (o su lugar de trabajo, si es colaborador, o la
  copropiedad por administración) y puede saltar a otra sin volver a pedir código.

## 4b. Los permisos: qué módulos ve y qué puede hacer en cada uno (ADR-0034, RN-334, RN-339)

> **Contrato acordado el 2026-11-21 (Daniel), antes de construir.** Lo implementa el middleware en **T-135** y ALICE lo
> consume en **T-137** (Justo). Es **aditivo**: los campos de §4 no cambian. **Ya responde en BLOKY Dev** (2026-11-21,
> `7d7b111.bloky-e15e867`); `permisosVersion` también viene al validar el código y al completar el documento.

`GET /api/app/yo` agrega a cada lugar y a cada unidad sus **roles** y sus **permisos**:

```json
{
  "persona": { "…": "…" },
  "permisosVersion": 7,
  "lugares": [
    {
      "copropiedadId": "cp-123", "nombre": "Conjunto La Pradera", "api": "https://bloky-dev.idiky.com",
      "unidades": [
        {
          "unidadId": "…", "codigo": "T2-502", "rol": "propietario",
          "roles": ["propietario"],
          "permisos": {
            "mi_unidad": ["ver", "crear", "editar", "eliminar"],
            "visitantes": ["ver", "crear", "eliminar"],
            "cartelera": ["ver"]
          }
        }
      ],
      "colaborador": { "cargo": "secretaria", "espacio": "Administración" },
      "administracion": null,
      "roles": ["secretaria"],
      "permisos": {
        "correspondencia": ["ver", "crear", "editar"],
        "cartelera": ["ver", "crear", "editar"]
      }
    }
  ]
}
```

**Cómo se leen**
- **`permisos` de una unidad**: lo que la persona puede hacer **entrando por esa unidad**. Es la **suma** de los roles de esa
  unidad y de sus roles en la copropiedad (colaborador, Administración, Consejo de administración), sin repetir (RN-339).
- **`permisos` del lugar**: lo que puede hacer **entrando sin unidad**, por su lugar de trabajo o por administración. Es la
  suma de sus roles en la copropiedad. Si no tiene ninguno, viene `{}`.
- **Un módulo que no aparece no existe para esa persona**: ALICE no lo muestra. Las acciones son `ver`, `crear`, `editar` y
  `eliminar` (**eliminar = anular o retirar**, RN-335); si hay `crear`, `editar` o `eliminar`, siempre viene `ver`.
- **Inicio y Mi cuenta** (con el avatar) no van en `permisos`: siempre están.
- **`roles`**: los identificadores del catálogo de BOB (RN-333), para mostrar («Secretaría», «Administrador de la unidad»).
  ALICE **no decide nada con los roles**, solo con `permisos`.
- **`permisosVersion`**: cambia cuando BOB cambia la matriz. ALICE vuelve a pedir `GET /api/app/yo` al abrir, al volver a
  primer plano y al renovar la sesión; si la versión cambió, rehace el menú.

**Los módulos** (identificadores fijos; los nombres para mostrar los pone ALICE)

| `modulo` | Módulo | `modulo` | Módulo |
|---|---|---|---|
| `mi_unidad` | Mi unidad y sus personas | `pqrs` | PQRS y solicitudes |
| `visitantes` | Visitantes | `cartelera` | Cartelera y comunicados |
| `correspondencia` | Correspondencia | `asambleas` | Asambleas y poderes |
| `reservas` | Reservas | `reuniones` | Reuniones con video |
| `pagos` | Pagos y estado de cuenta | `proyectos` | Proyectos |
| `paz_y_salvo` | Paz y salvo | `directorio` | Directorio |
| | | `porteria` | Portería (turno, hoy en el edificio, validar QR) |

**El middleware manda, no la app** (RN-336): aunque ALICE esconda un botón, cada ruta del módulo revisa el permiso. Sin él:

```json
HTTP 403
{ "error": "sin_permiso", "mensaje": "Tu rol no te permite hacer esto aquí.", "modulo": "visitantes", "accion": "crear" }
```

Si ALICE recibe `sin_permiso`, vuelve a pedir `GET /api/app/yo` (la matriz pudo cambiar) y rehace el menú.

**Lo legal no está aquí** (RN-337): quién vota y con qué peso no sale de `permisos`; `asambleas: ["ver"]` deja entrar al
módulo, y el voto lo decide la ley (T-127, aviso a Mary).

**Valores iniciales de la matriz para ALICE** (propuesta para T-135; Daniel los ajusta, y luego BOB en T-138). V = ver,
C = crear, E = editar, A = anular (eliminar); — = sin acceso.

| Rol | mi_unidad | visitantes | correspondencia | reservas | pagos | paz_y_salvo | pqrs | cartelera | asambleas | reuniones | proyectos | directorio | porteria |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Propietario · Arrendatario · operación completa | VCEA | VCEA | V | VCEA | VC | VC | VCE | V | V | V | V | V | — |
| Conviviente · Arrendatario · solo vivir | V | VCA | V | VCA | V | V | VC | V | V | V | V | V | — |
| Invitado | — | — | — | — | — | — | — | V | — | V | — | — | — |
| Administrador · Delegado | — | V | V | VE | — | — | VE | VCEA | V | V | VCEA | V | V |
| Presidente del consejo · Consejero | — | — | — | — | — | — | V | V | V | V | V | V | — |
| Secretaría | — | V | VCE | VE | — | — | VE | VCE | — | V | — | V | — |
| Seguridad | — | VE | VCE | — | — | — | — | V | — | — | — | V | VCE |
| Aseo | — | — | — | — | — | — | — | V | — | — | — | — | — |
| Mantenimiento | — | — | — | — | — | — | VE | V | — | — | — | — | — |
| Contador | — | — | — | — | V | V | — | — | — | — | — | — | — |
| Revisor fiscal | — | — | — | — | V | V | — | — | V | — | — | — | — |

**Los cargos de hoy se traducen así** mientras BLOKY no asigne roles (T-134): vigilante y portería → Seguridad; aseo → Aseo;
mantenimiento y jardinería → Mantenimiento; administración y secretaría → Secretaría; «otro» → sin rol. Las residencias:
`propietario` → Propietario; `arrendatario` → **su paquete** (`arrendatario_operacion` o `arrendatario_solo_vivir`);
`conviviente` → Conviviente; `invitado` → Invitado (RN-366, T-147, 2026-11-23).

## 5. La unidad: propietario, arrendatario, convivientes, invitados y mascotas (RN-321, RN-366 a RN-369)

> **Cambio de contrato del 2026-11-23 (T-147, en BLOKY Dev `bloky-31e8af6`).** Los roles en la unidad ahora son
> **`propietario` · `arrendatario` · `conviviente` · `invitado`** (RN-366). En las respuestas ya **no** sale `administrador`
> ni `residente`: las filas que existían se renombraron. Al **crear**, la API todavía acepta `rol: "administrador"` y
> `"residente"` como nombres viejos (se guardan como `propietario` y `conviviente`), mientras ALICE cambia.

Prefijo: `/api/app/c/:copropiedadId/unidades/:unidadId`

| Ruta | Qué hace |
|---|---|
| `GET …/residencias` | Quiénes están en la unidad: personas (con rol), mascotas e invitados |
| `POST …/residentes` `{ nombre, celular, paisCelular?, tipoDocumento, numeroDocumento, paisDocumento?, rol: "propietario" \| "conviviente", aceptarCelularRegistrado? }` | Agrega un conviviente (por defecto) o un copropietario. **Propietario: solo lo crea otro propietario** |
| `POST …/arrendatarios` `{ …lo mismo, desde, hasta, paquete }` | **Solo el propietario** (RN-366, RN-369). `paquete` es un rol fijo de BOB: `GET /api/app/paquetes-de-arrendatario` da la lista (`[{ id, nombre }]`, hoy «Arrendatario · operación completa» y «· solo vivir»). Fechas obligatorias, hasta 5 años |
| `POST …/invitados` `{ nombre, celular, paisCelular?, tipoDocumento, numeroDocumento, paisDocumento?, desde, hasta, aceptarCelularRegistrado? }` | Agrega un invitado con sus fechas (obligatorias) |
| `POST …/mascotas` `{ nombre, especie, foto? }` | Agrega una mascota (perfil, sin ingreso) |
| `POST …/residencias/:rid/bloquear` · `…/desbloquear` · `…/finalizar` `{ motivo }` | Gestiona a uno de su unidad. **Finalizar es en cadena** (RN-368): también se finalizan los convivientes, invitados y mascotas que esa persona creó |

- `403` si quien llama no es **administrador de esa unidad**. **Con T-135** esto lo decide la matriz (§4b): `GET` pide
  `mi_unidad: ver`; agregar, `crear`; bloquear y desbloquear, `editar`; finalizar, `eliminar`. Además, la persona tiene que
  **estar en esa unidad** (los roles de la copropiedad solos no abren una unidad ajena). Con los valores iniciales, el
  administrador de la unidad hace lo mismo que antes y **el residente ahora puede ver** quiénes están en su unidad (`ver`).
  **Construido el 2026-11-21 (T-135).**
- **Nadie se crea sin documento (RN-354, desde 2026-11-21):** `nombre`, `celular`, `tipoDocumento` y `numeroDocumento` son
  obligatorios (`422 invalido` con el `mensaje`). `paisCelular` y `paisDocumento` (código ISO) son opcionales: por defecto, el
  país de la copropiedad (RN-360); pueden ser distintos (RN-361). El tipo y el número se validan con la regla del país del
  catálogo (§1.0).
- **Revisión previa (RN-354):**
  - **`409 otro_celular`** — ese documento ya está en IDIKY con otro celular. Trae `celularRegistrado` oculto (`300•••567`)
    y el `mensaje`. ALICE pregunta «¿Aceptar el celular registrado?»: si sí, reenvía igual con `aceptarCelularRegistrado:
    true` y la persona queda con **su** celular de siempre; si no, no continúa.
  - **`409 celular_de_otra`** — ese celular ya es de otra persona (un celular, una persona: RN-353).
  - `409 ya_esta` — esa persona ya está en la unidad.
- No se puede finalizar ni bloquear al **último propietario** de la unidad (`409 sin_propietario`, RN-324); eso solo lo hace la
  Administración.
- **`403 solo_propietario`** — crear, bloquear o finalizar a un **propietario** o a un **arrendatario** es solo del propietario
  (RN-369), aunque el arrendatario con operación completa tenga `mi_unidad` completo.
- **Al vencer el arriendo** (RN-368) el arrendatario y lo que creó se finalizan solos, la próxima vez que alguien entra o lee
  la unidad; ALICE solo ve que ya no está.
- En `GET …/residencias` y en `lugares`, el arrendatario trae `desde`, `hasta` y `paquete`.
- Nada se borra: se finaliza.

## 5b. Visitantes y portería (RN-370 a RN-373, T-149)

> **En BLOKY Dev desde el 2026-11-23** (`bloky-04bee12`). El invitado entra **siempre con ALICE** (RN-367): no hay código de
> visitante sin app.

**Invitar** — `POST /api/app/c/:copropiedadId/unidades/:unidadId/invitados` `{ nombre, celular, tipoDocumento, numeroDocumento, …, desde, hasta, placa? }`.
Ahora pide **`visitantes: crear`** (antes `mi_unidad: crear`): el conviviente también puede invitar. `placa` es opcional
(`ABC123`); va en `datos.placa` de la residencia.

**El pase QR** — `GET /api/app/c/:copropiedadId/unidades/:unidadId/pase` → `{ pase, venceEn }`. Lo pide quien tiene una
residencia **vigente hoy** en esa unidad (invitado o quien vive). ALICE pinta `pase` como QR y pide otro antes de `venceEn`
(**2 minutos**). Sin invitación vigente: `403 sin_invitacion`.

**La portería** (quien tenga el módulo `porteria`: hoy, **Seguridad**; Administración solo ve). Prefijo
`/api/app/c/:copropiedadId/porteria`:

| Ruta | Permiso | Qué hace |
|---|---|---|
| `POST …/validar` `{ pase }` o `{ tipoDocumento, numeroDocumento }` | `porteria: ver` | `{ ingreso: { residenciaId, veredicto, persona: { nombre, documento: "••• 123" }, unidad: { id, codigo }, rol, desde, hasta, placa, autorizadoPor, adentro } }`; por documento, además `otras` |
| `POST …/entradas` `{ residenciaId, forma: "pie" \| "vehiculo", placa? }` | `porteria: crear` | «Entró». `409 no_vigente` (con `veredicto`) o `409 ya_adentro` |
| `POST …/entradas/:ingresoId/salida` | `porteria: editar` | «Salió». `409 no_adentro` |
| `GET …/adentro` | `porteria: ver` | «Adentro ahora»: `[{ ingresoId, nombre, unidad, rol, forma, placa, entroEn }]` |

- `veredicto`: `vigente` · `programado` (todavía no) · `vencido` (ya no) · `bloqueado` · `finalizado`. No es lo mismo «todavía
  no» que «ya no» (CU-P-02).
- QR alterado, vencido o de otra copropiedad: `422 pase_invalido` («pídele que lo abra de nuevo»).
- Sin el permiso de portería: `403 sin_permiso` con `modulo: "porteria"`.
**El turno y la minuta** (RN-234 a RN-236, T-150, BLOKY Dev `bloky-1168c09`):

| Ruta | Permiso | Qué hace |
|---|---|---|
| `GET …/turno` | `porteria: ver` | `{ abierto, anterior }`: el turno abierto y **lo que dejó el anterior** (`entrega`), para leerlo antes de abrir |
| `POST …/turno/abrir` | `porteria: crear` | Abre el turno. `409 turno_abierto` (con quién lo tiene) si ya hay uno |
| `POST …/turno/cerrar` `{ entrega? }` | `porteria: editar` | Lo cierra con la entrega para el siguiente (hasta 2000 letras). Responde cuántos quedaron `adentro` |
| `POST …/novedades` `{ texto }` | `porteria: crear` | Una novedad del portero (3 a 1000 letras) |
| `GET …/turnos?limite=` | `porteria: ver` | Los turnos, del más reciente al más viejo |
| `GET …/minuta?turno=` | `porteria: ver` | `{ turno, minuta: [{ tipo: abrio · entro · salio · novedad · cerro, hora, quien, persona?, unidad?, forma?, placa?, texto?, entrega? }] }` en orden de hora; sin `turno`, la del abierto o la del último |

- **Sin turno abierto** no se registra nada: «Entró», «Salió» y las novedades responden `409 sin_turno` («Primero abre el turno»).
- Hay **un turno abierto a la vez** por copropiedad; salir de la app no lo cierra. La Administración lee la minuta (tiene `porteria: ver`).
- Los paquetes recibidos y entregados en el turno entran a la minuta (§5c). **Todavía no:** visitante recurrente y el cierre Merkle (D7/D8).

## 5c. Correspondencia (CU-P-01, CU-R-11; RN-25, RN-52, RN-103; T-151)

> **En BLOKY Dev desde el 2026-11-23** (`bloky-a0dffb4`). Módulo `correspondencia` de la matriz: Seguridad y Secretaría
> registran y entregan (`crear`, `editar`); la Administración ve; quien vive en la unidad ve lo suyo y confirma.

**La portería** (permisos por sus roles en la copropiedad). Prefijo `/api/app/c/:copropiedadId/correspondencia`:

| Ruta | Permiso | Qué hace |
|---|---|---|
| `POST …` `{ unidadId, tipo: "paquete" \| "carta" \| "domicilio" \| "otro", remitente?, observaciones? }` | `crear` | Registra lo que llegó; guarda **quién lo recibió** y la hora. Si hay turno abierto, entra a su minuta |
| `GET …?estado=en_porteria \| entregada \| todas&unidadId=` | `ver` | La lista (por defecto, lo que espera) |
| `POST …/:id/entregar` `{ entregadaA }` | `editar` | La entrega: a quién se lo llevó. `409 ya_entregada` (la entregada no se edita, RN-25) |

**Quien vive en la unidad** (residencia vigente). Prefijo `/api/app/c/:copropiedadId/unidades/:unidadId/correspondencia`:

| Ruta | Qué hace |
|---|---|
| `GET …` | Lo de la unidad: lo que espera en portería y lo entregado («Entregado a X, según portería») |
| `POST …/:id/recibido` | **«Recibido»** (RN-103): una sola vez (`409 ya_confirmada`), cualquiera de la unidad. Si portería no lo había entregado, la confirmación vale como entrega (CU-R-11 A1) |

Cada registro trae: `id, unidadId, unidad, tipo, remitente, observaciones, estado, recibidaEn, recibidaPor, entregadaEn,
entregadaA, entregadaPor, confirmadaEn, confirmadaPor`. En la minuta del turno aparecen como `paquete_recibido` y
`paquete_entregado` (§5b). **Todavía no:** el aviso al residente cuando llega algo (notificación).

## 5d. Cartelera y comunicados (CU-A-08, CU-R-09; RN-15, RN-374 a RN-377; T-152)

> **En BLOKY Dev desde el 2026-11-24** (`bloky-1205930`). Módulo `cartelera` de la matriz: Administrador y Delegado
> publican, editan y anulan (`VCEA`); Secretaría publica y edita (`VCE`); todos los demás roles, también el invitado, **ven**.
> La cartelera es **de la copropiedad**, no de una unidad: los permisos suman los roles de cada unidad donde vive la persona
> y los de la copropiedad (Administración, Equipo).

Prefijo `/api/app/c/:copropiedadId/comunicados`:

| Ruta | Permiso | Qué hace |
|---|---|---|
| `POST …` `{ titulo, cuerpo, categoria: "general" \| "urgente" \| "mantenimiento" \| "asamblea" \| "proyecto", fijado?, vigenteHasta? }` | `crear` | Publica; aparece de inmediato. `vigenteHasta` (AAAA-MM-DD) no puede ser pasada (RN-374) |
| `GET …` | `ver` | La cartelera: los vigentes (RN-375), **fijados primero, luego urgentes, y por fecha**; cada uno con `leido`, y `noLeidos` en total. Con `editar`, `?todos=1` trae también vencidos y anulados, y cada uno trae `lecturas`, `anuladoEn`, `anuladoPor`, `motivoAnulacion` |
| `POST …/:id/leido` | `ver` | Abrirlo lo marca leído para esa persona (una vez; repetir no cambia la hora) |
| `PUT …/:id` (el mismo cuerpo) | `editar` | Corrige; **la versión anterior queda guardada** (RN-377). `409 anulado` si ya se anuló |
| `POST …/:id/anular` `{ motivo }` | `eliminar` | Sale de la cartelera, con motivo; **no se borra** (RN-376). `409 ya_anulado` |
| `GET …/:id/cambios` | `editar` | Las versiones anteriores: qué decía, quién lo cambió y cuándo |

Cada comunicado trae: `id, titulo, cuerpo, categoria, fijado, destacado` (urgente, RN-15: ALICE lo muestra en el inicio y no
deja ocultarlo), `vigenteHasta, vigente, publicadoEn, autor, editadoEn, leido, leidoEn`. **Todavía no:** la notificación al
publicar (CU-A-08 A2) y los comunicados que publican otros módulos solos (asambleas RN-216/219, proyectos RN-101, cierres RN-117).

## 5e. PQRS y solicitudes (CU-R-07, CU-R-08, CU-R-40, CU-R-47, CU-A-07, CU-A-38; RN-12, RN-13, RN-14, RN-24, PN-15, PN-22, RN-378 a RN-380; T-153)

> **En BLOKY Dev desde el 2026-11-24** (`bloky-c226d0f`). Módulo `pqrs` de la matriz: el propietario y el arrendatario de
> operación completa radican, escriben y califican (`VCE`); el conviviente y el arrendatario «solo vivir» radican y escriben
> (`VC`); la Administración, Secretaría y Mantenimiento atienden la bandeja (`VE`).

**Desde la unidad** (residencia vigente). Prefijo `/api/app/c/:copropiedadId/unidades/:unidadId/pqrs`:

| Ruta | Permiso | Qué hace |
|---|---|---|
| `POST …` `{ tipo: "peticion" \| "queja" \| "reclamo" \| "sugerencia", categoria: "convivencia" \| "mantenimiento" \| "seguridad" \| "administracion" \| "otro", asunto, descripcion, ubicacion? }` | `crear` | Radica: `PQRS-AAAA-NNNN` consecutivo (RN-12), límite a 15 días (RN-13). `ubicacion` es el «dónde» de un daño (CU-R-40) |
| `GET …` · `GET …/:id` | `ver` | Las de la unidad; una con su conversación (`mensajes`) y sus `cambiosDeEstado` |
| `POST …/:id/mensajes` `{ texto }` | `crear` | Escribe mientras no esté cerrada (`409 cerrada`). En una **resuelta**, la reabre a «en gestión» (RN-379) |
| `POST …/:id/calificar` `{ puntaje: 1..5, comentario? }` | `ver` si la radicó; si no, `editar` | Resuelta o cerrada, **una vez** (`409 ya_calificada`, PN-15) |

**La bandeja** (por los roles en la copropiedad). Prefijo `/api/app/c/:copropiedadId/pqrs`:

| Ruta | Permiso | Qué hace |
|---|---|---|
| `GET …?estado=&semaforo=por_vencer \| vencida \| en_plazo` | `ver` | La lista, con `conteos` (abiertas, en gestión, resueltas, cerradas, por vencer, vencidas) y `calificaciones` (promedio, % satisfechos, cuántas faltan; CU-A-38) |
| `GET …/:id` | `ver` | Una, con la conversación y los cambios de estado |
| `POST …/:id/responder` `{ texto, estado? }` | `editar` | Responde; la primera respuesta la pasa a «en gestión» (RN-24). Con `estado` responde y cambia en un paso |
| `POST …/:id/estado` `{ estado: "en_gestion" \| "resuelta" \| "cerrada" }` | `editar` | Cambia sin escribir. La cerrada es final (RN-378) |

Cada PQRS trae `id, radicado, unidadId, unidad, radicadaPor, tipo, categoria, asunto, descripcion, ubicacion, estado,
radicadaEn, fechaLimite, semaforo` (`vencida` · `por_vencer` con 3 días o menos · `en_plazo` · `null` si está resuelta o
cerrada), `resueltaEn, cerradaEn, calificacion`. **La resuelta se cierra sola a los 5 días** (RN-14) si nadie vuelve a
escribir; el cambio queda con «Cierre automático (RN-14)». **Todavía no:** la foto del daño (CU-R-40, va con los archivos
de ADR-0019), reasignar a un responsable (CU-A-07 A2) y los avisos al radicar o responder.

## 6. Reuniones con video

**Pendiente (T-124, segunda parte):** las rutas de [docs/18](./18-reuniones-con-video.md) aceptarán también el token de ALICE:
`GET /api/c/:id/reuniones` y `POST /api/c/:id/reuniones/:rid/entrar` (con `Authorization: Bearer`). El rol en la reunión sale
de la persona en esa copropiedad (ADR-0030). **Quién vota (RN-365, decidido el 2026-11-21):** el propietario —el
administrador de la unidad que crea la Administración— o el **apoderado** que él elija (el arrendatario u otro residente de la
misma copropiedad). Falta conciliar con Mary el apoderado externo y el peso del voto ([`avisos/mary.md`](./avisos/mary.md) §4).

## 7. Errores

Todas las respuestas de error son `{ "error": "<codigo>", "mensaje": "<texto para mostrar>" }`. El `mensaje` ya está en español
para la persona; el `codigo` es para la lógica de la app.
