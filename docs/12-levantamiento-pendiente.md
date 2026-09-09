# 12 — Levantamiento pendiente (preguntas abiertas)

El demo v0.1 se construyó sobre **supuestos de un conjunto residencial típico**, no sobre el
alcance definitivo del producto. Este documento existe para capturar lo que todavía no se ha
definido.

> **Cómo usarlo:** respondan directamente debajo de cada pregunta, en este archivo, y súbanlo.
> Cada respuesta se convierte después en un caso de uso, una regla de negocio o un ADR.
> Lo que quede sin responder sigue siendo un supuesto, y los supuestos se marcan como tales.

---

## 0. Alcance declarado por el equipo — 2026-08-26

Mary describió el producto que se quiere construir. **Esta es la primera definición de
alcance que viene del equipo y no de un supuesto**, así que manda sobre el demo v0.1.

> «Una aplicación fácil de acceder para propietarios de una propiedad horizontal donde
> puedan consultar la cuota de pago del mes, un informe del estado de cuenta, descargar
> certificados de paz y salvo, tener su comprobante de pago, crear solicitudes hacia el
> administrador, la gestión de zonas comunes, citaciones de asambleas, transmisión en vivo
> de asambleas, habilitación de votaciones, la posibilidad de recibir poder de otro
> copropietario para las votaciones, generar el acta, tener los coeficientes.»

### Qué significa esto frente a lo que ya existe

| # | Lo pedido | Estado en el demo v0.1 | Caso de uso |
|---|---|---|---|
| 1 | Consultar la cuota del mes | ✅ Ya existe | CU-R-03 |
| 2 | Informe del estado de cuenta | 🟡 Se ve en pantalla, **no se descarga** | CU-R-18 *(nuevo)* |
| 3 | Descargar certificado de paz y salvo | ⬜ No existe | CU-R-12 · CU-A-13 |
| 4 | Comprobante de pago | 🟡 Se ve al pagar, **no se descarga ni se consulta después** | CU-R-19 *(nuevo)* |
| 5 | Crear solicitudes hacia el administrador | ✅ Ya existe (PQRS) | CU-R-07 · CU-R-08 |
| 6 | Gestión de zonas comunes | ✅ Ya existe | CU-R-05 · CU-R-06 · CU-A-06 |
| 7 | Citaciones de asamblea | ⬜ No existe | CU-R-20 *(nuevo)* · CU-A-12 |
| 8 | Transmisión en vivo de la asamblea | ⬜ No existe | CU-R-21 · CU-A-17 *(nuevos)* |
| 9 | Habilitación de votaciones | ⬜ No existe | CU-R-13 · CU-A-18 *(nuevo)* |
| 10 | Recibir poder de otro copropietario | ⬜ No existe | CU-R-22 · CU-R-23 · CU-A-19 *(nuevos)* |
| 11 | Generar el acta | ⬜ No existe | CU-A-20 *(nuevo)* |
| 12 | Tener los coeficientes | 🟡 El dato existe, **el copropietario no lo ve** | CU-R-24 · CU-A-21 *(nuevos)* |

### Las tres conclusiones que cambian el plan

1. **La asamblea es el núcleo del producto, no un módulo de fase 4.** Seis de los doce
   puntos (7 a 12) son asamblea. El roadmap la tenía en la penúltima fase; se movió.
   Ver [`07-roadmap.md`](./07-roadmap.md).

2. **Hay que generar documentos descargables (PDF) y el demo no genera ninguno.** Paz y
   salvo, informe de estado de cuenta, comprobante de pago y acta son cuatro documentos
   formales. Es una capacidad transversal nueva que **exige un ADR** (hoy no hay ninguna
   dependencia que lo haga). → ADR-0006, pendiente.

3. ~~**La transmisión en vivo no se construye, se integra.**~~ → ✅ **Resuelto el 2026-09-10
   con [ADR-0007](./adr/0007-transmision-en-vivo.md).** La pregunta estaba mal puesta: no era
   qué proveedor, sino que **el video no es de Idiky en ninguna modalidad**. Mary: *«las
   asambleas se pueden hacer por Zoom o por Meet»* y *«una asamblea puede ser virtual o
   presencial; debemos partir de ahí»*. Idiky enlaza la reunión que la copropiedad ya hace y
   se queda con lo insustituible —asistencia ponderada, votación, acta—. **Sin dependencias
   nuevas y sin costo por minuto.**

### Lo que quedó sin mencionar — pendiente de confirmar

El demo tiene tres módulos funcionando que **no aparecen en la descripción del alcance**:
**visitantes con código**, **correspondencia** y **cartelera de comunicados**. No se
borraron, pero tampoco se pueden dar por vigentes.

> ❓ **Pregunta abierta:** ¿esos tres módulos entran en la primera versión, quedan para
> después, o salen del producto? Mientras no se responda, se mantienen como están y no se
> invierte más trabajo en ellos.

---

## 1. Producto y negocio

- ¿A quién le vendemos: **al administrador**, a la **copropiedad**, o a una **empresa
  administradora** con varios conjuntos? → *(respuesta)*
- ¿Un administrador manejará **una** copropiedad o **varias** desde la misma cuenta?
  (Hoy está previsto como fase 3, CU-A-15.) → *(respuesta)*
- ¿El producto es para un solo país o desde el inicio debe soportar varios? Esto afecta
  moneda, formato de fechas, impuestos y normativa. → *(respuesta)*
- ¿Hay un producto competidor de referencia con el que nos vamos a comparar? → *(respuesta)*

## 2. Alcance funcional

Para cada módulo: **¿entra en la primera versión real, en una posterior, o no va?**

Estados: `✅ v1` entra en la primera versión · `⬜ Después` · `❌ No va` · `❓ Sin confirmar`

Actualizada con el alcance de la §0. Lo marcado `❓` **no fue mencionado** por el equipo:
hay que responderlo explícitamente, no asumirlo.

| Módulo | ¿Entra? | Notas |
|---|---|---|
| Cartera y cuotas de administración | ✅ v1 | Consultar la cuota del mes es el punto de entrada |
| **Documentos descargables (PDF)** | ✅ v1 | Paz y salvo, estado de cuenta, comprobante, acta. **Nuevo — requiere ADR-0006** |
| **Asambleas: citación, transmisión, votación, poderes, acta** | ✅ v1 | **Es el núcleo del producto**, no un extra |
| **Coeficientes visibles al copropietario** | ✅ v1 | Además de dato interno, es el peso del voto |
| Paz y salvo | ✅ v1 | Debe poder **descargarse**, no solo consultarse |
| Reservas de zonas comunes | ✅ v1 | Ya funciona en el demo |
| PQRS | ✅ v1 | «Crear solicitudes hacia el administrador» |
| Pagos en línea (pasarela) | ❓ Sin confirmar | Se pidió el **comprobante**; no se dijo si el pago se hace dentro de la app |
| Comunicados / cartelera | ❓ Sin confirmar | No mencionado. Hoy implementado |
| Correspondencia | ❓ Sin confirmar | No mencionado. Hoy implementado |
| Visitantes con código | ❓ Sin confirmar | No mencionado. Hoy implementado |
| Portería: minuta y validación de ingreso | ❓ Sin confirmar | No mencionado |
| Presupuesto y contabilidad | ❓ Sin confirmar | No mencionado |
| Proveedores y mantenimientos | ❓ Sin confirmar | No mencionado |
| Encuestas a residentes | ❓ Sin confirmar | No mencionado. Se solapa con «votaciones» |
| Chat entre residentes | ❓ Sin confirmar | No mencionado |
| Reserva de parqueaderos de visitantes | ❓ Sin confirmar | No mencionado |
| Control de mascotas | ❓ Sin confirmar | No mencionado |
| **Multas y sanciones por convivencia** | ✅ v1 | Pedido el 2026-08-27. **CU-A-23 desbloqueado el 2026-09-09**: el debido proceso lo fija el reglamento y la app lo parametriza (§3 quater, RN-69) |
| ~~Cobros adicionales por unidad~~ | ⛔ | **Retirado el 2026-09-09**: son la cuota extraordinaria, no una figura aparte (RN-73). CU-A-24 retirado |
| Facturación electrónica | ❓ Sin confirmar | No mencionado |

## 3. Funcionamiento de la copropiedad real

- ¿Las cuotas se facturan **por anticipado o vencidas**? ¿Qué día vencen?
  *(Supuesto actual: vencen el día 10 del periodo — RN-23.)* → *(respuesta)*
- ~~¿Cómo se calcula el **interés de mora**?~~ → ✅ **Respondido en parte (Mary, 2026-08-27):**
  según la normativa vigente en Colombia, y **configurable por copropiedad**, porque no todas
  lo cobran (RN-42, CU-A-25). Lo que falta de esa respuesta está en §3 quinquies.
- ¿Qué pasa con una unidad en mora: pierde voto, pierde reservas, ambas?
  *(Supuesto actual: pierde reservas — RN-08.)* → *(respuesta)*
- ¿El valor de la cuota se define **por coeficiente**, por tipo de unidad, por área, o es
  fijo? *(Supuesto actual: por coeficiente — RN-05.)* → *(respuesta)*
- ¿Cuál es el **plazo real de respuesta** a una PQRS? *(Supuesto actual: 15 días — RN-13.)*
  → *(respuesta)*
- ¿Las reservas de zonas comunes tienen **depósito o cobro**? ¿Sanción por no cancelar?
  → *(respuesta)*

## 3 bis. Asambleas — preguntas que bloquean el diseño

Este módulo es el núcleo del producto (§0) y es el que tiene **consecuencias legales**.
Ninguna de estas preguntas se puede resolver con un supuesto razonable: hay que leer el
reglamento de la copropiedad y la Ley 675 de 2001.

- ~~**Peso del voto:** ¿cada unidad vale un voto, o el voto se pondera por coeficiente?~~
  → ✅ **Respondido (Mary, 2026-08-26):** el coeficiente es un dato de consulta para los
  usuarios **y es el que se usa para las votaciones en asamblea**. RN-27 queda confirmada e
  implementada en `pesoDelVoto()`.
  *Nota:* esto confirma el **peso del voto**, no cómo se mide el **quórum** — sigue abierto
  justo debajo.
- **Quórum:** ¿qué porcentaje de coeficientes se necesita para instalar la asamblea? ¿Hay
  segunda convocatoria con quórum menor? → *(respuesta)*
- **Mayorías:** ¿qué decisiones exigen mayoría simple, cuáles calificada (70 %), cuáles
  unanimidad? El reglamento manda sobre esto. → *(respuesta)*
- **Poderes — el tope:** ¿cuántos poderes puede acumular un apoderado, y hasta qué
  porcentaje de coeficientes puede representar? La Ley 675 fija un límite; **hay que
  confirmar el artículo y la cifra exacta antes de implementar RN-30**. → *(respuesta)*
- **Poderes — la forma:** ¿basta con otorgarlo dentro de la app, o la ley exige documento
  escrito y firmado? Si exige firma, ¿sirve una firma electrónica? → *(respuesta)*
- **Poderes — a quién:** ¿se puede dar poder a cualquier copropietario, o hay
  inhabilidades (administrador, empleados, consejo)? → *(respuesta)*
- **Arrendatario y voto:** ¿vota el arrendatario, o solo el propietario? La app muestra el
  rol en la unidad, pero no restringe nada todavía. → *(respuesta)*
- **Mora y voto:** ¿el copropietario en mora puede votar? ¿Puede recibir poderes?
  *(Hoy la mora solo bloquea reservas — RN-08.)* → *(respuesta)*
- **Asistencia:** ¿la asamblea es presencial, virtual o mixta? Si es mixta, ¿el quórum
  suma las dos? → *(respuesta)*
- **Transmisión:** ¿la transmisión debe quedar **grabada** como soporte del acta? Eso
  cambia el costo de almacenamiento y el proveedor. → *(respuesta)*
- **Acta:** ¿quién la firma y cómo? ¿Necesita aprobación de una comisión verificadora
  antes de publicarse? → *(respuesta)*
- **Acta:** ¿debe seguir un formato o plantilla específica de la copropiedad?
  → *(respuesta)*

## 3 ter. Documentos descargables

- **Paz y salvo:** ¿qué condición exacta debe cumplir una unidad para obtenerlo — saldo en
  cero, o saldo en cero más ninguna sanción pendiente? → *(respuesta)*
- ~~¿El paz y salvo tiene **vigencia** y consecutivo? ¿Quién lo firma?~~ → ✅ **Respondido
  (Mary, 2026-08-28, con un modelo real):** el documento **no declara vigencia**; declara
  **hasta qué día** la unidad está al día. Lleva consecutivo, y **lo firma el administrador**
  con su nombre, cédula, cargo y contacto. Si además se le quiere dar un plazo de validez al
  papel, eso está sin decidir.
- ¿El copropietario lo descarga solo, o el administrador debe autorizarlo primero?
  *(Cambia si es CU-R-12 automático o CU-A-13 manual.)* → *(respuesta)*
- ¿Los documentos deben poder **verificarse** después (código QR, número de verificación)?
  → **Parcial (2026-08-28):** el documento ya sale con número y código de verificación, para
  confirmarlo llamando a la administración. Una **página pública** que lo confirme sin llamar
  queda diferida ([ADR-0006](./adr/0006-documentos-formales.md)); falta decidir si hace falta.
- ¿El comprobante de pago es un recibo de caja informal o debe ser un documento con
  requisitos fiscales? → *(respuesta)*

## 3 quater. Multas y cobros adicionales — el debido proceso

Mary pidió (2026-08-27) que el administrador pueda cobrar **cuotas adicionales** y **multas**,
y que dentro de multas exista un subnivel para definir cuáles existen. Quedó documentado en
CU-A-22, CU-A-23 y CU-A-24 — de los cuales **CU-A-24 se retiró el 2026-09-09**: las cuotas
adicionales resultaron ser las extraordinarias (RN-73).

**Antes de construirlo hay que responder esto**, porque una multa mal impuesta es nula:

- ~~**Debido proceso.**~~ → ✅ **Respondido (Mary, 2026-09-09):** *«el debido proceso ya está
  reglamentado»*. **No lo decide la app, lo dice el reglamento de cada copropiedad**, así que
  los plazos son **parámetros** (`Copropiedad.diasDescargos`, `diasImpugnacion`) y no
  constantes del código (RN-69). Los pasos implementados son: notificar → descargos →
  decisión motivada → impugnación → firmeza. **Falta** el número concreto de días de *esta*
  copropiedad; el demo usa 10 y 5 como ejemplo.
- ~~**Quién impone.**~~ → ✅ **Respondido (Mary, 2026-09-09):** *«la multa la impone el
  administrador de acuerdo con las multas aprobadas en asamblea, en el reglamento de propiedad
  horizontal, etc.»*. El administrador **aplica**, no decide: por eso el expediente **copia la
  norma** (`Sancion.respaldo`) y la muestra al lado de los hechos.
- ~~**Quién decide los descargos.**~~ → ✅ **Respondido (Mary, 2026-09-09):** *«quien hace el
  debido proceso es el administrador»* — el mismo, de principio a fin. No es un descuido que
  sea la misma persona: no está decidiendo sobre la norma sino sobre si los hechos ocurrieron.
  Lo que lo controla es que todo quede escrito y que el copropietario pueda impugnar (RN-69).
- ~~**El valor.**~~ → ✅ **Respondido (Mary, 2026-09-09):** *«el administrador no puede
  ajustar el valor»*. Es fijo por concepto: el que fija el documento, copiado al imponer
  (RN-37). Era **el límite entre parametrizar e imponer** (RN-49 / RN-50), y queda del lado
  correcto — el administrador configura la regla, no toca el caso. En el código no es una
  restricción de pantalla: `imponerSancion` **no recibe un valor**, así que no hay por dónde
  pasarlo.
- ~~**Sin artículo del reglamento.**~~ → ✅ **Respondido (Mary, 2026-08-27):** una multa solo
  se da si **está en el reglamento o fue aprobada en asamblea**. El respaldo es obligatorio:
  sin él, el concepto no se crea. Es el mismo principio que rige la tasa de interés (RN-45).
- ~~**Reincidencia.**~~ → ✅ **Respondido (Mary, 2026-09-09):** *«la multa por reincidencia
  debe estar avalada por la asamblea, reglamento de propiedad horizontal, etc.»*. Es RN-38
  aplicada al agravante: sube **solo si un documento lo dice**, y ese documento se cita aparte
  —puede no ser el mismo que fija la multa base— (RN-72). Sin parametrizarlo, la multa no sube.
  Y **caduca al año** (Mary, 2026-09-09): un antecedente deja de agravar pasada la ventana, que
  es un parámetro de la copropiedad (`mesesReincidencia`, doce aquí) por lo mismo que los
  plazos del debido proceso. Se cuenta **desde la imposición** del antecedente, no desde su
  firmeza: si contara desde la firmeza, un proceso largo alargaría la ventana y quien se
  defendió quedaría expuesto más tiempo que quien no dijo nada.
- ~~**Multa anulada después de pagada.**~~ → ✅ **Disuelta (Mary, 2026-09-09):** *«una multa no
  se anula porque para eso existe el debido proceso»*. El momento de deshacerla es **durante**
  el proceso, archivándola; después no hay marcha atrás, y por eso la pregunta no tiene objeto.
  Si la multa se pudiera anular al final, las cinco etapas serían decorativas (RN-70).
- ~~**Efecto de la multa en otros derechos.**~~ → ✅ **Respondido (Mary, 2026-09-09):** *«las
  multas como las cuotas ordinarias o extraordinarias cuentan como mora»*. **La mora no
  distingue el origen del cobro** (RN-71): una multa en firme y vencida bloquea reservas
  (RN-08) y pesa en el paz y salvo (RN-26) igual que la cuota del mes.
- ~~**Cuotas adicionales.**~~ → ⛔ **La pregunta se disolvió (Mary, 2026-09-09):** *«me
  retracto, las cuotas adicionales son lo mismo que cuotas extraordinarias»*. No había una vía
  aparte que documentar: lo que se cobra fuera de la ordinaria es la **extraordinaria**, que
  aprueba la asamblea (RN-46), lleva destinación específica (RN-48) y se prorratea por
  coeficiente (RN-05). **CU-A-24 se retiró y RN-41 con él** (RN-73).
  **Lo que quedó vivo de aquí** es el trabajo que la figura inventada estaba tapando: que la
  extraordinaria **exija el acta que la aprobó**. Hoy `generarCuotas()` la crea sin pedirla, y
  es lo que tiene a CU-A-05 en 🟡.

> ✅ **§3 quater quedó respondida el 2026-09-09**, la sección entera — la primera del
> levantamiento que se cierra. La última pregunta no se respondió: **se disolvió**, porque la
> figura por la que preguntaba no existe.
>
> ~~**Mientras no haya respuestas, no se implementa CU-A-23.**~~ → **Levantado el 2026-09-09.**
> CU-A-23 y CU-R-29 están construidos sobre la respuesta de Mary: la app **no fija** el debido
> proceso, lo parametriza. Las preguntas que siguen abiertas arriba no bloquean el flujo —lo
> afinan—, y ninguna de ellas puede llevar una multa a la cartera sin pasar por las cinco
> etapas: la cuota nace en un solo sitio del código (RN-39).

## 3 quinquies. Interés de mora — lo que falta de la respuesta

Ya está decidido que se calcula según la normativa colombiana y que cada copropiedad elige si
lo cobra. Falta lo que **no podemos suponer sin equivocarnos**:

- **El tope legal.** ¿Cuál es el tope por encima del cual el cobro es usura, según la Ley 675?
  *No lo escribimos de memoria: un número mal puesto expone a la copropiedad.* Es lo único que
  el sistema necesita de la ley — **la tasa en sí la pone cada copropiedad** (reglamento o
  asamblea), la ley solo pone el techo. → *(respuesta)*
- ~~**Quién mantiene la tasa actualizada.**~~ → ✅ **Respondido (Mary, 2026-08-27):** la
  registra **el administrador de cada copropiedad**.
  *Consecuencia:* la tasa la teclea una persona, así que la app tiene que protegerla de
  equivocarse — avisar cuando la tasa vigente está vieja y rechazar una que supere el tope
  legal. Eso hace **más urgente** confirmar cuál es ese tope (pregunta de arriba).
- **Si la asamblea no ha aprobado ninguna tasa.** ¿Se cobra el máximo legal por defecto, o
  no se cobra nada hasta que haya aprobación? *(Lo segundo es lo prudente, pero es una decisión
  del equipo.)* → *(respuesta)*
- **Una tasa aprobada por asamblea, ¿desde cuándo rige?** ¿Desde el acta, desde su aprobación,
  desde el periodo siguiente? → *(respuesta)*
- **Sobre qué se liquida.** ¿Sobre el saldo vencido total, o cuota por cuota desde su
  vencimiento? → *(respuesta)*
- **Cada cuánto se liquida.** ¿Diario, mensual al cerrar el periodo? → *(respuesta)*
- **El interés, ¿genera interés?** ¿Se capitaliza o no? *(Habitualmente no, pero hay que
  confirmarlo.)* → *(respuesta)*
- **Al ponerse al día.** Si alguien paga todo lo vencido, ¿se le cobra el interés corrido hasta
  ese día? ¿Se puede condonar, y quién lo autoriza? → *(respuesta)*
- **Interés impago.** ¿Cuenta como mora para bloquear reservas (RN-08) y para el paz y salvo
  (RN-26)? → *(respuesta)*

## 3 sexies. Las cédulas del registro de personas — lo que bloquea producción

Desde el 2026-09-07 registrar a alguien **que se queda a dormir** —residente o residente
temporal— exige **foto de su documento de identidad y foto de la persona** (RN-57). El
visitante no sube fotos, así que **el problema es más chico de lo que parecía**: no se acumulan
cédulas de gente que vino una tarde, solo de quien vive ahí.

El demo las guarda en el navegador de quien las sube y no las manda a ningún lado, así que ahí
no hay problema. **En producción sí lo hay**, y no es técnico: una foto de cédula es un dato
personal y en Colombia lo cubre la **Ley 1581 de 2012 (habeas data)**.

Lo que hay que decidir antes de que esto salga a un servidor:

| Pregunta | Por qué no se puede dejar para después | Respuesta |
|---|---|---|
| ¿Con qué **autorización** se recoge, y para qué? | El titular tiene que autorizar el tratamiento y saber el fin | **Respondida (2026-09-07)**: autorización informada, expresa y registrada con versión, antes de subir las fotos (RN-66). **Falta que la revise un abogado** — el texto es un borrador de trabajo |
| ¿**Cuánto se conserva**? | La cédula de un arrendatario que se fue hace tres años no puede seguir ahí. Y un residente temporal que estuvo dos meses, menos | *(pendiente)* |
| ¿**Quién la ve**? | Cada respuesta es un permiso distinto en el modelo | **Respondida (Mary, 2026-09-07)**: quien registró y la administración ven las dos, y **después de autorizar queda constancia de quién las abre**; la portería ve **solo el rostro**, porque necesita reconocer a quien entra pero no tener su identidad (RN-67) |
| Al **inhabilitar** a la persona, ¿la foto se borra? | RN-61 dice que nada se borra; un dato personal sí puede tener que borrarse | **Resuelto en principio (Mary, 2026-09-07)**: *«me refería a conservar el registro; la documentación se debe guardar el tiempo que la normatividad lo permita»*, y *«si el registro se habilita nuevamente y ya no tenemos los documentos se solicitan nuevamente»*. El registro queda, las fotos tienen plazo, y rehabilitar es volver a registrar. **Falta el plazo concreto que fija la norma y el proceso que borra las fotos al cumplirse** |
| ¿**Dónde** se almacena? | Un servidor con las cédulas de un conjunto entero es un objetivo, no un archivo | *(pendiente)* |

Detalle técnico y lo ya decidido: [ADR-0009](./adr/0009-soportes-fotograficos.md).

## 4. Usuarios y roles

- ¿Qué roles existen además de residente y administrador? (Portería, consejo, revisor fiscal,
  contador, personal de mantenimiento…) → *(respuesta)*
- ¿Quién crea las cuentas de los residentes: el administrador, o el residente se registra y el
  administrador aprueba? → **Respondido (Mary, 2026-09-07): nadie se registra solo.** Es una
  cadena — el operador de Idiky crea al administrador, el administrador crea a los
  propietarios, el propietario crea a los demás de su unidad, y el residente crea visitantes
  (RN-63). En una copropiedad el derecho a estar ahí se lo da a uno alguien que ya está.
- ¿Cómo se identifica un residente al registrarse: correo, celular, número de documento?
  → *(respuesta)*
- ¿Un arrendatario ve la cartera de la unidad, o solo el propietario? → *(respuesta)*

## 5. Técnico

- ¿Hay alguna **restricción de tecnología** por parte de ustedes o de un cliente?
  → *(respuesta)*
- ¿Dónde se va a desplegar (nube propia, proveedor específico)? → *(respuesta)*
- ¿Se debe integrar con algún sistema existente: contable, de pagos, de control de acceso?
  → *(respuesta)*
- ¿Hay requisitos de **protección de datos personales** que debamos cumplir explícitamente?
  → *(respuesta)*
- ¿Las apps nativas son obligatorias, o una PWA instalable es suficiente para la primera
  versión? → *(respuesta)*

## 6. Diseño

- ¿Existe una **identidad visual** (logo, colores, tipografía) o la definimos nosotros?
  *(El demo usa una paleta provisional en `apps/pwa/src/estilos/tokens.css`.)* → *(respuesta)*
- ¿El nombre del producto es definitivo? → *(respuesta)*
- ¿Modo oscuro es requisito? *(Hoy la app solo tiene modo claro.)* → *(respuesta)*

## 7. Plazos

- ¿Hay una fecha objetivo para mostrar el demo a alguien? ¿A quién? → *(respuesta)*
- ¿Cuántas horas semanales le puede dedicar cada persona? → *(respuesta)*

---

## Supuestos vigentes mientras no haya respuesta

Todo lo construido hasta ahora asume lo siguiente. **Si algo aquí es falso, avísenlo: cambia
el modelo de datos y varios casos de uso.**

1. Una sola copropiedad por instalación (multi-copropiedad es fase 3).
2. Conjunto residencial de apartamentos; no hay locales comerciales ni oficinas.
3. Cuotas mensuales prorrateadas por coeficiente, vencimiento el día 10.
4. La mora bloquea reservas pero no se calculan intereses.
5. PQRS con plazo de 15 días calendario.
6. La app del residente y la consola del administrador comparten un solo código base.
7. El demo no tiene backend ni autenticación real.
8. El país es Colombia: moneda COP, PQRS, paz y salvo y Ley 675 de 2001 como marco legal.
   *(Se deduce del demo; nadie lo ha confirmado.)*
9. ~~El voto en asamblea se pondera por coeficiente~~ → **confirmado el 2026-08-26**, ya no
   es supuesto. Que el **quórum** se mida en coeficientes sigue siendo supuesto (§3 bis).
10. Los documentos formales (paz y salvo, acta, comprobante, estado de cuenta) se entregan
    en PDF descargable. **Supuesto — ver §3 ter y ADR-0006.**
