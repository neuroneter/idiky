/**
 * Selectores: consultas puras sobre la base de datos en memoria.
 *
 * Son funciones sin efectos que reciben la `BaseDatos` y devuelven vistas de
 * ella. Las pantallas las usan para no repetir filtros ni ordenamientos.
 */

import type {
  BaseDatos,
  Comunicado,
  Correspondencia,
  Cuota,
  Pago,
  Persona,
  Pqrs,
  Reserva,
  Residencia,
  Unidad,
  Visitante,
  ZonaComun,
} from '../dominio/tipos'
import { hoyISO } from '../dominio/reglas'

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

export function pagoPorId(bd: BaseDatos, pagoId?: string): Pago | undefined {
  if (!pagoId) return undefined
  return bd.pagos.find((p) => p.id === pagoId)
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

/** CU-A-18 — Abonos informados por propietarios que esperan conciliacion (RN-30). */
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
