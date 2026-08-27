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

  var puc = Idiky.puc

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

  /**
   * Una cuenta es de cartera si cuelga del grupo 13 (deudores). Se mira el
   * codigo y no una lista fija, para que siga funcionando si el usuario abre
   * cuentas nuevas de cartera en el plan.
   */
  function esDeCartera(codigo) {
    return String(codigo).indexOf('13') === 0
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

  /**
   * Asientos que se derivan de los documentos, sin que nadie los escriba.
   *
   * Cada documento trae GUARDADA la cuenta que uso el dia en que se creo. No
   * se consulta el parametro actual: si manana se cambia a que cuenta va una
   * cuota de administracion, las cuotas viejas siguen donde estaban. Cambiar
   * un parametro no debe reescribir la contabilidad de ayer.
   */
  function asientosDerivados(datos) {
    var lineas = []

    // Se causa una cuota: sube cartera y sube el ingreso que corresponda.
    datos.cuotas.forEach(function (cuota) {
      var fecha = fechaCausacion(cuota)
      var extra = { unidadId: cuota.unidadId, documento: 'Causacion ' + cuota.periodo }
      lineas.push(asiento(fecha, cuota.cuentaCartera, cuota.valor, 0, cuota.concepto, extra))
      lineas.push(asiento(fecha, cuota.cuentaIngreso, 0, cuota.valor, cuota.concepto, extra))
    })

    datos.pagos.forEach(function (pago) {
      if (pago.estado === 'reportado') return
      var aFavor = pago.saldoAFavor || 0
      var extra = { unidadId: pago.unidadId, documento: pago.recibo || '' }
      var fecha = fechaDeAplicacion(pago)

      // Se aplica un pago: entra a caja, baja la cartera de cada cuota que
      // toco, y lo que sobre queda como anticipo — un pasivo, porque es plata
      // del propietario que todavia no es ingreso de la copropiedad.
      lineas.push(asiento(fecha, pago.cuentaCaja, pago.valor, 0, 'Recaudo', extra))
      ;(pago.imputaciones || []).forEach(function (linea) {
        lineas.push(asiento(fecha, linea.cuenta, 0, linea.valor, 'Abono a cartera', extra))
      })
      if (aFavor > 0) {
        lineas.push(asiento(fecha, pago.cuentaAnticipos, 0, aFavor, 'Saldo a favor', extra))
      }

      // La anulacion es un hecho aparte, con su propia fecha: revierte el
      // asiento sin borrarlo.
      if (pago.estado === 'anulado' && pago.fechaAnulacion) {
        var anula = pago.fechaAnulacion.slice(0, 10)
        lineas.push(asiento(anula, pago.cuentaCaja, 0, pago.valor, 'Anulacion de recibo', extra))
        ;(pago.imputaciones || []).forEach(function (linea) {
          lineas.push(asiento(anula, linea.cuenta, linea.valor, 0, 'Anulacion de recibo', extra))
        })
        if (aFavor > 0) {
          lineas.push(asiento(anula, pago.cuentaAnticipos, aFavor, 0, 'Anulacion de recibo', extra))
        }
      }
    })

    datos.gastos.forEach(function (gasto) {
      var extra = { documento: gasto.proveedor || '' }

      // Se causa el gasto: sube el egreso y sube la cuenta por pagar.
      lineas.push(asiento(gasto.fecha, gasto.cuenta, gasto.valor, 0, gasto.concepto, extra))
      lineas.push(asiento(gasto.fecha, gasto.cuentaPorPagar, 0, gasto.valor, gasto.concepto, extra))

      // Se paga: baja la cuenta por pagar y sale de caja.
      if (gasto.estado === 'pagado' && gasto.fechaPago) {
        var quien = 'Pago a ' + (gasto.proveedor || 'proveedor')
        lineas.push(asiento(gasto.fechaPago, gasto.cuentaPorPagar, gasto.valor, 0, quien, extra))
        lineas.push(asiento(gasto.fechaPago, gasto.cuentaCaja, 0, gasto.valor, quien, extra))
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
   * Saldo de cada cuenta que recibe movimiento, en la convencion `debe - haber`.
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

  /** La cuenta de cuatro digitos bajo la que se agrupa un saldo. */
  function cuentaDePresentacion(codigo) {
    return String(codigo).length === 6 ? String(codigo).slice(0, 4) : String(codigo)
  }

  /**
   * Convierte los saldos de una clase en lineas presentables, ya con su signo.
   *
   * Se presenta en dos niveles: la cuenta de cuatro digitos con su total, y
   * debajo sus auxiliares. En una copropiedad ese detalle es justamente lo que
   * quiere ver la asamblea — "Servicios" no dice nada, "Vigilancia 7.600.000"
   * si. Cada linea de cuenta trae `hijos`; los totales se suman solo sobre las
   * cuentas, nunca sobre los auxiliares, para no contar dos veces.
   */
  function lineasDeClase(plan, saldos, clase) {
    var invertir = puc.seInvierte(clase)
    var cuentas = {}

    Object.keys(saldos).forEach(function (codigo) {
      if (puc.claseDe(codigo) !== clase) return
      var valor = invertir ? -saldos[codigo] : saldos[codigo]
      if (valor === 0) return

      var padre = cuentaDePresentacion(codigo)
      if (!cuentas[padre]) {
        cuentas[padre] = {
          codigo: padre,
          concepto: nombreDeCuenta(plan, padre),
          valor: 0,
          hijos: [],
        }
      }
      cuentas[padre].valor += valor
      if (padre !== String(codigo)) {
        cuentas[padre].hijos.push({
          codigo: String(codigo),
          concepto: nombreDeCuenta(plan, codigo),
          valor: valor,
        })
      }
    })

    return Object.keys(cuentas)
      .sort()
      .map(function (codigo) {
        var cuenta = cuentas[codigo]
        cuenta.hijos.sort(function (a, b) { return a.codigo.localeCompare(b.codigo) })
        return cuenta
      })
      .filter(function (cuenta) { return cuenta.valor !== 0 || cuenta.hijos.length > 0 })
  }

  function nombreDeCuenta(plan, codigo) {
    var encontrada = (plan || []).filter(function (c) { return c.codigo === codigo })[0]
    return encontrada ? encontrada.nombre : codigo
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
        return esDeCartera(l.cuenta) && l.unidadId === unidadId
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
      if (!esDeCartera(linea.cuenta) || linea.unidadId !== unidadId) return total
      if (!enRango(linea.fecha, null, hasta)) return total
      return total + linea.debe - linea.haber
    }, 0)
  }

  // ---------------------------------------------------------------------------
  // Estado de resultados
  // ---------------------------------------------------------------------------

  function estadoDeResultados(datos, desde, hasta) {
    var saldos = saldosPorCuenta(libro(datos), desde, hasta)
    var ingresos = lineasDeClase(datos.plan, saldos, 'ingreso')
    var egresos = lineasDeClase(datos.plan, saldos, 'gasto')
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

    var activo = lineasDeClase(datos.plan, saldos, 'activo')
    var pasivo = lineasDeClase(datos.plan, saldos, 'pasivo')
    var patrimonio = lineasDeClase(datos.plan, saldos, 'patrimonio')

    var totalIngresos = sumar(lineasDeClase(datos.plan, saldos, 'ingreso'))
    var totalEgresos = sumar(lineasDeClase(datos.plan, saldos, 'gasto'))
    var resultadoAcumulado = totalIngresos - totalEgresos

    // El resultado del ejercicio se presenta dentro del patrimonio.
    var lineasPatrimonio = patrimonio.concat(
      resultadoAcumulado !== 0
        ? [{ codigo: '3605', concepto: 'Excedente del ejercicio', valor: resultadoAcumulado, hijos: [] }]
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

  /**
   * Balance de prueba: todas las cuentas con movimiento en el rango, con sus
   * totales de debe y haber. Es la vista que usa un contador para revisar.
   */
  function balanceDePrueba(datos, desde, hasta) {
    var acumulado = {}
    libro(datos).forEach(function (linea) {
      if (!enRango(linea.fecha, desde, hasta)) return
      if (!acumulado[linea.cuenta]) acumulado[linea.cuenta] = { debe: 0, haber: 0 }
      acumulado[linea.cuenta].debe += linea.debe
      acumulado[linea.cuenta].haber += linea.haber
    })

    var lineas = Object.keys(acumulado).sort().map(function (codigo) {
      return {
        codigo: codigo,
        nombre: nombreDeCuenta(datos.plan, codigo),
        clase: puc.claseDe(codigo),
        debe: acumulado[codigo].debe,
        haber: acumulado[codigo].haber,
        saldo: acumulado[codigo].debe - acumulado[codigo].haber,
      }
    })

    return {
      lineas: lineas,
      totalDebe: lineas.reduce(function (t, l) { return t + l.debe }, 0),
      totalHaber: lineas.reduce(function (t, l) { return t + l.haber }, 0),
    }
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
          motivo: 'Cada linea va al debe o al haber, no a las dos. Revisa la cuenta ' + linea.cuenta + '.',
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
    balanceDePrueba: balanceDePrueba,
    esDeCartera: esDeCartera,
    validarComprobante: validarComprobante,
  }
})()
