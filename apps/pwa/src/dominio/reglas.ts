/**
 * Reglas de negocio del dominio (RN-xx de docs/05-modelo-de-datos.md).
 *
 * IMPORTANTE: funciones puras, sin React y sin acceso a datos. Son la unica
 * definicion de cada regla; las pantallas las consumen, no las reimplementan.
 * Cuando exista el backend, este archivo se comparte con el servidor.
 */

import type {
  Cuota,
  EstadoCuota,
  FechaISO,
  Imputacion,
  Pago,
  Periodo,
  Pqrs,
  Reserva,
  Unidad,
  Visitante,
  ZonaComun,
} from './tipos'

/** Resultado de validar una operacion contra las reglas del dominio. */
export interface ResultadoValidacion {
  valido: boolean
  motivo?: string
}

/** SLA de respuesta a una PQRS en dias calendario (RN-13). */
export const SLA_PQRS_DIAS = 15

/** Dia del mes en que vencen las cuotas por defecto (RN-23). */
export const DIA_VENCIMIENTO_CUOTA = 10

// ---------------------------------------------------------------------------
// Fechas — se trabaja con cadenas ISO para evitar desfases de zona horaria
// ---------------------------------------------------------------------------

export function hoyISO(): FechaISO {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

export function ahoraISO(): string {
  return new Date().toISOString()
}

export function periodoActual(): Periodo {
  return hoyISO().slice(0, 7)
}

export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const base = new Date(`${fecha}T12:00:00`)
  base.setDate(base.getDate() + dias)
  const mes = String(base.getMonth() + 1).padStart(2, '0')
  const dia = String(base.getDate()).padStart(2, '0')
  return `${base.getFullYear()}-${mes}-${dia}`
}

/** Diferencia en dias entre dos fechas ISO (positiva si `hasta` es posterior). */
export function diasEntre(desde: FechaISO, hasta: FechaISO): number {
  const a = new Date(`${desde.slice(0, 10)}T12:00:00`).getTime()
  const b = new Date(`${hasta.slice(0, 10)}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

// ---------------------------------------------------------------------------
// Cartera
// ---------------------------------------------------------------------------

/**
 * RN-04 — Una cuota es `vencida` si su vencimiento ya paso y aun tiene saldo.
 * RN-26 — Si tiene abonos parciales pero todavia debe algo, esta `abonada`.
 * El estado real siempre se deriva del saldo, nunca se lee del campo guardado.
 */
export function estadoRealCuota(cuota: Cuota, hoy: FechaISO = hoyISO()): EstadoCuota {
  if (cuota.saldo <= 0) return 'pagada'
  if (cuota.fechaVencimiento < hoy) return 'vencida'
  return cuota.saldo < cuota.valor ? 'abonada' : 'pendiente'
}

export function cuotaPendiente(cuota: Cuota): boolean {
  return cuota.saldo > 0
}

/** RN-03 — Saldo de una unidad: lo que queda por pagar de todas sus cuotas. */
export function calcularSaldo(cuotas: Cuota[]): number {
  return cuotas.reduce((total, cuota) => total + cuota.saldo, 0)
}

/** Saldo de las cuotas ya vencidas (subconjunto del saldo total). */
export function calcularSaldoVencido(cuotas: Cuota[], hoy: FechaISO = hoyISO()): number {
  return cuotas
    .filter((cuota) => estadoRealCuota(cuota, hoy) === 'vencida')
    .reduce((total, cuota) => total + cuota.saldo, 0)
}

/** Cuanto se ha abonado a una cuota. */
export function abonadoDeCuota(cuota: Cuota): number {
  return cuota.valor - cuota.saldo
}

/** RN-21 — Dias de mora contados desde la cuota vencida mas antigua. */
export function diasDeMora(cuotas: Cuota[], hoy: FechaISO = hoyISO()): number {
  const vencidas = cuotas
    .filter((cuota) => estadoRealCuota(cuota, hoy) === 'vencida')
    .map((cuota) => cuota.fechaVencimiento)
    .sort()
  if (vencidas.length === 0) return 0
  return diasEntre(vencidas[0], hoy)
}

/** Una unidad esta en mora si tiene al menos una cuota vencida. */
export function estaEnMora(cuotas: Cuota[], hoy: FechaISO = hoyISO()): boolean {
  return cuotas.some((cuota) => estadoRealCuota(cuota, hoy) === 'vencida')
}

/** RN-05 — Prorrateo de una cuota extraordinaria por coeficiente. */
export function prorratearPorCoeficiente(valorTotal: number, coeficiente: number): number {
  return Math.round((valorTotal * coeficiente) / 100)
}

/** Cuotas con saldo, de la mas antigua a la mas reciente: el orden de imputacion. */
export function cuotasPorAntiguedad(cuotas: Cuota[]): Cuota[] {
  return cuotas
    .filter(cuotaPendiente)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
}

/**
 * RN-06 — Un pago se imputa primero a la deuda mas antigua.
 * RN-27 — El abono puede cubrir una cuota solo en parte: se reparte hasta
 * agotar el valor recibido. Lo que sobra no se imputa y queda a favor.
 */
export function imputarPago(cuotas: Cuota[], valor: number): Imputacion[] {
  const imputaciones: Imputacion[] = []
  let restante = valor
  for (const cuota of cuotasPorAntiguedad(cuotas)) {
    if (restante <= 0) break
    const aplicado = Math.min(restante, cuota.saldo)
    imputaciones.push({ cuotaId: cuota.id, valor: aplicado })
    restante -= aplicado
  }
  return imputaciones
}

/** Suma de lo repartido entre cuotas. */
export function totalImputado(imputaciones: Imputacion[]): number {
  return imputaciones.reduce((total, linea) => total + linea.valor, 0)
}

/** RN-27 — Parte del pago que no quedo aplicada a ninguna cuota. */
export function saldoAFavorDelPago(valor: number, imputaciones: Imputacion[]): number {
  return Math.max(0, valor - totalImputado(imputaciones))
}

/**
 * Valida el reparto de un abono antes de aplicarlo: nada negativo, nada por
 * encima del saldo de la cuota, y nada por encima del valor recibido.
 */
export function validarImputacion(parametros: {
  valor: number
  imputaciones: Imputacion[]
  cuotas: Cuota[]
}): ResultadoValidacion {
  const { valor, imputaciones, cuotas } = parametros
  if (valor <= 0) return { valido: false, motivo: 'El valor del pago debe ser mayor que cero.' }

  for (const linea of imputaciones) {
    if (linea.valor < 0) {
      return { valido: false, motivo: 'No se puede imputar un valor negativo a una cuota.' }
    }
    const cuota = cuotas.find((c) => c.id === linea.cuotaId)
    if (!cuota) return { valido: false, motivo: 'Se intento imputar a una cuota inexistente.' }
    if (linea.valor > cuota.saldo) {
      return {
        valido: false,
        motivo: `No se puede abonar mas de lo que debe la cuota "${cuota.concepto}".`,
      }
    }
  }

  if (totalImputado(imputaciones) > valor) {
    return { valido: false, motivo: 'Estas repartiendo mas de lo que se recibio.' }
  }
  return { valido: true }
}

// ---------------------------------------------------------------------------
// Recibos de caja
// ---------------------------------------------------------------------------

/** RN-28 — Numero de recibo de caja: consecutivo por copropiedad, sin reuso. */
export function numeroRecibo(consecutivo: number): string {
  return `RC-${String(consecutivo).padStart(5, '0')}`
}

/** RN-29 — Solo se puede anular un recibo que este aplicado. */
export function sePuedeAnular(pago: Pago): boolean {
  return pago.estado === 'aplicado'
}

/** RN-30 — Un abono informado por el propietario espera a que se aplique. */
export function esperaAplicacion(pago: Pago): boolean {
  return pago.estado === 'reportado'
}

/**
 * RN-18 — Porcentaje de recaudo sobre lo facturado en un periodo.
 * Cuenta lo efectivamente abonado, no solo las cuotas saldadas: un abono
 * parcial tambien es recaudo.
 */
export function porcentajeRecaudo(cuotas: Cuota[], periodo: Periodo): number {
  const delPeriodo = cuotas.filter((cuota) => cuota.periodo === periodo)
  const facturado = delPeriodo.reduce((total, cuota) => total + cuota.valor, 0)
  if (facturado === 0) return 0
  const recaudado = delPeriodo.reduce((total, cuota) => total + abonadoDeCuota(cuota), 0)
  return Math.round((recaudado / facturado) * 100)
}

/** RN-23 — Fecha de vencimiento por defecto de un periodo. */
export function vencimientoDelPeriodo(periodo: Periodo): FechaISO {
  return `${periodo}-${String(DIA_VENCIMIENTO_CUOTA).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Reservas
// ---------------------------------------------------------------------------

export function reservaOcupaFranja(reserva: Reserva): boolean {
  return reserva.estado === 'solicitada' || reserva.estado === 'confirmada'
}

/** RN-09 — No puede haber dos reservas activas de la misma zona en la misma franja. */
export function franjaOcupada(
  reservas: Reserva[],
  zonaId: string,
  fecha: FechaISO,
  horaInicio: string,
): boolean {
  return reservas.some(
    (reserva) =>
      reserva.zonaId === zonaId &&
      reserva.fecha === fecha &&
      reserva.horaInicio === horaInicio &&
      reservaOcupaFranja(reserva),
  )
}

/** RN-10 — La reserva debe respetar la anticipacion minima de la zona. */
export function cumpleAnticipacion(
  zona: ZonaComun,
  fecha: FechaISO,
  horaInicio: string,
  ahora: Date = new Date(),
): boolean {
  const inicio = new Date(`${fecha}T${horaInicio}:00`).getTime()
  const horasDeMargen = (inicio - ahora.getTime()) / 3_600_000
  return horasDeMargen >= zona.anticipacionMinimaHoras
}

/** Reservas activas de una unidad en el mes de la fecha dada (cupo de uso justo). */
export function reservasDelMes(
  reservas: Reserva[],
  unidadId: string,
  fecha: FechaISO,
): number {
  const periodo = fecha.slice(0, 7)
  return reservas.filter(
    (reserva) =>
      reserva.unidadId === unidadId &&
      reserva.fecha.startsWith(periodo) &&
      reservaOcupaFranja(reserva),
  ).length
}

/**
 * Valida una solicitud de reserva completa.
 * Aplica RN-08 (mora), RN-09 (franja ocupada) y RN-10 (anticipacion), mas el
 * cupo mensual por unidad.
 */
export function validarReserva(parametros: {
  zona: ZonaComun
  fecha: FechaISO
  horaInicio: string
  unidadId: string
  cuotasDeLaUnidad: Cuota[]
  reservas: Reserva[]
  ahora?: Date
}): ResultadoValidacion {
  const { zona, fecha, horaInicio, unidadId, cuotasDeLaUnidad, reservas, ahora } = parametros

  if (estaEnMora(cuotasDeLaUnidad)) {
    return {
      valido: false,
      motivo: 'La unidad tiene cuotas vencidas. Ponte al dia para reservar zonas comunes.',
    }
  }
  if (franjaOcupada(reservas, zona.id, fecha, horaInicio)) {
    return { valido: false, motivo: 'Esa franja ya esta reservada.' }
  }
  if (!cumpleAnticipacion(zona, fecha, horaInicio, ahora)) {
    return {
      valido: false,
      motivo: `Debes reservar con al menos ${zona.anticipacionMinimaHoras} horas de anticipacion.`,
    }
  }
  if (reservasDelMes(reservas, unidadId, fecha) >= zona.cupoMensualPorUnidad) {
    return {
      valido: false,
      motivo: `Alcanzaste el cupo de ${zona.cupoMensualPorUnidad} reservas para este mes.`,
    }
  }
  return { valido: true }
}

/** Franjas horarias reservables de una zona, segun su ventana y duracion de bloque. */
export function franjasDeZona(zona: ZonaComun): Array<{ inicio: string; fin: string }> {
  const franjas: Array<{ inicio: string; fin: string }> = []
  const [horaInicio] = zona.horaInicio.split(':').map(Number)
  const [horaFin] = zona.horaFin.split(':').map(Number)
  for (let h = horaInicio; h + zona.duracionBloqueHoras <= horaFin; h += zona.duracionBloqueHoras) {
    franjas.push({
      inicio: `${String(h).padStart(2, '0')}:00`,
      fin: `${String(h + zona.duracionBloqueHoras).padStart(2, '0')}:00`,
    })
  }
  return franjas
}

/** Una reserva futura y activa se puede cancelar (CU-R-06). */
export function sePuedeCancelar(reserva: Reserva, hoy: FechaISO = hoyISO()): boolean {
  return reservaOcupaFranja(reserva) && reserva.fecha >= hoy
}

// ---------------------------------------------------------------------------
// PQRS
// ---------------------------------------------------------------------------

/** RN-13 — Fecha limite de respuesta segun el SLA. */
export function calcularFechaLimite(fechaRadicacion: FechaISO): FechaISO {
  return sumarDias(fechaRadicacion.slice(0, 10), SLA_PQRS_DIAS)
}

export function pqrsAbierta(pqrs: Pqrs): boolean {
  return pqrs.estado === 'abierta' || pqrs.estado === 'en_gestion'
}

/** Una PQRS abierta cuya fecha limite ya paso incumple el SLA. */
export function pqrsFueraDeSla(pqrs: Pqrs, hoy: FechaISO = hoyISO()): boolean {
  return pqrsAbierta(pqrs) && pqrs.fechaLimite < hoy
}

/** Dias restantes de SLA; negativo si ya vencio. */
export function diasRestantesSla(pqrs: Pqrs, hoy: FechaISO = hoyISO()): number {
  return diasEntre(hoy, pqrs.fechaLimite)
}

// ---------------------------------------------------------------------------
// Visitantes
// ---------------------------------------------------------------------------

/** RN-16 — El codigo deja de ser valido al terminar la vigencia. */
export function estadoRealVisitante(
  visitante: Visitante,
  hoy: FechaISO = hoyISO(),
): Visitante['estado'] {
  if (visitante.estado === 'revocado') return 'revocado'
  return visitante.vigenciaHasta < hoy ? 'vencido' : 'activo'
}

// ---------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------

export function etiquetaUnidad(unidad: Unidad): string {
  return `${unidad.torre} · ${unidad.numero}`
}

/** RN-19 — La suma de coeficientes de una copropiedad debe ser 100 %. */
export function sumaCoeficientes(unidades: Unidad[]): number {
  return Number(unidades.reduce((total, unidad) => total + unidad.coeficiente, 0).toFixed(4))
}
