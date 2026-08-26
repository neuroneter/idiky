# 07 — Roadmap

Cada fase termina con un **criterio de salida** verificable. No se empieza la siguiente sin
cumplirlo.

---

## Fase 1 — Demo PWA navegable ✅ *(en curso / v0.1 entregada)*

**Objetivo:** validar los flujos con usuarios reales antes de invertir en backend.

| Entregable | Estado |
|---|---|
| Documentación de visión, actores, casos de uso y modelo de datos | ✅ |
| App residente con los 11 CU de fase 1 | ✅ |
| Consola admin con los 9 CU de fase 1 | ✅ |
| Datos simulados persistentes en el navegador | ✅ |
| Instalable como PWA con funcionamiento offline básico | ✅ |

**Criterio de salida:** un administrador y un residente reales recorren los flujos completos
sin ayuda y se recogen sus observaciones en `docs/09-estado-del-proyecto.md`.

---

## Fase 2 — Backend real y autenticación ⬜

| Entregable |
|---|
| Definición del stack de backend (ADR) |
| Modelo de datos persistente y multi-tenant (RN-01) |
| Autenticación real + recuperación de contraseña |
| API que implemente la misma interfaz del repositorio |
| Migración de la PWA al adaptador de API |
| Roles y permisos aplicados en el servidor, no solo en la interfaz |
| Procesos automáticos: generación de cuotas, vencimientos, SLA (CU-S-01…05) |

**Criterio de salida:** dos usuarios en dispositivos distintos ven los mismos datos.

---

## Fase 3 — Aplicaciones nativas ⬜

| Entregable |
|---|
| Integración de Capacitor sobre el mismo build web |
| Notificaciones push (CU-R-16) |
| Cámara para PQRS con foto (CU-R-14) y escaneo de QR en portería |
| Publicación en Google Play y App Store |

**Criterio de salida:** binarios instalables en Android e iOS con push funcionando.

---

## Fase 4 — Pagos y operación real ⬜

| Entregable |
|---|
| Pasarela de pagos (PSE/tarjeta) reemplazando el pago simulado de CU-R-04 |
| Conciliación de pagos y recibos formales |
| Paz y salvo (CU-R-12, CU-A-13) |
| Asambleas con quórum por coeficiente y votación (CU-R-13, CU-A-12) |
| Informes exportables (CU-A-16) |

**Criterio de salida:** una copropiedad piloto opera un mes completo en la plataforma.

---

## Fase 5 — Escala ⬜

Multi-copropiedad para administradores (CU-A-15), portería con hardware, proveedores y
mantenimientos, integración contable, facturación electrónica.
