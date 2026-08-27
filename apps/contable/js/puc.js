/**
 * Plan Unico de Cuentas de la copropiedad.
 *
 * A diferencia de la version anterior, el plan YA NO vive en el codigo: vive
 * en los datos, y se edita desde la pantalla "Plan de cuentas". Este archivo
 * solo trae el plan por defecto y las funciones para consultarlo.
 *
 * --------------------------------------------------------------------------
 * SOBRE LOS CODIGOS
 * --------------------------------------------------------------------------
 * Las cuentas de cuatro digitos siguen el PUC colombiano (Decreto 2650). Las
 * de seis digitos son AUXILIARES propias de la copropiedad: el PUC deja ese
 * nivel al criterio de cada entidad, y aqui se abrieron las que una
 * copropiedad usa en el dia a dia.
 *
 * Una copropiedad es una entidad sin animo de lucro, asi que el grupo 41 de
 * ingresos operacionales se adapta a sus conceptos propios (cuotas de
 * administracion, extraordinarias, intereses) en vez de usar los del PUC de
 * comerciantes, que son por sector economico.
 *
 * >>> Antes de usar esto en la contabilidad real, que el contador de la
 * >>> copropiedad revise los codigos. Todo es editable justamente para eso.
 *
 * --------------------------------------------------------------------------
 * NIVELES
 * --------------------------------------------------------------------------
 * La jerarquia se lee del largo del codigo, no de un campo aparte:
 *   1 digito  -> clase      (1 ACTIVO)
 *   2 digitos -> grupo      (11 DISPONIBLE)
 *   4 digitos -> cuenta     (1105 Caja)
 *   6 digitos -> auxiliar   (110505 Caja general)
 *
 * Solo las cuentas marcadas con `movimiento` reciben asientos. Las demas son
 * titulos: existen para agrupar y para sumar.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.puc = (function () {
  'use strict'

  /**
   * Plan por defecto de una copropiedad.
   * [codigo, nombre, recibeMovimiento]
   */
  var PLAN_BASE = [
    // ---------------------------------------------------------------- ACTIVO
    ['1', 'ACTIVO', false],
    ['11', 'DISPONIBLE', false],
    ['1105', 'Caja', false],
    ['110505', 'Caja general', true],
    ['110510', 'Caja menor', true],
    ['1110', 'Bancos', false],
    ['111005', 'Cuenta corriente', true],
    ['111010', 'Cuenta de ahorros', true],
    ['13', 'DEUDORES', false],
    ['1305', 'Cuotas por cobrar a copropietarios', false],
    ['130505', 'Cuotas de administracion', true],
    ['130510', 'Cuotas extraordinarias', true],
    ['130515', 'Intereses de mora', true],
    ['130520', 'Sanciones', true],
    ['1399', 'Provisiones', false],
    ['139905', 'Provision cartera de dificil cobro', true],
    ['15', 'PROPIEDADES, PLANTA Y EQUIPO', false],
    ['1516', 'Construcciones y edificaciones', true],
    ['1524', 'Equipo de oficina', true],
    ['1592', 'Depreciacion acumulada', true],

    // ---------------------------------------------------------------- PASIVO
    ['2', 'PASIVO', false],
    ['22', 'PROVEEDORES', false],
    ['2205', 'Proveedores nacionales', true],
    ['23', 'CUENTAS POR PAGAR', false],
    ['2335', 'Costos y gastos por pagar', true],
    ['2365', 'Retencion en la fuente', true],
    ['2370', 'Retenciones y aportes de nomina', true],
    ['25', 'OBLIGACIONES LABORALES', false],
    ['2505', 'Salarios por pagar', true],
    ['2510', 'Cesantias consolidadas', true],
    ['28', 'OTROS PASIVOS', false],
    ['2805', 'Anticipos y avances recibidos', false],
    ['280505', 'Cuotas pagadas por anticipado', true],
    ['280510', 'Saldos a favor de copropietarios', true],

    // ------------------------------------------------------------ PATRIMONIO
    ['3', 'PATRIMONIO', false],
    ['31', 'FONDO SOCIAL', false],
    ['3105', 'Fondo social', true],
    ['33', 'RESERVAS', false],
    ['3305', 'Fondo de imprevistos (Ley 675, articulo 35)', true],
    ['36', 'RESULTADO DEL EJERCICIO', false],
    ['3605', 'Excedente del ejercicio', true],
    ['37', 'RESULTADOS DE EJERCICIOS ANTERIORES', false],
    ['3705', 'Excedentes acumulados', true],

    // --------------------------------------------------------------- INGRESOS
    ['4', 'INGRESOS', false],
    ['41', 'OPERACIONALES', false],
    ['4105', 'Cuotas de administracion', true],
    ['4110', 'Cuotas extraordinarias', true],
    ['4115', 'Intereses de mora', true],
    ['4120', 'Sanciones y multas', true],
    ['4125', 'Aprovechamiento de zonas comunes', true],
    ['4195', 'Otros ingresos operacionales', true],
    ['42', 'NO OPERACIONALES', false],
    ['4210', 'Financieros', true],
    ['4295', 'Diversos', true],

    // ----------------------------------------------------------------- GASTOS
    ['5', 'GASTOS', false],
    ['51', 'OPERACIONALES DE ADMINISTRACION', false],
    ['5105', 'Gastos de personal', true],
    ['5110', 'Honorarios', false],
    ['511005', 'Administracion', true],
    ['511010', 'Revisoria fiscal', true],
    ['511015', 'Asesoria juridica', true],
    ['5115', 'Impuestos', true],
    ['5120', 'Arrendamientos', true],
    ['5125', 'Contribuciones y afiliaciones', true],
    ['5130', 'Seguros', false],
    ['513005', 'Poliza de areas comunes', true],
    ['513010', 'Poliza de manejo', true],
    ['5135', 'Servicios', false],
    ['513505', 'Aseo y elementos', true],
    ['513510', 'Vigilancia', true],
    ['513525', 'Acueducto y alcantarillado', true],
    ['513530', 'Energia electrica', true],
    ['513535', 'Telefono e internet', true],
    ['513550', 'Gas', true],
    ['5140', 'Gastos legales', true],
    ['5145', 'Mantenimiento y reparaciones', false],
    ['514505', 'Ascensores', true],
    ['514510', 'Zonas comunes', true],
    ['514515', 'Equipos e instalaciones', true],
    ['5150', 'Adecuacion e instalacion', true],
    ['5160', 'Depreciaciones', true],
    ['5195', 'Diversos', true],
    ['5199', 'Provisiones', false],
    ['519910', 'Cartera de dificil cobro', true],
    ['53', 'NO OPERACIONALES', false],
    ['5305', 'Financieros', true],
  ]

  /**
   * Parametros por defecto: que cuenta usa cada documento.
   *
   * Es lo que conecta el modulo con el PUC. Se edita en la misma pantalla del
   * plan, y cambiarlo NO reescribe los documentos ya registrados: cada
   * documento guarda la cuenta que tenia el dia que se creo.
   */
  var PARAMETROS_BASE = {
    caja: '111005',
    anticipos: '280510',
    porPagar: '2335',
    excedentes: '3705',
    cartera: {
      ordinaria: '130505',
      extraordinaria: '130510',
      interes: '130515',
      sancion: '130520',
    },
    ingreso: {
      ordinaria: '4105',
      extraordinaria: '4110',
      interes: '4115',
      sancion: '4120',
    },
    gasto: {
      'Vigilancia': '513510',
      'Aseo': '513505',
      'Servicios publicos': '513530',
      'Mantenimiento': '514510',
      'Administracion': '511005',
      'Seguros': '513005',
      'Reparaciones': '514515',
      'Otros': '5195',
    },
  }

  function planBase() {
    return PLAN_BASE.map(function (fila) {
      return { codigo: fila[0], nombre: fila[1], movimiento: fila[2], activa: true }
    })
  }

  function parametrosBase() {
    return JSON.parse(JSON.stringify(PARAMETROS_BASE))
  }

  // ---------------------------------------------------------------------------
  // Lectura de la jerarquia — todo se deduce del codigo
  // ---------------------------------------------------------------------------

  var CLASES = {
    '1': 'activo',
    '2': 'pasivo',
    '3': 'patrimonio',
    '4': 'ingreso',
    '5': 'gasto',
  }

  function claseDe(codigo) {
    return CLASES[String(codigo).charAt(0)] || 'activo'
  }

  /** Los cinco niveles, del mas alto al mas bajo. */
  var NIVELES = [
    { id: 'clase', nombre: 'Clase', largo: 1, ejemplo: '1' },
    { id: 'grupo', nombre: 'Grupo', largo: 2, ejemplo: '11' },
    { id: 'cuenta', nombre: 'Cuenta', largo: 4, ejemplo: '1105' },
    { id: 'subcuenta', nombre: 'Subcuenta', largo: 6, ejemplo: '110505' },
    { id: 'auxiliar', nombre: 'Auxiliar', largo: 8, ejemplo: '11050501' },
  ]

  var POR_LARGO = {}
  NIVELES.forEach(function (n) { POR_LARGO[n.largo] = n })

  function nivelDe(codigo) {
    var nivel = POR_LARGO[String(codigo).length]
    return nivel ? nivel.id : 'auxiliar'
  }

  function nombreDeNivel(codigo) {
    var nivel = POR_LARGO[String(codigo).length]
    return nivel ? nivel.nombre : 'Auxiliar'
  }

  /** El nivel que sigue debajo de este. `null` si ya es el mas bajo. */
  function nivelHijoDe(idNivel) {
    for (var i = 0; i < NIVELES.length - 1; i += 1) {
      if (NIVELES[i].id === idNivel) return NIVELES[i + 1]
    }
    return null
  }

  function nivelPorId(idNivel) {
    return NIVELES.filter(function (n) { return n.id === idNivel })[0]
  }

  /** Codigo del padre: 11050501 -> 110505 -> 1105 -> 11 -> 1 -> null. */
  function padreDe(codigo) {
    var largo = String(codigo).length
    if (largo === 8) return String(codigo).slice(0, 6)
    if (largo === 6) return String(codigo).slice(0, 4)
    if (largo === 4) return String(codigo).slice(0, 2)
    if (largo === 2) return String(codigo).slice(0, 1)
    return null
  }

  /** Los digitos que este nivel agrega al codigo del padre. */
  function segmentoDe(codigo) {
    var padre = padreDe(codigo)
    return padre ? String(codigo).slice(padre.length) : String(codigo)
  }

  /** Todos los ancestros, del mas cercano al mas lejano. */
  function ancestrosDe(codigo) {
    var cadena = []
    var actual = padreDe(codigo)
    while (actual) {
      cadena.push(actual)
      actual = padreDe(actual)
    }
    return cadena
  }

  function esValido(codigo) {
    return /^\d+$/.test(codigo) && [1, 2, 4, 6, 8].indexOf(String(codigo).length) !== -1
  }

  /** El signo con el que la clase se presenta en los estados. */
  function seInvierte(clase) {
    return clase === 'pasivo' || clase === 'patrimonio' || clase === 'ingreso'
  }

  return {
    NIVELES: NIVELES,
    planBase: planBase,
    parametrosBase: parametrosBase,
    claseDe: claseDe,
    nivelDe: nivelDe,
    nombreDeNivel: nombreDeNivel,
    nivelHijoDe: nivelHijoDe,
    nivelPorId: nivelPorId,
    padreDe: padreDe,
    segmentoDe: segmentoDe,
    ancestrosDe: ancestrosDe,
    esValido: esValido,
    seInvierte: seInvierte,
  }
})()
