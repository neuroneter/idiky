# 11 — Tablero de trabajo

Estado de las tareas en curso. **Esta tabla se actualiza en cada sesión de trabajo**; es lo
primero que mira quien llega a retomar algo.

Estados: `📋 Por hacer` · `🔨 En curso` · `👀 En revisión` · `✅ Hecho` · `⛔ Bloqueado`

---

## Ahora — antes de seguir construyendo

| # | Tarea | Responsable | Estado | Notas |
|---|---|---|---|---|
| T-01 | **Completar el levantamiento de requisitos** con el equipo | Los tres | 🔨 En curso | El alcance funcional quedó declarado ([§0](./12-levantamiento-pendiente.md)). **Faltan §3 bis (asambleas) y §3 ter (documentos)**, que bloquean el diseño |
| T-02 | Validar/ajustar los casos de uso ya documentados | Los tres | 🔨 En curso | Catálogo actualizado con 12 CU nuevos. Falta que el equipo los revise |
| T-03 | Confirmar la asignación de zonas del equipo | Los tres | 📋 Por hacer | Tabla §1 de [`10-equipo-y-orquestacion.md`](./10-equipo-y-orquestacion.md). **Mary indicó que trabajará en la app móvil**, hoy asignada a Jeimy |
| T-04 | Recorrer el demo v0.1 y anotar observaciones | Los tres | 📋 Por hacer | Cada quien anota en la bitácora qué sobra, qué falta y qué está mal planteado |
| T-10 | **Responder las preguntas de asamblea** (§3 bis) | Los tres | 📋 Por hacer | Peso del voto, quórum, mayorías, tope de poderes. **Bloquea RN-27 a RN-34 y todo el módulo** |
| T-11 | **Confirmar el tope legal de poderes** (Ley 675 de 2001) | Los tres | 📋 Por hacer | Hay que leer el artículo y citarlo. **No se implementa RN-30 con una cifra supuesta** |
| T-12 | **Decidir si visitantes, correspondencia y cartelera siguen** | Los tres | 📋 Por hacer | Están implementados pero nadie los mencionó en el alcance |
| T-13 | **ADR-0006 — cómo se generan los PDF** | Daniel | 📋 Por hacer | Bloquea paz y salvo, estado de cuenta, comprobante y acta |
| T-14 | **ADR-0007 — proveedor de transmisión en vivo** | Daniel | 📋 Por hacer | Costo por minuto, grabación, ancho de banda |
| T-15 | Corregir los bugs del demo detectados en la revisión | Zona A / D | ✅ Hecho | Zona horaria, íconos PWA, vigencia del visitante y doble toque. Ver bitácora del 2026-08-26 |
| T-16 | Saldar las tres deudas de arquitectura | Daniel (zona C) | 📋 Por hacer | Validar las reglas en el repositorio y no solo en la UI · usar `imputarPago()` en vez de reimplementarlo · RN-22 debe filtrar por copropiedad |

## Siguiente — cuando T-01 esté cerrado

| # | Tarea | Responsable sugerido | Estado |
|---|---|---|---|
| T-05 | Ajustar el modelo de datos al alcance real | Daniel | 📋 Por hacer |
| T-06 | Decidir el stack de backend (ADR-0008) | Daniel | 📋 Por hacer |
| T-07 | Documentar los casos de uso de asambleas — **hecho, ver CU-R-13, CU-R-20…24 y CU-A-12, CU-A-17…21** | Mary | ✅ Hecho |
| T-08 | Documentar el módulo de portería (minuta, validación de visitantes) | Jeimy | 📋 Por hacer |
| T-09 | Definir la identidad visual real — **colores hechos** (azul + fucsia); faltan logo y tipografía | Zona D | 🔨 En curso |

## Hecho

| # | Tarea | Estado |
|---|---|---|
| T-00 | Estructura del repositorio, documentación base y demo PWA v0.1 | ✅ Hecho |

---

## Cómo usar este tablero

- Al **empezar** una tarea: pon tu nombre y cámbiala a `🔨 En curso`.
- Al **subir el PR**: `👀 En revisión`.
- Al **integrar**: `✅ Hecho` y muévela a la sección "Hecho".
- Si te **bloqueas**: `⛔ Bloqueado` + una nota de qué necesitas y de quién.
- **No borres tareas**, muévelas. El historial de lo que se hizo es información valiosa.
