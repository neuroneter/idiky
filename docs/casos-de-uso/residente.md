# Casos de uso — Residente (app móvil)

> Índice maestro: [`../04-casos-de-uso.md`](../04-casos-de-uso.md)
> Reglas de negocio referenciadas: [`../05-modelo-de-datos.md`](../05-modelo-de-datos.md#reglas-de-negocio)

---

### CU-R-01
## CU-R-01 — Ingresar y seleccionar unidad activa

- **Actor principal:** Residente
- **Precondiciones:** La persona está registrada y vinculada al menos a una unidad.
- **Disparador:** Abre la aplicación.
- **Resultado esperado:** Queda dentro de la app con una **unidad activa** seleccionada; todo
  lo que vea a partir de ese momento pertenece a esa unidad.

**Flujo principal**
1. El sistema muestra la pantalla de acceso.
2. El residente se identifica.
3. El sistema resuelve sus residencias.
4. Si tiene una sola unidad, la selecciona automáticamente. Si tiene varias, le pide elegir.
5. El sistema abre el inicio (CU-R-02) con la unidad activa.

**Flujos alternativos**
- A1. Sin unidades vinculadas → mensaje "tu administrador aún no ha vinculado tu unidad".
- A2. El residente cambia de unidad activa desde el selector del encabezado.

**Reglas de negocio**
- RN-01 (contexto de copropiedad), RN-02 (rol efectivo por unidad).

**Estado en el demo:** ✅ — `src/features/auth/AccesoPage.tsx`. Sin contraseña: se elige un
perfil de una lista (ver [ADR-0004](../adr/0004-autenticacion-demo.md)).

---

### CU-R-02
## CU-R-02 — Ver resumen de mi copropiedad (inicio)

- **Actor principal:** Residente
- **Precondiciones:** CU-R-01 completado.
- **Disparador:** Entra a la app o toca "Inicio".
- **Resultado esperado:** Ve en una sola pantalla lo que necesita saber hoy.

**Flujo principal**
1. El sistema muestra: saldo pendiente de la unidad, próxima fecha de vencimiento,
   comunicado más reciente, próxima reserva, correspondencia sin recoger y PQRS abiertas.
2. Cada bloque es un acceso directo al caso de uso correspondiente.

**Flujos alternativos**
- A1. Unidad al día → el bloque de cartera muestra "Estás al día" en lugar del saldo.

**Reglas de negocio**
- RN-03: el saldo mostrado incluye cuotas pendientes y vencidas, no las pagadas.

**Estado en el demo:** ✅ — `src/features/residente/InicioPage.tsx`.

---

### CU-R-03
## CU-R-03 — Consultar estado de cuenta

- **Actor principal:** Residente
- **Precondiciones:** Unidad activa seleccionada.
- **Disparador:** Toca "Cuenta".
- **Resultado esperado:** Entiende cuánto debe, por qué y desde cuándo.

**Flujo principal**
1. El sistema lista los cargos de la unidad ordenados del más reciente al más antiguo.
2. Cada cargo muestra: concepto, periodo, valor, fecha de vencimiento y estado
   (`pendiente` | `pagada` | `vencida`).
3. El sistema muestra el total adeudado y el desglose entre cuotas al día y en mora.

**Flujos alternativos**
- A1. Filtrar por estado (todas / pendientes / pagadas).
- A2. Sin cargos → estado vacío explicativo.

**Reglas de negocio**
- RN-04: una cuota pasa a `vencida` cuando la fecha de vencimiento es anterior a hoy y no
  está pagada.
- RN-05: el coeficiente de la unidad determina el valor de las cuotas extraordinarias.

**Estado en el demo:** ✅ — `src/features/residente/CuentaPage.tsx`.

---

### CU-R-04
## CU-R-04 — Pagar una cuota

- **Actor principal:** Residente
- **Precondiciones:** Existe al menos una cuota `pendiente` o `vencida`.
- **Disparador:** Toca "Pagar" sobre una cuota o "Pagar todo".
- **Resultado esperado:** La(s) cuota(s) quedan `pagada(s)` y se genera un comprobante.

**Flujo principal**
1. El residente elige qué pagar (una cuota o el total).
2. El sistema muestra el resumen: concepto(s), valor y medio de pago.
3. El residente confirma.
4. El sistema procesa el pago y registra un `Pago` asociado a las cuotas.
5. El sistema muestra el comprobante y actualiza el saldo.

**Flujos alternativos**
- A1. Pago rechazado → la cuota permanece pendiente y se informa el motivo.
- A2. Pago parcial (abono) → *fase 2*.

**Reglas de negocio**
- RN-06: un pago siempre se imputa primero a la deuda más antigua.
- RN-07: todo pago genera un comprobante con consecutivo único.

**Estado en el demo:** ✅ **simulado** — no hay pasarela real. `src/features/residente/PagoPage.tsx`.
La integración con pasarela está en el roadmap (fase 4).

---

### CU-R-05
## CU-R-05 — Reservar una zona común

- **Actor principal:** Residente
- **Precondiciones:** Unidad activa; la copropiedad tiene zonas comunes reservables.
- **Disparador:** Toca "Reservar" en una zona común.
- **Resultado esperado:** Queda una reserva en estado `solicitada` (o `confirmada` si la
  zona no requiere aprobación).

**Flujo principal**
1. El sistema lista las zonas comunes con su horario, aforo y si requieren aprobación.
2. El residente elige zona, fecha y franja horaria.
3. El sistema valida disponibilidad y las reglas de la zona.
4. El residente confirma; el sistema crea la reserva y notifica a la administración.

**Flujos alternativos**
- A1. Franja ocupada → el sistema la muestra deshabilitada y sugiere otras.
- A2. Unidad en mora → el sistema **bloquea** la reserva y explica el motivo (RN-08).
- A3. Excede el cupo mensual de la unidad → se rechaza con mensaje.

**Reglas de negocio**
- RN-08: una unidad en mora no puede reservar zonas comunes.
- RN-09: no puede haber dos reservas confirmadas de la misma zona en la misma franja.
- RN-10: la reserva debe hacerse con la anticipación mínima definida por la zona.

**Estado en el demo:** ✅ — `src/features/residente/ReservasPage.tsx`. RN-08, RN-09 y RN-10
están implementadas.

---

### CU-R-06
## CU-R-06 — Cancelar una reserva

- **Actor principal:** Residente
- **Precondiciones:** Existe una reserva propia en estado `solicitada` o `confirmada` y su
  fecha es futura.
- **Disparador:** Toca "Cancelar" sobre la reserva.
- **Resultado esperado:** La reserva pasa a `cancelada` y la franja se libera.

**Flujos alternativos**
- A1. La reserva ya ocurrió → la acción no se ofrece.

**Reglas de negocio**
- RN-11: cancelar con menos de 24 h de anticipación puede acarrear sanción *(fase 2)*.

**Estado en el demo:** ✅ — misma pantalla que CU-R-05.

---

### CU-R-07
## CU-R-07 — Radicar una PQRS

- **Actor principal:** Residente
- **Precondiciones:** Unidad activa.
- **Disparador:** Toca "Nueva solicitud".
- **Resultado esperado:** Se crea una PQRS con **radicado único** en estado `abierta`.

**Flujo principal**
1. El residente elige el tipo (`peticion` | `queja` | `reclamo` | `sugerencia`) y la categoría
   (convivencia, mantenimiento, seguridad, administración, otro).
2. Escribe asunto y descripción.
3. Confirma; el sistema asigna radicado, fecha de radicación y fecha límite de respuesta (SLA).

**Flujos alternativos**
- A1. Adjuntar fotos → *fase 2*.

**Reglas de negocio**
- RN-12: el radicado tiene el formato `PQRS-<AAAA>-<NNNN>` y es consecutivo por copropiedad.
- RN-13: el SLA por defecto es de 15 días calendario desde la radicación.

**Estado en el demo:** ✅ — `src/features/residente/PqrsPage.tsx`.

---

### CU-R-08
## CU-R-08 — Seguir una PQRS radicada

- **Actor principal:** Residente
- **Resultado esperado:** Ve el estado (`abierta` | `en_gestion` | `resuelta` | `cerrada`), las
  respuestas de la administración y la fecha límite.

**Flujo principal**
1. El sistema lista las PQRS de la unidad con su estado y radicado.
2. Al abrir una, muestra la conversación en orden cronológico.
3. El residente puede agregar un comentario mientras no esté `cerrada`.

**Reglas de negocio**
- RN-14: una PQRS `resuelta` se cierra automáticamente a los 5 días si el residente no
  responde *(fase 2)*.

**Estado en el demo:** ✅ — misma pantalla que CU-R-07 (detalle desplegable).

---

### CU-R-09
## CU-R-09 — Leer comunicados de la cartelera

- **Actor principal:** Residente
- **Resultado esperado:** Está al día con la información oficial de la copropiedad.

**Flujo principal**
1. El sistema lista los comunicados vigentes, los fijados primero y luego por fecha.
2. Cada comunicado muestra categoría (`general` | `urgente` | `mantenimiento` | `asamblea`),
   título, fecha y cuerpo.
3. Al abrirlo, se marca como leído para ese residente.

**Reglas de negocio**
- RN-15: los comunicados `urgente` se destacan y no se pueden ocultar del inicio.

**Estado en el demo:** ✅ — `src/features/residente/ComunicadosPage.tsx`.

---

### CU-R-10
## CU-R-10 — Autorizar un visitante y generar su código

- **Actor principal:** Residente
- **Resultado esperado:** Portería puede validar el ingreso del visitante sin llamar al residente.

**Flujo principal**
1. El residente registra nombre, documento y vigencia (fecha única o rango).
2. Indica si el visitante ingresa con vehículo (placa) — opcional.
3. El sistema genera un **código de acceso** y su representación visual (QR).
4. El residente comparte el código con el visitante.

**Flujos alternativos**
- A1. Revocar la autorización antes de su vencimiento.
- A2. Visitante frecuente (recurrente semanal) → *fase 2*.

**Reglas de negocio**
- RN-16: el código deja de ser válido al terminar la vigencia (CU-S-04).
- RN-17: el código es de un solo uso salvo que se marque como recurrente.

**Estado en el demo:** ✅ — `src/features/residente/VisitantesPage.tsx`. El QR se dibuja
localmente sin librerías externas (ver [ADR-0005](../adr/0005-codigo-qr-sin-dependencias.md)).

---

### CU-R-11
## CU-R-11 — Ver correspondencia pendiente

- **Actor principal:** Residente
- **Resultado esperado:** Sabe qué paquetes o cartas tiene en portería.

**Flujo principal**
1. El sistema lista la correspondencia de la unidad con tipo, remitente, fecha de recepción
   y estado (`en_porteria` | `entregada`).
2. Al entregarse, portería registra quién recibió y cuándo (CU-A-09).

**Estado en el demo:** ✅ — `src/features/residente/CorrespondenciaPage.tsx` (solo lectura).


---

### CU-R-18
## CU-R-18 — Informar un abono ya consignado

- **Actor principal:** Propietario o residente
- **Precondiciones:** Ya pagó por fuera de la app (banco, efectivo en portería).
- **Disparador:** Quiere que la administración sepa que ese dinero es suyo **y a qué lo quiere aplicar**.
- **Resultado esperado:** El abono queda informado y a la espera de conciliación; el propietario ve su estado.

**Flujo principal**
1. Desde su estado de cuenta elige "Ya pagué por fuera: informar abono".
2. Indica cuánto abonó, cómo pagó y el número de consignación.
3. **Escribe a qué corresponde el abono** y, si quiere, señala cuotas concretas.
4. Envía. El pago queda `reportado` y aparece en su cuenta como *Por conciliar*.
5. La administración lo concilia (CU-A-18) y emite el recibo de caja.

**Flujos alternativos**
- A1. La unidad no tiene cuotas pendientes → el abono quedará como saldo a favor.
- A2. La administración determina que el pago no corresponde → lo descarta con motivo (RN-29).

**Reglas de negocio**
- RN-30: lo informado **no baja el saldo** hasta que la administración lo aplica. El propietario
  informa, no decide: es la administración la que verifica que el dinero entró.
- RN-26, RN-27: el abono puede ser parcial y repartirse entre varias cuotas.

**Estado en el demo:** ✅ — `src/features/residente/InformarAbonoPage.tsx`.
