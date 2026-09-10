/**
 * Gastos — el otro lado de la contabilidad.
 *
 * Sin esto los reportes solo tendrian ingresos. Un gasto se CAUSA el dia en que
 * se genera la obligacion (llego la factura del vigilante) y se PAGA despues:
 * entre esos dos momentos vive en cuentas por pagar, que es un pasivo real de
 * la copropiedad.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaGastos = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var d = Idiky.dominio
  var f = Idiky.formato

  var filtro = 'todos'

  var ESTADO_GASTO = {
    por_pagar: ['Por pagar', 'alerta'],
    pagado: ['Pagado', 'exito'],
    anulado: ['Anulado', 'error'],
  }

  function chipGasto(estado) {
    var def = ESTADO_GASTO[estado] || [estado, '']
    return ui.chip(def[0], def[1])
  }

  /**
   * La lista de gastos, sin los indicadores ni la barra de acciones: esos los
   * pone el modulo de Pagos, que es donde vive ahora esta pantalla.
   */
  function pintarLista(contenedor, repintar) {
    var todos = Idiky.repo.gastos()
    var visibles = todos.filter(function (gasto) {
      if (filtro === 'por-pagar') return gasto.estado === 'por_pagar'
      if (filtro === 'pagados') return gasto.estado === 'pagado'
      if (filtro === 'anulados') return gasto.estado === 'anulado'
      return gasto.estado !== 'anulado'
    })

    ui.agregar(contenedor, [
      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonFiltro('todos', 'Vigentes', repintar),
          botonFiltro('por-pagar', 'Por pagar', repintar),
          botonFiltro('pagados', 'Pagados', repintar),
          botonFiltro('anulados', 'Anulados', repintar),
        ]),
      ]),

      visibles.length === 0
        ? ui.vacio('No hay gastos en este filtro')
        : el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla', [
            el('thead', null, el('tr', null, [
              el('th', null, 'Fecha'),
              el('th', null, 'Concepto'),
              el('th', null, 'Cuenta PUC'),
              el('th', null, 'Proveedor'),
              el('th', 'derecha', 'Valor'),
              el('th', null, 'Estado'),
              el('th', null, ''),
            ])),
            el('tbody', null, visibles.map(function (gasto) {
              return filaGasto(gasto, repintar)
            })),
          ])),
    ])
  }

  function filaGasto(gasto, repintar) {
    return el('tr', gasto.estado === 'anulado' ? 'fila--anulada' : null, [
      el('td', 'sub', f.fechaCorta(gasto.fecha)),
      el('td', null, [
        el('strong', null, gasto.concepto),
        gasto.estado === 'pagado'
          ? el('span', 'sub', 'Pagado el ' + f.fechaCorta(gasto.fechaPago))
          : null,
      ]),
      el('td', null, [
        el('strong', 'cifra', gasto.cuenta || '—'),
        el('span', 'sub', gasto.cuenta ? Idiky.repo.nombreDeCuenta(gasto.cuenta) : gasto.categoria),
      ]),
      el('td', 'sub', gasto.proveedor || '—'),
      el('td', 'derecha cifra', f.dinero(gasto.valor)),
      el('td', null, chipGasto(gasto.estado)),
      el('td', 'derecha', gasto.estado === 'por_pagar'
        ? el('button', {
            clase: 'boton boton--pequeno boton--peligro',
            onClick: function () { abrirAnulacion(gasto.id, repintar) },
          }, 'Anular')
        : gasto.egresoId
          ? el('span', 'sub cifra', reciboDelGasto(gasto))
          : null),
    ])
  }

  function pintar(contenedor, repintar) {
    var todos = Idiky.repo.gastos()
    var vigentes = todos.filter(function (g) { return g.estado !== 'anulado' })

    var visibles = todos.filter(function (gasto) {
      if (filtro === 'por-pagar') return gasto.estado === 'por_pagar'
      if (filtro === 'pagados') return gasto.estado === 'pagado'
      if (filtro === 'anulados') return gasto.estado === 'anulado'
      return gasto.estado !== 'anulado'
    })

    var causado = vigentes.reduce(function (t, g) { return t + g.valor }, 0)
    var porPagar = vigentes
      .filter(function (g) { return g.estado === 'por_pagar' })
      .reduce(function (t, g) { return t + g.valor }, 0)

    ui.agregar(contenedor, [
      el('div', 'rejilla-indicadores', [
        el('article', 'tarjeta', ui.indicador('Gasto causado', f.dinero(causado))),
        el('article', 'tarjeta', ui.indicador('Cuentas por pagar', f.dinero(porPagar), 'deuda')),
        el('article', 'tarjeta', ui.indicador('Registros', String(vigentes.length))),
      ]),

      porPagar > 0
        ? el('div', 'nota', [
            el('div', null, [
              el('strong', null, 'Causar un gasto no es pagarlo'),
              el('span', 'sub', 'Queda debiendose hasta que se emita el comprobante de egreso, en Pagos.'),
            ]),
            el('button', {
              clase: 'boton',
              onClick: function () { Idiky.app.irA('contabilidad:pagos') },
            }, 'Ir a Pagos'),
          ])
        : null,

      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonFiltro('todos', 'Vigentes', repintar),
          botonFiltro('por-pagar', 'Por pagar', repintar),
          botonFiltro('pagados', 'Pagados', repintar),
          botonFiltro('anulados', 'Anulados', repintar),
        ]),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () { abrirRegistro(repintar) },
        }, 'Registrar gasto'),
      ]),

      visibles.length === 0
        ? ui.vacio('No hay gastos en este filtro')
        : el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla', [
            el('thead', null, el('tr', null, [
              el('th', null, 'Fecha'),
              el('th', null, 'Concepto'),
              el('th', null, 'Cuenta PUC'),
              el('th', null, 'Proveedor'),
              el('th', 'derecha', 'Valor'),
              el('th', null, 'Estado'),
              el('th', null, ''),
            ])),
            el('tbody', null, visibles.map(function (gasto) {
              return el('tr', gasto.estado === 'anulado' ? 'fila--anulada' : null, [
                el('td', 'sub', f.fechaCorta(gasto.fecha)),
                el('td', null, [
                  el('strong', null, gasto.concepto),
                  gasto.estado === 'pagado'
                    ? el('span', 'sub', 'Pagado el ' + f.fechaCorta(gasto.fechaPago))
                    : null,
                ]),
                el('td', null, [
                  el('strong', 'cifra', gasto.cuenta || '—'),
                  el('span', 'sub', gasto.cuenta ? Idiky.repo.nombreDeCuenta(gasto.cuenta) : gasto.categoria),
                ]),
                el('td', 'sub', gasto.proveedor || '—'),
                el('td', 'derecha cifra', f.dinero(gasto.valor)),
                el('td', null, chipGasto(gasto.estado)),
                el('td', 'derecha', gasto.estado === 'por_pagar'
                  ? el('div', 'grupo-acciones', [
                      el('button', {
                        clase: 'boton boton--pequeno',
                        onClick: function () { Idiky.app.irA('contabilidad:pagos') },
                        title: 'Un gasto se paga emitiendo un comprobante de egreso',
                      }, 'Pagar'),
                      el('button', {
                        clase: 'boton boton--pequeno boton--peligro',
                        onClick: function () { abrirAnulacion(gasto.id, repintar) },
                      }, 'Anular'),
                    ])
                  : gasto.egresoId
                    ? el('span', 'sub cifra', reciboDelGasto(gasto))
                    : null),
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

  /** El numero del egreso que pago este gasto, si ya se pago. */
  function reciboDelGasto(gasto) {
    var egreso = Idiky.repo.egresoPorId(gasto.egresoId)
    return egreso ? egreso.numero : ''
  }

  function abrirRegistro(repintar) {
    var estado = {
      fecha: d.hoyISO(),
      concepto: '',
      categoria: 'Vigilancia',
      valor: 0,
      proveedorId: '',
      cuenta: Idiky.repo.parametros().gasto['Vigilancia'],
    }

    var campoFecha = el('input', {
      type: 'date', value: estado.fecha,
      onChange: function (e) { estado.fecha = e.target.value },
    })
    var campoConcepto = el('input', {
      type: 'text', placeholder: 'Por ejemplo: vigilancia de agosto',
      onInput: function (e) { estado.concepto = e.target.value },
    })
    // Al cambiar la categoria se propone la cuenta del PUC configurada para
    // ella, pero se puede cambiar: la categoria agrupa, la cuenta contabiliza.
    var campoCategoria = el('select', {
      onChange: function (e) {
        estado.categoria = e.target.value
        estado.cuenta = Idiky.repo.parametros().gasto[estado.categoria] || '5195'
        pintarCuenta()
      },
    }, Idiky.repo.CATEGORIAS_GASTO.map(function (c) {
      return el('option', { value: c }, c)
    }))

    // La cuenta la decide la categoria. No se le pide al administrador: se le
    // muestra, para que sepa que va a pasar sin tener que decidirlo.
    var avisoCuenta = el('p', 'campo__ayuda')

    function pintarCuenta() {
      Idiky.ui.vaciar(avisoCuenta)
      Idiky.ui.agregar(avisoCuenta, [
        'Se va a contabilizar contra ',
        el('strong', 'cifra', estado.cuenta),
        ' — ' + Idiky.repo.nombreDeCuenta(estado.cuenta)
          + '. Esa asociacion se cambia en Plan de cuentas.',
      ])
    }
    var campoValor = el('input', {
      type: 'number', min: 0, step: 1000, value: 0,
      onInput: function (e) { estado.valor = f.aNumero(e.target.value) },
    })
    var proveedoresActivos = Idiky.repo.proveedores().filter(function (p) { return p.activo })
    if (!estado.proveedorId && proveedoresActivos.length) {
      estado.proveedorId = proveedoresActivos[0].id
    }

    // El proveedor sale del directorio: asi el gasto queda ligado a alguien
    // identificado y despues se le puede emitir el egreso.
    var campoProveedor = el('select', {
      onChange: function (e) {
        estado.proveedorId = e.target.value
        var p = Idiky.repo.proveedorPorId(estado.proveedorId)
        if (p && p.cuentaGasto) { estado.cuenta = p.cuentaGasto; pintarCuenta() }
      },
    }, proveedoresActivos.map(function (p) {
      return el('option', {
        value: p.id,
        selected: p.id === estado.proveedorId,
      }, p.razonSocial)
    }))
    pintarCuenta()

    ui.abrirModal({
      titulo: 'Registrar gasto',
      descripcion: 'El gasto se causa en la fecha que indiques, se pague ese dia o despues.',
      contenido: [
        el('div', 'fila-campos', [
          ui.campo('Fecha de causacion', campoFecha),
          ui.campo('Categoria', campoCategoria),
        ]),
        ui.campo('Concepto', campoConcepto),
        avisoCuenta,
        el('div', 'fila-campos', [
          ui.campo('Valor', campoValor),
          ui.campo('Proveedor', campoProveedor),
        ]),
        el('p', 'campo__ayuda',
          'El gasto queda en cuentas por pagar, como pasivo. Para pagarlo se emite un '
          + 'comprobante de egreso desde el modulo de Pagos, que es donde se liquidan las retenciones.'),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              Idiky.repo.registrarGasto(estado)
              ui.cerrarModal()
              repintar()
              ui.aviso('Gasto registrado.', 'exito')
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Registrar gasto'),
      ],
    })
  }

  function abrirAnulacion(gastoId, repintar) {
    var gasto = Idiky.repo.gastoPorId(gastoId)
    if (!gasto) return
    var campoMotivo = el('input', { type: 'text', placeholder: 'Por que se anula' })

    ui.abrirModal({
      titulo: 'Anular gasto',
      descripcion: gasto.concepto + ' · ' + f.dinero(gasto.valor),
      contenido: [
        ui.campo('Motivo de la anulacion', campoMotivo,
          'El registro no se borra: queda anulado y deja de contar en los reportes.'),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--peligro',
          onClick: function () {
            try {
              Idiky.repo.anularGasto({ gastoId: gastoId, motivo: campoMotivo.value })
              ui.cerrarModal()
              repintar()
              ui.aviso('Gasto anulado.', 'exito')
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Anular gasto'),
      ],
    })
  }

  return { pintar: pintar, pintarLista: pintarLista, abrirRegistro: abrirRegistro }
})()
