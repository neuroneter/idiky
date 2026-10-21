# 04 — Catálogo de casos de uso

Este es el **índice maestro funcional**. Cada caso de uso tiene un identificador estable
que se usa en commits, ramas, issues y comentarios de código.

**Nomenclatura:** `CU-<ÁMBITO>-<NN>` donde el ámbito es `R` (residente), `A` (administrador),
`P` (portería), `S` (sistema) o `B` (BLOKY, el sistema real de las copropiedades: solo los casos
de uso que no existen en el demo, ADR-0013).

**Estados:** `✅ Demo` implementado en el demo v0.1 · `🟡 Parcial` implementado a medias ·
`⬜ Pendiente` documentado pero no implementado.

**Fase:** `1` entra en la primera versión real del producto · `2` siguiente · `3` después.
**Ojo:** la columna *Fase* se recalculó el 2026-08-26 con el alcance declarado por el equipo
([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)). Un `✅ Demo` en fase 1
significa "ya existe en el demo"; un `⬜ Pendiente` en fase 1 significa **hay que construirlo
y es prioritario**. Los casos de uso en **negrita** son los que el equipo pidió explícitamente.

---

## 1. Residente — app móvil

| ID | Caso de uso | Fase | Estado | Detalle |
|---|---|---|---|---|
| CU-R-01 | **Ingresar a la app** (código por SMS o correo, sin clave) | 1 | 🟡 Parcial (el flujo, sin autenticar) | [ver](./casos-de-uso/residente.md#cu-r-01) |
| CU-R-02 | Ver resumen de mi copropiedad (inicio) | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-02) |
| CU-R-03 | Consultar estado de cuenta | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-03) |
| CU-R-04 | Pagar una cuota | 1 | ✅ Demo (simulado) | [ver](./casos-de-uso/residente.md#cu-r-04) |
| CU-R-05 | Reservar una zona común | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-05) |
| CU-R-06 | Cancelar una reserva | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-06) |
| CU-R-07 | Radicar una PQRS | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-07) |
| CU-R-08 | Seguir una PQRS radicada | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-08) |
| CU-R-09 | Leer comunicados de la cartelera | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-09) |
| CU-R-10 | Autorizar un visitante y generar su código | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-10) |
| CU-R-11 | Ver correspondencia pendiente | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-11) |
| CU-R-12 | **Descargar el paz y salvo** | 1 | ✅ Demo (se emite e imprime a PDF desde el teléfono) | [ver](./casos-de-uso/residente.md#cu-r-12) |
| CU-R-13 | **Votar en una asamblea** | 1 | ✅ Demo (mayoría y quórum citando la ley; RN-74, RN-94; vota también el apoderado por la unidad que representa) | [ver](./casos-de-uso/residente.md#cu-r-13) |
| CU-R-14 | Reportar una novedad con foto (daño, ruido) | 3 | ⬜ Pendiente | — |
| CU-R-15 | Registrar mis vehículos y mascotas | 3 | ⬜ Pendiente | — |
| CU-R-16 | Recibir notificaciones push | 3 | ⬜ Pendiente | — |
| CU-R-17 | Directorio de contactos útiles y emergencias | 3 | ⬜ Pendiente | — |
| CU-R-18 | **Descargar el informe de estado de cuenta** | 1 | ✅ Demo (se emite con consecutivo y código, y se imprime o guarda en PDF desde la app — RN-127) | [ver](./casos-de-uso/residente.md#cu-r-18) |
| CU-R-19 | **Consultar y descargar mis comprobantes de pago** | 1 | 🟡 Parcial | [ver](./casos-de-uso/residente.md#cu-r-19) |
| CU-R-20 | **Recibir la citación a asamblea** | 1 | ✅ Demo (ve e imprime la citación que le llegó, CU-A-12). Confirmar asistencia **no se pide** (Mary, 2026-10-12) | [ver](./casos-de-uso/residente.md#cu-r-20) |
| CU-R-21 | **Entrar a la asamblea y marcar mi asistencia** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-21) |
| CU-R-22 | ~~Otorgar poder a otro copropietario~~ | — | ⛔ Retirado (2026-10-02, puesta al día del catálogo): lo cubren CU-R-23 —dar poder desde la app—, CU-R-31 —enviar el papel en foto— y CU-A-19 —registrarlo en papel—. Lo que dejaba abierto (tope y firma) son preguntas jurídicas de §3 bis | [ver](./casos-de-uso/residente.md#cu-r-22) |
| CU-R-23 | **Dar poder para que otro vote por mi unidad** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-23) |
| CU-R-24 | **Consultar mi coeficiente de copropiedad** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-24) |
| CU-R-25 | ~~Activar mi cuenta o recuperar mi contraseña~~ | 1 | ⛔ Retirado (2026-10-01: sin clave no hay nada que activar ni recuperar; ver CU-R-01) | [ver](./casos-de-uso/residente.md#cu-r-25) |
| CU-R-26 | **Ajustar el tamaño de la letra** | 1 | ✅ Demo · ✅ BLOKY (en la puerta, 2026-09-21) | [ver](./casos-de-uso/residente.md#cu-r-26) |
| CU-R-27 | **Registrar y dar de baja a las personas de mi unidad** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-27) |
| CU-R-28 | **Adjuntar mis documentos a un registro** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-28) |
| CU-R-29 | **Ver un proceso sancionatorio y defenderme** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-29) |
| CU-R-30 | **Informar un abono ya consignado** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-30) |
| CU-R-31 | **Enviar el poder firmado en foto** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-31) |
| CU-R-32 | **Seguir el avance de los proyectos de la copropiedad** | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-32) |

## 2. Administrador — consola web

| ID | Caso de uso | Fase | Estado | Detalle |
|---|---|---|---|---|
| CU-A-01 | Ver tablero de indicadores | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-01) |
| CU-A-02 | Administrar unidades y residentes | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-02) |
| CU-A-03 | Consultar cartera y morosidad | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-03) |
| CU-A-04 | Registrar un pago manual | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-04) |
| CU-A-05 | Generar cuotas del periodo | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-05) |
| CU-A-06 | Aprobar o rechazar reservas | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-06) |
| CU-A-07 | Atender la bandeja de PQRS | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-07) |
| CU-A-08 | Publicar un comunicado | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-08) |
| CU-A-09 | Registrar correspondencia recibida | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-09) |
| CU-A-10 | **Configurar zonas comunes y sus reglas** | 2 | ✅ Demo (crear, editar, cerrar por mantenimiento y desactivar con aviso; costos, depósito y multa por no cancelar; uso exclusivo o compartido; días y horario; aviso masivo del cierre; fotos y especificaciones — RN-104 a RN-117) | [ver](./casos-de-uso/administrador.md#cu-a-10) |
| CU-A-11 | Cargar presupuesto anual | 3 | ⬜ Pendiente | — |
| CU-A-12 | **Convocar la asamblea y emitir las citaciones** | 1 | ✅ Demo (2026-10-12: citación con número y código, enviada a cada propietario con constancia, antelación de 15 días para la ordinaria; RN-33, RN-219) | [ver](./casos-de-uso/administrador.md#cu-a-12) |
| CU-A-13 | **Emitir el paz y salvo** | 1 | ✅ Demo (desde Cartera → Paz y salvo: busca la unidad, ve el saldo, emite, imprime y anula con motivo — RN-26, RN-36) | [ver](./casos-de-uso/administrador.md#cu-a-13) |
| CU-A-14 | Gestionar proveedores y mantenimientos | 3 | ⬜ Pendiente | — |
| CU-A-15 | Administrar varias copropiedades | 3 | ⬜ Pendiente | — |
| CU-A-16 | Exportar informes (cartera, PQRS) | 2 | ⬜ Pendiente | — |
| CU-A-17 | **Instalar la asamblea y llevar la asistencia** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-17) |
| CU-A-18 | **Habilitar, abrir y cerrar una votación** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-18) |
| CU-A-19 | **Registrar un poder en papel y dar de alta a quien lo ejerce** | 1 | ✅ Demo (registra, valida el que llega en foto, muestra el acumulado y **aplica el tope de poderes por persona si el edificio lo configuró**, RN-220) | [ver](./casos-de-uso/administrador.md#cu-a-19) |
| CU-A-20 | **Levantar el acta de la asamblea** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-20) |
| CU-A-21 | **Corregir los coeficientes mal cargados** | 1 | ✅ Demo (2026-10-13: no se cambian; se corrige un error con motivo, suma 100 % y sin asamblea instalada, con historial; RN-222) | [ver](./casos-de-uso/administrador.md#cu-a-21) |
| CU-A-22 | **Administrar el catálogo de multas** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-22) |
| CU-A-23 | **Imponer una multa y llevar el proceso** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-23) |
| CU-A-24 | ~~Cobrar una cuota adicional a una unidad~~ | — | ⛔ Retirado — es la cuota extraordinaria (Mary, 2026-09-09) | [ver](./casos-de-uso/administrador.md#cu-a-24) |
| CU-A-25 | **Registrar la tasa de interés de mora de la copropiedad** | 1 | ⬜ Pendiente (corregido el 2026-10-13 contra el art. 30: el interés lo causa la ley; la asamblea solo puede bajar la tasa) | [ver](./casos-de-uso/administrador.md#cu-a-25) |
| CU-A-26 | **Registrar propietarios y ver los registros de la copropiedad** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-26) |
| CU-A-27 | Conciliar abonos y administrar recibos de caja | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-27) |
| CU-A-28 | **Registrar un proyecto y sus avances, y contárselos a los propietarios** | 1 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-28) |
| CU-A-29 | **Ver la ocupación de las zonas comunes en un calendario** | 2 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-29) |
| CU-A-30 | **Ver y descargar el informe de uso de las zonas comunes** | 2 | ✅ Demo | [ver](./casos-de-uso/administrador.md#cu-a-30) |


## 3. Portería — consola de la entrada

Ámbito nuevo (2026-08-28), **construido el mismo día** tras aprobar la propuesta. Falta la
minuta del turno. Detalle en [`casos-de-uso/porteria.md`](./casos-de-uso/porteria.md).

| ID | Caso de uso | Fase | Estado | Detalle |
|---|---|---|---|---|
| CU-P-01 | **Registrar y entregar correspondencia** | 2 | 🟡 Parcial (falta la minuta) | [ver](./casos-de-uso/porteria.md#cu-p-01) |
| CU-P-02 | **Validar el código de un visitante** | 2 | 🟡 Parcial (valida; no registra el ingreso) | [ver](./casos-de-uso/porteria.md#cu-p-02) |
| CU-P-03 | **Reconocer a quien vive aquí** | 1 | ✅ Demo | [ver](./casos-de-uso/porteria.md#cu-p-03) |

## 4. BLOKY — el sistema de las copropiedades (producto real)

Ámbito nuevo (2026-09-21, [ADR-0013](./adr/0013-bloky-dev-separada-del-demo.md)). BLOKY Dev
se construye aparte del demo; aquí van solo sus casos de uso propios. Detalle en
[`casos-de-uso/bloky.md`](./casos-de-uso/bloky.md). Estado `✅ BLOKY` = funciona en BLOKY Dev
con datos reales.

| ID | Caso de uso | Fase | Estado | Detalle |
|---|---|---|---|---|
| CU-B-01 | **Ingresar a BLOKY** (documento + código SMS al celular de BOB, o Google/Microsoft con el correo de BOB) | 1 | ✅ BLOKY (SMS, Google y Microsoft probados con cuentas reales en `https://bloky-dev.idiky.com`, 2026-09-21) | [ver](./casos-de-uso/bloky.md#cu-b-01) |
| CU-B-02 | **Poner en marcha la copropiedad:** primeros pasos (seis, con anillo de avance) y el menú de BLOKY (Inicio · Pendientes · Mi copropiedad · Convivencia · Dinero · Gobierno) | 1 | ⬜ Pendiente | [ver](./casos-de-uso/bloky.md#cu-b-02) |
| CU-B-03 | **Armar la estructura** en el terreno: estructuras, espacios, «está dentro de» y «pertenece a», croquis guardado | 1 | 🟡 BLOKY (el terreno guarda de verdad; faltan Excel y guías; prototipo: [Arma tu copropiedad](./prototipos/arma-tu-copropiedad/README.md)) | [ver](./casos-de-uso/bloky.md#cu-b-03) |
| CU-B-04 | **Configurar un espacio y su flujo de uso**: bloques de preguntas, reserva, autorizaciones, acceso, pagos, alertas y no asistencia; probar con una persona | 1 | ⬜ Pendiente (prototipo) | [ver](./casos-de-uso/bloky.md#cu-b-04) |
| CU-B-05 | **Resolver los pendientes**: soportes de pago, refutaciones de multas, reservas por aprobar | 1 | ⬜ Pendiente | [ver](./casos-de-uso/bloky.md#cu-b-05) |
| CU-B-06 | Unidades y coeficientes (con Excel) | 1 | ⬜ Por escribir | [ver](./casos-de-uso/bloky.md#cu-b-06-a-cu-b-09--por-escribir) |
| CU-B-07 | Propietarios y residentes | 1 | ⬜ Por escribir | [ver](./casos-de-uso/bloky.md#cu-b-06-a-cu-b-09--por-escribir) |
| CU-B-08 | **Tu equipo y sus grupos:** el mundo del equipo, con un espacio por grupo de trabajo (Portería, Aseo, Administración…, cada uno con En turno y Descanso) y el consejo de administración y las comisiones, con sus miembros por vincular y su calendario de reuniones | 1 | 🟡 BLOKY Dev (2026-10-21) | [ver](./casos-de-uso/bloky.md#cu-b-08) |
| CU-B-09 | **Ubicar la copropiedad:** su dirección colombiana da el punto y el terreno se dibuja sobre el barrio real (calles con nombre, vecinos, parques) con OpenStreetMap ([ADR-0017](./adr/0017-ubicacion-y-plano-real-con-openstreetmap.md)) | 1 | 🟡 BLOKY Dev (2026-10-11; lote demarcado y plano ajustado; falta calcar los bloques) | [ver](./casos-de-uso/bloky.md#cu-b-09) |
| CU-B-10 | **Armar la copropiedad desde sus documentos (con IA):** el reglamento escaneado se vuelve una propuesta validada (coeficientes 100 %, áreas, coherencia) que se confirma en el terreno ([ADR-0023](./adr/0023-bloky-nativo-para-agentes.md)) | 1 | 🟡 BLOKY Dev (desplegado con IA el 2026-10-11; falta la prueba de Daniel) | [ver](./casos-de-uso/bloky.md#cu-b-10) |
| CU-B-11 | **Los documentos de la copropiedad y su versión digital:** cada PDF guardado en R2 y transcrito página por página con su índice, para leer, buscar y para el chat de IA ([ADR-0019](./adr/0019-archivos-de-las-copropiedades-en-r2.md)) | 1 | 🟡 BLOKY Dev (desplegado el 2026-10-11; falta la prueba de Daniel) | [ver](./casos-de-uso/bloky.md#cu-b-11) |
| CU-B-12 | **Armar la planta de un espacio de trabajo:** para el negocio «espacio de trabajo» (empresa o coworking), los pisos con sus recintos (salas, oficinas privadas, zonas de puestos…) y sus puestos, al estilo del modo Plano de Spot ([ADR-0024](./adr/0024-dos-negocios-copropiedad-y-espacio-de-trabajo.md)) | 1 | 🟡 BLOKY Dev (2026-10-11; con «Cowork Centro 93»; falta la prueba de Daniel) | [ver](./casos-de-uso/bloky.md#cu-b-12) |
| CU-B-15 | **Reuniones con video:** el Administrador o el Delegado programa reuniones (tema, fecha, hora, duración, invitados) dentro del cupo mensual que el cliente contrató con IDIKY, cada una con su sala de Jitsi; se cancelan sin borrarse | 1 | 🟡 BLOKY Dev (2026-10-20: programar, cupo y cancelar; faltan el pase firmado y enviar las invitaciones, T-106) | [ver](./casos-de-uso/bloky.md#cu-b-15) |
| CU-B-14 | **Tu equipo:** los colaboradores (vigilantes, aseo, mantenimiento, administración…) como personajes animados, con su nombre y su horario de la semana, que se ajusta arrastrando en cualquier momento | 1 | 🟡 BLOKY Dev (desplegado; 2026-10-20: creador por partes, hombre y mujer, horario con tarjeta y actividades en paralelo) | [ver](./casos-de-uso/bloky.md#cu-b-14) |

## 3. Sistema — procesos automáticos

| ID | Caso de uso | Fase | Estado |
|---|---|---|---|
| CU-S-01 | Generar cuotas ordinarias mensuales | 2 | ⬜ Pendiente (hoy es manual, CU-A-05) |
| CU-S-02 | Marcar cuotas vencidas y calcular interés de mora | 1 | 🟡 Parcial (el vencimiento se marca; el interés no se calcula — **solo si la copropiedad lo activó**, RN-42) |
| CU-S-03 | **Liberar reservas no confirmadas** | 2 | ✅ Demo (vence la solicitud sin respuesta al llegar su turno y avisa al residente; el tablero alerta las que vencen en menos de 48 h — RN-122) |
| CU-S-04 | Vencer códigos de visitante | 1 | ✅ Demo (por fecha de vigencia) |
| CU-S-05 | Alertar PQRS próximas a vencer SLA | 2 | 🟡 Parcial (se muestra el indicador de vencida) |
| CU-S-06 | Enviar recordatorios de pago | 3 | ⬜ Pendiente |
| CU-S-07 | **Calcular el quórum en vivo por coeficientes (presentes + representados)** | 1 | ✅ Demo (en la asamblea instalada, la consola muestra unidades, coeficiente reunido —presentes y representadas por poder— y cuánto falta, según la convocatoria: `hayQuorum`, `faltaParaQuorum`, RN-28, RN-92) |
| CU-S-08 | **Consolidar el resultado de una votación ponderado por coeficiente** | 1 | ✅ Demo (se calcula por coeficiente **o por unidad** —RN-211, C-522 de 2002— con la mayoría y la base que exige la ley —`contarVotacion`, `resultadoVotacion`, RN-74— y se ve en la app del residente, en el acta y, mientras se vota, en la consola —CU-A-18, `VotacionPunto.tsx`—)
| CU-S-09 | **Vencer los poderes al cerrarse la asamblea** | 1 | ✅ Demo (por construcción, RN-31: cada poder está atado a una sola asamblea y no se registra ni se otorga en una cerrada; el usuario temporal del apoderado no sirve para ninguna otra) |

---

## 4. Cómo se escribe un caso de uso aquí

Formato obligatorio en los archivos de detalle:

```markdown
### CU-X-NN — Título

- **Actor principal:** …
- **Precondiciones:** …
- **Disparador:** …
- **Resultado esperado:** …

**Flujo principal**
1. …

**Flujos alternativos**
- A1. …

**Reglas de negocio**
- RN-…

**Estado en el demo:** ✅ / 🟡 / ⬜ — pantalla o archivo donde vive.
```

Las **reglas de negocio** se numeran globalmente (`RN-01`, `RN-02`…) y se listan en
[`05-modelo-de-datos.md`](./05-modelo-de-datos.md#reglas-de-negocio) para poder
referenciarlas desde varios casos de uso.
