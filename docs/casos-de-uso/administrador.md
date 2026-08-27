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

- **Actor principal:** Administrador
- **Precondiciones:** No existen ya cuotas ordinarias del periodo.
- **Disparador:** Inicio de mes.
- **Resultado esperado:** Todas las unidades quedan con su cuota del periodo.

**Flujo principal**
1. El administrador elige periodo (`AAAA-MM`) y tipo (`ordinaria` | `extraordinaria`).
2. Indica el valor base o el valor total a prorratear.
3. El sistema calcula el valor por unidad y muestra una **previsualización**.
4. El administrador confirma; el sistema crea las cuotas en estado `pendiente`.

**Flujos alternativos**
- A1. El periodo ya fue generado → el sistema lo impide (RN-22).

**Reglas de negocio**
- RN-22: no se puede generar dos veces la cuota ordinaria del mismo periodo.
- RN-05: las extraordinarias se prorratean por coeficiente.
- RN-23: la fecha de vencimiento por defecto es el día 10 del periodo.

**Estado en el demo:** ✅ — `src/features/admin/CarteraPage.tsx` (acción "Generar cuotas").

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

- **Actor principal:** Administrador (o portería en fase 2)
- **Resultado esperado:** El residente sabe que tiene un paquete y queda constancia de la entrega.

**Flujo principal**
1. Se registra unidad destino, tipo (`paquete` | `carta` | `domicilio`), remitente y observaciones.
2. El sistema crea el registro en estado `en_porteria` y notifica al residente.
3. Al entregarlo, se registra quién lo recibió y la fecha → estado `entregada`.

**Reglas de negocio**
- RN-25: la correspondencia entregada no se puede editar, solo consultar.

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
1. El administrador crea la asamblea: tipo (ordinaria | extraordinaria), fecha, hora,
   modalidad (presencial | virtual | mixta **(?)**) y lugar o enlace.
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

**Estado en el demo:** ⬜ — no existe.

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
## CU-A-17 — Transmitir la asamblea en vivo

- **Actor principal:** Administrador
- **Precondiciones:** La asamblea está convocada y llegó su fecha.
- **Resultado esperado:** Los copropietarios ven la asamblea desde la app (CU-R-21).

**Flujo principal**
1. El administrador abre la sala e inicia la transmisión.
2. El sistema registra la instalación de la asamblea y empieza a contar el quórum (CU-S-07).
3. El administrador marca en qué punto del orden del día va; los asistentes lo ven.
4. Al terminar, cierra la transmisión y la asamblea pasa a `cerrada`.

**Flujos alternativos**
- A1. Se cae la transmisión → **la asamblea no se interrumpe**: el quórum y las votaciones
  siguen vigentes. El video es un canal, no el sistema de registro.
- A2. Se graba la sesión como soporte del acta **(?)** — pendiente de definir.

**Reglas de negocio**
- RN-28: el quórum se mide en coeficientes.

**Estado en el demo:** ⬜ — requiere ADR-0007 (proveedor de video).

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
## CU-A-19 — Validar y registrar los poderes

- **Actor principal:** Administrador
- **Precondiciones:** Hay poderes otorgados para una asamblea convocada (CU-R-22).
- **Disparador:** Antes de instalar la asamblea, se verifica la representación.
- **Resultado esperado:** Cada poder queda aceptado o rechazado, y el quórum se calcula con
  los aceptados.

**Flujo principal**
1. El sistema lista los poderes de la asamblea: quién otorga, a quién, y qué coeficiente.
2. El sistema marca automáticamente los que superan el tope (RN-30) o tienen inhabilidad **(?)**.
3. El administrador acepta o rechaza cada uno, con motivo en el rechazo.
4. Los aceptados suman al peso de voto del apoderado (CU-R-23) y al quórum (CU-S-07).

**Flujos alternativos**
- A1. Poder revocado por quien lo otorgó → sale de la lista automáticamente.
- A2. Poder presentado en papel el día de la asamblea → el administrador lo registra a mano,
  indicando que el soporte es físico.

**Reglas de negocio**
- RN-30: tope de representación por apoderado **(? — por confirmar)**.
- RN-31: el poder vale solo para esa asamblea.

**Estado en el demo:** ⬜ — no existe.

---

### CU-A-20
## CU-A-20 — Generar el acta de la asamblea

- **Actor principal:** Administrador
- **Precondiciones:** La asamblea está cerrada (CU-A-17).
- **Disparador:** Terminó la asamblea.
- **Resultado esperado:** Un acta en PDF que refleja lo que efectivamente pasó, construida
  desde los datos registrados y no escrita a mano.

**Flujo principal**
1. El sistema arma el borrador del acta con lo que ya tiene: fecha y hora de instalación y
   cierre, quórum alcanzado, lista de asistentes y representados, orden del día, y el
   resultado de cada votación con sus coeficientes (RN-35).
2. El administrador agrega lo que el sistema no puede saber: intervenciones, proposiciones
   y compromisos.
3. El acta pasa a revisión de la comisión verificadora **(?)**.
4. Al aprobarse, el sistema la numera (RN-36), la publica para los copropietarios y **la
   congela**: desde ahí no se edita (RN-35).

**Flujos alternativos**
- A1. La comisión pide correcciones → vuelve a borrador con las observaciones.
- A2. Corregir un acta ya aprobada → se emite un **acta aclaratoria** nueva que la referencia;
  la original no se toca.

**Reglas de negocio**
- RN-35: el acta se construye desde los datos registrados y no se edita una vez aprobada.
- RN-36: consecutivo único.

**Estado en el demo:** ⬜ — requiere ADR-0006.

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
- **Precondiciones:** El reglamento de la copropiedad define qué conductas se sancionan.
- **Disparador:** Se configura la copropiedad, o el reglamento cambia.
- **Resultado esperado:** Queda definido **qué multas existen** y por cuánto. Sin catálogo no
  se puede imponer ninguna (RN-38).

**Flujo principal**
1. El administrador ve los conceptos de multa de su copropiedad, activos e inactivos.
2. Crea uno: nombre, descripción de la conducta, valor sugerido y **el artículo del reglamento
   que lo sustenta**.
3. El sistema lo guarda como activo y queda disponible para CU-A-23.

**Flujos alternativos**
- A1. Editar un concepto → **no cambia las multas ya impuestas**, que copiaron su valor (RN-37).
- A2. Dar de baja un concepto → se marca inactivo. **No se borra**, porque las multas impuestas
  lo referencian (RN-40).
- A3. Crear un concepto sin artículo del reglamento → el sistema avisa de que la multa será
  más difícil de defender, pero **(?)** queda por decidir si lo impide.

**Reglas de negocio**
- RN-38, RN-40.

**Estado en el demo:** ⬜ — no existe.

---

### CU-A-23
## CU-A-23 — Imponer una multa a una unidad

- **Actor principal:** Administrador (o el consejo, **(?)**)
- **Precondiciones:** El catálogo tiene al menos un concepto activo (CU-A-22).
- **Disparador:** Ocurre una conducta sancionable.
- **Resultado esperado:** Queda registrada la sanción con sus hechos, y **solo cuando queda
  firme** se convierte en una cuota en la cartera de la unidad.

**Flujo principal**
1. El administrador elige la unidad y un concepto del catálogo (RN-38).
2. Describe **los hechos**: qué pasó, cuándo y dónde. Ajusta el valor si el reglamento lo
   permite **(?)**.
3. La sanción queda `propuesta` y se **notifica** al copropietario.
4. El copropietario tiene un plazo para presentar **descargos** **(? — plazo por definir)**.
5. Con los descargos a la vista, la sanción queda `firme` o `anulada`.
6. Al quedar firme, el sistema genera una `Cuota` de tipo `sancion` con el valor y su
   vencimiento (RN-39). Desde ahí se comporta como cualquier otra cuota: suma al saldo,
   entra en la imputación por antigüedad y aparece en el estado de cuenta.

**Flujos alternativos**
- A1. El copropietario presenta descargos y se le da la razón → `anulada`, con motivo. **No se
  borra**, queda el registro (O3).
- A2. Anular una multa ya firme → la cuota se anula también **(?)**; si ya fue pagada, hay que
  definir si se devuelve o se abona.

**Reglas de negocio**
- RN-38, RN-39.

> ⚠️ **Este caso de uso tiene consecuencias jurídicas.** La Ley 675 de 2001 exige debido
> proceso antes de sancionar. Un flujo que imponga la multa de un toque y la mande directo a
> la cartera puede producir **multas nulas** y demandas contra la administración. Los estados
> de este flujo tienen que salir del reglamento de la copropiedad, no de una suposición
> nuestra — ver [`../12-levantamiento-pendiente.md`](../12-levantamiento-pendiente.md) §3 quater.

**Estado en el demo:** ⬜ — no existe.

---

### CU-A-24
## CU-A-24 — Cobrar una cuota adicional a una unidad

- **Actor principal:** Administrador
- **Precondiciones:** Existe la unidad.
- **Disparador:** Un cobro que no es la cuota del mes ni una extraordinaria de toda la
  copropiedad: parqueadero adicional, mascota, uso de una zona con costo, reposición de un
  daño.
- **Resultado esperado:** La unidad tiene una cuota nueva de tipo `adicional`, con su concepto
  y su vencimiento.

**Flujo principal**
1. El administrador elige la unidad, escribe el concepto y el valor, y fija el vencimiento.
2. El sistema crea la cuota de tipo `adicional` (RN-41).
3. Entra sola en el saldo de la unidad y en el estado de cuenta del residente.

**Flujos alternativos**
- A1. Cobrar lo mismo a varias unidades → **(?)** por definir si hace falta un cobro masivo o
  basta repetirlo.
- A2. Anular una cuota adicional no pagada → se anula con motivo, no se borra (O3).

**Reglas de negocio**
- RN-41: exige concepto y valor explícitos. **No se prorratea por coeficiente**, a diferencia
  de la extraordinaria (RN-05): un parqueadero adicional no depende del tamaño del apartamento.

**Estado en el demo:** ⬜ — no existe.

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
