/**
 * Selectores: consultas puras sobre la base de datos en memoria.
 *
 * Son funciones sin efectos que reciben la `BaseDatos` y devuelven vistas de
 * ella. Las pantallas las usan para no repetir filtros ni ordenamientos.
 */

import type {
  Asamblea,
  BaseDatos,
  Comunicado,
  Proyecto,
  Asistencia,
  ConceptoSancion,
  Poder,
  Sancion,
  Documento,
  Correspondencia,
  Cuota,
  Pago,
  Persona,
  Pqrs,
  RegistroPersona,
  Reserva,
  Residencia,
  Unidad,
  Visitante,
  Votacion,
  Voto,
  ZonaComun,
} from '../dominio/tipos'
import { hoyISO, ordenAsamblea, proyectosOrdenados, registroEnCurso, residenciaVigente } from '../dominio/reglas'

// RN-01 — Todo se lee filtrado por copropiedad: un selector nunca mezcla dos.

export function copropiedad(bd: BaseDatos, copropiedadId: string) {
  return bd.copropiedades.find((c) => c.id === copropiedadId)
}

export function unidad(bd: BaseDatos, unidadId?: string): Unidad | undefined {
  if (!unidadId) return undefined
  return bd.unidades.find((u) => u.id === unidadId)
}

export function unidadesDe(bd: BaseDatos, copropiedadId: string): Unidad[] {
  return bd.unidades
    .filter((u) => u.copropiedadId === copropiedadId)
    .sort((a, b) => `${a.torre}${a.numero}`.localeCompare(`${b.torre}${b.numero}`))
}

export function persona(bd: BaseDatos, personaId?: string): Persona | undefined {
  if (!personaId) return undefined
  return bd.personas.find((p) => p.id === personaId)
}

export function nombreCompleto(p?: Persona): string {
  return p ? `${p.nombres} ${p.apellidos}` : 'Sin registrar'
}

/** Los registros de una unidad, del mas reciente al mas viejo (CU-R-27). */
export function registrosDeUnidad(bd: BaseDatos, unidadId?: string): RegistroPersona[] {
  if (!unidadId) return []
  return bd.registros.filter((registro) => registro.unidadId === unidadId)
}

export function registro(bd: BaseDatos, registroId?: string): RegistroPersona | undefined {
  return bd.registros.find((r) => r.id === registroId)
}

/** Vinculos vigentes de una unidad: sin fecha de fin, o con una que aun no llega. */
export function residenciasDeUnidad(bd: BaseDatos, unidadId: string): Residencia[] {
  return bd.residencias.filter((r) => r.unidadId === unidadId && residenciaVigente(r))
}

/**
 * Si la unidad ya tiene propietario: vigente, o con su registro en curso. Es lo
 * que decide si la administración puede registrar uno (RN-63).
 */
export function unidadTienePropietario(bd: BaseDatos, unidadId: string): boolean {
  return (
    bd.residencias.some((r) => r.unidadId === unidadId && r.rol === 'propietario' && residenciaVigente(r)) ||
    bd.registros.some(
      (r) => r.unidadId === unidadId && r.categoria === 'propietario' && registroEnCurso(r),
    )
  )
}

/**
 * Quién responde por un vínculo para inhabilitarlo (RN-65): quien lo registró y,
 * **subiendo en la cadena**, el propietario o la administración (Mary,
 * 2026-10-02: «debe inhabilitar el que lo creó o por orden ascendente el
 * propietario o administrador según sea el caso»). Los propietarios de hoy
 * responden por lo que registró un arrendatario, y por lo que dejó un
 * propietario que ya salió de la unidad (cambio de propietario).
 */
export function responsablesDelVinculo(
  bd: BaseDatos,
  residencia: Residencia,
): { creadoPor?: string; heredadoPor: string[] } {
  const creadoPor = bd.registros.find((r) => r.id === residencia.registroId)?.creadoPor
  return responsablesPorCreador(bd, residencia.unidadId, creadoPor, residencia.id)
}

/** Lo mismo para un registro: responde quien lo creó y, subiendo, el propietario (RN-65, RN-67). */
export function responsablesDeRegistro(
  bd: BaseDatos,
  registro: { unidadId: string; creadoPor: string },
): { creadoPor?: string; heredadoPor: string[] } {
  return responsablesPorCreador(bd, registro.unidadId, registro.creadoPor)
}

/** Lo mismo para una visita de un día: la creó quien la autorizó (RN-65). */
export function responsablesDeVisita(bd: BaseDatos, visitante: Visitante): { creadoPor?: string; heredadoPor: string[] } {
  return responsablesPorCreador(bd, visitante.unidadId, visitante.personaId)
}

function responsablesPorCreador(
  bd: BaseDatos,
  unidadId: string,
  creadoPor: string | undefined,
  excluirResidenciaId?: string,
): { creadoPor?: string; heredadoPor: string[] } {
  const vigentes = residenciasDeUnidad(bd, unidadId)
  const creadorSigue = vigentes.some((r) => r.personaId === creadoPor)
  const creadorEsAdministracion = bd.perfilesDemo.some((p) => p.rol === 'admin' && p.personaId === creadoPor)
  const creadoPorArrendatario = bd.residencias.some(
    (r) => r.unidadId === unidadId && r.personaId === creadoPor && r.rol === 'arrendatario',
  )
  const heredadoPor =
    creadoPor && !creadorEsAdministracion && (!creadorSigue || creadoPorArrendatario)
      ? vigentes.filter((r) => r.rol === 'propietario' && r.id !== excluirResidenciaId).map((r) => r.personaId)
      : []
  return { creadoPor, heredadoPor }
}

export function residenciasDePersona(bd: BaseDatos, personaId: string): Residencia[] {
  return bd.residencias.filter((r) => r.personaId === personaId && residenciaVigente(r))
}

export function cuotasDeUnidad(bd: BaseDatos, unidadId?: string): Cuota[] {
  if (!unidadId) return []
  return bd.cuotas
    .filter((c) => c.unidadId === unidadId)
    .sort((a, b) => b.fechaVencimiento.localeCompare(a.fechaVencimiento))
}

export function cuotasDeCopropiedad(bd: BaseDatos, copropiedadId: string): Cuota[] {
  const ids = new Set(unidadesDe(bd, copropiedadId).map((u) => u.id))
  return bd.cuotas.filter((c) => ids.has(c.unidadId))
}

/** El catalogo de multas de la copropiedad: activos primero (CU-A-22). */
export function conceptosSancionDe(bd: BaseDatos, copropiedadId: string): ConceptoSancion[] {
  return bd.conceptosSancion
    .filter((concepto) => concepto.copropiedadId === copropiedadId)
    .sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1
      return a.nombre.localeCompare(b.nombre)
    })
}

/**
 * Los procesos sancionatorios de una unidad, del mas nuevo al mas viejo
 * (CU-R-29).
 *
 * El copropietario ve los de **su** unidad y ninguno mas: un expediente
 * sancionatorio dice que hizo una persona en su casa, y eso no es informacion
 * de la comunidad.
 */
export function sancionesDeUnidad(bd: BaseDatos, unidadId?: string): Sancion[] {
  return bd.sanciones
    .filter((sancion) => sancion.unidadId === unidadId)
    .sort((a, b) => b.fechaImposicion.localeCompare(a.fechaImposicion))
}

/** La asistencia registrada a una asamblea, en el orden en que fue llegando. */
export function asistenciasDeAsamblea(bd: BaseDatos, asambleaId: string): Asistencia[] {
  return bd.asistencias
    .filter((asistencia) => asistencia.asambleaId === asambleaId)
    .sort((a, b) => a.registradaEn.localeCompare(b.registradaEn))
}

/** Los poderes de una asamblea, vigentes y revocados: ninguno se borra (RN-61). */
export function poderesDeAsambleaTodos(bd: BaseDatos, asambleaId: string): Poder[] {
  return bd.poderes
    .filter((poder) => poder.asambleaId === asambleaId)
    .sort((a, b) => a.registradoEn.localeCompare(b.registradoEn))
}

export function zonasDe(bd: BaseDatos, copropiedadId: string): ZonaComun[] {
  return bd.zonasComunes.filter((z) => z.copropiedadId === copropiedadId)
}

export function zona(bd: BaseDatos, zonaId: string): ZonaComun | undefined {
  return bd.zonasComunes.find((z) => z.id === zonaId)
}

export function reservasDeUnidad(bd: BaseDatos, unidadId?: string): Reserva[] {
  if (!unidadId) return []
  return bd.reservas
    .filter((r) => r.unidadId === unidadId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function reservasDeCopropiedad(bd: BaseDatos, copropiedadId: string): Reserva[] {
  const zonas = new Set(zonasDe(bd, copropiedadId).map((z) => z.id))
  return bd.reservas
    .filter((r) => zonas.has(r.zonaId))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function proximaReserva(bd: BaseDatos, unidadId?: string): Reserva | undefined {
  const hoy = hoyISO()
  return reservasDeUnidad(bd, unidadId)
    .filter((r) => r.fecha >= hoy && (r.estado === 'confirmada' || r.estado === 'solicitada'))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
}

export function pqrsDeUnidad(bd: BaseDatos, unidadId?: string): Pqrs[] {
  if (!unidadId) return []
  return bd.pqrs
    .filter((p) => p.unidadId === unidadId)
    .sort((a, b) => b.fechaRadicacion.localeCompare(a.fechaRadicacion))
}

export function pqrsDeCopropiedad(bd: BaseDatos, copropiedadId: string): Pqrs[] {
  return bd.pqrs
    .filter((p) => p.copropiedadId === copropiedadId)
    .sort((a, b) => b.fechaRadicacion.localeCompare(a.fechaRadicacion))
}

/** RN-15: los fijados primero, luego por fecha de publicacion descendente. */
/** Los proyectos de la copropiedad, en marcha primero (CU-A-28, CU-R-32). */
export function proyectosDe(bd: BaseDatos, copropiedadId: string): Proyecto[] {
  return proyectosOrdenados(bd.proyectos, copropiedadId)
}

export function comunicadosVigentes(bd: BaseDatos, copropiedadId: string): Comunicado[] {
  const hoy = hoyISO()
  return bd.comunicados
    .filter((c) => c.copropiedadId === copropiedadId)
    .filter((c) => !c.vigenteHasta || c.vigenteHasta >= hoy)
    .sort((a, b) => {
      if (a.fijado !== b.fijado) return a.fijado ? -1 : 1
      return b.fechaPublicacion.localeCompare(a.fechaPublicacion)
    })
}

export function correspondenciaDeUnidad(bd: BaseDatos, unidadId?: string): Correspondencia[] {
  if (!unidadId) return []
  return bd.correspondencia
    .filter((c) => c.unidadId === unidadId)
    .sort((a, b) => b.fechaRecepcion.localeCompare(a.fechaRecepcion))
}

export function correspondenciaDeCopropiedad(
  bd: BaseDatos,
  copropiedadId: string,
): Correspondencia[] {
  const ids = new Set(unidadesDe(bd, copropiedadId).map((u) => u.id))
  return bd.correspondencia
    .filter((c) => ids.has(c.unidadId))
    .sort((a, b) => b.fechaRecepcion.localeCompare(a.fechaRecepcion))
}

export function visitantesDeUnidad(bd: BaseDatos, unidadId?: string): Visitante[] {
  if (!unidadId) return []
  return bd.visitantes
    .filter((v) => v.unidadId === unidadId)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))
}

// ---------------------------------------------------------------------------
// Asambleas — CU-R-13, CU-R-20
// ---------------------------------------------------------------------------

/** En curso primero, despues las convocadas, y al final el historial. */
export function asambleasDe(bd: BaseDatos, copropiedadId: string): Asamblea[] {
  return bd.asambleas
    .filter((a) => a.copropiedadId === copropiedadId)
    .sort((a, b) => {
      const orden = ordenAsamblea(a) - ordenAsamblea(b)
      if (orden !== 0) return orden
      // Dentro del mismo estado: lo proximo antes que lo lejano, lo reciente antes
      // que lo viejo.
      return a.estado === 'cerrada'
        ? b.fechaHora.localeCompare(a.fechaHora)
        : a.fechaHora.localeCompare(b.fechaHora)
    })
}

export function asamblea(bd: BaseDatos, asambleaId?: string): Asamblea | undefined {
  if (!asambleaId) return undefined
  return bd.asambleas.find((a) => a.id === asambleaId)
}

export function votacionesDe(bd: BaseDatos, asambleaId: string): Votacion[] {
  return bd.votaciones.filter((v) => v.asambleaId === asambleaId)
}

export function votacionDePunto(bd: BaseDatos, puntoId: string): Votacion | undefined {
  return bd.votaciones.find((v) => v.puntoId === puntoId)
}

export function votosDe(bd: BaseDatos, votacionId: string): Voto[] {
  return bd.votos.filter((v) => v.votacionId === votacionId)
}

// ---------------------------------------------------------------------------
// Documentos — CU-R-12
// ---------------------------------------------------------------------------

export function documentosDeUnidad(bd: BaseDatos, unidadId?: string): Documento[] {
  if (!unidadId) return []
  return bd.documentos
    .filter((d) => d.unidadId === unidadId)
    .sort((a, b) => b.emitidoEn.localeCompare(a.emitidoEn))
}

/**
 * El ultimo paz y salvo emitido que no se haya anulado.
 *
 * No se filtra por vigencia porque **el documento no caduca solo**: certifica que
 * la unidad estaba al dia hasta cierto dia, y eso sigue siendo cierto manana. Si
 * la copropiedad decide darle un plazo de validez, sera otra regla (§3 ter).
 */
export function ultimoPazYSalvo(bd: BaseDatos, unidadId?: string): Documento | undefined {
  return documentosDeUnidad(bd, unidadId).find(
    (d) => d.tipo === 'paz_y_salvo' && d.estado === 'vigente',
  )
}


/**
 * Busca un visitante por el codigo que presenta en la entrada (CU-P-02).
 *
 * Sin distinguir mayusculas ni espacios: el portero lo teclea de la pantalla
 * ajena de un visitante, muchas veces de noche y con alguien esperando.
 */
export function visitantePorCodigo(bd: BaseDatos, codigo: string): Visitante | undefined {
  const limpio = codigo.trim().toUpperCase().replace(/\s+/g, '')
  if (!limpio) return undefined
  return bd.visitantes.find((v) => v.codigo.toUpperCase().replace(/\s+/g, '') === limpio)
}

/** Lo que un turno le hereda al siguiente: lo que llego y nadie ha recogido. */
export function correspondenciaPendiente(bd: BaseDatos, copropiedadId: string): Correspondencia[] {
  return correspondenciaDeCopropiedad(bd, copropiedadId).filter((c) => c.estado === 'en_porteria')
}

/** Pagos de una unidad, del mas reciente al mas antiguo. */
export function pagosDeUnidad(bd: BaseDatos, unidadId?: string): Pago[] {
  if (!unidadId) return []
  return bd.pagos.filter((p) => p.unidadId === unidadId).sort(porFechaDescendente)
}

export function pagosDeCopropiedad(bd: BaseDatos, copropiedadId: string): Pago[] {
  const ids = new Set(unidadesDe(bd, copropiedadId).map((u) => u.id))
  return bd.pagos.filter((p) => ids.has(p.unidadId)).sort(porFechaDescendente)
}

/** CU-A-27 — Abonos informados por propietarios que esperan conciliacion (RN-79). */
export function abonosReportados(bd: BaseDatos, copropiedadId: string): Pago[] {
  return pagosDeCopropiedad(bd, copropiedadId)
    .filter((p) => p.estado === 'reportado')
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Recibos de caja ya emitidos, anulados incluidos: el libro no se filtra. */
export function recibosEmitidos(bd: BaseDatos, copropiedadId: string): Pago[] {
  return pagosDeCopropiedad(bd, copropiedadId).filter((p) => p.estado !== 'reportado')
}

/** Pagos aplicados que abonaron a una cuota concreta. */
export function pagosDeCuota(bd: BaseDatos, cuotaId: string): Pago[] {
  return bd.pagos
    .filter((p) => p.estado === 'aplicado')
    .filter((p) => p.imputaciones.some((linea) => linea.cuotaId === cuotaId))
    .sort(porFechaDescendente)
}

function porFechaDescendente(a: Pago, b: Pago): number {
  return b.fecha.localeCompare(a.fecha)
}

/**
 * Los propietarios vigentes de una unidad: a nombre de quienes se expiden el paz
 * y salvo y el estado de cuenta. Pueden ser varios.
 */
export function propietariosDeUnidad(bd: BaseDatos, unidadId?: string): Persona[] {
  return residenciasDeUnidad(bd, unidadId ?? '')
    .filter((r) => r.rol === 'propietario')
    .map((r) => persona(bd, r.personaId))
    .filter((p): p is Persona => !!p)
}

/** Quien firma como administración. En el demo, la persona del perfil de administrador. */
export function administradorDe(bd: BaseDatos): Persona | undefined {
  return persona(bd, bd.perfilesDemo.find((perfil) => perfil.rol === 'admin')?.personaId)
}

