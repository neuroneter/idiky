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
        el('div', 'grupo-acciones', [
          el('button', {
            clase: 'boton',
            onClick: function () { abrirLibre(repintar) },
            title: 'Para el caso excepcional que ningun tipo cubre',
          }, 'Comprobante libre'),
          el('button', {
            clase: 'boton boton--principal',
            onClick: function () { abrirNuevo(repintar) },
          }, 'Nuevo comprobante'),
        ]),
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
            comprobante.tipoNombre ? ui.chip(comprobante.tipoNombre, 'info') : null,
            anulado ? ui.chip('Anulado', 'error') : ui.chip('Registrado', 'exito'),
          ]),
          el('span', 'sub', comprobante.concepto + ' · ' + f.fecha(comprobante.fecha)
            + (comprobante.unidadId ? ' · ' + Idiky.repo.etiquetaUnidad(comprobante.unidadId) : '')),
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
  // Nuevo comprobante — el camino normal
  // ---------------------------------------------------------------------------

  /**
   * El administrador elige QUE paso, no COMO se contabiliza.
   *
   * Cada tipo trae su asiento definido, asi que aqui solo se piden fecha,
   * valor y —cuando el tipo lo necesita— la unidad. El asiento se muestra
   * armado antes de guardar, para que quede claro que va a pasar, pero no hay
   * que escribirlo.
   */
  function abrirNuevo(repintar) {
    var tipos = Idiky.repo.tiposRegistrables()
    if (tipos.length === 0) {
      ui.aviso('No hay tipos de comprobante configurados. Se definen en Plan de cuentas.', 'error')
      return
    }

    var estado = {
      tipoId: tipos[0].id,
      fecha: d.hoyISO(),
      valor: 0,
      unidadId: '',
      detalle: '',
    }

    var zonaUnidad = el('div')
    var vistaAsiento = el('div', 'asiento-previo')

    function tipoActual() {
      return Idiky.repo.tipoPorId(estado.tipoId)
    }

    var campoValor = el('input', {
      type: 'number', min: 0, step: 1000, value: 0,
      onInput: function (e) { estado.valor = f.aNumero(e.target.value); pintarAsiento() },
    })

    function pintarUnidad() {
      ui.vaciar(zonaUnidad)
      var tipo = tipoActual()
      if (!tipo.pideUnidad) return
      var unidades = Idiky.repo.unidades()
      if (!estado.unidadId) estado.unidadId = unidades[0].id
      zonaUnidad.appendChild(ui.campo('Propietario', el('select', {
        onChange: function (e) { estado.unidadId = e.target.value; pintarAsiento() },
      }, unidades.map(function (u) {
        return el('option', {
          value: u.id,
          selected: u.id === estado.unidadId,
        }, u.etiqueta + ' — ' + Idiky.repo.nombrePropietario(u.id))
      })), 'Este comprobante le carga el valor a su cuenta.'))
    }

    function pintarAsiento() {
      ui.vaciar(vistaAsiento)
      var tipo = tipoActual()
      var lineas = Idiky.repo.cuentasDelTipo(tipo)

      ui.agregar(vistaAsiento, [
        el('span', 'cascada__etiqueta', 'Asiento que se va a registrar'),
        el('table', 'tabla tabla--asiento', [
          el('thead', null, el('tr', null, [
            el('th', null, 'Cuenta'),
            el('th', 'derecha', 'Debe'),
            el('th', 'derecha', 'Haber'),
          ])),
          el('tbody', null, lineas.map(function (linea) {
            var valor = Math.round((estado.valor * (linea.porcentaje || 100)) / 100)
            return el('tr', null, [
              el('td', null, [
                el('strong', 'cifra', linea.cuenta),
                el('span', 'sub', linea.nombre
                  + (linea.usaUnidad && estado.unidadId
                    ? ' · ' + Idiky.repo.etiquetaUnidad(estado.unidadId)
                    : '')),
              ]),
              el('td', 'derecha cifra', linea.lado === 'debe' ? f.dinero(valor) : ''),
              el('td', 'derecha cifra', linea.lado === 'haber' ? f.dinero(valor) : ''),
            ])
          })),
        ]),
        el('p', 'campo__ayuda',
          'Estas cuentas vienen del tipo de comprobante. Se cambian en Plan de cuentas, '
          + 'no aqui: asi el mismo ajuste siempre queda igual.'),
      ])
    }

    var selectorTipo = el('select', {
      onChange: function (e) {
        estado.tipoId = e.target.value
        pintarUnidad()
        pintarAsiento()
        descripcion.textContent = tipoActual().descripcion || ''
      },
    }, tipos.map(function (t) {
      return el('option', { value: t.id, selected: t.id === estado.tipoId }, t.nombre)
    }))

    var descripcion = el('p', 'campo__ayuda', tipoActual().descripcion || '')

    pintarUnidad()
    pintarAsiento()

    ui.abrirModal({
      titulo: 'Nuevo comprobante',
      descripcion: 'Elige que paso y pon el valor. El asiento lo arma el sistema.',
      contenido: [
        ui.campo('Tipo de comprobante', selectorTipo),
        descripcion,
        el('div', 'fila-campos', [
          ui.campo('Fecha', el('input', {
            type: 'date', value: estado.fecha,
            onChange: function (e) { estado.fecha = e.target.value },
          })),
          ui.campo('Valor', campoValor),
        ]),
        zonaUnidad,
        ui.campo('Detalle', el('textarea', {
          rows: 2,
          placeholder: 'Por que se hace este ajuste. Queda guardado con el comprobante.',
          onInput: function (e) { estado.detalle = e.target.value },
        }), 'Es lo que va a leer quien revise la contabilidad dentro de seis meses.'),
        vistaAsiento,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var comprobante = Idiky.repo.registrarComprobanteDeTipo({
                tipoId: estado.tipoId,
                fecha: estado.fecha,
                valor: estado.valor,
                unidadId: estado.unidadId,
                detalle: estado.detalle,
              })
              ui.cerrarModal()
              repintar()
              ui.aviso('Comprobante ' + comprobante.numero + ' registrado.', 'exito')
            } catch (error) { ui.aviso(error.message, 'error') }
          },
        }, 'Registrar comprobante'),
      ],
    })
  }

  // ---------------------------------------------------------------------------
  // Comprobante libre — la salida de emergencia
  // ---------------------------------------------------------------------------

  /**
   * Para el caso que ningun tipo cubre. Exige saber contabilidad, y por eso NO
   * es el camino principal: si un ajuste se repite, lo correcto es crearle su
   * tipo en Plan de cuentas y no volver a escribirlo a mano.
   */
  function abrirLibre(repintar) {
    var estado = {
      fecha: d.hoyISO(),
      concepto: '',
      detalle: '',
      lineas: [
        { cuenta: '', lado: 'debe', valor: 0, unidadId: '' },
        { cuenta: '', lado: 'haber', valor: 0, unidadId: '' },
      ],
    }

    var contenedorLineas = el('div', 'asiento-editor')
    var resumen = el('div', 'reparto__resumen')
    var campoConcepto = el('input', {
      type: 'text',
      placeholder: 'Que se esta ajustando',
      onInput: function (e) { estado.concepto = e.target.value },
    })

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
          onClick: function () { estado.lineas.splice(indice, 1); pintarLineas() },
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

    pintarLineas()

    ui.abrirModal({
      titulo: 'Comprobante libre',
      descripcion: 'Para lo que ningun tipo cubre. Aqui si hay que escribir el asiento.',
      contenido: [
        el('div', 'nota nota--info', [
          el('div', null, [
            el('strong', null, 'Si este ajuste se repite, hazle un tipo'),
            el('span', 'sub',
              'Los tipos se crean en Plan de cuentas y evitan volver a escribir el asiento cada vez.'),
          ]),
        ]),
        el('div', 'fila-campos', [
          ui.campo('Fecha', el('input', {
            type: 'date', value: estado.fecha,
            onChange: function (e) { estado.fecha = e.target.value },
          })),
          ui.campo('Concepto', campoConcepto),
        ]),
        ui.campo('Detalle', el('textarea', {
          rows: 2,
          placeholder: 'Por que se hace este ajuste.',
          onInput: function (e) { estado.detalle = e.target.value },
        })),
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
            } catch (error) { ui.aviso(error.message, 'error') }
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
