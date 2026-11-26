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
| **Administrador Idiky** | No aplica | El **primero** se crea al instalar el sistema (es el dueño); los demás, **otro Administrador Idiky** | **Otro Administrador Idiky**, nunca él mismo; **siempre queda al menos uno activo** |
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
| **Familiar o acompañante** | Residente · Residente Temporal · No Residente · **Residente Recurrente** | **Propietario o arrendatario** | **Quien lo creó, o el perfil superior a quien lo creó** |

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
| 4 | 2026-11-26 | **Al familiar o acompañante lo crean el propietario o el arrendatario** (*«lo pueden crear el propietario o arrendatario»*). |
| 5 | 2026-11-26 | **Administrador Idiky**, el rol más alto (el dueño, el equipo de IDIKY): el primero se crea al instalar el sistema; los demás los crea otro Administrador Idiky. Lo inactiva **otro** Administrador Idiky, nunca él mismo, y **siempre queda al menos uno activo**: así IDIKY nunca queda sin dueño y quien se va o pierde su clave se bloquea el mismo día. Propuesta aceptada por Mary (*«sí, déjalo así»*). |

## 3. Lo que la tabla todavía no dice — preguntar a Mary

1. **Qué puede hacer cada usuario**: hay una **propuesta** en la §4 bis, por confirmar.

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

## 4 bis. Qué puede ver y hacer cada usuario — ⏳ PROPUESTA, por confirmar con Mary

> **No es obligatoria todavía:** es la propuesta del 2026-11-26 para que Mary la revise. Cuando la
> confirme, pasa a la §1 y la aplica la matriz de BOB y el middleware (ADR-0034: Ver · Crear ·
> Editar · Anular, por rol y módulo). **Lo que fija la ley no se configura** (quién vota, quórum,
> poderes): manda la Ley 675. Las celdas con ✅ ya las confirmó Mary.

**Cómo se lee:** **G** gestiona todo el edificio (ve, crea, edita y anula) · **V** ve todo el
edificio · **S** lo de su unidad: lo ve y lo pide · **s** solo ve lo de su unidad · **—** no lo ve:
**no se le muestra** (Mary, 2026-11-20) · **Soporte** solo con pase de impersonación, que queda
registrado (ADR-0034).

Columnas: **AI** Administrador Idiky · **AC** Administrador Copropiedad · **Del** Delegado ·
**Aux** Auxiliar Administrativo · **Cont** Contador · **RF** Revisor Fiscal · **Port** Portería ·
**Pisc** Piscinero · **Prop** Propietario · **Arr** Arrendatario · **Fam** Familiar o acompañante ·
**Vis** Visitante.

| Módulo | AI | AC | Del | Aux | Cont | RF | Port | Pisc | Prop | Arr | Fam | Vis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Contrato y alta de la copropiedad (BOB) | G | V | V | — | — | — | — | — | — | — | — | — |
| 2. Estructura, unidades y parametrización | Soporte | G | G | V | V | V | — | — | — | — | — | — |
| 3. Usuarios: crear e inactivar (según la §1) | G | G | G | V | — | — | — | — | S | S | — | — |
| 4. Cartera: cuotas, estado de cuenta, pagos y acuerdos | Soporte | G | G | V ✅ | G | V | — | — | S | S | — | — |
| 5. Paz y salvo y certificados | Soporte | G | G | G | G | V | — | — | S | S | — | — |
| 6. Contabilidad (la contable) | — | V | V | — | G | V | — | — | — | — | — | — |
| 7. Cuentas claras e informes | — | G | G | V | G | V | — | — | V | V | V | — |
| 8. Asambleas: citación, documentos, asistencia y actas | Soporte | G | G | V | V | V | — | — | S | s ¹ | — | — |
| 9. Votar y dar poder | — | — | — | — | — | — | — | — | Ley | Con poder ¹ | — | — |
| 10. Reservas de zonas comunes | Soporte | G | G | G | — | — | V | V ² | S | S | — ✅ | — |
| 11. PQRS | Soporte | G | G | G | — | V | — | — | S | S | — ✅ | — |
| 12. Comunicados, encuestas y calendario | Soporte | G | G | G | V | V | V | V | V ³ | V ³ | V | V ⁴ |
| 13. Visitantes y accesos | Soporte | V | V | V | — | — | G | — | S | S | s | s ⁵ |
| 14. Correspondencia y objetos perdidos | Soporte | G | G | G | — | — | G | — | s | s | s | — |
| 15. Minuta y novedades | Soporte | V | V | V | — | V | G | S ² | — | — | — | — |
| 16. Trasteos y obras en apartamentos | Soporte | G | G | G | — | — | V ⁶ | — | S | S | — | — |
| 17. Documentos y proyectos del edificio | Soporte | G | G | G | V | V | — | — | V | V | V | — |
| 18. Pedir ayuda | — | V | V | V | — | — | G ⁷ | — | S | S | S | S ⁴ |
| 19. Clasificados entre vecinos | Soporte | G ⁸ | G ⁸ | — | — | — | — | — | S | S | S | — |
| 20. Vehículos y mascotas | Soporte | G | G | G | — | — | V | — | S | S | s | — |

¹ El arrendatario no vota: la asamblea es de propietarios. Ve la asamblea y vota **solo si tiene
poder** del propietario (RN-30). ² El piscinero, solo lo de la piscina: sus reservas y las novedades
que registra. ³ Responde las encuestas de su unidad (una por unidad). ⁴ Solo el visitante con marca
de **Residente Temporal**. ⁵ Su pase de entrada. ⁶ Marca el trasteo como realizado. ⁷ Atiende el
pedido de ayuda. ⁸ Modera: retira un aviso que no cumple las normas.

**Para que Mary decida:**
1. ¿El **Administrador Idiky** entra a los datos de la copropiedad solo como **soporte** (con pase y
   rastro), o los ve siempre?
2. ✅ **Respondida (Mary, 2026-11-26):** el **Auxiliar Administrativo solo ve la cartera** (*«solo ve la cartera»*): no registra pagos, ni acuerdos, ni ajustes.
3. ✅ **Respondida (Mary, 2026-11-26):** el Familiar o acompañante **no puede reservar zonas comunes ni radicar PQRS** (*«no puede reservar zonas comunes y radicar PQRS»*).
4. ¿El **Revisor Fiscal** ve las **PQRS** (control) o no?
5. ✅ **Respondida (Mary, 2026-11-26):** el **Piscinero no necesita nada más** (*«el piscinero no necesita nada más»*): su columna queda como está.

## 5. Historia

| Fecha | Qué | Quién |
|---|---|---|
| 2026-11-26 | Primera versión, desde `roles-de-alice.xlsx` | Mary |
| 2026-11-26 | Se agrega el **Delegado** (en el Excel y aquí), con lo que dice `docs/13` §3 | Mary |
| 2026-11-26 | Quién inactiva al **familiar o acompañante** (en el Excel y aquí) | Mary |
| 2026-11-26 | Quién crea al **familiar o acompañante** (en el Excel y aquí) | Mary |
| 2026-11-26 | Quién crea e inactiva al **Administrador Idiky** (en el Excel y aquí) | Mary |
| 2026-11-26 | **Propuesta** de qué puede ver y hacer cada usuario (§4 bis), por confirmar | IA, para Mary |
