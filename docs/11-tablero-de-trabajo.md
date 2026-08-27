# 11 — Tablero de trabajo

Estado de las tareas en curso. **Esta tabla se actualiza en cada sesión de trabajo**; es lo
primero que mira quien llega a retomar algo.

Estados: `📋 Por hacer` · `🔨 En curso` · `👀 En revisión` · `✅ Hecho` · `⛔ Bloqueado`

---

## Ahora — antes de seguir construyendo

| # | Tarea | Responsable | Estado | Notas |
|---|---|---|---|---|
| T-01 | **Completar el levantamiento de requisitos** con el equipo | Los tres | 📋 Por hacer | Responder [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md). **Bloquea decidir el alcance real.** |
| T-02 | Validar/ajustar los casos de uso ya documentados | Los tres | 📋 Por hacer | Revisar [`04-casos-de-uso.md`](./04-casos-de-uso.md) y corregir lo que no corresponda al producto que quieren |
| T-03 | Confirmar la asignación de zonas del equipo | Los tres | 📋 Por hacer | Tabla §1 de [`10-equipo-y-orquestacion.md`](./10-equipo-y-orquestacion.md) |
| T-04 | Recorrer el demo v0.1 y anotar observaciones | Los tres | 📋 Por hacer | Cada quien anota en la bitácora qué sobra, qué falta y qué está mal planteado |

## Siguiente — cuando T-01 esté cerrado

| # | Tarea | Responsable sugerido | Estado |
|---|---|---|---|
| T-05 | Ajustar el modelo de datos al alcance real | Daniel | 📋 Por hacer |
| T-06 | Decidir el stack de backend (ADR-0006) | Daniel | 📋 Por hacer |
| T-07 | Documentar los casos de uso de asambleas (CU-R-13, CU-A-12) | Mary | 📋 Por hacer |
| T-08 | Documentar el módulo de portería (minuta, validación de visitantes) | Jeimy | 📋 Por hacer |
| T-09 | Definir la identidad visual real (colores, logo, tipografía) | Zona D | 📋 Por hacer |
| T-12 | Definir qué información intercambian la PWA y la contable, y en qué dirección | Jeimy + Mary | 📋 Por hacer |
| T-13 | Resto de la contable: proveedores, presupuesto anual, saldos de apertura de caja | Jeimy | 📋 Por hacer |
| T-17 | **Que el contador de la copropiedad valide los códigos del PUC** | Jeimy | 📋 Por hacer |

## Hecho

| # | Tarea | Estado |
|---|---|---|
| T-00 | Estructura del repositorio, documentación base y demo PWA v0.1 | ✅ Hecho |
| T-10 | Módulos de cartera y pagos con abonos parciales y recibos de caja (CU-R-18, CU-A-18) | ✅ Hecho |
| T-11 | Aplicación contable: cartera, pagos y recibos de caja sin compilación (ADR-0006) | ✅ Hecho |
| T-14 | Contable: gastos, movimientos por cliente, estado de resultados y situación financiera | ✅ Hecho |
| T-16 | Contable: partida doble, plan de cuentas y comprobantes de ajuste | ✅ Hecho |
| T-15 | Contable: PUC colombiano editable, con la cuenta guardada en cada documento | ✅ Hecho |
| T-18 | Contable: los cinco niveles del PUC y alta de cuentas en cascada | ✅ Hecho |

---

## Cómo usar este tablero

- Al **empezar** una tarea: pon tu nombre y cámbiala a `🔨 En curso`.
- Al **subir el PR**: `👀 En revisión`.
- Al **integrar**: `✅ Hecho` y muévela a la sección "Hecho".
- Si te **bloqueas**: `⛔ Bloqueado` + una nota de qué necesitas y de quién.
- **No borres tareas**, muévelas. El historial de lo que se hizo es información valiosa.
