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
  Votacion,
  Voto,
  ZonaComun,
} from '../dominio/tipos'
import { hoyISO, sumarDias, vencimientoDelPeriodo } from '../dominio/reglas'

// Sube con cada cambio de forma de los datos: `almacen.ts` regenera la semilla
// cuando no coincide, para que nadie quede con una base a medias.
// 2 — asambleas, votaciones, votos y documentos.
// 3 — rol de porteria: la correspondencia guarda quien la recibio del mensajero.
export const VERSION_ESQUEMA = 3

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
      const esFuturo = indice > indiceActual
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
    lugar: 'Salón social, Torre 1',
    enlaceTransmision: 'https://transmision.idiky.demo/asamblea-cubierta',
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

// ---------------------------------------------------------------------------
// Semilla completa
// ---------------------------------------------------------------------------
export function crearSemilla(): BaseDatos {
  const { cuotas, pagos, consecutivoComprobante } = construirCartera()
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
    asambleas,
    votaciones,
    votos,
    // Sin paz y salvo emitido: que la primera emision del demo sea la de quien lo prueba.
    documentos: [],
    perfilesDemo: [
      {
        id: 'perfil-residente-al-dia',
        etiqueta: 'Maria Camila Restrepo',
        descripcion: 'Residente al día · Torre 1 apto 402',
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
      comprobante: consecutivoComprobante,
      pazYSalvo: 1,
    },
  }
}
