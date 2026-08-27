# Idiky Contable

Aplicación de **cartera, pagos y recibos de caja** para la administración de una copropiedad.
Es un producto distinto de la PWA (`apps/pwa/`): esta corre en el computador del
administrador y la otra en el teléfono del residente.

## Cómo abrirla

**Doble clic en `index.html`.** Eso es todo.

No necesita Node, ni npm, ni servidor, ni conexión a internet. Se abre en cualquier navegador
moderno. Para trabajar en ella: editas un archivo, guardas, y recargas el navegador (F5).

Los datos se guardan en el navegador (`localStorage`), así que lo que hagas se conserva al
recargar. El botón **"Reiniciar demo"** devuelve todo a su estado inicial.

## Qué hace

| Módulo | Para qué |
|---|---|
| **Cartera** | Quién debe, cuánto y desde cuándo. Estado de cuenta por unidad y generación de las cuotas del periodo. |
| **Pagos** | Los abonos que los propietarios informaron y hay que conciliar, y el registro de la plata que llega por fuera. |
| **Recibos de caja** | El libro completo, con los anulados. Ver el detalle de cualquier recibo y anularlo con motivo. |
| **Gastos** | Lo que la copropiedad debe y lo que ya pagó. Es el otro lado de la contabilidad. |
| **Ajustes** | Comprobantes contables que mueven cuentas **sin que entre ni salga plata**: intereses de mora, provisiones, reclasificaciones, traslados al fondo de imprevistos. |
| **Reportes** | Movimientos por cliente y fechas, estado de resultados y estado de situación financiera. Se imprimen (o se guardan como PDF) y se bajan en CSV. |

Lo que distingue a este módulo de una caja registradora: **el propietario dice a qué
corresponde su abono, y eso se ve antes de aplicarlo.** El sistema sugiere el reparto por
antigüedad, pero quien decide es el administrador, leyendo lo que escribió el propietario.

## Cómo funciona la contabilidad por dentro

La aplicación lleva **partida doble** sobre un plan de cuentas corto (`js/plan-de-cuentas.js`).
Hay dos fuentes de asientos y se suman en el mismo sitio:

- **Automáticos:** salen solos de las cuotas, los pagos y los gastos. Nadie los escribe.
- **Manuales:** los comprobantes de ajuste que registras en el módulo de Ajustes.

Como **todo asiento tiene debe = haber**, el balance cuadra por construcción, vengan los
asientos de donde vengan. Por eso un comprobante descuadrado se rechaza al guardarlo: es
mejor decirlo ahí que dejar que aparezca después en el estado de situación financiera.

> **Regla para saber dónde va cada cosa:** si entró o salió plata, va en **Pagos** o en
> **Gastos**. Si solo hay que mover cuentas, va en **Ajustes**.

## Cómo leen los reportes

Los tres reportes trabajan **por causación, no por caja**. Una cuota es ingreso el día en
que se causa (el primero de su mes) aunque el propietario pague tres meses después; un gasto
es egreso el día en que se causa aunque se pague al mes siguiente. Es lo que hace que la
cartera exista como cifra: **la cartera es justamente lo causado que todavía no se ha
recaudado.**

Todo hecho económico mueve cuatro cuentas:

| Hecho | Efecto |
|---|---|
| Se causa una cuota | ↑ Cartera · ↑ Ingresos |
| Se aplica un pago | ↑ Caja · ↓ Cartera · el excedente ↑ Anticipos (pasivo) |
| Se anula un recibo | lo contrario, con la fecha de la anulación |
| Se causa un gasto | ↑ Egresos · ↑ Cuentas por pagar |
| Se paga un gasto | ↓ Caja · ↓ Cuentas por pagar |

De ahí el estado de situación financiera cuadra **por construcción**: activo = pasivo +
patrimonio. Si algún día no cuadra, la pantalla lo dice en rojo en vez de esconderlo —
significa que se agregó un hecho económico que no pasa por `contabilidad.js`.

> **Dos cifras de cartera distintas, y las dos correctas.** El módulo de Cartera muestra
> todo lo que deben, incluidas las cuotas ya facturadas del mes siguiente. El estado de
> situación financiera muestra solo lo causado hasta la fecha de corte. Responden preguntas
> distintas; la pantalla lo explica al pie.

## Cómo está organizado

```
apps/contable/
├── index.html                 La página. Aquí se cargan los scripts, en orden.
├── estilos/app.css            Todo el diseño. El color y el espaciado salen de
│                              las variables del principio del archivo.
└── js/
    ├── formato.js             Mostrar dinero y fechas.
    ├── dominio.js             ⭐ Las reglas de cartera y pagos (RN-xx). Funciones puras.
    ├── plan-de-cuentas.js     ⭐ Las cuentas contables y a cuál va cada cosa.
    ├── contabilidad.js        ⭐ El motor: convierte todo en asientos y arma los estados.
    ├── datos.js               Semilla del demo + guardado en el navegador.
    ├── repositorio.js         ⭐ La ÚNICA puerta a los datos.
    ├── ui.js                  Ayudas para construir la pantalla.
    ├── editor-imputacion.js   El reparto de un pago entre cuotas.
    ├── vista-cartera.js       Pantalla de Cartera.
    ├── vista-pagos.js         Pantalla de Pagos.
    ├── vista-recibos.js       Pantalla de Recibos de caja.
    ├── vista-gastos.js        Pantalla de Gastos.
    ├── vista-ajustes.js       Pantalla de Ajustes (comprobantes contables).
    ├── vista-reportes.js      Los tres reportes, con impresión y CSV.
    └── app.js                 Arranque y navegación.
```

## Tres reglas al escribir código aquí

1. **Nada de `import` / `export`.** El navegador los bloquea al abrir un archivo desde el
   disco. Se usan `<script src>` clásicos, en el orden que fija `index.html`. Si agregas un
   archivo nuevo, agrégalo también ahí.
2. **Los datos van dentro de un `.js`, nunca en un `.json` aparte.** `fetch` de archivos
   locales también está bloqueado.
3. **Todo acceso a datos pasa por `repositorio.js`.** Ninguna pantalla lee `localStorage` ni
   recorre las listas por su cuenta. El día que haya servidor, se cambia ese archivo y las
   pantallas no se tocan.

El porqué de las tres está en [ADR-0006](../../docs/adr/0006-stack-aplicacion-contable.md).

**Una más, para los reportes:** el cálculo va en `contabilidad.js`, nunca en la pantalla.
`vista-reportes.js` solo pinta lo que ese archivo devuelve. Así las cifras se pueden revisar
y probar sin abrir el navegador.

> El botón **Descargar CSV** solo funciona al abrir el archivo desde tu computador. En la
> versión compartida por enlace el navegador bloquea las descargas, y el botón aparece
> desactivado; ahí se usa **Imprimir o guardar PDF**, que sí funciona en los dos lados.

## La relación con la app de Mary

Las dos aplicaciones **comparten las reglas, no el código**. `js/dominio.js` implementa las
mismas RN que `apps/pwa/src/dominio/reglas.ts`, con los mismos números, definidas en
[`docs/05-modelo-de-datos.md`](../../docs/05-modelo-de-datos.md).

Es duplicación a propósito: son lenguajes distintos y no hay compilación que las una.
**Si cambias una regla aquí, hay que cambiarla allá.** Habla con Mary antes.

El punto de encuentro concreto son los **abonos informados**: hoy vienen sembrados en
`datos.js`, y el día que las dos aplicaciones se conecten, es por ahí por donde entran los
que reportan los residentes desde su teléfono.
