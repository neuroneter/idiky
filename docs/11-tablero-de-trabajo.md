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
| T-10 | **Responder las preguntas de asamblea** (§3 bis) | Los tres | 📋 Por hacer | Quórum, mayorías, tope de poderes. La pantalla de asambleas ya vota y cuenta por coeficiente, pero **no puede decir si un punto se aprobó** hasta que esto se responda |
| T-11 | **Confirmar el tope legal de poderes** (Ley 675 de 2001) | Los tres | 📋 Por hacer | Hay que leer el artículo y citarlo. **No se implementa RN-30 con una cifra supuesta** |
| T-12 | **Decidir si visitantes, correspondencia y cartelera siguen** | Los tres | 📋 Por hacer | Están implementados pero nadie los mencionó en el alcance |
| T-13 | **ADR-0006 — cómo se generan los PDF** | Daniel | ✅ Hecho | Escrito el 2026-08-28. Los cinco documentos quedan bloqueados por el backend (ADR-0008), no por la decisión |
| T-14 | ~~ADR-0007 — proveedor de transmisión en vivo~~ | Daniel | ✅ Hecho (2026-09-10) | **No hay proveedor que elegir**: se enlaza Zoom/Meet. El costo por minuto desaparece; queda abierto si la grabación es soporte del acta |
| T-15 | Corregir los bugs del demo detectados en la revisión | Zona A / D | ✅ Hecho | Zona horaria, íconos PWA, vigencia del visitante y doble toque. Ver bitácora del 2026-08-26 |
| T-17 | **Definir qué se intercambia con la app contable de Jeimy** | Mary + Jeimy | 📋 Por hacer | La destinación específica de una extraordinaria (RN-48) es dato contable: lo recaudado tiene que poder cruzarse con lo gastado en esa destinación |
| T-18 | **Cómo se envía el código de un solo uso** (SMS, WhatsApp o correo) y con qué proveedor | Daniel | 📋 Por hacer | Sale del flujo de acceso decidido el 2026-08-28 (RN-54). Tiene costo por mensaje y afecta el ADR de backend |
| T-19 | **Consola de portería** (CU-P-01, CU-P-02) | Jeimy | 🟡 A medias | Construida el 2026-08-28: turno, visitantes y correspondencia. **Falta la minuta**, que espera las respuestas de T-08 |
| T-16 | Saldar las tres deudas de arquitectura | Daniel (zona C) | 📋 Por hacer | Validar las reglas en el repositorio y no solo en la UI —**empezando por RN-49: `generarCuotas()` no comprueba quién la llama**— · usar `imputarPago()` en vez de reimplementarlo · RN-22 debe filtrar por copropiedad |

## Siguiente — cuando T-01 esté cerrado

| # | Tarea | Responsable sugerido | Estado |
|---|---|---|---|
| T-05 | Ajustar el modelo de datos al alcance real | Daniel | 📋 Por hacer |
| T-06 | Decidir el stack de backend (ADR-0008) | Daniel | 📋 Por hacer |
| T-07 | Documentar los casos de uso de asambleas — **hecho, ver CU-R-13, CU-R-20…24 y CU-A-12, CU-A-17…21** | Mary | ✅ Hecho |
| T-08 | Documentar el módulo de portería (minuta, validación de visitantes) | Jeimy | 🔨 En curso |
| T-09 | Definir la identidad visual real (colores, logo, tipografía) | Zona D | ✅ Hecho |
| T-22 | ~~Definir qué información intercambian la PWA y la contable~~ — **es la misma tarea que T-17**; se lleva allí | Jeimy + Mary | 📋 Por hacer |
| T-23 | Resto de la contable: proveedores, presupuesto anual, saldos de apertura de caja | Jeimy | 📋 Por hacer |
| T-27 | **Que el contador de la copropiedad valide los códigos del PUC** | Jeimy | 📋 Por hacer |
| T-29 | Crear y editar tipos de comprobante desde la pantalla (hoy solo se ven y se usan) | Jeimy | 📋 Por hacer |
| T-31 | Declarar y pagar a la DIAN las retenciones acumuladas en 2365 y 2368 | Jeimy | 📋 Por hacer |
| T-33 | **Validar la cartera integrada en la PWA**: paz y salvo, sanciones y abonos parciales sobre el modelo de `saldo` por cuota (RN-75 a RN-79) | Mary + Jeimy | 📋 Por hacer |
| T-34 | Unificar las dos herramientas de empaquetado del demo (`empaquetar-demo.py` y `empaquetar.mjs`) en una sola | Zona D | 📋 Por hacer |
| T-35 | **Despliegue de infraestructura**: entorno, dominio y pipeline para publicar la PWA y la contable. **Ya construido en la rama `claude/infra-podman-1wkn5z` (`infra/`, ADR-0011 y ADR-0012); falta integrarla en `main`** | Responsable de integración | 📋 Por hacer |

## Hecho

| # | Tarea | Estado |
|---|---|---|
| T-00 | Estructura del repositorio, documentación base y demo PWA v0.1 | ✅ Hecho |
| T-36 | **Integración de las ramas de Mary y Jeimy** en una sola, con la numeración unificada (2026-09-10) | ✅ Hecho |
| T-20 | Módulos de cartera y pagos con abonos parciales y recibos de caja (CU-R-30, CU-A-27) | ✅ Hecho |
| T-21 | Aplicación contable: cartera, pagos y recibos de caja sin compilación (ADR-0010) | ✅ Hecho |
| T-24 | Contable: gastos, movimientos por cliente, estado de resultados y situación financiera | ✅ Hecho |
| T-26 | Contable: partida doble, plan de cuentas y comprobantes de ajuste | ✅ Hecho |
| T-25 | Contable: PUC colombiano editable, con la cuenta guardada en cada documento | ✅ Hecho |
| T-28 | Contable: los cinco niveles del PUC y alta de cuentas en cascada | ✅ Hecho |
| T-30 | Contable: tipos de comprobante con su asiento, para que el administrador no elija cuentas | ✅ Hecho |
| T-32 | Contable: módulo de pagos a proveedores con egresos, retenciones y directorio | ✅ Hecho |
| T-40 | Contable: menú de ocho entradas a tres, agrupadas por tarea en un módulo de Contabilidad | ✅ Hecho |
| T-41 | Contable: guía de despliegue en el servidor de desarrollo ([`14`](./14-despliegue-de-la-contable.md)) | ✅ Hecho |

---

## Cómo usar este tablero

- Al **empezar** una tarea: pon tu nombre y cámbiala a `🔨 En curso`.
- Al **subir el PR**: `👀 En revisión`.
- Al **integrar**: `✅ Hecho` y muévela a la sección "Hecho".
- Si te **bloqueas**: `⛔ Bloqueado` + una nota de qué necesitas y de quién.
- **No borres tareas**, muévelas. El historial de lo que se hizo es información valiosa.
