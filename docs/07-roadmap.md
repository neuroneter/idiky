# 07 — Roadmap

Cada fase termina con un **criterio de salida** verificable. No se empieza la siguiente sin
cumplirlo.

> ⚠️ **Replanteado el 2026-08-26.** El equipo declaró el alcance del producto
> ([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)) y el orden anterior
> ya no servía: **asambleas y documentos descargables estaban en la fase 4**, cuando en
> realidad son la mitad de lo que se pidió. Se movieron a la fase 2.
>
> Lo que bajó de prioridad a cambio: pasarela de pagos, notificaciones push, apps nativas y
> los módulos que nadie mencionó (visitantes, correspondencia, cartelera).

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

## Fase 2 — El producto real ⬜

Es la fase grande. Tiene tres frentes que avanzan en paralelo y **el orden importa**:
el backend es prerrequisito de los otros dos.

### 2a — Backend y autenticación *(prerrequisito)*

| Entregable |
|---|
| Definición del stack de backend (ADR-0008) |
| Modelo de datos persistente y multi-tenant (RN-01) |
| Autenticación real + recuperación de contraseña |
| API que implemente la misma interfaz del repositorio |
| Migración de la PWA al adaptador de API |
| Roles y permisos aplicados en el servidor, no solo en la interfaz |
| Procesos automáticos: generación de cuotas, vencimientos, SLA (CU-S-01…05) |

**Criterio de salida:** dos usuarios en dispositivos distintos ven los mismos datos.

### 2b — Documentos descargables

| Entregable |
|---|
| **Decisión de cómo se generan los PDF (ADR-0006)** — bloquea todo lo demás de este frente |
| Entidad `Documento` con consecutivo y verificación (RN-36) |
| Paz y salvo (CU-R-12, CU-A-13) |
| Informe de estado de cuenta descargable (CU-R-18) |
| Historial y descarga de comprobantes de pago (CU-R-19) |

**Criterio de salida:** un copropietario al día descarga su paz y salvo sin ayuda, y el
documento sirve para un trámite real.

### 2c — Asambleas *(el núcleo del producto)*

| Entregable |
|---|
| Coeficientes editables con validación de 100 % e histórico (CU-A-21, CU-R-24) |
| Convocatoria y citaciones (CU-A-12, CU-R-20) |
| Poderes: otorgar, aceptar, validar, topes (CU-R-22, CU-R-23, CU-A-19) |
| Quórum en vivo por coeficientes (CU-S-07) |
| Votaciones: habilitar, votar, consolidar (CU-A-18, CU-R-13, CU-S-08) |
| Acta generada desde los datos (CU-A-20) |
| **Decisión del proveedor de transmisión (ADR-0007)** |
| Transmisión en vivo (CU-A-17, CU-R-21) |

> **La transmisión va de última a propósito.** Una asamblea sin video se puede hacer por
> teléfono; una asamblea sin votación válida no se puede hacer. Si hay que recortar, se
> recorta el video, no el registro del voto.

**Criterio de salida:** una asamblea real se instala, vota y produce su acta desde la
plataforma, y el acta resiste la revisión de la comisión verificadora.

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
| Pasarela de pagos (PSE/tarjeta) reemplazando el pago simulado de CU-R-04 **(? — sin confirmar si el pago se hace en la app)** |
| Conciliación de pagos y recibos formales |
| Informes exportables para el administrador (CU-A-16) |
| Configuración de zonas comunes por el administrador (CU-A-10) |

**Criterio de salida:** una copropiedad piloto opera un mes completo en la plataforma.

> Paz y salvo y asambleas **salieron de esta fase** y subieron a la fase 2: son alcance
> declarado, no operación avanzada.

---

## Fase 5 — Escala ⬜

Multi-copropiedad para administradores (CU-A-15), portería con hardware, proveedores y
mantenimientos, integración contable, facturación electrónica.
