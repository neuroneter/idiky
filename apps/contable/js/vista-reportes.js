/**
 * Reportes — donde cartera, pagos y gastos se juntan.
 *
 * Tres reportes sobre el mismo rango de fechas:
 *   1. Movimientos por cliente: el extracto, cargos y abonos en una sola linea
 *      de tiempo. Es la respuesta a "muestrame que ha pasado con este cliente".
 *   2. Estado de resultados: ingresos menos egresos causados en el rango.
 *   3. Estado de situacion financiera: la foto al corte (la fecha "hasta").
 *
 * Todos se imprimen (o se guardan como PDF desde el dialogo de impresion) y se
 * bajan en CSV para abrirlos en Excel.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaReportes = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var d = Idiky.dominio
  var f = Idiky.formato
  var conta = Idiky.contabilidad

  var REPORTES = [
    { id: 'movimientos', texto: 'Movimientos por cliente' },
    { id: 'resultados', texto: 'Estado de resultados' },
    { id: 'situacion', texto: 'Situacion financiera' },
  ]

  var estado = {
    reporte: 'movimientos',
    desde: d.hoyISO().slice(0, 4) + '-01-01',
    hasta: d.hoyISO(),
    unidadId: 'todos',
  }

  /** Lo ultimo que se pinto, para poder exportarlo a CSV. */
  var ultimoCsv = { nombre: 'reporte.csv', filas: [] }

  /**
   * El visor de artefactos corre la pagina dentro de un marco y bloquea las
   * descargas. Detectarlo permite decirlo en vez de dejar un boton que no hace
   * nada. En el archivo local no hay marco y la descarga funciona.
   */
  function descargaDisponible() {
    try {
      return window.self === window.top
    } catch (e) {
      return false
    }
  }

  function pintar(contenedor, repintar) {
    var documento = el('div', 'documento')

    ui.agregar(contenedor, [
      el('div', 'barra-acciones no-imprimir', [
        el('div', 'filtros', REPORTES.map(function (r) {
          return el('button', {
            clase: 'filtro',
            'aria-pressed': String(estado.reporte === r.id),
            onClick: function () { estado.reporte = r.id; repintar() },
          }, r.texto)
        })),
        el('div', 'grupo-acciones', [
          el('button', { clase: 'boton', onClick: imprimir }, 'Imprimir o guardar PDF'),
          descargaDisponible()
            ? el('button', { clase: 'boton', onClick: descargarCsv }, 'Descargar CSV')
            : el('button', {
                clase: 'boton',
                disabled: true,
                title: 'La descarga solo funciona al abrir el archivo desde tu computador.',
              }, 'Descargar CSV'),
        ]),
      ]),

      el('div', 'controles-reporte no-imprimir', [
        ui.campo('Desde', el('input', {
          type: 'date', value: estado.desde,
          onChange: function (e) { estado.desde = e.target.value; repintar() },
        })),
        ui.campo('Hasta', el('input', {
          type: 'date', value: estado.hasta,
          onChange: function (e) { estado.hasta = e.target.value; repintar() },
        })),
        estado.reporte === 'movimientos' ? campoCliente(repintar) : null,
        estado.reporte === 'situacion'
          ? el('p', 'campo__ayuda',
              'Este reporte es una foto: usa solo la fecha "hasta" como corte.')
          : null,
      ]),

      documento,
    ])

    if (estado.reporte === 'movimientos') pintarMovimientos(documento)
    else if (estado.reporte === 'resultados') pintarResultados(documento)
    else pintarSituacion(documento)
  }

  function campoCliente(repintar) {
    var opciones = [el('option', { value: 'todos' }, 'Todos los clientes')]
    Idiky.repo.unidades().forEach(function (u) {
      opciones.push(el('option', {
        value: u.id,
        selected: u.id === estado.unidadId,
      }, u.etiqueta + ' — ' + Idiky.repo.nombrePropietario(u.id)))
    })
    return ui.campo('Cliente', el('select', {
      onChange: function (e) { estado.unidadId = e.target.value; repintar() },
    }, opciones))
  }

  // ---------------------------------------------------------------------------
  // Encabezado comun de los documentos
  // ---------------------------------------------------------------------------

  function encabezado(titulo, subtitulo) {
    var cop = Idiky.repo.copropiedad()
    return el('header', 'documento__encabezado', [
      el('div', null, [
        el('h2', 'documento__titulo', titulo),
        el('p', 'documento__subtitulo', subtitulo),
      ]),
      el('div', 'documento__emisor', [
        el('strong', null, cop.nombre),
        el('span', null, 'NIT ' + cop.nit),
        el('span', null, 'Generado el ' + f.fecha(d.hoyISO())),
      ]),
    ])
  }

  function rangoTexto() {
    return 'Del ' + f.fecha(estado.desde) + ' al ' + f.fecha(estado.hasta)
  }

  // ---------------------------------------------------------------------------
  // 1. Movimientos por cliente
  // ---------------------------------------------------------------------------

  function pintarMovimientos(documento) {
    if (estado.unidadId === 'todos') return pintarMovimientosResumen(documento)

    var unidad = Idiky.repo.unidad(estado.unidadId)
    var propietario = Idiky.repo.propietarioDe(estado.unidadId)
    var extracto = Idiky.repo.movimientosDeUnidad(estado.unidadId, estado.desde, estado.hasta)

    ultimoCsv = {
      nombre: 'movimientos-' + unidad.etiqueta.replace(/[^\w]+/g, '-').toLowerCase() + '.csv',
      filas: [['Fecha', 'Documento', 'Concepto', 'Detalle', 'Cargo', 'Abono', 'Saldo']]
        .concat([['', '', 'Saldo anterior', '', '', '', extracto.saldoInicial]])
        .concat(extracto.lineas.map(function (l) {
          return [l.fecha, l.documento, l.concepto, l.detalle, l.cargo || '', l.abono || '', l.saldo]
        })),
    }

    ui.agregar(documento, [
      encabezado('Extracto de movimientos', rangoTexto()),

      el('div', 'documento__cliente', [
        el('div', null, [
          el('span', 'etiqueta-dato', 'Cliente'),
          el('strong', null, unidad.etiqueta + ' — ' + (propietario ? propietario.nombre : 'Sin propietario')),
        ]),
        propietario ? el('div', null, [
          el('span', 'etiqueta-dato', 'Documento'),
          el('strong', null, 'CC ' + propietario.documento),
        ]) : null,
        el('div', null, [
          el('span', 'etiqueta-dato', 'Coeficiente'),
          el('strong', null, unidad.coeficiente + ' %'),
        ]),
      ]),

      extracto.lineas.length === 0
        ? ui.vacio('Sin movimientos en este rango',
            'El saldo al inicio del rango era ' + f.dinero(extracto.saldoInicial) + '.')
        : el('table', 'tabla tabla--documento', [
            el('thead', null, el('tr', null, [
              el('th', null, 'Fecha'),
              el('th', null, 'Documento'),
              el('th', null, 'Concepto'),
              el('th', 'derecha', 'Cargo'),
              el('th', 'derecha', 'Abono'),
              el('th', 'derecha', 'Saldo'),
            ])),
            el('tbody', null, [
              el('tr', 'fila--apertura', [
                el('td', { colspan: 3 }, 'Saldo anterior al ' + f.fecha(estado.desde)),
                el('td', 'derecha', ''),
                el('td', 'derecha', ''),
                el('td', 'derecha cifra', f.dinero(extracto.saldoInicial)),
              ]),
            ].concat(extracto.lineas.map(function (linea) {
              return el('tr', null, [
                el('td', 'sub', f.fechaCorta(linea.fecha)),
                el('td', 'cifra', linea.documento || '—'),
                el('td', null, [
                  el('strong', null, linea.concepto),
                  linea.detalle ? el('span', 'sub', linea.detalle) : null,
                  linea.esAjuste ? ui.chip('Ajuste', 'info') : null,
                ]),
                el('td', 'derecha cifra', linea.cargo ? f.dinero(linea.cargo) : ''),
                el('td', 'derecha cifra', linea.abono ? f.dinero(linea.abono) : ''),
                el('td', 'derecha cifra', f.dinero(linea.saldo)),
              ])
            }))),
            el('tfoot', null, el('tr', null, [
              el('td', { colspan: 3 }, 'Totales del periodo'),
              el('td', 'derecha cifra', f.dinero(extracto.cargos)),
              el('td', 'derecha cifra', f.dinero(extracto.abonos)),
              el('td', 'derecha cifra', f.dinero(extracto.saldoFinal)),
            ])),
          ]),
    ])
  }

  function pintarMovimientosResumen(documento) {
    var filas = Idiky.repo.unidades().map(function (u) {
      var extracto = Idiky.repo.movimientosDeUnidad(u.id, estado.desde, estado.hasta)
      return {
        unidad: u,
        propietario: Idiky.repo.nombrePropietario(u.id),
        inicial: extracto.saldoInicial,
        cargos: extracto.cargos,
        abonos: extracto.abonos,
        final: extracto.saldoFinal,
      }
    })

    var totales = filas.reduce(function (t, x) {
      return {
        inicial: t.inicial + x.inicial,
        cargos: t.cargos + x.cargos,
        abonos: t.abonos + x.abonos,
        final: t.final + x.final,
      }
    }, { inicial: 0, cargos: 0, abonos: 0, final: 0 })

    ultimoCsv = {
      nombre: 'movimientos-todos-los-clientes.csv',
      filas: [['Unidad', 'Propietario', 'Saldo anterior', 'Cargos', 'Abonos', 'Saldo final']]
        .concat(filas.map(function (x) {
          return [x.unidad.etiqueta, x.propietario, x.inicial, x.cargos, x.abonos, x.final]
        }))
        .concat([['TOTAL', '', totales.inicial, totales.cargos, totales.abonos, totales.final]]),
    }

    ui.agregar(documento, [
      encabezado('Movimientos por cliente', rangoTexto()),
      el('p', 'documento__nota',
        'Resumen de todos los clientes. Elige uno arriba para ver su extracto detallado.'),
      el('table', 'tabla tabla--documento', [
        el('thead', null, el('tr', null, [
          el('th', null, 'Unidad'),
          el('th', null, 'Propietario'),
          el('th', 'derecha', 'Saldo anterior'),
          el('th', 'derecha', 'Cargos'),
          el('th', 'derecha', 'Abonos'),
          el('th', 'derecha', 'Saldo final'),
        ])),
        el('tbody', null, filas.map(function (x) {
          return el('tr', null, [
            el('td', null, el('strong', null, x.unidad.etiqueta)),
            el('td', 'sub', x.propietario),
            el('td', 'derecha cifra', f.dinero(x.inicial)),
            el('td', 'derecha cifra', f.dinero(x.cargos)),
            el('td', 'derecha cifra', f.dinero(x.abonos)),
            el('td', 'derecha cifra' + (x.final > 0 ? ' cifra--deuda' : ''), f.dinero(x.final)),
          ])
        })),
        el('tfoot', null, el('tr', null, [
          el('td', { colspan: 2 }, 'Total'),
          el('td', 'derecha cifra', f.dinero(totales.inicial)),
          el('td', 'derecha cifra', f.dinero(totales.cargos)),
          el('td', 'derecha cifra', f.dinero(totales.abonos)),
          el('td', 'derecha cifra', f.dinero(totales.final)),
        ])),
      ]),
    ])
  }

  // ---------------------------------------------------------------------------
  // 2. Estado de resultados
  // ---------------------------------------------------------------------------

  function pintarResultados(documento) {
    var r = conta.estadoDeResultados(Idiky.repo.datosContables(), estado.desde, estado.hasta)
    var hayDeficit = r.excedente < 0

    ultimoCsv = {
      nombre: 'estado-de-resultados.csv',
      filas: [['Concepto', 'Valor']]
        .concat([['INGRESOS', '']])
        .concat(r.ingresos.map(function (l) { return [l.concepto, l.valor] }))
        .concat([['Total ingresos', r.totalIngresos], ['GASTOS', '']])
        .concat(r.egresos.map(function (l) { return [l.concepto, l.valor] }))
        .concat([
          ['Total gastos', r.totalEgresos],
          [hayDeficit ? 'Deficit del periodo' : 'Excedente del periodo', r.excedente],
        ]),
    }

    ui.agregar(documento, [
      encabezado('Estado de resultados', rangoTexto()),
      el('p', 'documento__nota',
        'Por causacion: una cuota cuenta como ingreso en su mes aunque se pague despues, '
        + 'y un gasto cuenta el dia en que se causa aunque se pague al mes siguiente.'),

      el('table', 'tabla tabla--documento tabla--estado', [
        el('tbody', null, [].concat(
          [el('tr', 'fila--grupo', [el('td', null, 'Ingresos'), el('td', 'derecha', '')])],
          bloque(r.ingresos, 'No hubo ingresos causados en este rango.'),
          [el('tr', 'fila--subtotal', [
            el('td', null, 'Total ingresos'),
            el('td', 'derecha cifra', f.dinero(r.totalIngresos)),
          ])],
          [el('tr', 'fila--grupo', [el('td', null, 'Gastos'), el('td', 'derecha', '')])],
          bloque(r.egresos, 'No hubo gastos causados en este rango.'),
          [el('tr', 'fila--subtotal', [
            el('td', null, 'Total gastos'),
            el('td', 'derecha cifra', f.dinero(r.totalEgresos)),
          ])],
        )),
        el('tfoot', null, el('tr', 'fila--resultado', [
          el('td', null, hayDeficit ? 'Deficit del periodo' : 'Excedente del periodo'),
          el('td', 'derecha cifra' + (hayDeficit ? ' cifra--deuda' : ''), f.dinero(r.excedente)),
        ])),
      ]),

      hayDeficit
        ? el('p', 'documento__nota',
            'El deficit no significa por si solo que falte plata: puede ser un gasto grande '
            + 'financiado con una cuota extraordinaria causada en otro periodo. Revisa el rango.')
        : null,
    ])
  }

  function bloque(lineas, mensajeVacio) {
    if (lineas.length === 0) {
      return [el('tr', null, [el('td', { colspan: 2, clase: 'sub' }, mensajeVacio)])]
    }
    return lineas.map(function (linea) {
      return el('tr', null, [
        el('td', 'celda-sangrada', linea.concepto),
        el('td', 'derecha cifra', f.dinero(linea.valor)),
      ])
    })
  }

  // ---------------------------------------------------------------------------
  // 3. Estado de situacion financiera
  // ---------------------------------------------------------------------------

  function pintarSituacion(documento) {
    var s = conta.situacionFinanciera(Idiky.repo.datosContables(), estado.hasta)

    ultimoCsv = {
      nombre: 'situacion-financiera.csv',
      filas: [['Concepto', 'Valor'], ['ACTIVO', '']]
        .concat(s.activo.lineas.map(function (l) { return [l.concepto, l.valor] }))
        .concat([['Total activo', s.activo.total], ['PASIVO', '']])
        .concat(s.pasivo.lineas.map(function (l) { return [l.concepto, l.valor] }))
        .concat([['Total pasivo', s.pasivo.total], ['PATRIMONIO', '']])
        .concat(s.patrimonio.lineas.map(function (l) { return [l.concepto, l.valor] }))
        .concat([
          ['Total patrimonio', s.patrimonio.total],
          ['Total pasivo y patrimonio', s.totalPasivoYPatrimonio],
        ]),
    }

    ui.agregar(documento, [
      encabezado('Estado de situacion financiera', 'Al ' + f.fecha(estado.hasta)),

      el('div', 'columnas-estado', [
        el('div', null, [
          el('table', 'tabla tabla--documento tabla--estado', [
            el('tbody', null, [].concat(
              [el('tr', 'fila--grupo', [el('td', null, 'Activo'), el('td', 'derecha', '')])],
              bloque(s.activo.lineas, ''),
            )),
            el('tfoot', null, el('tr', 'fila--resultado', [
              el('td', null, 'Total activo'),
              el('td', 'derecha cifra', f.dinero(s.activo.total)),
            ])),
          ]),
        ]),

        el('div', null, [
          el('table', 'tabla tabla--documento tabla--estado', [
            el('tbody', null, [].concat(
              [el('tr', 'fila--grupo', [el('td', null, 'Pasivo'), el('td', 'derecha', '')])],
              bloque(s.pasivo.lineas, ''),
              [el('tr', 'fila--subtotal', [
                el('td', null, 'Total pasivo'),
                el('td', 'derecha cifra', f.dinero(s.pasivo.total)),
              ])],
              [el('tr', 'fila--grupo', [el('td', null, 'Patrimonio'), el('td', 'derecha', '')])],
              bloque(s.patrimonio.lineas, ''),
            )),
            el('tfoot', null, el('tr', 'fila--resultado', [
              el('td', null, 'Total pasivo y patrimonio'),
              el('td', 'derecha cifra', f.dinero(s.totalPasivoYPatrimonio)),
            ])),
          ]),
        ]),
      ]),

      // Un estado que no cuadra hay que verlo, no esconderlo.
      s.descuadre === 0
        ? el('p', 'documento__cuadre', 'El estado cuadra: el activo es igual al pasivo mas el patrimonio.')
        : el('p', 'documento__cuadre documento__cuadre--error',
            'DESCUADRE de ' + f.dinero(s.descuadre) + '. Hay un hecho economico que no esta pasando por el motor contable.'),

      el('p', 'documento__nota',
        'Caja y bancos se calcula como lo recaudado menos los gastos ya pagados: es la plata '
        + 'que ha pasado por la copropiedad, no un saldo bancario conciliado.'),

      // Esta diferencia confunde si no se explica: son dos preguntas distintas.
      el('p', 'documento__nota',
        'La cartera de este estado cuenta solo lo causado hasta la fecha de corte, por eso '
        + 'puede ser menor que el saldo total que muestra el modulo de Cartera: alli entran '
        + 'tambien las cuotas ya facturadas de meses siguientes, que todavia no son ingreso.'),
    ])
  }

  // ---------------------------------------------------------------------------
  // Salida: impresion y CSV
  // ---------------------------------------------------------------------------

  function imprimir() {
    window.print()
  }

  function descargarCsv() {
    var contenido = ultimoCsv.filas.map(function (fila) {
      return fila.map(celdaCsv).join(';')
    }).join('\r\n')

    // El BOM hace que Excel abra el archivo con las tildes bien.
    var blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var enlace = document.createElement('a')
    enlace.href = url
    enlace.download = ultimoCsv.nombre
    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)
    setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
    ui.aviso('Se descargo ' + ultimoCsv.nombre, 'exito')
  }

  /** Separador `;` porque Excel en espanol lo espera asi. */
  function celdaCsv(valor) {
    var texto = valor == null ? '' : String(valor)
    return /[";\r\n]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto
  }

  return { pintar: pintar }
})()
