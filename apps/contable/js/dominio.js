/**
 * Reglas de negocio de cartera y pagos.
 *
 * IMPORTANTE: funciones puras. No tocan la pantalla ni los datos guardados.
 * Cada regla lleva su numero `RN-xx`, el mismo que en `docs/05-modelo-de-datos.md`.
 *
 * Este archivo es el CONTRATO con la aplicacion de Mary: las dos aplicaciones
 * calculan lo mismo porque aplican estas mismas reglas. Si aqui cambia una
 * regla, hay que cambiarla alla — y al reves. No las reescribas en otro lado.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.dominio = (function () {
  'use strict'

  /** Dia del mes en que vencen las cuotas por defecto (RN-23). */
  var DIA_VENCIMIENTO_CUOTA = 10

  // -------------------------------------------------------------------------
  // Fechas — se trabaja con cadenas ISO para evitar desfases de zona horaria
  // -------------------------------------------------------------------------

  function hoyISO() {
    var ahora = new Date()
    var mes = String(ahora.getMonth() + 1).padStart(2, '0')
    var dia = String(ahora.getDate()).padStart(2, '0')
    return ahora.getFullYear() + '-' + mes + '-' + dia
  }

  function ahoraISO() {
    return new Date().toISOString()
  }

  function periodoActual() {
    return hoyISO().slice(0, 7)
  }

  function sumarDias(fecha, dias) {
    var base = new Date(fecha + 'T12:00:00')
    base.setDate(base.getDate() + dias)
    var mes = String(base.getMonth() + 1).padStart(2, '0')
    var dia = String(base.getDate()).padStart(2, '0')
    return base.getFullYear() + '-' + mes + '-' + dia
  }

  /** Diferencia en dias entre dos fechas ISO (positiva si `hasta` es posterior). */
  function diasEntre(desde, hasta) {
    var a = new Date(desde.slice(0, 10) + 'T12:00:00').getTime()
    var b = new Date(hasta.slice(0, 10) + 'T12:00:00').getTime()
    return Math.round((b - a) / 86400000)
  }

  /** RN-23 — Fecha de vencimiento por defecto de un periodo. */
  function vencimientoDelPeriodo(periodo) {
    return periodo + '-' + String(DIA_VENCIMIENTO_CUOTA).padStart(2, '0')
  }

  /** Desplaza un periodo `AAAA-MM` en meses. */
  function periodoRelativo(meses) {
    var hoy = new Date(hoyISO() + 'T12:00:00')
    hoy.setDate(1)
    hoy.setMonth(hoy.getMonth() + meses)
    return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0')
  }

  // -------------------------------------------------------------------------
  // Estado de las cuotas
  // -------------------------------------------------------------------------

  /**
   * RN-04 — Una cuota esta `vencida` si su vencimiento ya paso y aun tiene saldo.
   * RN-26 — Si recibio abonos parciales pero todavia debe algo, esta `abonada`.
   *
   * Ojo con el orden: una cuota vencida CON abonos se sigue reportando vencida.
   * Para la mora lo que cuenta es que todavia debe, no que abono algo.
   */
  function estadoRealCuota(cuota, hoy) {
    hoy = hoy || hoyISO()
    if (cuota.saldo <= 0) return 'pagada'
    if (cuota.fechaVencimiento < hoy) return 'vencida'
    return cuota.saldo < cuota.valor ? 'abonada' : 'pendiente'
  }

  function cuotaPendiente(cuota) {
    return cuota.saldo > 0
  }

  /** Cuanto se ha abonado a una cuota. */
  function abonadoDeCuota(cuota) {
    return cuota.valor - cuota.saldo
  }

  // -------------------------------------------------------------------------
  // Cartera
  // -------------------------------------------------------------------------

  /** RN-03 — Saldo de una unidad: lo que queda por pagar de todas sus cuotas. */
  function calcularSaldo(cuotas) {
    return cuotas.reduce(function (total, cuota) {
      return total + cuota.saldo
    }, 0)
  }

  /** Saldo de las cuotas ya vencidas (subconjunto del saldo total). */
  function calcularSaldoVencido(cuotas, hoy) {
    return cuotas.reduce(function (total, cuota) {
      return estadoRealCuota(cuota, hoy) === 'vencida' ? total + cuota.saldo : total
    }, 0)
  }

  /** RN-21 — Dias de mora contados desde la cuota vencida mas antigua. */
  function diasDeMora(cuotas, hoy) {
    hoy = hoy || hoyISO()
    var vencidas = cuotas
      .filter(function (c) { return estadoRealCuota(c, hoy) === 'vencida' })
      .map(function (c) { return c.fechaVencimiento })
      .sort()
    return vencidas.length === 0 ? 0 : diasEntre(vencidas[0], hoy)
  }

  function estaEnMora(cuotas, hoy) {
    return cuotas.some(function (c) { return estadoRealCuota(c, hoy) === 'vencida' })
  }

  /** RN-05 — Prorrateo de una cuota extraordinaria por coeficiente. */
  function prorratearPorCoeficiente(valorTotal, coeficiente) {
    return Math.round((valorTotal * coeficiente) / 100)
  }

  /**
   * RN-18 — Porcentaje de recaudo sobre lo facturado en un periodo.
   * Cuenta lo efectivamente abonado: un abono parcial tambien es recaudo.
   */
  function porcentajeRecaudo(cuotas, periodo) {
    var delPeriodo = cuotas.filter(function (c) { return c.periodo === periodo })
    var facturado = delPeriodo.reduce(function (t, c) { return t + c.valor }, 0)
    if (facturado === 0) return 0
    var recaudado = delPeriodo.reduce(function (t, c) { return t + abonadoDeCuota(c) }, 0)
    return Math.round((recaudado / facturado) * 100)
  }

  // -------------------------------------------------------------------------
  // Imputacion de pagos
  // -------------------------------------------------------------------------

  /** Cuotas con saldo, de la mas antigua a la mas reciente: el orden de imputacion. */
  function cuotasPorAntiguedad(cuotas) {
    return cuotas
      .filter(cuotaPendiente)
      .slice()
      .sort(function (a, b) { return a.fechaVencimiento.localeCompare(b.fechaVencimiento) })
  }

  /**
   * RN-06 — Un pago se imputa primero a la deuda mas antigua.
   * RN-27 — El abono puede cubrir una cuota solo en parte: se reparte hasta
   * agotar el valor recibido. Lo que sobra no se imputa y queda a favor.
   *
   * Devuelve una lista de `{ cuotaId, valor }`.
   */
  function imputarPago(cuotas, valor) {
    var imputaciones = []
    var restante = valor
    cuotasPorAntiguedad(cuotas).forEach(function (cuota) {
      if (restante <= 0) return
      var aplicado = Math.min(restante, cuota.saldo)
      imputaciones.push({ cuotaId: cuota.id, valor: aplicado })
      restante -= aplicado
    })
    return imputaciones
  }

  function totalImputado(imputaciones) {
    return imputaciones.reduce(function (total, linea) { return total + linea.valor }, 0)
  }

  /** RN-27 — Parte del pago que no quedo aplicada a ninguna cuota. */
  function saldoAFavorDelPago(valor, imputaciones) {
    return Math.max(0, valor - totalImputado(imputaciones))
  }

  /**
   * Valida el reparto antes de aplicarlo: nada negativo, nada por encima del
   * saldo de la cuota, y nada por encima de lo que realmente se recibio.
   * Devuelve `{ valido: true }` o `{ valido: false, motivo: '...' }`.
   */
  function validarImputacion(valor, imputaciones, cuotas) {
    if (!(valor > 0)) {
      return { valido: false, motivo: 'El valor del pago debe ser mayor que cero.' }
    }
    for (var i = 0; i < imputaciones.length; i += 1) {
      var linea = imputaciones[i]
      if (linea.valor < 0) {
        return { valido: false, motivo: 'No se puede imputar un valor negativo a una cuota.' }
      }
      var cuota = cuotas.filter(function (c) { return c.id === linea.cuotaId })[0]
      if (!cuota) {
        return { valido: false, motivo: 'Se intento imputar a una cuota que no existe.' }
      }
      if (linea.valor > cuota.saldo) {
        return {
          valido: false,
          motivo: 'No se puede abonar mas de lo que debe la cuota "' + cuota.concepto + '".',
        }
      }
    }
    if (totalImputado(imputaciones) > valor) {
      return { valido: false, motivo: 'Estas repartiendo mas de lo que se recibio.' }
    }
    return { valido: true }
  }

  // -------------------------------------------------------------------------
  // Recibos de caja
  // -------------------------------------------------------------------------

  /** RN-28 — Numero de recibo de caja: consecutivo, sin reuso. */
  function numeroRecibo(consecutivo) {
    return 'RC-' + String(consecutivo).padStart(5, '0')
  }

  /** RN-29 — Solo se anula un recibo que este aplicado. */
  function sePuedeAnular(pago) {
    return pago.estado === 'aplicado'
  }

  /** RN-30 — Un abono informado por el propietario espera a que se aplique. */
  function esperaAplicacion(pago) {
    return pago.estado === 'reportado'
  }

  return {
    DIA_VENCIMIENTO_CUOTA: DIA_VENCIMIENTO_CUOTA,
    hoyISO: hoyISO,
    ahoraISO: ahoraISO,
    periodoActual: periodoActual,
    periodoRelativo: periodoRelativo,
    sumarDias: sumarDias,
    diasEntre: diasEntre,
    vencimientoDelPeriodo: vencimientoDelPeriodo,
    estadoRealCuota: estadoRealCuota,
    cuotaPendiente: cuotaPendiente,
    abonadoDeCuota: abonadoDeCuota,
    calcularSaldo: calcularSaldo,
    calcularSaldoVencido: calcularSaldoVencido,
    diasDeMora: diasDeMora,
    estaEnMora: estaEnMora,
    prorratearPorCoeficiente: prorratearPorCoeficiente,
    porcentajeRecaudo: porcentajeRecaudo,
    cuotasPorAntiguedad: cuotasPorAntiguedad,
    imputarPago: imputarPago,
    totalImputado: totalImputado,
    saldoAFavorDelPago: saldoAFavorDelPago,
    validarImputacion: validarImputacion,
    numeroRecibo: numeroRecibo,
    sePuedeAnular: sePuedeAnular,
    esperaAplicacion: esperaAplicacion,
  }
})()
