/**
 * Ajustes — comprobantes contables.
 *
 * Aqui se mueve la contabilidad SIN que entre ni salga plata: causar
 * intereses de mora, provisionar cartera de dificil cobro, reclasificar una
 * cuenta, corregir un error de imputacion, trasladar excedentes al fondo de
 * imprevistos. Nada de eso es un pago ni un recaudo, y por eso no cabe en
 * Pagos.
 *
 * La unica regla dura: el comprobante tiene que cuadrar. Si el debe no es
 * igual al haber, no se guarda — es mejor rechazarlo aqui que dejar un
 * descuadre para que aparezca despues en el balance.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaAjustes = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var d = Idiky.dominio
  var f = Idiky.formato

  var filtro = 'vigentes'

  /**
   * Plantillas de los ajustes que mas se repiten en una copropiedad. No son
   * obligatorias — se puede armar el comprobante desde cero — pero evitan
   * tener que recordar que cuenta va contra cual.
   */
  var PLANTILLAS = [
    {
      id: 'intereses',
      texto: 'Causar intereses de mora',
      concepto: 'Intereses de mora',
      pideUnidad: true,
      lineas: [
        { cuenta: '130515', lado: 'debe' },
        { cuenta: '4115', lado: 'haber' },
      ],
    },
    {
      id: 'provision',
      texto: 'Provisionar cartera de dificil cobro',
      concepto: 'Provision de cartera de dificil cobro',
      pideUnidad: false,
      lineas: [
        { cuenta: '519910', lado: 'debe' },
        { cuenta: '139905', lado: 'haber' },
      ],
    },
    {
      id: 'sancion',
      texto: 'Cargar una sancion a una unidad',
      concepto: 'Sancion',
      pideUnidad: true,
      lineas: [
        { cuenta: '130520', lado: 'debe' },
        { cuenta: '4120', lado: 'haber' },
      ],
    },
    {
      id: 'fondo',
      texto: 'Trasladar excedentes al fondo de imprevistos',
      concepto: 'Traslado al fondo de imprevistos',
      pideUnidad: false,
      lineas: [
        { cuenta: '3705', lado: 'debe' },
        { cuenta: '3305', lado: 'haber' },
      ],
    },
    {
      id: 'libre',
      texto: 'Comprobante en blanco',
      concepto: '',
      pideUnidad: false,
      lineas: [
        { cuenta: '', lado: 'debe' },
        { cuenta: '', lado: 'haber' },
      ],
    },
  ]

  function pintar(contenedor, repintar) {
    var todos = Idiky.repo.comprobantes()
    var vigentes = todos.filter(function (c) { return c.estado !== 'anulado' })
    var visibles = filtro === 'anulados'
      ? todos.filter(function (c) { return c.estado === 'anulado' })
      : vigentes

    var totalMovido = vigentes.reduce(function (total, c) {
      return total + c.lineas.reduce(function (t, l) { return t + (l.debe || 0) }, 0)
    }, 0)

    ui.agregar(contenedor, [
      el('div', 'rejilla-indicadores', [
        el('article', 'tarjeta', ui.indicador('Comprobantes vigentes', String(vigentes.length))),
        el('article', 'tarjeta', ui.indicador('Valor ajustado', f.dinero(totalMovido))),
        el('article', 'tarjeta', ui.indicador('Anulados', String(todos.length - vigentes.length))),
      ]),

      el('div', 'nota nota--info', [
        el('div', null, [
          el('strong', null, 'Un comprobante de ajuste no mueve plata'),
          el('span', 'sub',
            'Mueve cuentas. Si lo que pasa es que entro o salio dinero, va en Pagos o en Gastos, no aqui.'),
        ]),
      ]),

      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonFiltro('vigentes', 'Vigentes', repintar),
          botonFiltro('anulados', 'Anulados', repintar),
        ]),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () { abrirNuevo(repintar) },
        }, 'Nuevo comprobante'),
      ]),

      visibles.length === 0
        ? ui.vacio('No hay comprobantes en este filtro',
            'Un ajuste tipico: causar los intereses de mora del mes.')
        : el('div', 'lista-abonos', visibles.map(function (c) {
            return tarjetaComprobante(c, repintar)
          })),
    ])
  }

  function botonFiltro(id, texto, repintar) {
    return el('button', {
      clase: 'filtro',
      'aria-pressed': String(filtro === id),
      onClick: function () { filtro = id; repintar() },
    }, texto)
  }

  function tarjetaComprobante(comprobante, repintar) {
    var total = comprobante.lineas.reduce(function (t, l) { return t + (l.debe || 0) }, 0)
    var anulado = comprobante.estado === 'anulado'

    return el('article', 'tarjeta' + (anulado ? ' tarjeta--anulada' : ''), [
      el('div', 'abono__cabecera', [
        el('div', null, [
          el('div', 'abono__titulo', [
            el('strong', 'cifra', comprobante.numero),
            anulado ? ui.chip('Anulado', 'error') : ui.chip('Registrado', 'exito'),
          ]),
          el('span', 'sub', comprobante.concepto + ' · ' + f.fecha(comprobante.fecha)),
        ]),
        el('strong', 'cifra cifra--grande', f.dinero(total)),
      ]),

      comprobante.detalle ? el('p', 'sub', comprobante.detalle) : null,

      el('table', 'tabla tabla--asiento', [
        el('thead', null, el('tr', null, [
          el('th', null, 'Cuenta'),
          el('th', null, 'Detalle'),
          el('th', 'derecha', 'Debe'),
          el('th', 'derecha', 'Haber'),
        ])),
        el('tbody', null, comprobante.lineas.map(function (linea) {
          return el('tr', null, [
            el('td', null, [
              el('strong', 'cifra', linea.cuenta),
              el('span', 'sub', Idiky.repo.nombreDeCuenta(linea.cuenta)),
            ]),
            el('td', 'sub', linea.unidadId
              ? Idiky.repo.etiquetaUnidad(linea.unidadId)
              : (linea.descripcion || '—')),
            el('td', 'derecha cifra', linea.debe ? f.dinero(linea.debe) : ''),
            el('td', 'derecha cifra', linea.haber ? f.dinero(linea.haber) : ''),
          ])
        })),
      ]),

      anulado
        ? el('p', 'campo__ayuda',
            'Anulado el ' + f.fechaHora(comprobante.fechaAnulacion) + ': ' + comprobante.motivoAnulacion)
        : el('div', 'abono__acciones', [
            el('button', {
              clase: 'boton boton--pequeno boton--peligro',
              onClick: function () { abrirAnulacion(comprobante.id, repintar) },
            }, 'Anular comprobante'),
          ]),
    ])
  }

  // ---------------------------------------------------------------------------
  // Nuevo comprobante
  // ---------------------------------------------------------------------------

  function abrirNuevo(repintar) {
    var estado = {
      fecha: d.hoyISO(),
      concepto: '',
      detalle: '',
      lineas: [],
    }

    var contenedorLineas = el('div', 'asiento-editor')
    var resumen = el('div', 'reparto__resumen')
    var campoConcepto = el('input', {
      type: 'text',
      placeholder: 'Por ejemplo: intereses de mora de agosto',
      onInput: function (e) { estado.concepto = e.target.value },
    })

    function aplicarPlantilla(id) {
      var plantilla = PLANTILLAS.filter(function (p) { return p.id === id })[0]
      if (!plantilla) return
      estado.concepto = plantilla.concepto
      campoConcepto.value = plantilla.concepto
      estado.lineas = plantilla.lineas.map(function (l) {
        return { cuenta: l.cuenta, lado: l.lado, valor: 0, unidadId: '' }
      })
      pintarLineas()
    }

    function pintarLineas() {
      ui.vaciar(contenedorLineas)
      estado.lineas.forEach(function (linea, indice) {
        contenedorLineas.appendChild(filaLinea(linea, indice))
      })
      contenedorLineas.appendChild(
        el('button', {
          clase: 'boton boton--pequeno',
          type: 'button',
          onClick: function () {
            estado.lineas.push({ cuenta: '', lado: 'debe', valor: 0, unidadId: '' })
            pintarLineas()
          },
        }, 'Agregar linea'),
      )
      pintarResumen()
    }

    function filaLinea(linea, indice) {
      var selectorCuenta = el('select', {
        onChange: function (e) { linea.cuenta = e.target.value; pintarLineas() },
      }, [el('option', { value: '' }, 'Elige una cuenta…')].concat(
        Idiky.repo.cuentasDeMovimiento().map(function (c) {
          return el('option', {
            value: c.codigo,
            selected: c.codigo === linea.cuenta,
          }, Idiky.repo.etiquetaDeCuenta(c.codigo))
        }),
      ))

      var selectorLado = el('select', {
        onChange: function (e) { linea.lado = e.target.value; pintarResumen() },
      }, [
        el('option', { value: 'debe', selected: linea.lado === 'debe' }, 'Debe'),
        el('option', { value: 'haber', selected: linea.lado === 'haber' }, 'Haber'),
      ])

      var campoValor = el('input', {
        type: 'number', min: 0, step: 1000, clase: 'entrada-cifra',
        value: linea.valor || 0,
        'aria-label': 'Valor de la linea ' + (indice + 1),
        onInput: function (e) { linea.valor = f.aNumero(e.target.value); pintarResumen() },
      })

      // La unidad solo tiene sentido en cartera: es lo que hace que el ajuste
      // aparezca en el extracto de ese propietario.
      var esCartera = Idiky.contabilidad.esDeCartera(linea.cuenta)
      var selectorUnidad = esCartera
        ? el('select', {
            onChange: function (e) { linea.unidadId = e.target.value },
          }, [el('option', { value: '' }, 'Sin unidad')].concat(
            Idiky.repo.unidades().map(function (u) {
              return el('option', {
                value: u.id,
                selected: u.id === linea.unidadId,
              }, u.etiqueta + ' — ' + Idiky.repo.nombrePropietario(u.id))
            }),
          ))
        : null

      return el('div', 'asiento-linea', [
        el('div', 'asiento-linea__cuenta', selectorCuenta),
        el('div', 'asiento-linea__lado', selectorLado),
        el('div', 'asiento-linea__valor', campoValor),
        el('button', {
          clase: 'boton boton--icono',
          type: 'button',
          'aria-label': 'Quitar la linea ' + (indice + 1),
          onClick: function () {
            estado.lineas.splice(indice, 1)
            pintarLineas()
          },
        }, '✕'),
        selectorUnidad
          ? el('div', 'asiento-linea__unidad', [
              el('span', 'campo__ayuda', 'A que unidad se le carga'),
              selectorUnidad,
            ])
          : null,
      ])
    }

    function lineasParaValidar() {
      return estado.lineas.map(function (l) {
        return {
          cuenta: l.cuenta,
          unidadId: l.unidadId || null,
          debe: l.lado === 'debe' ? l.valor : 0,
          haber: l.lado === 'haber' ? l.valor : 0,
        }
      })
    }

    function pintarResumen() {
      var lineas = lineasParaValidar()
      var debe = lineas.reduce(function (t, l) { return t + l.debe }, 0)
      var haber = lineas.reduce(function (t, l) { return t + l.haber }, 0)
      var diferencia = debe - haber

      ui.vaciar(resumen)
      ui.agregar(resumen, [
        el('div', 'reparto__linea', [
          el('span', null, 'Total debe'),
          el('strong', 'cifra', f.dinero(debe)),
        ]),
        el('div', 'reparto__linea', [
          el('span', null, 'Total haber'),
          el('strong', 'cifra', f.dinero(haber)),
        ]),
        diferencia === 0 && debe > 0
          ? el('p', 'documento__cuadre', 'El comprobante cuadra.')
          : el('p', 'documento__cuadre documento__cuadre--error',
              debe === 0 && haber === 0
                ? 'Escribe los valores del asiento.'
                : 'Descuadre de ' + f.dinero(Math.abs(diferencia))
                  + '. El debe y el haber tienen que ser iguales.'),
      ])
    }

    aplicarPlantilla('intereses')

    ui.abrirModal({
      titulo: 'Nuevo comprobante de ajuste',
      descripcion: 'Mueve cuentas, no plata. Tiene que cuadrar para poder guardarse.',
      contenido: [
        ui.campo('Tipo de ajuste', el('select', {
          onChange: function (e) { aplicarPlantilla(e.target.value) },
        }, PLANTILLAS.map(function (p) {
          return el('option', { value: p.id }, p.texto)
        })), 'Elige una plantilla o arma el comprobante desde cero.'),

        el('div', 'fila-campos', [
          ui.campo('Fecha', el('input', {
            type: 'date', value: estado.fecha,
            onChange: function (e) { estado.fecha = e.target.value },
          })),
          ui.campo('Concepto', campoConcepto),
        ]),

        ui.campo('Detalle', el('textarea', {
          rows: 2,
          placeholder: 'Por que se hace este ajuste. Queda guardado con el comprobante.',
          onInput: function (e) { estado.detalle = e.target.value },
        }), 'Es lo que va a leer quien revise la contabilidad dentro de seis meses.'),

        el('h3', 'titulo-seccion', 'Asiento'),
        contenedorLineas,
        resumen,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var comprobante = Idiky.repo.registrarComprobante({
                fecha: estado.fecha,
                concepto: estado.concepto,
                detalle: estado.detalle,
                lineas: lineasParaValidar(),
              })
              ui.cerrarModal()
              repintar()
              ui.aviso('Comprobante ' + comprobante.numero + ' registrado.', 'exito')
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Registrar comprobante'),
      ],
    })
  }

  function abrirAnulacion(comprobanteId, repintar) {
    var comprobante = Idiky.repo.comprobantePorId(comprobanteId)
    if (!comprobante) return
    var campoMotivo = el('input', { type: 'text', placeholder: 'Por que se anula' })

    ui.abrirModal({
      titulo: 'Anular comprobante ' + comprobante.numero,
      descripcion: 'Deja de contar en los estados. El registro y el numero se conservan.',
      contenido: [
        el('div', 'resumen-pago', [
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Concepto'),
            el('span', null, comprobante.concepto),
          ]),
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Fecha'),
            el('span', null, f.fecha(comprobante.fecha)),
          ]),
        ]),
        ui.campo('Motivo de la anulacion', campoMotivo),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--peligro',
          onClick: function () {
            try {
              Idiky.repo.anularComprobante({
                comprobanteId: comprobanteId,
                motivo: campoMotivo.value,
              })
              ui.cerrarModal()
              repintar()
              ui.aviso('Comprobante anulado.', 'exito')
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Anular comprobante'),
      ],
    })
  }

  return { pintar: pintar }
})()
