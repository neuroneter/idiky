# 20 — El alta y el ingreso desde ALICE (contrato de la API del middleware)

> **Para quién:** Justo (ALICE) y quien construya el lado del middleware.
> **Decisión:** [ADR-0032](./adr/0032-residentes-colaboradores-e-ingreso-de-alice.md) · reglas RN-318 a RN-327 · tareas
> T-120 a T-129.
> **Estado:** contrato acordado el 2026-11-05; **por construir** en el middleware (T-124). Si algo de aquí cambia al
> construirlo, se corrige este documento y se avisa en [`avisos/justo.md`](./avisos/justo.md).

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
- Responde `200 { "pista": "••• •• 4567" }` (y `codigoSimulado` solo en desarrollo).
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

- `token` va en **cada** llamada siguiente: `Authorization: Bearer <token>`. Dura 30 días y se renueva solo (§3).
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
- Después, ALICE manda crear las billeteras con la passkey (RN-299, T-87; el camino lo cierran Daniel y Justo, docs/19).

## 3. La sesión

| Ruta | Qué hace |
|---|---|
| `GET /api/app/yo` | La persona y sus `lugares` recalculados (útil al abrir la app) |
| `POST /api/app/sesion/renovar` | Un token nuevo con otros 30 días (el anterior queda cerrado) |
| `POST /api/app/salir` | Cierra la sesión |

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
    "colaborador": null
  },
  {
    "copropiedadId": "cp-456", "nombre": "Edificio Torres del Parque", "api": "https://bloky-dev.idiky.com",
    "unidades": [],
    "colaborador": { "cargo": "vigilante", "espacio": "Portería y vigilancia" }
  }
]
```

- Solo lo **vigente**: el invitado aparece solo entre `desde` y `hasta`; lo bloqueado o finalizado no aparece.
- `api`: la dirección del middleware que atiende esa copropiedad (ADR-0025 §4). Hoy es siempre la misma.
- ALICE muestra el listado; la persona elige **una unidad** (o su lugar de trabajo, si es colaborador) y puede saltar a otra
  sin volver a pedir código.

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

Las rutas de [docs/18](./18-reuniones-con-video.md) aceptan también el token de ALICE:
`GET /api/c/:id/reuniones` y `POST /api/c/:id/reuniones/:rid/entrar` (con `Authorization: Bearer`). El rol en la reunión sale
de la persona en esa copropiedad (ADR-0030). **Quién vota** (el propietario) está por definir con Mary (T-127).

## 7. Errores

Todas las respuestas de error son `{ "error": "<codigo>", "mensaje": "<texto para mostrar>" }`. El `mensaje` ya está en español
para la persona; el `codigo` es para la lógica de la app.
