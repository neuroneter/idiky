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
| **Contable** | Cartera · Recaudos · Recibos de caja · Gastos · Pagos a proveedores · Ajustes · Plan de cuentas · Reportes. Partida doble sobre un PUC colombiano editable |
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

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Pagos a proveedores

**Qué se hizo**

Jeimy señaló que el módulo llamado "Pagos" no estaba diseñado para pagos: era una copia del
de recibos de caja. Tenía razón, y el problema era de raíz — **ese módulo es la plata que
ENTRA**, y no existía el de la plata que SALE.

- **"Pagos" pasó a llamarse "Recaudos"** y nació **Pagos a proveedores**, con su documento
  propio: el comprobante de egreso.
- **Directorio de proveedores**, con NIT, razón social, tipo de persona, dirección, cuenta
  del PUC contra la que se causa lo que factura, y sus tarifas de retención.
- **Un egreso retiene.** Baja la cuenta por pagar por el valor bruto y lo reparte entre lo
  retenido —que queda como pasivo, porque es plata de la DIAN— y lo que sale de caja (RN-91).
- **Causar un gasto dejó de ser pagarlo.** Se le quitó la casilla "ya está pagado": un gasto
  nace por pagar, y se paga emitiendo el egreso. Eran dos hechos económicos distintos
  metidos en un solo formulario.

**Sobre consultar la DIAN**

Jeimy pidió buscar el proveedor en la base de la DIAN. Se le explicó que **no existe una API
pública y gratuita** para eso —el RUT se consulta con autenticación y automatizarlo es un
servicio de terceros de pago— y que además la aplicación abre desde un archivo local, sin
servidor (ADR-0010). Ella respondió que por ahora bastaba con poder crear al proveedor, y así
quedó.

Lo que sí es real: **el dígito de verificación se calcula con el algoritmo de la DIAN**,
verificado contra cuatro NITs de dominio público (RN-90). De paso apareció que el NIT del
demo tenía mal el DV: `901.234.567-8` cuando le corresponde `-7`.

La consulta quedó aislada en una sola función, `Idiky.proveedores.consultarNit`: el día que
haya backend, conectar un servicio real es cambiar solo su cuerpo.

**Verificación** — siete suites en Chromium, todas pasan. La nueva comprueba el DV contra
NITs conocidos, el rechazo de un DV equivocado y de un NIT repetido, que Recaudos y Pagos
sean módulos distintos, que las retenciones se liquiden bien (2 % sobre 38.000.000 = 760.000,
ICA 0,966 por mil = 36.708), que lo retenido quede como **pasivo y no como menor pago**, que
anular el egreso devuelva el gasto a por pagar, y que no se pueda pagar dos veces el mismo
gasto. El balance sigue cuadrando en todos los casos.

**Qué sigue**

1. Falta declarar y pagar las retenciones a la DIAN: hoy se acumulan en `2365` y `2368` y
   nada las descarga (T-31).
2. Los gastos de un mismo proveedor se pagan juntos, pero no se puede hacer un abono parcial
   a un gasto: o se paga completo o no se paga.
3. Sigue pendiente que el contador valide los códigos del PUC (T-27).

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Tipos de comprobante

**Qué se hizo**

El administrador dejó de tener que saber contabilidad para registrar un ajuste.

Cada **tipo de comprobante** trae ahora su asiento definido, y son datos configurables, no
código. Para registrar un ajuste se elige el tipo, la fecha y el valor —y el propietario si
el tipo lo pide—; el sistema arma el asiento y se lo muestra antes de guardar. Antes había
que elegir cuenta por cuenta y cuadrar el débito contra el crédito a mano.

- **Nueve tipos sembrados.** Cinco que registra el administrador (intereses de mora, sanción,
  provisión de cartera, traslado al fondo de imprevistos, comisión bancaria) y cuatro que
  genera el sistema (causación de cuotas, recibo de caja, causación de gasto, comprobante de
  egreso). Los del sistema no se registran a mano, pero **se muestran con sus cuentas**:
  saber contra qué mueve un recibo de caja es lo que hace auditable el módulo.
- **Consecutivo propio por tipo** (RN-88): `NI-00001` los intereses, `NP-00001` las
  provisiones. Como en cualquier libro contable.
- **Gastos ya no pide la cuenta:** la categoría la decide, y la pantalla la informa.
- **El comprobante libre queda como salida de emergencia**, con una nota que dice lo obvio:
  si el ajuste se repite, hay que hacerle su tipo.

**Dos bugs que aparecieron al probar**

1. Los comprobantes sembrados gastaban `NI-00001` y `NP-00001`, pero los tipos arrancaban su
   consecutivo en 1: el primer comprobante del usuario habría **repetido el número**. Ahora
   el consecutivo se deriva de lo sembrado, así que sigue siendo correcto si mañana se agrega
   otro comprobante a la semilla.
2. El contador de comprobantes libres arrancaba en 3, herencia de cuando todos compartían
   consecutivo.

**Verificación** — seis suites en Chromium, todas pasan. La nueva comprueba lo esencial: que
en el formulario de ajustes **no quede ni una sola opción de cuenta** que el administrador
tenga que elegir, y lo mismo en el de gastos; que el asiento se muestre armado; que cada tipo
use su consecutivo; que se exija el propietario cuando corresponde; y que no se pueda
registrar a mano un tipo del sistema.

**Qué sigue**

1. Los tipos se ven y se usan, pero todavía no se crean ni se editan desde la pantalla: hay
   que agregar ese formulario para que el equipo defina los suyos sin tocar código (T-29).
2. Sigue pendiente que el contador valide los códigos (T-27).
3. Sigue pendiente el intercambio de información con la PWA (T-22).

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Los cinco niveles del PUC

**Qué se hizo**

El plan de cuentas pasa a tener la jerarquía completa del PUC, explícita:
**Clase · Grupo · Cuenta · Subcuenta · Auxiliar**.

- **Faltaba un nivel.** El auxiliar de ocho dígitos no existía, y el de seis estaba mal
  llamado "auxiliar" cuando en el PUC es **subcuenta** (el auxiliar es de siete u ocho).
  Corregido en el modelo y en toda la interfaz.
- **El código ya no se escribe entero: se arma por niveles.** Se elige la clase, de ahí el
  grupo, de ahí la cuenta, y solo se escriben los dos dígitos que el nivel nuevo agrega. El
  prefijo del padre se muestra fijo. Así es imposible teclear un código huérfano, que antes
  el sistema tenía que rechazar después.
- **La tabla muestra el nivel de cada cuenta** y se puede filtrar por nivel.
- **Regla nueva (RN-87):** abrirle una subcuenta a una cuenta transaccional la convierte en
  título, porque el movimiento baja al nivel nuevo. Si un parámetro estaba usando esa cuenta,
  la operación se bloquea con el motivo: si no, los documentos nuevos irían a un título.

**Verificación** — cinco suites en Chromium, todas pasan. La nueva cubre la cascada: que solo
el primer selector arranque habilitado, que elegir un padre habilite el siguiente, que avise
mientras el código está incompleto y si ya existe, que abrir un auxiliar convierta a la
subcuenta en título, y que el bloqueo por parámetro en uso funcione. Los estados y el balance
de prueba siguen cuadrando.

**Qué sigue**

1. Sigue pendiente que el contador valide los códigos (T-27).
2. Falta exportar el balance de prueba y el libro auxiliar a CSV.
3. Sigue pendiente el intercambio de información con la PWA (T-22).

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · PUC editable

**Qué se hizo**

El plan de cuentas dejó de ser una constante del código: ahora es un **PUC colombiano
editable** que vive en los datos, con 86 cuentas a la medida de una copropiedad. Se agregan,
se renombran y se desactivan desde la nueva pantalla **Plan de cuentas**, que además trae el
**balance de prueba**.

- **Códigos de cuatro dígitos según el PUC** (Decreto 2650). Los de seis son auxiliares
  propios de la copropiedad, nivel que el PUC deja a criterio de cada entidad. Como una
  copropiedad es una ESAL, el grupo 41 se adaptó a sus conceptos (cuotas de administración,
  extraordinarias, intereses) en vez de los del PUC de comerciantes, que van por sector.
- **Parámetros:** qué cuenta usa cada documento, editable en la misma pantalla.
- **Cada documento guarda su cuenta** (RN-85). Es la decisión de fondo: cambiar un parámetro
  afecta a los documentos futuros, no a los pasados, así que reconfigurar el plan **no mueve
  la contabilidad de un mes cerrado**.
- Los estados pasaron a presentarse en **dos niveles**: la cuenta con su total y los
  auxiliares debajo. Volver a "Servicios" como una sola línea habría escondido vigilancia,
  aseo y servicios públicos, que es justo lo que mira la asamblea.

**Verificación** — cuatro suites en Chromium, todas pasan. La nueva cubre lo que importa: que
se rechace una cuenta huérfana y un código de largo inválido, que no se pueda desactivar una
cuenta que un parámetro está usando, que los documentos guarden sus cuentas, y —lo más
importante— que **cambiar un parámetro no reescriba los documentos viejos** mientras los
nuevos sí usan la cuenta nueva. Las cifras de los estados no cambiaron con la migración.

**⚠️ Lo que hay que hacer antes de usar esto en contabilidad real**

Los códigos son la adaptación convencional del PUC para propiedad horizontal, no una verdad
revelada. **El contador de la copropiedad tiene que revisarlos.** Se dejó todo editable y con
la advertencia en la propia pantalla.

**Qué sigue**

1. Que el contador valide el plan y ajuste lo que haga falta.
2. Falta exportar el balance de prueba y el libro auxiliar a CSV; el motor ya los calcula.
3. Sigue pendiente el intercambio de información con la PWA (T-22).

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
   cuentas propias, hay que hacerlo editable (T-25).
2. Falta el libro auxiliar por cuenta en pantalla: el motor ya lo calcula
   (`auxiliarDeCuenta`), pero no hay reporte que lo muestre.
3. Sigue pendiente el intercambio de información con la PWA (T-22).

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Reportes y estados financieros

**Qué se hizo**

`apps/contable/` gana dos módulos: **Gastos** y **Reportes**.

- **Reportes** (3): movimientos por cliente y fechas —el extracto donde cartera y pagos se
  juntan en una sola línea de tiempo, con saldo corrido—, **estado de resultados** y
  **estado de situación financiera**. Se imprimen o se guardan como PDF, y se bajan en CSV.
- **Gastos.** No estaba en lo pedido, pero un estado de resultados sin egresos no es un
  estado de resultados: solo tendría la mitad de arriba. Se agregó lo mínimo — causar un
  gasto, marcarlo pagado, anularlo con motivo — para que los dos estados sean reales.
- **Motor contable** (`js/contabilidad.js`): por causación, no por caja (RN-80 a RN-82).
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
   ejecución, y saldos de apertura para que caja sea un saldo real (T-23).
2. Sigue pendiente definir el intercambio de información con la PWA (T-22).
3. RN-80 a RN-82 son **solo de la contable**: la PWA no tiene gastos ni estados. No hay que
   duplicarlas allá.

### 2026-08-27 · Sesión de IA (Claude), a pedido de Jeimy · Aplicación contable

**Qué se hizo**

Nace el segundo producto del repositorio: [`apps/contable/`](../apps/contable/README.md),
la aplicación de cartera, pagos y recibos de caja del administrador.

- **Sin compilación, a propósito** ([ADR-0010](./adr/0010-stack-aplicacion-contable.md)).
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

1. **Definir qué información intercambian las dos aplicaciones y en qué dirección** (T-22).
   Hoy los abonos informados vienen sembrados en `apps/contable/js/datos.js`; ese es el
   punto exacto por donde se van a conectar.
2. **Decidir el alcance del resto de la contable** (T-23): egresos y gastos, proveedores,
   plan de cuentas, balances. Lo entregado es cuentas por cobrar; el otro lado no existe.
3. Ojo con las reglas duplicadas: una `RN-xx` que cambie hay que cambiarla en los dos
   productos el mismo día (§2.1 de `10-equipo-y-orquestacion.md`).

### 2026-08-26 · Sesión de IA (Claude), a pedido de Jeimy · Cartera y pagos

**Qué se hizo**

Módulo de cartera y módulo de pagos, separados a propósito: cartera responde *quién debe y
por qué*, pagos maneja *la plata que entra*.

- **Abonos parciales.** El modelo era todo-o-nada: una cuota se pagaba completa o no se
  pagaba. Ahora `Cuota` tiene `saldo` además de `valor`, y `Pago` tiene `imputaciones[]`
  con cuánto se aplicó a cada cuota (RN-75, RN-76).
- **Recibo de caja.** El antiguo `comprobante` era un número suelto; ahora el pago **es**
  el recibo: consecutivo `RC-<NNNNN>` que se asigna al aplicarlo, y que se anula con motivo
  en vez de borrarse (RN-77, RN-78).
- **El propietario informa a qué corresponde su abono** (CU-R-30). Consigna por fuera,
  reporta desde su app con el concepto escrito por él, y el pago queda `reportado` sin
  tocar la cartera hasta que la administración lo concilia (RN-79).
- **Conciliación** (CU-A-27): el administrador ve lo que el propietario escribió, con el
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
> entregable de Jeimy, y las reglas RN-75 a RN-79 son justamente la parte que las dos
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
