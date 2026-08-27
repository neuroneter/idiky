# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable + demo contable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Productos** | Dos: `apps/pwa/` (Mary) y `apps/contable/` (Jeimy) |
| **Contable** | Cartera · Pagos · Recibos de caja · Gastos · Ajustes · Reportes. Partida doble sobre un plan de cuentas |
| **Backend** | No existe. Datos simulados en el navegador, en los dos. |
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

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Ajustes y partida doble

**Qué se hizo**

Módulo de **Ajustes**: comprobantes contables que mueven cuentas sin que entre ni salga
plata. Causar intereses de mora, provisionar cartera, cargar una sanción, trasladar
excedentes al fondo de imprevistos. Con plantillas para los casos que más se repiten, y con
la opción de armar el asiento desde cero.

**El cambio de fondo está debajo.** Hasta ahora el motor trabajaba con cuentas implícitas:
sabía sumar caja, cartera, anticipos y cuentas por pagar, pero esas cuentas no existían en
ninguna parte. Para poder decir "debito esta cuenta y credito esta otra" hubo que escribirlas:
ahora hay un **plan de cuentas** (`js/plan-de-cuentas.js`) y el motor lleva **partida doble**.
Todo lo que pasa —cuotas, pagos, gastos, ajustes— se convierte en asientos, y los estados se
arman sumando saldos de cuentas.

Eso no cambió ninguna cifra de lo que ya existía; sí cambió de dónde salen.

**Verificación** — las tres suites pasan. La nueva prueba de ajustes verifica lo que importa:
que un comprobante descuadrado **se rechace** (con el motivo en pantalla), que uno cuadrado
entre, que un ajuste a cartera llegue al saldo del cliente y a su extracto marcado como
ajuste, y que al anularlo el efecto se deshaga y el balance siga cuadrando.

**Dónde va cada cosa** — si entró o salió plata, es Pagos o Gastos. Si solo hay que mover
cuentas, es Ajustes. Quedó escrito en la pantalla del módulo, porque es la confusión natural.

**Qué sigue**

1. El plan de cuentas es corto y está fijo en el código. Si el equipo necesita el PUC real o
   cuentas propias, hay que hacerlo editable (T-15).
2. Falta el libro auxiliar por cuenta en pantalla: el motor ya lo calcula
   (`auxiliarDeCuenta`), pero no hay reporte que lo muestre.
3. Sigue pendiente el intercambio de información con la PWA (T-12).

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Reportes y estados financieros

**Qué se hizo**

`apps/contable/` gana dos módulos: **Gastos** y **Reportes**.

- **Reportes** (3): movimientos por cliente y fechas —el extracto donde cartera y pagos se
  juntan en una sola línea de tiempo, con saldo corrido—, **estado de resultados** y
  **estado de situación financiera**. Se imprimen o se guardan como PDF, y se bajan en CSV.
- **Gastos.** No estaba en lo pedido, pero un estado de resultados sin egresos no es un
  estado de resultados: solo tendría la mitad de arriba. Se agregó lo mínimo — causar un
  gasto, marcarlo pagado, anularlo con motivo — para que los dos estados sean reales.
- **Motor contable** (`js/contabilidad.js`): por causación, no por caja (RN-31 a RN-33).
  Todo hecho económico mueve cuatro cuentas, y de ahí el balance **cuadra por construcción**.

**Verificación** — el estado de situación financiera cuadra, y **sigue cuadrando** después
de conciliar un abono, registrar un gasto por pagar y anular un recibo; cada operación se
probó midiendo el descuadre, que se mantuvo en cero. Nueve pasos en Chromium abriendo el
archivo desde el disco, sin errores de consola. La impresión se verificó aparte: oculta la
barra lateral y los controles, y deja el documento solo.

**Dos cosas que hay que saber al leer los reportes**

1. **Hay dos cifras de cartera y las dos son correctas.** El módulo de Cartera muestra todo
   lo que deben, incluidas las cuotas ya facturadas del mes siguiente; el balance muestra
   solo lo causado a la fecha de corte. La pantalla lo explica al pie.
2. **"Caja y bancos" no es un saldo bancario conciliado**, es lo recaudado menos lo pagado.
   Para que lo fuera haría falta registrar saldos de apertura y una conciliación bancaria.

**Qué sigue**

1. Falta el resto de la contabilidad: proveedores como entidad, presupuesto anual contra
   ejecución, y saldos de apertura para que caja sea un saldo real (T-13).
2. Sigue pendiente definir el intercambio de información con la PWA (T-12).
3. RN-31 a RN-33 son **solo de la contable**: la PWA no tiene gastos ni estados. No hay que
   duplicarlas allá.

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Aplicación contable

**Qué se hizo**

Nace el segundo producto del repositorio: [`apps/contable/`](../apps/contable/README.md),
la aplicación de cartera, pagos y recibos de caja del administrador.

- **Sin compilación, a propósito** ([ADR-0006](./adr/0006-stack-aplicacion-contable.md)).
  HTML, CSS y JavaScript planos: se abre con doble clic en `index.html`. No es una
  preferencia técnica — quien la desarrolla no puede instalar nada en su computador, y un
  stack que el equipo no puede ejecutar no es un stack.
- **Tres módulos:** Cartera (quién debe y estado de cuenta por unidad), Pagos (bandeja de
  abonos informados por conciliar, y registro de lo que llega por fuera) y Recibos de caja
  (el libro, con los anulados).
- **Las mismas reglas que la PWA**, traducidas a JavaScript con los mismos números `RN-xx`.

**Restricciones medidas, no supuestas.** Al abrir un archivo desde el disco, Chromium
bloquea los módulos ES (`import`/`export`) y el `fetch` de archivos locales. Por eso el
código usa `<script src>` clásicos y los datos viven dentro de un `.js`. Está en el ADR.

**Verificación** — recorrido completo en Chromium abriendo `index.html` desde el disco:
nueve pasos de punta a punta sin errores de consola, y la anulación revisada aparte —
devuelve al saldo exactamente el valor del recibo, lo deja en el libro marcado como anulado,
y el consecutivo no se reutiliza (RC-00051 anulado, el siguiente es RC-00052).

**Corrección de rumbo.** La sesión anterior construyó cartera y pagos dentro de la PWA
creyendo que era el entregable de Jeimy. No lo era: **Jeimy trabaja en la contable, Mary en
la PWA.** Lo de la PWA se queda —la consola de Mary necesitaba cartera igual— pero el
entregable de Jeimy es este.

**Qué sigue**

1. **Definir qué información intercambian las dos aplicaciones y en qué dirección** (T-12).
   Hoy los abonos informados vienen sembrados en `apps/contable/js/datos.js`; ese es el
   punto exacto por donde se van a conectar.
2. **Decidir el alcance del resto de la contable** (T-13): egresos y gastos, proveedores,
   plan de cuentas, balances. Lo entregado es cuentas por cobrar; el otro lado no existe.
3. Ojo con las reglas duplicadas: una `RN-xx` que cambie hay que cambiarla en los dos
   productos el mismo día (§2.1 de `10-equipo-y-orquestacion.md`).

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
