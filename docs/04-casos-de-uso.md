# 04 — Catálogo de casos de uso

Este es el **índice maestro funcional**. Cada caso de uso tiene un identificador estable
que se usa en commits, ramas, issues y comentarios de código.

**Nomenclatura:** `CU-<ÁMBITO>-<NN>` donde el ámbito es `R` (residente), `A` (administrador)
o `S` (sistema).

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
| CU-R-01 | Ingresar y seleccionar unidad activa | 1 | ✅ Demo | [ver](./casos-de-uso/residente.md#cu-r-01) |
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
| CU-R-12 | **Descargar el paz y salvo** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-12) |
| CU-R-13 | **Votar en una asamblea** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-13) |
| CU-R-14 | Reportar una novedad con foto (daño, ruido) | 3 | ⬜ Pendiente | — |
| CU-R-15 | Registrar mis vehículos y mascotas | 3 | ⬜ Pendiente | — |
| CU-R-16 | Recibir notificaciones push | 3 | ⬜ Pendiente | — |
| CU-R-17 | Directorio de contactos útiles y emergencias | 3 | ⬜ Pendiente | — |
| CU-R-18 | **Descargar el informe de estado de cuenta** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-18) |
| CU-R-19 | **Consultar y descargar mis comprobantes de pago** | 1 | 🟡 Parcial | [ver](./casos-de-uso/residente.md#cu-r-19) |
| CU-R-20 | **Recibir la citación a asamblea y confirmar asistencia** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-20) |
| CU-R-21 | **Ver la transmisión en vivo de la asamblea** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-21) |
| CU-R-22 | **Otorgar poder a otro copropietario** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-22) |
| CU-R-23 | **Recibir y ejercer poderes de otros copropietarios** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-23) |
| CU-R-24 | **Consultar mi coeficiente de copropiedad** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/residente.md#cu-r-24) |

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
| CU-A-10 | Configurar zonas comunes y sus reglas | 2 | ⬜ Pendiente | — |
| CU-A-11 | Cargar presupuesto anual | 3 | ⬜ Pendiente | — |
| CU-A-12 | **Convocar la asamblea y emitir las citaciones** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-12) |
| CU-A-13 | **Emitir el paz y salvo** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-13) |
| CU-A-14 | Gestionar proveedores y mantenimientos | 3 | ⬜ Pendiente | — |
| CU-A-15 | Administrar varias copropiedades | 3 | ⬜ Pendiente | — |
| CU-A-16 | Exportar informes (cartera, PQRS) | 2 | ⬜ Pendiente | — |
| CU-A-17 | **Transmitir la asamblea en vivo** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-17) |
| CU-A-18 | **Habilitar, abrir y cerrar una votación** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-18) |
| CU-A-19 | **Validar y registrar los poderes** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-19) |
| CU-A-20 | **Generar el acta de la asamblea** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-20) |
| CU-A-21 | **Administrar los coeficientes de las unidades** | 1 | ⬜ Pendiente | [ver](./casos-de-uso/administrador.md#cu-a-21) |

## 3. Sistema — procesos automáticos

| ID | Caso de uso | Fase | Estado |
|---|---|---|---|
| CU-S-01 | Generar cuotas ordinarias mensuales | 2 | ⬜ Pendiente (hoy es manual, CU-A-05) |
| CU-S-02 | Marcar cuotas vencidas y calcular interés de mora | 2 | 🟡 Parcial (el vencimiento se marca; el interés no se calcula) |
| CU-S-03 | Liberar reservas no confirmadas | 2 | ⬜ Pendiente |
| CU-S-04 | Vencer códigos de visitante | 1 | ✅ Demo (por fecha de vigencia) |
| CU-S-05 | Alertar PQRS próximas a vencer SLA | 2 | 🟡 Parcial (se muestra el indicador de vencida) |
| CU-S-06 | Enviar recordatorios de pago | 3 | ⬜ Pendiente |
| CU-S-07 | **Calcular el quórum en vivo por coeficientes (presentes + representados)** | 1 | ⬜ Pendiente |
| CU-S-08 | **Consolidar el resultado de una votación ponderado por coeficiente** | 1 | ⬜ Pendiente |
| CU-S-09 | **Vencer los poderes al cerrarse la asamblea** | 1 | ⬜ Pendiente |

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
