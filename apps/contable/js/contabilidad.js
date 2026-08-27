/**
 * Motor contable: convierte cartera y pagos en movimientos y en estados.
 *
 * Funciones puras. No leen ni escriben datos: reciben las listas y calculan.
 *
 * --------------------------------------------------------------------------
 * CRITERIO: se trabaja por CAUSACION, no por caja.
 * --------------------------------------------------------------------------
 * Una cuota es ingreso el dia en que se causa (el primero de su periodo),
 * aunque el propietario pague tres meses despues. Un gasto es egreso el dia en
 * que se causa, aunque se pague al mes siguiente. Es como debe llevarse la
 * contabilidad de una copropiedad, y es lo que hace que la cartera exista como
 * cifra: la cartera es justamente lo causado que todavia no se ha recaudado.
 *
 * Las cuatro cuentas que se mueven:
 *
 *   Se causa una cuota      -> sube CARTERA           y sube INGRESOS
 *   Se aplica un pago       -> sube CAJA, baja CARTERA
 *                              (lo que sobre sube ANTICIPOS, que es un pasivo:
 *                               plata del propietario que aun no es ingreso)
 *   Se anula un recibo      -> lo contrario, con fecha de la anulacion
 *   Se causa un gasto       -> sube EGRESOS           y sube CUENTAS POR PAGAR
 *   Se paga un gasto        -> baja CAJA              y baja CUENTAS POR PAGAR
 *
 * De ahi salen los dos estados, y cuadran por construccion:
 *   ACTIVO (caja + cartera) = PASIVO (anticipos + por pagar) + PATRIMONIO
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.contabilidad = (function () {
  'use strict'

  /**
   * Fecha en que una cuota se causa: el primer dia de su periodo.
   *
   * El modelo no guarda una fecha de causacion aparte porque en propiedad
   * horizontal la cuota siempre pertenece a su mes. Si algun dia se necesita
   * causar en otra fecha, este es el unico sitio que hay que cambiar.
   */
  function fechaCausacion(cuota) {
    return cuota.periodo + '-01'
  }

  function enRango(fecha, desde, hasta) {
    if (!fecha) return false
    var dia = fecha.slice(0, 10)
    return (!desde || dia >= desde) && (!hasta || dia <= hasta)
  }

  function hastaLaFecha(fecha, hasta) {
    return !!fecha && (!hasta || fecha.slice(0, 10) <= hasta)
  }

  /** Fecha en la que un pago entro a los libros. */
  function fechaDeAplicacion(pago) {
    return pago.fechaAplicacion || pago.fecha
  }

  /**
   * Efecto acumulado de los pagos hasta una fecha, descontando los anulados.
   *
   * Un recibo anulado DESPUES de la fecha de corte si contaba a esa fecha: por
   * eso la anulacion se resta como un hecho con su propia fecha, en vez de
   * simplemente ignorar los recibos que hoy figuran como anulados.
   */
  function efectoPagos(pagos, hasta) {
    var total = { recaudo: 0, imputado: 0, anticipos: 0 }

    pagos.forEach(function (pago) {
      if (pago.estado === 'reportado') return
      if (!hastaLaFecha(fechaDeAplicacion(pago), hasta)) return

      var imputado = (pago.imputaciones || []).reduce(function (t, l) { return t + l.valor }, 0)
      var signo = pago.estado === 'anulado' && hastaLaFecha(pago.fechaAnulacion, hasta) ? 0 : 1

      total.recaudo += pago.valor * signo
      total.imputado += imputado * signo
      total.anticipos += (pago.saldoAFavor || 0) * signo
    })

    return total
  }

  // ---------------------------------------------------------------------------
  // Movimientos de un cliente
  // ---------------------------------------------------------------------------

  /**
   * Extracto de una unidad: cargos y abonos ordenados por fecha, con el saldo
   * corriendo. Es donde cartera y pagos se juntan en una sola lista.
   *
   * `contexto` = { cuotas, pagos } de esa unidad. Devuelve
   * `{ saldoInicial, lineas, cargos, abonos, saldoFinal }`.
   */
  function movimientosDeUnidad(contexto, desde, hasta) {
    var eventos = []

    contexto.cuotas.forEach(function (cuota) {
      eventos.push({
        fecha: fechaCausacion(cuota),
        tipo: 'cargo',
        concepto: cuota.concepto,
        detalle: 'Causacion de ' + cuota.periodo,
        documento: '',
        valor: cuota.valor,
      })
    })

    contexto.pagos.forEach(function (pago) {
      if (pago.estado === 'reportado') return
      var imputado = (pago.imputaciones || []).reduce(function (t, l) { return t + l.valor }, 0)
      if (imputado > 0) {
        eventos.push({
          fecha: fechaDeAplicacion(pago).slice(0, 10),
          tipo: 'abono',
          concepto: 'Pago aplicado',
          detalle: pago.medio + ' ' + pago.referencia,
          documento: pago.recibo || '',
          valor: imputado,
        })
      }
      // La anulacion es un hecho aparte, con su propia fecha: revierte el abono
      // sin borrarlo del extracto.
      if (pago.estado === 'anulado' && pago.fechaAnulacion && imputado > 0) {
        eventos.push({
          fecha: pago.fechaAnulacion.slice(0, 10),
          tipo: 'cargo',
          concepto: 'Anulacion de recibo',
          detalle: pago.motivoAnulacion || '',
          documento: pago.recibo || '',
          valor: imputado,
        })
      }
    })

    eventos.sort(function (a, b) {
      return a.fecha.localeCompare(b.fecha) || (a.tipo === 'cargo' ? -1 : 1)
    })

    var saldoInicial = 0
    var lineas = []
    var cargos = 0
    var abonos = 0
    var saldo = 0

    eventos.forEach(function (evento) {
      var efecto = evento.tipo === 'cargo' ? evento.valor : -evento.valor
      if (desde && evento.fecha < desde) {
        saldoInicial += efecto
        saldo = saldoInicial
        return
      }
      if (hasta && evento.fecha > hasta) return

      saldo += efecto
      if (evento.tipo === 'cargo') cargos += evento.valor
      else abonos += evento.valor
      lineas.push({
        fecha: evento.fecha,
        concepto: evento.concepto,
        detalle: evento.detalle,
        documento: evento.documento,
        cargo: evento.tipo === 'cargo' ? evento.valor : 0,
        abono: evento.tipo === 'abono' ? evento.valor : 0,
        saldo: saldo,
      })
    })

    return {
      saldoInicial: saldoInicial,
      lineas: lineas,
      cargos: cargos,
      abonos: abonos,
      saldoFinal: saldo,
    }
  }

  // ---------------------------------------------------------------------------
  // Estado de resultados
  // ---------------------------------------------------------------------------

  var ETIQUETA_INGRESO = {
    ordinaria: 'Cuotas de administracion',
    extraordinaria: 'Cuotas extraordinarias',
    interes: 'Intereses de mora',
    sancion: 'Sanciones',
  }

  /**
   * Ingresos y egresos causados dentro del rango. Devuelve las dos listas
   * agrupadas y el excedente (o deficit) del periodo.
   */
  function estadoDeResultados(datos, desde, hasta) {
    var ingresos = {}
    var egresos = {}

    datos.cuotas.forEach(function (cuota) {
      if (!enRango(fechaCausacion(cuota), desde, hasta)) return
      var clave = ETIQUETA_INGRESO[cuota.tipo] || 'Otros ingresos'
      ingresos[clave] = (ingresos[clave] || 0) + cuota.valor
    })

    datos.gastos.forEach(function (gasto) {
      if (!enRango(gasto.fecha, desde, hasta)) return
      var clave = gasto.categoria || 'Otros gastos'
      egresos[clave] = (egresos[clave] || 0) + gasto.valor
    })

    var lineasIngresos = aLineas(ingresos)
    var lineasEgresos = aLineas(egresos)
    var totalIngresos = sumar(lineasIngresos)
    var totalEgresos = sumar(lineasEgresos)

    return {
      desde: desde,
      hasta: hasta,
      ingresos: lineasIngresos,
      egresos: lineasEgresos,
      totalIngresos: totalIngresos,
      totalEgresos: totalEgresos,
      excedente: totalIngresos - totalEgresos,
    }
  }

  function aLineas(mapa) {
    return Object.keys(mapa)
      .map(function (clave) { return { concepto: clave, valor: mapa[clave] } })
      .sort(function (a, b) { return b.valor - a.valor })
  }

  function sumar(lineas) {
    return lineas.reduce(function (t, l) { return t + l.valor }, 0)
  }

  // ---------------------------------------------------------------------------
  // Estado de situacion financiera
  // ---------------------------------------------------------------------------

  /**
   * Foto a una fecha de corte. Cuadra por construccion:
   *
   *   ACTIVO   = caja + cartera
   *            = (recaudo - gastos pagados) + (ingresos causados - imputado)
   *   PASIVO   = anticipos + cuentas por pagar
   *            = (recaudo - imputado) + (gastos causados - gastos pagados)
   *   PATRIMONIO = ingresos causados - gastos causados
   *
   * Sumar pasivo y patrimonio da exactamente el activo. Si algun dia deja de
   * cuadrar, es que se agrego un hecho economico que no pasa por aqui.
   */
  function situacionFinanciera(datos, hasta) {
    var ingresosCausados = datos.cuotas.reduce(function (total, cuota) {
      return hastaLaFecha(fechaCausacion(cuota), hasta) ? total + cuota.valor : total
    }, 0)

    var efecto = efectoPagos(datos.pagos, hasta)

    var gastosCausados = 0
    var gastosPagados = 0
    datos.gastos.forEach(function (gasto) {
      if (!hastaLaFecha(gasto.fecha, hasta)) return
      gastosCausados += gasto.valor
      if (gasto.estado === 'pagado' && hastaLaFecha(gasto.fechaPago, hasta)) {
        gastosPagados += gasto.valor
      }
    })

    var caja = efecto.recaudo - gastosPagados
    var cartera = ingresosCausados - efecto.imputado
    var anticipos = efecto.anticipos
    var porPagar = gastosCausados - gastosPagados
    var excedentes = ingresosCausados - gastosCausados

    var activo = caja + cartera
    var pasivo = anticipos + porPagar

    return {
      hasta: hasta,
      activo: {
        lineas: [
          { concepto: 'Caja y bancos', valor: caja },
          { concepto: 'Cartera por cobrar a copropietarios', valor: cartera },
        ],
        total: activo,
      },
      pasivo: {
        lineas: [
          { concepto: 'Anticipos de copropietarios (saldos a favor)', valor: anticipos },
          { concepto: 'Cuentas por pagar', valor: porPagar },
        ],
        total: pasivo,
      },
      patrimonio: {
        lineas: [{ concepto: 'Excedentes acumulados', valor: excedentes }],
        total: excedentes,
      },
      totalPasivoYPatrimonio: pasivo + excedentes,
      /** Debe ser 0. Se muestra en pantalla: un estado que no cuadra hay que verlo. */
      descuadre: activo - (pasivo + excedentes),
    }
  }

  return {
    fechaCausacion: fechaCausacion,
    efectoPagos: efectoPagos,
    movimientosDeUnidad: movimientosDeUnidad,
    estadoDeResultados: estadoDeResultados,
    situacionFinanciera: situacionFinanciera,
  }
})()
