/**
 * Plan de cuentas — el PUC de la copropiedad.
 *
 * Dos cosas viven aqui:
 *
 *   EL PLAN        las cuentas, con su codigo del PUC colombiano. Se pueden
 *                  agregar, renombrar y desactivar. No se borran: una cuenta
 *                  con asientos no puede desaparecer sin romper la
 *                  contabilidad de los meses anteriores.
 *
 *   LOS PARAMETROS a que cuenta va cada tipo de documento. Es lo que conecta
 *                  el resto del modulo con el plan. Cambiarlos NO reescribe
 *                  los documentos ya registrados: cada uno guarda la cuenta
 *                  que tenia el dia que se creo.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.vistaPlan = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui
  var f = Idiky.formato
  var puc = Idiky.puc

  var pestana = 'cuentas'
  var busqueda = ''
  var verInactivas = false

  var NOMBRE_CLASE = {
    activo: 'Activo',
    pasivo: 'Pasivo',
    patrimonio: 'Patrimonio',
    ingreso: 'Ingresos',
    gasto: 'Gastos',
  }

  function pintar(contenedor, repintar) {
    ui.agregar(contenedor, [
      el('div', 'nota nota--info', [
        el('div', null, [
          el('strong', null, 'Los codigos de cuatro digitos siguen el PUC colombiano'),
          el('span', 'sub',
            'Los de seis digitos son auxiliares propios de la copropiedad, que el PUC deja a criterio '
            + 'de cada entidad. Antes de usar esto en la contabilidad real, que el contador los revise: '
            + 'todo es editable justamente para eso.'),
        ]),
      ]),

      el('div', 'barra-acciones', [
        el('div', 'filtros', [
          botonPestana('cuentas', 'Cuentas', repintar),
          botonPestana('parametros', 'Que cuenta usa cada documento', repintar),
          botonPestana('balance', 'Balance de prueba', repintar),
        ]),
        pestana === 'cuentas'
          ? el('button', {
              clase: 'boton boton--principal',
              onClick: function () { abrirCuenta(null, repintar) },
            }, 'Nueva cuenta')
          : null,
      ]),
    ])

    if (pestana === 'cuentas') pintarCuentas(contenedor, repintar)
    else if (pestana === 'parametros') pintarParametros(contenedor, repintar)
    else pintarBalance(contenedor)
  }

  function botonPestana(id, texto, repintar) {
    return el('button', {
      clase: 'filtro',
      'aria-pressed': String(pestana === id),
      onClick: function () { pestana = id; repintar() },
    }, texto)
  }

  // ---------------------------------------------------------------------------
  // El plan
  // ---------------------------------------------------------------------------

  function pintarCuentas(contenedor, repintar) {
    var todas = Idiky.repo.plan()
    var enUso = Idiky.repo.cuentasEnUso()

    var visibles = todas.filter(function (c) {
      if (!verInactivas && !c.activa) return false
      if (!busqueda) return true
      var texto = (c.codigo + ' ' + c.nombre).toLowerCase()
      return texto.indexOf(busqueda.toLowerCase()) !== -1
    })

    var campoBusqueda = el('input', {
      type: 'search', clase: 'busqueda', value: busqueda,
      placeholder: 'Buscar por codigo o por nombre',
      onInput: function (e) { busqueda = e.target.value; repintar({ mantenerFoco: 'busqueda' }) },
    })

    ui.agregar(contenedor, [
      el('div', 'barra-acciones', [
        campoBusqueda,
        el('label', 'campo--casilla', [
          el('input', {
            type: 'checkbox', clase: 'casilla', checked: verInactivas,
            onChange: function (e) { verInactivas = e.target.checked; repintar() },
          }),
          el('span', null, 'Ver las inactivas'),
        ]),
      ]),

      el('div', 'tarjeta tarjeta--tabla', el('table', 'tabla tabla--plan', [
        el('thead', null, el('tr', null, [
          el('th', null, 'Codigo'),
          el('th', null, 'Cuenta'),
          el('th', null, 'Clase'),
          el('th', null, 'Recibe movimiento'),
          el('th', null, ''),
        ])),
        el('tbody', null, visibles.map(function (cuenta) {
          return filaCuenta(cuenta, enUso, repintar)
        })),
      ])),

      visibles.length === 0 ? ui.vacio('Ninguna cuenta coincide con la busqueda') : null,
    ])
  }

  function filaCuenta(cuenta, enUso, repintar) {
    var nivel = puc.nivelDe(cuenta.codigo)
    var esTitulo = !cuenta.movimiento
    var usada = enUso.indexOf(cuenta.codigo) !== -1

    return el('tr', {
      clase: (esTitulo ? 'fila--titulo-cuenta' : '') + (cuenta.activa ? '' : ' fila--anulada'),
    }, [
      el('td', 'cifra nivel-' + nivel, cuenta.codigo),
      el('td', esTitulo ? 'celda-titulo' : 'celda-sangrada', cuenta.nombre),
      el('td', 'sub', NOMBRE_CLASE[puc.claseDe(cuenta.codigo)]),
      el('td', null, cuenta.movimiento
        ? ui.chip('Si', 'exito')
        : ui.chip('Titulo', '')),
      el('td', 'derecha', el('div', 'grupo-acciones', [
        usada ? ui.chip('En uso', 'info') : null,
        el('button', {
          clase: 'boton boton--pequeno',
          onClick: function () { abrirCuenta(cuenta, repintar) },
        }, 'Editar'),
        cuenta.activa
          ? el('button', {
              clase: 'boton boton--pequeno boton--peligro',
              disabled: usada,
              title: usada ? 'La usa un parametro del modulo' : 'Dejar de usarla',
              onClick: function () {
                try {
                  Idiky.repo.desactivarCuenta(cuenta.codigo)
                  repintar()
                  ui.aviso('Cuenta desactivada. Sus asientos anteriores se conservan.', 'exito')
                } catch (error) { ui.aviso(error.message, 'error') }
              },
            }, 'Desactivar')
          : el('button', {
              clase: 'boton boton--pequeno',
              onClick: function () {
                Idiky.repo.activarCuenta(cuenta.codigo)
                repintar()
                ui.aviso('Cuenta activada.', 'exito')
              },
            }, 'Activar'),
      ])),
    ])
  }

  function abrirCuenta(cuenta, repintar) {
    var esNueva = !cuenta
    var estado = {
      codigo: cuenta ? cuenta.codigo : '',
      nombre: cuenta ? cuenta.nombre : '',
      movimiento: cuenta ? cuenta.movimiento : true,
    }

    var campoCodigo = el('input', {
      type: 'text',
      value: estado.codigo,
      disabled: !esNueva,
      placeholder: '110505',
      onInput: function (e) { estado.codigo = e.target.value.replace(/\D/g, '') },
    })
    var campoNombre = el('input', {
      type: 'text', value: estado.nombre,
      onInput: function (e) { estado.nombre = e.target.value },
    })
    var campoMovimiento = el('input', {
      type: 'checkbox', clase: 'casilla', checked: estado.movimiento,
      onChange: function (e) { estado.movimiento = e.target.checked },
    })

    ui.abrirModal({
      titulo: esNueva ? 'Nueva cuenta' : 'Editar ' + cuenta.codigo,
      descripcion: esNueva
        ? 'El codigo define el nivel: 1 digito es clase, 2 grupo, 4 cuenta, 6 auxiliar.'
        : 'El codigo no se cambia. Si esta mal, crea la cuenta correcta y desactiva esta.',
      contenido: [
        ui.campo('Codigo', campoCodigo,
          esNueva ? 'Tiene que colgar de una cuenta que ya exista: 110505 necesita que exista 1105.' : ''),
        ui.campo('Nombre', campoNombre),
        el('label', 'campo campo--casilla', [
          campoMovimiento,
          el('span', null, 'Recibe movimiento'),
        ]),
        el('p', 'campo__ayuda',
          'Las cuentas que reciben movimiento son las que aceptan asientos. Las demas son titulos: '
          + 'existen para agrupar y para sumar en los estados.'),
      ],
      acciones: [
        el('button', { clase: 'boton', onClick: ui.cerrarModal }, 'Cancelar'),
        el('button', {
          clase: 'boton boton--principal',
          onClick: function () {
            try {
              Idiky.repo.guardarCuenta(estado)
              ui.cerrarModal()
              repintar()
              ui.aviso(esNueva ? 'Cuenta creada.' : 'Cuenta actualizada.', 'exito')
            } catch (error) { ui.aviso(error.message, 'error') }
          },
        }, esNueva ? 'Crear cuenta' : 'Guardar'),
      ],
    })
  }

  // ---------------------------------------------------------------------------
  // Los parametros
  // ---------------------------------------------------------------------------

  function pintarParametros(contenedor, repintar) {
    var p = Idiky.repo.parametros()

    ui.agregar(contenedor, [
      el('p', 'documento__nota',
        'Aqui se decide contra que cuenta se registra cada cosa. Cambiar un parametro afecta '
        + 'a los documentos que se creen de ahora en adelante: los que ya estan registrados '
        + 'conservan la cuenta que tenian, y por eso la contabilidad de los meses cerrados no se mueve.'),

      grupoParametros('Cuentas generales', [
        ['caja', 'Caja y bancos', p.caja, null],
        ['anticipos', 'Anticipos y saldos a favor', p.anticipos, 'pasivo'],
        ['porPagar', 'Cuentas por pagar', p.porPagar, 'pasivo'],
        ['excedentes', 'Excedentes acumulados', p.excedentes, 'patrimonio'],
      ], repintar),

      grupoParametros('Cartera, segun el tipo de cuota', [
        ['cartera.ordinaria', 'Cuota de administracion', p.cartera.ordinaria, 'activo'],
        ['cartera.extraordinaria', 'Cuota extraordinaria', p.cartera.extraordinaria, 'activo'],
        ['cartera.interes', 'Intereses de mora', p.cartera.interes, 'activo'],
        ['cartera.sancion', 'Sanciones', p.cartera.sancion, 'activo'],
      ], repintar),

      grupoParametros('Ingresos, segun el tipo de cuota', [
        ['ingreso.ordinaria', 'Cuota de administracion', p.ingreso.ordinaria, 'ingreso'],
        ['ingreso.extraordinaria', 'Cuota extraordinaria', p.ingreso.extraordinaria, 'ingreso'],
        ['ingreso.interes', 'Intereses de mora', p.ingreso.interes, 'ingreso'],
        ['ingreso.sancion', 'Sanciones', p.ingreso.sancion, 'ingreso'],
      ], repintar),

      grupoParametros('Gastos, segun la categoria', Object.keys(p.gasto).map(function (categoria) {
        return ['gasto.' + categoria, categoria, p.gasto[categoria], 'gasto']
      }), repintar),
    ])
  }

  function grupoParametros(titulo, filas, repintar) {
    return el('div', 'tarjeta', [
      el('h3', 'titulo-seccion', titulo),
      el('div', 'lista-parametros', filas.map(function (fila) {
        return filaParametro(fila[0], fila[1], fila[2], fila[3], repintar)
      })),
    ])
  }

  function filaParametro(ruta, etiqueta, actual, claseEsperada, repintar) {
    var opciones = Idiky.repo.cuentasDeMovimiento().filter(function (c) {
      return !claseEsperada || puc.claseDe(c.codigo) === claseEsperada
    })

    var selector = el('select', {
      onChange: function (e) {
        try {
          Idiky.repo.fijarParametro(ruta, e.target.value)
          ui.aviso('Parametro actualizado. Los documentos anteriores no cambian.', 'exito')
          repintar()
        } catch (error) {
          ui.aviso(error.message, 'error')
          repintar()
        }
      },
    }, opciones.map(function (c) {
      return el('option', {
        value: c.codigo,
        selected: c.codigo === actual,
      }, Idiky.repo.etiquetaDeCuenta(c.codigo))
    }))

    return el('div', 'fila-parametro', [
      el('span', 'fila-parametro__etiqueta', etiqueta),
      selector,
    ])
  }

  // ---------------------------------------------------------------------------
  // Balance de prueba
  // ---------------------------------------------------------------------------

  function pintarBalance(contenedor) {
    var balance = Idiky.repo.balanceDePrueba(null, Idiky.dominio.hoyISO())
    var cuadra = balance.totalDebe === balance.totalHaber

    ui.agregar(contenedor, [
      el('div', 'documento', [
        el('h3', 'titulo-seccion', 'Balance de prueba al ' + f.fecha(Idiky.dominio.hoyISO())),
        el('p', 'documento__nota',
          'Todas las cuentas con movimiento, con sus totales. Es la vista para revisar que la '
          + 'contabilidad este bien: el total del debe tiene que ser igual al del haber.'),

        el('table', 'tabla tabla--documento', [
          el('thead', null, el('tr', null, [
            el('th', null, 'Codigo'),
            el('th', null, 'Cuenta'),
            el('th', 'derecha', 'Debe'),
            el('th', 'derecha', 'Haber'),
            el('th', 'derecha', 'Saldo'),
          ])),
          el('tbody', null, balance.lineas.map(function (linea) {
            return el('tr', null, [
              el('td', 'cifra', linea.codigo),
              el('td', null, linea.nombre),
              el('td', 'derecha cifra', f.dinero(linea.debe)),
              el('td', 'derecha cifra', f.dinero(linea.haber)),
              el('td', 'derecha cifra', f.dinero(Math.abs(linea.saldo))),
            ])
          })),
          el('tfoot', null, el('tr', null, [
            el('td', { colspan: 2 }, 'Totales'),
            el('td', 'derecha cifra', f.dinero(balance.totalDebe)),
            el('td', 'derecha cifra', f.dinero(balance.totalHaber)),
            el('td', 'derecha', ''),
          ])),
        ]),

        cuadra
          ? el('p', 'documento__cuadre', 'El balance de prueba cuadra.')
          : el('p', 'documento__cuadre documento__cuadre--error',
              'DESCUADRE de ' + f.dinero(Math.abs(balance.totalDebe - balance.totalHaber)) + '.'),
      ]),
    ])
  }

  return { pintar: pintar }
})()
