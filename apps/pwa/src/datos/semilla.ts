/**
 * Datos ficticios iniciales del demo (ADR-0003, ADR-0004).
 *
 * Se generan en relacion con la fecha actual para que el demo siempre luzca
 * vigente: periodos de cartera, vencimientos, reservas y comunicados se calculan
 * a partir de hoy.
 *
 * NINGUNA PANTALLA DEBE IMPORTAR ESTE ARCHIVO. Solo `almacen.ts` lo usa.
 */

import type {
  BaseDatos,
  Comunicado,
  Correspondencia,
  Cuota,
  Pago,
  Periodo,
  Persona,
  Pqrs,
  Reserva,
  Residencia,
  Unidad,
  Visitante,
  ZonaComun,
} from '../dominio/tipos'
import { hoyISO, numeroRecibo, sumarDias, vencimientoDelPeriodo } from '../dominio/reglas'

export const VERSION_ESQUEMA = 2

const COPROPIEDAD_ID = 'cop-1'

/** Valor de la cuota ordinaria por punto de coeficiente. */
const VALOR_POR_COEFICIENTE = 45_000

/** Valor total de la cuota extraordinaria vigente, prorrateada por coeficiente. */
const EXTRAORDINARIA_TOTAL = 40_000_000

/** Desplaza un periodo `AAAA-MM` en meses. */
function periodoRelativo(meses: number): Periodo {
  const hoy = new Date(`${hoyISO()}T12:00:00`)
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + meses, 1)
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Unidades — la suma de coeficientes es exactamente 100 (RN-19)
// ---------------------------------------------------------------------------
const DEFINICION_UNIDADES: Array<[torre: string, numero: string, area: number, coeficiente: number]> = [
  ['Torre 1', '201', 78, 9.1],
  ['Torre 1', '202', 78, 9.1],
  ['Torre 1', '301', 74, 8.6],
  ['Torre 1', '302', 74, 8.6],
  ['Torre 1', '401', 70, 8.2],
  ['Torre 1', '402', 70, 8.2],
  ['Torre 2', '501', 72, 8.4],
  ['Torre 2', '502', 72, 8.4],
  ['Torre 2', '601', 68, 8.0],
  ['Torre 2', '602', 68, 8.0],
  ['Torre 2', '901', 66, 7.7],
  ['Torre 2', '902', 66, 7.7],
]

function idUnidad(torre: string, numero: string): string {
  return `uni-${torre.toLowerCase().replace(/\s+/g, '')}-${numero}`
}

const unidades: Unidad[] = DEFINICION_UNIDADES.map(([torre, numero, area, coeficiente], i) => ({
  id: idUnidad(torre, numero),
  copropiedadId: COPROPIEDAD_ID,
  torre,
  numero,
  tipo: 'apartamento',
  area,
  coeficiente,
  parqueaderos: [`P-${String(i + 1).padStart(2, '0')}`],
}))

/**
 * Perfil de cartera por unidad: cuantos periodos recientes tiene sin pagar.
 * 0 = al dia. Se cuenta hacia atras desde el periodo actual.
 */
const MORA_POR_UNIDAD: Record<string, number> = {
  'uni-torre2-901': 3,
  'uni-torre1-302': 2,
  'uni-torre2-602': 1,
  'uni-torre1-201': 1,
}

// ---------------------------------------------------------------------------
// Personas y residencias
// ---------------------------------------------------------------------------
const DEFINICION_PERSONAS: Array<[nombres: string, apellidos: string, unidad: string, rol: Residencia['rol']]> = [
  ['Maria Camila', 'Restrepo Ossa', 'uni-torre1-402', 'propietario'],
  ['Andres Felipe', 'Gomez Lara', 'uni-torre2-901', 'propietario'],
  ['Luisa Fernanda', 'Marin Castro', 'uni-torre1-201', 'propietario'],
  ['Jorge Enrique', 'Valencia Ruiz', 'uni-torre1-202', 'propietario'],
  ['Sandra Milena', 'Ortiz Pena', 'uni-torre1-301', 'arrendatario'],
  ['Carlos Alberto', 'Duque Mesa', 'uni-torre1-302', 'propietario'],
  ['Paula Andrea', 'Rojas Vega', 'uni-torre1-401', 'propietario'],
  ['Ricardo', 'Salazar Nino', 'uni-torre2-501', 'propietario'],
  ['Diana Patricia', 'Cardenas Leal', 'uni-torre2-502', 'arrendatario'],
  ['Mauricio', 'Bermudez Silva', 'uni-torre2-601', 'propietario'],
  ['Angela Maria', 'Trujillo Pardo', 'uni-torre2-602', 'propietario'],
  ['Hernan Dario', 'Quintero Arias', 'uni-torre2-902', 'propietario'],
]

const personas: Persona[] = DEFINICION_PERSONAS.map(([nombres, apellidos], i) => ({
  id: `per-${i + 1}`,
  nombres,
  apellidos,
  documento: `${1_010_000_000 + i * 4_137}`,
  email: `${nombres.split(' ')[0].toLowerCase()}.${apellidos.split(' ')[0].toLowerCase()}@correo.com`,
  telefono: `+57 31${i % 10} ${200 + i} ${4000 + i * 7}`,
}))

const residencias: Residencia[] = DEFINICION_PERSONAS.map(([, , unidadId, rol], i) => ({
  id: `res-${i + 1}`,
  personaId: `per-${i + 1}`,
  unidadId,
  rol,
  desde: `${new Date().getFullYear() - 2}-03-01`,
  principal: true,
}))

/** El administrador de la copropiedad. */
const administrador: Persona = {
  id: 'per-admin',
  nombres: 'Olga Lucia',
  apellidos: 'Henao Vargas',
  documento: '52987412',
  email: 'administracion@altosdelbosque.co',
  telefono: '+57 320 555 1010',
}

// ---------------------------------------------------------------------------
// Zonas comunes
// ---------------------------------------------------------------------------
const zonasComunes: ZonaComun[] = [
  {
    id: 'zon-salon',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Salon social',
    descripcion: 'Salon para reuniones y celebraciones, con cocineta y bano.',
    icono: 'salon',
    aforo: 40,
    requiereAprobacion: true,
    horaInicio: '09:00',
    horaFin: '21:00',
    duracionBloqueHoras: 4,
    anticipacionMinimaHoras: 48,
    cupoMensualPorUnidad: 2,
  },
  {
    id: 'zon-bbq',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Terraza BBQ',
    descripcion: 'Zona de asados en la terraza de la Torre 2.',
    icono: 'bbq',
    aforo: 12,
    requiereAprobacion: true,
    horaInicio: '11:00',
    horaFin: '23:00',
    duracionBloqueHoras: 4,
    anticipacionMinimaHoras: 24,
    cupoMensualPorUnidad: 3,
  },
  {
    id: 'zon-gimnasio',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Gimnasio',
    descripcion: 'Equipos cardiovasculares y de fuerza. Aforo controlado.',
    icono: 'gimnasio',
    aforo: 8,
    requiereAprobacion: false,
    horaInicio: '05:00',
    horaFin: '21:00',
    duracionBloqueHoras: 2,
    anticipacionMinimaHoras: 2,
    cupoMensualPorUnidad: 12,
  },
  {
    id: 'zon-coworking',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Sala de coworking',
    descripcion: 'Seis puestos de trabajo con internet e impresora.',
    icono: 'coworking',
    aforo: 6,
    requiereAprobacion: false,
    horaInicio: '07:00',
    horaFin: '19:00',
    duracionBloqueHoras: 2,
    anticipacionMinimaHoras: 2,
    cupoMensualPorUnidad: 10,
  },
  {
    id: 'zon-cancha',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Cancha multiple',
    descripcion: 'Cancha de futbol y baloncesto con iluminacion.',
    icono: 'cancha',
    aforo: 20,
    requiereAprobacion: false,
    horaInicio: '08:00',
    horaFin: '20:00',
    duracionBloqueHoras: 2,
    anticipacionMinimaHoras: 4,
    cupoMensualPorUnidad: 8,
  },
]

// ---------------------------------------------------------------------------
// Cartera: cuotas y pagos
// ---------------------------------------------------------------------------
function construirCartera(): {
  cuotas: Cuota[]
  pagos: Pago[]
  consecutivoRecibo: number
} {
  const cuotas: Cuota[] = []
  const pagos: Pago[] = []
  let consecutivo = 1

  /** Cuota saldada por completo, con su recibo de caja aplicado. */
  function pagoTotal(cuota: Cuota, medio: Pago['medio'], diasAntes: number): Pago {
    const pago: Pago = {
      id: `pag-${cuota.id}`,
      unidadId: cuota.unidadId,
      valor: cuota.valor,
      medio,
      referencia: `REF${String(400_000 + consecutivo)}`,
      fecha: `${sumarDias(cuota.fechaVencimiento, -diasAntes)}T10:15:00.000Z`,
      estado: 'aplicado',
      origen: 'administracion',
      recibo: numeroRecibo(consecutivo),
      imputaciones: [{ cuotaId: cuota.id, valor: cuota.valor }],
      saldoAFavor: 0,
      fechaAplicacion: `${sumarDias(cuota.fechaVencimiento, -diasAntes)}T10:15:00.000Z`,
      registradoPor: 'Sistema',
    }
    cuota.saldo = 0
    cuota.estado = 'pagada'
    consecutivo += 1
    return pago
  }

  // Periodos: tres anteriores, el actual y el proximo (facturacion anticipada).
  const periodos = [-3, -2, -1, 0, 1].map(periodoRelativo)
  const periodoActual = periodoRelativo(0)
  const periodoExtraordinaria = periodoRelativo(-1)

  for (const unidad of unidades) {
    const periodosEnMora = MORA_POR_UNIDAD[unidad.id] ?? 0
    // Los periodos en mora son los ultimos `periodosEnMora` hasta el actual.
    const indiceActual = periodos.indexOf(periodoActual)
    const desdeMora = indiceActual - periodosEnMora + 1

    periodos.forEach((periodo, indice) => {
      const esFuturo = indice > indiceActual
      const enMora = periodosEnMora > 0 && indice >= desdeMora && indice <= indiceActual
      const pagada = !esFuturo && !enMora
      const valor = Math.round(unidad.coeficiente * VALOR_POR_COEFICIENTE)

      const cuota: Cuota = {
        id: `cuo-${unidad.id}-${periodo}`,
        unidadId: unidad.id,
        periodo,
        tipo: 'ordinaria',
        concepto: 'Cuota de administracion',
        valor,
        saldo: valor,
        fechaVencimiento: vencimientoDelPeriodo(periodo),
        estado: 'pendiente',
      }

      if (pagada) pagos.push(pagoTotal(cuota, indice % 2 === 0 ? 'pse' : 'transferencia', 3))
      cuotas.push(cuota)
    })

    // Cuota extraordinaria prorrateada por coeficiente (RN-05).
    const valorExtra = Math.round((EXTRAORDINARIA_TOTAL * unidad.coeficiente) / 100)
    const extraordinaria: Cuota = {
      id: `cuo-${unidad.id}-extra`,
      unidadId: unidad.id,
      periodo: periodoExtraordinaria,
      tipo: 'extraordinaria',
      concepto: 'Extraordinaria: impermeabilizacion de cubiertas',
      valor: valorExtra,
      saldo: valorExtra,
      fechaVencimiento: vencimientoDelPeriodo(periodoExtraordinaria),
      estado: 'pendiente',
    }
    if (periodosEnMora === 0) pagos.push(pagoTotal(extraordinaria, 'transferencia', 5))
    cuotas.push(extraordinaria)
  }

  // -------------------------------------------------------------------------
  // Casos que el demo necesita mostrar desde el primer arranque
  // -------------------------------------------------------------------------

  // 1. Un abono parcial ya aplicado: la extraordinaria de la unidad en mora
  //    quedo a medias, para que se vea el estado `abonada` (RN-26).
  const extraEnMora = cuotas.find((c) => c.id === 'cuo-uni-torre2-901-extra')
  if (extraEnMora) {
    const abono = Math.round(extraEnMora.valor * 0.4)
    pagos.push({
      id: 'pag-abono-parcial',
      unidadId: extraEnMora.unidadId,
      valor: abono,
      medio: 'transferencia',
      referencia: 'REF554120',
      fecha: `${sumarDias(hoyISO(), -12)}T15:40:00.000Z`,
      estado: 'aplicado',
      origen: 'residente',
      conceptoInformado: 'Primer contado de la cuota extraordinaria de cubiertas.',
      cuotasInformadas: [extraEnMora.id],
      reportadoPor: 'per-2',
      recibo: numeroRecibo(consecutivo),
      imputaciones: [{ cuotaId: extraEnMora.id, valor: abono }],
      saldoAFavor: 0,
      fechaAplicacion: `${sumarDias(hoyISO(), -12)}T16:05:00.000Z`,
      registradoPor: 'Olga Lucia Henao',
    })
    extraEnMora.saldo = extraEnMora.valor - abono
    extraEnMora.estado = 'abonada'
    consecutivo += 1
  }

  // 2. Un abono parcial sobre una cuota que todavia no vence: es el unico caso
  //    en que se ve el estado `abonada`, porque una cuota vencida se sigue
  //    reportando como vencida aunque tenga abonos (RN-04 manda sobre RN-26).
  const proximaAlDia = cuotas.find(
    (c) => c.unidadId === 'uni-torre1-402' && c.periodo === periodoRelativo(1),
  )
  if (proximaAlDia) {
    const abono = Math.round(proximaAlDia.valor * 0.5)
    pagos.push({
      id: 'pag-abono-anticipado',
      unidadId: proximaAlDia.unidadId,
      valor: abono,
      medio: 'pse',
      referencia: 'REF554980',
      fecha: `${sumarDias(hoyISO(), -2)}T09:10:00.000Z`,
      estado: 'aplicado',
      origen: 'residente',
      conceptoInformado: 'Adelanto de la mitad de la cuota del mes entrante.',
      cuotasInformadas: [proximaAlDia.id],
      reportadoPor: 'per-1',
      recibo: numeroRecibo(consecutivo),
      imputaciones: [{ cuotaId: proximaAlDia.id, valor: abono }],
      saldoAFavor: 0,
      fechaAplicacion: `${sumarDias(hoyISO(), -2)}T09:12:00.000Z`,
      registradoPor: 'Olga Lucia Henao',
    })
    proximaAlDia.saldo = proximaAlDia.valor - abono
    proximaAlDia.estado = 'abonada'
    consecutivo += 1
  }

  // 3. Dos abonos informados por propietarios y todavia sin conciliar, para que
  //    la bandeja del administrador no arranque vacia (RN-30).
  pagos.unshift(
    {
      id: 'pag-reportado-1',
      unidadId: 'uni-torre2-901',
      valor: 180_000,
      medio: 'transferencia',
      referencia: 'CONS-88213',
      fecha: `${sumarDias(hoyISO(), -1)}T08:20:00.000Z`,
      estado: 'reportado',
      origen: 'residente',
      conceptoInformado:
        'Consigne para ponerme al dia con las dos cuotas de administracion mas viejas.',
      cuotasInformadas: [],
      reportadoPor: 'per-2',
      imputaciones: [],
      saldoAFavor: 0,
      registradoPor: 'Andres Felipe Gomez',
    },
    {
      id: 'pag-reportado-2',
      unidadId: 'uni-torre1-302',
      valor: 95_000,
      medio: 'efectivo',
      referencia: 'RECIBIDO-PORTERIA',
      fecha: `${sumarDias(hoyISO(), -3)}T17:05:00.000Z`,
      estado: 'reportado',
      origen: 'residente',
      conceptoInformado: 'Abono a la cuota de administracion del mes pasado.',
      cuotasInformadas: [],
      reportadoPor: 'per-1',
      imputaciones: [],
      saldoAFavor: 0,
      registradoPor: 'Residente Torre 1 apto 302',
    },
  )

  return { cuotas, pagos, consecutivoRecibo: consecutivo }
}

// ---------------------------------------------------------------------------
// Reservas, PQRS, comunicados, correspondencia y visitantes
// ---------------------------------------------------------------------------
function construirReservas(): Reserva[] {
  const hoy = hoyISO()
  return [
    {
      id: 'rsv-1',
      zonaId: 'zon-salon',
      unidadId: 'uni-torre1-402',
      personaId: 'per-1',
      fecha: sumarDias(hoy, 6),
      horaInicio: '13:00',
      horaFin: '17:00',
      estado: 'confirmada',
      creadaEn: `${sumarDias(hoy, -2)}T18:20:00.000Z`,
    },
    {
      id: 'rsv-2',
      zonaId: 'zon-bbq',
      unidadId: 'uni-torre1-202',
      personaId: 'per-4',
      fecha: sumarDias(hoy, 3),
      horaInicio: '15:00',
      horaFin: '19:00',
      estado: 'solicitada',
      creadaEn: `${sumarDias(hoy, -1)}T20:05:00.000Z`,
    },
    {
      id: 'rsv-3',
      zonaId: 'zon-salon',
      unidadId: 'uni-torre2-501',
      personaId: 'per-8',
      fecha: sumarDias(hoy, 9),
      horaInicio: '17:00',
      horaFin: '21:00',
      estado: 'solicitada',
      creadaEn: `${sumarDias(hoy, -1)}T08:40:00.000Z`,
    },
    {
      id: 'rsv-4',
      zonaId: 'zon-coworking',
      unidadId: 'uni-torre1-402',
      personaId: 'per-1',
      fecha: sumarDias(hoy, -5),
      horaInicio: '09:00',
      horaFin: '11:00',
      estado: 'confirmada',
      creadaEn: `${sumarDias(hoy, -8)}T11:00:00.000Z`,
    },
  ]
}

function construirPqrs(): { pqrs: Pqrs[]; consecutivo: number } {
  const hoy = hoyISO()
  const anio = hoy.slice(0, 4)
  const pqrs: Pqrs[] = [
    {
      id: 'pqr-1',
      radicado: `PQRS-${anio}-0001`,
      copropiedadId: COPROPIEDAD_ID,
      unidadId: 'uni-torre1-402',
      personaId: 'per-1',
      tipo: 'reclamo',
      categoria: 'mantenimiento',
      asunto: 'Filtracion de agua en el bano social',
      descripcion:
        'Desde la semana pasada baja agua por el techo del bano social. Parece venir del apartamento de arriba o de una tuberia comun.',
      estado: 'en_gestion',
      fechaRadicacion: `${sumarDias(hoy, -9)}T14:30:00.000Z`,
      fechaLimite: sumarDias(hoy, 6),
      mensajes: [
        {
          id: 'msg-1',
          autor: 'administracion',
          autorNombre: 'Olga Lucia Henao',
          texto:
            'Recibido. Programamos visita del plomero para el proximo martes entre 8 y 10 de la manana.',
          fecha: `${sumarDias(hoy, -7)}T09:10:00.000Z`,
        },
      ],
    },
    {
      id: 'pqr-2',
      radicado: `PQRS-${anio}-0002`,
      copropiedadId: COPROPIEDAD_ID,
      unidadId: 'uni-torre2-601',
      personaId: 'per-10',
      tipo: 'queja',
      categoria: 'convivencia',
      asunto: 'Ruido despues de las 11 de la noche',
      descripcion:
        'El apartamento vecino hace reuniones con musica alta entre semana. Ya se hablo directamente sin resultado.',
      estado: 'abierta',
      fechaRadicacion: `${sumarDias(hoy, -2)}T22:45:00.000Z`,
      fechaLimite: sumarDias(hoy, 13),
      mensajes: [],
    },
    {
      id: 'pqr-3',
      radicado: `PQRS-${anio}-0003`,
      copropiedadId: COPROPIEDAD_ID,
      unidadId: 'uni-torre1-201',
      personaId: 'per-3',
      tipo: 'peticion',
      categoria: 'seguridad',
      asunto: 'Camara del parqueadero sin cobertura',
      descripcion: 'La camara del sotano no cubre la rampa de entrada. Solicito revisar el angulo.',
      estado: 'resuelta',
      fechaRadicacion: `${sumarDias(hoy, -25)}T10:00:00.000Z`,
      fechaLimite: sumarDias(hoy, -10),
      mensajes: [
        {
          id: 'msg-2',
          autor: 'administracion',
          autorNombre: 'Olga Lucia Henao',
          texto: 'Se reorientaron dos camaras del sotano. Queda cubierta la rampa completa.',
          fecha: `${sumarDias(hoy, -18)}T16:20:00.000Z`,
        },
      ],
    },
    {
      id: 'pqr-4',
      radicado: `PQRS-${anio}-0004`,
      copropiedadId: COPROPIEDAD_ID,
      unidadId: 'uni-torre2-901',
      personaId: 'per-2',
      tipo: 'reclamo',
      categoria: 'administracion',
      asunto: 'Cobro de intereses que no reconozco',
      descripcion: 'En mi estado de cuenta aparece un valor que no corresponde a lo acordado.',
      estado: 'abierta',
      fechaRadicacion: `${sumarDias(hoy, -20)}T08:00:00.000Z`,
      fechaLimite: sumarDias(hoy, -5),
      mensajes: [],
    },
  ]
  return { pqrs, consecutivo: pqrs.length + 1 }
}

function construirComunicados(): Comunicado[] {
  const hoy = hoyISO()
  return [
    {
      id: 'com-1',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Corte programado de agua el sabado',
      cuerpo:
        'El proximo sabado, entre las 8:00 a. m. y la 1:00 p. m., se suspendera el suministro de agua en las dos torres por mantenimiento de los tanques. Recomendamos almacenar el agua necesaria la noche anterior.',
      categoria: 'urgente',
      fijado: true,
      fechaPublicacion: `${sumarDias(hoy, -1)}T17:00:00.000Z`,
      vigenteHasta: sumarDias(hoy, 7),
      autor: 'Administracion',
      leidoPor: [],
    },
    {
      id: 'com-2',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Convocatoria a asamblea ordinaria',
      cuerpo:
        'Se convoca a todos los copropietarios a la asamblea ordinaria que se realizara en el salon social. Orden del dia: informe de gestion, estados financieros, presupuesto y eleccion del consejo de administracion. Se recuerda que las unidades en mora no tienen voto.',
      categoria: 'asamblea',
      fijado: true,
      fechaPublicacion: `${sumarDias(hoy, -6)}T12:00:00.000Z`,
      vigenteHasta: sumarDias(hoy, 20),
      autor: 'Administracion',
      leidoPor: [],
    },
    {
      id: 'com-3',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Mantenimiento de ascensores Torre 2',
      cuerpo:
        'El ascensor 2 de la Torre 2 estara fuera de servicio el jueves durante toda la manana por mantenimiento preventivo. Agradecemos su comprension.',
      categoria: 'mantenimiento',
      fijado: false,
      fechaPublicacion: `${sumarDias(hoy, -3)}T09:30:00.000Z`,
      autor: 'Administracion',
      leidoPor: [],
    },
    {
      id: 'com-4',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Nuevo horario del gimnasio',
      cuerpo:
        'A partir de este mes el gimnasio abre a las 5:00 a. m. y cierra a las 9:00 p. m. Recuerden reservar su franja desde la aplicacion y respetar el aforo de 8 personas.',
      categoria: 'general',
      fijado: false,
      fechaPublicacion: `${sumarDias(hoy, -12)}T15:00:00.000Z`,
      autor: 'Administracion',
      leidoPor: [],
    },
  ]
}

function construirCorrespondencia(): Correspondencia[] {
  const hoy = hoyISO()
  return [
    {
      id: 'cor-1',
      unidadId: 'uni-torre1-402',
      tipo: 'paquete',
      remitente: 'Mercado en linea',
      observaciones: 'Caja mediana, se recibe en porteria principal.',
      fechaRecepcion: `${sumarDias(hoy, -1)}T11:20:00.000Z`,
      estado: 'en_porteria',
    },
    {
      id: 'cor-2',
      unidadId: 'uni-torre1-402',
      tipo: 'carta',
      remitente: 'Notaria 12',
      observaciones: 'Sobre certificado.',
      fechaRecepcion: `${sumarDias(hoy, -8)}T16:00:00.000Z`,
      estado: 'entregada',
      recibidoPor: 'Maria Camila Restrepo',
      fechaEntrega: `${sumarDias(hoy, -7)}T19:10:00.000Z`,
    },
    {
      id: 'cor-3',
      unidadId: 'uni-torre2-901',
      tipo: 'domicilio',
      remitente: 'Farmacia del barrio',
      observaciones: 'Requiere refrigeracion.',
      fechaRecepcion: `${sumarDias(hoy, 0)}T08:45:00.000Z`,
      estado: 'en_porteria',
    },
    {
      id: 'cor-4',
      unidadId: 'uni-torre1-201',
      tipo: 'paquete',
      remitente: 'Tienda de tecnologia',
      observaciones: '',
      fechaRecepcion: `${sumarDias(hoy, -2)}T13:05:00.000Z`,
      estado: 'en_porteria',
    },
  ]
}

function construirVisitantes(): Visitante[] {
  const hoy = hoyISO()
  return [
    {
      id: 'vis-1',
      unidadId: 'uni-torre1-402',
      personaId: 'per-1',
      nombre: 'Juan Sebastian Restrepo',
      documento: '1023456789',
      placa: 'HKL45D',
      vigenciaDesde: hoy,
      vigenciaHasta: sumarDias(hoy, 2),
      codigo: 'IDK-4F7Q2',
      recurrente: false,
      estado: 'activo',
      creadoEn: `${sumarDias(hoy, -1)}T19:00:00.000Z`,
    },
    {
      id: 'vis-2',
      unidadId: 'uni-torre1-402',
      personaId: 'per-1',
      nombre: 'Marta Lucia Ossa',
      documento: '41567890',
      vigenciaDesde: sumarDias(hoy, -10),
      vigenciaHasta: sumarDias(hoy, -8),
      codigo: 'IDK-9B3XT',
      recurrente: false,
      estado: 'activo',
      creadoEn: `${sumarDias(hoy, -11)}T10:00:00.000Z`,
    },
  ]
}

// ---------------------------------------------------------------------------
// Semilla completa
// ---------------------------------------------------------------------------
export function crearSemilla(): BaseDatos {
  const { cuotas, pagos, consecutivoRecibo } = construirCartera()
  const { pqrs, consecutivo: consecutivoPqrs } = construirPqrs()

  return {
    version: VERSION_ESQUEMA,
    copropiedades: [
      {
        id: COPROPIEDAD_ID,
        nombre: 'Conjunto Residencial Altos del Bosque',
        nit: '901.234.567-8',
        direccion: 'Calle 134 # 45-20',
        ciudad: 'Bogota',
        tipo: 'residencial',
      },
    ],
    unidades,
    personas: [...personas, administrador],
    residencias,
    cuotas,
    pagos,
    zonasComunes,
    reservas: construirReservas(),
    pqrs,
    comunicados: construirComunicados(),
    correspondencia: construirCorrespondencia(),
    visitantes: construirVisitantes(),
    perfilesDemo: [
      {
        id: 'perfil-residente-al-dia',
        etiqueta: 'Maria Camila Restrepo',
        descripcion: 'Residente al dia · Torre 1 apto 402',
        rol: 'residente',
        personaId: 'per-1',
        copropiedadId: COPROPIEDAD_ID,
        unidadId: 'uni-torre1-402',
      },
      {
        id: 'perfil-residente-mora',
        etiqueta: 'Andres Felipe Gomez',
        descripcion: 'Residente en mora · Torre 2 apto 901',
        rol: 'residente',
        personaId: 'per-2',
        copropiedadId: COPROPIEDAD_ID,
        unidadId: 'uni-torre2-901',
      },
      {
        id: 'perfil-admin',
        etiqueta: 'Olga Lucia Henao',
        descripcion: 'Administradora de la copropiedad',
        rol: 'admin',
        personaId: 'per-admin',
        copropiedadId: COPROPIEDAD_ID,
      },
    ],
    consecutivos: {
      pqrs: consecutivoPqrs,
      recibo: consecutivoRecibo,
    },
  }
}
