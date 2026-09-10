/**
 * Contabilidad — el registro diario, en un solo modulo.
 *
 * Antes cada documento tenia su propia entrada en el menu: recaudos, recibos
 * de caja, gastos, pagos, ajustes, plan de cuentas. Ocho entradas para lo que
 * en realidad son cuatro tareas, y el administrador tenia que saber en cual
 * de todas estaba lo que buscaba.
 *
 * Ahora se agrupan por lo que uno HACE, no por el tipo de documento:
 *
 *   RECAUDOS   la plata que entra: conciliar abonos y el libro de recibos.
 *   PAGOS      la plata que sale: causar el gasto y pagarlo al proveedor.
 *   AJUSTES    mover cuentas sin que entre ni salga plata.
 *   PLAN       la configuracion contable: el PUC y sus parametros.
 *
 * Este archivo no pinta nada por su cuenta: lleva la seccion activa y le pasa
 * el contenedor a la vista que corresponde. Cada una sigue viviendo en su
 * propio archivo.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaContabilidad = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui

  var SECCIONES = [
    { id: 'recaudos', texto: 'Recaudos', subtitulo: 'La plata que ENTRA: abonos por conciliar y recibos de caja' },
    { id: 'pagos', texto: 'Pagos', subtitulo: 'La plata que SALE: gastos causados, egresos y proveedores' },
    { id: 'ajustes', texto: 'Ajustes', subtitulo: 'Comprobantes que mueven cuentas sin que entre ni salga plata' },
    { id: 'plan', texto: 'Plan de cuentas', subtitulo: 'El PUC de la copropiedad y a que cuenta va cada documento' },
  ]

  var seccion = 'recaudos'

  function seccionActual() {
    return SECCIONES.filter(function (s) { return s.id === seccion })[0] || SECCIONES[0]
  }

  function irA(id, repintar) {
    seccion = id
    repintar()
  }

  function pintar(contenedor, repintar) {
    ui.agregar(contenedor, [
      el('nav', { clase: 'secciones', 'aria-label': 'Secciones de contabilidad' },
        SECCIONES.map(function (s) {
          return el('button', {
            clase: 'seccion' + (seccion === s.id ? ' activa' : ''),
            'aria-current': seccion === s.id ? 'true' : null,
            onClick: function () { irA(s.id, repintar) },
          }, s.texto)
        })),
      el('p', 'secciones__ayuda', seccionActual().subtitulo),
    ])

    if (seccion === 'recaudos') pintarRecaudos(contenedor, repintar)
    else if (seccion === 'pagos') Idiky.vistaEgresos.pintar(contenedor, repintar)
    else if (seccion === 'ajustes') Idiky.vistaAjustes.pintar(contenedor, repintar)
    else Idiky.vistaPlan.pintar(contenedor, repintar)
  }

  /**
   * Los abonos por conciliar y el libro de recibos van en la misma pagina:
   * primero lo que falta por hacer, despues lo que ya se hizo. Separarlos en
   * dos entradas obligaba a saltar de una a otra para el mismo trabajo.
   */
  function pintarRecaudos(contenedor, repintar) {
    Idiky.vistaPagos.pintar(contenedor, repintar)
    ui.agregar(contenedor, el('h2', 'titulo-seccion titulo-seccion--separador', 'Libro de recibos de caja'))
    Idiky.vistaRecibos.pintar(contenedor, repintar, { sinIndicadores: true })
  }

  return { pintar: pintar, irA: irA, SECCIONES: SECCIONES }
})()
