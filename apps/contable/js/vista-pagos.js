/**
 * Pagos — la caja de la copropiedad.
 *
 * Dos entradas y una sola salida:
 *   1. Lo que el propietario informo desde su app y hay que conciliar.
 *   2. Lo que llego por fuera y digita la administracion.
 *   -> Las dos terminan en un recibo de caja.
 *
 * Los abonos informados llegan de la aplicacion de los residentes. Hoy vienen
 * de la semilla; el dia que las dos aplicaciones se conecten, es por aqui por
 * donde entran.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaPagos = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var f = Idiky.formato

  var MEDIOS = [
    ['transferencia', 'Transferencia'],
    ['efectivo', 'Efectivo'],
    ['pse', 'PSE'],
    ['tarjeta', 'Tarjeta'],
    ['otro', 'Otro'],
  ]

  function pintar(contenedor, repintar) {
    var porConciliar = Idiky.repo.abonosReportados()
    var totalPorConciliar = porConciliar.reduce(function (t, p) { return t + p.valor }, 0)
    var recibos = Idiky.repo.recibos()
    var aplicados = recibos.filter(function (p) { return p.estado === 'aplicado' })
    var totalAplicado = aplicados.reduce(function (t, p) { return t + p.valor }, 0)

    ui.agregar(contenedor, [
      el('div', 'rejilla-indicadores', [
        el('article', 'tarjeta', ui.indicador('Por conciliar', f.dinero(totalPorConciliar))),
        el('article', 'tarjeta', ui.indicador('Abonos en espera', String(porConciliar.length))),
        el('article', 'tarjeta', ui.indicador('Recaudo aplicado', f.dinero(totalAplicado))),
        el('article', 'tarjeta', ui.indicador('Recibos emitidos', String(aplicados.length))),
      ]),

      el('div', 'barra-acciones', [
        el('h2', 'titulo-seccion', 'Abonos informados por los propietarios'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () { abrirRegistro(null, repintar) },
        }, 'Registrar pago'),
      ]),

      porConciliar.length === 0
        ? ui.vacio(
            'No hay abonos por conciliar',
            'Cuando un propietario informe un pago, aparecera aqui con el detalle de a que corresponde.',
          )
        : el('div', 'lista-abonos', porConciliar.map(function (pago) {
            return tarjetaAbono(pago, repintar)
          })),
    ])
  }

  function tarjetaAbono(pago, repintar) {
    return el('article', 'tarjeta tarjeta--abono', [
      el('div', 'abono__cabecera', [
        el('div', null, [
          el('div', 'abono__titulo', [
            el('strong', null, Idiky.repo.etiquetaUnidad(pago.unidadId)),
            ui.chipPago(pago.estado),
          ]),
          el('span', 'sub', Idiky.repo.nombrePropietario(pago.unidadId)
            + ' · ' + f.fechaHora(pago.fecha)
            + ' · ' + pago.medio + ' ' + pago.referencia),
        ]),
        el('strong', 'cifra cifra--grande', f.dinero(pago.valor)),
      ]),

      pago.conceptoInformado ? ui.citaDelPropietario(pago.conceptoInformado) : null,

      el('div', 'abono__acciones', [
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () { abrirConciliacion(pago.id, repintar) },
        }, 'Conciliar y aplicar'),
        el('button', {
          clase: 'boton',
          onClick: function () { Idiky.vistaRecibos.abrirAnulacion(pago.id, repintar) },
        }, 'Descartar'),
      ]),
    ])
  }

  // -------------------------------------------------------------------------
  // Conciliar un abono informado
  // -------------------------------------------------------------------------

  function abrirConciliacion(pagoId, repintar) {
    var pago = Idiky.repo.pagoPorId(pagoId)
    if (!pago) return

    var editor = Idiky.editorImputacion.crear({
      unidadId: pago.unidadId,
      valor: pago.valor,
    })

    ui.abrirModal({
      titulo: 'Conciliar abono · ' + Idiky.repo.etiquetaUnidad(pago.unidadId),
      descripcion: 'Revisa lo que informo el propietario y decide como se aplica.',
      contenido: [
        el('div', 'resumen-pago', [
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Valor recibido'),
            el('strong', 'cifra cifra--grande', f.dinero(pago.valor)),
          ]),
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Medio y referencia'),
            el('span', null, pago.medio + ' · ' + pago.referencia),
          ]),
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Informado por'),
            el('span', null, pago.registradoPor),
          ]),
        ]),
        pago.conceptoInformado ? ui.citaDelPropietario(pago.conceptoInformado) : null,
        editor.nodo,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var aplicado = Idiky.repo.aplicarPago({
                pagoId: pago.id,
                imputaciones: editor.imputaciones(),
              })
              ui.cerrarModal()
              repintar()
              ui.aviso('Abono aplicado. Recibo ' + aplicado.recibo + '.', 'exito')
              Idiky.vistaRecibos.abrirDetalle(aplicado.id, repintar)
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Aplicar y emitir recibo'),
      ],
    })
  }

  // -------------------------------------------------------------------------
  // Registrar un pago que llego por fuera
  // -------------------------------------------------------------------------

  function abrirRegistro(unidadPreseleccionada, repintar) {
    var unidades = Idiky.repo.unidades()
    var estado = {
      unidadId: unidadPreseleccionada || unidades[0].id,
      valor: 0,
      medio: 'transferencia',
      referencia: '',
      concepto: '',
    }

    var editor = Idiky.editorImputacion.crear({
      unidadId: estado.unidadId,
      valor: estado.valor,
    })

    var campoUnidad = el('select', {
      onChange: function (e) {
        estado.unidadId = e.target.value
        editor.fijarUnidad(estado.unidadId)
      },
    }, unidades.map(function (u) {
      return el('option', {
        value: u.id,
        selected: u.id === estado.unidadId,
      }, u.etiqueta + ' — ' + Idiky.repo.nombrePropietario(u.id))
    }))

    var campoValor = el('input', {
      type: 'number',
      min: 0,
      step: 1000,
      value: 0,
      onInput: function (e) {
        estado.valor = f.aNumero(e.target.value)
        editor.fijarValor(estado.valor)
      },
    })

    var campoMedio = el('select', {
      onChange: function (e) { estado.medio = e.target.value },
    }, MEDIOS.map(function (m) {
      return el('option', { value: m[0] }, m[1])
    }))

    var campoReferencia = el('input', {
      type: 'text',
      placeholder: 'Numero de consignacion o comprobante',
      onInput: function (e) { estado.referencia = e.target.value },
    })

    var campoConcepto = el('textarea', {
      rows: 2,
      placeholder: 'Que dijo el propietario que estaba pagando',
      onInput: function (e) { estado.concepto = e.target.value },
    })

    ui.abrirModal({
      titulo: 'Registrar pago',
      descripcion: 'Para la plata que llego por fuera de la app: consignacion, efectivo o transferencia.',
      contenido: [
        ui.campo('Unidad', campoUnidad),
        el('div', 'fila-campos', [
          ui.campo('Valor recibido', campoValor),
          ui.campo('Medio de pago', campoMedio),
        ]),
        ui.campo('Referencia', campoReferencia),
        ui.campo('A que corresponde', campoConcepto,
          'Queda guardado en el recibo. Es lo que explica por que se aplico donde se aplico.'),
        editor.nodo,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var pago = Idiky.repo.registrarPago({
                unidadId: estado.unidadId,
                valor: estado.valor,
                medio: estado.medio,
                referencia: estado.referencia,
                conceptoInformado: estado.concepto,
                imputaciones: editor.imputaciones(),
              })
              ui.cerrarModal()
              repintar()
              ui.aviso('Pago registrado. Recibo ' + pago.recibo + '.', 'exito')
              Idiky.vistaRecibos.abrirDetalle(pago.id, repintar)
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Registrar y emitir recibo'),
      ],
    })
  }

  return { pintar: pintar, abrirRegistro: abrirRegistro }
})()
