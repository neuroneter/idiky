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

### CU-A-18
## CU-A-18 — Conciliar abonos y administrar recibos de caja

- **Actor principal:** Administrador
- **Precondiciones:** Hay abonos informados por propietarios (CU-R-18) o pagos recibidos por fuera.
- **Disparador:** Entró plata a la copropiedad y hay que registrarla donde corresponde.
- **Resultado esperado:** El pago queda aplicado a las cuotas correctas y con su recibo de caja.

**Flujo principal**
1. En **Pagos**, la bandeja "Por conciliar" lista lo que los propietarios informaron, con el
   texto en que cada uno explica a qué corresponde su abono.
2. El administrador abre uno y ve el reparto sugerido por antigüedad (RN-06).
3. **Ajusta el reparto** si lo que informó el propietario dice otra cosa: puede abonar
   parcialmente a una cuota o repartir entre varias.
4. Aplica. El sistema baja los saldos, emite el recibo de caja `RC-<NNNNN>` y lo muestra.

**Flujos alternativos**
- A1. El pago llegó por fuera y nadie lo informó → "Registrar pago", eligiendo unidad y valor.
- A2. Lo repartido supera lo recibido → el sistema lo impide.
- A3. Sobra dinero después de cubrir todas las cuotas → queda como saldo a favor de la unidad (RN-27).
- A4. El pago fue un error o el banco lo devolvió → se anula con motivo; el saldo vuelve a las
  cuotas y el recibo **queda en el libro marcado como anulado** (RN-29).

**Reglas de negocio**
- RN-06 (imputación por antigüedad), RN-26 (abono parcial), RN-27 (reparto y saldo a favor),
  RN-28 (consecutivo del recibo), RN-29 (anulación con traza), RN-30 (lo reportado espera).

**Estado en el demo:** ✅ — `src/features/admin/PagosPage.tsx`.
