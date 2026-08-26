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

## Hecho

| # | Tarea | Estado |
|---|---|---|
| T-00 | Estructura del repositorio, documentación base y demo PWA v0.1 | ✅ Hecho |
| T-10 | Módulos de cartera y pagos con abonos parciales y recibos de caja (CU-R-18, CU-A-18) | ✅ Hecho |

---

## Cómo usar este tablero

- Al **empezar** una tarea: pon tu nombre y cámbiala a `🔨 En curso`.
- Al **subir el PR**: `👀 En revisión`.
- Al **integrar**: `✅ Hecho` y muévela a la sección "Hecho".
- Si te **bloqueas**: `⛔ Bloqueado` + una nota de qué necesitas y de quién.
- **No borres tareas**, muévelas. El historial de lo que se hizo es información valiosa.
