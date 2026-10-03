# ADR-0022 — El directorio de acceso de BLOKY, la impersonación desde BOB y la medición del consumo

- **Estado:** Aceptada (2026-10-03)
- **Fecha:** 2026-10-03
- **Decide:** Responsable de integración (Daniel)
- **Completa a:** [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md) (un esquema por copropiedad)
- **Relacionados:** [ADR-0008](./0008-backend-de-bloky.md), CU-B-01, CU-B-02, CU-B-08, RN-160 a RN-168, T-77

## Contexto

ADR-0015 separa **los datos**: un esquema por copropiedad, en la misma base o en otra (catálogo
`conexion`), creado desde BOB. Daniel lo confirmó el 2026-10-03 y pidió revisar lo que lo rodea:

- **El ingreso.** La persona entra una vez y puede tener roles distintos en varias copropiedades,
  y cambiar entre ellas **sin otra app ni otra dirección**. Hoy BLOKY lee las asignaciones en BOB
  (RN-160), lo que basta para Administrador y Delegado, pero no para los perfiles que el
  administrador cree en BLOKY (portería, contador, comité: CU-B-08), que BOB no conoce. Si esos
  perfiles vivieran solo en el esquema de su copropiedad, el ingreso tendría que recorrer
  cientos de esquemas.
- **El soporte.** Un empleado de IDIKY con permiso tiene que poder entrar fácilmente a una
  copropiedad como su administrador.
- **El rendimiento.** Separar esquemas separa los datos, **no la capacidad**: mientras compartan
  servidor, todos los esquemas comparten CPU, memoria y disco, y las APIs son compartidas. Pero
  las cargas son distintas: **ALICE** tiene muchos usuarios con operaciones livianas; **BLOKY**,
  pocos por copropiedad (Administrador, Delegado, Contador, Revisor Fiscal) con procesos pesados
  y ocasionales (liquidar, cerrar el mes, informes). Daniel no quiere montar infraestructura que
  cueste antes de ver el problema: **primero medir, y escalar con datos**.

## Decisión

### 1. Un directorio de acceso en el esquema común

El esquema común `bloky` guarda **quién puede entrar a dónde**, y nada de la operación:

- `persona`: id global, tipo y número de documento, celular y correo verificados, fechas.
- `membresia`: persona, copropiedad, **rol**, vigencia (`desde`, `hasta`), estado y **origen**:
  `bob` (Administrador, Delegado) o `bloky` (los perfiles que crea el administrador, CU-B-08).

Lo que hace cada perfil dentro de su copropiedad —grupos, permisos finos, lo que aprobó— vive en
el esquema de la copropiedad, enlazado por el id global de la persona. Así **una persona es una
sola en todo IDIKY**: puede ser administradora en un conjunto y propietaria en otro. El directorio
guarda datos personales: **lo mínimo** (Ley 1581 de 2012).

### 2. BOB avisa; el ingreso no depende de BOB

BOB sigue mandando sobre los perfiles raíz, pero **avisa a BLOKY cuando cambia una asignación**
(con la API de administración de ADR-0015 y su token), y BLOKY la copia al directorio. El
ingreso consulta solo el directorio: si BOB no responde, la gente igual entra. Se agrega una
conciliación periódica por si un aviso se pierde.

### 3. La copropiedad activa va en la dirección

`https://bloky…/c/<copropiedad>/…`. Quien administra varias puede tener **una pestaña por
copropiedad** sin que se pisen, y un enlace siempre abre la copropiedad correcta. Se cambia con
un selector en la barra. La sesión dice quién es la persona; la dirección, dónde está.

### 4. El rol se comprueba en cada petición

La sesión no guarda una lista de permisos por doce horas: cada petición nombra la copropiedad
y la API consulta la membresía vigente en el directorio (una tabla pequeña del esquema común).
**Quitar un rol corta el acceso de inmediato.** Los permisos se calculan **por copropiedad**: la
misma persona puede ser Administradora en una y solo de portería en otra.

### 5. La impersonación: soporte de IDIKY, con permiso de BOB

- **El permiso se da en BOB** al empleado de IDIKY («Puede entrar como soporte»); BLOKY lo lee
  como las demás asignaciones.
- El empleado **entra con su propio ingreso** (su documento y su código), busca la copropiedad y
  elige **«Entrar como Administrador»** (o Delegado): un clic.
- **Entra con el rol, no como la persona**: todo queda firmado como «*Ana (soporte IDIKY)*
  actuando como Administrador», nunca como si lo hubiera hecho el administrador real.
- **Solo lectura por defecto**; para escribir, escribe el **motivo** (queda registrado).
- **Una franja visible** en toda la pantalla dice dónde está y permite salir.
- **Vence sola** a las dos horas.
- **Se le avisa al administrador** de la copropiedad que soporte entró, cuándo y por qué.
- Queda en la **auditoría**: en el esquema común (quién, a dónde, cuándo, cuánto) y en el de la
  copropiedad (qué tocó).

### 6. El rendimiento: medir por copropiedad y decidir desde BOB

- **Sin cola de tareas ni trabajador aparte por ahora** (Daniel: cuesta operarlos y pagarlos antes
  de saber si hacen falta). Los procesos corren dentro de la API, como hoy.
- **BLOKY mide**: cada proceso pesado (liquidar, cerrar el mes, informes, importar Excel, envíos
  masivos) y toda petición que pase de un umbral registran en el esquema común (`consumo`):
  copropiedad, proceso, inicio, duración, registros procesados y resultado. Y una vez al día, el
  **tamaño de cada esquema**. Son métricas del servicio, no datos de la copropiedad.
- **BOB muestra «Consumo por copropiedad»**, leyendo la API de administración: las que más
  consumen, los procesos más lentos, la tendencia y un **semáforo** al cruzar umbrales. Con eso se
  decide **mudar una copropiedad a su propia base** (catálogo `conexion`, sin cambiar código),
  escalar el servicio o revisar su plan (docs/13 §2).
- **Dos protecciones sin costo**, del propio PostgreSQL: un **tiempo máximo por consulta**, y **un
  solo proceso pesado a la vez por copropiedad** (bloqueo consultivo: dos liquidaciones con doble
  clic no corren a la vez).
- **El código se organiza para poder separar después**: las rutas de BLOKY y las de ALICE en
  módulos distintos sobre el mismo dominio, de modo que, si las mediciones lo piden, se desplieguen
  como servicios aparte sin reescribir nada.

### 7. Nada cruza copropiedades por SQL

Un informe para quien administra varias copropiedades, o una métrica para IDIKY, se arma
consultando cada esquema y sumando en la API, nunca con un `JOIN` entre esquemas: así sigue
funcionando cuando una copropiedad se muda a otra base.

## Abierto

- **¿ALICE usa este mismo directorio y este mismo dominio** (su API sería un módulo más de este
  backend), o tendrá otro backend? Lo natural es un solo directorio para todo IDIKY, porque la
  misma persona puede ser propietaria en ALICE y administradora en BLOKY. Lo decide Daniel con
  Justo (T-80) antes de que ALICE arme su propio ingreso.
- Los umbrales del semáforo de consumo: se fijan con las primeras mediciones reales.

## Alternativas consideradas

| Opción | Veredicto |
|---|---|
| Leer siempre las asignaciones en BOB, sin directorio | Descartada: BOB no conoce los perfiles internos y sería un punto único de falla del ingreso |
| Perfiles internos solo en el esquema de cada copropiedad | Descartada: el ingreso tendría que recorrer todos los esquemas |
| Copropiedad activa guardada en la sesión | Descartada: dos pestañas se pisan y los enlaces no dicen a dónde van |
| Impersonar **como la persona** | Descartada: borra quién hizo qué; se entra con el rol y la firma propia |
| Cola de tareas y trabajador desde el principio | **Aplazada** (Daniel, 2026-10-03): primero medir; si BOB muestra que hace falta, se agrega con su ADR |

## Consecuencias

- T-77 construye también el directorio, el aviso de BOB, la medición y el informe de consumo en
  BOB; y CU-B-01 pasa a leer el directorio en vez de BOB.
- BOB gana un permiso («Puede entrar como soporte»), el aviso de asignaciones y el informe de
  consumo.
- La primera señal de un problema de rendimiento será un número en BOB, no una queja de un cliente.
