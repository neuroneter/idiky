# ADR-0032 — Residentes, colaboradores y el ingreso de ALICE

- **Estado:** Aceptada (2026-11-05)
- **Fecha:** 2026-11-05
- **Decide:** Responsable de integración (Daniel)
- **Modifica a:** [ADR-0025](./0025-directorio-unico-y-mapa-de-ubicaciones.md) (personas que nacen sin documento; roles de
  la copropiedad con `origen = 'bloky'`), RN-261 (el colaborador es una persona), RN-267 (el documento se completa en ALICE),
  [docs/18](../18-reuniones-con-video.md) §5.2 (ALICE no usa la cookie) y, para BLOKY, RN-63 del demo (quién registra a quién)
- **Responde a:** [docs/19](../19-diagnostico-alice-sesion-y-polygon.md) §6, preguntas 2 y 3 de Justo (T-87)
- **Relacionados:** CU-B-06, CU-B-07, CU-B-08, CU-B-14, CU-B-15, CU-R-01, RN-318 a RN-327, T-120 a T-129,
  [docs/20](../20-alta-e-ingreso-desde-alice.md) (el contrato de la API para ALICE)

## Contexto

Daniel (2026-11-05): *crear el módulo que nos permite crear los usuarios residentes y colaboradores y dar los roles… el
proceso para crear residentes inicia por crear la distribución de la propiedad, generando cada unidad con su código… todo
usuario de IDIKY, Colaborador o Residente, puede tener su registro en una o varias copropiedades y en cada una un rol
diferente… cuando se dé de alta o se loguee hay que retornar a ALICE el listado donde ese usuario se encuentra y con qué rol,
para que pueda seleccionar a qué unidad quiere entrar: un único login*.

Lo que había: el directorio único (ADR-0025) con `persona` y `asignacion`, pero solo Administrador y Delegado entraban, y solo
con la cookie de BLOKY; la tabla `unidad` que siembra «Armar desde documentos» (RN-187), sin código único en la copropiedad
(«502» se repite en dos torres) y sin nadie que la lea; los colaboradores como un nombre con cargo y turnos dentro del equipo,
sin ser personas; los miembros de las juntas «por vincular».

## Decisión

### 1. La unidad tiene código, y se puede generar desde la estructura

Cada unidad tiene un **código único en la copropiedad**, como **T2-502** (la estructura abreviada y el identificador): lo
genera BLOKY y se puede editar (RN-318). Las unidades salen del reglamento en PDF (RN-187) o, si la estructura se armó a mano,
**se generan desde la estructura** (pisos, unidades por piso, casas, locales…; RN-319). Así se arma la distribución antes de
crear a los residentes.

### 2. Los residentes: uno por unidad lo crea la Administración; los demás, ese residente

- **La Administración** (Administrador o Delegado), en BLOKY, crea **un residente por unidad** con solo **unidad y celular**.
  Ese residente es el **administrador de la unidad** (RN-320). Si la unidad se queda sin administrador vigente, la
  Administración crea otro.
- **El administrador de la unidad**, desde ALICE, crea a los demás **de su unidad** (RN-321):
  - **residentes**, con su celular, como **administradores** de la unidad o solo **residentes**;
  - **mascotas**: tienen perfil, **no** usuario (no entran a ALICE);
  - **invitados**, con celular y **fecha de inicio y de fin**: entran a ALICE solo entre esas fechas.
- Esto reemplaza, para BLOKY y ALICE, la cadena de RN-63 del demo (la Administración registra solo al primer propietario):
  la idea es la misma, con los nombres de Daniel.

### 3. La persona puede nacer sin documento; lo completa ella en ALICE

El residente nace con **celular** y un nombre provisional. **La primera vez que entra a ALICE**, la app le pide su **tipo y
número de documento** (y su nombre); si ese documento ya estaba en el directorio (porque la persona está en otra copropiedad),
**se une a esa misma persona** (RN-322). Desde ahí aplican RN-267 y RN-298 (`hash_identidad`). **Las billeteras las manda
crear ALICE** después, con la passkey del teléfono (RN-299, T-87): ni BLOKY ni la Administración crean billeteras.

### 4. Los colaboradores son personas

Un colaborador es toda persona que presta un servicio en la copropiedad: vigilante, portería, aseo, mantenimiento,
administración, secretaría, jardinería u otro. La Administración lo crea en BLOKY con **tipo y número de documento, celular y
correo** (RN-323): queda en el directorio con una asignación `colaborador` en esa copropiedad, y en el equipo con su
**cargo** (RN-261), sus turnos y su espacio. Su rol es su cargo. Entra a ALICE igual que un residente.

### 5. Una persona, varias copropiedades y varias unidades, con un rol en cada una

- En el **directorio**, la `asignacion` dice en qué copropiedades está la persona y con qué rol general (`residente`,
  `colaborador`), con `origen = 'bloky'`. Sirve para saber a dónde mirar (el mapa, ADR-0025 §4).
- En **cada copropiedad** (`cp_<id>`), la **residencia** dice en qué unidad y con qué rol: `administrador`, `residente` o
  `invitado` (con sus fechas), o `mascota`. Nada cruza esquemas por SQL: el middleware consulta y une.
- **Se bloquea o se finaliza por unidad** (RN-324): bloquear a alguien en una unidad no lo saca de sus otras unidades ni de
  sus otras copropiedades. Un colaborador se bloquea o se finaliza en su copropiedad. Nada se borra.

### 6. ALICE tiene su propio token de sesión

- Al validar el código, el middleware entrega un **token** que ALICE manda en cada llamada (`Authorization: Bearer`). **Dura
  30 días y se renueva solo** al usarse; se puede **cerrar desde BLOKY** (RN-325). Vive en la misma tabla de sesiones que la
  de BLOKY, con su tipo.
- **Cada petición recalcula los permisos** con lo vigente: un bloqueo surte efecto de inmediato, aunque el token siga vivo.
- **El mismo token sirve para las reuniones con video**: `GET …/reuniones` y `POST …/reuniones/:rid/entrar` aceptan el
  token de ALICE, con el rol que la persona tenga en esa copropiedad (ADR-0030).
- **El ingreso devuelve el listado** de dónde está la persona (RN-326): por copropiedad, sus unidades con el código y el rol
  en cada una (y las fechas si es invitado), o su cargo si es colaborador, y la dirección del middleware que la atiende. ALICE
  muestra el listado y la persona elige a qué unidad entrar; puede saltar a otra sin volver a pedir código.
- **Entra a ALICE** quien tenga al menos una residencia vigente (el invitado, solo entre sus fechas) o una asignación de
  colaborador vigente, en una copropiedad activa (RN-327). Administrador y Delegado siguen entrando a BLOKY.

### 7. El primer ingreso es por celular

Como el residente nace sin documento, **ALICE pide el celular** para enviar el código. Una vez completado el documento, la
persona puede entrar con su **documento o su celular**; el código va siempre al **celular registrado**, nunca a uno que se
escriba en ese momento (RN-163). Esto cambia lo que Justo dejó el 2026-11-05 (ingreso solo por documento).

## Consecuencias

- **Justo** construye en ALICE: el ingreso por celular, completar el documento, el listado y el selector de unidad, la gestión
  de la unidad (residentes, mascotas, invitados) y el uso del token; el contrato está en
  [docs/20](../20-alta-e-ingreso-desde-alice.md) (aviso 6).
- **Mary**: la regla de quién registra a quién cambia de nombres (aviso 3); y queda por decidir con ella **quién vota** en
  las asambleas (el propietario, RN-51 y RN-304): el rol de la unidad no dice si es propietario o arrendatario (T-127).
- Siguen abiertas de T-87 (docs/19 §6): si el plugin `cuentas-polygon` se muda al middleware o este le hace de puerta (pregunta
  1), el dominio de la passkey (4) y la llave de los movimientos (5).
- Twilio sigue en prueba (solo envía a números verificados) hasta salir de ella o hasta T-109.

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Que la Administración cree a todos los de cada unidad | Descartada: la carga es enorme y la unidad conoce a los suyos |
| Exigir documento al crear al residente en BLOKY | Descartada: la Administración casi nunca lo tiene; lo pone la persona |
| La cookie de BLOKY también para ALICE | Descartada: en una app móvil es frágil; el token es lo normal |
| Roles de colaborador con permisos a medida | Aplazada: por ahora el rol es el cargo |
