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
  Asamblea,
  Asistencia,
  BaseDatos,
  Comunicado,
  ConceptoSancion,
  FormaAsistencia,
  Correspondencia,
  Cuota,
  Pago,
  Periodo,
  Persona,
  Pqrs,
  Reserva,
  Residencia,
  Sancion,
  Unidad,
  Visitante,
  Votacion,
  Voto,
  ZonaComun,
} from '../dominio/tipos'
import { hoyISO, sumarDias, vencimientoDelPeriodo } from '../dominio/reglas'

// Sube con cada cambio de forma de los datos: `almacen.ts` regenera la semilla
// cuando no coincide, para que nadie quede con una base a medias.
// 2 — asambleas, votaciones, votos y documentos.
// 3 — rol de porteria: la correspondencia guarda quien la recibio del mensajero.
// 4 — paz y salvo: cubiertoHasta, codigo de verificacion y una unidad sin saldo.
// 5 — el portero entra al demo como persona y perfil.
// 12 — la sancion guarda la norma que la respalda, copiada al imponerla (RN-38).
// 13 — el concepto puede llevar reincidencia, con su propio respaldo (RN-72).
// 14 — la reincidencia caduca: mesesReincidencia en la copropiedad (RN-72).
// 15 — la cuota lleva el respaldo que la autoriza: acta y para que (RN-46, RN-47).
// 16 — asistencia a la asamblea, con su forma y su coeficiente (ADR-0007).
// 17 — poderes: quien representa a una unidad, con el documento adjunto (RN-30).
// 18 — el poder tambien se otorga desde la app, y ahi Idiky emite el documento.
// 19 — quorum y mayorias segun la Ley 675 (arts. 41, 45 y 46), verificada.
export const VERSION_ESQUEMA = 19

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
/**
 * Unidades que **no deben absolutamente nada**: pagaron incluso la cuota del
 * periodo siguiente, que se factura por anticipado.
 *
 * Existen porque sin ellas nadie podia emitir un paz y salvo sin pagar primero:
 * el saldo incluye lo ya facturado (RN-26), y a todo el mundo se le factura el
 * mes que viene. Es un caso normal —quien paga por adelantado— y es el que hay
 * que poder mostrar (Mary, 2026-08-28).
 */
const UNIDADES_SIN_SALDO = ['uni-torre1-202']

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
  // Todos los de la semilla viven en su unidad: es el caso comun, y el
  // propietario no residente se crea desde el registro cuando alguien lo marca.
  reside: true,
}))

/**
 * El portero del turno de la manana.
 *
 * No es residente: no tiene unidad ni residencia, y por eso no esta en
 * `DEFINICION_PERSONAS`. Trabaja para la empresa de vigilancia (RN-52).
 */
const portero: Persona = {
  id: 'per-porteria',
  nombres: 'Jairo Alberto',
  apellidos: 'Pineda Cortes',
  documento: '79456123',
  email: 'porteria@altosdelbosque.co',
  telefono: '+57 320 555 2020',
}

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
    nombre: 'Salón social',
    descripcion: 'Salón para reuniones y celebraciones, con cocineta y baño.',
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
function construirCartera(): { cuotas: Cuota[]; pagos: Pago[]; consecutivoComprobante: number } {
  const cuotas: Cuota[] = []
  const pagos: Pago[] = []
  let consecutivo = 1

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
      const alDiaTotal = UNIDADES_SIN_SALDO.includes(unidad.id)
      const esFuturo = indice > indiceActual && !alDiaTotal
      const enMora = periodosEnMora > 0 && indice >= desdeMora && indice <= indiceActual
      const pagada = !esFuturo && !enMora

      const cuota: Cuota = {
        id: `cuo-${unidad.id}-${periodo}`,
        unidadId: unidad.id,
        periodo,
        tipo: 'ordinaria',
        concepto: 'Cuota de administración',
        valor: Math.round(unidad.coeficiente * VALOR_POR_COEFICIENTE),
        fechaVencimiento: vencimientoDelPeriodo(periodo),
        estado: pagada ? 'pagada' : 'pendiente',
      }

      if (pagada) {
        const pago: Pago = {
          id: `pag-${unidad.id}-${periodo}`,
          unidadId: unidad.id,
          cuotaIds: [cuota.id],
          valor: cuota.valor,
          medio: indice % 2 === 0 ? 'pse' : 'transferencia',
          referencia: `REF${String(400_000 + consecutivo)}`,
          fecha: `${sumarDias(cuota.fechaVencimiento, -3)}T10:15:00.000Z`,
          comprobante: `CP-${String(consecutivo).padStart(5, '0')}`,
          registradoPor: 'Sistema',
        }
        cuota.pagoId = pago.id
        pagos.push(pago)
        consecutivo += 1
      }

      cuotas.push(cuota)
    })

    // Cuota extraordinaria prorrateada por coeficiente (RN-05).
    const extraordinaria: Cuota = {
      id: `cuo-${unidad.id}-extra`,
      unidadId: unidad.id,
      periodo: periodoExtraordinaria,
      tipo: 'extraordinaria',
      concepto: 'Extraordinaria: impermeabilización de cubiertas',
      valor: Math.round((EXTRAORDINARIA_TOTAL * unidad.coeficiente) / 100),
      fechaVencimiento: vencimientoDelPeriodo(periodoExtraordinaria),
      estado: periodosEnMora > 0 ? 'pendiente' : 'pagada',
      // El respaldo viaja en cada cuota: es lo que el copropietario lee cuando
      // le aparece un cobro que no esperaba (RN-46, RN-47, RN-48).
      origen: 'asamblea',
      referencia: 'Asamblea extraordinaria del 14 de febrero',
      justificacion:
        'Impermeabilización de las cubiertas de las dos torres, aprobada por unanimidad tras las filtraciones del invierno. El recaudo se destina exclusivamente a esa obra.',
    }
    if (extraordinaria.estado === 'pagada') {
      const pago: Pago = {
        id: `pag-${unidad.id}-extra`,
        unidadId: unidad.id,
        cuotaIds: [extraordinaria.id],
        valor: extraordinaria.valor,
        medio: 'transferencia',
        referencia: `REF${String(400_000 + consecutivo)}`,
        fecha: `${sumarDias(extraordinaria.fechaVencimiento, -5)}T09:00:00.000Z`,
        comprobante: `CP-${String(consecutivo).padStart(5, '0')}`,
        registradoPor: 'Sistema',
      }
      extraordinaria.pagoId = pago.id
      pagos.push(pago)
      consecutivo += 1
    }
    cuotas.push(extraordinaria)
  }

  return { cuotas, pagos, consecutivoComprobante: consecutivo }
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
      asunto: 'Filtración de agua en el baño social',
      descripcion:
        'Desde la semana pasada baja agua por el techo del baño social. Parece venir del apartamento de arriba o de una tubería común.',
      estado: 'en_gestion',
      fechaRadicacion: `${sumarDias(hoy, -9)}T14:30:00.000Z`,
      fechaLimite: sumarDias(hoy, 6),
      mensajes: [
        {
          id: 'msg-1',
          autor: 'administracion',
          autorNombre: 'Olga Lucia Henao',
          texto:
            'Recibido. Programamos visita del plomero para el próximo martes entre 8 y 10 de la mañana.',
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
      asunto: 'Ruido después de las 11 de la noche',
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
      titulo: 'Corte programado de agua el sábado',
      cuerpo:
        'El próximo sábado, entre las 8:00 a. m. y la 1:00 p. m., se suspendera el suministro de agua en las dos torres por mantenimiento de los tanques. Recomendamos almacenar el agua necesaria la noche anterior.',
      categoria: 'urgente',
      fijado: true,
      fechaPublicacion: `${sumarDias(hoy, -1)}T17:00:00.000Z`,
      vigenteHasta: sumarDias(hoy, 7),
      autor: 'Administración',
      leidoPor: [],
    },
    {
      id: 'com-2',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Convocatoria a asamblea ordinaria',
      cuerpo:
        'Se convoca a todos los copropietarios a la asamblea ordinaria que se realizará en el salón social. Orden del día: informe de gestión, estados financieros, presupuesto y elección del consejo de administración. Se recuerda que las unidades en mora no tienen voto.',
      categoria: 'asamblea',
      fijado: true,
      fechaPublicacion: `${sumarDias(hoy, -6)}T12:00:00.000Z`,
      vigenteHasta: sumarDias(hoy, 20),
      autor: 'Administración',
      leidoPor: [],
    },
    {
      id: 'com-3',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Mantenimiento de ascensores Torre 2',
      cuerpo:
        'El ascensor 2 de la Torre 2 estara fuera de servicio el jueves durante toda la mañana por mantenimiento preventivo. Agradecemos su comprension.',
      categoria: 'mantenimiento',
      fijado: false,
      fechaPublicacion: `${sumarDias(hoy, -3)}T09:30:00.000Z`,
      autor: 'Administración',
      leidoPor: [],
    },
    {
      id: 'com-4',
      copropiedadId: COPROPIEDAD_ID,
      titulo: 'Nuevo horario del gimnasio',
      cuerpo:
        'A partir de este mes el gimnasio abre a las 5:00 a. m. y cierra a las 9:00 p. m. Recuerden reservar su franja desde la aplicación y respetar el aforo de 8 personas.',
      categoria: 'general',
      fijado: false,
      fechaPublicacion: `${sumarDias(hoy, -12)}T15:00:00.000Z`,
      autor: 'Administración',
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
      observaciones: 'Caja mediana, se recibe en portería principal.',
      fechaRecepcion: `${sumarDias(hoy, -1)}T11:20:00.000Z`,
      registradoPor: 'Jairo Alberto Pineda',
      estado: 'en_porteria',
    },
    {
      id: 'cor-2',
      unidadId: 'uni-torre1-402',
      tipo: 'carta',
      remitente: 'Notaria 12',
      observaciones: 'Sobre certificado.',
      fechaRecepcion: `${sumarDias(hoy, -8)}T16:00:00.000Z`,
      registradoPor: 'Jairo Alberto Pineda',
      estado: 'entregada',
      recibidoPor: 'Maria Camila Restrepo',
      fechaEntrega: `${sumarDias(hoy, -7)}T19:10:00.000Z`,
    },
    {
      id: 'cor-3',
      unidadId: 'uni-torre2-901',
      tipo: 'domicilio',
      remitente: 'Farmacia del barrio',
      observaciones: 'Requiere refrigeración.',
      fechaRecepcion: `${sumarDias(hoy, 0)}T08:45:00.000Z`,
      registradoPor: 'Jairo Alberto Pineda',
      estado: 'en_porteria',
    },
    {
      id: 'cor-4',
      unidadId: 'uni-torre1-201',
      tipo: 'paquete',
      remitente: 'Tienda de tecnologia',
      observaciones: '',
      fechaRecepcion: `${sumarDias(hoy, -2)}T13:05:00.000Z`,
      registradoPor: 'Jairo Alberto Pineda',
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
// Asambleas — CU-R-13, CU-R-20
//
// Tres, a proposito, para que se vean los tres momentos: una en curso donde se
// puede votar, una convocada que todavia no abre votaciones, y una cerrada con
// su resultado. Hay ordinaria y extraordinaria porque en las dos se vota.
// ---------------------------------------------------------------------------

/**
 * Fecha y hora completas a partir de un desplazamiento en dias.
 *
 * Con el desfase de Colombia escrito, no en UTC: una asamblea sembrada a las
 * 19:00Z se mostraba «14:00», que es la hora equivocada y ademas la del error de
 * zona horaria que ya se corrigio una vez en este demo.
 */
function fechaHoraRelativa(dias: number, hora: string): string {
  return `${sumarDias(hoyISO(), dias)}T${hora}:00-05:00`
}

const ASAMBLEA_EN_CURSO = 'asa-extra-cubierta'
const ASAMBLEA_CONVOCADA = 'asa-ordinaria-anual'
const ASAMBLEA_CERRADA = 'asa-ordinaria-anterior'

const asambleas: Asamblea[] = [
  {
    id: ASAMBLEA_EN_CURSO,
    copropiedadId: COPROPIEDAD_ID,
    tipo: 'extraordinaria',
    titulo: 'Asamblea extraordinaria — obras de la cubierta',
    fechaHora: fechaHoraRelativa(0, '19:00'),
    modalidad: 'mixta',
    numeroConvocatoria: 1,
    lugar: 'Salón social, Torre 1',
    // Con ADR-0007 el enlace es el de la herramienta que la copropiedad ya usa.
    // Se ve asi a proposito: es lo que hace evidente que el video no es de Idiky.
    enlaceTransmision: 'https://meet.google.com/idiky-demo-asm',
    estado: 'instalada',
    citacion: 'Citación 003 del consejo de administración',
    ordenDelDia: [
      {
        id: 'pun-ex-1',
        orden: 1,
        titulo: 'Verificación del quórum e instalación',
        descripcion: 'Registro de asistentes y representados, y lectura del orden del día.',
        seVota: false,
      },
      {
        id: 'pun-ex-2',
        orden: 2,
        titulo: 'Cuota extraordinaria para impermeabilizar la cubierta',
        // Ley 675 art. 46: una extraordinaria que supere cuatro veces las
        // expensas mensuales necesarias exige el 70 % del coeficiente del
        // edificio. $ 40.000.000 contra ~$ 4.500.000 al mes: lo supera de sobra.
        mayoria: 'calificada' as const,
        descripcion:
          'Se somete a consideración una cuota extraordinaria de $40.000.000, prorrateada por coeficiente, con destinación exclusiva a la impermeabilización de la cubierta de las dos torres.',
        seVota: true,
      },
      {
        id: 'pun-ex-3',
        orden: 3,
        titulo: 'Contratista de la obra',
        descripcion:
          'Tres propuestas recibidas. La ganadora ejecuta la obra bajo supervisión del consejo.',
        seVota: true,
      },
    ],
  },
  {
    id: ASAMBLEA_CONVOCADA,
    copropiedadId: COPROPIEDAD_ID,
    tipo: 'ordinaria',
    titulo: 'Asamblea ordinaria anual',
    fechaHora: fechaHoraRelativa(22, '18:30'),
    modalidad: 'presencial',
    numeroConvocatoria: 1,
    lugar: 'Salón social, Torre 1',
    estado: 'convocada',
    citacion: 'Convocatoria 001 de la administración',
    ordenDelDia: [
      {
        id: 'pun-or-1',
        orden: 1,
        titulo: 'Informe de gestión de la administración',
        descripcion: 'Presentacion del informe del periodo. Punto informativo.',
        seVota: false,
      },
      {
        id: 'pun-or-2',
        orden: 2,
        titulo: 'Aprobacion de los estados financieros',
        descripcion: 'Estados financieros del último periodo, con el informe del revisor fiscal.',
        seVota: true,
      },
      {
        id: 'pun-or-3',
        orden: 3,
        titulo: 'Presupuesto del próximo año',
        descripcion: 'Presupuesto de ingresos y gastos, y el valor de la cuota de administración.',
        seVota: true,
      },
      {
        id: 'pun-or-4',
        orden: 4,
        titulo: 'Elección del consejo de administración',
        descripcion: 'Postulaciones recibidas hasta ocho días antes de la asamblea.',
        seVota: true,
      },
    ],
  },
  {
    id: ASAMBLEA_CERRADA,
    copropiedadId: COPROPIEDAD_ID,
    tipo: 'ordinaria',
    titulo: 'Asamblea ordinaria del periodo anterior',
    fechaHora: fechaHoraRelativa(-150, '18:30'),
    modalidad: 'presencial',
    numeroConvocatoria: 1,
    lugar: 'Salón social, Torre 1',
    estado: 'cerrada',
    citacion: 'Convocatoria 004 de la administración',
    ordenDelDia: [
      {
        id: 'pun-an-1',
        orden: 1,
        titulo: 'Aprobacion del presupuesto',
        descripcion: 'Presupuesto que rige el periodo en curso.',
        seVota: true,
      },
    ],
  },
]

const votaciones: Votacion[] = [
  {
    id: 'vta-ex-2',
    asambleaId: ASAMBLEA_EN_CURSO,
    puntoId: 'pun-ex-2',
    pregunta: '¿Aprueba la cuota extraordinaria para impermeabilizar la cubierta?',
    opciones: [
      { id: 'op-si', texto: 'A favor' },
      { id: 'op-no', texto: 'En contra' },
      { id: 'op-abs', texto: 'Me abstengo' },
    ],
    estado: 'abierta',
    abiertaEn: fechaHoraRelativa(0, '19:20'),
  },
  {
    id: 'vta-ex-3',
    asambleaId: ASAMBLEA_EN_CURSO,
    puntoId: 'pun-ex-3',
    pregunta: '¿Cuál propuesta debe ejecutar la obra?',
    opciones: [
      { id: 'op-a', texto: 'Impermeabilizados del Norte' },
      { id: 'op-b', texto: 'Construcciones Andinas' },
      { id: 'op-c', texto: 'Tecnicubiertas' },
    ],
    estado: 'abierta',
    abiertaEn: fechaHoraRelativa(0, '19:40'),
  },
  {
    id: 'vta-or-2',
    asambleaId: ASAMBLEA_CONVOCADA,
    puntoId: 'pun-or-2',
    pregunta: '¿Aprueba los estados financieros del periodo?',
    opciones: [
      { id: 'op-si', texto: 'A favor' },
      { id: 'op-no', texto: 'En contra' },
      { id: 'op-abs', texto: 'Me abstengo' },
    ],
    estado: 'preparada',
  },
  {
    id: 'vta-an-1',
    asambleaId: ASAMBLEA_CERRADA,
    puntoId: 'pun-an-1',
    pregunta: '¿Aprueba el presupuesto presentado?',
    opciones: [
      { id: 'op-si', texto: 'A favor' },
      { id: 'op-no', texto: 'En contra' },
      { id: 'op-abs', texto: 'Me abstengo' },
    ],
    estado: 'cerrada',
    abiertaEn: fechaHoraRelativa(-150, '19:10'),
    cerradaEn: fechaHoraRelativa(-150, '19:35'),
  },
]

/** Votos de la asamblea ya cerrada: `[unidad, opcion]`. El coeficiente se copia (RN-37). */
const VOTOS_ASAMBLEA_CERRADA: Array<[string, string]> = [
  ['uni-torre1-402', 'op-si'],
  ['uni-torre1-201', 'op-si'],
  ['uni-torre1-202', 'op-si'],
  ['uni-torre1-301', 'op-si'],
  ['uni-torre1-302', 'op-no'],
  ['uni-torre2-501', 'op-si'],
  ['uni-torre2-502', 'op-abs'],
  ['uni-torre2-601', 'op-no'],
  ['uni-torre2-602', 'op-si'],
]

const votos: Voto[] = VOTOS_ASAMBLEA_CERRADA.map(([unidadId, opcionId], i) => ({
  id: `vot-${i + 1}`,
  votacionId: 'vta-an-1',
  unidadId,
  opcionId,
  emitidoPor: residencias.find((r) => r.unidadId === unidadId)?.personaId ?? 'per-1',
  coeficiente: unidades.find((u) => u.id === unidadId)?.coeficiente ?? 0,
  fecha: fechaHoraRelativa(-150, '19:2' + String(i % 10)),
}))

/**
 * El catalogo de multas de la copropiedad (CU-A-22).
 *
 * **Los cuatro salen del manual de convivencia**, y es a proposito: es donde
 * viven en la practica (Mary, 2026-09-08). El quinto esta inactivo para que se
 * vea que un concepto dado de baja no desaparece — sigue ahi porque las multas
 * que se impusieron con el lo referencian (RN-40).
 *
 * Los valores estan en salarios minimos diarios en la vida real; aqui van en
 * pesos redondos porque el demo no tiene el SMLDV del ano.
 */
const conceptosSancion: ConceptoSancion[] = [
  {
    id: 'cs-1',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Ruido fuera de horario',
    descripcion:
      'Música, fiestas o trabajos ruidosos entre las 10:00 p. m. y las 7:00 a. m., o fuera del horario que fije la administración.',
    valor: 180000,
    origen: 'manual',
    referencia: 'Artículo 14, numeral 3',
    // La unica del catalogo con reincidencia parametrizada, y con un respaldo
    // **distinto** del de la multa base: el manual fija la multa y una asamblea
    // posterior agravo la repeticion. Es el caso que hay que poder mostrar
    // (RN-72) — y que las otras cinco no la tengan es igual de informativo:
    // sin documento que lo diga, la multa no sube.
    reincidencia: {
      valor: 360000,
      origen: 'asamblea',
      referencia: 'Asamblea ordinaria del 18 de marzo',
    },
    activo: true,
    creadoEn: fechaHoraRelativa(-320, '09:15'),
  },
  {
    id: 'cs-2',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Mascota sin correa en zonas comunes',
    descripcion:
      'Circular con la mascota suelta por pasillos, ascensores o zonas comunes, o no recoger sus excrementos.',
    valor: 120000,
    origen: 'manual',
    referencia: 'Artículo 21',
    activo: true,
    creadoEn: fechaHoraRelativa(-320, '09:20'),
  },
  {
    id: 'cs-3',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Uso indebido del parqueadero de visitantes',
    descripcion:
      'Estacionar un vehículo de la unidad en los cupos de visitantes, o cederlos a terceros ajenos a una visita.',
    valor: 150000,
    origen: 'manual',
    referencia: 'Artículo 18, parágrafo 2',
    activo: true,
    creadoEn: fechaHoraRelativa(-320, '09:25'),
  },
  {
    id: 'cs-4',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Daño a bienes comunes',
    descripcion:
      'Deterioro de ascensores, puertas, jardines o equipos de las zonas comunes por uso descuidado. Se cobra además la reparación.',
    valor: 250000,
    origen: 'reglamento',
    referencia: 'Artículo 42',
    activo: true,
    creadoEn: fechaHoraRelativa(-320, '09:30'),
  },
  {
    id: 'cs-5',
    copropiedadId: COPROPIEDAD_ID,
    nombre: 'Incumplimiento del aforo del salón social',
    descripcion:
      'Superar el número de asistentes autorizado en una reserva del salón social.',
    valor: 200000,
    origen: 'asamblea',
    referencia: 'Asamblea ordinaria del 12 de marzo de 2025',
    // Inactivo a proposito: la reforma del manual de 2026 absorbio esta conducta.
    // Sigue en el catalogo porque las multas impuestas en su momento lo citan.
    activo: false,
    creadoEn: fechaHoraRelativa(-540, '11:00'),
    inactivoDesde: sumarDias(hoyISO(), -60),
  },
]

/**
 * Dos expedientes sancionatorios, cada uno en una etapa distinta (CU-A-23).
 *
 * Uno **espera los descargos del copropietario** y el otro **espera que la
 * administracion resuelva** los que ya presento: son los dos turnos del proceso,
 * y con uno solo no se ve que el debido proceso es de ida y vuelta.
 *
 * Ninguno esta en firme, asi que **ninguno genero cuota** — que es justo lo que
 * RN-39 exige y lo que un demo tiene que dejar ver.
 */
function construirSanciones(): { sanciones: Sancion[]; consecutivo: number } {
  const hoy = hoyISO()
  const anio = new Date().getFullYear()

  const sanciones: Sancion[] = [
    {
      id: 'san-1',
      copropiedadId: COPROPIEDAD_ID,
      unidadId: 'uni-torre2-901',
      conceptoId: 'cs-1',
      concepto: 'Ruido fuera de horario',
      valor: 180000,
      respaldo: 'Manual de convivencia · Artículo 14, numeral 3',
      hechos:
        'El sábado 5 a la 1:30 a. m. se recibieron tres llamadas de vecinos por música a alto volumen. La portería subió y pidió bajarla; volvió a subir a las 2:10 a. m. por el mismo motivo.',
      estado: 'notificada',
      radicado: `SAN-${anio}-0001`,
      impuestaPor: 'per-admin',
      fechaImposicion: fechaHoraRelativa(-3, '09:40'),
      limiteDescargos: sumarDias(hoy, 7),
      actuaciones: [
        {
          id: 'act-1',
          fecha: fechaHoraRelativa(-3, '09:40'),
          autor: 'administracion',
          personaId: 'per-admin',
          titulo: 'Se notificó la apertura del proceso',
          texto:
            'Se le comunicaron los hechos, la norma del manual de convivencia (artículo 14, numeral 3) y el plazo para presentar descargos.',
        },
      ],
    },
    {
      id: 'san-2',
      copropiedadId: COPROPIEDAD_ID,
      unidadId: 'uni-torre1-402',
      conceptoId: 'cs-3',
      concepto: 'Uso indebido del parqueadero de visitantes',
      valor: 150000,
      respaldo: 'Manual de convivencia · Artículo 18, parágrafo 2',
      hechos:
        'Los días 2, 3 y 4 el vehículo de la unidad permaneció en el cupo de visitantes número 4 durante la noche.',
      estado: 'en_estudio',
      radicado: `SAN-${anio}-0002`,
      impuestaPor: 'per-admin',
      fechaImposicion: fechaHoraRelativa(-9, '11:15'),
      limiteDescargos: sumarDias(hoy, 1),
      actuaciones: [
        {
          id: 'act-2',
          fecha: fechaHoraRelativa(-9, '11:15'),
          autor: 'administracion',
          personaId: 'per-admin',
          titulo: 'Se notificó la apertura del proceso',
          texto:
            'Se le comunicaron los hechos, la norma del manual de convivencia (artículo 18, parágrafo 2) y el plazo para presentar descargos.',
        },
        {
          id: 'act-3',
          fecha: fechaHoraRelativa(-2, '20:05'),
          autor: 'copropietario',
          personaId: 'per-1',
          titulo: 'Presentó descargos',
          texto:
            'El parqueadero asignado estuvo bloqueado esas tres noches por la obra de impermeabilización. La administración autorizó por WhatsApp usar el cupo de visitantes mientras durara el trabajo.',
        },
      ],
    },
  ]

  return { sanciones, consecutivo: 2 }
}

/**
 * Asistencia a la asamblea en curso, que es mixta (ADR-0007).
 *
 * Cinco unidades y de las dos formas, a proposito: en una mixta el acta tiene
 * que poder decir cuantos habia de cada lado, y con todas iguales eso no se
 * veria. **Quedan sin marcar las dos unidades de los perfiles del demo** —Torre
 * 1 · 402 y Torre 2 · 901— para que quien lo abra pueda marcar la suya.
 */
function construirAsistencias(): Asistencia[] {
  const definicion: Array<[unidadId: string, personaId: string, forma: FormaAsistencia, hora: string]> = [
    ['uni-torre1-201', 'per-3', 'presencial', '19:02'],
    ['uni-torre1-202', 'per-4', 'presencial', '19:05'],
    ['uni-torre1-301', 'per-5', 'virtual', '19:03'],
    ['uni-torre2-501', 'per-8', 'virtual', '19:08'],
    ['uni-torre2-602', 'per-11', 'presencial', '19:11'],
  ]
  return definicion.map(([unidadId, personaId, forma, hora], i) => ({
    id: `asi-${i + 1}`,
    asambleaId: ASAMBLEA_EN_CURSO,
    unidadId,
    personaId,
    forma,
    // Copiado al marcar, como el voto (RN-37).
    coeficiente: unidades.find((u) => u.id === unidadId)!.coeficiente,
    registradaEn: fechaHoraRelativa(0, hora),
  }))
}

// ---------------------------------------------------------------------------
// Semilla completa
// ---------------------------------------------------------------------------
export function crearSemilla(): BaseDatos {
  const { cuotas, pagos, consecutivoComprobante } = construirCartera()
  const { pqrs, consecutivo: consecutivoPqrs } = construirPqrs()
  const { sanciones, consecutivo: consecutivoSancion } = construirSanciones()

  return {
    version: VERSION_ESQUEMA,
    copropiedades: [
      {
        id: COPROPIEDAD_ID,
        nombre: 'Conjunto Residencial Altos del Bosque',
        nit: '901.234.567-8',
        direccion: 'Calle 134 # 45-20',
        ciudad: 'Bogotá',
        tipo: 'residencial',
        // Los terminos del debido proceso, tomados del reglamento de esta
        // copropiedad. No son constantes de la app (RN-69).
        diasDescargos: 10,
        diasImpugnacion: 5,
        // Un ano, tomado del reglamento de esta copropiedad. Como los plazos:
        // no es una constante de la app (RN-72).
        mesesReincidencia: 12,
        // Ley 675 art. 45: «mas de la mitad». Es el piso legal — el reglamento
        // puede exigir mas, nunca menos (RN-28).
        quorumMinimo: 50,
      },
    ],
    unidades,
    personas: [...personas, administrador, portero],
    residencias,
    cuotas,
    pagos,
    conceptosSancion,
    sanciones,
    zonasComunes,
    reservas: construirReservas(),
    pqrs,
    comunicados: construirComunicados(),
    correspondencia: construirCorrespondencia(),
    visitantes: construirVisitantes(),
    // Sin registros de ejemplo: llevan fotos, y una foto en la semilla es peso
    // muerto en el paquete del demo para todo el que lo abra (ADR-0009).
    registros: [],
    // Sin mensajes de ejemplo: los mensajes son consecuencia de algo que
    // alguien hizo, y sembrar consecuencias sin causa confunde mas que ayuda.
    mensajes: [],
    // Sin accesos a soportes: la constancia nace cuando alguien mira una foto.
    accesosSoportes: [],
    asambleas,
    asistencias: construirAsistencias(),
    // Sin poderes de ejemplo: llevan el documento firmado adjunto, y una imagen
    // en la semilla es peso muerto en el paquete del demo para todo el que lo
    // abra (ADR-0009). Que el primer poder del demo sea el de quien lo prueba.
    poderes: [],
    votaciones,
    votos,
    // Sin paz y salvo emitido: que la primera emision del demo sea la de quien lo prueba.
    documentos: [],
    perfilesDemo: [
      {
        id: 'perfil-residente-al-dia',
        etiqueta: 'Maria Camila Restrepo',
        descripcion: 'Propietaria al día · Torre 1 apto 402',
        rol: 'residente',
        personaId: 'per-1',
        copropiedadId: COPROPIEDAD_ID,
        unidadId: 'uni-torre1-402',
      },
      {
        id: 'perfil-propietario-sin-saldo',
        etiqueta: 'Jorge Enrique Valencia',
        descripcion: 'Propietario sin deuda · Torre 1 apto 202',
        rol: 'residente',
        personaId: 'per-4',
        copropiedadId: COPROPIEDAD_ID,
        unidadId: 'uni-torre1-202',
      },
      {
        id: 'perfil-residente-mora',
        etiqueta: 'Andres Felipe Gomez',
        descripcion: 'Propietario en mora · Torre 2 apto 901',
        rol: 'residente',
        personaId: 'per-2',
        copropiedadId: COPROPIEDAD_ID,
        unidadId: 'uni-torre2-901',
      },
      {
        id: 'perfil-arrendataria',
        etiqueta: 'Sandra Milena Ortiz',
        // El unico perfil que NO es propietario: sirve para ver que RN-60 se
        // cumple de verdad — solo puede registrar visitantes, y la pantalla se
        // lo dice en vez de esconderle el boton sin explicacion.
        descripcion: 'Arrendataria · Torre 1 · 301',
        rol: 'residente',
        personaId: 'per-5',
        copropiedadId: COPROPIEDAD_ID,
        unidadId: 'uni-torre1-301',
      },
      {
        id: 'perfil-porteria',
        etiqueta: 'Jairo Alberto Pineda',
        descripcion: 'Portería · turno de la mañana',
        rol: 'porteria',
        personaId: 'per-porteria',
        copropiedadId: COPROPIEDAD_ID,
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
      sancion: consecutivoSancion,
      comprobante: consecutivoComprobante,
      pazYSalvo: 1,
      poder: 1,
    },
  }
}
