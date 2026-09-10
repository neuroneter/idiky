# Casos de uso — Administrador (consola web)

> Índice maestro: [`../04-casos-de-uso.md`](../04-casos-de-uso.md)
> Reglas de negocio: [`../05-modelo-de-datos.md`](../05-modelo-de-datos.md#reglas-de-negocio)

---

### CU-A-01
## CU-A-01 — Ver tablero de indicadores

- **Actor principal:** Administrador
- **Precondiciones:** Tiene una copropiedad activa.
- **Resultado esperado:** En 10 segundos sabe cómo está la copropiedad hoy.

**Flujo principal**
1. El sistema calcula y muestra:
   - Recaudo del mes y porcentaje sobre lo facturado.
   - Cartera total en mora y número de unidades morosas.
   - PQRS abiertas y cuántas están fuera de SLA.
   - Reservas pendientes de aprobación.
   - Correspondencia sin entregar.
2. Cada indicador enlaza a su módulo.

**Reglas de negocio**
- RN-18: el porcentaje de recaudo se calcula sobre las cuotas del periodo actual.

**Estado en el demo:** ✅ — `src/features/admin/TableroPage.tsx`.

---

### CU-A-02
## CU-A-02 — Administrar unidades y residentes

- **Actor principal:** Administrador
- **Resultado esperado:** El censo de la copropiedad está correcto y actualizado.

**Flujo principal**
1. El sistema lista las unidades con torre, número, coeficiente, residentes y saldo.
2. El administrador puede buscar por torre, número o nombre de residente.
3. Al abrir una unidad ve su ficha: datos, ocupantes, cartera y actividad reciente.
4. Puede vincular una persona a la unidad indicando su rol (`propietario` | `arrendatario`).

**Flujos alternativos**
- A1. Desvincular a un residente (queda en histórico, no se borra).
- A2. Crear una unidad nueva → *fase 2* (normalmente se cargan al constituir la copropiedad).

**Reglas de negocio**
- RN-19: la suma de los coeficientes de una copropiedad debe ser 100 %.
- RN-20: una unidad debe tener siempre al menos un propietario.

**Estado en el demo:** ✅ — `src/features/admin/UnidadesPage.tsx` (listar, buscar, ver ficha
y vincular residente).

---

### CU-A-03
## CU-A-03 — Consultar cartera y morosidad

- **Actor principal:** Administrador
- **Resultado esperado:** Sabe quién debe, cuánto y desde cuándo, para gestionar la cobranza.

**Flujo principal**
1. El sistema lista las unidades con saldo, cuotas vencidas y días de mora.
2. El administrador filtra por estado (todas / al día / en mora) y ordena por saldo.
3. Al abrir una unidad ve el detalle de sus cuotas.

**Reglas de negocio**
- RN-21: los días de mora se cuentan desde la cuota vencida más antigua.

**Estado en el demo:** ✅ — `src/features/admin/CarteraPage.tsx`.

---

### CU-A-04
## CU-A-04 — Registrar un pago manual

- **Actor principal:** Administrador
- **Precondiciones:** La unidad tiene cuotas pendientes.
- **Disparador:** Un residente pagó por consignación o en efectivo.
- **Resultado esperado:** La cuota queda `pagada` con el medio y la referencia del pago.

**Flujo principal**
1. El administrador busca la unidad y selecciona la(s) cuota(s).
2. Indica medio (`transferencia` | `efectivo` | `pse` | `otro`), fecha y referencia.
3. Confirma; el sistema registra el `Pago` y actualiza la cartera.

**Reglas de negocio**
- RN-06 (imputación a la deuda más antigua), RN-07 (comprobante único).

**Estado en el demo:** ✅ — `src/features/admin/CarteraPage.tsx` (acción "Registrar pago").

---

### CU-A-05
## CU-A-05 — Generar cuotas del periodo

- **Actor principal:** Administrador — **es el único que puede crear cuotas**, y solo las de
  su copropiedad (RN-49).
- **Precondiciones:** La sesión es de un administrador de esa copropiedad. No existen ya cuotas
  ordinarias del periodo.
- **Disparador:** Inicio de mes.
- **Resultado esperado:** Todas las unidades quedan con su cuota del periodo.

**Flujo principal**
1. El administrador elige periodo (`AAAA-MM`) y tipo (`ordinaria` | `extraordinaria`).
2. **Si es extraordinaria**, escribe la **justificación**: para qué se aprobó el cobro y en qué
   acta de asamblea, **citando su fecha**. Sin ella el sistema no deja continuar (RN-46, RN-47).
3. Indica el valor base o el valor total a prorratear.
4. El sistema calcula el valor por unidad y muestra una **previsualización**.
5. El administrador confirma; el sistema crea las cuotas en estado `pendiente`, y las
   extraordinarias quedan con su acta guardada.

> **Una cuota extraordinaria siempre se aprueba en asamblea** (decisión del equipo,
> 2026-08-27), y el soporte es **el acta**. A diferencia de las multas o de la tasa de interés,
> aquí **no existe la opción «reglamento»**.
>
> Y hay algo más: la asamblea no aprueba «una extraordinaria», aprueba una extraordinaria
> **para algo** —mejorar las zonas comunes, reparar un daño del edificio, automatizar la
> entrada—. Tiene **destinación específica**. El concepto es **texto libre**, porque el «para
> qué» no cabe en una lista, pero lo que se escribe es la destinación que aprobó el acta
> (RN-48): poner otra cosa es cobrar por algo que nadie votó.
>
> Ver [`../05-modelo-de-datos.md`](../05-modelo-de-datos.md) §3 bis.

**Flujos alternativos**
- A1. El periodo ya fue generado → el sistema lo impide (RN-22).
- A2. El módulo de asambleas todavía no existe (CU-A-20) → el acta se cita en la justificación,
  con su fecha. Cuando exista el módulo, esa referencia se enlaza con el acta de verdad.
  **Lo que no se admite nunca es una extraordinaria sin justificación.**
- A3. El residente abre su estado de cuenta y toca la cuota extraordinaria → **lee la
  justificación**: para qué se aprobó y en qué asamblea. Ese es el punto de pedirla.

**Reglas de negocio**
- RN-22: no se puede generar dos veces la cuota ordinaria del mismo periodo.
- RN-05: las extraordinarias se prorratean por coeficiente.
- RN-23: la fecha de vencimiento por defecto es el día 10 del periodo.
- RN-46: una cuota extraordinaria exige el acta de asamblea que la aprobó.
- RN-47: el cobro exige una justificación escrita que cite el acta y su fecha.
- RN-48: el concepto es texto libre, pero describe la destinación que aprobó el acta.
- RN-49: solo el administrador de esa copropiedad crea cuotas.

**Estado en el demo:** ✅ — `/admin/cartera`, botón «Generar cuotas». La extraordinaria no se
puede generar sin el acta y sin el «para qué»: el botón queda deshabilitado **diciendo qué
falta**, y `generarCuotas()` lo vuelve a comprobar. Y el copropietario lo lee desde su estado de
cuenta, plegado bajo «¿Por qué se cobra?».

---

### CU-A-06
## CU-A-06 — Aprobar o rechazar reservas

- **Actor principal:** Administrador
- **Precondiciones:** Existen reservas en estado `solicitada`.
- **Resultado esperado:** La reserva queda `confirmada` o `rechazada` y el residente se entera.

**Flujo principal**
1. El sistema lista las reservas pendientes, las más próximas primero.
2. El administrador aprueba o rechaza; al rechazar indica el motivo.
3. El sistema actualiza el estado y libera la franja si fue rechazada.

**Reglas de negocio**
- RN-09 (una sola reserva confirmada por franja), RN-08 (mora bloquea).

**Estado en el demo:** ✅ — `src/features/admin/ReservasAdminPage.tsx`.

---

### CU-A-07
## CU-A-07 — Atender la bandeja de PQRS

- **Actor principal:** Administrador
- **Resultado esperado:** Ninguna PQRS queda sin respuesta dentro del SLA.

**Flujo principal**
1. El sistema lista las PQRS con radicado, unidad, tipo, estado, fecha límite y semáforo de SLA.
2. El administrador abre una, responde y cambia su estado.
3. La respuesta queda visible para el residente (CU-R-08).

**Flujos alternativos**
- A1. Filtrar por estado o por vencidas.
- A2. Reasignar a un responsable → *fase 2*.

**Reglas de negocio**
- RN-13 (SLA 15 días), RN-24: al responder por primera vez la PQRS pasa a `en_gestion`.

**Estado en el demo:** ✅ — `src/features/admin/PqrsAdminPage.tsx`.

---

### CU-A-08
## CU-A-08 — Publicar un comunicado

- **Actor principal:** Administrador
- **Resultado esperado:** Todos los residentes ven el comunicado en su cartelera.

**Flujo principal**
1. El administrador escribe título, cuerpo y elige categoría.
2. Opcionalmente lo marca como **fijado** y define fecha de vigencia.
3. Publica; el comunicado aparece de inmediato en la app de los residentes.

**Flujos alternativos**
- A1. Guardar como borrador → *fase 2*.
- A2. Enviar como notificación push → *fase 3*.

**Reglas de negocio**
- RN-15: los `urgente` se destacan en el inicio del residente.

**Estado en el demo:** ✅ — `src/features/admin/ComunicadosAdminPage.tsx`.

---

### CU-A-09
## CU-A-09 — Registrar correspondencia recibida

- **Actor principal:** **Portería** (CU-P-01). El administrador la gestiona de respaldo, y es
  quien lo hace hoy porque la consola de portería todavía no existe (T-08).
- **Resultado esperado:** El residente sabe que tiene un paquete y queda constancia de la entrega.

**Flujo principal**
1. Se registra unidad destino, tipo (`paquete` | `carta` | `domicilio`), remitente y
   observaciones. El sistema guarda **quién lo recibió del mensajero** (`registradoPor`,
   RN-52): es el comienzo de la cadena de custodia.
2. El sistema crea el registro en estado `en_porteria` y notifica al residente.
3. Al entregarlo, se registra quién lo recibió y la fecha → estado `entregada`.

**Reglas de negocio**
- RN-25: la correspondencia entregada no se puede editar, solo consultar.
- RN-52: la portería registra y entrega; queda constancia de quién recibió.

**Estado en el demo:** ✅ — `src/features/admin/CorrespondenciaAdminPage.tsx`.

---

> **A partir de aquí: casos de uso del alcance declarado el 2026-08-26**
> ([`../12-levantamiento-pendiente.md` §0](../12-levantamiento-pendiente.md)).
> Ninguno está implementado. Los supuestos marcados **(?)** están pendientes de confirmar.

---

### CU-A-12
## CU-A-12 — Convocar la asamblea y emitir las citaciones

- **Actor principal:** Administrador
- **Precondiciones:** Existe la copropiedad con sus unidades y coeficientes al día (CU-A-21).
- **Disparador:** Llega la fecha de la asamblea ordinaria, o el consejo pide una extraordinaria.
- **Resultado esperado:** Todos los copropietarios reciben la citación formal (CU-R-20) y la
  asamblea queda creada con su orden del día.

**Flujo principal**
1. El administrador crea la asamblea. **Lo primero es la modalidad** (ADR-0007), porque decide
   qué más hay que pedir y qué va a ver el copropietario:

   | Modalidad | Se exige | El copropietario ve |
   |---|---|---|
   | Presencial | **Lugar** | Dónde es y a qué hora |
   | Virtual | **Enlace** de Zoom, Meet o lo que usen | El botón para entrar a la reunión |
   | Mixta | **Lugar y enlace** | Los dos, y escoge cómo asiste |

   Después: tipo (ordinaria | extraordinaria), fecha, hora y qué la convoca.
2. Redacta el orden del día como una lista de puntos; marca cuáles se someten a votación.
3. El sistema valida la antelación mínima frente a la fecha (RN-33) y avisa si no se cumple.
4. El sistema genera el documento de convocatoria y lo envía a todas las unidades.
5. La asamblea queda en estado `convocada`.

**Flujos alternativos**
- A1. No se alcanza el quórum el día de la asamblea → se registra la no instalación y se
  convoca por segunda vez **(?)**.
- A2. Se modifica el orden del día antes de la asamblea → se reemite la citación.
- A3. Se cancela la asamblea → estado `cancelada`, con motivo. No se borra (trazabilidad).

**Reglas de negocio**
- RN-33: antelación mínima de la convocatoria **(?)**.

**Estado en el demo:** 🟡 — `/admin/asambleas`, botón «Convocar». Se convoca con su orden del
día y **la modalidad manda**: el botón queda deshabilitado diciendo qué falta, y
`convocarAsamblea()` lo vuelve a comprobar.

**Falta:** el **documento de convocatoria** y su envío (paso 4) —depende de ADR-0006— y la
**antelación mínima** del paso 3, que es RN-33 y sigue sin definir.

---

### CU-A-13
## CU-A-13 — Emitir el paz y salvo

- **Actor principal:** Administrador
- **Precondiciones:** La unidad solicitó el certificado o el administrador lo emite de oficio.
- **Resultado esperado:** Se expide el certificado, queda en el historial de la unidad y el
  copropietario lo descarga (CU-R-12).

**Flujo principal**
1. El administrador ve las solicitudes pendientes o busca la unidad.
2. El sistema verifica el saldo cero (RN-26) y lo muestra antes de emitir.
3. El administrador confirma; el sistema genera el certificado con consecutivo (RN-36),
   fecha de expedición y vigencia.
4. El certificado queda disponible para el copropietario.

**Flujos alternativos**
- A1. La unidad tiene saldo → no se puede emitir; el sistema muestra la deuda.
- A2. Anular un certificado emitido → se marca `anulado` con motivo; **no se borra** (O3).

**Reglas de negocio**
- RN-26, RN-36.

**Estado en el demo:** ⬜ — requiere ADR-0006.

---

### CU-A-17
## CU-A-17 — Instalar la asamblea y llevar la asistencia

- **Actor principal:** Administrador
- **Precondiciones:** La asamblea está convocada y llegó su fecha.
- **Resultado esperado:** La sala queda abierta: los copropietarios pueden marcar asistencia
  (CU-R-21) y el administrador ve el coeficiente que se va reuniendo.

> 🔄 **Este caso de uso cambió de nombre el 2026-09-10.** Se llamaba «Transmitir la asamblea en
> vivo» y suponía que Idiky ponía el video. **No lo pone** ([ADR-0007](../adr/0007-transmision-en-vivo.md)):
> la copropiedad ya hace la reunión por Zoom o Meet, e Idiky la enlaza. Lo que sí es de Idiky
> —y es lo que Zoom no puede dar— es **la asistencia ponderada por coeficiente**.

**Flujo principal**
1. El administrador abre la asamblea y la **instala**. Ahí empieza a contar la asistencia.
2. Los copropietarios marcan asistencia desde su app, diciendo **cómo**: en el salón o
   conectados. **Las dos formas pesan igual** (RN-75): suman al mismo coeficiente. El reparto
   presencial/virtual se lleva aparte porque **el acta lo exige** (art. 47), no porque una
   cuente menos.
3. El administrador ve en vivo cuántas unidades hay y **cuánto coeficiente** reunido, repartido
   entre presenciales y conectadas.
4. Al terminar, cierra la asamblea. **La asistencia y los votos quedan** — es de lo que sale el
   acta (RN-61).

**Flujos alternativos**
- A1. Se cae la reunión de Zoom → **la asamblea no se cae**: la asistencia y las votaciones
  están en Idiky. Se cae el canal, no el registro.
- A2. Alguien se pasa del salón a la reunión, o al revés → vuelve a marcar y **se corrige la
  forma, no se duplica la unidad**. En una mixta es normal.
- A3. Se graba la sesión como soporte del acta **(?)** — la grabación queda en Zoom o Meet,
  fuera de Idiky. Sigue sin definir dónde vive y cuánto se conserva.

**Reglas de negocio**
- RN-27: asiste la unidad, no la persona; el peso es su coeficiente.
- RN-37: el coeficiente se copia al marcar.
- RN-51: hace quórum el propietario. El arrendatario puede entrar a oír, y la pantalla se lo
  dice en vez de esconderle el botón.
- RN-28: el quórum se afirma **citando el artículo** (Ley 675, arts. 41 y 45). Un «hay
  quórum» sin decir con qué regla es un número que nadie puede comprobar.
- RN-75: la asistencia virtual pesa igual que la presencial (Ley 675 art. 42, Decreto 398 de
  2020), y la pantalla se lo dice a quien está conectado.

**Estado en el demo:** ✅ — `/admin/asambleas`. Se instala, se ve quién va llegando con su
coeficiente y se cierra.

---

### CU-A-18
## CU-A-18 — Habilitar, abrir y cerrar una votación

- **Actor principal:** Administrador
- **Precondiciones:** La asamblea está instalada y con quórum suficiente (RN-28).
- **Disparador:** Se llega a un punto del orden del día que se somete a votación.
- **Resultado esperado:** La votación queda cerrada con un resultado consolidado e inmutable.

**Flujo principal**
1. El administrador redacta la pregunta y sus opciones, e indica la mayoría exigida
   (simple | calificada | unanimidad **(?)**).
2. El sistema verifica que haya quórum antes de permitir abrirla.
3. El administrador **abre** la votación: los asistentes la ven aparecer (CU-R-13).
4. Durante la votación el administrador ve cuánto coeficiente ha votado, **sin ver el
   detalle de quién votó qué** mientras siga abierta.
5. El administrador **cierra** la votación; el sistema consolida por coeficiente (CU-S-08),
   determina si se aprobó según la mayoría exigida, y publica el resultado.

**Flujos alternativos**
- A1. Se pierde el quórum durante la votación → se avisa; **(?)** pendiente definir si el
  resultado sigue siendo válido.
- A2. Empate → se resuelve según el reglamento **(?)**.
- A3. Anular una votación por vicio de procedimiento → se marca `anulada` con motivo y se
  repite como una votación nueva. La anulada no se borra (RN-34).

**Reglas de negocio**
- RN-27, RN-28, RN-29, RN-34.

**Estado en el demo:** ⬜ — no existe.

---

### CU-A-19
## CU-A-19 — Registrar un poder y dar de alta a quien lo ejerce

- **Actor principal:** Administrador
- **Precondiciones:** La asamblea está convocada o instalada.
- **Disparador:** Alguien llega con un poder firmado para representar a una unidad.
- **Resultado esperado:** La unidad queda con un representante, y ese representante existe en
  el sistema aunque no tenga nada que ver con la copropiedad.

> **La asamblea es de propietarios** (Mary, 2026-09-10), y el poder es lo que deja entrar a
> quien no lo es: *«puede entrar un externo si tiene poder»*. Un hijo, un abogado, alguien sin
> ninguna relación con el conjunto.

**Flujo principal**
1. El administrador registra el poder que **llegó en papel**. Lo primero es la foto o el
   escaneo del documento firmado. Es lo que hace válido el poder; pedirlo al final invita a registrar de
   memoria «lo que trajo don Jorge» y buscar el papel después.
2. Escoge **qué unidad** representa —el coeficiente es de ella, no del apoderado— y escribe los
   datos del apoderado.
3. El sistema busca a esa persona **por documento**. Si existe, la reutiliza (RN-61); si no,
   le crea un **usuario temporal de asamblea**.
4. Queda registrado y vigente. **Registrarlo es validarlo**: quien adjunta el papel es quien lo
   tuvo en la mano, y no hay nadie más en el flujo.

**Flujos alternativos**
- A1. Esa unidad ya tiene poder vigente → se rechaza. **Una unidad, un representante**
  (RN-28, RN-29). Hay que revocar el anterior.
- A2. El apoderado es el propietario mismo → se rechaza: no hace falta un poder para votar por
  la propia unidad.
- A3. Revocar → el poder **no se borra**, queda con su fecha de revocación (RN-61). Si votó
  antes de revocarse, hay que poder explicarlo.
- A4. La asamblea ya cerró → no admite poderes nuevos.

**Lo que el sistema NO comprueba, y lo dice en pantalla**
- **El tope** de unidades y coeficientes que un apoderado puede acumular (RN-30). La cifra la
  fija la Ley 675 y no la tenemos (§3 bis). En vez de inventarla, la pantalla **muestra el
  acumulado por apoderado** —cuántas unidades y cuánto coeficiente— para que quien registra lo
  juzgue con el reglamento en la mano, y avisa que no está rechazando a nadie.
- **Las inhabilidades**: si el administrador, los empleados o el consejo pueden ser apoderados.
  También abierto.

**Reglas de negocio**
- RN-30 (el apoderado no tiene que ser copropietario), RN-51 (quien otorga es el propietario;
  no se pregunta, se deriva de la unidad), RN-61 (no se borra, se revoca), RN-28 y RN-29 (una
  unidad, un representante).

> **Hay una segunda puerta, y es del propietario:** puede otorgarlo **desde su app** sin papel
> (CU-R-23). Lo que cambia es qué lo respalda —su autenticación en vez de una firma— y quién lo
> da de alta. El administrador ve los dos en la misma lista, marcados por origen.

**Estado en el demo:** ✅ — `/admin/asambleas`, dentro de cada asamblea, sección **Poderes**.
Cada uno se **abre y se lee**: la misma hoja que ve el propietario, y debajo **la foto del papel**
cuando llegó firmado. Registrar un poder que después nadie puede leer no sirve el día que
alguien lo impugne.

> **Pendiente que no es del flujo sino del dato:** el poder lleva nombre, documento y firma de
> alguien **que no es residente**, y hoy no se le pide autorización de tratamiento de datos —
> lo trae el administrador, no él (RN-66). Anotado en §3 sexies.

---

### CU-A-20
## CU-A-20 — Levantar el acta de la asamblea

- **Actor principal:** Administrador
- **Precondiciones:** La asamblea está **cerrada** (CU-A-17). Antes no hay de qué dar fe.
- **Resultado esperado:** Un acta que refleja lo que pasó, **construida desde lo registrado** y
  no escrita a mano, a disposición de los copropietarios.

> ✅ **Construida el 2026-09-10**, tras verificar el **artículo 47 de la Ley 675**. La norma
> resultó ser casi un inventario de lo que Idiky ya tenía:
>
> | El art. 47 exige | De dónde sale |
> |---|---|
> | Si fue ordinaria o extraordinaria | `Asamblea.tipo` |
> | La forma de la convocatoria | `Asamblea.citacion` |
> | El orden del día | `Asamblea.ordenDelDia` |
> | Nombre y **calidad** de los asistentes, su unidad y su **coeficiente** | `Asistencia` — con el coeficiente copiado al marcar |
> | Los **votos emitidos en cada caso** | `Voto`, con su coeficiente copiado |
>
> Lo único que faltaba: **presidente y secretario, que la firman**.

**Flujo principal**
1. El administrador **levanta el acta**. El sistema la arma con todo lo anterior; no se
   transcribe nada.
2. Elige **quién presidió y quién fue secretario** — solo entre quienes asistieron: la firman
   quienes estuvieron.
3. Escribe **lo que el sistema no puede saber**: intervenciones, proposiciones, compromisos.
4. La aprueba. El sistema la **numera** (RN-36), la **congela** (RN-35) y queda **a disposición
   del copropietario en su app** — que es lo que el art. 47 le exige al administrador dentro de
   los 20 días hábiles.

**Flujos alternativos**
- A1. Falta algo → el botón de aprobar queda deshabilitado **diciendo qué falta**, no mudo.
- A2. Corregir un acta aprobada → **acta aclaratoria** que la referencia. La original no se
  toca: corregir el pasado y corregirlo *a la vista* no son lo mismo.
- A3. **No hubo quórum** → el acta lo dice y **ningún punto sale aprobado**: sin quórum no hubo
  decisiones válidas, y un acta que reporta aprobaciones tras constatar que faltó quórum se
  contradice a sí misma.

**Decisiones de interfaz**
- **La hoja se ve mientras se edita**, no un formulario a un lado. Un acta es un documento que
  alguien va a leer entero; escribirla a ciegas en campos sueltos es cómo salen las actas que no
  cuadran con lo que pasó.
- **Solo asistentes pueden firmar.** Ofrecer toda la copropiedad dejaría firmar como presidente
  a alguien que no fue.

**Reglas de negocio**
- RN-35 (se construye de los datos; aprobada no se edita), RN-36 (consecutivo y código),
  RN-37 (los coeficientes copiados son los que hacen que el acta valga), RN-28 y RN-74 (quórum
  y mayorías, que el acta cita por artículo).

**La comisión verificadora es opcional** (RN-76, Mary 2026-09-10: *«a veces hay revisión»*). El
administrador marca, entre quienes asistieron, a quién designó la asamblea para revisar el acta;
si no designó a nadie, no marca a nadie y el acta se aprueba directo. Con comisión, el acta **no
se aprueba** hasta que todos revisen, cada revisión queda con su fecha y su observación en la
hoja, y **editar el acta después deja las revisiones sin efecto** — se revisó otro texto.

**Pendiente:** el **término** de la comisión, si el reglamento de esta copropiedad le fija uno
propio; hoy el acta lleva el plazo legal supletorio de 20 días hábiles para todo. Que el
miembro de la comisión **revise desde su propia app** —en vez de que el administrador registre
su revisión— es la extensión natural, la misma forma de dos puertas que tiene el poder
(CU-A-19 / CU-R-23). Y el **PDF** espera al backend (ADR-0006): el acta se lee en pantalla y
sale al imprimir, sin fingir descarga.

**Estado en el demo:** ✅ — `/admin/asambleas`, dentro de una asamblea cerrada.

---

### CU-A-21
## CU-A-21 — Administrar los coeficientes de las unidades

- **Actor principal:** Administrador
- **Precondiciones:** Existen las unidades de la copropiedad.
- **Disparador:** Se carga la copropiedad por primera vez, o una reforma al reglamento
  cambia los coeficientes.
- **Resultado esperado:** Los coeficientes quedan cargados y suman exactamente 100 %.

**Flujo principal**
1. El administrador ve la tabla de unidades con área y coeficiente, y la suma total.
2. Edita los coeficientes o los carga masivamente.
3. El sistema valida que la suma sea 100 % (RN-19) y **no permite guardar si no cuadra**.
4. Los cambios quedan con fecha de vigencia; lo anterior se conserva (RN-37).

**Flujos alternativos**
- A1. La suma no da 100 % → se muestra la diferencia y qué unidades la producen.
- A2. Cambiar un coeficiente con una asamblea en curso → **no se permite**: alteraría el
  quórum y el peso de los votos de una asamblea viva.

**Reglas de negocio**
- RN-19: la suma es 100 %.
- RN-37: el coeficiente es histórico; cambiarlo no altera votaciones ya cerradas.

**Estado en el demo:** 🟡 — el coeficiente existe y se muestra en `UnidadesPage.tsx`, pero
**no se puede editar** y no hay versionado.

---

### CU-A-22
## CU-A-22 — Administrar el catálogo de multas

- **Actor principal:** Administrador
- **Precondiciones:** Las conductas sancionables ya están definidas — en el **reglamento de
  propiedad horizontal**, en el **manual de convivencia**, en un **acta de asamblea** o en
  **otro documento** que haya que nombrar.
- **Disparador:** Se configura la copropiedad, cambia el manual de convivencia, o la asamblea
  aprueba sanciones nuevas.
- **Resultado esperado:** Queda definido **qué multas existen** y por cuánto. Sin catálogo no
  se puede imponer ninguna (RN-38).

**Flujo principal**
1. El administrador ve los conceptos de multa de su copropiedad, activos e inactivos.
2. Crea uno: nombre, descripción de la conducta, valor y **qué lo autoriza**, escogiendo entre
   cuatro orígenes:

   | Origen | Qué se escribe |
   |---|---|
   | Reglamento de propiedad horizontal | El artículo |
   | Manual de convivencia | El artículo |
   | Acta de asamblea | La fecha del acta |
   | **Otro documento** | **Cuál es el documento**, y dónde dice lo que dice |
3. Si el documento dice que la multa **sube cuando la conducta se repite**, se parametriza
   también, **con su propia cita** — puede ser otro documento: es normal que el reglamento
   fije la multa y una asamblea posterior agrave la repetición (RN-72). Si no lo dice, se deja
   apagado: sin respaldo la multa no sube.
4. El sistema lo guarda como activo y queda disponible para CU-A-23.

> **El administrador no define las multas: las parametriza** (Mary, 2026-09-08). *«Las define
> la asamblea normalmente, o ya están establecidas en el reglamento de propiedad horizontal o
> el manual de convivencia.»* Esta pantalla **traslada al sistema** lo que esos documentos ya
> dicen; no es donde se inventa una sanción.
>
> Por eso el respaldo **no es opcional**: sin él, el concepto no se crea. Es el mismo principio
> que rige la tasa de interés y las cuotas extraordinarias — ver
> [`../05-modelo-de-datos.md`](../05-modelo-de-datos.md) §3 bis, «El principio del respaldo».
>
> **El manual de convivencia cuenta aparte del reglamento**, y no es un detalle: el reglamento
> de PH es el constitutivo —escritura pública, registrado—, mientras que el manual lo adopta la
> asamblea para el día a día, y **en la práctica el catálogo de sanciones suele vivir ahí**.
> Obligar a citar «reglamento» donde la conducta está en el manual haría que la referencia no
> se pudiera comprobar.
>
> **Y existe «otro documento»** (Mary, 2026-09-08), porque una lista cerrada obligaría a forzar
> el caso raro dentro de una opción que no le corresponde. **Pero exige nombrar cuál**: sin ese
> campo, «otro» sería la puerta por donde se escapa el respaldo entero —bastaría marcarlo para
> no justificar nada—. Nombrándolo sigue siendo comprobable.

**Flujos alternativos**
- A1. Corregir un concepto → **se inhabilita y se crea de nuevo**. No se edita en sitio: el
  valor y el respaldo son lo que la multa copia al imponerse (RN-37), y editarlos dejaría multas
  apuntando a un texto que ya no dice lo mismo.
- A2. **Inhabilitar** un concepto → se marca inactivo y **sigue a la vista**, en su propia
  sección. No se borra, porque las multas impuestas lo referencian (RN-40). Se puede
  **habilitar** de nuevo: a veces la reforma que lo dejó sin sustento se revierte. Es el mismo
  verbo que con las personas (RN-61), porque es lo mismo que pasa (Mary, 2026-09-09).
- A6. Nombre repetido entre los activos → el sistema no lo crea. Dos conceptos con el mismo
  nombre hacen que quien impone la multa no sepa cuál escoger.
- A3. La asamblea aprueba multas nuevas → se crean los conceptos citando esa acta, y quedan
  disponibles desde entonces.
- A4. **Se reforma el manual de convivencia** → los conceptos afectados se inhabilitan y se
  crean de nuevo citando el artículo nuevo. No se editan en sitio: una multa impuesta bajo el
  manual anterior tiene que seguir apuntando al texto que la respaldaba (RN-37).
- A5. Se escoge **otro documento** y no se escribe cuál → el sistema no crea el concepto. No es
  un campo opcional: es lo único que hace comprobable ese origen.

**Reglas de negocio**
- RN-38: solo entra al catálogo lo que el reglamento, el manual de convivencia o la asamblea
  contemplan.
- RN-49: el administrador **parametriza**, no decide.
- RN-40, RN-45.

**Estado en el demo:** ✅ — `src/features/admin/CatalogoMultasPage.tsx`, con la semilla
cargada desde el manual de convivencia, que es donde vive en la práctica.

Dos decisiones de la pantalla, por si alguien las quiere cambiar:

- **El respaldo se pregunta primero**, antes que la conducta y el valor. Es lo que decide si el
  concepto puede existir; un formulario que lo pregunta de último invita a escribir la multa
  primero y buscarle sustento después.
- **Cada origen pide lo suyo**: el reglamento y el manual piden artículo, el acta pide fecha, y
  «otro» pide además el nombre del documento. Pedir «referencia» a secas deja que cada quien
  escriba una cosa distinta.

**Pendiente:** **no se editan**. Para corregir un concepto se da de baja y se crea de nuevo, que
es lo que ya exigía A4 cuando cambia el documento. Editar en sitio sería cómodo para arreglar
una palabra, y peligroso para todo lo demás: el valor y el respaldo son lo que la multa copia
al imponerse (RN-37).

---

### CU-A-23
## CU-A-23 — Imponer una multa y llevar el proceso

- **Actor principal:** Administrador — **el mismo de principio a fin**. Él impone y él
  resuelve los descargos (Mary, 2026-09-09). No está decidiendo sobre la norma: la aprobó la
  asamblea o ya está en el reglamento o el manual (RN-38); lo que él resuelve es si los hechos
  ocurrieron.
- **Precondiciones:** El catálogo tiene al menos una multa habilitada (CU-A-22), y la
  copropiedad tiene parametrizados sus plazos (`diasDescargos`, `diasImpugnacion`) y el
  término de reincidencia (`mesesReincidencia`).
- **Disparador:** Ocurre una conducta sancionable.
- **Resultado esperado:** Queda abierto un expediente con sus hechos y su línea de tiempo, y
  **solo si queda en firme** se convierte en una cuota en la cartera de la unidad.

> ✅ **Desbloqueado el 2026-09-09.** Mary: *«el debido proceso ya está reglamentado»*. La app
> no inventa los pasos ni los plazos: los toma del reglamento de cada copropiedad (RN-69).

**Flujo principal**
1. El administrador abre el proceso: elige la unidad, una multa del catálogo y describe **los
   hechos** —qué pasó, cuándo y dónde—. El valor y el respaldo **no se escriben ni se
   ajustan**: salen del catálogo, que es lo que los hace comprobables (RN-38, RN-49).
   Si la unidad ya tiene sanciones **en firme y dentro del término de reincidencia** —un año en
   esta copropiedad— por esa misma conducta, la pantalla lo dice
   antes de abrir el proceso, y dice también qué valor va a aplicar: el agravado si el
   catálogo lo tiene parametrizado, **y el mismo de siempre si no** (RN-72). Que la unidad
   reincida no sube la multa por sí solo.
2. El sistema copia el concepto, el valor, **la norma que lo respalda** y el plazo de
   descargos, asigna radicado
   `SAN-<año>-<consecutivo>` y deja el expediente `notificada`. **Todavía no se cobra nada.**
3. El copropietario presenta descargos dentro del plazo (CU-R-29) → `en_estudio`.
4. La administración decide, **con motivación escrita**: sancionar → `resuelta`, y arranca el
   plazo de impugnación; archivar → `archivada`, y ahí termina.
5. Si el copropietario impugna (CU-R-29) → `impugnada`, y vuelve a ser turno de la
   administración.
6. La sanción queda **en firme** por dos caminos: se venció el plazo de impugnación sin que
   impugnara, o se resolvió la impugnación. **Ahí, y solo ahí, nace la cuota** de tipo
   `sancion` (RN-39). Desde ese momento se comporta como cualquier otra: suma al saldo, entra
   en la imputación por antigüedad y aparece en el estado de cuenta.

**Flujos alternativos**
- A1. El copropietario deja vencer el plazo sin decir nada → la administración puede resolver
  igual. La pantalla lo permite antes de que venza, **pero lo advierte**: decidir sin haberlo
  oído es lo que hace que una sanción se caiga.
- A2. Se le da la razón → `archivada`, con motivo. **No se borra** (RN-61): el expediente
  queda, porque un proceso archivado sin rastro es un proceso que después nadie puede revisar.
- A3. La multa que respaldaba el proceso se inhabilita después → el expediente sigue vivo con
  el concepto, el valor y **la norma** que copió (RN-37). Lo que ya no se puede es abrir
  procesos nuevos con ella.
- A4. **Anular una sanción ya en firme → no existe.** *«Una multa no se anula porque para eso
  existe el debido proceso»* (Mary, 2026-09-09). El momento de deshacerla es archivarla
  durante el proceso; después no hay salida de `firme` (RN-70).

**Decisiones de interfaz**
- **Lo primero es de quién es el turno.** Arriba, «Te toca resolver»; abajo, «Esperando al
  copropietario»; al final, cerrados. Un proceso en el que los dos creen que espera al otro es
  un proceso que se vence solo, y un plazo vencido es una multa que se cae.
- **Los plazos se dicen en días, no en fechas.** «Hasta el 19 de septiembre» obliga a hacer la
  cuenta; «quedan 7 días» no. Y cuando ya venció, se dice que venció.
- **El catálogo y los procesos son dos entradas distintas** en el menú: parametrizar no es
  sancionar (RN-49).
- **La norma se ve dos veces**: al elegir la conducta —para que el administrador sepa qué está
  aplicando antes de abrir el proceso— y en la cabecera del expediente, en las dos caras. Una
  multa se comprueba por sus dos mitades: qué norma y qué hechos.

**Reglas de negocio**
- RN-36 (radicado), RN-37 (valor y norma copiados), RN-38 (solo del catálogo, y el
  administrador aplica lo que otros decidieron), RN-39 (la cuota nace al quedar firme), RN-61
  (no se borra), RN-69 (el debido proceso, sus plazos y quién lo lleva), RN-70 (en firme no se
  anula), RN-71 (la multa cuenta como mora igual que cualquier cuota), RN-72 (la reincidencia
  agrava solo si un documento lo dice).

> ✅ **Todo lo que bloqueaba las multas quedó respondido el 2026-09-09.** La última: *«el
> administrador no puede ajustar el valor»*. Es el límite entre parametrizar e imponer (RN-49), y queda del
> lado correcto — si el valor se moviera caso por caso, el administrador volvería a estar
> decidiendo la sanción en vez de aplicarla. En el código no es una restricción de pantalla:
> `imponerSancion` **no recibe un valor**. Ver
> [`../12-levantamiento-pendiente.md`](../12-levantamiento-pendiente.md) §3 quater.

**Estado en el demo:** ✅ — `/admin/sanciones`.

---

### CU-A-24
## CU-A-24 — ~~Cobrar una cuota adicional a una unidad~~ · **Retirado**

> ⛔ **Retirado el 2026-09-09.** Mary: *«me retracto, las cuotas adicionales son lo mismo que
> cuotas extraordinarias»*. No hay dos figuras: hay una, la **cuota extraordinaria**, y ya
> tiene su caso de uso en la generación de cuotas (CU-A-05) y sus reglas (RN-05, RN-46, RN-48).
>
> **Se deja el registro en vez de borrar la sección**, por lo mismo que no se borra nada en
> esta app: quien lea el histórico va a encontrar RN-41 y varias menciones a un tipo de cuota
> `adicional` que nunca existió, y tiene que poder saber por qué desaparecieron.

**Qué decía, y por qué era un error.** El caso de uso suponía un cobro por unidad —parqueadero
adicional, mascota, uso de una zona con costo, reposición de un daño— con concepto y valor
escritos a mano por el administrador, sin prorrateo por coeficiente. Dos cosas estaban mal:

1. **La figura no existe.** Lo que la copropiedad cobra fuera de la cuota ordinaria es la
   extraordinaria, y esa **la aprueba la asamblea y se prorratea por coeficiente** (RN-05,
   RN-46). Un cobro por unidad con valor libre habría sido exactamente lo que RN-49 prohíbe:
   el administrador decidiendo sobre el caso concreto.
2. **Multiplicaba el modelo sin necesidad.** `TipoCuota` iba a ganar un valor `'adicional'`
   que se comportaba casi como `'extraordinaria'`; dos nombres para una idea obligan a quien
   los lee a preguntarse en qué se diferencian.

**Lo que queda vivo de aquí:** que la extraordinaria **exija el acta que la aprobó** (RN-46).
Hoy `generarCuotas()` la crea sin pedirla — es lo que tiene a CU-A-05 en 🟡, y es el trabajo
real que este caso de uso estaba tapando.

**Reglas retiradas con él:** RN-41.

---

### CU-A-25
## CU-A-25 — Configurar si la copropiedad cobra interés de mora

- **Actor principal:** Administrador
- **Precondiciones:** Existe la copropiedad.
- **Disparador:** Se configura la copropiedad, o la asamblea decide empezar o dejar de cobrar
  intereses.
- **Resultado esperado:** Queda definido si esta copropiedad cobra interés de mora. **No todas
  lo hacen**, y apagado no se genera ninguno (RN-42).

**Flujo principal**
1. El administrador ve la configuración de cartera de su copropiedad.
2. Enciende o apaga el cobro de interés de mora.
3. El sistema registra **quién lo cambió y cuándo**: encender un cobro que afecta a todos los
   copropietarios no puede ser un cambio anónimo.
4. Con el cobro encendido, el proceso automático (CU-S-02) liquida los intereses según la tasa
   vigente y genera cuotas de tipo `interes` (RN-44).

**Flujo de la tasa** — la registra **el administrador de cada copropiedad**
(decisión del equipo, 2026-08-27).

5. El administrador registra la tasa vigente: valor, desde cuándo aplica y **qué la aprobó** —
   el reglamento, citando el artículo, o un acta de asamblea, enlazándola (CU-A-20).
6. El sistema **rechaza** una tasa por encima del tope legal (RN-43) y **avisa** cuando la
   vigente lleva demasiado tiempo sin actualizarse.

> **La ley pone el techo, la asamblea pone la tasa.** Hay una norma que regula el interés de
> mora, pero cada copropiedad tiene su reglamento y sus aprobaciones de asamblea: la tasa que
> se cobra es la que **esa** copropiedad aprobó, y la ley solo dice hasta dónde puede llegar.
> Por eso no basta con guardar un número: hay que guardar **qué lo autoriza**. Cuando un
> copropietario pregunte por qué le cobran ese interés, la respuesta es un acta o un artículo.

> **Y por eso los dos frenos.** Si la tasa la teclea una persona, se puede equivocar o dejarla
> vieja. Cobrar por encima del tope es usura; cobrar con una tasa vencida es cobrar mal. El
> sistema no puede evitar el error, pero sí hacerlo visible.

**Flujos alternativos**
- A1. Se apaga el cobro → **los intereses ya generados no desaparecen**; son cuotas y se
  anulan una por una si así se decide (O3).
- A2. No hay tasa vigente registrada → el sistema **no calcula nada** y avisa. Es preferible no
  cobrar a cobrar con una tasa desactualizada (RN-43).
- A3. La tasa vigente está vencida → el sistema avisa y **(?)** queda por decidir si sigue
  liquidando con la última conocida o se detiene.

**Reglas de negocio**
- RN-42: sin activar, no se genera ningún interés.
- RN-43: la tasa no se escribe en el código; se registra con vigencia y fuente, y no puede
  superar el tope legal.
- RN-44: el interés genera una cuota de tipo `interes`, que entra en la cartera como cualquier
  otra y por tanto suma al saldo (RN-03) y se imputa por antigüedad (RN-06).

> **La tasa cambia y viene de afuera.** «Normativa vigente» significa que la fija una autoridad
> externa y se actualiza periódicamente. Por eso la tasa es un dato con vigencia, no una
> constante del código, y por eso hace falta decidir **quién la mantiene al día**. Las
> preguntas están en [`../12-levantamiento-pendiente.md`](../12-levantamiento-pendiente.md)
> §3 quinquies. Sin esas respuestas se puede construir el interruptor de este caso de uso, pero
> no el cálculo.

**Estado en el demo:** ⬜ — hoy no se calcula ningún interés (CU-S-02 está parcial).

---

## CU-A-26 — Registrar propietarios y ver los registros de la copropiedad

- **Actor principal:** Administrador.
- **Precondiciones:** Sesión iniciada en la consola.
- **Disparador:** Se vende una unidad, o hay que dar de alta al primer propietario.
- **Resultado esperado:** El propietario queda registrado, con sus soportes, y desde ahí él
  registra a los demás de su unidad.

**El segundo eslabón de RN-63.** El operador de Idiky crea al administrador; el administrador
crea a los propietarios; el propietario crea a los demás de su unidad. Por eso aquí **la única
categoría es residente**, en la práctica propietario: que el administrador pudiera crear
arrendatarios directamente parece un atajo cómodo y es lo que rompe la trazabilidad — el
propietario dejaría de saber quién vive en su unidad.

**Flujo principal**
1. El administrador abre **Registros**.
2. Ve la tabla de toda la copropiedad, con **quién registró a quién**: es la cadena de RN-63
   hecha visible.
3. Toca **Registrar propietario**, escoge la unidad y llena los datos.
4. El resto es igual que CU-R-27: la persona adjunta, el administrador autoriza.

**Flujos alternativos**
- A1. Un registro de otra unidad → lo ve, pero **no lo autoriza**: eso es de su propietario
  (RN-59).

**Reglas de negocio**
- RN-57 a RN-63.

**Estado en el demo:** ✅ — `src/features/admin/RegistrosPage.tsx`, con el mismo trámite de la
app del residente (`src/componentes/Registro.tsx`).

**Pendiente:** el eslabón de arriba —**el operador de Idiky, que crea a los administradores**—
es un actor por encima de la copropiedad y no existe todavía en el demo. Está escrito en
`CADENA_DE_REGISTRO` para que el modelo no lo olvide.
