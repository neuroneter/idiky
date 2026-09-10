/**
 * Pagos a proveedores — la plata que SALE.
 *
 * Ojo con no confundir este modulo con Recaudos: alli entra la plata de los
 * copropietarios y el documento es un recibo de caja; aqui sale hacia los
 * proveedores y el documento es un comprobante de egreso. Son opuestos, y
 * tratarlos igual fue el error que este modulo corrige.
 *
 * Un pago no es solo "sacar plata": es pagarle a alguien identificado, por
 * unos gastos concretos, reteniendole lo que la ley obliga a retener. Por eso
 * el egreso lleva beneficiario, los gastos que cancela y sus retenciones.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaEgresos = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var d = Idiky.dominio
  var f = Idiky.formato
  var prov = Idiky.proveedores

  var pestana = 'gastos'

  var MEDIOS = [
    ['transferencia', 'Transferencia'],
    ['cheque', 'Cheque'],
    ['efectivo', 'Efectivo'],
    ['otro', 'Otro'],
  ]

  function pintar(contenedor, repintar) {
    var saldos = Idiky.repo.saldosPorProveedor().filter(function (s) { return s.saldo > 0 })
    var totalPorPagar = saldos.reduce(function (t, s) { return t + s.saldo }, 0)
    var listaEgresos = Idiky.repo.egresos()
    var vigentes = listaEgresos.filter(function (e) { return e.estado !== 'anulado' })
    var totalPagado = vigentes.reduce(function (t, e) { return t + e.valorNeto }, 0)
    var totalRetenido = vigentes.reduce(function (t, e) { return t + e.retefuente + e.reteica }, 0)

    ui.agregar(contenedor, [
      el('div', 'rejilla-indicadores', [
        el('article', 'tarjeta', ui.indicador('Por pagar a proveedores', f.dinero(totalPorPagar), 'deuda')),
        el('article', 'tarjeta', ui.indicador('Proveedores con saldo', String(saldos.length))),
        el('article', 'tarjeta', ui.indicador('Pagado (neto)', f.dinero(totalPagado))),
        el('article', 'tarjeta', ui.indicador('Retenido a terceros', f.dinero(totalRetenido))),
      ]),

      pestana === 'gastos'
        ? el('div', 'nota nota--info', [
            el('div', null, [
              el('strong', null, 'Causar un gasto no es pagarlo'),
              el('span', 'sub', 'Al causarlo queda debiendose. Se paga en "Cuentas por pagar", emitiendo el comprobante de egreso.'),
            ]),
          ])
        : null,

      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonPestana('gastos', 'Gastos causados', repintar),
          botonPestana('porPagar', 'Cuentas por pagar', repintar),
          botonPestana('egresos', 'Comprobantes de egreso', repintar),
          botonPestana('proveedores', 'Proveedores', repintar),
        ]),
        pestana === 'gastos'
          ? el('button', {
              clase: 'boton boton--principal',
              onClick: function () { Idiky.vistaGastos.abrirRegistro(repintar) },
            }, 'Registrar gasto')
          : el('div', 'grupo-acciones', [
              el('button', {
                clase: 'boton',
                onClick: function () { abrirProveedor(null, repintar) },
              }, 'Nuevo proveedor'),
              el('button', {
                clase: 'boton boton--principal',
                onClick: function () { abrirPago(null, repintar) },
              }, 'Registrar pago'),
            ]),
      ]),
    ])

    if (pestana === 'gastos') Idiky.vistaGastos.pintarLista(contenedor, repintar)
    else if (pestana === 'porPagar') pintarPorPagar(contenedor, saldos, repintar)
    else if (pestana === 'egresos') pintarEgresos(contenedor, listaEgresos, repintar)
    else pintarProveedores(contenedor, repintar)
  }

  function botonPestana(id, texto, repintar) {
    return el('button', {
      clase: 'filtro',
      'aria-pressed': String(pestana === id),
      onClick: function () { pestana = id; repintar() },
    }, texto)
  }

  // ---------------------------------------------------------------------------
  // Lo que se le debe a cada proveedor
  // ---------------------------------------------------------------------------

  function pintarPorPagar(contenedor, saldos, repintar) {
    if (saldos.length === 0) {
      ui.agregar(contenedor, ui.vacio('No hay nada pendiente de pago',
        'Cuando se cause un gasto aparecera aqui, agrupado por proveedor.'))
      return
    }

    ui.agregar(contenedor, el('div', 'lista-abonos', saldos.map(function (fila) {
      return el('article', 'tarjeta', [
        el('div', 'abono__cabecera', [
          el('div', null, [
            el('div', 'abono__titulo', [
              el('strong', null, fila.proveedor.razonSocial),
              ui.chip('NIT ' + prov.formatearNit(fila.proveedor.nit, fila.proveedor.dv), 'info'),
            ]),
            el('span', 'sub', fila.pendientes.length
              + (fila.pendientes.length === 1 ? ' gasto por pagar' : ' gastos por pagar')
              + ' · ' + fila.proveedor.ciudad),
          ]),
          el('strong', 'cifra cifra--grande cifra--deuda', f.dinero(fila.saldo)),
        ]),

        el('table', 'tabla tabla--asiento', [
          el('tbody', null, fila.pendientes.map(function (gasto) {
            return el('tr', null, [
              el('td', 'sub', f.fechaCorta(gasto.fecha)),
              el('td', null, gasto.concepto),
              el('td', 'derecha cifra', f.dinero(gasto.valor)),
            ])
          })),
        ]),

        el('div', 'abono__acciones', [
          el('button', {
            clase: 'boton boton--principal',
            onClick: function () { abrirPago(fila.proveedor.id, repintar) },
          }, 'Pagar'),
        ]),
      ])
    })))
  }

  // ---------------------------------------------------------------------------
  // El libro de egresos
  // ---------------------------------------------------------------------------

  function pintarEgresos(contenedor, listaEgresos, repintar) {
    if (listaEgresos.length === 0) {
      ui.agregar(contenedor, ui.vacio('Todavia no se ha emitido ningun comprobante de egreso'))
      return
    }

    ui.agregar(contenedor, el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla', [
      el('thead', null, el('tr', null, [
        el('th', null, 'Comprobante'),
        el('th', null, 'Fecha'),
        el('th', null, 'Beneficiario'),
        el('th', 'derecha', 'Bruto'),
        el('th', 'derecha', 'Retenido'),
        el('th', 'derecha', 'Neto pagado'),
        el('th', null, 'Estado'),
        el('th', null, ''),
      ])),
      el('tbody', null, listaEgresos.map(function (egreso) {
        var retenido = egreso.retefuente + egreso.reteica
        return el('tr', egreso.estado === 'anulado' ? 'fila--anulada' : null, [
          el('td', 'cifra', egreso.numero),
          el('td', 'sub', f.fechaCorta(egreso.fecha)),
          el('td', null, [
            el('strong', null, egreso.proveedorNombre),
            el('span', 'sub cifra', prov.formatearNit(egreso.proveedorNit)),
          ]),
          el('td', 'derecha cifra', f.dinero(egreso.valorBruto)),
          el('td', 'derecha cifra' + (retenido ? '' : ' cifra--cero'), f.dinero(retenido)),
          el('td', 'derecha cifra', f.dinero(egreso.valorNeto)),
          el('td', null, egreso.estado === 'anulado'
            ? ui.chip('Anulado', 'error')
            : ui.chip('Registrado', 'exito')),
          el('td', 'derecha', el('button', {
            clase: 'boton boton--pequeno',
            onClick: function () { abrirDetalle(egreso.id, repintar) },
          }, 'Ver egreso')),
        ])
      })),
    ])))
  }

  function abrirDetalle(egresoId, repintar) {
    var egreso = Idiky.repo.egresoPorId(egresoId)
    if (!egreso) return
    var proveedor = Idiky.repo.proveedorPorId(egreso.proveedorId)
    var anulado = egreso.estado === 'anulado'

    function linea(etiqueta, valor) {
      return el('div', 'resumen-pago__linea', [el('span', null, etiqueta), valor])
    }

    ui.abrirModal({
      titulo: 'Comprobante de egreso ' + egreso.numero,
      descripcion: egreso.proveedorNombre + ' · NIT ' + prov.formatearNit(egreso.proveedorNit),
      contenido: [
        anulado
          ? el('div', 'nota nota--anulado', [
              el('div', null, [
                el('strong', null, 'Egreso anulado'),
                el('span', 'sub', f.fechaHora(egreso.fechaAnulacion) + ' · ' + egreso.motivoAnulacion),
              ]),
            ])
          : null,

        el('div', 'resumen-pago', [
          linea('Fecha', document.createTextNode(f.fecha(egreso.fecha))),
          linea('Medio', document.createTextNode(egreso.medio + (egreso.referencia ? ' · ' + egreso.referencia : ''))),
          linea('Direccion', document.createTextNode(proveedor ? proveedor.direccion + ', ' + proveedor.ciudad : '—')),
          linea('Registrado por', document.createTextNode(egreso.registradoPor)),
        ]),

        el('h3', 'titulo-seccion', 'Se pago'),
        el('table', 'tabla tabla--asiento', [
          el('tbody', null, egreso.gastoIds.map(function (id) {
            var gasto = Idiky.repo.gastos().filter(function (g) { return g.id === id })[0]
            return el('tr', null, [
              el('td', 'sub', gasto ? f.fechaCorta(gasto.fecha) : ''),
              el('td', null, gasto ? gasto.concepto : id),
              el('td', 'derecha cifra', gasto ? f.dinero(gasto.valor) : ''),
            ])
          })),
        ]),

        el('h3', 'titulo-seccion', 'Liquidacion'),
        el('div', 'resumen-pago', [
          linea('Valor bruto', el('strong', 'cifra', f.dinero(egreso.valorBruto))),
          egreso.retefuente > 0
            ? linea('Retencion en la fuente', el('strong', 'cifra cifra--deuda', '− ' + f.dinero(egreso.retefuente)))
            : null,
          egreso.reteica > 0
            ? linea('ReteICA', el('strong', 'cifra cifra--deuda', '− ' + f.dinero(egreso.reteica)))
            : null,
          linea('Neto pagado', el('strong', 'cifra cifra--grande', f.dinero(egreso.valorNeto))),
        ]),

        el('p', 'documento__nota',
          'Lo retenido no se le descuenta al proveedor: se le paga a la DIAN por cuenta de el, '
          + 'y hasta que eso pase queda como un pasivo de la copropiedad.'),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cerrar'),
        anulado ? null : el('button', {
          clase: 'boton boton--peligro',
          onClick: function () { ui.cerrarModal(); abrirAnulacion(egreso.id, repintar) },
        }, 'Anular egreso'),
      ],
    })
  }

  function abrirAnulacion(egresoId, repintar) {
    var egreso = Idiky.repo.egresoPorId(egresoId)
    if (!egreso) return
    var campoMotivo = el('input', { type: 'text', placeholder: 'Por que se anula' })

    ui.abrirModal({
      titulo: 'Anular ' + egreso.numero,
      descripcion: 'Los gastos que pagaba vuelven a quedar por pagar.',
      contenido: [
        el('div', 'resumen-pago', [
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Beneficiario'),
            el('span', null, egreso.proveedorNombre),
          ]),
          el('div', 'resumen-pago__linea', [
            el('span', null, 'Neto pagado'),
            el('strong', 'cifra', f.dinero(egreso.valorNeto)),
          ]),
        ]),
        ui.campo('Motivo de la anulacion', campoMotivo,
          'El comprobante no se borra: queda anulado y su numero no se reutiliza.'),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--peligro',
          onClick: function () {
            try {
              Idiky.repo.anularEgreso({ egresoId: egresoId, motivo: campoMotivo.value })
              ui.cerrarModal()
              repintar()
              ui.aviso('Egreso anulado. Los gastos volvieron a por pagar.', 'exito')
            } catch (error) { ui.aviso(error.message, 'error') }
          },
        }, 'Anular egreso'),
      ],
    })
  }

  // ---------------------------------------------------------------------------
  // Registrar el pago
  // ---------------------------------------------------------------------------

  /**
   * Se busca el proveedor, el sistema trae sus datos y lo que se le debe, y el
   * administrador marca que le paga. El valor sale de los gastos marcados; las
   * retenciones las calcula el sistema con las tarifas del proveedor.
   */
  function abrirPago(proveedorPreseleccionado, repintar) {
    var estado = {
      proveedorId: proveedorPreseleccionado || '',
      fecha: d.hoyISO(),
      gastoIds: [],
      medio: 'transferencia',
      referencia: '',
    }

    var zonaProveedor = el('div')
    var zonaGastos = el('div')
    var zonaLiquidacion = el('div', 'asiento-previo')

    var campoBusqueda = el('input', {
      type: 'search',
      clase: 'busqueda',
      placeholder: 'Busca por NIT o por nombre',
      onInput: function (e) { pintarResultados(e.target.value) },
    })
    var resultados = el('div', 'resultados-busqueda')

    function pintarResultados(texto) {
      ui.vaciar(resultados)
      if (!texto || !texto.trim()) return

      var encontrados = Idiky.repo.buscarProveedores(texto).slice(0, 6)
      if (encontrados.length === 0) {
        var consulta = Idiky.repo.consultarNit(texto)
        ui.agregar(resultados, el('div', 'resultado-vacio', [
          el('span', null, consulta.error
            ? consulta.error
            : 'No hay ningun proveedor con ese NIT o ese nombre en el directorio.'),
          el('button', {
            clase: 'boton boton--pequeno',
            type: 'button',
            onClick: function () {
              ui.cerrarModal()
              abrirProveedor({ nit: consulta.error ? '' : consulta.nit }, repintar)
            },
          }, 'Crear proveedor'),
        ]))
        return
      }

      encontrados.forEach(function (p) {
        resultados.appendChild(el('button', {
          clase: 'resultado',
          type: 'button',
          onClick: function () {
            estado.proveedorId = p.id
            estado.gastoIds = []
            campoBusqueda.value = ''
            ui.vaciar(resultados)
            pintarProveedorElegido()
          },
        }, [
          el('strong', null, p.razonSocial),
          el('span', 'sub cifra', prov.formatearNit(p.nit, p.dv)),
        ]))
      })
    }

    function pintarProveedorElegido() {
      ui.vaciar(zonaProveedor)
      ui.vaciar(zonaGastos)
      var proveedor = Idiky.repo.proveedorPorId(estado.proveedorId)
      if (!proveedor) { pintarLiquidacion(); return }

      // Los datos del proveedor, traidos del directorio.
      ui.agregar(zonaProveedor, el('div', 'ficha-proveedor', [
        el('div', 'ficha-proveedor__cabecera', [
          el('div', null, [
            el('strong', null, proveedor.razonSocial),
            el('span', 'sub cifra', 'NIT ' + prov.formatearNit(proveedor.nit, proveedor.dv)),
          ]),
          el('button', {
            clase: 'boton boton--pequeno',
            type: 'button',
            onClick: function () {
              estado.proveedorId = ''
              estado.gastoIds = []
              pintarProveedorElegido()
            },
          }, 'Cambiar'),
        ]),
        el('div', 'ficha-proveedor__datos', [
          dato('Tipo', proveedor.tipoPersona === 'juridica' ? 'Persona juridica' : 'Persona natural'),
          dato('IVA', proveedor.responsableIva ? 'Responsable' : 'No responsable'),
          dato('Ciudad', proveedor.ciudad || '—'),
          dato('Retefuente', (proveedor.tarifaRetefuente || 0) + ' %'),
          dato('ReteICA', (proveedor.tarifaReteIca || 0) + ' x mil'),
        ]),
      ]))

      var pendientes = Idiky.repo.gastosPorPagarDe(proveedor.id)
      if (pendientes.length === 0) {
        zonaGastos.appendChild(ui.vacio('Este proveedor no tiene gastos por pagar',
          'Causa el gasto en el modulo de Gastos y vuelve aqui a pagarlo.'))
        pintarLiquidacion()
        return
      }

      ui.agregar(zonaGastos, [
        el('h3', 'titulo-seccion', 'Que se le paga'),
        el('div', 'lista lista--compacta', pendientes.map(function (gasto) {
          var marcado = estado.gastoIds.indexOf(gasto.id) !== -1
          return el('label', 'tarjeta tarjeta--plana fila-seleccion', [
            el('input', {
              type: 'checkbox', clase: 'casilla', checked: marcado,
              onChange: function () {
                if (marcado) {
                  estado.gastoIds = estado.gastoIds.filter(function (id) { return id !== gasto.id })
                } else {
                  estado.gastoIds = estado.gastoIds.concat([gasto.id])
                }
                pintarProveedorElegido()
              },
            }),
            el('div', 'columna', [
              el('strong', null, gasto.concepto),
              el('span', 'sub', f.fecha(gasto.fecha) + ' · ' + gasto.cuenta),
            ]),
            el('strong', 'cifra', f.dinero(gasto.valor)),
          ])
        })),
      ])

      pintarLiquidacion()
    }

    function dato(etiqueta, valor) {
      return el('div', null, [
        el('span', 'etiqueta-dato', etiqueta),
        el('strong', null, valor),
      ])
    }

    function pintarLiquidacion() {
      ui.vaciar(zonaLiquidacion)
      var proveedor = Idiky.repo.proveedorPorId(estado.proveedorId)
      if (!proveedor || estado.gastoIds.length === 0) {
        zonaLiquidacion.appendChild(el('span', 'campo__ayuda',
          'Elige el proveedor y marca que le vas a pagar para ver la liquidacion.'))
        return
      }

      var pendientes = Idiky.repo.gastosPorPagarDe(proveedor.id)
      var bruto = pendientes
        .filter(function (g) { return estado.gastoIds.indexOf(g.id) !== -1 })
        .reduce(function (t, g) { return t + g.valor }, 0)
      var r = Idiky.repo.calcularRetenciones(proveedor, bruto)

      ui.agregar(zonaLiquidacion, [
        el('span', 'cascada__etiqueta', 'Liquidacion del pago'),
        el('div', 'reparto__linea', [
          el('span', null, 'Valor bruto'),
          el('strong', 'cifra', f.dinero(bruto)),
        ]),
        r.retefuente > 0
          ? el('div', 'reparto__linea', [
              el('span', null, 'Retencion en la fuente (' + proveedor.tarifaRetefuente + ' %)'),
              el('strong', 'cifra cifra--deuda', '− ' + f.dinero(r.retefuente)),
            ])
          : null,
        r.reteica > 0
          ? el('div', 'reparto__linea', [
              el('span', null, 'ReteICA (' + proveedor.tarifaReteIca + ' x mil)'),
              el('strong', 'cifra cifra--deuda', '− ' + f.dinero(r.reteica)),
            ])
          : null,
        el('div', 'reparto__linea', [
          el('strong', null, 'Neto a pagar'),
          el('strong', 'cifra cifra--grande', f.dinero(r.neto)),
        ]),
      ])
    }

    pintarProveedorElegido()

    ui.abrirModal({
      titulo: 'Registrar pago a proveedor',
      descripcion: 'Busca el proveedor, marca que le pagas, y el sistema liquida las retenciones.',
      contenido: [
        estado.proveedorId ? null : ui.campo('Proveedor', campoBusqueda,
          'Si no esta en el directorio, lo puedes crear desde aqui.'),
        estado.proveedorId ? null : resultados,
        zonaProveedor,
        zonaGastos,
        el('div', 'fila-campos', [
          ui.campo('Fecha del pago', el('input', {
            type: 'date', value: estado.fecha,
            onChange: function (e) { estado.fecha = e.target.value },
          })),
          ui.campo('Medio', el('select', {
            onChange: function (e) { estado.medio = e.target.value },
          }, MEDIOS.map(function (m) {
            return el('option', { value: m[0] }, m[1])
          }))),
        ]),
        ui.campo('Referencia', el('input', {
          type: 'text', placeholder: 'Numero de transferencia o de cheque',
          onInput: function (e) { estado.referencia = e.target.value },
        })),
        zonaLiquidacion,
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var egreso = Idiky.repo.registrarEgreso(estado)
              ui.cerrarModal()
              repintar()
              ui.aviso('Egreso ' + egreso.numero + ' emitido por ' + f.dinero(egreso.valorNeto) + '.', 'exito')
              abrirDetalle(egreso.id, repintar)
            } catch (error) { ui.aviso(error.message, 'error') }
          },
        }, 'Emitir comprobante de egreso'),
      ],
    })
  }

  // ---------------------------------------------------------------------------
  // Directorio de proveedores
  // ---------------------------------------------------------------------------

  function pintarProveedores(contenedor, repintar) {
    var lista = Idiky.repo.proveedores()

    ui.agregar(contenedor, el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla', [
      el('thead', null, el('tr', null, [
        el('th', null, 'NIT'),
        el('th', null, 'Razon social'),
        el('th', null, 'Tipo'),
        el('th', null, 'Cuenta del gasto'),
        el('th', 'derecha', 'Retefuente'),
        el('th', 'derecha', 'ReteICA'),
        el('th', null, ''),
      ])),
      el('tbody', null, lista.map(function (p) {
        return el('tr', p.activo ? null : 'fila--anulada', [
          el('td', 'cifra', prov.formatearNit(p.nit, p.dv)),
          el('td', null, [
            el('strong', null, p.razonSocial),
            p.email ? el('span', 'sub', p.email) : null,
          ]),
          el('td', 'sub', p.tipoPersona === 'juridica' ? 'Juridica' : 'Natural'),
          el('td', null, [
            el('strong', 'cifra', p.cuentaGasto),
            el('span', 'sub', Idiky.repo.nombreDeCuenta(p.cuentaGasto)),
          ]),
          el('td', 'derecha cifra', (p.tarifaRetefuente || 0) + ' %'),
          el('td', 'derecha cifra', (p.tarifaReteIca || 0) + ' ‰'),
          el('td', 'derecha', el('button', {
            clase: 'boton boton--pequeno',
            onClick: function () { abrirProveedor(p, repintar) },
          }, 'Editar')),
        ])
      })),
    ])))
  }

  function abrirProveedor(proveedor, repintar) {
    var esNuevo = !proveedor || !proveedor.id
    var estado = {
      id: proveedor && proveedor.id ? proveedor.id : null,
      nit: (proveedor && proveedor.nit) || '',
      razonSocial: (proveedor && proveedor.razonSocial) || '',
      nombreComercial: (proveedor && proveedor.nombreComercial) || '',
      tipoPersona: (proveedor && proveedor.tipoPersona) || 'juridica',
      responsableIva: proveedor ? !!proveedor.responsableIva : true,
      direccion: (proveedor && proveedor.direccion) || '',
      ciudad: (proveedor && proveedor.ciudad) || 'Bogota',
      telefono: (proveedor && proveedor.telefono) || '',
      email: (proveedor && proveedor.email) || '',
      cuentaGasto: (proveedor && proveedor.cuentaGasto) || '5195',
      tarifaRetefuente: proveedor ? proveedor.tarifaRetefuente : 4,
      tarifaReteIca: proveedor ? proveedor.tarifaReteIca : 0.966,
    }

    var avisoDv = el('span', 'campo__ayuda')

    var campoNit = el('input', {
      type: 'text', value: estado.nit, placeholder: '830112445',
      onInput: function (e) { estado.nit = e.target.value; pintarDv() },
    })

    function pintarDv() {
      ui.vaciar(avisoDv)
      var validacion = prov.validarNit(estado.nit)
      if (!estado.nit.trim()) {
        avisoDv.className = 'campo__ayuda'
        avisoDv.textContent = 'El digito de verificacion se calcula solo.'
        return
      }
      if (!validacion.valido) {
        avisoDv.className = 'campo__ayuda campo__ayuda--error'
        avisoDv.textContent = validacion.motivo
        return
      }
      avisoDv.className = 'campo__ayuda'
      ui.agregar(ui.vaciar(avisoDv), [
        'Queda como ',
        el('strong', 'cifra', prov.formatearNit(validacion.nit, validacion.dv)),
        '. El digito de verificacion se calcula con el algoritmo de la DIAN.',
      ])
    }

    pintarDv()

    ui.abrirModal({
      titulo: esNuevo ? 'Nuevo proveedor' : 'Editar proveedor',
      descripcion: 'Queda en el directorio de la copropiedad, listo para el proximo pago.',
      contenido: [
        el('div', 'fila-campos', [
          ui.campo('NIT o cedula', campoNit),
          ui.campo('Tipo de persona', el('select', {
            onChange: function (e) { estado.tipoPersona = e.target.value },
          }, [
            el('option', { value: 'juridica', selected: estado.tipoPersona === 'juridica' }, 'Juridica'),
            el('option', { value: 'natural', selected: estado.tipoPersona === 'natural' }, 'Natural'),
          ])),
        ]),
        avisoDv,
        ui.campo('Razon social', el('input', {
          type: 'text', value: estado.razonSocial,
          onInput: function (e) { estado.razonSocial = e.target.value },
        })),
        ui.campo('Nombre comercial', el('input', {
          type: 'text', value: estado.nombreComercial,
          onInput: function (e) { estado.nombreComercial = e.target.value },
        }), 'Opcional. Si lo dejas vacio se usa el nombre de arriba.'),
        el('div', 'fila-campos', [
          ui.campo('Direccion', el('input', {
            type: 'text', value: estado.direccion,
            onInput: function (e) { estado.direccion = e.target.value },
          })),
          ui.campo('Ciudad', el('input', {
            type: 'text', value: estado.ciudad,
            onInput: function (e) { estado.ciudad = e.target.value },
          })),
        ]),
        el('div', 'fila-campos', [
          ui.campo('Telefono', el('input', {
            type: 'text', value: estado.telefono,
            onInput: function (e) { estado.telefono = e.target.value },
          })),
          ui.campo('Correo', el('input', {
            type: 'email', value: estado.email,
            onInput: function (e) { estado.email = e.target.value },
          })),
        ]),

        el('h3', 'titulo-seccion', 'Como se contabiliza'),
        ui.campo('Cuenta del gasto', el('select', {
          onChange: function (e) { estado.cuentaGasto = e.target.value },
        }, Idiky.repo.cuentasDeMovimiento()
          .filter(function (c) { return Idiky.puc.claseDe(c.codigo) === 'gasto' })
          .map(function (c) {
            return el('option', {
              value: c.codigo,
              selected: c.codigo === estado.cuentaGasto,
            }, Idiky.repo.etiquetaDeCuenta(c.codigo))
          })),
          'Se propone sola al causar un gasto de este proveedor.'),
        el('div', 'fila-campos', [
          ui.campo('Retefuente (%)', el('input', {
            type: 'number', min: 0, step: 0.1, value: estado.tarifaRetefuente,
            onInput: function (e) { estado.tarifaRetefuente = Number(e.target.value) },
          })),
          ui.campo('ReteICA (por mil)', el('input', {
            type: 'number', min: 0, step: 0.001, value: estado.tarifaReteIca,
            onInput: function (e) { estado.tarifaReteIca = Number(e.target.value) },
          })),
        ]),
        el('p', 'campo__ayuda',
          'Con estas tarifas se liquida cada pago. Si no aplica retencion, dejalas en cero.'),
        el('label', 'campo campo--casilla', [
          el('input', {
            type: 'checkbox', clase: 'casilla', checked: estado.responsableIva,
            onChange: function (e) { estado.responsableIva = e.target.checked },
          }),
          el('span', null, 'Responsable de IVA'),
        ]),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              var guardado = Idiky.repo.guardarProveedor(estado)
              ui.cerrarModal()
              repintar()
              ui.aviso('Proveedor ' + guardado.razonSocial + ' guardado.', 'exito')
            } catch (error) { ui.aviso(error.message, 'error') }
          },
        }, esNuevo ? 'Crear proveedor' : 'Guardar'),
      ],
    })
  }

  return { pintar: pintar, abrirProveedor: abrirProveedor }
})()
