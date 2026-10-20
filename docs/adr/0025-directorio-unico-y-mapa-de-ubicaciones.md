# ADR-0025 — Una sola casa para las personas, y el mapa de dónde vive cada cliente

- **Estado:** Aceptada (2026-10-20)
- **Fecha:** 2026-10-20
- **Decide:** Responsable de integración (Daniel)
- **Modifica a:** [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md) (BLOKY ya no
  solo lee BOB: en las personas, BOB escribe en BLOKY) y [ADR-0022](./0022-directorio-de-acceso-impersonacion-y-consumo.md)
  (§1: el directorio pasa a su propio esquema; §2: se acaban la copia desde BOB y la conciliación)
- **Relacionados:** [ADR-0008](./0008-backend-de-bloky.md), [ADR-0012](./0012-sistema-de-gestion-strapi.md),
  [ADR-0016](./0016-jitsi-propio-para-las-asambleas-virtuales.md), docs/13 §1 y §3, RN-160 a RN-164, T-80, T-81, T-87 (los usuarios de la app ante BOB), T-89
- **Diagrama:** [`docs/diagramas/reuniones-y-usuarios.drawio`](../diagramas/reuniones-y-usuarios.drawio), páginas 1 y 3

## Vocabulario: el middleware de IDIKY

Daniel (2026-10-20): *no lo llamemos «la API de BLOKY» ni «la API de IDIKY»; es **el middleware**, el punto de
acceso de BOB, la APP y cualquier cosa que quiera comunicarse con la capa de datos de IDIKY.*

- **El middleware de IDIKY** es el **único punto de acceso a la capa de datos** de IDIKY. La app de BLOKY,
  ALICE, BOB y cualquier otro sistema hablan con él; **nadie más se conecta a una base de datos**.
- Tiene **dos entradas**: la de las apps (con la sesión de cada persona) y la **de administración** (para
  BOB, con su token, `BLOKY_ADMIN_TOKEN`).
- Hoy su código vive en `Bloky-Idiky/apps/bloky-api` y se publica en el pod `idiky-bloky` (BLOKY Dev, 8083).
  El nombre de la carpeta y del pod se mantienen por ahora; renombrarlos es un cambio de código y despliegue
  que se hará aparte.

**Un solo nombre: asignación.** Lo que une a una persona con un lugar y le da un rol ahí («Marta es
Administradora de Altos del Bosque desde el 1 de enero») se llama **asignación** en todas partes: en BOB
(donde ya se llamaba así), en el directorio y en la documentación (Daniel, 2026-10-20). La tabla del
directorio que hoy se llama `bloky.membresia` (ADR-0022) se renombra a `directorio.asignacion` en T-89.
Una persona tiene **varias asignaciones** (puede administrar un conjunto y ser propietaria en otro);
una asignación finalizada no se borra. La asignación dice **a dónde entra y con qué rol**; qué unidad es
suya, los permisos finos o sus turnos viven en el esquema de cada cliente.

## Contexto

Hasta hoy la misma persona —el Administrador o el Delegado de una copropiedad— está guardada **dos
veces**: en BOB (`persona` + `asignacion`, en la base `gestion`) y en el directorio de acceso de
BLOKY (`bloky.persona` + `bloky.membresia` —la tabla de hoy; desde esta decisión se llama **asignación**—, en la base `bloky`), que la copia de BOB en cada
ingreso, cuando BOB avisa y en una conciliación cada 15 minutos (ADR-0022 §2). Los demás roles
(propietarios, residentes, colaboradores, portería…) solo existen en BLOKY. Eso deja:

- **Dos registros de la misma persona** que hay que mantener iguales, y la duda de cuál manda cuando
  difieren (un celular cambiado en un lado, una asignación finalizada que no se copió).
- **El directorio partido**: dos roles nacen en BOB y el resto en BLOKY.
- **Más copias de datos personales** de las necesarias (Ley 1581 de 2012).
- El aviso de BOB a BLOKY nunca se construyó del lado de BOB.

Daniel (2026-10-20): *que BOB cree y gestione al Administrador y al Delegado, pero que nunca se
almacenen en BOB: que BOB los acceda y los gestione en un módulo, para no tener registros
duplicados.* Y sobre la base: *un esquema para los datos de los usuarios y otro que se duplica para
cada cliente con los datos de su copropiedad, para poder llevar uno de esos esquemas a otra
infraestructura si esa copropiedad lo requiere… y saber dónde guardar esas rutas para que la APP,
BLOKY y BOB sepan dónde están y cómo llegar a ellos si se migran.*

## Decisión

### 1. El directorio de BLOKY es la única casa de las personas

**Todas** las personas de IDIKY viven en un solo lugar, el directorio: Administradores, Delegados,
propietarios, residentes, colaboradores y los perfiles que se creen. De cada una se guarda **lo
mínimo**:

- `persona`: tipo y número de documento, nombre, celular, correo (y los datos del login con
  contratos inteligentes de ALICE, T-81).
- `asignacion`: a qué copropiedad u oficina pertenece, con qué **rol**, desde y hasta cuándo, estado,
  quién la gestiona (`origen`: `bob` = la gestiona IDIKY desde BOB; `bloky` = la crean el
  Administrador o el Delegado) y, para el Administrador, el soporte del nombramiento y si es una
  empresa administradora con su NIT.
- `rol`: el **catálogo de roles** (hoy el rol es texto libre): administrador, delegado,
  propietario, arrendatario, residente, colaborador y los perfiles internos. Lo amplía una migración.

Una persona es **una sola** en todo IDIKY y puede tener varios roles en varios lugares.

### 2. BOB gestiona al Administrador y al Delegado, pero no los guarda

- **BOB no tiene `persona` ni `asignacion`.** Tiene un módulo **«Personas del cliente»** (una página
  propia dentro del panel de Strapi) que, en la ficha de la copropiedad, **consulta y cambia el
  directorio a través de la entrada de administración del middleware de IDIKY** (la de ADR-0015 §4, con su token).
  Crear, cambiar o finalizar un Administrador o un Delegado se hace ahí y **se escribe solo en
  BLOKY**.
- BLOKY **valida** como si fuera su propia pantalla (RN-161 y las reglas de docs/13 §3: un solo
  Administrador vigente, el Delegado no es el mismo, etc.) y **registra quién** de IDIKY hizo el
  cambio (la cabecera `x-bloky-quien` y la auditoría, como ya hace al aprovisionar).
- **Lo que sí queda en BOB es el trámite, no la persona**: la `solicitud` de cambio de Delegado o de
  Administrador (quién la pidió, por qué canal, con qué acta, en qué estado) guarda **el id de la
  persona en el directorio**, nunca sus datos.
- **Se acaban la copia y la conciliación** (ADR-0022 §2): no hay nada que copiar.
- Si BLOKY no responde, el módulo de BOB lo dice y no deja cambiar. Es aceptable: sin BLOKY, los
  administradores tampoco pueden trabajar.
- Los usuarios de BOB (el equipo de IDIKY) **siguen siendo cuentas de Strapi**: no son personas de
  los clientes y no van al directorio. El permiso de soporte para entrar a una copropiedad (ADR-0022
  §5) se da en BOB y se guarda en el directorio como una asignación de soporte.

### 3. Tres tipos de esquema en la base, cada uno con su trabajo

| Esquema | Qué guarda | ¿Se replica por cliente? | ¿Se puede mudar? |
|---|---|---|---|
| **`directorio`** | Solo datos de los usuarios: `persona`, `asignacion`, `rol` | No: es uno, para todo IDIKY | Sí, entero, a su propia base (si ALICE crece mucho) |
| **`bloky`** (el núcleo) | El ingreso (sesiones, intentos, OAuth), el **mapa** (§4), el consumo y la auditoría | No | No: es el punto fijo desde donde se encuentra todo lo demás |
| **`cp_<id>`** | Todo lo de **un** cliente: estructura, unidades, equipo, cartera, reuniones… | **Sí: idéntico para cada cliente** | Sí, uno por uno, a otra base o a otra infraestructura |

- Hoy el directorio vive dentro de `bloky`. Pasa a su propio esquema `directorio` con una migración
  (*expandir y contraer*, ADR-0015 §3): se crea, se copian los datos, el código lee de ahí, y al
  final se quitan las tablas viejas.
- Lo que hace cada persona **dentro** de su copropiedad (sus grupos, sus turnos, lo que aprobó) sigue
  en el `cp_<id>`, enlazado por el id de la persona. **Nada cruza esquemas por SQL** (ADR-0022 §7):
  el middleware consulta cada uno y une el resultado, así que todo sigue funcionando cuando un esquema se
  muda.

### 4. El mapa: dónde vive cada cosa, en un solo lugar

El catálogo de clientes se vuelve el **mapa** de la solución, en el esquema `bloky`:

- **`servidor_datos`**: los servidores de base de datos que existen. Cada uno con un nombre
  (`principal`, `grande-01`…), su dirección (host, puerto, base), **el nombre del secreto** donde
  está su clave y su estado. **Nunca la clave**: las claves viven en los secretos del servidor,
  fuera de git y fuera de la base.
- **`ubicacion`**: dónde vive cada pieza movible: el `directorio` y cada `cp_<id>`. Cada fila dice
  **en qué servidor y en qué esquema** está, en qué **estado** (`activa`, `mudandose`,
  `solo_lectura`) y, si algún día un cliente grande tiene su propia instancia del middleware, **cuál es su dirección**.
  Reemplaza al campo `conexion` del catálogo, que hoy guardaría una URL con la clave adentro.

**Quién usa el mapa: solo el middleware de IDIKY.** Ni ALICE, ni la app de BLOKY, ni BOB se conectan nunca a
una base de datos: **hablan con el middleware**, y el middleware mira el mapa y llega a donde haga falta
(ya lo hace: `poolPara(conexion)` en `datos/base.ts`). Por eso, **cuando un cliente se muda, nadie
más se entera**: ni la app, ni BOB, ni ALICE cambian.

Si un cliente muy grande llegara a necesitar **su propia instancia del middleware** en otra infraestructura, el mapa
guarda esa dirección y el middleware la entrega al entrar: la respuesta de «¿a qué puedo entrar?» trae, por
cada copropiedad, a qué dirección hablarle. La app y ALICE la usan sin saber por qué es distinta.

### 5. Mudar un cliente es cambiar una fila del mapa

1. Se marca `mudandose` (la copropiedad queda **solo lectura** unos minutos; se avisa).
2. Se respalda su `cp_<id>` (`pg_dump`, ADR-0015 §4) y se restaura en el servidor nuevo.
3. Se verifica (conteos, la versión de migraciones).
4. Se cambia el servidor en su fila de `ubicacion` y se marca `activa`.
5. El esquema viejo queda **retirado** un tiempo, como respaldo; no se borra en el mismo paso.

**Sin cambiar código y sin que las apps lo noten.** Lo decide IDIKY con lo que muestra «Consumo por
copropiedad» en BOB (ADR-0022 §6).

### 6. ALICE usa el mismo directorio

La persona es una sola: puede ser administradora en un conjunto (BLOKY) y propietaria en otro
(ALICE). ALICE **no tiene directorio propio**: entra por el mismo middleware de IDIKY, que es el único que
conoce el mapa. Cómo se arma el ingreso de ALICE (con su login de contratos inteligentes) se trabaja
con Justo en T-80 y T-81.

## Abierto

- **El plugin `cuentas-polygon` de BOB (T-81, T-87).** Hoy las cuentas en la cadena se piden a BOB y
  sus campos están en la `persona` de BOB. Con esta decisión, esos campos pasan al directorio, y la
  persona de ALICE se identifica ante el **middleware de IDIKY**, no ante los usuarios de Strapi. Falta
  decidir con Justo si el plugin se queda en BOB (atendiendo sin guardar personas) o pasa al
  middleware de IDIKY.
- **El nombre del secreto de cada servidor de datos** y dónde se guardan esos secretos fuera del
  servidor actual, cuando haya un segundo servidor (hoy hay uno solo: `principal`).

## Consecuencias

- **Un solo registro por persona**; desaparecen la copia, el aviso y la conciliación con BOB.
- **El ingreso de BLOKY ya no depende de BOB** ni para la copia: todo está en el directorio.
- **El middleware expone más rutas de administración** para las personas (listar, crear, cambiar y finalizar
  Administradores y Delegados de una copropiedad) y **BOB necesita un módulo propio** en su panel.
  Ese módulo puede hacerlo el equipo de BLOKY (T-89).
- **Hay que mover lo que ya existe**: las personas y asignaciones que hoy tiene BOB (por ejemplo, las
  de Cowork Centro 93) pasan al directorio, se verifican y **solo después** se quitan de BOB, con un
  respaldo antes. **Strapi borra solas las tablas que su código ya no tiene**, así que quitar
  `persona` y `asignacion` del código de BOB es el último paso, nunca el primero.
- RN-160 a RN-164 cambian de «viene de BOB» a «está en el directorio».
- Se pierde una garantía: hoy, si alguien edita mal una persona en BOB, BLOKY la valida al copiarla;
  ahora la valida al recibirla, que es lo mismo pero antes.

## Pasos (en orden)

| Paso | Qué | Quién |
|---|---|---|
| 1 | Esquema `directorio` + catálogo de roles, y mover ahí `persona` y `asignacion` (la tabla de hoy, `bloky.membresia`, se renombra) | Middleware |
| 2 | Mapa: `servidor_datos` y `ubicacion` en `bloky`, reemplazando `conexion` (✅ 2026-10-20, RN-273 a RN-275) | BLOKY |
| 3 | Rutas de administración del middleware para las personas del cliente | Middleware |
| 4 | Módulo «Personas del cliente» en BOB, que usa esas rutas del middleware | BOB (lo puede hacer el equipo de BLOKY) |
| 5 | Pasar las personas y asignaciones de BOB al directorio, verificar | Los dos, con respaldo |
| 6 | Quitar `persona` y `asignacion` del código de BOB y `solicitud` apunta al id del directorio | BOB, al final |
| 7 | Quitar la copia y la conciliación (`directorio/sincronizar.ts`) | BLOKY |

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Seguir como hoy: BOB guarda y BLOKY copia | Descartada: dos registros de la misma persona y una copia que mantener |
| Al revés: todas las personas en BOB y BLOKY las lee cada vez | Descartada: BOB no conoce los demás roles, sería un punto único de falla del ingreso y BOB tendría datos de residentes (docs/13 §1) |
| Una base por cliente desde ya | Descartada (ADR-0015 §1): con cientos de clientes es una pieza más que operar; el mapa permite mudar solo a los que lo necesiten |
| Que cada app guarde las direcciones de las bases | Descartada: las bases solo las toca el middleware (ADR-0003, ADR-0015); si un cliente se muda, habría que cambiar las apps |
| Guardar la URL con la clave en el catálogo (`conexion` de hoy) | Descartada: las claves van en los secretos del servidor; el mapa guarda solo el nombre del secreto |
