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

Lo que distingue a este módulo de una caja registradora: **el propietario dice a qué
corresponde su abono, y eso se ve antes de aplicarlo.** El sistema sugiere el reparto por
antigüedad, pero quien decide es el administrador, leyendo lo que escribió el propietario.

## Cómo está organizado

```
apps/contable/
├── index.html                 La página. Aquí se cargan los scripts, en orden.
├── estilos/app.css            Todo el diseño. El color y el espaciado salen de
│                              las variables del principio del archivo.
└── js/
    ├── formato.js             Mostrar dinero y fechas.
    ├── dominio.js             ⭐ Las reglas de negocio (RN-xx). Funciones puras.
    ├── datos.js               Semilla del demo + guardado en el navegador.
    ├── repositorio.js         ⭐ La ÚNICA puerta a los datos.
    ├── ui.js                  Ayudas para construir la pantalla.
    ├── editor-imputacion.js   El reparto de un pago entre cuotas.
    ├── vista-cartera.js       Pantalla de Cartera.
    ├── vista-pagos.js         Pantalla de Pagos.
    ├── vista-recibos.js       Pantalla de Recibos de caja.
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

## La relación con la app de Mary

Las dos aplicaciones **comparten las reglas, no el código**. `js/dominio.js` implementa las
mismas RN que `apps/pwa/src/dominio/reglas.ts`, con los mismos números, definidas en
[`docs/05-modelo-de-datos.md`](../../docs/05-modelo-de-datos.md).

Es duplicación a propósito: son lenguajes distintos y no hay compilación que las una.
**Si cambias una regla aquí, hay que cambiarla allá.** Habla con Mary antes.

El punto de encuentro concreto son los **abonos informados**: hoy vienen sembrados en
`datos.js`, y el día que las dos aplicaciones se conecten, es por ahí por donde entran los
que reportan los residentes desde su teléfono.
