/**
 * Editor del reparto de un pago entre las cuotas de una unidad.
 *
 * Es la pieza central del modulo: la usan tanto "Registrar pago" como
 * "Conciliar abono". Arranca con la sugerencia por antiguedad (RN-06), pero
 * el administrador puede moverla — es el que sabe que dijo el propietario.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.editorImputacion = (function () {
  'use strict'

  var el = Idiky.ui.el
  var d = Idiky.dominio
  var f = Idiky.formato

  /**
   * `opciones`: { unidadId, valor }
   * Devuelve { nodo, imputaciones(), fijarValor(v), fijarUnidad(id) }.
   */
  function crear(opciones) {
    var unidadId = opciones.unidadId
    var valor = opciones.valor || 0
    var cuotas = []
    var reparto = {}

    var listaCuotas = el('div', 'reparto__lista')
    var resumen = el('div', 'reparto__resumen')

    var botonSugerir = el('button', {
      clase: 'boton boton--pequeno',
      type: 'button',
      onClick: function () {
        aplicarSugerencia()
        pintar()
      },
    }, 'Sugerir por antiguedad')

    var nodo = el('section', 'reparto', [
      el('div', 'reparto__cabecera', [
        el('h3', 'titulo-seccion', 'Como se aplica el pago'),
        botonSugerir,
      ]),
      listaCuotas,
      resumen,
    ])

    function cargarCuotas() {
      cuotas = unidadId ? d.cuotasPorAntiguedad(Idiky.repo.cuotasDeUnidad(unidadId)) : []
    }

    function aplicarSugerencia() {
      reparto = {}
      d.imputarPago(cuotas, valor).forEach(function (linea) {
        reparto[linea.cuotaId] = linea.valor
      })
    }

    function imputaciones() {
      return Object.keys(reparto)
        .filter(function (id) { return reparto[id] > 0 })
        .map(function (id) { return { cuotaId: id, valor: reparto[id] } })
    }

    function pintar() {
      Idiky.ui.vaciar(listaCuotas)
      Idiky.ui.vaciar(resumen)

      if (cuotas.length === 0) {
        listaCuotas.appendChild(
          Idiky.ui.vacio(
            'Esta unidad no tiene cuotas pendientes',
            'El pago quedara completo como saldo a favor.',
          ),
        )
      } else {
        var tabla = el('table', 'tabla tabla--reparto', [
          el('thead', null, el('tr', null, [
            el('th', null, 'Cuota'),
            el('th', null, 'Vence'),
            el('th', 'derecha', 'Debe'),
            el('th', 'derecha', 'Se aplica'),
          ])),
          el('tbody', null, cuotas.map(filaCuota)),
        ])
        listaCuotas.appendChild(tabla)
      }

      pintarResumen()
    }

    function filaCuota(cuota) {
      var entrada = el('input', {
        type: 'number',
        min: 0,
        max: cuota.saldo,
        step: 1000,
        clase: 'entrada-cifra',
        value: reparto[cuota.id] || 0,
        'aria-label': 'Valor a aplicar a ' + cuota.concepto + ' de ' + f.periodo(cuota.periodo),
        onInput: function (evento) {
          reparto[cuota.id] = f.aNumero(evento.target.value)
          pintarResumen()
        },
      })

      return el('tr', null, [
        el('td', null, [
          el('strong', null, cuota.concepto),
          el('span', 'sub', f.periodo(cuota.periodo)),
        ]),
        el('td', 'sub', f.fechaCorta(cuota.fechaVencimiento)),
        el('td', 'derecha cifra', f.dinero(cuota.saldo)),
        el('td', 'derecha', entrada),
      ])
    }

    /**
     * Pinta los totales. Se llama sola cuando el usuario escribe en un campo,
     * para actualizar el resumen sin volver a crear los inputs — si se
     * repintara la tabla entera, el cursor saltaria en cada tecla.
     */
    function pintarResumen() {
      var repartido = d.totalImputado(imputaciones())
      var aFavor = d.saldoAFavorDelPago(valor, imputaciones())
      var excedido = repartido > valor

      Idiky.ui.vaciar(resumen)
      resumen.appendChild(
        el('div', 'reparto__linea', [
          el('span', null, 'Repartido'),
          el('strong', 'cifra' + (excedido ? ' cifra--deuda' : ''),
            f.dinero(repartido) + ' de ' + f.dinero(valor)),
        ]),
      )
      if (aFavor > 0) {
        resumen.appendChild(
          el('div', 'reparto__linea', [
            el('span', null, 'Queda a favor de la unidad'),
            el('strong', 'cifra', f.dinero(aFavor)),
          ]),
        )
      }
      if (excedido) {
        resumen.appendChild(
          el('p', 'campo__ayuda campo__ayuda--error',
            'Estas repartiendo mas de lo que se recibio.'),
        )
      }
    }

    cargarCuotas()
    aplicarSugerencia()
    pintar()

    return {
      nodo: nodo,
      imputaciones: imputaciones,
      fijarValor: function (nuevoValor) {
        valor = nuevoValor
        aplicarSugerencia()
        pintar()
      },
      fijarUnidad: function (nuevaUnidad) {
        unidadId = nuevaUnidad
        cargarCuotas()
        aplicarSugerencia()
        pintar()
      },
    }
  }

  return { crear: crear }
})()
