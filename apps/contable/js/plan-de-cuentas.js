/**
 * Plan de cuentas.
 *
 * Hasta ahora el motor trabajaba con cuentas implicitas: sabia sumar caja,
 * cartera, anticipos y cuentas por pagar, pero esas cuentas no existian como
 * tal en ninguna parte. Para poder hacer un comprobante de ajuste hay que
 * poder decir "debito ESTA cuenta y credito ESTA otra", asi que aqui quedan
 * escritas.
 *
 * Es un plan corto, a la medida de una copropiedad. No pretende ser el PUC.
 *
 * CONVENCION DE SIGNO: todo movimiento se guarda como `debe` y `haber`, y el
 * saldo de una cuenta es siempre `debe - haber`. De ahi:
 *   - activo y gasto tienen saldo positivo cuando aumentan;
 *   - pasivo, patrimonio e ingreso lo tienen negativo, y se muestran cambiados
 *     de signo.
 * Una cuenta correctora como la provision de cartera cae sola en negativo
 * dentro del activo, sin necesitar ningun caso especial.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.plan = (function () {
  'use strict'

  var CUENTAS = [
    // Activo
    { codigo: '1105', nombre: 'Caja y bancos', clase: 'activo' },
    { codigo: '1305', nombre: 'Cartera por cobrar a copropietarios', clase: 'activo' },
    { codigo: '1399', nombre: 'Provision de cartera de dificil cobro', clase: 'activo' },

    // Pasivo
    { codigo: '2335', nombre: 'Cuentas por pagar', clase: 'pasivo' },
    { codigo: '2805', nombre: 'Anticipos de copropietarios', clase: 'pasivo' },

    // Patrimonio
    { codigo: '3105', nombre: 'Excedentes acumulados', clase: 'patrimonio' },
    { codigo: '3110', nombre: 'Fondo de imprevistos', clase: 'patrimonio' },

    // Ingresos
    { codigo: '4105', nombre: 'Cuotas de administracion', clase: 'ingreso' },
    { codigo: '4110', nombre: 'Cuotas extraordinarias', clase: 'ingreso' },
    { codigo: '4115', nombre: 'Intereses de mora', clase: 'ingreso' },
    { codigo: '4120', nombre: 'Sanciones', clase: 'ingreso' },
    { codigo: '4195', nombre: 'Otros ingresos', clase: 'ingreso' },

    // Gastos
    { codigo: '5105', nombre: 'Vigilancia', clase: 'gasto' },
    { codigo: '5110', nombre: 'Aseo', clase: 'gasto' },
    { codigo: '5115', nombre: 'Servicios publicos', clase: 'gasto' },
    { codigo: '5120', nombre: 'Mantenimiento', clase: 'gasto' },
    { codigo: '5125', nombre: 'Administracion', clase: 'gasto' },
    { codigo: '5130', nombre: 'Seguros', clase: 'gasto' },
    { codigo: '5135', nombre: 'Reparaciones', clase: 'gasto' },
    { codigo: '5195', nombre: 'Otros gastos', clase: 'gasto' },
    { codigo: '5299', nombre: 'Castigo de cartera', clase: 'gasto' },
  ]

  var porCodigo = {}
  CUENTAS.forEach(function (c) { porCodigo[c.codigo] = c })

  /** Cuentas que el motor usa para los movimientos automaticos. */
  var CAJA = '1105'
  var CARTERA = '1305'
  var POR_PAGAR = '2335'
  var ANTICIPOS = '2805'
  var EXCEDENTES = '3105'

  /** Tipo de cuota -> cuenta de ingreso. */
  var INGRESO_POR_TIPO = {
    ordinaria: '4105',
    extraordinaria: '4110',
    interes: '4115',
    sancion: '4120',
  }

  /** Categoria de gasto -> cuenta de gasto. */
  var GASTO_POR_CATEGORIA = {
    'Vigilancia': '5105',
    'Aseo': '5110',
    'Servicios publicos': '5115',
    'Mantenimiento': '5120',
    'Administracion': '5125',
    'Seguros': '5130',
    'Reparaciones': '5135',
    'Otros': '5195',
  }

  function cuenta(codigo) {
    return porCodigo[codigo]
  }

  function nombre(codigo) {
    var c = porCodigo[codigo]
    return c ? c.nombre : codigo
  }

  function etiqueta(codigo) {
    return codigo + ' — ' + nombre(codigo)
  }

  function clase(codigo) {
    var c = porCodigo[codigo]
    return c ? c.clase : 'activo'
  }

  function deClase(nombreClase) {
    return CUENTAS.filter(function (c) { return c.clase === nombreClase })
  }

  function cuentaDeIngreso(tipoCuota) {
    return INGRESO_POR_TIPO[tipoCuota] || '4195'
  }

  function cuentaDeGasto(categoria) {
    return GASTO_POR_CATEGORIA[categoria] || '5195'
  }

  /**
   * Las cuentas de resultado (ingreso y gasto) se cierran contra excedentes:
   * no aparecen en el estado de situacion financiera, su efecto acumulado si.
   */
  function esDeResultado(codigo) {
    var c = clase(codigo)
    return c === 'ingreso' || c === 'gasto'
  }

  return {
    CUENTAS: CUENTAS,
    CAJA: CAJA,
    CARTERA: CARTERA,
    POR_PAGAR: POR_PAGAR,
    ANTICIPOS: ANTICIPOS,
    EXCEDENTES: EXCEDENTES,
    cuenta: cuenta,
    nombre: nombre,
    etiqueta: etiqueta,
    clase: clase,
    deClase: deClase,
    cuentaDeIngreso: cuentaDeIngreso,
    cuentaDeGasto: cuentaDeGasto,
    esDeResultado: esDeResultado,
  }
})()
