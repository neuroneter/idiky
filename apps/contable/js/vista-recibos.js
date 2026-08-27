/**
 * Recibos de caja — el libro.
 *
 * Un recibo de caja es la constancia de que la plata entro. Por eso aqui NO
 * hay boton de borrar: un recibo equivocado se anula, con motivo y con fecha,
 * y se queda en el libro. El consecutivo tampoco se reutiliza. Eso es lo que
 * hace que el libro sirva para auditar (RN-28, RN-29).
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaRecibos = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var d = Idiky.dominio
  var f = Idiky.formato

  var filtro = 'todos'
  var busqueda = ''

  function pintar(contenedor, repintar) {
    var todos = Idiky.repo.recibos()

    var visibles = todos.filter(function (pago) {
      if (filtro === 'aplicados' && pago.estado !== 'aplicado') return false
      if (filtro === 'anulados' && pago.estado !== 'anulado') return false
      if (!busqueda) return true
      var texto = [
        pago.recibo || '',
        pago.referencia || '',
        Idiky.repo.etiquetaUnidad(pago.unidadId),
        Idiky.repo.nombrePropietario(pago.unidadId),
      ].join(' ').toLowerCase()
      return texto.indexOf(busqueda.toLowerCase()) !== -1
    })

    var totalAplicado = todos
      .filter(function (p) { return p.estado === 'aplicado' })
      .reduce(function (t, p) { return t + p.valor }, 0)
    var totalAnulado = todos
      .filter(function (p) { return p.estado === 'anulado' })
      .reduce(function (t, p) { return t + p.valor }, 0)

    var campoBusqueda = el('input', {
      type: 'search',
      clase: 'busqueda',
      value: busqueda,
      placeholder: 'Buscar por recibo, unidad, propietario o referencia',
      onInput: function (e) {
        busqueda = e.target.value
        repintar({ mantenerFoco: 'busqueda' })
      },
    })

    ui.agregar(contenedor, [
      el('div', 'rejilla-indicadores', [
        el('article', 'tarjeta', ui.indicador('Recibos en el libro', String(todos.length))),
        el('article', 'tarjeta', ui.indicador('Total aplicado', f.dinero(totalAplicado))),
        el('article', 'tarjeta', ui.indicador('Total anulado', f.dinero(totalAnulado), 'deuda')),
      ]),

      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonFiltro('todos', 'Todos', repintar),
          botonFiltro('aplicados', 'Aplicados', repintar),
          botonFiltro('anulados', 'Anulados', repintar),
        ]),
        campoBusqueda,
      ]),

      visibles.length === 0
        ? ui.vacio('Ningun recibo coincide', 'Prueba con otro filtro o con otra busqueda.')
        : el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla', [
            el('thead', null, el('tr', null, [
              el('th', null, 'Recibo'),
              el('th', null, 'Fecha'),
              el('th', null, 'Unidad'),
              el('th', null, 'Propietario'),
              el('th', 'derecha', 'Valor'),
              el('th', null, 'Estado'),
              el('th', null, ''),
            ])),
            el('tbody', null, visibles.map(function (pago) {
              return el('tr', pago.estado === 'anulado' ? 'fila--anulada' : null, [
                el('td', 'cifra', pago.recibo || '—'),
                el('td', 'sub', f.fechaHora(pago.fecha)),
                el('td', null, Idiky.repo.etiquetaUnidad(pago.unidadId)),
                el('td', 'sub', Idiky.repo.nombrePropietario(pago.unidadId)),
                el('td', 'derecha cifra', f.dinero(pago.valor)),
                el('td', null, ui.chipPago(pago.estado)),
                el('td', 'derecha', el('button', {
                  clase: 'boton boton--pequeno',
                  onClick: function () { abrirDetalle(pago.id, repintar) },
                }, 'Ver recibo')),
              ])
            })),
          ])),
    ])
  }

  function botonFiltro(id, texto, repintar) {
    return el('button', {
      clase: 'filtro',
      'aria-pressed': String(filtro === id),
      onClick: function () { filtro = id; repintar() },
    }, texto)
  }

  // -------------------------------------------------------------------------
  // Detalle del recibo
  // -------------------------------------------------------------------------

  function abrirDetalle(pagoId, repintar) {
    var pago = Idiky.repo.pagoPorId(pagoId)
    if (!pago) return

    var propietario = Idiky.repo.propietarioDe(pago.unidadId)
    var esAnulado = pago.estado === 'anulado'

    ui.abrirModal({
      titulo: pago.recibo ? 'Recibo de caja ' + pago.recibo : 'Abono por conciliar',
      descripcion: Idiky.repo.etiquetaUnidad(pago.unidadId)
        + ' · ' + (propietario ? propietario.nombre : 'Sin propietario'),
      contenido: [
        esAnulado
          ? el('div', 'nota nota--anulado', [
              el('div', null, [
                el('strong', null, 'Recibo anulado'),
                el('span', 'sub', f.fechaHora(pago.fechaAnulacion) + ' · ' + pago.motivoAnulacion),
              ]),
            ])
          : null,

        el('div', 'resumen-pago', [
          linea('Valor', el('strong', 'cifra cifra--grande', f.dinero(pago.valor))),
          linea('Medio', document.createTextNode(pago.medio)),
          linea('Referencia', document.createTextNode(pago.referencia)),
          linea('Fecha del pago', document.createTextNode(f.fechaHora(pago.fecha))),
          pago.fechaAplicacion
            ? linea('Fecha de aplicacion', document.createTextNode(f.fechaHora(pago.fechaAplicacion)))
            : null,
          linea('Estado', ui.chipPago(pago.estado)),
          linea('Registrado por', document.createTextNode(pago.registradoPor)),
        ]),

        pago.conceptoInformado ? ui.citaDelPropietario(pago.conceptoInformado) : null,

        pago.imputaciones.length > 0
          ? el('div', null, [
              el('h3', 'titulo-seccion', 'Se aplico a'),
              el('table', 'tabla', [
                el('tbody', null, pago.imputaciones.map(function (aplicacion) {
                  var cuota = Idiky.repo.todasLasCuotas().filter(function (c) {
                    return c.id === aplicacion.cuotaId
                  })[0]
                  return el('tr', null, [
                    el('td', null, cuota
                      ? cuota.concepto + ' · ' + f.periodo(cuota.periodo)
                      : aplicacion.cuotaId),
                    el('td', 'derecha cifra', f.dinero(aplicacion.valor)),
                  ])
                })),
              ]),
            ])
          : null,

        pago.saldoAFavor > 0
          ? el('div', 'reparto__linea', [
              el('span', null, 'Saldo a favor de la unidad'),
              el('strong', 'cifra', f.dinero(pago.saldoAFavor)),
            ])
          : null,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cerrar'),
        esAnulado ? null : el('button', {
          clase: 'boton boton--peligro',
          onClick: function () {
            ui.cerrarModal()
            abrirAnulacion(pago.id, repintar)
          },
        }, d.sePuedeAnular(pago) ? 'Anular recibo' : 'Descartar abono'),
      ],
    })
  }

  function linea(etiqueta, valor) {
    return el('div', 'resumen-pago__linea', [el('span', null, etiqueta), valor])
  }

  // -------------------------------------------------------------------------
  // Anulacion
  // -------------------------------------------------------------------------

  function abrirAnulacion(pagoId, repintar) {
    var pago = Idiky.repo.pagoPorId(pagoId)
    if (!pago) return

    var esRecibo = d.sePuedeAnular(pago)
    var campoMotivo = el('input', {
      type: 'text',
      placeholder: 'Por ejemplo: consignacion devuelta por el banco',
    })

    ui.abrirModal({
      titulo: esRecibo ? 'Anular recibo ' + pago.recibo : 'Descartar abono informado',
      descripcion: esRecibo
        ? 'El saldo vuelve a las cuotas y el recibo queda marcado como anulado.'
        : 'El abono deja de estar en la bandeja. Queda registrado con su motivo.',
      contenido: [
        el('div', 'resumen-pago', [
          linea('Unidad', document.createTextNode(Idiky.repo.etiquetaUnidad(pago.unidadId))),
          linea('Valor', el('strong', 'cifra', f.dinero(pago.valor))),
        ]),
        ui.campo('Motivo de la anulacion', campoMotivo,
          'Es obligatorio: el recibo no se borra, y el motivo es lo que explica el hueco en el consecutivo.'),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--peligro',
          onClick: function () {
            try {
              Idiky.repo.anularPago({ pagoId: pago.id, motivo: campoMotivo.value })
              ui.cerrarModal()
              repintar()
              ui.aviso(
                esRecibo
                  ? 'Recibo anulado. El saldo volvio a las cuotas.'
                  : 'Abono descartado.',
                'exito',
              )
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, esRecibo ? 'Anular recibo' : 'Descartar'),
      ],
    })
  }

  return { pintar: pintar, abrirDetalle: abrirDetalle, abrirAnulacion: abrirAnulacion }
})()
