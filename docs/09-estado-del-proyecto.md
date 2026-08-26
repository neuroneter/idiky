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
| **Casos de uso implementados** | 22 de 35 documentados (12 de residente, 10 de administrador) |
| **Compila** | Sí — `cd apps/pwa && npm run build` |

### Lo que funciona hoy

**App del residente:** ingreso y unidad activa · inicio con resumen · estado de cuenta con
saldo por cuota · pago simulado con recibo de caja · **informar un abono ya consignado
diciendo a qué corresponde** · reserva y cancelación de zonas comunes con validación de
reglas · radicar y seguir PQRS · cartelera de comunicados · autorización de visitantes con
código · consulta de correspondencia.

**Consola del administrador:** tablero de indicadores · unidades y residentes con búsqueda,
ficha y vinculación · cartera con morosidad y estado de cuenta por unidad · **módulo de
pagos: bandeja de abonos por conciliar, imputación editable, recibos de caja y anulación
con traza** · generación de cuotas con previsualización · aprobación y rechazo de reservas ·
bandeja de PQRS con SLA · publicación de comunicados · registro y entrega de correspondencia.

### Lo que NO existe

Backend, autenticación real, pagos reales (pasarela), notificaciones push, apps nativas,
asambleas, paz y salvo, portería, presupuesto, intereses de mora, contabilidad de egresos,
informes exportables, modo oscuro.

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

### 2026-08-26 · Sesión de IA (Claude), a pedido de Jeimy · Cartera y pagos

**Qué se hizo**

Módulo de cartera y módulo de pagos, separados a propósito: cartera responde *quién debe y
por qué*, pagos maneja *la plata que entra*.

- **Abonos parciales.** El modelo era todo-o-nada: una cuota se pagaba completa o no se
  pagaba. Ahora `Cuota` tiene `saldo` además de `valor`, y `Pago` tiene `imputaciones[]`
  con cuánto se aplicó a cada cuota (RN-26, RN-27).
- **Recibo de caja.** El antiguo `comprobante` era un número suelto; ahora el pago **es**
  el recibo: consecutivo `RC-<NNNNN>` que se asigna al aplicarlo, y que se anula con motivo
  en vez de borrarse (RN-28, RN-29).
- **El propietario informa a qué corresponde su abono** (CU-R-18). Consigna por fuera,
  reporta desde su app con el concepto escrito por él, y el pago queda `reportado` sin
  tocar la cartera hasta que la administración lo concilia (RN-30).
- **Conciliación** (CU-A-18): el administrador ve lo que el propietario escribió, con el
  reparto por antigüedad ya sugerido, y lo ajusta antes de aplicar.
- De paso: `imputarPago` (RN-06) estaba definida y sin usar, y las pantallas reimplementaban
  el orden por su cuenta. Ahora la regla se usa de verdad. También se corrigió RN-22, que
  buscaba cuotas duplicadas sin filtrar por copropiedad.

**Verificación** — `npm run build` pasa. Recorrido completo en navegador (Chromium): los dos
flujos de punta a punta y la anulación, que devuelve al saldo exactamente el valor del
recibo y deja el registro marcado, no borrado.

**Supuestos que hay que confirmar con el equipo**

Se construyó sin haber cerrado tres decisiones. Si alguna cambia, cambia el módulo:

1. **El propietario informa antes, no después.** Se asumió el flujo de dos caras
   (reportar → conciliar). La alternativa era un simple campo de texto que digita el
   administrador: mucho menos trabajo, y menos útil.
2. **La deuda es de la unidad, no de la persona.** Es como funciona en propiedad
   horizontal, pero si se quiere un estado de cuenta consolidado por propietario con
   varios inmuebles, hay que agregarlo.
3. **No hay intereses de mora ni saldo a favor aplicable.** El excedente de un pago se
   guarda como `saldoAFavor` pero todavía no se puede usar contra una cuota futura.

**Nota de zonas (docs/10):** este trabajo tocó `dominio/`, `datos/`, `features/admin/` y
`features/residente/` — o sea las zonas de los tres. Vale la pena revisarlo juntos antes de
seguir repartiendo tareas por zona.

> **Corrección posterior, misma fecha.** Este módulo se construyó a pedido de Jeimy, pero
> quedó dentro de la PWA, que es el producto de **Mary**. Jeimy trabaja en la **aplicación
> contable de escritorio**, que es un programa aparte y todavía no tiene stack ni ubicación
> definidos (ver [`10-equipo-y-orquestacion.md`](./10-equipo-y-orquestacion.md) §1.1).
> Lo construido **sirve igual**: la consola necesitaba cartera y pagos. Pero no es el
> entregable de Jeimy, y las reglas RN-26 a RN-30 son justamente la parte que las dos
> aplicaciones van a compartir.

**Qué sigue**

1. Confirmar o corregir los tres supuestos de arriba.
2. Decidir si el saldo a favor se aplica automáticamente al generar la cuota siguiente.
3. Sigue pendiente cerrar [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).

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
