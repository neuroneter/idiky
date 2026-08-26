# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Backend** | No existe. Datos simulados en el navegador. |
| **Autenticación** | Simulada (selección de perfil, [ADR-0004](./adr/0004-autenticacion-demo.md)) |
| **Casos de uso implementados** | 20 de 33 documentados (11 de residente, 9 de administrador) |
| **Compila** | Sí — `cd apps/pwa && npm run build` |

### Lo que funciona hoy

**App del residente:** ingreso y unidad activa · inicio con resumen · estado de cuenta ·
pago simulado con comprobante · reserva y cancelación de zonas comunes con validación de
reglas · radicar y seguir PQRS · cartelera de comunicados · autorización de visitantes con
código · consulta de correspondencia.

**Consola del administrador:** tablero de indicadores · unidades y residentes con búsqueda,
ficha y vinculación · cartera con morosidad · registro de pagos manuales · generación de
cuotas con previsualización · aprobación y rechazo de reservas · bandeja de PQRS con SLA ·
publicación de comunicados · registro y entrega de correspondencia.

### Lo que NO existe

Backend, autenticación real, pagos reales, notificaciones push, apps nativas, asambleas,
paz y salvo, portería, presupuesto, informes exportables, modo oscuro.

### ⚠️ Advertencia importante sobre el alcance

El demo se construyó sobre **supuestos de un conjunto residencial típico**, antes de tener
el levantamiento completo de requisitos del equipo. Sirve como **base de conversación y
esqueleto técnico**, no como definición del producto.

**Antes de seguir construyendo funcionalidad nueva**, hay que cerrar
[`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md). Es probable que varios
casos de uso cambien, se eliminen o aparezcan otros.

---

## Bitácora

> Formato: fecha · quién · qué se hizo · qué sigue. **Las entradas nuevas van arriba.**

### 2026-08-26 · Sesión de IA (Claude) · Arranque del repositorio

**Qué se hizo**

- Estructura del repositorio: `docs/` (documentación) y `apps/pwa/` (demo).
- Documentación base: visión y alcance, glosario del dominio de propiedad horizontal,
  actores y matriz de permisos, catálogo de 33 casos de uso con su detalle, modelo de datos
  con 25 reglas de negocio numeradas, arquitectura, convenciones, roadmap de 5 fases.
- Cinco ADR: stack, estrategia multiplataforma, capa de datos con adaptadores,
  autenticación simulada, código visual de visitantes.
- Demo PWA funcional (React + TypeScript + Vite) con 20 casos de uso implementados,
  datos simulados persistentes e instalable como PWA.
- Documentación de trabajo en equipo para Jeimy, Mary y Daniel: zonas de propiedad de
  código, protocolo para archivos compartidos, flujo de git y tablero de tareas.
- Documento de levantamiento pendiente con las preguntas abiertas del producto.

**Decisiones tomadas** — ADR-0001 a ADR-0005 (ver [`adr/`](./adr/)).

**Qué sigue**

1. El equipo responde [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).
2. Recorrer el demo y anotar observaciones aquí mismo.
3. Ajustar el catálogo de casos de uso al alcance real antes de construir más.

**Advertencia para quien retome:** no des el alcance del demo por definitivo. Léelo como
"esto es lo que se puede hacer con esta arquitectura", no como "esto es lo que el producto
va a ser".
