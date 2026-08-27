/**
 * Repositorio: la unica puerta de acceso a los datos.
 *
 * Ninguna pantalla lee ni escribe `localStorage` directamente, ni recorre las
 * listas por su cuenta: todo pasa por aqui. El dia que exista un servidor de
 * verdad, se cambia el cuerpo de estas funciones y las pantallas no se tocan.
 *
 * Las operaciones que escriben devuelven lo que crearon o modificaron, y
 * lanzan un `Error` con un mensaje entendible cuando la operacion no es valida
 * segun las reglas del dominio.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.repo = (function () {
  'use strict'

  var d = Idiky.dominio
  var bd = null

  function cargar() {
    if (!bd) bd = Idiky.datos.leer()
    return bd
  }

  function guardar() {
    Idiky.datos.guardar(bd)
  }

  function reiniciar() {
    bd = Idiky.datos.sembrar()
    return bd
  }

  function nuevoId(prefijo) {
    return prefijo + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
  }

  // -------------------------------------------------------------------------
  // Consultas
  // -------------------------------------------------------------------------

  function unidades() {
    return cargar().unidades.slice().sort(function (a, b) {
      return a.etiqueta.localeCompare(b.etiqueta)
    })
  }

  function unidad(unidadId) {
    return cargar().unidades.filter(function (u) { return u.id === unidadId })[0]
  }

  function propietarioDe(unidadId) {
    return cargar().propietarios.filter(function (p) { return p.unidadId === unidadId })[0]
  }

  function nombrePropietario(unidadId) {
    var propietario = propietarioDe(unidadId)
    return propietario ? propietario.nombre : 'Sin registrar'
  }

  function etiquetaUnidad(unidadId) {
    var u = unidad(unidadId)
    return u ? u.etiqueta : unidadId
  }

  /** Cuotas de una unidad, de la mas reciente a la mas antigua. */
  function cuotasDeUnidad(unidadId) {
    return cargar().cuotas
      .filter(function (c) { return c.unidadId === unidadId })
      .sort(function (a, b) { return b.fechaVencimiento.localeCompare(a.fechaVencimiento) })
  }

  function todasLasCuotas() {
    return cargar().cuotas
  }

  function pagosDeUnidad(unidadId) {
    return cargar().pagos
      .filter(function (p) { return p.unidadId === unidadId })
      .sort(porFechaDescendente)
  }

  /** Abonos que los propietarios informaron y aun nadie concilio (RN-30). */
  function abonosReportados() {
    return cargar().pagos
      .filter(function (p) { return p.estado === 'reportado' })
      .sort(function (a, b) { return a.fecha.localeCompare(b.fecha) })
  }

  /** Libro de recibos de caja: incluye los anulados, porque el libro no se filtra. */
  function recibos() {
    return cargar().pagos
      .filter(function (p) { return p.estado !== 'reportado' })
      .sort(porFechaDescendente)
  }

  function pagoPorId(pagoId) {
    return cargar().pagos.filter(function (p) { return p.id === pagoId })[0]
  }

  /** Recibos aplicados que abonaron a una cuota concreta. */
  function pagosDeCuota(cuotaId) {
    return cargar().pagos.filter(function (p) {
      return p.estado === 'aplicado' && p.imputaciones.some(function (l) {
        return l.cuotaId === cuotaId
      })
    }).sort(porFechaDescendente)
  }

  function porFechaDescendente(a, b) {
    return b.fecha.localeCompare(a.fecha)
  }

  /** Resumen de cartera de todas las unidades: la tabla principal. */
  function estadoDeCartera() {
    return unidades().map(function (u) {
      var cuotas = cuotasDeUnidad(u.id)
      return {
        unidad: u,
        propietario: nombrePropietario(u.id),
        cuotas: cuotas,
        saldo: d.calcularSaldo(cuotas),
        vencido: d.calcularSaldoVencido(cuotas),
        mora: d.diasDeMora(cuotas),
        enMora: d.estaEnMora(cuotas),
      }
    })
  }

  // -------------------------------------------------------------------------
  // Operaciones sobre pagos y recibos de caja
  // -------------------------------------------------------------------------

  /** Aplica el reparto sobre las cuotas. Con `signo` -1 lo revierte (RN-29). */
  function moverSaldos(imputaciones, signo) {
    imputaciones.forEach(function (linea) {
      var cuota = bd.cuotas.filter(function (c) { return c.id === linea.cuotaId })[0]
      if (!cuota) return
      cuota.saldo = Math.min(cuota.valor, Math.max(0, cuota.saldo - linea.valor * signo))
      cuota.estado = d.estadoRealCuota(cuota)
    })
  }

  /** Toma el siguiente numero de recibo y avanza el consecutivo (RN-28). */
  function emitirRecibo() {
    var consecutivo = bd.consecutivos.recibo
    bd.consecutivos.recibo = consecutivo + 1
    return d.numeroRecibo(consecutivo)
  }

  function limpiarImputaciones(imputaciones) {
    return imputaciones.filter(function (linea) { return linea.valor > 0 })
  }

  /**
   * Registra un pago que ya se recibio y lo aplica de una vez, emitiendo el
   * recibo de caja. Es el camino del pago que llega por consignacion o en
   * efectivo y que nadie informo previamente.
   */
  function registrarPago(parametros) {
    cargar()
    var cuotas = bd.cuotas.filter(function (c) { return c.unidadId === parametros.unidadId })
    var imputaciones = parametros.imputaciones || d.imputarPago(cuotas, parametros.valor)

    var validacion = d.validarImputacion(parametros.valor, imputaciones, cuotas)
    if (!validacion.valido) throw new Error(validacion.motivo)

    var ahora = d.ahoraISO()
    var pago = {
      id: nuevoId('pag'),
      unidadId: parametros.unidadId,
      valor: parametros.valor,
      medio: parametros.medio,
      referencia: (parametros.referencia || '').trim() || 'SIN-REFERENCIA',
      fecha: ahora,
      estado: 'aplicado',
      origen: 'administracion',
      conceptoInformado: parametros.conceptoInformado || '',
      recibo: emitirRecibo(),
      imputaciones: limpiarImputaciones(imputaciones),
      saldoAFavor: d.saldoAFavorDelPago(parametros.valor, imputaciones),
      fechaAplicacion: ahora,
      registradoPor: bd.usuario,
    }

    moverSaldos(pago.imputaciones, 1)
    bd.pagos.unshift(pago)
    guardar()
    return pago
  }

  /**
   * Concilia un abono que el propietario informo: lo reparte entre cuotas y le
   * asigna el numero de recibo de caja. Aqui es donde el pago entra a la cartera.
   */
  function aplicarPago(parametros) {
    cargar()
    var pago = pagoPorId(parametros.pagoId)
    if (!pago) throw new Error('El pago no existe.')
    if (pago.estado !== 'reportado') {
      throw new Error('Solo se pueden aplicar los abonos que estan por conciliar.')
    }

    var cuotas = bd.cuotas.filter(function (c) { return c.unidadId === pago.unidadId })
    var imputaciones = parametros.imputaciones || d.imputarPago(cuotas, pago.valor)

    var validacion = d.validarImputacion(pago.valor, imputaciones, cuotas)
    if (!validacion.valido) throw new Error(validacion.motivo)

    pago.imputaciones = limpiarImputaciones(imputaciones)
    pago.saldoAFavor = d.saldoAFavorDelPago(pago.valor, imputaciones)
    pago.estado = 'aplicado'
    pago.recibo = emitirRecibo()
    pago.fechaAplicacion = d.ahoraISO()
    pago.aplicadoPor = bd.usuario

    moverSaldos(pago.imputaciones, 1)
    guardar()
    return pago
  }

  /**
   * Anula un recibo de caja (RN-29).
   *
   * No se borra el registro: se marca anulado con su motivo y el saldo vuelve
   * a las cuotas. El numero de recibo queda quemado, no se reutiliza — eso es
   * justamente lo que hace auditable el consecutivo.
   */
  function anularPago(parametros) {
    cargar()
    var pago = pagoPorId(parametros.pagoId)
    if (!pago) throw new Error('El pago no existe.')
    var motivo = (parametros.motivo || '').trim()
    if (!motivo) throw new Error('Escribe el motivo de la anulacion.')
    if (pago.estado === 'anulado') throw new Error('Ese recibo ya esta anulado.')

    if (pago.estado === 'aplicado') moverSaldos(pago.imputaciones, -1)

    pago.estado = 'anulado'
    pago.motivoAnulacion = motivo
    pago.fechaAnulacion = d.ahoraISO()
    pago.anuladoPor = bd.usuario
    guardar()
    return pago
  }

  // -------------------------------------------------------------------------
  // Facturacion
  // -------------------------------------------------------------------------

  /** Muestra lo que se generaria, sin escribir nada. */
  function previsualizarCuotas(parametros) {
    return unidades().map(function (u) {
      return {
        unidadId: u.id,
        etiqueta: u.etiqueta,
        valor:
          parametros.tipo === 'extraordinaria'
            ? d.prorratearPorCoeficiente(parametros.valor, u.coeficiente)
            : Math.round(u.coeficiente * parametros.valor),
      }
    })
  }

  function generarCuotas(parametros) {
    cargar()

    // RN-22: no se generan dos veces las cuotas ordinarias del mismo periodo.
    if (parametros.tipo === 'ordinaria') {
      var yaExiste = bd.cuotas.some(function (c) {
        return c.periodo === parametros.periodo && c.tipo === 'ordinaria'
      })
      if (yaExiste) {
        throw new Error('Las cuotas ordinarias de ' + parametros.periodo + ' ya fueron generadas.')
      }
    }

    var nuevas = previsualizarCuotas(parametros).map(function (linea) {
      return {
        id: nuevoId('cuo'),
        unidadId: linea.unidadId,
        periodo: parametros.periodo,
        tipo: parametros.tipo,
        concepto: parametros.concepto,
        valor: linea.valor,
        saldo: linea.valor,
        fechaVencimiento: d.vencimientoDelPeriodo(parametros.periodo),
        estado: 'pendiente',
      }
    })

    bd.cuotas = bd.cuotas.concat(nuevas)
    guardar()
    return nuevas
  }

  function copropiedad() {
    return cargar().copropiedad
  }

  function usuario() {
    return cargar().usuario
  }

  return {
    cargar: cargar,
    reiniciar: reiniciar,
    copropiedad: copropiedad,
    usuario: usuario,
    unidades: unidades,
    unidad: unidad,
    propietarioDe: propietarioDe,
    nombrePropietario: nombrePropietario,
    etiquetaUnidad: etiquetaUnidad,
    cuotasDeUnidad: cuotasDeUnidad,
    todasLasCuotas: todasLasCuotas,
    pagosDeUnidad: pagosDeUnidad,
    abonosReportados: abonosReportados,
    recibos: recibos,
    pagoPorId: pagoPorId,
    pagosDeCuota: pagosDeCuota,
    estadoDeCartera: estadoDeCartera,
    registrarPago: registrarPago,
    aplicarPago: aplicarPago,
    anularPago: anularPago,
    previsualizarCuotas: previsualizarCuotas,
    generarCuotas: generarCuotas,
  }
})()
