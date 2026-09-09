/**
 * Repositorio: unica puerta de acceso a los datos (ADR-0003).
 *
 * Todas las operaciones son asincronas desde el primer dia, aunque hoy el
 * adaptador local responda de inmediato. Asi, cuando exista el backend (fase 2)
 * basta con reemplazar el cuerpo de estas funciones por llamadas HTTP y ninguna
 * pantalla cambia.
 *
 * Ninguna pantalla puede importar `semilla.ts` ni `almacen.ts`.
 */

import type {
  AccesoSoporte,
  AutorActuacion,
  BaseDatos,
  CategoriaComunicado,
  ConceptoSancion,
  Asamblea,
  Asistencia,
  EstadoAsamblea,
  FechaHoraISO,
  FormaAsistencia,
  MayoriaExigida,
  ModalidadAsamblea,
  Persona,
  Poder,
  Unidad,
  TipoAsamblea,
  OrigenRespaldo,
  Reincidencia,
  CategoriaRegistro,
  CategoriaPqrs,
  Comunicado,
  Correspondencia,
  Cuota,
  Documento,
  MedioPago,
  MotivoMensaje,
  Pago,
  Periodo,
  Pqrs,
  RegistroPersona,
  Reserva,
  Residencia,
  Sancion,
  RolResidencia,
  TipoCorrespondencia,
  TipoPqrs,
  Visitante,
  Voto,
} from '../dominio/tipos'
import {
  ahoraISO,
  calcularFechaLimite,
  calcularSaldo,
  hoyISO,
  prorratearPorCoeficiente,
  exigeSoportes,
  exigeVigencia,
  puedeAutorizar,
  puedeImpugnar,
  puedePresentarDescargos,
  puedeQuedarEnFirme,
  puedeVotar,
  multaAplicable,
  admiteAsistencia,
  convocatoriaCompleta,
  poderDeUnidad,
  residenciaVigente,
  definicionModalidad,
  formasDeAsistir,
  respaldoCompleto,
  respaldoDeCuotaCompleto,
  rolDeCategoria,
  soloUnDia,
  soportesCompletos,
  sumarDias,
  vecesSancionada,
  vencimientoDelPeriodo,
  votacionRecibeVotos,
  yaVoto,
} from '../dominio/reglas'
import { redactar, textoAutorizacion, textoRechazo } from '../servicios/mensajeria'
import { finDePeriodo, formatearDinero, formatearFecha } from '../utilidades/formato'
import { guardar, leer, sembrar } from './almacen'

/** Resultado de una operacion: base de datos actualizada + lo que se creo. */
export interface Resultado<T> {
  bd: BaseDatos
  datos: T
}

/** Error de negocio: la operacion es invalida segun las reglas del dominio. */
export class ErrorDeNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorDeNegocio'
  }
}

/** Latencia simulada para que la interfaz maneje estados de carga desde ya. */
const LATENCIA_MS = 120

function esperar(): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, LATENCIA_MS))
}

function persistir<T>(bd: BaseDatos, datos: T): Resultado<T> {
  guardar(bd)
  return { bd, datos }
}

/** Copia superficial de la base con las colecciones que se van a modificar. */
function clonar(bd: BaseDatos): BaseDatos {
  return JSON.parse(JSON.stringify(bd)) as BaseDatos
}

function nuevoId(prefijo: string): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

// ---------------------------------------------------------------------------
// Carga
// ---------------------------------------------------------------------------

export async function cargar(): Promise<BaseDatos> {
  await esperar()
  return leer()
}

/** Devuelve el demo a su estado inicial. */
export async function reiniciar(): Promise<BaseDatos> {
  await esperar()
  return sembrar()
}

// ---------------------------------------------------------------------------
// CU-R-04 / CU-A-04 — Pagos
// ---------------------------------------------------------------------------

export async function registrarPago(
  bdActual: BaseDatos,
  parametros: {
    unidadId: string
    cuotaIds: string[]
    medio: MedioPago
    referencia?: string
    registradoPor: string
  },
): Promise<Resultado<Pago>> {
  await esperar()
  const bd = clonar(bdActual)
  const cuotas = bd.cuotas.filter((cuota) => parametros.cuotaIds.includes(cuota.id))

  if (cuotas.length === 0) throw new ErrorDeNegocio('No se seleccionaron cuotas para pagar.')
  if (cuotas.some((cuota) => cuota.estado === 'pagada')) {
    throw new ErrorDeNegocio('Alguna de las cuotas seleccionadas ya esta pagada.')
  }

  const consecutivo = bd.consecutivos.comprobante
  const pago: Pago = {
    id: nuevoId('pag'),
    unidadId: parametros.unidadId,
    cuotaIds: cuotas.map((cuota) => cuota.id),
    valor: cuotas.reduce((total, cuota) => total + cuota.valor, 0),
    medio: parametros.medio,
    referencia: parametros.referencia || `REF${Date.now().toString().slice(-8)}`,
    fecha: ahoraISO(),
    // RN-07: comprobante con consecutivo unico.
    comprobante: `CP-${String(consecutivo).padStart(5, '0')}`,
    registradoPor: parametros.registradoPor,
  }

  for (const cuota of cuotas) {
    cuota.estado = 'pagada'
    cuota.pagoId = pago.id
  }
  bd.pagos.push(pago)
  bd.consecutivos.comprobante = consecutivo + 1

  return persistir(bd, pago)
}

// ---------------------------------------------------------------------------
// CU-A-05 — Generacion de cuotas del periodo
// ---------------------------------------------------------------------------

export interface ParametrosGeneracion {
  copropiedadId: string
  periodo: Periodo
  tipo: 'ordinaria' | 'extraordinaria'
  concepto: string
  /** Para ordinarias: valor por punto de coeficiente. Para extraordinarias: valor total. */
  valor: number
  /** El acta que la aprobo: numero y fecha. Obligatoria en extraordinarias (RN-46). */
  referencia?: string
  /** Para que se aprobo, citando el acta. Obligatoria en extraordinarias (RN-47). */
  justificacion?: string
}

/** Previsualiza las cuotas que se generarian, sin escribir nada (CU-A-05 paso 3). */
export function previsualizarCuotas(
  bd: BaseDatos,
  parametros: ParametrosGeneracion,
): Array<{ unidadId: string; etiqueta: string; valor: number }> {
  return bd.unidades
    .filter((unidad) => unidad.copropiedadId === parametros.copropiedadId)
    .map((unidad) => ({
      unidadId: unidad.id,
      etiqueta: `${unidad.torre} · ${unidad.numero}`,
      valor:
        parametros.tipo === 'extraordinaria'
          ? prorratearPorCoeficiente(parametros.valor, unidad.coeficiente)
          : Math.round(unidad.coeficiente * parametros.valor),
    }))
}

export async function generarCuotas(
  bdActual: BaseDatos,
  parametros: ParametrosGeneracion,
): Promise<Resultado<Cuota[]>> {
  await esperar()
  const bd = clonar(bdActual)

  // RN-22: no se generan dos veces las cuotas ordinarias del mismo periodo.
  if (parametros.tipo === 'ordinaria') {
    const yaExiste = bd.cuotas.some(
      (cuota) => cuota.periodo === parametros.periodo && cuota.tipo === 'ordinaria',
    )
    if (yaExiste) {
      throw new ErrorDeNegocio(
        `Las cuotas ordinarias del periodo ${parametros.periodo} ya fueron generadas.`,
      )
    }
  }

  // RN-46, RN-47: la extraordinaria no existe sin el acta que la aprobo ni sin
  // decir para que. Se comprueba aqui y no solo en el formulario, porque es la
  // condicion para que el cobro sea legitimo, no una comodidad de la pantalla.
  if (!respaldoDeCuotaCompleto(parametros)) {
    throw new ErrorDeNegocio(
      'Una cuota extraordinaria exige el acta que la aprobó y para qué se aprobó. Sin eso el cobro no se puede comprobar (RN-46, RN-47).',
    )
  }

  const esExtraordinaria = parametros.tipo === 'extraordinaria'
  const nuevas: Cuota[] = previsualizarCuotas(bd, parametros).map((linea) => ({
    id: nuevoId('cuo'),
    unidadId: linea.unidadId,
    periodo: parametros.periodo,
    tipo: parametros.tipo,
    concepto: parametros.concepto,
    valor: linea.valor,
    // RN-23: vencimiento por defecto el dia 10 del periodo.
    fechaVencimiento: vencimientoDelPeriodo(parametros.periodo),
    estado: 'pendiente',
    // El respaldo viaja en **cada** cuota, no en un encabezado aparte: quien
    // reclama lo hace desde su estado de cuenta, mirando su linea (RN-47).
    ...(esExtraordinaria
      ? {
          origen: 'asamblea' as const,
          referencia: parametros.referencia!.trim(),
          justificacion: parametros.justificacion!.trim(),
        }
      : {}),
  }))

  bd.cuotas.push(...nuevas)
  return persistir(bd, nuevas)
}

// ---------------------------------------------------------------------------
// CU-R-05 / CU-R-06 / CU-A-06 — Reservas
// ---------------------------------------------------------------------------

export async function crearReserva(
  bdActual: BaseDatos,
  parametros: {
    zonaId: string
    unidadId: string
    personaId: string
    fecha: string
    horaInicio: string
    horaFin: string
  },
): Promise<Resultado<Reserva>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('La zona comun no existe.')

  const reserva: Reserva = {
    id: nuevoId('rsv'),
    zonaId: parametros.zonaId,
    unidadId: parametros.unidadId,
    personaId: parametros.personaId,
    fecha: parametros.fecha,
    horaInicio: parametros.horaInicio,
    horaFin: parametros.horaFin,
    // Si la zona no requiere aprobacion, la reserva nace confirmada.
    estado: zona.requiereAprobacion ? 'solicitada' : 'confirmada',
    creadaEn: ahoraISO(),
  }

  bd.reservas.push(reserva)
  return persistir(bd, reserva)
}

export async function cancelarReserva(
  bdActual: BaseDatos,
  reservaId: string,
): Promise<Resultado<Reserva>> {
  await esperar()
  const bd = clonar(bdActual)
  const reserva = bd.reservas.find((r) => r.id === reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  reserva.estado = 'cancelada'
  return persistir(bd, reserva)
}

export async function decidirReserva(
  bdActual: BaseDatos,
  reservaId: string,
  decision: 'confirmada' | 'rechazada',
  motivoRechazo?: string,
): Promise<Resultado<Reserva>> {
  await esperar()
  const bd = clonar(bdActual)
  const reserva = bd.reservas.find((r) => r.id === reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  if (reserva.estado !== 'solicitada') {
    throw new ErrorDeNegocio('Solo se pueden decidir reservas en estado solicitada.')
  }
  reserva.estado = decision
  if (decision === 'rechazada') reserva.motivoRechazo = motivoRechazo || 'Sin motivo registrado'
  return persistir(bd, reserva)
}

// ---------------------------------------------------------------------------
// CU-R-07 / CU-R-08 / CU-A-07 — PQRS
// ---------------------------------------------------------------------------

export async function crearPqrs(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    unidadId: string
    personaId: string
    tipo: TipoPqrs
    categoria: CategoriaPqrs
    asunto: string
    descripcion: string
  },
): Promise<Resultado<Pqrs>> {
  await esperar()
  const bd = clonar(bdActual)
  const hoy = hoyISO()
  const consecutivo = bd.consecutivos.pqrs

  const pqrs: Pqrs = {
    id: nuevoId('pqr'),
    // RN-12: radicado consecutivo por copropiedad.
    radicado: `PQRS-${hoy.slice(0, 4)}-${String(consecutivo).padStart(4, '0')}`,
    copropiedadId: parametros.copropiedadId,
    unidadId: parametros.unidadId,
    personaId: parametros.personaId,
    tipo: parametros.tipo,
    categoria: parametros.categoria,
    asunto: parametros.asunto,
    descripcion: parametros.descripcion,
    estado: 'abierta',
    fechaRadicacion: ahoraISO(),
    // RN-13: SLA de 15 dias calendario.
    fechaLimite: calcularFechaLimite(hoy),
    mensajes: [],
  }

  bd.pqrs.unshift(pqrs)
  bd.consecutivos.pqrs = consecutivo + 1
  return persistir(bd, pqrs)
}

export async function responderPqrs(
  bdActual: BaseDatos,
  parametros: {
    pqrsId: string
    autor: 'residente' | 'administracion'
    autorNombre: string
    texto: string
  },
): Promise<Resultado<Pqrs>> {
  await esperar()
  const bd = clonar(bdActual)
  const pqrs = bd.pqrs.find((p) => p.id === parametros.pqrsId)
  if (!pqrs) throw new ErrorDeNegocio('La PQRS no existe.')
  if (pqrs.estado === 'cerrada') throw new ErrorDeNegocio('La PQRS esta cerrada.')

  pqrs.mensajes.push({
    id: nuevoId('msg'),
    autor: parametros.autor,
    autorNombre: parametros.autorNombre,
    texto: parametros.texto,
    fecha: ahoraISO(),
  })

  // RN-24: la primera respuesta de la administracion pasa la PQRS a en_gestion.
  if (parametros.autor === 'administracion' && pqrs.estado === 'abierta') {
    pqrs.estado = 'en_gestion'
  }

  return persistir(bd, pqrs)
}

export async function cambiarEstadoPqrs(
  bdActual: BaseDatos,
  pqrsId: string,
  estado: Pqrs['estado'],
): Promise<Resultado<Pqrs>> {
  await esperar()
  const bd = clonar(bdActual)
  const pqrs = bd.pqrs.find((p) => p.id === pqrsId)
  if (!pqrs) throw new ErrorDeNegocio('La PQRS no existe.')
  pqrs.estado = estado
  return persistir(bd, pqrs)
}

// ---------------------------------------------------------------------------
// CU-R-09 / CU-A-08 — Comunicados
// ---------------------------------------------------------------------------

export async function publicarComunicado(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    titulo: string
    cuerpo: string
    categoria: CategoriaComunicado
    fijado: boolean
    vigenteHasta?: string
    autor: string
  },
): Promise<Resultado<Comunicado>> {
  await esperar()
  const bd = clonar(bdActual)
  const comunicado: Comunicado = {
    id: nuevoId('com'),
    copropiedadId: parametros.copropiedadId,
    titulo: parametros.titulo,
    cuerpo: parametros.cuerpo,
    categoria: parametros.categoria,
    fijado: parametros.fijado,
    fechaPublicacion: ahoraISO(),
    vigenteHasta: parametros.vigenteHasta,
    autor: parametros.autor,
    leidoPor: [],
  }
  bd.comunicados.unshift(comunicado)
  return persistir(bd, comunicado)
}

export async function marcarComunicadoLeido(
  bdActual: BaseDatos,
  comunicadoId: string,
  personaId: string,
): Promise<Resultado<Comunicado | undefined>> {
  const bd = clonar(bdActual)
  const comunicado = bd.comunicados.find((c) => c.id === comunicadoId)
  if (comunicado && !comunicado.leidoPor.includes(personaId)) {
    comunicado.leidoPor.push(personaId)
  }
  return persistir(bd, comunicado)
}

// ---------------------------------------------------------------------------
// CU-R-11 / CU-A-09 — Correspondencia
// ---------------------------------------------------------------------------

export async function registrarCorrespondencia(
  bdActual: BaseDatos,
  parametros: {
    unidadId: string
    tipo: TipoCorrespondencia
    remitente: string
    observaciones: string
    /** Quien la recibe del mensajero: la porteria de turno (RN-52). */
    registradoPor: string
  },
): Promise<Resultado<Correspondencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro: Correspondencia = {
    id: nuevoId('cor'),
    unidadId: parametros.unidadId,
    tipo: parametros.tipo,
    remitente: parametros.remitente,
    observaciones: parametros.observaciones,
    fechaRecepcion: ahoraISO(),
    registradoPor: parametros.registradoPor,
    estado: 'en_porteria',
  }
  bd.correspondencia.unshift(registro)
  return persistir(bd, registro)
}

export async function entregarCorrespondencia(
  bdActual: BaseDatos,
  correspondenciaId: string,
  recibidoPor: string,
): Promise<Resultado<Correspondencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.correspondencia.find((c) => c.id === correspondenciaId)
  if (!registro) throw new ErrorDeNegocio('El registro no existe.')
  // RN-25: la correspondencia entregada no se edita.
  if (registro.estado === 'entregada') throw new ErrorDeNegocio('Ya fue entregada.')
  registro.estado = 'entregada'
  registro.recibidoPor = recibidoPor
  registro.fechaEntrega = ahoraISO()
  return persistir(bd, registro)
}

// ---------------------------------------------------------------------------
// CU-R-10 — Visitantes
// ---------------------------------------------------------------------------

/** Codigo legible que el visitante presenta en porteria. */
function generarCodigoVisitante(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 5; i += 1) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)]
  }
  return `IDK-${codigo}`
}

export async function crearVisitante(
  bdActual: BaseDatos,
  parametros: {
    unidadId: string
    personaId: string
    nombre: string
    documento: string
    placa?: string
    vigenciaDesde: string
    vigenciaHasta: string
    recurrente: boolean
  },
): Promise<Resultado<Visitante>> {
  await esperar()
  const bd = clonar(bdActual)
  const visitante: Visitante = {
    id: nuevoId('vis'),
    ...parametros,
    codigo: generarCodigoVisitante(),
    estado: 'activo',
    creadoEn: ahoraISO(),
  }
  bd.visitantes.unshift(visitante)
  return persistir(bd, visitante)
}

export async function revocarVisitante(
  bdActual: BaseDatos,
  visitanteId: string,
): Promise<Resultado<Visitante>> {
  await esperar()
  const bd = clonar(bdActual)
  const visitante = bd.visitantes.find((v) => v.id === visitanteId)
  if (!visitante) throw new ErrorDeNegocio('El visitante no existe.')
  visitante.estado = 'revocado'
  return persistir(bd, visitante)
}

// ---------------------------------------------------------------------------
// CU-A-02 — Unidades y residentes
// ---------------------------------------------------------------------------

export async function vincularResidente(
  bdActual: BaseDatos,
  parametros: {
    unidadId: string
    nombres: string
    apellidos: string
    documento: string
    email: string
    telefono: string
    rol: RolResidencia
  },
): Promise<Resultado<Residencia>> {
  await esperar()
  const bd = clonar(bdActual)

  let persona = bd.personas.find((p) => p.documento === parametros.documento)
  if (!persona) {
    persona = {
      id: nuevoId('per'),
      nombres: parametros.nombres,
      apellidos: parametros.apellidos,
      documento: parametros.documento,
      email: parametros.email,
      telefono: parametros.telefono,
    }
    bd.personas.push(persona)
  }

  const yaVinculada = bd.residencias.some(
    (r) => r.unidadId === parametros.unidadId && r.personaId === persona!.id && !r.hasta,
  )
  if (yaVinculada) throw new ErrorDeNegocio('Esa persona ya esta vinculada a la unidad.')

  const residencia: Residencia = {
    id: nuevoId('res'),
    personaId: persona.id,
    unidadId: parametros.unidadId,
    rol: parametros.rol,
    desde: hoyISO(),
    principal: false,
    // Por la via directa del administrador se asume que vive ahi; el caso del
    // propietario no residente se marca en el registro (CU-R-27).
    reside: true,
  }
  bd.residencias.push(residencia)
  return persistir(bd, residencia)
}

/** Cierra el vinculo de un residente sin borrar el historico (trazabilidad, O3). */
export async function desvincularResidente(
  bdActual: BaseDatos,
  residenciaId: string,
): Promise<Resultado<Residencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const residencia = bd.residencias.find((r) => r.id === residenciaId)
  if (!residencia) throw new ErrorDeNegocio('El vinculo no existe.')
  residencia.hasta = hoyISO()
  return persistir(bd, residencia)
}

// ---------------------------------------------------------------------------
// CU-A-22 — El catalogo de multas
//
// **El administrador parametriza, no decide** (Mary, 2026-09-08): las multas las
// define la asamblea, o ya estan en el reglamento o el manual de convivencia.
// Estas operaciones trasladan al sistema lo que esos documentos dicen.
// ---------------------------------------------------------------------------

export async function crearConceptoSancion(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    nombre: string
    descripcion: string
    valor: number
    origen: OrigenRespaldo
    referencia: string
    documento?: string
    reincidencia?: Reincidencia
  },
): Promise<Resultado<ConceptoSancion>> {
  await esperar()
  const bd = clonar(bdActual)

  // RN-38: sin respaldo comprobable el concepto no existe. Se valida aqui y no
  // solo en el formulario, porque el formulario es una comodidad y esto es la
  // condicion para que la multa se pueda cobrar.
  if (!respaldoCompleto(parametros)) {
    throw new ErrorDeNegocio(
      parametros.origen === 'otro'
        ? 'Di cuál es el documento y dónde lo dice: sin eso el respaldo no se puede comprobar.'
        : 'Falta la referencia: el artículo o la fecha del acta que autoriza esta multa.',
    )
  }
  if (parametros.valor <= 0) {
    throw new ErrorDeNegocio('El valor de la multa tiene que ser mayor que cero.')
  }

  // RN-72: agravar es sancionar mas duro, asi que el aumento necesita su propio
  // respaldo — el mismo examen que la multa base, y por la misma razon.
  const reincidencia = parametros.reincidencia
  if (reincidencia) {
    if (!respaldoCompleto(reincidencia)) {
      throw new ErrorDeNegocio(
        'Di dónde dice que la multa sube cuando la conducta se repite: sin eso el aumento no se puede comprobar.',
      )
    }
    if (reincidencia.valor <= parametros.valor) {
      throw new ErrorDeNegocio(
        'El valor por reincidencia tiene que ser mayor que el de la primera vez. Si no sube, no hay nada que parametrizar.',
      )
    }
  }

  const repetido = bd.conceptosSancion.some(
    (concepto) =>
      concepto.copropiedadId === parametros.copropiedadId &&
      concepto.activo &&
      concepto.nombre.trim().toLowerCase() === parametros.nombre.trim().toLowerCase(),
  )
  if (repetido) {
    throw new ErrorDeNegocio('Ya hay una multa activa con ese nombre.')
  }

  const concepto: ConceptoSancion = {
    id: nuevoId('cs'),
    ...parametros,
    nombre: parametros.nombre.trim(),
    descripcion: parametros.descripcion.trim(),
    referencia: parametros.referencia.trim(),
    documento: parametros.documento?.trim() || undefined,
    reincidencia: reincidencia
      ? {
          ...reincidencia,
          referencia: reincidencia.referencia.trim(),
          documento: reincidencia.documento?.trim() || undefined,
        }
      : undefined,
    activo: true,
    creadoEn: ahoraISO(),
  }
  bd.conceptosSancion.push(concepto)
  return persistir(bd, concepto)
}

/**
 * RN-40 — Un concepto no se borra: se desactiva.
 *
 * Las multas impuestas lo referencian, y una multa que apunta a un concepto que
 * ya no existe es una multa que nadie puede explicar. Reactivar tambien es
 * posible: un concepto se da de baja porque el documento cambio, y a veces el
 * cambio se revierte.
 */
export async function cambiarEstadoConceptoSancion(
  bdActual: BaseDatos,
  parametros: { conceptoId: string; activo: boolean },
): Promise<Resultado<ConceptoSancion>> {
  await esperar()
  const bd = clonar(bdActual)
  const concepto = bd.conceptosSancion.find((c) => c.id === parametros.conceptoId)
  if (!concepto) throw new ErrorDeNegocio('Ese concepto no existe.')

  concepto.activo = parametros.activo
  concepto.inactivoDesde = parametros.activo ? undefined : hoyISO()
  return persistir(bd, concepto)
}

// ---------------------------------------------------------------------------
// CU-A-23 / CU-R-29 — El proceso sancionatorio
//
// **Cada paso deja su actuacion.** No es un historial decorativo: si alguien
// discute la multa, lo que se revisa es si se le notifico, si tuvo plazo, si lo
// oyeron y si pudo impugnar. Por eso las actuaciones se escriben aqui y no en la
// pantalla — una pantalla que se olvide de anotar deja un expediente que no
// prueba nada.
// ---------------------------------------------------------------------------

function anotar(
  sancion: Sancion,
  autor: AutorActuacion,
  titulo: string,
  texto?: string,
  personaId?: string,
): void {
  sancion.actuaciones.push({
    id: nuevoId('act'),
    fecha: ahoraISO(),
    autor,
    personaId,
    titulo,
    texto,
  })
}

export async function imponerSancion(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    unidadId: string
    conceptoId: string
    hechos: string
    impuestaPor: string
  },
): Promise<Resultado<Sancion>> {
  await esperar()
  const bd = clonar(bdActual)

  const concepto = bd.conceptosSancion.find((c) => c.id === parametros.conceptoId)
  if (!concepto) throw new ErrorDeNegocio('Esa multa no está en el catálogo.')
  // RN-38: solo se impone lo que el catalogo tiene vigente. Una multa inhabilitada
  // perdio su respaldo, y sancionar con ella seria sancionar sin norma.
  if (!concepto.activo) {
    throw new ErrorDeNegocio('Esa multa está inhabilitada: ya no se puede imponer.')
  }
  if (parametros.hechos.trim().length < 20) {
    throw new ErrorDeNegocio(
      'Describe los hechos: qué pasó, cuándo y dónde. Es lo que se le notifica y lo que puede controvertir.',
    )
  }

  // RN-72: la reincidencia se cuenta sobre sanciones **en firme**, y solo agrava
  // si el catalogo la tiene parametrizada. Sin documento que lo diga, la multa
  // no sube por muchas veces que se repita la conducta.
  const copropiedad = bd.copropiedades.find((c) => c.id === parametros.copropiedadId)
  const vecesPrevias = vecesSancionada(
    bd.sanciones,
    parametros.unidadId,
    concepto.id,
    copropiedad?.mesesReincidencia ?? 12,
  )
  const aplicable = multaAplicable(concepto, vecesPrevias)

  const consecutivo = bd.consecutivos.sancion + 1
  bd.consecutivos.sancion = consecutivo

  const sancion: Sancion = {
    id: nuevoId('san'),
    copropiedadId: parametros.copropiedadId,
    unidadId: parametros.unidadId,
    conceptoId: concepto.id,
    // Se copian, como el coeficiente (RN-37): si manana el catalogo cambia, este
    // expediente sigue diciendo por que y por cuanto se sanciono.
    concepto: concepto.nombre,
    valor: aplicable.valor,
    respaldo: aplicable.respaldo,
    ...(aplicable.reincidencia ? { reincidencia: true } : {}),
    hechos: parametros.hechos.trim(),
    estado: 'notificada',
    radicado: `SAN-${new Date().getFullYear()}-${String(consecutivo).padStart(4, '0')}`,
    impuestaPor: parametros.impuestaPor,
    fechaImposicion: ahoraISO(),
    // El plazo se COPIA del parametro. Si el reglamento cambia manana, este
    // expediente conserva el termino que se le notifico (RN-69).
    limiteDescargos: sumarDias(hoyISO(), copropiedad?.diasDescargos ?? 10),
    actuaciones: [],
  }
  anotar(
    sancion,
    'administracion',
    'Se notificó la apertura del proceso',
    aplicable.reincidencia
      ? `Se le comunicaron los hechos y el plazo para presentar descargos. Es la vez ${vecesPrevias + 1} que se sanciona esta conducta en la unidad dentro del término de reincidencia, así que aplica el valor agravado que fija ${aplicable.respaldo}.`
      : `Se le comunicaron los hechos, la norma que los sanciona (${aplicable.respaldo}) y el plazo para presentar descargos.`,
    parametros.impuestaPor,
  )
  bd.sanciones.unshift(sancion)
  return persistir(bd, sancion)
}

/** RN-69 — El copropietario es oido. Es el nucleo del debido proceso. */
export async function presentarDescargos(
  bdActual: BaseDatos,
  parametros: { sancionId: string; personaId: string; texto: string },
): Promise<Resultado<Sancion>> {
  await esperar()
  const bd = clonar(bdActual)
  const sancion = bd.sanciones.find((s) => s.id === parametros.sancionId)
  if (!sancion) throw new ErrorDeNegocio('Ese proceso no existe.')
  if (!puedePresentarDescargos(sancion)) {
    throw new ErrorDeNegocio('El plazo para presentar descargos ya pasó.')
  }
  if (parametros.texto.trim().length < 10) {
    throw new ErrorDeNegocio('Escribe tus descargos: es lo que la administración va a estudiar.')
  }

  sancion.estado = 'en_estudio'
  anotar(sancion, 'copropietario', 'Presentó descargos', parametros.texto.trim(), parametros.personaId)
  return persistir(bd, sancion)
}

/**
 * La administracion decide: sanciona o archiva.
 *
 * **Archivar no es borrar** (RN-61): el expediente queda con su motivo. Un
 * proceso que se archiva sin dejar rastro es un proceso que despues nadie puede
 * revisar — ni para bien ni para mal.
 */
export async function resolverSancion(
  bdActual: BaseDatos,
  parametros: {
    sancionId: string
    personaId: string
    sanciona: boolean
    motivo: string
  },
): Promise<Resultado<Sancion>> {
  await esperar()
  const bd = clonar(bdActual)
  const sancion = bd.sanciones.find((s) => s.id === parametros.sancionId)
  if (!sancion) throw new ErrorDeNegocio('Ese proceso no existe.')
  if (sancion.estado !== 'notificada' && sancion.estado !== 'en_estudio') {
    throw new ErrorDeNegocio('Ese proceso ya no está para resolver.')
  }
  if (parametros.motivo.trim().length < 10) {
    throw new ErrorDeNegocio(
      'Escribe la motivación: sin ella la decisión no se puede controvertir.',
    )
  }

  const copropiedad = bd.copropiedades.find((c) => c.id === sancion.copropiedadId)
  sancion.motivo = parametros.motivo.trim()

  if (!parametros.sanciona) {
    sancion.estado = 'archivada'
    anotar(sancion, 'administracion', 'Se archivó el proceso', sancion.motivo, parametros.personaId)
    return persistir(bd, sancion)
  }

  sancion.estado = 'resuelta'
  sancion.limiteImpugnacion = sumarDias(hoyISO(), copropiedad?.diasImpugnacion ?? 5)
  anotar(
    sancion,
    'administracion',
    'Se decidió sancionar',
    `${sancion.motivo} Puede impugnar hasta el ${sancion.limiteImpugnacion}.`,
    parametros.personaId,
  )
  return persistir(bd, sancion)
}

export async function impugnarSancion(
  bdActual: BaseDatos,
  parametros: { sancionId: string; personaId: string; texto: string },
): Promise<Resultado<Sancion>> {
  await esperar()
  const bd = clonar(bdActual)
  const sancion = bd.sanciones.find((s) => s.id === parametros.sancionId)
  if (!sancion) throw new ErrorDeNegocio('Ese proceso no existe.')
  if (!puedeImpugnar(sancion)) {
    throw new ErrorDeNegocio('El plazo para impugnar ya pasó.')
  }
  if (parametros.texto.trim().length < 10) {
    throw new ErrorDeNegocio('Escribe por qué impugnas la decisión.')
  }

  sancion.estado = 'impugnada'
  anotar(sancion, 'copropietario', 'Impugnó la decisión', parametros.texto.trim(), parametros.personaId)
  return persistir(bd, sancion)
}

/**
 * RN-39 — La sancion queda en firme y **ahi nace la cuota**.
 *
 * Es el unico sitio del sistema donde una multa se convierte en plata que se
 * cobra, y esta detras de todo el proceso a proposito.
 */
export async function darFirmezaSancion(
  bdActual: BaseDatos,
  parametros: { sancionId: string; personaId: string; motivo?: string },
): Promise<Resultado<Sancion>> {
  await esperar()
  const bd = clonar(bdActual)
  const sancion = bd.sanciones.find((s) => s.id === parametros.sancionId)
  if (!sancion) throw new ErrorDeNegocio('Ese proceso no existe.')
  if (!puedeQuedarEnFirme(sancion)) {
    throw new ErrorDeNegocio(
      'Todavía no puede quedar en firme: el copropietario está dentro del plazo para impugnar.',
    )
  }

  if (sancion.estado === 'impugnada') {
    anotar(
      sancion,
      'administracion',
      'Se resolvió la impugnación',
      parametros.motivo ?? 'Se mantiene la sanción.',
      parametros.personaId,
    )
  } else {
    anotar(
      sancion,
      'administracion',
      'Quedó en firme',
      'Venció el plazo para impugnar sin que se presentara recurso.',
      parametros.personaId,
    )
  }

  const cuota: Cuota = {
    id: nuevoId('cuo'),
    unidadId: sancion.unidadId,
    periodo: hoyISO().slice(0, 7),
    tipo: 'sancion',
    concepto: `${sancion.concepto} · ${sancion.radicado}`,
    valor: sancion.valor,
    fechaVencimiento: sumarDias(hoyISO(), 30),
    estado: 'pendiente',
  }
  bd.cuotas.push(cuota)

  sancion.estado = 'firme'
  sancion.cuotaId = cuota.id
  anotar(
    sancion,
    'administracion',
    'Se cargó a la cartera de la unidad',
    `Cuota de ${formatearDinero(cuota.valor)} con vencimiento el ${formatearFecha(cuota.fechaVencimiento)}. Cuenta como cualquier otra: vencida, es mora (RN-70).`,
    parametros.personaId,
  )
  return persistir(bd, sancion)
}

// ---------------------------------------------------------------------------
// CU-A-12 / CU-A-17 — Convocar e instalar la asamblea
// ---------------------------------------------------------------------------

/**
 * CU-A-12 — Convocar. **La modalidad decide que se exige** (ADR-0007).
 *
 * Una asamblea virtual sin enlace no dice donde es, y una presencial sin lugar
 * tampoco. Es el mismo examen que el respaldo de un cobro (RN-45): lo que se
 * pide depende de que clase de cosa se esta creando.
 */
export async function convocarAsamblea(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    tipo: TipoAsamblea
    titulo: string
    fechaHora: FechaHoraISO
    modalidad: ModalidadAsamblea
    /** 2 = segunda convocatoria, que sesiona sin minimo de coeficiente (RN-28). */
    numeroConvocatoria?: 1 | 2
    lugar?: string
    enlaceTransmision?: string
    citacion: string
    ordenDelDia: Array<{
      titulo: string
      descripcion: string
      seVota: boolean
      mayoria?: MayoriaExigida
    }>
  },
): Promise<Resultado<Asamblea>> {
  await esperar()
  const bd = clonar(bdActual)

  if (!convocatoriaCompleta(parametros)) {
    const definicion = definicionModalidad(parametros.modalidad)
    throw new ErrorDeNegocio(
      definicion.exigeLugar && !parametros.lugar?.trim()
        ? 'Falta el lugar: una asamblea presencial tiene que decir dónde es.'
        : 'Falta el enlace de la reunión: es donde se van a encontrar (ADR-0007).',
    )
  }
  if (parametros.ordenDelDia.length === 0) {
    throw new ErrorDeNegocio('Una convocatoria sin orden del día no convoca a nada.')
  }

  const asamblea: Asamblea = {
    id: nuevoId('asa'),
    copropiedadId: parametros.copropiedadId,
    tipo: parametros.tipo,
    titulo: parametros.titulo.trim(),
    fechaHora: parametros.fechaHora,
    modalidad: parametros.modalidad,
    numeroConvocatoria: parametros.numeroConvocatoria ?? 1,
    lugar: parametros.lugar?.trim() || undefined,
    enlaceTransmision: parametros.enlaceTransmision?.trim() || undefined,
    citacion: parametros.citacion.trim(),
    ordenDelDia: parametros.ordenDelDia.map((punto, i) => ({
      id: nuevoId('pto'),
      orden: i + 1,
      titulo: punto.titulo.trim(),
      descripcion: punto.descripcion.trim(),
      seVota: punto.seVota,
      ...(punto.mayoria ? { mayoria: punto.mayoria } : {}),
    })),
    estado: 'convocada',
  }
  bd.asambleas.push(asamblea)
  return persistir(bd, asamblea)
}

/**
 * CU-A-17 — Instalar, cerrar o cancelar. **Nunca borrar** (RN-61).
 *
 * Instalar es lo que abre la sala: desde ahi se marca asistencia y se pueden
 * abrir votaciones. Cerrar no deshace nada — la asamblea cerrada conserva su
 * asistencia y sus votos, que es de lo que sale el acta.
 */
export async function cambiarEstadoAsamblea(
  bdActual: BaseDatos,
  parametros: { asambleaId: string; estado: EstadoAsamblea },
): Promise<Resultado<Asamblea>> {
  await esperar()
  const bd = clonar(bdActual)
  const asamblea = bd.asambleas.find((a) => a.id === parametros.asambleaId)
  if (!asamblea) throw new ErrorDeNegocio('Esa asamblea no existe.')

  const permitido: Record<EstadoAsamblea, EstadoAsamblea[]> = {
    convocada: ['instalada', 'cancelada'],
    instalada: ['cerrada'],
    cerrada: [],
    cancelada: [],
  }
  if (!permitido[asamblea.estado].includes(parametros.estado)) {
    throw new ErrorDeNegocio(
      `Una asamblea ${asamblea.estado} no puede pasar a ${parametros.estado}.`,
    )
  }

  asamblea.estado = parametros.estado
  return persistir(bd, asamblea)
}

// ---------------------------------------------------------------------------
// ADR-0007 — Asistencia a la asamblea
//
// Es la constante de las tres modalidades: en el salon se marca en la puerta, en
// la virtual al entrar por el enlace, y en la mixta por los dos lados sumando al
// mismo total. **La lista de asistentes de Zoom no reemplaza esto**: no conoce
// unidades ni coeficientes, y el quorum se mide en coeficientes (RN-28).
// ---------------------------------------------------------------------------

/**
 * Lo que las dos puertas del poder tienen que comprobar igual.
 *
 * Vive aparte para que **no se separen con el tiempo**: si manana cambia quien
 * puede otorgar, o la regla de una unidad un representante, tiene que cambiar en
 * los dos caminos a la vez o uno se vuelve el hueco por donde se cuela lo que el
 * otro impide.
 *
 * Devuelve tambien **el usuario temporal de asamblea**, creado o reutilizado:
 * es la parte que ninguna de las dos puertas puede hacer distinto (RN-61).
 */
function prepararPoder(
  bd: BaseDatos,
  parametros: {
    asambleaId: string
    unidadId: string
    nombresApoderado: string
    apellidosApoderado: string
    documentoApoderado: string
    telefonoApoderado?: string
    /** Si viene, ese es el propietario que tiene que estar otorgando. */
    exigirPropietario?: string
  },
): { asamblea: Asamblea; unidad: Unidad; apoderado: Persona; otorgadoPor: string } {
  const asamblea = bd.asambleas.find((a) => a.id === parametros.asambleaId)
  if (!asamblea) throw new ErrorDeNegocio('Esa asamblea no existe.')
  if (asamblea.estado === 'cerrada' || asamblea.estado === 'cancelada') {
    throw new ErrorDeNegocio('Esa asamblea ya terminó: no admite poderes nuevos.')
  }

  const unidad = bd.unidades.find((u) => u.id === parametros.unidadId)
  if (!unidad) throw new ErrorDeNegocio('Esa unidad no existe.')

  // **Quien otorga es el propietario** (RN-51): el arrendatario no puede ceder
  // un voto que no tiene.
  const propietario = bd.residencias.find(
    (r) =>
      r.unidadId === unidad.id &&
      r.rol === 'propietario' &&
      residenciaVigente(r) &&
      (!parametros.exigirPropietario || r.personaId === parametros.exigirPropietario),
  )
  if (!propietario) {
    throw new ErrorDeNegocio(
      parametros.exigirPropietario
        ? 'Solo el propietario de la unidad puede otorgar un poder sobre ella.'
        : 'Esa unidad no tiene un propietario registrado que pueda dar poder.',
    )
  }

  const documento = parametros.documentoApoderado.trim()
  if (documento.length < 5) throw new ErrorDeNegocio('Falta el documento del apoderado.')
  if (parametros.nombresApoderado.trim().length < 2) {
    throw new ErrorDeNegocio('Falta el nombre del apoderado.')
  }

  const dueno = bd.personas.find((p) => p.id === propietario.personaId)
  if (dueno && dueno.documento === documento) {
    throw new ErrorDeNegocio('No hace falta un poder para votar por su propia unidad.')
  }

  // Una unidad, un representante (RN-28, RN-29).
  if (poderDeUnidad(bd.poderes, parametros.asambleaId, parametros.unidadId)) {
    throw new ErrorDeNegocio(
      'Esa unidad ya tiene un poder vigente en esta asamblea. Hay que revocarlo antes de dar otro.',
    )
  }

  // **El usuario temporal de asamblea.** Reutilizado por documento (RN-61):
  // un documento es una persona, no una fila por formulario.
  const existente = bd.personas.find((p) => p.documento === documento)
  // `Persona` exige correo y telefono, y de un apoderado externo puede no
  // haberlos. Se guardan vacios en vez de inventarlos: un correo falso es peor
  // que un correo ausente el dia que haya que escribirle.
  const apoderado: Persona = existente ?? {
    id: nuevoId('per'),
    nombres: parametros.nombresApoderado.trim(),
    apellidos: parametros.apellidosApoderado.trim(),
    documento,
    email: '',
    telefono: parametros.telefonoApoderado?.trim() ?? '',
  }
  if (!existente) bd.personas.push(apoderado)

  return { asamblea, unidad, apoderado, otorgadoPor: propietario.personaId }
}

/**
 * CU-A-19 — El administrador registra un poder y crea a quien lo ejerce (RN-30).
 *
 * **El poder se otorga fuera de la aplicacion** (Mary, 2026-09-10): ante notario
 * o de puno y letra. Idiky no puede exigirle al mundo que use Idiky, asi que lo
 * que hace es recibirlo — el administrador lo valida, adjunta el papel y da de
 * alta a quien lo ejerce.
 *
 * **Tres cosas pasan de una vez, y por eso viven en una sola operacion:**
 *
 * 1. Se crea el **usuario temporal de asamblea** si el apoderado no existe
 *    (Mary, 2026-09-10). Si su documento ya esta, **se reutiliza la persona**:
 *    la misma regla del registro de personas (RN-61), y por lo mismo — un
 *    documento es una persona, no una fila por formulario.
 *
 *    «Temporal» no es un campo ni un estado: es que **su unica vinculacion con
 *    la copropiedad es este poder**, y el poder muere con la asamblea. Lo que
 *    caduca por construccion no hay que acordarse de apagarlo.
 * 2. Se guarda **el papel**, fotografiado (ADR-0009). Un voto impugnado sin el
 *    poder que lo respalda se cae.
 * 3. Queda validado. **Registrarlo es validarlo**: quien adjunta el papel es
 *    quien lo tuvo en la mano, y no hay nadie mas en el flujo.
 *
 * Lo que esta operacion **no** comprueba, y hay que decir por que: **el tope**
 * de unidades que un apoderado puede acumular. **La Ley 675 no lo fija** —
 * revisado el 2026-09-10—; lo puede fijar el reglamento, y este no lo ha hecho.
 * En vez de inventar un numero, la pantalla **pone el acumulado delante** de
 * quien registra (RN-30).
 */
export async function registrarPoder(
  bdActual: BaseDatos,
  parametros: {
    asambleaId: string
    unidadId: string
    nombresApoderado: string
    apellidosApoderado: string
    documentoApoderado: string
    /** Para avisarle que quedo registrado. Un externo puede no tenerlo. */
    telefonoApoderado?: string
    imagen: string
    registradoPor: string
  },
): Promise<Resultado<Poder>> {
  await esperar()
  const bd = clonar(bdActual)

  // La decision de Mary (2026-09-10): por esta puerta, el poder va con su papel.
  // Se comprueba **antes** que lo demas porque es lo que la distingue: sin foto
  // no hay nada que registrar.
  if (!parametros.imagen) {
    throw new ErrorDeNegocio('Falta la foto del poder firmado: sin ella el poder no se registra.')
  }

  const { unidad, apoderado, otorgadoPor } = prepararPoder(bd, parametros)

  const poder: Poder = {
    id: nuevoId('pod'),
    asambleaId: parametros.asambleaId,
    unidadId: unidad.id,
    otorgadoPor,
    apoderadoId: apoderado.id,
    origen: 'papel',
    soporte: { imagen: parametros.imagen, adjuntadoEn: ahoraISO() },
    registradoPor: parametros.registradoPor,
    registradoEn: ahoraISO(),
  }
  bd.poderes.push(poder)
  return persistir(bd, poder)
}

/**
 * CU-R-23 — El propietario otorga un poder **desde su app** (RN-30).
 *
 * Mary, 2026-09-10: *«me gusta la opción de que el propietario lo haga en la
 * app»*. Es la otra puerta al mismo sitio, y lo que cambia es **que la
 * respalda**: aqui no hay papel firmado, hay **una sesion autenticada**. El
 * propietario esta cediendo un voto que es suyo, y eso es lo que le da validez
 * — la misma logica por la que registrar el papel *es* validarlo cuando lo hace
 * quien lo tuvo en la mano.
 *
 * **Idiky emite el documento** con su consecutivo y su codigo de verificacion
 * (RN-36, ADR-0006), para que el apoderado tenga algo que mostrar. Lo que **no**
 * hace es fingir una descarga: el PDF lo genera el servidor y el servidor no
 * existe todavia (ADR-0008). Igual que el paz y salvo.
 *
 * **Lo que sigue abierto es juridico, no tecnico:** si la ley exige documento
 * escrito y firmado, esta puerta no basta por si sola (§3 bis). Por eso la de
 * papel no se quita.
 */
export async function otorgarPoder(
  bdActual: BaseDatos,
  parametros: {
    asambleaId: string
    unidadId: string
    otorgadoPor: string
    nombresApoderado: string
    apellidosApoderado: string
    documentoApoderado: string
    telefonoApoderado?: string
  },
): Promise<Resultado<Poder>> {
  await esperar()
  const bd = clonar(bdActual)

  const { asamblea, unidad, apoderado } = prepararPoder(bd, {
    ...parametros,
    // Aqui si importa **quien** lo otorga: tiene que ser el propietario que esta
    // en la sesion, no cualquier propietario de la unidad.
    exigirPropietario: parametros.otorgadoPor,
  })

  // El documento del poder, con su consecutivo y su codigo (RN-36, ADR-0006).
  const consecutivo = bd.consecutivos.poder
  const hoy = hoyISO()
  const documento: Documento = {
    id: nuevoId('doc'),
    tipo: 'poder',
    numero: `POD-${hoy.slice(0, 4)}-${String(consecutivo).padStart(4, '0')}`,
    codigoVerificacion: nuevoCodigoVerificacion(),
    copropiedadId: asamblea.copropiedadId,
    unidadId: unidad.id,
    asambleaId: asamblea.id,
    emitidoEn: hoy,
    estado: 'vigente',
  }
  bd.documentos.push(documento)
  bd.consecutivos.poder = consecutivo + 1

  const poder: Poder = {
    id: nuevoId('pod'),
    asambleaId: parametros.asambleaId,
    unidadId: unidad.id,
    otorgadoPor: parametros.otorgadoPor,
    apoderadoId: apoderado.id,
    origen: 'app',
    documentoId: documento.id,
    registradoPor: parametros.otorgadoPor,
    registradoEn: ahoraISO(),
  }
  bd.poderes.push(poder)
  return persistir(bd, poder)
}

/** RN-61 — Un poder no se borra: se revoca, y queda en el expediente. */
export async function revocarPoder(
  bdActual: BaseDatos,
  parametros: { poderId: string },
): Promise<Resultado<Poder>> {
  await esperar()
  const bd = clonar(bdActual)
  const poder = bd.poderes.find((p) => p.id === parametros.poderId)
  if (!poder) throw new ErrorDeNegocio('Ese poder no existe.')
  if (poder.revocadoEn) throw new ErrorDeNegocio('Ese poder ya estaba revocado.')

  poder.revocadoEn = ahoraISO()
  // Si Idiky emitio el documento, se anula con el: un poder revocado cuyo papel
  // sigue diciendo «vigente» es exactamente lo que alguien presentaria.
  if (poder.documentoId) {
    const documento = bd.documentos.find((d) => d.id === poder.documentoId)
    if (documento) documento.estado = 'anulado'
  }
  return persistir(bd, poder)
}

export async function marcarAsistencia(
  bdActual: BaseDatos,
  parametros: {
    asambleaId: string
    unidadId: string
    personaId: string
    forma: FormaAsistencia
    /** Cuando la unidad viene representada (RN-30). */
    poderId?: string
  },
): Promise<Resultado<Asistencia>> {
  await esperar()
  const bd = clonar(bdActual)

  const asamblea = bd.asambleas.find((a) => a.id === parametros.asambleaId)
  if (!asamblea) throw new ErrorDeNegocio('Esa asamblea no existe.')
  if (!admiteAsistencia(asamblea)) {
    throw new ErrorDeNegocio(
      'Solo se puede marcar asistencia mientras la asamblea está instalada.',
    )
  }
  // La forma tiene que caber en la modalidad: no se «asiste presencialmente» a
  // una asamblea que se hace solo por Meet (ADR-0007).
  if (!formasDeAsistir(asamblea.modalidad).includes(parametros.forma)) {
    throw new ErrorDeNegocio('Esa forma de asistir no corresponde a la modalidad de la asamblea.')
  }

  const unidad = bd.unidades.find((u) => u.id === parametros.unidadId)
  if (!unidad) throw new ErrorDeNegocio('Esa unidad no existe.')

  // **Asiste la unidad, no la persona** (RN-27): dos copropietarios del mismo
  // apartamento no suman dos veces. Si vuelve a marcar, se corrige la forma en
  // vez de duplicar — cambiar de la sala al salon es normal en una mixta.
  const previa = bd.asistencias.find(
    (a) => a.asambleaId === parametros.asambleaId && a.unidadId === parametros.unidadId,
  )
  if (previa) {
    previa.forma = parametros.forma
    previa.personaId = parametros.personaId
    previa.poderId = parametros.poderId
    return persistir(bd, previa)
  }

  const asistencia: Asistencia = {
    id: nuevoId('asi'),
    asambleaId: parametros.asambleaId,
    unidadId: parametros.unidadId,
    personaId: parametros.personaId,
    forma: parametros.forma,
    ...(parametros.poderId ? { poderId: parametros.poderId } : {}),
    // Copiado al marcar, como el voto (RN-37).
    coeficiente: unidad.coeficiente,
    registradaEn: ahoraISO(),
  }
  bd.asistencias.push(asistencia)
  return persistir(bd, asistencia)
}

// ---------------------------------------------------------------------------
// CU-R-27 / CU-R-28 — Registrar una persona en la unidad
//
// Cuatro operaciones porque son cuatro momentos, y entre uno y otro pasa tiempo
// real: se registra hoy, la persona adjunta esta noche, se autoriza manana.
// ---------------------------------------------------------------------------

/**
 * Le avisa a la persona por mensaje de texto (RN-64).
 *
 * Vive aqui, en el repositorio, y no en la pantalla: **el aviso es parte de
 * autorizar**, no algo que la interfaz recuerde hacer despues. Si dependiera de
 * que cada pantalla lo llame, la primera que se olvide deja a alguien esperando
 * un mensaje que nunca sale.
 *
 * Sin celular no hay mensaje, y eso no es un error: la persona se entera por
 * quien la registro. La pantalla lo dice para que nadie se quede esperando.
 */
function avisar(
  bd: BaseDatos,
  registro: RegistroPersona,
  motivo: MotivoMensaje,
  visitante?: Visitante,
): void {
  const copropiedad = bd.copropiedades.find((c) => c.id === registro.copropiedadId)
  const unidad = bd.unidades.find((u) => u.id === registro.unidadId)
  const datos = {
    registro,
    copropiedad: copropiedad?.nombre ?? 'la copropiedad',
    unidad: unidad ? `${unidad.torre}, ${unidad.tipo} ${unidad.numero}` : 'tu unidad',
    visitante,
  }
  const mensaje = redactar({
    id: nuevoId('msj'),
    copropiedadId: registro.copropiedadId,
    destino: registro.telefono,
    texto: motivo === 'registro_autorizado' ? textoAutorizacion(datos) : textoRechazo(datos),
    motivo,
    registroId: registro.id,
    ahora: ahoraISO(),
  })
  if (mensaje) bd.mensajes.unshift(mensaje)
}

/**
 * Codigo con el que la persona registrada abre su registro para adjuntar.
 *
 * Mismo alfabeto sin ambiguedades que los documentos formales: se dicta por
 * telefono o por WhatsApp, y una O que se lee como cero manda a la persona a
 * llamar a quien la registro.
 */
function nuevoCodigoRegistro(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = 'REG-'
  for (let i = 0; i < 5; i += 1) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)]
  }
  return codigo
}

export async function crearRegistroPersona(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    unidadId: string
    creadoPor: string
    categoria: CategoriaRegistro
    rol?: RolResidencia
    /** La marca de residente (RN-68). */
    reside?: boolean
    nombres: string
    apellidos: string
    documento: string
    email: string
    telefono: string
    vigenciaDesde?: string
    vigenciaHasta?: string
    placa?: string
  },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)

  // RN-62: la vigencia no es opcional donde la categoria la exige. Se valida aqui
  // y no solo en el formulario: el formulario es una comodidad, la regla es esto.
  if (exigeVigencia(parametros.categoria) && !parametros.vigenciaHasta) {
    throw new ErrorDeNegocio('Un registro temporal o de visitante necesita fecha de fin.')
  }

  // RN-62: la visita es de un solo dia. Se valida aqui y no solo en el
  // formulario, porque el formulario es una comodidad y esto es la regla.
  if (soloUnDia(parametros.categoria) && parametros.vigenciaDesde !== parametros.vigenciaHasta) {
    throw new ErrorDeNegocio(
      'Una visita se autoriza por un día. Para varios días, registra a la persona como residente temporal.',
    )
  }

  // Solo se bloquean los registros EN CURSO, no los cerrados, y eso es
  // deliberado: **rehabilitar a alguien es volver a registrarlo**, no deshacer la
  // inhabilitacion (RN-61). Si sus fotos ya se eliminaron por plazo, el tramite
  // se las vuelve a pedir — que es justo lo que debe pasar (Mary, 2026-09-07).
  //
  // Dos registros en curso para el mismo documento en la misma unidad, en cambio,
  // son la forma de que despues nadie sepa cual autorizo.
  const enCurso = bd.registros.find(
    (registro) =>
      registro.unidadId === parametros.unidadId &&
      registro.documento === parametros.documento &&
      (registro.estado === 'esperando_soportes' || registro.estado === 'esperando_autorizacion'),
  )
  if (enCurso) {
    throw new ErrorDeNegocio('Ya hay un registro en curso para ese documento en esta unidad.')
  }

  const ahora = ahoraISO()
  const registro: RegistroPersona = {
    id: nuevoId('reg'),
    ...parametros,
    codigo: nuevoCodigoRegistro(),
    estado: 'esperando_soportes',
    creadoEn: ahora,
  }
  bd.registros.unshift(registro)

  // RN-57: al visitante no se le piden soportes, asi que su registro no espera
  // nada de nadie — se resuelve aqui mismo y sale con su codigo.
  //
  // **Sigue siendo un registro**, y esa es la parte que importa: aunque el
  // tramite sea de un toque, queda escrito quien dejo entrar a quien y cuando.
  // Aliviar el requisito no es renunciar al rastro.
  if (!exigeSoportes(registro.categoria)) {
    const visitante = crearVisitanteDeRegistro(bd, registro)
    registro.visitanteId = visitante.id
    registro.estado = 'autorizado'
    registro.decididoEn = ahora
    registro.decididoPor = registro.creadoPor
    avisar(bd, registro, 'registro_autorizado', visitante)
  }

  return persistir(bd, registro)
}

/** El visitante que sale de un registro. Comparte forma con el que se autoriza. */
function crearVisitanteDeRegistro(bd: BaseDatos, registro: RegistroPersona): Visitante {
  const visitante: Visitante = {
    id: nuevoId('vis'),
    unidadId: registro.unidadId,
    personaId: registro.creadoPor,
    nombre: `${registro.nombres} ${registro.apellidos}`,
    documento: registro.documento,
    placa: registro.placa,
    vigenciaDesde: registro.vigenciaDesde ?? hoyISO(),
    vigenciaHasta: registro.vigenciaHasta ?? hoyISO(),
    codigo: generarCodigoVisitante(),
    recurrente: false,
    estado: 'activo',
    creadoEn: ahoraISO(),
    registroId: registro.id,
  }
  bd.visitantes.unshift(visitante)
  return visitante
}

/**
 * RN-58 — Los soportes los adjunta la persona registrada, no quien la registro.
 *
 * Es la razon de ser del rodeo: una foto del documento que sube un tercero no
 * prueba nada sobre quien la subio. Que la traiga la propia persona, desde su
 * telefono, es lo que convierte el tramite en un soporte.
 */
export async function adjuntarSoportes(
  bdActual: BaseDatos,
  parametros: {
    registroId: string
    fotoDocumento: string
    fotoPersona: string
    /** Version de la politica que la persona acepto (RN-66). */
    consentimiento: string
  },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.registros.find((r) => r.id === parametros.registroId)
  if (!registro) throw new ErrorDeNegocio('Ese registro no existe.')
  if (registro.estado !== 'esperando_soportes') {
    throw new ErrorDeNegocio('Ese registro ya no está esperando soportes.')
  }

  // RN-66: sin autorizacion no se guarda la foto de una cedula. Se valida aqui y
  // no solo en la casilla del formulario, porque la casilla es de la pantalla y
  // esto es la condicion para poder tratar el dato.
  if (!parametros.consentimiento) {
    throw new ErrorDeNegocio('Falta la autorización de tratamiento de datos.')
  }

  const ahora = ahoraISO()
  registro.consentimiento = { version: parametros.consentimiento, aceptadoEn: ahora }
  registro.fotoDocumento = { imagen: parametros.fotoDocumento, adjuntadoEn: ahora }
  registro.fotoPersona = { imagen: parametros.fotoPersona, adjuntadoEn: ahora }
  registro.soportesEn = ahora
  registro.estado = 'esperando_autorizacion'
  return persistir(bd, registro)
}

/**
 * RN-59 — La autorizacion es lo que crea el vinculo o el visitante.
 *
 * Hasta aqui no existia nada: habia una solicitud con unas fotos. Este es el
 * acto que la convierte en alguien que puede entrar, y por eso deja constancia
 * de quien lo hizo y cuando.
 */
export async function autorizarRegistro(
  bdActual: BaseDatos,
  parametros: { registroId: string; personaId: string },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.registros.find((r) => r.id === parametros.registroId)
  if (!registro) throw new ErrorDeNegocio('Ese registro no existe.')
  if (!puedeAutorizar(registro, parametros.personaId)) {
    throw new ErrorDeNegocio('Solo quien creó el registro puede autorizarlo.')
  }
  if (!soportesCompletos(registro)) {
    throw new ErrorDeNegocio('Faltan los soportes: no se puede autorizar sin las dos fotos.')
  }

  // La persona puede existir ya, y se reutiliza **por documento** — que es lo
  // unico que no cambia.
  //
  // Es lo que sostiene RN-61: «el residente puede pasarse a vivir a otro edificio
  // que opere Idiky, por eso lo de inhabilitar nada mas» (Mary, 2026-09-07).
  // Inhabilitar cierra el vinculo con **esta** unidad; la persona sigue
  // existiendo y llega a la siguiente con su historia. Por eso la busqueda no se
  // limita a la copropiedad: quien se muda de un conjunto a otro es la misma
  // persona, no una nueva.
  let persona = bd.personas.find((p) => p.documento === registro.documento)
  if (!persona) {
    persona = {
      id: nuevoId('per'),
      nombres: registro.nombres,
      apellidos: registro.apellidos,
      documento: registro.documento,
      email: registro.email,
      telefono: registro.telefono,
    }
    bd.personas.push(persona)
  }

  if (registro.categoria === 'visitante') {
    registro.visitanteId = crearVisitanteDeRegistro(bd, registro).id
  } else {
    const residencia: Residencia = {
      id: nuevoId('res'),
      personaId: persona.id,
      unidadId: registro.unidadId,
      rol: rolDeCategoria(registro.categoria, registro.rol) ?? 'arrendatario',
      desde: registro.vigenciaDesde ?? hoyISO(),
      hasta: registro.vigenciaHasta,
      principal: false,
      // Solo el propietario puede no residir; el arrendatario arrienda para
      // vivir ahi y al temporal se le llama temporal porque vive ahi un tiempo
      // (Mary, 2026-09-07). De ahi que la ausencia del dato signifique «si».
      reside: registro.reside ?? true,
      registroId: registro.id,
    }
    bd.residencias.push(residencia)
    registro.residenciaId = residencia.id
  }

  registro.estado = 'autorizado'
  registro.decididoEn = ahoraISO()
  registro.decididoPor = parametros.personaId
  avisar(bd, registro, 'registro_autorizado', bd.visitantes.find((v) => v.id === registro.visitanteId))
  return persistir(bd, registro)
}

/**
 * Rechazar o retirar un registro. **Nunca se borra** (Mary, 2026-09-07: «no se
 * borran, se inhabilitan»): un registro rechazado es justamente el que hay que
 * poder consultar despues.
 */
export async function cerrarRegistro(
  bdActual: BaseDatos,
  parametros: { registroId: string; personaId: string; motivo: string; anular?: boolean },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.registros.find((r) => r.id === parametros.registroId)
  if (!registro) throw new ErrorDeNegocio('Ese registro no existe.')
  if (registro.creadoPor !== parametros.personaId) {
    throw new ErrorDeNegocio('Solo quien creó el registro puede cerrarlo.')
  }
  if (registro.estado === 'autorizado') {
    throw new ErrorDeNegocio('Ese registro ya fue autorizado: inhabilita a la persona.')
  }
  registro.estado = parametros.anular ? 'anulado' : 'rechazado'
  registro.motivo = parametros.motivo
  registro.decididoEn = ahoraISO()
  registro.decididoPor = parametros.personaId
  // Un registro que se anula antes de que la persona haga nada no le interesa a
  // nadie mas; uno que se rechaza despues de que adjunto, si: estuvo esperando.
  if (!parametros.anular) avisar(bd, registro, 'registro_rechazado')
  return persistir(bd, registro)
}

/**
 * Deja constancia de que alguien miro los soportes de un registro (RN-67).
 *
 * Se llama al **abrirlos**, no al entrar a la pantalla: entrar no es mirar, y una
 * constancia que se dispara por navegar no dice nada de nadie.
 */
export async function registrarAccesoSoportes(
  bdActual: BaseDatos,
  parametros: { registroId: string; personaId: string },
): Promise<Resultado<AccesoSoporte>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.registros.find((r) => r.id === parametros.registroId)
  if (!registro) throw new ErrorDeNegocio('Ese registro no existe.')

  const acceso: AccesoSoporte = {
    id: nuevoId('acc'),
    registroId: parametros.registroId,
    personaId: parametros.personaId,
    vistoEn: ahoraISO(),
  }
  bd.accesosSoportes.unshift(acceso)
  return persistir(bd, acceso)
}

/** Busca un registro por documento y codigo: es como la persona lo abre (RN-58). */
export function registroPorCodigo(
  bd: BaseDatos,
  documento: string,
  codigo: string,
): RegistroPersona | undefined {
  const limpio = (valor: string) => valor.replace(/[\s.,-]/g, '').toUpperCase()
  return bd.registros.find(
    (registro) =>
      limpio(registro.documento) === limpio(documento) &&
      limpio(registro.codigo) === limpio(codigo),
  )
}

// ---------------------------------------------------------------------------
// CU-R-13 — Votar un punto del orden del dia
// ---------------------------------------------------------------------------

/**
 * Codigo de verificacion de un documento formal (RN-36, ADR-0006).
 *
 * Sin las letras que se confunden al dictarlo por telefono o al copiarlo de un
 * papel: la I con el 1, la O con el 0. Un codigo que se transcribe mal es un
 * documento que no se puede verificar.
 */
function nuevoCodigoVerificacion(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 8; i += 1) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)]
    if (i === 3) codigo += '-'
  }
  return codigo
}

export async function emitirVoto(
  bdActual: BaseDatos,
  parametros: {
    votacionId: string
    unidadId: string
    personaId: string
    opcionId: string
  },
): Promise<Resultado<Voto>> {
  await esperar()
  const bd = clonar(bdActual)

  const votacion = bd.votaciones.find((v) => v.id === parametros.votacionId)
  if (!votacion) throw new ErrorDeNegocio('La votacion no existe.')
  // RN-34: una votacion cerrada no recibe votos ni se reabre.
  if (!votacionRecibeVotos(votacion)) {
    throw new ErrorDeNegocio('La votacion no esta abierta.')
  }

  const unidad = bd.unidades.find((u) => u.id === parametros.unidadId)
  if (!unidad) throw new ErrorDeNegocio('La unidad no existe.')

  // **Quien puede votar por esta unidad: el propietario, o su apoderado.**
  //
  // Las dos comprobaciones van juntas porque son una sola pregunta, y separarlas
  // fue lo que rompio el flujo del apoderado la primera vez: un apoderado **no
  // tiene residencia**, asi que el examen de RN-51 lo rechazaba antes de llegar
  // al del poder. La comprobacion vive aqui y no solo en la pantalla: esconder
  // el boton no es una regla (T-16).
  const asambleaDelPunto = bd.asambleas.find((a) =>
    a.ordenDelDia.some((punto) => punto.id === votacion.puntoId),
  )
  const poder = asambleaDelPunto
    ? poderDeUnidad(bd.poderes, asambleaDelPunto.id, unidad.id)
    : undefined

  if (poder) {
    // RN-30: si la unidad esta representada, **el voto es del apoderado**. Que
    // el propietario pudiera votar igual serian dos personas con derecho al
    // mismo voto y ganaria quien llegue primero — que es justo lo que un poder
    // resuelve. Si cambio de opinion, revoca y vota el.
    if (poder.apoderadoId !== parametros.personaId) {
      throw new ErrorDeNegocio(
        'Esta unidad está representada por un apoderado en esta asamblea. Revoca el poder si quieres votar tú.',
      )
    }
  } else {
    // RN-51: sin poder de por medio, vota el propietario.
    const residencia = bd.residencias.find(
      (r) => r.unidadId === unidad.id && r.personaId === parametros.personaId && !r.hasta,
    )
    if (!puedeVotar(residencia?.rol)) {
      throw new ErrorDeNegocio('Solo el propietario de la unidad puede votar.')
    }
  }

  // RN-29: un voto por unidad y por votacion.
  if (yaVoto(bd.votos, votacion.id, unidad.id)) {
    throw new ErrorDeNegocio('Esta unidad ya voto este punto.')
  }


  if (!votacion.opciones.some((opcion) => opcion.id === parametros.opcionId)) {
    throw new ErrorDeNegocio('La opcion elegida no pertenece a esta votacion.')
  }

  const voto: Voto = {
    id: nuevoId('vot'),
    votacionId: votacion.id,
    unidadId: unidad.id,
    opcionId: parametros.opcionId,
    emitidoPor: parametros.personaId,
    // RN-37: el coeficiente se copia. Si manana cambia, esta votacion no.
    coeficiente: unidad.coeficiente,
    fecha: ahoraISO(),
  }
  bd.votos.push(voto)
  return persistir(bd, voto)
}

// ---------------------------------------------------------------------------
// CU-R-12 — Paz y salvo
// ---------------------------------------------------------------------------

/**
 * Emite el certificado de paz y salvo de una unidad.
 *
 * Lo que si esta resuelto es **cuando se puede emitir** (RN-26: saldo cero) y su
 * **consecutivo unico** (RN-36). Lo que falta es el PDF: generarlo es la decision
 * de ADR-0006, que sigue pendiente. Por eso el certificado se guarda y se muestra
 * en pantalla, y la descarga es lo unico que queda en deuda.
 */
export async function emitirPazYSalvo(
  bdActual: BaseDatos,
  parametros: { copropiedadId: string; unidadId: string },
): Promise<Resultado<Documento>> {
  await esperar()
  const bd = clonar(bdActual)

  const unidad = bd.unidades.find((u) => u.id === parametros.unidadId)
  if (!unidad) throw new ErrorDeNegocio('La unidad no existe.')

  // RN-26: solo se emite con saldo cero. La comprobacion vive aqui, no en el boton.
  const saldo = calcularSaldo(bd.cuotas.filter((cuota) => cuota.unidadId === unidad.id))
  if (saldo > 0) {
    throw new ErrorDeNegocio('La unidad tiene saldo pendiente: no se puede emitir el paz y salvo.')
  }

  const consecutivo = bd.consecutivos.pazYSalvo
  const hoy = hoyISO()

  // Hasta cuando certifica. El documento no dice «vale 30 dias»: dice hasta que
  // dia la unidad esta al dia, y ese dia es el fin del ultimo periodo facturado
  // (modelo de paz y salvo aportado por Mary, 2026-08-28).
  const periodos = bd.cuotas
    .filter((cuota) => cuota.unidadId === unidad.id)
    .map((cuota) => cuota.periodo)
    .sort()
  const ultimoPeriodo = periodos[periodos.length - 1] ?? hoy.slice(0, 7)

  const documento: Documento = {
    id: nuevoId('doc'),
    tipo: 'paz_y_salvo',
    // RN-36: consecutivo unico por tipo, mas el codigo que lo hace verificable.
    numero: `PS-${hoy.slice(0, 4)}-${String(consecutivo).padStart(4, '0')}`,
    codigoVerificacion: nuevoCodigoVerificacion(),
    copropiedadId: parametros.copropiedadId,
    unidadId: unidad.id,
    emitidoEn: hoy,
    cubiertoHasta: finDePeriodo(ultimoPeriodo),
    estado: 'vigente',
  }
  bd.documentos.push(documento)
  bd.consecutivos.pazYSalvo = consecutivo + 1
  return persistir(bd, documento)
}
