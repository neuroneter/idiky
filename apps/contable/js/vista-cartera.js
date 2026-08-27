/**
 * Cartera — quien debe, cuanto y desde cuando.
 *
 * Esta pantalla solo consulta y factura. La plata que entra se maneja en
 * Pagos: mezclar consulta con caja es lo que vuelve confusos estos modulos.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaCartera = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var d = Idiky.dominio
  var f = Idiky.formato

  var filtro = 'todas'

  function pintar(contenedor, repintar) {
    var filas = Idiky.repo.estadoDeCartera()
    var visibles = filas.filter(function (fila) {
      if (filtro === 'mora') return fila.enMora
      if (filtro === 'al-dia') return !fila.enMora
      return true
    }).sort(function (a, b) {
      return b.vencido - a.vencido || b.saldo - a.saldo
    })

    var saldoTotal = filas.reduce(function (t, x) { return t + x.saldo }, 0)
    var vencidoTotal = filas.reduce(function (t, x) { return t + x.vencido }, 0)
    var enMora = filas.filter(function (x) { return x.enMora }).length
    var recaudo = d.porcentajeRecaudo(Idiky.repo.todasLasCuotas(), d.periodoActual())
    var porConciliar = Idiky.repo.abonosReportados()

    ui.agregar(contenedor, [
      el('div', 'rejilla-indicadores', [
        el('article', 'tarjeta', ui.indicador('Saldo total de cartera', f.dinero(saldoTotal))),
        el('article', 'tarjeta', ui.indicador('Vencido', f.dinero(vencidoTotal), 'deuda')),
        el('article', 'tarjeta', ui.indicador('Unidades en mora', enMora + ' de ' + filas.length)),
        el('article', 'tarjeta', ui.indicador('Recaudo del mes', recaudo + ' %')),
      ]),

      porConciliar.length > 0
        ? el('div', 'nota', [
            el('div', null, [
              el('strong', null, porConciliar.length === 1
                ? 'Hay 1 abono sin conciliar'
                : 'Hay ' + porConciliar.length + ' abonos sin conciliar'),
              el('span', 'sub', 'Esta cartera todavia no los descuenta. Se aplican desde Pagos.'),
            ]),
            el('button', {
              clase: 'boton',
              onClick: function () { Idiky.app.irA('pagos') },
            }, 'Ir a Pagos'),
          ])
        : null,

      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonFiltro('todas', 'Todas', repintar),
          botonFiltro('mora', 'En mora', repintar),
          botonFiltro('al-dia', 'Al dia', repintar),
        ]),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () { abrirGeneracion(repintar) },
        }, 'Generar cuotas del periodo'),
      ]),

      visibles.length === 0
        ? ui.vacio('Ninguna unidad en este filtro')
        : el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla', [
            el('thead', null, el('tr', null, [
              el('th', null, 'Unidad'),
              el('th', null, 'Propietario'),
              el('th', 'derecha', 'Saldo'),
              el('th', 'derecha', 'Vencido'),
              el('th', 'derecha', 'Mora'),
              el('th', null, ''),
            ])),
            el('tbody', null, visibles.map(function (fila) {
              return filaCartera(fila, repintar)
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

  function filaCartera(fila, repintar) {
    return el('tr', null, [
      el('td', null, el('strong', null, fila.unidad.etiqueta)),
      el('td', 'sub', fila.propietario),
      ui.celdaDinero(fila.saldo, { tenueSiCero: true }),
      ui.celdaDinero(fila.vencido, { rojoSiHay: true, tenueSiCero: true }),
      el('td', 'derecha sub', fila.mora ? fila.mora + ' d' : '—'),
      el('td', 'derecha', el('button', {
        clase: 'boton boton--pequeno',
        onClick: function () { abrirEstadoDeCuenta(fila.unidad.id, repintar) },
      }, 'Estado de cuenta')),
    ])
  }

  // -------------------------------------------------------------------------
  // Estado de cuenta de una unidad
  // -------------------------------------------------------------------------

  function abrirEstadoDeCuenta(unidadId, repintar) {
    var unidad = Idiky.repo.unidad(unidadId)
    var propietario = Idiky.repo.propietarioDe(unidadId)
    var cuotas = Idiky.repo.cuotasDeUnidad(unidadId)
    var recibos = Idiky.repo.pagosDeUnidad(unidadId).filter(function (p) {
      return p.estado !== 'reportado'
    })
    var saldo = d.calcularSaldo(cuotas)
    var vencido = d.calcularSaldoVencido(cuotas)

    ui.abrirModal({
      titulo: 'Estado de cuenta · ' + unidad.etiqueta,
      descripcion: propietario
        ? propietario.nombre + ' · CC ' + propietario.documento
        : 'Sin propietario registrado',
      contenido: [
        el('div', 'rejilla-indicadores rejilla-indicadores--dos', [
          el('article', 'tarjeta tarjeta--plana', ui.indicador('Saldo', f.dinero(saldo))),
          el('article', 'tarjeta tarjeta--plana', ui.indicador('Vencido', f.dinero(vencido), 'deuda')),
        ]),

        el('h3', 'titulo-seccion', 'Cuotas'),
        el('table', 'tabla', [
          el('thead', null, el('tr', null, [
            el('th', null, 'Concepto'),
            el('th', null, 'Vence'),
            el('th', 'derecha', 'Valor'),
            el('th', 'derecha', 'Abonado'),
            el('th', 'derecha', 'Debe'),
            el('th', null, ''),
          ])),
          el('tbody', null, cuotas.map(function (cuota) {
            var estado = d.estadoRealCuota(cuota)
            var abonado = d.abonadoDeCuota(cuota)
            return el('tr', null, [
              el('td', null, [
                el('strong', null, cuota.concepto),
                el('span', 'sub', f.periodo(cuota.periodo)
                  + (cuota.cuentaIngreso ? ' · PUC ' + cuota.cuentaIngreso : '')),
              ]),
              el('td', 'sub', f.fechaCorta(cuota.fechaVencimiento)),
              el('td', 'derecha cifra', f.dinero(cuota.valor)),
              el('td', 'derecha cifra' + (abonado ? '' : ' cifra--cero'), f.dinero(abonado)),
              ui.celdaDinero(cuota.saldo, { rojoSiHay: estado === 'vencida', tenueSiCero: true }),
              el('td', null, ui.chipCuota(estado)),
            ])
          })),
        ]),

        el('h3', 'titulo-seccion', 'Recibos de caja de esta unidad'),
        recibos.length === 0
          ? ui.vacio('Esta unidad no tiene pagos registrados')
          : el('table', 'tabla', [
              el('thead', null, el('tr', null, [
                el('th', null, 'Recibo'),
                el('th', null, 'Fecha'),
                el('th', 'derecha', 'Valor'),
                el('th', null, ''),
              ])),
              el('tbody', null, recibos.map(function (pago) {
                return el('tr', null, [
                  el('td', 'cifra', pago.recibo || '—'),
                  el('td', 'sub', f.fechaHora(pago.fecha)),
                  el('td', 'derecha cifra', f.dinero(pago.valor)),
                  el('td', null, ui.chipPago(pago.estado)),
                ])
              })),
            ]),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cerrar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            ui.cerrarModal()
            Idiky.vistaPagos.abrirRegistro(unidadId, repintar)
          },
        }, 'Registrar un pago de esta unidad'),
      ],
    })
  }

  // -------------------------------------------------------------------------
  // Generacion de cuotas del periodo
  // -------------------------------------------------------------------------

  function abrirGeneracion(repintar) {
    var parametros = {
      periodo: d.periodoActual(),
      tipo: 'ordinaria',
      concepto: 'Cuota de administracion',
      valor: 45000,
    }

    var previsualizacion = el('div', 'previsualizacion')

    function refrescar() {
      ui.vaciar(previsualizacion)
      var lineas = Idiky.repo.previsualizarCuotas(parametros)
      var total = lineas.reduce(function (t, l) { return t + l.valor }, 0)
      ui.agregar(previsualizacion, [
        el('h3', 'titulo-seccion', 'Previsualizacion'),
        el('div', 'previsualizacion__caja', el('table', 'tabla', [
          el('tbody', null, lineas.map(function (linea) {
            return el('tr', null, [
              el('td', null, linea.etiqueta),
              el('td', 'derecha cifra', f.dinero(linea.valor)),
            ])
          })),
        ])),
        el('div', 'reparto__linea', [
          el('span', null, 'Total a facturar'),
          el('strong', 'cifra', f.dinero(total)),
        ]),
      ])
    }

    var campoPeriodo = el('input', {
      type: 'month',
      value: parametros.periodo,
      onChange: function (e) { parametros.periodo = e.target.value; refrescar() },
    })
    var campoTipo = el('select', {
      onChange: function (e) {
        parametros.tipo = e.target.value
        parametros.concepto = e.target.value === 'ordinaria'
          ? 'Cuota de administracion'
          : 'Cuota extraordinaria'
        campoConcepto.value = parametros.concepto
        etiquetaDelValor.textContent = etiquetaValor()
        refrescar()
      },
    }, [
      el('option', { value: 'ordinaria' }, 'Ordinaria'),
      el('option', { value: 'extraordinaria' }, 'Extraordinaria'),
    ])
    var campoConcepto = el('input', {
      type: 'text',
      value: parametros.concepto,
      onInput: function (e) { parametros.concepto = e.target.value },
    })
    var campoValor = el('input', {
      type: 'number',
      min: 0,
      step: 1000,
      value: parametros.valor,
      onInput: function (e) { parametros.valor = f.aNumero(e.target.value); refrescar() },
    })

    function etiquetaValor() {
      return parametros.tipo === 'ordinaria'
        ? 'Valor por punto de coeficiente'
        : 'Valor total a prorratear'
    }

    // El nombre del campo cambia segun el tipo de cuota: en la ordinaria se
    // multiplica por el coeficiente, en la extraordinaria se reparte.
    var campoDelValor = ui.campo(etiquetaValor(), campoValor,
      'Las extraordinarias se reparten entre las unidades segun su coeficiente (RN-05).')
    var etiquetaDelValor = campoDelValor.querySelector('.campo__etiqueta')

    refrescar()

    ui.abrirModal({
      titulo: 'Generar cuotas del periodo',
      descripcion: 'Revisa la previsualizacion antes de confirmar. Esto crea una cuota por unidad.',
      contenido: [
        el('div', 'fila-campos', [
          ui.campo('Periodo', campoPeriodo),
          ui.campo('Tipo', campoTipo),
        ]),
        ui.campo('Concepto', campoConcepto),
        campoDelValor,
        previsualizacion,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var nuevas = Idiky.repo.generarCuotas(parametros)
              ui.cerrarModal()
              ui.aviso('Se generaron ' + nuevas.length + ' cuotas de ' + f.periodo(parametros.periodo) + '.', 'exito')
              repintar()
            } catch (error) {
              ui.aviso(error.message, 'error')
            }
          },
        }, 'Generar cuotas'),
      ],
    })
  }

  return { pintar: pintar }
})()
