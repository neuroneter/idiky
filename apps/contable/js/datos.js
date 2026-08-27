/**
 * Datos del demo: semilla y persistencia en el navegador.
 *
 * No hay servidor. Todo vive en `localStorage`, asi que lo que hagas se
 * conserva al recargar la pagina, y el boton "Reiniciar demo" lo devuelve
 * todo al estado inicial.
 *
 * Nota de modelo: aqui el "cliente" es la UNIDAD, y cada unidad tiene un
 * propietario responsable. En propiedad horizontal la deuda sigue al inmueble,
 * no a la persona: si el apartamento se vende, la deuda se va con el
 * apartamento. Por eso la cuota cuelga de `unidadId` y no de la persona.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.datos = (function () {
  'use strict'

  var d = Idiky.dominio
  var CLAVE = 'idiky.contable.bd'
  var VERSION_ESQUEMA = 1

  /** Valor de la cuota ordinaria por punto de coeficiente. */
  var VALOR_POR_COEFICIENTE = 45000
  /** Valor total de la cuota extraordinaria vigente, prorrateada por coeficiente. */
  var EXTRAORDINARIA_TOTAL = 40000000

  // Mismo conjunto que la aplicacion de Mary, a proposito: las dos hablan del
  // mismo mundo, que es lo que hace posible cruzar informacion despues.
  var DEFINICION_UNIDADES = [
    ['Torre 1', '201', 78, 9.1, 'Luisa Fernanda', 'Marin Castro', 1],
    ['Torre 1', '202', 78, 9.1, 'Jorge Enrique', 'Valencia Ruiz', 0],
    ['Torre 1', '301', 74, 8.6, 'Sandra Milena', 'Ortiz Pena', 0],
    ['Torre 1', '302', 74, 8.6, 'Carlos Alberto', 'Duque Mesa', 2],
    ['Torre 1', '401', 70, 8.2, 'Paula Andrea', 'Rojas Vega', 0],
    ['Torre 1', '402', 70, 8.2, 'Maria Camila', 'Restrepo Ossa', 0],
    ['Torre 2', '501', 72, 8.4, 'Ricardo', 'Salazar Nino', 0],
    ['Torre 2', '502', 72, 8.4, 'Diana Patricia', 'Cardenas Leal', 0],
    ['Torre 2', '601', 68, 8.0, 'Mauricio', 'Bermudez Silva', 0],
    ['Torre 2', '602', 68, 8.0, 'Angela Maria', 'Trujillo Pardo', 1],
    ['Torre 2', '901', 66, 7.7, 'Andres Felipe', 'Gomez Lara', 3],
    ['Torre 2', '902', 66, 7.7, 'Hernan Dario', 'Quintero Arias', 0],
  ]

  function idUnidad(torre, numero) {
    return 'uni-' + torre.toLowerCase().replace(/\s+/g, '') + '-' + numero
  }

  function crearSemilla() {
    var unidades = []
    var propietarios = []
    var cuotas = []
    var pagos = []
    var consecutivo = 1

    DEFINICION_UNIDADES.forEach(function (fila, i) {
      var torre = fila[0]
      var numero = fila[1]
      var id = idUnidad(torre, numero)
      unidades.push({
        id: id,
        torre: torre,
        numero: numero,
        etiqueta: torre + ' · ' + numero,
        area: fila[2],
        coeficiente: fila[3],
      })
      propietarios.push({
        id: 'pro-' + (i + 1),
        unidadId: id,
        nombres: fila[4],
        apellidos: fila[5],
        nombre: fila[4] + ' ' + fila[5],
        documento: String(1010000000 + i * 4137),
        email: fila[4].split(' ')[0].toLowerCase() + '.' + fila[5].split(' ')[0].toLowerCase() + '@correo.com',
        telefono: '30' + (10000000 + i * 131719),
      })
    })

    /** Crea el recibo de caja de una cuota saldada por completo. */
    function reciboCompleto(cuota, medio, diasAntes) {
      var fecha = d.sumarDias(cuota.fechaVencimiento, -diasAntes) + 'T10:15:00.000Z'
      var pago = {
        id: 'pag-' + cuota.id,
        unidadId: cuota.unidadId,
        valor: cuota.valor,
        medio: medio,
        referencia: 'REF' + (400000 + consecutivo),
        fecha: fecha,
        estado: 'aplicado',
        origen: 'administracion',
        recibo: d.numeroRecibo(consecutivo),
        imputaciones: [{ cuotaId: cuota.id, valor: cuota.valor }],
        saldoAFavor: 0,
        fechaAplicacion: fecha,
        registradoPor: 'Sistema',
      }
      cuota.saldo = 0
      cuota.estado = 'pagada'
      consecutivo += 1
      return pago
    }

    // Periodos: tres anteriores, el actual y el proximo (facturacion anticipada).
    var periodos = [-3, -2, -1, 0, 1].map(d.periodoRelativo)
    var periodoActual = d.periodoRelativo(0)
    var indiceActual = periodos.indexOf(periodoActual)
    var periodoExtra = d.periodoRelativo(-1)

    unidades.forEach(function (unidad, i) {
      var periodosEnMora = DEFINICION_UNIDADES[i][6]
      var desdeMora = indiceActual - periodosEnMora + 1

      periodos.forEach(function (periodo, indice) {
        var esFuturo = indice > indiceActual
        var enMora = periodosEnMora > 0 && indice >= desdeMora && indice <= indiceActual
        var valor = Math.round(unidad.coeficiente * VALOR_POR_COEFICIENTE)

        var cuota = {
          id: 'cuo-' + unidad.id + '-' + periodo,
          unidadId: unidad.id,
          periodo: periodo,
          tipo: 'ordinaria',
          concepto: 'Cuota de administracion',
          valor: valor,
          saldo: valor,
          fechaVencimiento: d.vencimientoDelPeriodo(periodo),
          estado: 'pendiente',
        }
        if (!esFuturo && !enMora) {
          pagos.push(reciboCompleto(cuota, indice % 2 === 0 ? 'pse' : 'transferencia', 3))
        }
        cuotas.push(cuota)
      })

      // Cuota extraordinaria prorrateada por coeficiente (RN-05).
      var valorExtra = d.prorratearPorCoeficiente(EXTRAORDINARIA_TOTAL, unidad.coeficiente)
      var extra = {
        id: 'cuo-' + unidad.id + '-extra',
        unidadId: unidad.id,
        periodo: periodoExtra,
        tipo: 'extraordinaria',
        concepto: 'Extraordinaria: impermeabilizacion de cubiertas',
        valor: valorExtra,
        saldo: valorExtra,
        fechaVencimiento: d.vencimientoDelPeriodo(periodoExtra),
        estado: 'pendiente',
      }
      if (periodosEnMora === 0) pagos.push(reciboCompleto(extra, 'transferencia', 5))
      cuotas.push(extra)
    })

    // -----------------------------------------------------------------------
    // Casos que el demo necesita mostrar desde el primer arranque
    // -----------------------------------------------------------------------
    function buscarCuota(id) {
      return cuotas.filter(function (c) { return c.id === id })[0]
    }

    // 1. Abono parcial sobre una cuota vencida: se ve la deuda bajando sin
    //    dejar de estar en mora.
    var extraMora = buscarCuota('cuo-uni-torre2-901-extra')
    if (extraMora) {
      var abono = Math.round(extraMora.valor * 0.4)
      pagos.push({
        id: 'pag-abono-parcial',
        unidadId: extraMora.unidadId,
        valor: abono,
        medio: 'transferencia',
        referencia: 'REF554120',
        fecha: d.sumarDias(d.hoyISO(), -12) + 'T15:40:00.000Z',
        estado: 'aplicado',
        origen: 'residente',
        conceptoInformado: 'Primer contado de la cuota extraordinaria de cubiertas.',
        cuotasInformadas: [extraMora.id],
        recibo: d.numeroRecibo(consecutivo),
        imputaciones: [{ cuotaId: extraMora.id, valor: abono }],
        saldoAFavor: 0,
        fechaAplicacion: d.sumarDias(d.hoyISO(), -12) + 'T16:05:00.000Z',
        registradoPor: 'Olga Lucia Henao',
      })
      extraMora.saldo = extraMora.valor - abono
      extraMora.estado = 'abonada'
      consecutivo += 1
    }

    // 2. Abono parcial sobre una cuota que aun no vence: es el unico caso en
    //    que se ve el estado `abonada`, porque RN-04 manda sobre RN-26.
    var proxima = buscarCuota('cuo-uni-torre1-402-' + d.periodoRelativo(1))
    if (proxima) {
      var adelanto = Math.round(proxima.valor * 0.5)
      pagos.push({
        id: 'pag-abono-anticipado',
        unidadId: proxima.unidadId,
        valor: adelanto,
        medio: 'pse',
        referencia: 'REF554980',
        fecha: d.sumarDias(d.hoyISO(), -2) + 'T09:10:00.000Z',
        estado: 'aplicado',
        origen: 'residente',
        conceptoInformado: 'Adelanto de la mitad de la cuota del mes entrante.',
        cuotasInformadas: [proxima.id],
        recibo: d.numeroRecibo(consecutivo),
        imputaciones: [{ cuotaId: proxima.id, valor: adelanto }],
        saldoAFavor: 0,
        fechaAplicacion: d.sumarDias(d.hoyISO(), -2) + 'T09:12:00.000Z',
        registradoPor: 'Olga Lucia Henao',
      })
      proxima.saldo = proxima.valor - adelanto
      proxima.estado = 'abonada'
      consecutivo += 1
    }

    // 3. Abonos que los propietarios informaron y todavia nadie concilio.
    //    En el producto final estos llegan desde la app de los residentes;
    //    aqui vienen sembrados para que la bandeja no arranque vacia (RN-30).
    pagos.unshift(
      {
        id: 'pag-reportado-1',
        unidadId: 'uni-torre2-901',
        valor: 180000,
        medio: 'transferencia',
        referencia: 'CONS-88213',
        fecha: d.sumarDias(d.hoyISO(), -1) + 'T08:20:00.000Z',
        estado: 'reportado',
        origen: 'residente',
        conceptoInformado: 'Consigne para ponerme al dia con las dos cuotas de administracion mas viejas.',
        cuotasInformadas: [],
        imputaciones: [],
        saldoAFavor: 0,
        registradoPor: 'Andres Felipe Gomez Lara',
      },
      {
        id: 'pag-reportado-2',
        unidadId: 'uni-torre1-302',
        valor: 95000,
        medio: 'efectivo',
        referencia: 'RECIBIDO-PORTERIA',
        fecha: d.sumarDias(d.hoyISO(), -3) + 'T17:05:00.000Z',
        estado: 'reportado',
        origen: 'residente',
        conceptoInformado: 'Abono a la cuota de administracion del mes pasado.',
        cuotasInformadas: [],
        imputaciones: [],
        saldoAFavor: 0,
        registradoPor: 'Carlos Alberto Duque Mesa',
      },
    )

    return {
      version: VERSION_ESQUEMA,
      copropiedad: {
        id: 'cop-1',
        nombre: 'Conjunto Residencial Altos del Bosque',
        nit: '901.234.567-8',
        direccion: 'Calle 134 # 45-20',
        ciudad: 'Bogota',
      },
      usuario: 'Olga Lucia Henao',
      unidades: unidades,
      propietarios: propietarios,
      cuotas: cuotas,
      pagos: pagos,
      consecutivos: { recibo: consecutivo },
    }
  }

  // -------------------------------------------------------------------------
  // Persistencia
  // -------------------------------------------------------------------------

  function disponible() {
    try {
      return typeof window !== 'undefined' && !!window.localStorage
    } catch (e) {
      return false
    }
  }

  function leer() {
    if (!disponible()) return crearSemilla()
    try {
      var bruto = window.localStorage.getItem(CLAVE)
      if (!bruto) return sembrar()
      var bd = JSON.parse(bruto)
      if (bd.version !== VERSION_ESQUEMA) return sembrar()
      return bd
    } catch (e) {
      return sembrar()
    }
  }

  function guardar(bd) {
    if (!disponible()) return
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(bd))
    } catch (e) {
      // Sin espacio o modo privado: el demo sigue funcionando solo en memoria.
    }
  }

  function sembrar() {
    var bd = crearSemilla()
    guardar(bd)
    return bd
  }

  return { leer: leer, guardar: guardar, sembrar: sembrar }
})()
