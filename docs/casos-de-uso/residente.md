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
- RN-16: el código solo vale dentro de su vigencia — antes de `vigenciaDesde` aparece
  como `programado`, después de `vigenciaHasta` como `vencido` (CU-S-04).
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

> **A partir de aquí: casos de uso del alcance declarado el 2026-08-26**
> ([`../12-levantamiento-pendiente.md` §0](../12-levantamiento-pendiente.md)).
> Ninguno está implementado todavía. Los supuestos marcados **(?)** están pendientes de
> confirmar con el reglamento de la copropiedad — ver §3 bis y §3 ter de ese documento.

---

### CU-R-12
## CU-R-12 — Descargar el paz y salvo

- **Actor principal:** Copropietario (solo propietario, no arrendatario **(?)**)
- **Precondiciones:** La unidad no tiene saldo pendiente.
- **Disparador:** Necesita el certificado para un trámite (venta, arriendo, notaría).
- **Resultado esperado:** Obtiene un PDF descargable que certifica que su unidad está al día.

**Flujo principal**
1. El copropietario entra a su estado de cuenta y toca "Descargar paz y salvo".
2. El sistema verifica que el saldo de la unidad sea cero (RN-26).
3. El sistema genera el certificado con consecutivo único (RN-36), fecha de expedición,
   vigencia y los datos de la unidad y su propietario.
4. El copropietario descarga o comparte el PDF.

**Flujos alternativos**
- A1. La unidad tiene saldo → el sistema explica cuánto debe y ofrece ir a pagar (CU-R-04),
  sin generar el documento.
- A2. El certificado requiere autorización previa del administrador **(?)** → queda en
  estado `solicitado` y el administrador lo emite (CU-A-13).
- A3. El copropietario consulta un paz y salvo emitido antes → lo descarga de su historial.

**Reglas de negocio**
- RN-26: solo se emite con saldo cero.
- RN-36: consecutivo único y verificable.

> **Pregunta abierta (?):** ¿«saldo cero» incluye la cuota del mes en curso que todavía no ha
> vencido? Hoy el demo la cuenta, así que hay que pagarla antes de emitir. Si la práctica de la
> copropiedad es otra —al día = nada vencido—, cambia RN-26 y con ella la pantalla.

**Estado en el demo:** 🟡 — `src/features/residente/PazYSalvoPage.tsx`. Verifica RN-26, emite el
certificado con su consecutivo (RN-36) y lo muestra en pantalla; **falta la descarga en PDF**,
que depende de ADR-0006.

---

### CU-R-13
## CU-R-13 — Votar en una asamblea

- **Actor principal:** Copropietario (por sí mismo o como apoderado, CU-R-23)
- **Precondiciones:** Hay una asamblea instalada y una votación abierta por el
  administrador (CU-A-18).
- **Disparador:** El administrador abre la votación durante la asamblea.
- **Resultado esperado:** Su voto queda registrado con el peso de su coeficiente y ya no
  puede cambiarlo.

**Flujo principal**
1. El sistema notifica que hay una votación abierta y muestra la pregunta y sus opciones.
2. El sistema muestra con cuánto peso vota: su coeficiente, más el de las unidades que
   representa por poder (CU-R-23).
3. El copropietario elige una opción y confirma.
4. El sistema registra un voto por cada unidad que le corresponde (RN-29) y confirma.
5. Al cerrarse la votación (CU-A-18), el copropietario ve el resultado consolidado.

**Flujos alternativos**
- A1. La votación se cierra mientras estaba decidiendo → el voto no se acepta y se le avisa.
- A2. Ya votó → ve su elección, sin opción de cambiarla (RN-34).
- A3. Otorgó poder a otra persona → no puede votar esa unidad (RN-32).
- A4. La unidad está en mora → **(?)** pendiente de definir si pierde el voto.

**Reglas de negocio**
- RN-27: el voto se pondera por coeficiente (confirmada por el equipo el 2026-08-26).
- RN-29: un voto por unidad y por pregunta.
- RN-32: quien otorgó poder no vota esa unidad directamente.
- RN-34: una votación cerrada no se reabre.

**Estado en el demo:** 🟡 — `src/features/residente/AsambleaDetallePage.tsx`. Se vota en las
asambleas ordinarias y extraordinarias, un voto por unidad (RN-29), solo el propietario
(RN-51), con el coeficiente copiado al votar (RN-37), y se muestra el conteo por coeficiente.
**No dice si el punto quedó aprobado**: eso exige la mayoría y el quórum, que siguen sin
definir (RN-28, T-10). Faltan también los poderes (CU-R-23) y la mora como causal (A4).

---

### CU-R-18
## CU-R-18 — Descargar el informe de estado de cuenta

- **Actor principal:** Copropietario
- **Precondiciones:** CU-R-01 completado.
- **Disparador:** Quiere un soporte de su cartera para un trámite o para su contabilidad.
- **Resultado esperado:** Obtiene un PDF con el detalle del periodo que elija.

**Flujo principal**
1. Desde el estado de cuenta (CU-R-03) elige "Descargar informe".
2. Elige el rango de periodos (por defecto, el año en curso).
3. El sistema genera el PDF: cuotas facturadas, pagos aplicados, saldo por periodo y saldo
   final, con el consecutivo del documento (RN-36).

**Flujos alternativos**
- A1. Sin movimientos en el rango elegido → se avisa antes de generar el documento.

**Reglas de negocio**
- RN-03 (composición del saldo), RN-06 (orden de imputación), RN-36 (consecutivo).

**Estado en el demo:** ⬜ — el estado de cuenta se ve en pantalla (`CuentaPage.tsx`) pero no
se descarga. Requiere ADR-0006.

---

### CU-R-19
## CU-R-19 — Consultar y descargar mis comprobantes de pago

- **Actor principal:** Copropietario
- **Precondiciones:** La unidad tiene al menos un pago registrado.
- **Disparador:** Necesita el soporte de un pago hecho antes.
- **Resultado esperado:** Encuentra cualquier pago histórico de su unidad y descarga su
  comprobante.

**Flujo principal**
1. El sistema lista los pagos de la unidad: fecha, valor, medio, cuotas cubiertas y número
   de comprobante.
2. El copropietario abre uno y descarga el PDF.

**Flujos alternativos**
- A1. El pago lo registró la administración manualmente (CU-A-04) → aparece igual, marcado
  con quién lo registró.

**Reglas de negocio**
- RN-07: todo pago tiene comprobante con consecutivo único.

**Estado en el demo:** 🟡 — el comprobante se muestra **una sola vez**, al terminar el pago
(`PagoPage.tsx`); después no hay forma de volver a verlo ni de descargarlo.

---

### CU-R-20
## CU-R-20 — Recibir la citación a asamblea y confirmar asistencia

- **Actor principal:** Copropietario
- **Precondiciones:** El administrador convocó la asamblea (CU-A-12).
- **Disparador:** Se emite la convocatoria.
- **Resultado esperado:** Conoce fecha, hora, modalidad y orden del día, y dice si asiste.

**Flujo principal**
1. El sistema le entrega la citación con: tipo de asamblea (ordinaria o extraordinaria),
   fecha y hora, modalidad (presencial, virtual o mixta **(?)**), orden del día y el
   documento formal de convocatoria en PDF.
2. El copropietario confirma si asistirá, si no asistirá, o si delegará mediante poder.
3. Si elige delegar, el sistema lo lleva a otorgar el poder (CU-R-22).
4. El sistema le recuerda la asamblea antes de que empiece.

**Flujos alternativos**
- A1. Segunda convocatoria por falta de quórum → se emite una citación nueva **(?)**.
- A2. Se modifica el orden del día → se reemite la citación y se avisa el cambio.

**Reglas de negocio**
- RN-33: la citación debe emitirse con la antelación mínima que exija el reglamento **(?)**.

**Estado en el demo:** 🟡 — `src/features/residente/AsambleasPage.tsx` muestra la citación, la
modalidad, el lugar y el orden del día de cada asamblea, ordinaria o extraordinaria. **No
confirma asistencia** (paso 2) ni entrega la convocatoria en PDF (ADR-0006).

---

### CU-R-21
## CU-R-21 — Ver la transmisión en vivo de la asamblea

- **Actor principal:** Copropietario
- **Precondiciones:** La asamblea está instalada y el administrador inició la transmisión
  (CU-A-17).
- **Disparador:** Entra a la asamblea desde la app a la hora convocada.
- **Resultado esperado:** Ve y oye la asamblea desde el celular, y desde la misma pantalla
  puede votar cuando se habilite una votación.

**Flujo principal**
1. El sistema muestra la sala de la asamblea: transmisión en vivo, orden del día con el
   punto en curso, y el quórum actualizado (CU-S-07).
2. Cuando el administrador abre una votación, aparece sobre la transmisión sin sacarlo de
   ella (CU-R-13).
3. Su presencia en la sala cuenta para el quórum **(?)** — pendiente de confirmar si la
   asistencia virtual suma igual que la presencial.

**Flujos alternativos**
- A1. Conexión inestable → la transmisión baja de calidad pero la votación sigue disponible.
  **La votación nunca debe depender del video.**
- A2. Entra tarde → se une en el punto en curso; no hay reproducción hacia atrás en vivo.
- A3. La transmisión no ha empezado → sala de espera con la hora convocada.

**Reglas de negocio**
- RN-28: el quórum se mide en coeficientes, no en número de personas conectadas.

**Estado en el demo:** ⬜ — requiere decidir el proveedor de video (ADR-0007, pendiente).

---

### CU-R-22
## CU-R-22 — Otorgar poder a otro copropietario

- **Actor principal:** Copropietario que no podrá asistir
- **Precondiciones:** Hay una asamblea convocada y todavía no instalada.
- **Disparador:** No puede asistir y quiere que su unidad sea representada.
- **Resultado esperado:** Queda un poder registrado a favor de otra persona, para esa
  asamblea.

**Flujo principal**
1. El copropietario elige la asamblea y a quién le otorga el poder.
2. El sistema valida que el destinatario pueda recibirlo: que no tenga inhabilidad **(?)**
   y que no supere su tope de representación (RN-30).
3. El copropietario confirma y firma el poder **(?)** — pendiente de definir si basta la
   confirmación en la app o se exige firma electrónica.
4. El sistema genera el documento del poder y notifica al apoderado (CU-R-23).
5. El poder queda pendiente de validación por la administración (CU-A-19).

**Flujos alternativos**
- A1. Revocar el poder antes de que la asamblea se instale → el apoderado pierde ese peso.
- A2. El apoderado ya llegó a su tope → el sistema lo rechaza y explica por qué (RN-30).
- A3. La asamblea ya se instaló → no se aceptan poderes nuevos.

**Reglas de negocio**
- RN-30: tope de coeficientes por apoderado **(? — cifra por confirmar en la Ley 675)**.
- RN-31: el poder vale para una asamblea y vence al cerrarse (CU-S-09).
- RN-32: quien otorga poder no vota esa unidad directamente.

**Estado en el demo:** ⬜ — no existe.

---

### CU-R-23
## CU-R-23 — Recibir y ejercer poderes de otros copropietarios

- **Actor principal:** Copropietario apoderado
- **Precondiciones:** Otro copropietario le otorgó poder (CU-R-22) y la administración lo
  validó (CU-A-19).
- **Disparador:** Recibe la notificación del poder.
- **Resultado esperado:** Sabe a cuántas unidades representa y con qué peso total vota.

**Flujo principal**
1. El sistema le notifica el poder recibido y le pide aceptarlo o rechazarlo.
2. Al aceptar, el sistema suma el coeficiente de esa unidad a su peso de voto.
3. Antes de cada votación ve el desglose: su unidad, más cada unidad representada.
4. Al votar (CU-R-13), el sistema registra un voto por cada unidad representada.

**Flujos alternativos**
- A1. Rechaza el poder → se le avisa a quien lo otorgó, que puede dárselo a otra persona.
- A2. El poder fue revocado → desaparece de su lista y su peso baja.
- A3. Aceptar el poder lo pondría sobre el tope → no puede aceptarlo (RN-30).

**Reglas de negocio**
- RN-27, RN-29, RN-30, RN-31.

**Estado en el demo:** ⬜ — no existe.

---

### CU-R-24
## CU-R-24 — Consultar mi coeficiente de copropiedad

- **Actor principal:** Copropietario
- **Precondiciones:** CU-R-01 completado.
- **Disparador:** Quiere saber cuánto pesa su unidad, o entender por qué su cuota es la que es.
- **Resultado esperado:** Ve su coeficiente y qué determina.

**Flujo principal**
1. El sistema muestra el coeficiente de la unidad activa y su área privada.
2. Explica en lenguaje simple qué determina el coeficiente: el valor de la cuota ordinaria
   (RN-05) y el peso de su voto en la asamblea (RN-27).
3. Muestra la suma de coeficientes de la copropiedad (100 %, RN-19) como referencia.

**Flujos alternativos**
- A1. El coeficiente cambió por una reforma al reglamento → se muestra desde cuándo aplica,
  sin borrar el histórico (RN-37).

**Reglas de negocio**
- RN-05, RN-19, RN-27, RN-37.

**Estado en el demo:** ✅ — `src/features/residente/MiUnidadPage.tsx`, con acceso desde el
inicio. Muestra el coeficiente, lo que determina (cuota del mes y peso del voto) y la suma
de la copropiedad. El peso del voto sale de `pesoDelVoto()` en `dominio/reglas.ts`: es la
única definición de RN-27, para que el módulo de asambleas la reutilice y no vuelva a leer
`unidad.coeficiente` por su cuenta.
