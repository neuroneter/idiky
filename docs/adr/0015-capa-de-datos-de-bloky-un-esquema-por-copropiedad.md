# ADR-0015 — La capa de datos de BLOKY: un esquema por copropiedad, aprovisionado desde BOB

- **Estado:** Aceptada (2026-09-21)
- **Fecha:** 2026-09-21
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0008](./0008-backend-de-bloky.md) (la API y su PostgreSQL),
  [ADR-0012](./0012-sistema-de-gestion-strapi.md) (BOB), [ADR-0003](./0003-repositorio-de-datos.md)
  (todo dato pasa por el repositorio), docs/13 §1 (la frontera BOB / BLOKY), T-77

## Contexto

Con el ingreso terminado, lo que sigue son los módulos con datos: estructura y unidades,
propietarios, cartera, contabilidad, asambleas. Antes de escribir la primera tabla hay que
decidir **dónde viven los datos de cada copropiedad y cómo se separan de los de las demás**.

Lo que manda:

- **Dos fuentes.** BOB es dueño de lo comercial (cliente, plan, contrato, ficha, perfiles raíz);
  BLOKY es dueño de la operación (docs/13 §1). BLOKY lee BOB y no lo escribe (ADR-0008).
- **Más de 500 copropiedades en dos años, muy distintas entre sí**: desde conjuntos de 36 casas
  hasta ciudadelas de miles de unidades. Lo que sirva para las pequeñas no puede estorbar a las
  grandes, ni al revés.
- **Los datos de una copropiedad no pueden mezclarse con los de otra.** Es contabilidad y
  cartera de terceros: un error de aislamiento es un incidente, no un bug.
- **Nada se borra** (CLAUDE.md §6): se cierra o se anula. Si alguna vez hay que borrar una
  copropiedad entera, tiene que ser la excepción más controlada del sistema.
- **La API ya es la capa intermedia.** La app no toca BOB ni la base; `apps/bloky-api` combina
  las dos fuentes (hoy, en el ingreso). No hace falta otro *middleware*: hace falta que esta
  API crezca con orden.

## Decisión

### 1. Una base, un esquema común y un esquema por copropiedad

La base PostgreSQL `bloky` (ADR-0008) tiene:

- El esquema **`bloky`**, transversal: sesiones, intentos de ingreso, estados OAuth (lo que ya
  existe) y el **catálogo de copropiedades**: `copropiedad_id` (el `documentId` de BOB, RN-01),
  `esquema`, `estado` (`aprovisionada` · `retirada` · `eliminada`), `version_migraciones`,
  `conexion` (vacío = esta base; una URL = una base propia, para las grandes) y fechas.
- Un esquema **`cp_<id>`** por copropiedad, **estructuralmente idéntico** en todas: las mismas
  tablas de estructura, propietarios, cartera, contabilidad y asambleas. Cada copropiedad es un
  sistema aparte que comparte el motor.

**Por qué esquemas y no una columna `copropiedad_id` en tablas compartidas:** el aislamiento
queda garantizado por construcción (una conexión solo ve su esquema) y no por la disciplina de
no olvidar un `WHERE`. **Por qué no una base por copropiedad:** con 500 o más, cada base es una
pieza más que operar, respaldar y migrar; el esquema da el mismo aislamiento lógico con una sola
pieza. Y si una copropiedad grande necesita su propia base, el catálogo lo permite (`conexion`)
**sin cambiar código**.

### 2. El repositorio recibe la copropiedad, no la adivina

`repositorio.para(copropiedadId)` devuelve un repositorio atado al esquema de esa copropiedad:
toma la conexión del *pool*, fija `search_path` al esquema del catálogo y la devuelve limpia.
El nombre del esquema **sale del catálogo, nunca de la petición**: no se construye SQL con nada
que venga del navegador. La sesión (cookie) dice a qué copropiedades puede entrar la persona;
cada petición nombra una, la API comprueba que esté en su sesión, y solo entonces abre el
repositorio de esa copropiedad.

### 3. Migraciones en dos carpetas, y la estructura evoluciona sin romper a nadie

`migraciones/comun/` (esquema `bloky`) y `migraciones/copropiedad/` (se aplican a **cada**
esquema del catálogo, en un bucle, al arrancar y al aprovisionar). Cada esquema registra en su
tabla `_migraciones` hasta qué versión va, así que un esquema nuevo recibe todas y uno viejo solo
las que le faltan. Con cientos de esquemas, una migración es un bucle de segundos; a partir de
miles, se planifica por lotes y con PostgreSQL administrado (§Consecuencias).

**La estructura no es rígida: va a cambiar mientras se desarrolla y cada vez que un módulo se
actualice.** Lo que lo hace seguro es la disciplina, no la herramienta:

- **Una migración nunca se edita después de aplicada**; se agrega la siguiente. En desarrollo,
  mientras un módulo no ha salido, el esquema se puede recrear desde cero (`aprovisionar` de
  nuevo sobre datos de prueba); una vez hay copropiedades reales, solo se agrega.
- **Cambios en dos pasos cuando tocan datos existentes** (*expandir y contraer*): primero se
  agrega la columna o tabla nueva y el código escribe en las dos; cuando todo está migrado, otra
  migración quita lo viejo. Nunca un `DROP` o un `RENAME` en la misma versión que estrena algo.
- **Toda migración se prueba contra una copia** de un esquema real antes de aplicarse en bucle,
  y el bucle **respalda cada esquema antes de tocarlo** (§4, `respaldar`). Si una falla, se
  detiene ahí: los esquemas anteriores quedan migrados y los siguientes intactos, y el catálogo
  muestra cuáles van en qué versión.
- **El código sabe leer la versión anterior** hasta que la contracción termine: la API arranca
  aunque haya esquemas rezagados, y los migra al vuelo o los reporta, según el tamaño del cambio.
- **Los catálogos que son datos** (tipos de bien, tipos de agrupación, PUC) se siembran al
  aprovisionar y se actualizan con migraciones de datos, que respetan lo que la copropiedad haya
  agregado o renombrado.

### 4. El aprovisionamiento se ordena desde BOB

**BLOKY expone una API de administración**, separada de la de la app y protegida con un token
propio (`BLOKY_ADMIN_TOKEN`, distinto del token de lectura de BOB, que sigue siendo de solo
lectura en la otra dirección):

| Ruta | Qué hace | Cuándo |
|---|---|---|
| `POST /api/admin/copropiedades/:id/aprovisionar` | Crea el esquema, aplica las migraciones, siembra los catálogos base (tipos de bien, tipos de agrupación; el PUC cuando exista) y anota la copropiedad en el catálogo. **Idempotente:** si ya está, no toca nada y responde el estado | Al crear la copropiedad en BOB |
| `GET /api/admin/copropiedades/:id` | El estado en el catálogo, la versión y el último respaldo | Siempre |
| `POST …/respaldar` | `pg_dump` de ese esquema a `~/datos/bloky/respaldos/<id>/<fecha>.sql.gz` y devuelve el nombre | A demanda; también diario por temporizador |
| `POST …/retirar` | Marca `retirada`: nadie entra (RN-162 ya lo hace por BOB) y los datos quedan intactos | Cuando la copropiedad se retira |
| `POST …/eliminar` | **Solo si está retirada.** Exige el código de un solo uso enviado al superadministrador (§5), hace un respaldo con la **retención elegida** (6 meses, 1 año o 2 años), borra el esquema y marca `eliminada`. Queda en la auditoría quién, cuándo, con qué código y hasta cuándo se conserva el respaldo | La excepción |

**En BOB**, en la ficha de la copropiedad, un botón **«Aprovisionar en BLOKY»** (un pequeño
*plugin* de administración de Strapi que llama a la API de arriba con el token). Una vez
aprovisionada, el botón desaparece y en su lugar se ofrecen **«Respaldar»** y, si está retirada,
**«Eliminar»**. BOB muestra el estado que le responde BLOKY; no guarda una copia.

### 5. Eliminar es la excepción, y va en dos pasos

«Nada se borra» sigue siendo la regla. Lo normal es **retirar**: la copropiedad deja de entrar y
conserva todo, para una reclamación, una auditoría o un regreso. **Borrar definitivamente**
existe solo para copropiedades ya retiradas, y exige: un respaldo automático previo, el código
de un solo uso por SMS a un **superadministrador**, y un registro de auditoría en el esquema
común. El código lo manda BLOKY por el mismo canal del ingreso (Twilio Verify, RN-163).

- **Quién es el superadministrador:** el rol **Super Admin que ya existe en BOB** (Strapi). El
  usuario operativo que pide la baja elige a quién enviarle el código de la lista de
  superadministradores; ese superadministrador se lo entrega por el medio que operaciones
  defina. Así la persona que borra y la que autoriza son dos.
- **Cuánto se conserva el respaldo:** lo elige el usuario operativo al pedir la baja: **6 meses,
  1 año o 2 años** (el máximo). Al vencer, un temporizador lo borra y lo anota en la auditoría.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Tablas compartidas con `copropiedad_id`** | Lo más simple; una sola migración | El aislamiento depende de no olvidar un filtro; respaldar o exportar una copropiedad es un trabajo aparte | Descartada |
| **Una base por copropiedad** | Aislamiento total, incluso de recursos | Con más de 500, cada base es una pieza que operar, respaldar y migrar; el *pool* de conexiones se multiplica | Descartada como norma; **permitida caso a caso** para las grandes (catálogo `conexion`) |
| **Un esquema por copropiedad en la misma base** | Aislamiento por construcción; respaldo por copropiedad con un comando; una sola base que operar; mismo código si una se muda a su propia base | Migraciones en bucle; hay que cuidar el `search_path` en el *pool* | **Elegida** |
| **Aprovisionar al primer ingreso** (automático) | Cero botones | BOB no sabría si la copropiedad ya existe en BLOKY; el primer ingreso tardaría; y no hay dónde ofrecer respaldo o eliminación | Descartada; la API sigue siendo idempotente por si integración lo corre a mano |

## Consecuencias

- **El primer módulo con datos (estructura y unidades) estrena todo esto**: catálogo,
  `repositorio.para()`, migraciones por copropiedad y el aprovisionamiento. Se construye una
  vez y los módulos siguientes solo agregan tablas a `migraciones/copropiedad/`.
- **BOB pasa a llamar a BLOKY** (solo para administrar copropiedades), con un token distinto al
  que BLOKY usa para leer BOB. Los dos tokens viven en los secretos del servidor.
- **Cada copropiedad se respalda sola** y se puede exportar o mover. El respaldo diario recorre el
  catálogo.
- **A más de mil esquemas** hay que pasar PostgreSQL a un servicio administrado y aplicar las
  migraciones por lotes; el diseño no cambia.
- **Lo que no se hace:** SQL con nombres que vengan de la petición; datos de una copropiedad en
  el esquema común; borrar sin retirar, sin respaldo y sin código.

## Lo que se cerró el mismo día

Las dos preguntas abiertas se resolvieron con Daniel el 2026-09-21 y quedaron en §5: el
superadministrador es el rol Super Admin de BOB (se elige a quién enviar el código), y la
retención del respaldo la escoge quien pide la baja (6 meses, 1 o 2 años).
