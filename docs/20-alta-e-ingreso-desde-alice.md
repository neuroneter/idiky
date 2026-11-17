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

Todas las rutas son del **middleware de IDIKY** (BLOKY Dev: `https://bloky-dev.idiky.com`). ALICE no habla con BOB ni con
ninguna base.

---

## 1. Ingresar

### 1.1 Pedir el código

`POST /api/app/acceso/enviar-codigo`

```json
{ "celular": "3001234567" }
```
o, cuando la persona ya completó su documento:
```json
{ "tipoDocumento": "CC", "numeroDocumento": "52100200" }
```

- Busca a la persona por su celular registrado o por su documento. El código va **siempre al celular registrado** (RN-163).
- En Dev con Evolution, el canal es **WhatsApp** (`canal: "whatsapp"` en la respuesta); si no hay Evolution, SMS/simulado.
- Responde `200 { "pista": "••• •• 4567", "canal": "whatsapp" }` (y `codigoSimulado` solo si el enviador lo expone fuera de producción).
- `404 no_existe` si no hay nadie con ese dato; `403 sin_acceso` si existe pero no tiene nada vigente para ALICE (RN-327);
  `429 bloqueado` tras cinco errores en 15 minutos (RN-166).

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
- `lugares` es el listado de RN-326 (§4).

## 2. Completar el documento (primer ingreso)

`POST /api/app/yo/documento` (con el token)

```json
{ "tipoDocumento": "CC", "numeroDocumento": "52100200", "nombre": "Sandra Ortiz" }
```

- Si el documento **no existe** en el directorio: se le pone a esta persona y se calcula su `hash_identidad` (RN-298).
- Si **ya existe** (la persona está en otra copropiedad): **se unen** (RN-322). La respuesta trae la persona resultante y
  un **token nuevo** (el anterior queda cerrado).
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

## 5. La unidad: residentes, mascotas e invitados (RN-321, solo el administrador de la unidad)

Prefijo: `/api/app/c/:copropiedadId/unidades/:unidadId`

| Ruta | Qué hace |
|---|---|
| `GET …/residencias` | Quiénes están en la unidad: personas (con rol), mascotas e invitados |
| `POST …/residentes` `{ celular, nombre?, rol: "administrador" \| "residente" }` | Agrega un residente |
| `POST …/invitados` `{ celular, nombre?, desde, hasta }` | Agrega un invitado con sus fechas (obligatorias) |
| `POST …/mascotas` `{ nombre, especie, foto? }` | Agrega una mascota (perfil, sin ingreso) |
| `POST …/residencias/:rid/bloquear` · `…/desbloquear` · `…/finalizar` `{ motivo }` | Gestiona a uno de su unidad |

- `403` si quien llama no es **administrador de esa unidad**.
- No se puede finalizar ni bloquear al **último administrador** de la unidad (RN-324); eso solo lo hace la Administración.
- Nada se borra: se finaliza.

## 6. Reuniones con video

**Pendiente (T-124, segunda parte):** las rutas de [docs/18](./18-reuniones-con-video.md) aceptarán también el token de ALICE:
`GET /api/c/:id/reuniones` y `POST /api/c/:id/reuniones/:rid/entrar` (con `Authorization: Bearer`). El rol en la reunión sale
de la persona en esa copropiedad (ADR-0030). **Quién vota** (el propietario) está por definir con Mary (T-127).

## 7. Errores

Todas las respuestas de error son `{ "error": "<codigo>", "mensaje": "<texto para mostrar>" }`. El `mensaje` ya está en español
para la persona; el `codigo` es para la lógica de la app.
