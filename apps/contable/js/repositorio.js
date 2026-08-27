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
    var contables = datosContables()
    return unidades().map(function (u) {
      var cuotas = cuotasDeUnidad(u.id)
      // Los ajustes que tocan la cartera de esta unidad (intereses de mora,
      // por ejemplo) no son cuotas, pero el propietario los debe igual.
      var ajuste = Idiky.contabilidad.ajusteDeCarteraDeUnidad(contables, u.id, null)
      return {
        unidad: u,
        propietario: nombrePropietario(u.id),
        cuotas: cuotas,
        ajuste: ajuste,
        saldo: d.calcularSaldo(cuotas) + ajuste,
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

  /**
   * Deja solo las lineas con valor y le pone a cada una la cuenta de cartera
   * de su cuota. Asi el recibo guarda contra que cuenta del PUC se abono, y
   * no hay que volver a deducirlo cuando se arme un reporte.
   */
  function limpiarImputaciones(imputaciones) {
    return imputaciones
      .filter(function (linea) { return linea.valor > 0 })
      .map(function (linea) {
        var cuota = bd.cuotas.filter(function (c) { return c.id === linea.cuotaId })[0]
        return {
          cuotaId: linea.cuotaId,
          valor: linea.valor,
          cuenta: (cuota && cuota.cuentaCartera) || bd.parametros.cartera.ordinaria,
        }
      })
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
      cuentaCaja: bd.parametros.caja,
      cuentaAnticipos: bd.parametros.anticipos,
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
    pago.cuentaCaja = bd.parametros.caja
    pago.cuentaAnticipos = bd.parametros.anticipos
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
  // Gastos
  // -------------------------------------------------------------------------

  var CATEGORIAS_GASTO = [
    'Vigilancia',
    'Aseo',
    'Servicios publicos',
    'Mantenimiento',
    'Administracion',
    'Seguros',
    'Reparaciones',
    'Otros',
  ]

  function gastos() {
    return cargar().gastos.slice().sort(function (a, b) {
      return b.fecha.localeCompare(a.fecha)
    })
  }

  function gastoPorId(gastoId) {
    return cargar().gastos.filter(function (g) { return g.id === gastoId })[0]
  }

  function registrarGasto(parametros) {
    cargar()
    if (!(parametros.valor > 0)) throw new Error('El valor del gasto debe ser mayor que cero.')
    if (!(parametros.concepto || '').trim()) throw new Error('Escribe el concepto del gasto.')
    if (!parametros.fecha) throw new Error('Indica la fecha de causacion del gasto.')

    var consecutivo = bd.consecutivos.gasto
    bd.consecutivos.gasto = consecutivo + 1

    var gasto = {
      id: 'gas-' + consecutivo,
      fecha: parametros.fecha,
      concepto: parametros.concepto.trim(),
      categoria: parametros.categoria || 'Otros',
      valor: parametros.valor,
      proveedor: (parametros.proveedor || '').trim(),
      // Se causa siempre: si ya se pago, se marca pagado en el mismo acto.
      estado: parametros.pagado ? 'pagado' : 'por_pagar',
      fechaPago: parametros.pagado ? (parametros.fechaPago || parametros.fecha) : undefined,
      medio: parametros.pagado ? (parametros.medio || 'transferencia') : undefined,
      cuenta: parametros.cuenta || bd.parametros.gasto[parametros.categoria] || '5195',
      cuentaPorPagar: bd.parametros.porPagar,
      cuentaCaja: bd.parametros.caja,
      registradoPor: bd.usuario,
    }

    bd.gastos.unshift(gasto)
    guardar()
    return gasto
  }

  function pagarGasto(parametros) {
    cargar()
    var gasto = gastoPorId(parametros.gastoId)
    if (!gasto) throw new Error('El gasto no existe.')
    if (gasto.estado === 'anulado') throw new Error('Ese gasto esta anulado.')
    if (gasto.estado === 'pagado') throw new Error('Ese gasto ya esta pagado.')

    gasto.estado = 'pagado'
    gasto.fechaPago = parametros.fechaPago || d.hoyISO()
    gasto.medio = parametros.medio || 'transferencia'
    guardar()
    return gasto
  }

  /** Como con los recibos: un gasto no se borra, se anula con su motivo. */
  function anularGasto(parametros) {
    cargar()
    var gasto = gastoPorId(parametros.gastoId)
    if (!gasto) throw new Error('El gasto no existe.')
    var motivo = (parametros.motivo || '').trim()
    if (!motivo) throw new Error('Escribe el motivo de la anulacion.')
    if (gasto.estado === 'anulado') throw new Error('Ese gasto ya esta anulado.')

    gasto.estado = 'anulado'
    gasto.motivoAnulacion = motivo
    gasto.fechaAnulacion = d.ahoraISO()
    guardar()
    return gasto
  }

  /**
   * Datos que consumen los reportes. Los gastos anulados no entran: dejaron de
   * ser un hecho economico, aunque el registro se conserve.
   */
  function datosContables() {
    var base = cargar()
    return {
      cuotas: base.cuotas,
      pagos: base.pagos,
      gastos: base.gastos.filter(function (g) { return g.estado !== 'anulado' }),
      comprobantes: base.comprobantes,
      plan: base.plan,
    }
  }

  /** Extracto de movimientos de una unidad entre dos fechas. */
  function movimientosDeUnidad(unidadId, desde, hasta) {
    return Idiky.contabilidad.movimientosDeUnidad(datosContables(), unidadId, desde, hasta)
  }

  /** Libro auxiliar de una cuenta del plan. */
  function auxiliarDeCuenta(codigo, desde, hasta) {
    return Idiky.contabilidad.auxiliarDeCuenta(datosContables(), codigo, desde, hasta)
  }

  // -------------------------------------------------------------------------
  // Comprobantes de ajuste
  // -------------------------------------------------------------------------

  function comprobantes() {
    return cargar().comprobantes.slice().sort(function (a, b) {
      return b.fecha.localeCompare(a.fecha) || b.numero.localeCompare(a.numero)
    })
  }

  function comprobantePorId(id) {
    return cargar().comprobantes.filter(function (c) { return c.id === id })[0]
  }

  /**
   * Registra un comprobante de ajuste.
   *
   * No mueve plata: mueve cuentas. Por eso lo unico que se valida es que
   * cuadre — si el debe no es igual al haber, la contabilidad se rompe, y es
   * mejor rechazarlo que dejar un descuadre para que alguien lo descubra
   * despues en el balance.
   */
  function registrarComprobante(parametros) {
    cargar()
    if (!parametros.fecha) throw new Error('Indica la fecha del comprobante.')
    if (!(parametros.concepto || '').trim()) throw new Error('Escribe el concepto del comprobante.')

    var validacion = Idiky.contabilidad.validarComprobante(parametros.lineas)
    if (!validacion.valido) throw new Error(validacion.motivo)

    var consecutivo = bd.consecutivos.comprobante
    bd.consecutivos.comprobante = consecutivo + 1

    var comprobante = {
      id: nuevoId('cmp'),
      numero: 'CA-' + String(consecutivo).padStart(5, '0'),
      fecha: parametros.fecha,
      concepto: parametros.concepto.trim(),
      detalle: (parametros.detalle || '').trim(),
      estado: 'registrado',
      registradoPor: bd.usuario,
      lineas: validacion.lineas.map(function (linea) {
        return {
          cuenta: linea.cuenta,
          unidadId: linea.unidadId || null,
          debe: linea.debe || 0,
          haber: linea.haber || 0,
          descripcion: (linea.descripcion || '').trim() || parametros.concepto.trim(),
        }
      }),
    }

    bd.comprobantes.unshift(comprobante)
    guardar()
    return comprobante
  }

  /**
   * Anula un comprobante. Como con los recibos, no se borra: se marca anulado
   * y deja de contar en los estados. El numero queda quemado.
   */
  function anularComprobante(parametros) {
    cargar()
    var comprobante = comprobantePorId(parametros.comprobanteId)
    if (!comprobante) throw new Error('El comprobante no existe.')
    var motivo = (parametros.motivo || '').trim()
    if (!motivo) throw new Error('Escribe el motivo de la anulacion.')
    if (comprobante.estado === 'anulado') throw new Error('Ese comprobante ya esta anulado.')

    comprobante.estado = 'anulado'
    comprobante.motivoAnulacion = motivo
    comprobante.fechaAnulacion = d.ahoraISO()
    guardar()
    return comprobante
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
        // La cuenta queda guardada en la cuota: si manana se cambia el
        // parametro, estas cuotas siguen donde estan.
        cuentaCartera: bd.parametros.cartera[parametros.tipo] || bd.parametros.cartera.ordinaria,
        cuentaIngreso: bd.parametros.ingreso[parametros.tipo] || bd.parametros.ingreso.ordinaria,
      }
    })

    bd.cuotas = bd.cuotas.concat(nuevas)
    guardar()
    return nuevas
  }

  // -------------------------------------------------------------------------
  // Plan de cuentas y parametros
  // -------------------------------------------------------------------------

  function plan() {
    return cargar().plan.slice().sort(function (a, b) {
      return a.codigo.localeCompare(b.codigo)
    })
  }

  /** Solo las cuentas que reciben asientos y estan activas. */
  function cuentasDeMovimiento() {
    return plan().filter(function (c) { return c.movimiento && c.activa })
  }

  function cuentaPorCodigo(codigo) {
    return cargar().plan.filter(function (c) { return c.codigo === codigo })[0]
  }

  function nombreDeCuenta(codigo) {
    var c = cuentaPorCodigo(codigo)
    return c ? c.nombre : codigo
  }

  function etiquetaDeCuenta(codigo) {
    return codigo + ' — ' + nombreDeCuenta(codigo)
  }

  function parametros() {
    return cargar().parametros
  }

  /** Cuentas que algun parametro esta usando: no se pueden desactivar. */
  function cuentasEnUso() {
    var p = parametros()
    var usadas = [p.caja, p.anticipos, p.porPagar, p.excedentes]
    Object.keys(p.cartera).forEach(function (k) { usadas.push(p.cartera[k]) })
    Object.keys(p.ingreso).forEach(function (k) { usadas.push(p.ingreso[k]) })
    Object.keys(p.gasto).forEach(function (k) { usadas.push(p.gasto[k]) })
    return usadas
  }

  function guardarCuenta(parametrosCuenta) {
    cargar()
    var codigo = String(parametrosCuenta.codigo || '').trim()
    var nombre = String(parametrosCuenta.nombre || '').trim()

    if (!Idiky.puc.esValido(codigo)) {
      throw new Error('El codigo debe ser numerico y de 1, 2, 4, 6 u 8 digitos.')
    }
    if (!nombre) throw new Error('Escribe el nombre de la cuenta.')

    // Una cuenta suelta no sirve: si no cuelga de nada, no suma en ningun
    // total del estado financiero.
    var codigoPadre = Idiky.puc.padreDe(codigo)
    var padre = codigoPadre ? cuentaPorCodigo(codigoPadre) : null
    if (codigoPadre && !padre) {
      throw new Error('Falta la cuenta padre ' + codigoPadre + '. Creala primero.')
    }

    var existente = cuentaPorCodigo(codigo)
    if (existente) {
      existente.nombre = nombre
      if (parametrosCuenta.movimiento != null) existente.movimiento = !!parametrosCuenta.movimiento
      if (parametrosCuenta.activa != null) existente.activa = !!parametrosCuenta.activa
      guardar()
      return existente
    }

    // Abrirle una subcuenta a una cuenta transaccional la convierte en titulo:
    // el movimiento pasa al nivel de abajo. Si un parametro la esta usando hay
    // que arreglarlo antes, o los documentos nuevos irian a un titulo.
    if (padre && padre.movimiento) {
      if (cuentasEnUso().indexOf(padre.codigo) !== -1) {
        throw new Error(
          'La cuenta ' + padre.codigo + ' es transaccional y un parametro la esta usando. '
          + 'Cambia ese parametro antes de abrirle una subcuenta.',
        )
      }
      padre.movimiento = false
    }

    var cuenta = {
      codigo: codigo,
      nombre: nombre,
      movimiento: parametrosCuenta.movimiento != null ? !!parametrosCuenta.movimiento : true,
      activa: true,
    }
    bd.plan.push(cuenta)
    guardar()
    return cuenta
  }

  /** Cuentas hijas directas de un codigo. */
  function hijasDe(codigo) {
    return cargar().plan.filter(function (c) {
      return Idiky.puc.padreDe(c.codigo) === codigo
    })
  }

  /** Cuentas de un nivel, para armar los selectores en cascada. */
  function cuentasDeNivel(idNivel, prefijo) {
    return plan().filter(function (c) {
      if (Idiky.puc.nivelDe(c.codigo) !== idNivel) return false
      if (prefijo && c.codigo.indexOf(prefijo) !== 0) return false
      return c.activa
    })
  }

  /**
   * Las cuentas no se borran: se desactivan. Una cuenta que ya tiene asientos
   * no puede desaparecer sin romper la contabilidad de meses anteriores.
   */
  function desactivarCuenta(codigo) {
    cargar()
    var cuenta = cuentaPorCodigo(codigo)
    if (!cuenta) throw new Error('La cuenta no existe.')
    if (cuentasEnUso().indexOf(codigo) !== -1) {
      throw new Error('Esa cuenta la esta usando un parametro del modulo. Cambia el parametro primero.')
    }
    cuenta.activa = false
    guardar()
    return cuenta
  }

  function activarCuenta(codigo) {
    cargar()
    var cuenta = cuentaPorCodigo(codigo)
    if (!cuenta) throw new Error('La cuenta no existe.')
    cuenta.activa = true
    guardar()
    return cuenta
  }

  /**
   * Cambia a que cuenta va un tipo de documento.
   * No toca los documentos ya registrados: cada uno guarda la suya.
   */
  function fijarParametro(ruta, codigo) {
    cargar()
    var cuenta = cuentaPorCodigo(codigo)
    if (!cuenta) throw new Error('Esa cuenta no existe en el plan.')
    if (!cuenta.movimiento) throw new Error('Esa cuenta es un titulo: no recibe movimientos.')
    if (!cuenta.activa) throw new Error('Esa cuenta esta inactiva.')

    var partes = ruta.split('.')
    if (partes.length === 1) {
      bd.parametros[partes[0]] = codigo
    } else {
      bd.parametros[partes[0]][partes[1]] = codigo
    }
    guardar()
    return bd.parametros
  }

  function balanceDePrueba(desde, hasta) {
    return Idiky.contabilidad.balanceDePrueba(datosContables(), desde, hasta)
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
    CATEGORIAS_GASTO: CATEGORIAS_GASTO,
    gastos: gastos,
    gastoPorId: gastoPorId,
    registrarGasto: registrarGasto,
    pagarGasto: pagarGasto,
    anularGasto: anularGasto,
    datosContables: datosContables,
    movimientosDeUnidad: movimientosDeUnidad,
    auxiliarDeCuenta: auxiliarDeCuenta,
    plan: plan,
    cuentasDeMovimiento: cuentasDeMovimiento,
    cuentaPorCodigo: cuentaPorCodigo,
    nombreDeCuenta: nombreDeCuenta,
    etiquetaDeCuenta: etiquetaDeCuenta,
    parametros: parametros,
    cuentasEnUso: cuentasEnUso,
    guardarCuenta: guardarCuenta,
    hijasDe: hijasDe,
    cuentasDeNivel: cuentasDeNivel,
    desactivarCuenta: desactivarCuenta,
    activarCuenta: activarCuenta,
    fijarParametro: fijarParametro,
    balanceDePrueba: balanceDePrueba,
    comprobantes: comprobantes,
    comprobantePorId: comprobantePorId,
    registrarComprobante: registrarComprobante,
    anularComprobante: anularComprobante,
  }
})()
