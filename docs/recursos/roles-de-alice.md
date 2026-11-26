# Roles de ALICE — la tabla que manda (Mary, 2026-11-26)

> **Para desarrolladores y agentes de IA: esta tabla es obligatoria.** Define los usuarios de las
> aplicaciones de IDIKY, quién crea a cada uno y quién lo inactiva. ALICE, BLOKY, BOB y el
> middleware **se rigen por ella**. **Si necesitas un rol, una marca o un permiso distinto, o si
> algo de tu código o de otra regla la contradice, no lo cambies: pregúntale a Mary**, que es la
> dueña de esta tabla. Mientras no responda, se construye lo que dice la tabla.
>
> **La fuente original** es el Excel [`roles-de-alice.xlsx`](./roles-de-alice.xlsx) (hoja
> «Usuarios»). Esta página lo transcribe tal cual para que se pueda buscar y leer en el repositorio.
> Si los dos no coinciden, manda el Excel; avísale a Mary para corregir la transcripción.

## 1. Los usuarios

| Usuario | Marca de residencia | Quién lo crea | Quién lo inactiva |
|---|---|---|---|
| **Administrador Idiky** | No aplica | *(vacío en la tabla)* | *(vacío en la tabla)* |
| **Administrador Copropiedad** | No aplica | Administrador Idiky | Administrador Idiky |
| **Delegado** | No aplica | Administrador Idiky | Administrador Idiky, **solo por solicitud directa** a `operaciones@idiky.com`, con el soporte |
| **Portería** | No aplica | Administrador Copropiedad | Administrador Copropiedad |
| **Auxiliar Administrativo** | No aplica | Administrador Copropiedad | Administrador Copropiedad |
| **Contador** | No aplica | Administrador Copropiedad | Administrador Copropiedad |
| **Revisor Fiscal** | No aplica | Administrador Copropiedad | Administrador Copropiedad |
| **Piscinero** | No aplica | Administrador Copropiedad | Administrador Copropiedad |
| **Propietario** | Residente · Residente Temporal · No Residente | El Administrador Copropiedad crea **un** propietario; si hay más propietarios, **los crea ese primer propietario** | Igual: el Administrador Copropiedad al primero; los demás, el propietario que creó el Administrador |
| **Arrendatario** | Residente · Residente Temporal · No Residente | Propietario | Propietario |
| **Visitante** | Residente · Residente Temporal · No Residente | Propietario y arrendatario. **Solo el propietario** puede crear un visitante con marca de **Residente Temporal** | Propietario y arrendatario |
| **Familiar o acompañante** | Residente · Residente Temporal · No Residente · **Residente Recurrente** | *(vacío en la tabla)* | **Quien lo creó, o el perfil superior a quien lo creó** |

## 2. Cómo se lee

- **Usuario** es el papel de la persona en la aplicación. **La marca de residencia** es aparte: dice
  si esa persona vive en la unidad (**Residente**), si vive por un tiempo (**Residente
  Temporal**), si no vive ahí (**No Residente**) o, solo para el familiar o acompañante, si
  viene con frecuencia (**Residente Recurrente**). Un propietario, por ejemplo, puede ser residente o
  no residente.
- **El Delegado** (2026-11-26) es el otro perfil raíz de la copropiedad, junto al Administrador
  Copropiedad, y no es la misma persona que él. Con consejo de administración, es su presidente; sin
  consejo, lo nombra la asamblea. Lo crea y lo cambia IDIKY desde BOB
  ([`docs/13`](../13-bob-copropiedades-y-contratos.md) §3).
- **Los usuarios de la administración** (Portería, Auxiliar Administrativo, Contador, Revisor Fiscal,
  Piscinero) **los crea y los inactiva el Administrador Copropiedad**, y no llevan marca de
  residencia.
- **Nadie se borra: se inactiva**, siempre con quién y cuándo (regla del proyecto).

## 2 bis. Decisiones de Mary sobre la tabla

| # | Fecha | Decisión |
|---|---|---|
| 1 | 2026-11-26 | Se incluye al **Delegado** (§1): lo crea el Administrador Idiky y lo inactiva el Administrador Idiky solo por solicitud directa a `operaciones@idiky.com`, con el soporte. **Confirmado por Mary** (*«lo definido para el delegado está okey»*). |
| 2 | 2026-11-26 | **«Conviviente» no existe** en la legislación ni en la terminología colombiana de propiedad horizontal: *«Conviviente no existe en la legislación o en la terminología colombiana»*. **No se usa** en pantallas, mensajes, documentos ni en el código nuevo. Quien vive en la unidad sin ser propietario ni arrendatario es **Familiar o acompañante** (o Visitante), con su **marca de residencia**. |
| 3 | 2026-11-26 | **Al familiar o acompañante lo inactiva quien lo creó o el perfil superior a ese** (*«lo inactiva el que lo creó o el perfil superior a este»*). Por ejemplo, si lo creó el arrendatario, lo inactiva el arrendatario o el propietario. **Esta lectura la confirmó Mary** (*«sí, está bien»*). |

## 3. Lo que la tabla todavía no dice — preguntar a Mary

1. **Familiar o acompañante:** quién lo crea (la celda está vacía). Quién lo inactiva ya está (decisión 3).
2. **Administrador Idiky:** quién lo crea y quién lo inactiva (es el equipo de IDIKY; las celdas
   están vacías).
3. **Qué puede hacer cada usuario** (la matriz de permisos por usuario): la tabla dice quién crea a
   quién, no qué ve cada uno.

## 4. Lo que hoy choca con la tabla — para que Mary y Daniel lo concilien

**No lo resuelvas por tu cuenta.** Hasta que Mary y Daniel lo decidan, no se construye nada nuevo que
contradiga la tabla.

| Dónde | Qué dice hoy | Qué dice la tabla |
|---|---|---|
| RN-366 y RN-398 (`docs/05-modelo-de-datos.md`), BLOKY y BOB | Cuatro roles en la unidad: Propietario · Arrendatario · **Residente** (identificador `conviviente`, que según la decisión 2 **no debe existir**: hay que cambiarlo en la API, la matriz y la base) · **Invitado** | **Propietario · Arrendatario · Visitante · Familiar o acompañante**, y «Residente» es una **marca de residencia**, no un rol |
| RN-366 | El invitado tiene fechas | El **Visitante** con marca de **Residente Temporal** solo lo crea el propietario |
| La maqueta `apps/pwa` (`dominio/tipos.ts`, `RolResidencia`) | `propietario` · `arrendatario` · `familiar` · `autorizado` | Falta «Visitante» como usuario de la unidad; «autorizado» no está en la tabla |
| `docs/03-actores-y-roles.md` | Residente · Propietario no residente · Administrador · Portería · Consejo | Faltan Auxiliar Administrativo, Contador, Revisor Fiscal y Piscinero; el consejo no es un usuario de la tabla |
| `docs/23-propietario-arrendatario-y-vinculos.md` (Justo) | Propietario · arrendatario · conviviente · invitado | Lo mismo que la primera fila |

## 5. Historia

| Fecha | Qué | Quién |
|---|---|---|
| 2026-11-26 | Primera versión, desde `roles-de-alice.xlsx` | Mary |
| 2026-11-26 | Se agrega el **Delegado** (en el Excel y aquí), con lo que dice `docs/13` §3 | Mary |
| 2026-11-26 | Quién inactiva al **familiar o acompañante** (en el Excel y aquí) | Mary |
