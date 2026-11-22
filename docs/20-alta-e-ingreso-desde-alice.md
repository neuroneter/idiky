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
> - **Primer ingreso** (RN-356, T-143): el documento que escribe la persona debe coincidir con el que reportó la
>   Administración (§2, `documento_no_coincide`); después, el correo con código (§2c, **por construir con Justo**: el envío
>   de correo ya funciona, [`infra/correo-ses.md`](../infra/correo-ses.md)).
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

## 2c. El correo con código (primer ingreso y segundo factor) — por construir (T-143)

**Decidido (RN-356, RN-357):** el primer ingreso es 1) código al celular → 2) documento que coincida (§2) → 3) **un correo,
validado con un código** → 4) los **datos básicos** (§0: nombre y **fecha de nacimiento**, RN-192); solo ahí entra. Tras el
documento (y con `hashIdentidad`) puede crear las **billeteras** (§2b). Las veces siguientes, solo el código del celular.
Cambiar el celular pide su código **y** uno al correo validado; cambiar el correo pide su código **y** uno al celular.
Después: huella y facial.

**Lo que ya está:** el middleware ya **envía correos reales** por Amazon SES desde `no-responder@idiky.com`
([ADR-0036](./adr/0036-correo-con-amazon-ses.md), [`infra/correo-ses.md`](../infra/correo-ses.md)). En *sandbox* solo llegan
a correos verificados (hoy Daniel y Justo).

**Lo que falta, con Justo conectado:** las rutas (`…/yo/correo` para pedir y validar el código, guardar el correo validado, y
las de cambio de celular y correo), escritas primero aquí. Mientras no existan, ALICE **no** construye un cambio de celular sin
segundo factor.

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
      { "unidadId": "…", "codigo": "T2-502", "rol": "administrador" },
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
          "unidadId": "…", "codigo": "T2-502", "rol": "administrador",
          "roles": ["administrador_unidad"],
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
| Administrador de la unidad | VCEA | VCEA | V | VCEA | VC | VC | VCE | V | V | V | V | V | — |
| Residente | V | VCA | V | VCA | V | V | VC | V | V | V | V | V | — |
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
`administrador` → Administrador de la unidad; `residente` → Residente; `invitado` → Invitado.

## 5. La unidad: residentes, mascotas e invitados (RN-321, solo el administrador de la unidad)

Prefijo: `/api/app/c/:copropiedadId/unidades/:unidadId`

| Ruta | Qué hace |
|---|---|
| `GET …/residencias` | Quiénes están en la unidad: personas (con rol), mascotas e invitados |
| `POST …/residentes` `{ nombre, celular, paisCelular?, tipoDocumento, numeroDocumento, paisDocumento?, rol: "administrador" \| "residente", aceptarCelularRegistrado? }` | Agrega un residente |
| `POST …/invitados` `{ nombre, celular, paisCelular?, tipoDocumento, numeroDocumento, paisDocumento?, desde, hasta, aceptarCelularRegistrado? }` | Agrega un invitado con sus fechas (obligatorias) |
| `POST …/mascotas` `{ nombre, especie, foto? }` | Agrega una mascota (perfil, sin ingreso) |
| `POST …/residencias/:rid/bloquear` · `…/desbloquear` · `…/finalizar` `{ motivo }` | Gestiona a uno de su unidad |

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
- No se puede finalizar ni bloquear al **último administrador** de la unidad (RN-324); eso solo lo hace la Administración.
- Nada se borra: se finaliza.

## 6. Reuniones con video

**Pendiente (T-124, segunda parte):** las rutas de [docs/18](./18-reuniones-con-video.md) aceptarán también el token de ALICE:
`GET /api/c/:id/reuniones` y `POST /api/c/:id/reuniones/:rid/entrar` (con `Authorization: Bearer`). El rol en la reunión sale
de la persona en esa copropiedad (ADR-0030). **Quién vota (RN-365, decidido el 2026-11-21):** el propietario —el
administrador de la unidad que crea la Administración— o el **apoderado** que él elija (el arrendatario u otro residente de la
misma copropiedad). Falta conciliar con Mary el apoderado externo y el peso del voto ([`avisos/mary.md`](./avisos/mary.md) §4).

## 7. Errores

Todas las respuestas de error son `{ "error": "<codigo>", "mensaje": "<texto para mostrar>" }`. El `mensaje` ya está en español
para la persona; el `codigo` es para la lógica de la app.
