/**
 * Motor contable: convierte todo lo que pasa en la copropiedad en asientos de
 * partida doble, y de ahi arma los estados.
 *
 * Funciones puras. No leen ni escriben datos: reciben las listas y calculan.
 *
 * --------------------------------------------------------------------------
 * CRITERIO: se trabaja por CAUSACION, no por caja.
 * --------------------------------------------------------------------------
 * Una cuota es ingreso el dia en que se causa, aunque el propietario pague
 * tres meses despues. Un gasto es egreso el dia en que se causa, aunque se
 * pague al mes siguiente. Es lo que hace que la cartera exista como cifra: la
 * cartera es justamente lo causado que todavia no se ha recaudado.
 *
 * --------------------------------------------------------------------------
 * TODO ES UN ASIENTO
 * --------------------------------------------------------------------------
 * Hay dos fuentes de asientos y se suman en el mismo lugar:
 *
 *   AUTOMATICOS  los que salen de cuotas, pagos y gastos. Nadie los escribe:
 *                se derivan de los documentos.
 *   MANUALES     los comprobantes de ajuste, que el administrador escribe a
 *                mano cuando hay que mover la contabilidad sin que entre ni
 *                salga plata.
 *
 * Como todo asiento tiene `debe = haber`, el estado de situacion financiera
 * cuadra por construccion, vengan los asientos de donde vengan.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.contabilidad = (function () {
  'use strict'

  var plan = Idiky.plan

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

  function fechaDeAplicacion(pago) {
    return (pago.fechaAplicacion || pago.fecha).slice(0, 10)
  }

  function enRango(fecha, desde, hasta) {
    if (!fecha) return false
    var dia = fecha.slice(0, 10)
    return (!desde || dia >= desde) && (!hasta || dia <= hasta)
  }

  // ---------------------------------------------------------------------------
  // Generacion de asientos
  // ---------------------------------------------------------------------------

  function asiento(fecha, cuenta, debe, haber, descripcion, extra) {
    var linea = {
      fecha: fecha.slice(0, 10),
      cuenta: cuenta,
      debe: debe,
      haber: haber,
      descripcion: descripcion,
      origen: 'automatico',
      unidadId: null,
      documento: '',
    }
    if (extra) {
      if (extra.unidadId) linea.unidadId = extra.unidadId
      if (extra.documento) linea.documento = extra.documento
      if (extra.origen) linea.origen = extra.origen
    }
    return linea
  }

  /** Asientos que se derivan de los documentos, sin que nadie los escriba. */
  function asientosDerivados(datos) {
    var lineas = []

    // Se causa una cuota: sube cartera y sube el ingreso que corresponda.
    datos.cuotas.forEach(function (cuota) {
      var fecha = fechaCausacion(cuota)
      var extra = { unidadId: cuota.unidadId, documento: 'Causacion ' + cuota.periodo }
      lineas.push(asiento(fecha, plan.CARTERA, cuota.valor, 0, cuota.concepto, extra))
      lineas.push(asiento(fecha, plan.cuentaDeIngreso(cuota.tipo), 0, cuota.valor, cuota.concepto, extra))
    })

    datos.pagos.forEach(function (pago) {
      if (pago.estado === 'reportado') return
      var imputado = (pago.imputaciones || []).reduce(function (t, l) { return t + l.valor }, 0)
      var aFavor = pago.saldoAFavor || 0
      var extra = { unidadId: pago.unidadId, documento: pago.recibo || '' }

      // Se aplica un pago: entra a caja, baja la cartera, y lo que sobre
      // queda como anticipo, que es un pasivo — plata del propietario que
      // todavia no es ingreso de la copropiedad.
      var fecha = fechaDeAplicacion(pago)
      lineas.push(asiento(fecha, plan.CAJA, pago.valor, 0, 'Recaudo', extra))
      if (imputado > 0) lineas.push(asiento(fecha, plan.CARTERA, 0, imputado, 'Abono a cartera', extra))
      if (aFavor > 0) lineas.push(asiento(fecha, plan.ANTICIPOS, 0, aFavor, 'Saldo a favor', extra))

      // La anulacion es un hecho aparte, con su propia fecha: revierte el
      // asiento sin borrarlo.
      if (pago.estado === 'anulado' && pago.fechaAnulacion) {
        var anula = pago.fechaAnulacion.slice(0, 10)
        lineas.push(asiento(anula, plan.CAJA, 0, pago.valor, 'Anulacion de recibo', extra))
        if (imputado > 0) lineas.push(asiento(anula, plan.CARTERA, imputado, 0, 'Anulacion de recibo', extra))
        if (aFavor > 0) lineas.push(asiento(anula, plan.ANTICIPOS, aFavor, 0, 'Anulacion de recibo', extra))
      }
    })

    datos.gastos.forEach(function (gasto) {
      var cuenta = plan.cuentaDeGasto(gasto.categoria)
      var extra = { documento: gasto.proveedor || '' }

      // Se causa el gasto: sube el egreso y sube la cuenta por pagar.
      lineas.push(asiento(gasto.fecha, cuenta, gasto.valor, 0, gasto.concepto, extra))
      lineas.push(asiento(gasto.fecha, plan.POR_PAGAR, 0, gasto.valor, gasto.concepto, extra))

      // Se paga: baja la cuenta por pagar y sale de caja.
      if (gasto.estado === 'pagado' && gasto.fechaPago) {
        lineas.push(asiento(gasto.fechaPago, plan.POR_PAGAR, gasto.valor, 0, 'Pago a ' + (gasto.proveedor || 'proveedor'), extra))
        lineas.push(asiento(gasto.fechaPago, plan.CAJA, 0, gasto.valor, 'Pago a ' + (gasto.proveedor || 'proveedor'), extra))
      }
    })

    return lineas
  }

  /** Asientos que el administrador escribio a mano en un comprobante. */
  function asientosDeAjustes(comprobantes) {
    var lineas = []
    ;(comprobantes || []).forEach(function (comprobante) {
      if (comprobante.estado === 'anulado') return
      comprobante.lineas.forEach(function (linea) {
        lineas.push(asiento(
          comprobante.fecha,
          linea.cuenta,
          linea.debe || 0,
          linea.haber || 0,
          linea.descripcion || comprobante.concepto,
          {
            unidadId: linea.unidadId || null,
            documento: comprobante.numero,
            origen: 'ajuste',
          },
        ))
      })
    })
    return lineas
  }

  /** Todos los asientos del periodo, automaticos y manuales. */
  function libro(datos) {
    return asientosDerivados(datos).concat(asientosDeAjustes(datos.comprobantes))
  }

  // ---------------------------------------------------------------------------
  // Saldos
  // ---------------------------------------------------------------------------

  /**
   * Saldo de cada cuenta, en la convencion `debe - haber`.
   * Activo y gasto quedan positivos; pasivo, patrimonio e ingreso, negativos.
   */
  function saldosPorCuenta(lineas, desde, hasta) {
    var saldos = {}
    lineas.forEach(function (linea) {
      if (!enRango(linea.fecha, desde, hasta)) return
      saldos[linea.cuenta] = (saldos[linea.cuenta] || 0) + linea.debe - linea.haber
    })
    return saldos
  }

  /** Convierte los saldos de una clase en lineas presentables, ya con su signo. */
  function lineasDeClase(saldos, clase) {
    var invertir = clase === 'pasivo' || clase === 'patrimonio' || clase === 'ingreso'
    return plan.deClase(clase)
      .map(function (cuenta) {
        var bruto = saldos[cuenta.codigo] || 0
        return {
          codigo: cuenta.codigo,
          concepto: cuenta.nombre,
          valor: invertir ? -bruto : bruto,
        }
      })
      .filter(function (linea) { return linea.valor !== 0 })
      .sort(function (a, b) { return b.valor - a.valor })
  }

  function sumar(lineas) {
    return lineas.reduce(function (t, l) { return t + l.valor }, 0)
  }

  // ---------------------------------------------------------------------------
  // Movimientos de un cliente
  // ---------------------------------------------------------------------------

  /**
   * Extracto de una unidad: lo que le cargaron y lo que abono, en una sola
   * linea de tiempo, con el saldo corriendo. Solo mira la cuenta de cartera,
   * que es la que le debe el propietario a la copropiedad.
   *
   * Los ajustes que toquen cartera de esa unidad entran aqui igual que una
   * cuota: si no, el extracto no cuadraria con lo que dice la contabilidad.
   */
  function movimientosDeUnidad(datos, unidadId, desde, hasta) {
    var eventos = libro(datos)
      .filter(function (l) {
        return l.cuenta === plan.CARTERA && l.unidadId === unidadId
      })
      .sort(function (a, b) {
        return a.fecha.localeCompare(b.fecha) || b.debe - a.debe
      })

    var saldoInicial = 0
    var lineas = []
    var cargos = 0
    var abonos = 0
    var saldo = 0

    eventos.forEach(function (evento) {
      var efecto = evento.debe - evento.haber
      if (desde && evento.fecha < desde) {
        saldoInicial += efecto
        saldo = saldoInicial
        return
      }
      if (hasta && evento.fecha > hasta) return

      saldo += efecto
      cargos += evento.debe
      abonos += evento.haber
      lineas.push({
        fecha: evento.fecha,
        concepto: evento.descripcion,
        detalle: evento.origen === 'ajuste' ? 'Comprobante de ajuste' : evento.documento,
        documento: evento.documento,
        esAjuste: evento.origen === 'ajuste',
        cargo: evento.debe,
        abono: evento.haber,
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

  /** Efecto neto de los ajustes sobre la cartera de una unidad, hasta una fecha. */
  function ajusteDeCarteraDeUnidad(datos, unidadId, hasta) {
    return asientosDeAjustes(datos.comprobantes).reduce(function (total, linea) {
      if (linea.cuenta !== plan.CARTERA || linea.unidadId !== unidadId) return total
      if (!enRango(linea.fecha, null, hasta)) return total
      return total + linea.debe - linea.haber
    }, 0)
  }

  // ---------------------------------------------------------------------------
  // Estado de resultados
  // ---------------------------------------------------------------------------

  function estadoDeResultados(datos, desde, hasta) {
    var saldos = saldosPorCuenta(libro(datos), desde, hasta)
    var ingresos = lineasDeClase(saldos, 'ingreso')
    var egresos = lineasDeClase(saldos, 'gasto')
    var totalIngresos = sumar(ingresos)
    var totalEgresos = sumar(egresos)

    return {
      desde: desde,
      hasta: hasta,
      ingresos: ingresos,
      egresos: egresos,
      totalIngresos: totalIngresos,
      totalEgresos: totalEgresos,
      excedente: totalIngresos - totalEgresos,
    }
  }

  // ---------------------------------------------------------------------------
  // Estado de situacion financiera
  // ---------------------------------------------------------------------------

  /**
   * Foto a una fecha de corte.
   *
   * El patrimonio son las cuentas de patrimonio mas el resultado acumulado de
   * toda la vida hasta el corte: las cuentas de ingreso y gasto no aparecen en
   * este estado, pero su efecto si, cerrado contra excedentes.
   *
   * Cuadra por construccion, porque todo asiento tiene debe = haber. Si algun
   * dia el descuadre no es cero, es que alguien creo un asiento desbalanceado.
   */
  function situacionFinanciera(datos, hasta) {
    var saldos = saldosPorCuenta(libro(datos), null, hasta)

    var activo = lineasDeClase(saldos, 'activo')
    var pasivo = lineasDeClase(saldos, 'pasivo')
    var patrimonio = lineasDeClase(saldos, 'patrimonio')

    var totalIngresos = sumar(lineasDeClase(saldos, 'ingreso'))
    var totalEgresos = sumar(lineasDeClase(saldos, 'gasto'))
    var resultadoAcumulado = totalIngresos - totalEgresos

    // El resultado del ejercicio se presenta dentro del patrimonio.
    var lineasPatrimonio = patrimonio.concat(
      resultadoAcumulado !== 0
        ? [{ codigo: '', concepto: 'Resultado acumulado del ejercicio', valor: resultadoAcumulado }]
        : [],
    )

    var totalActivo = sumar(activo)
    var totalPasivo = sumar(pasivo)
    var totalPatrimonio = sumar(lineasPatrimonio)

    return {
      hasta: hasta,
      activo: { lineas: activo, total: totalActivo },
      pasivo: { lineas: pasivo, total: totalPasivo },
      patrimonio: { lineas: lineasPatrimonio, total: totalPatrimonio },
      totalPasivoYPatrimonio: totalPasivo + totalPatrimonio,
      /** Debe ser 0. Se muestra en pantalla: un estado que no cuadra hay que verlo. */
      descuadre: totalActivo - (totalPasivo + totalPatrimonio),
    }
  }

  // ---------------------------------------------------------------------------
  // Libro auxiliar por cuenta
  // ---------------------------------------------------------------------------

  /** Movimientos de una cuenta en el rango, con su saldo corriendo. */
  function auxiliarDeCuenta(datos, codigo, desde, hasta) {
    var todas = libro(datos)
      .filter(function (l) { return l.cuenta === codigo })
      .sort(function (a, b) { return a.fecha.localeCompare(b.fecha) })

    var saldoInicial = 0
    var lineas = []
    var saldo = 0

    todas.forEach(function (linea) {
      var efecto = linea.debe - linea.haber
      if (desde && linea.fecha < desde) {
        saldoInicial += efecto
        saldo = saldoInicial
        return
      }
      if (hasta && linea.fecha > hasta) return
      saldo += efecto
      lineas.push({
        fecha: linea.fecha,
        descripcion: linea.descripcion,
        documento: linea.documento,
        origen: linea.origen,
        debe: linea.debe,
        haber: linea.haber,
        saldo: saldo,
      })
    })

    return { saldoInicial: saldoInicial, lineas: lineas, saldoFinal: saldo }
  }

  /** Un comprobante es valido si cuadra y mueve algo. */
  function validarComprobante(lineas) {
    var utiles = (lineas || []).filter(function (l) {
      return l.cuenta && ((l.debe || 0) > 0 || (l.haber || 0) > 0)
    })
    if (utiles.length < 2) {
      return { valido: false, motivo: 'Un comprobante necesita al menos dos lineas con valor.' }
    }
    var totalDebe = 0
    var totalHaber = 0
    for (var i = 0; i < utiles.length; i += 1) {
      var linea = utiles[i]
      var debe = linea.debe || 0
      var haber = linea.haber || 0
      if (debe < 0 || haber < 0) {
        return { valido: false, motivo: 'No se puede registrar un valor negativo.' }
      }
      if (debe > 0 && haber > 0) {
        return {
          valido: false,
          motivo: 'Cada linea va al debe o al haber, no a los dos. Revisa "' + plan.nombre(linea.cuenta) + '".',
        }
      }
      totalDebe += debe
      totalHaber += haber
    }
    if (totalDebe !== totalHaber) {
      return {
        valido: false,
        motivo: 'El comprobante no cuadra: el debe suma ' + totalDebe
          + ' y el haber ' + totalHaber + '. La diferencia es ' + Math.abs(totalDebe - totalHaber) + '.',
      }
    }
    return { valido: true, lineas: utiles, total: totalDebe }
  }

  return {
    fechaCausacion: fechaCausacion,
    libro: libro,
    asientosDerivados: asientosDerivados,
    asientosDeAjustes: asientosDeAjustes,
    saldosPorCuenta: saldosPorCuenta,
    movimientosDeUnidad: movimientosDeUnidad,
    ajusteDeCarteraDeUnidad: ajusteDeCarteraDeUnidad,
    estadoDeResultados: estadoDeResultados,
    situacionFinanciera: situacionFinanciera,
    auxiliarDeCuenta: auxiliarDeCuenta,
    validarComprobante: validarComprobante,
  }
})()
