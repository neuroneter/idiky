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
  Documento,
  Correspondencia,
  Cuota,
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
import { hoyISO, ordenAsamblea } from '../dominio/reglas'

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

/** Vinculos vigentes de una unidad (sin fecha de salida). */
export function residenciasDeUnidad(bd: BaseDatos, unidadId: string): Residencia[] {
  return bd.residencias.filter((r) => r.unidadId === unidadId && !r.hasta)
}

export function residenciasDePersona(bd: BaseDatos, personaId: string): Residencia[] {
  return bd.residencias.filter((r) => r.personaId === personaId && !r.hasta)
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

export function pagoPorId(bd: BaseDatos, pagoId?: string) {
  if (!pagoId) return undefined
  return bd.pagos.find((p) => p.id === pagoId)
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

/** La que esta pasando o, si no hay ninguna, la siguiente convocada. */
export function asambleaVigente(bd: BaseDatos, copropiedadId: string): Asamblea | undefined {
  return asambleasDe(bd, copropiedadId).find(
    (a) => a.estado === 'instalada' || a.estado === 'convocada',
  )
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
