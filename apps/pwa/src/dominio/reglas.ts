/**
 * Reglas de negocio del dominio (RN-xx de docs/05-modelo-de-datos.md).
 *
 * IMPORTANTE: funciones puras, sin React y sin acceso a datos. Son la unica
 * definicion de cada regla; las pantallas las consumen, no las reimplementan.
 * Cuando exista el backend, este archivo se comparte con el servidor.
 */

import type {
  Asamblea,
  Cuota,
  FechaISO,
  Periodo,
  Pqrs,
  Reserva,
  RolResidencia,
  Unidad,
  Visitante,
  Votacion,
  Voto,
  ZonaComun,
} from './tipos'

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
 * RN-04 — Una cuota es `vencida` si su vencimiento ya paso y no esta pagada.
 * Devuelve el estado real de la cuota en la fecha dada.
 */
export function estadoRealCuota(cuota: Cuota, hoy: FechaISO = hoyISO()): Cuota['estado'] {
  if (cuota.estado === 'pagada') return 'pagada'
  return cuota.fechaVencimiento < hoy ? 'vencida' : 'pendiente'
}

export function cuotaPendiente(cuota: Cuota): boolean {
  return cuota.estado !== 'pagada'
}

/** RN-03 — Saldo de una unidad: suma de cuotas pendientes y vencidas. */
export function calcularSaldo(cuotas: Cuota[]): number {
  return cuotas.filter(cuotaPendiente).reduce((total, cuota) => total + cuota.valor, 0)
}

/** Valor de las cuotas ya vencidas (subconjunto del saldo). */
export function calcularSaldoVencido(cuotas: Cuota[], hoy: FechaISO = hoyISO()): number {
  return cuotas
    .filter((cuota) => estadoRealCuota(cuota, hoy) === 'vencida')
    .reduce((total, cuota) => total + cuota.valor, 0)
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

/**
 * RN-06 — Un pago se imputa primero a la deuda mas antigua.
 * Devuelve las cuotas que cubre el valor recibido, en orden de antiguedad.
 */
export function imputarPago(cuotas: Cuota[], valor: number): Cuota[] {
  const pendientes = cuotas
    .filter(cuotaPendiente)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
  const cubiertas: Cuota[] = []
  let restante = valor
  for (const cuota of pendientes) {
    if (restante < cuota.valor) break
    cubiertas.push(cuota)
    restante -= cuota.valor
  }
  return cubiertas
}

/** RN-18 — Porcentaje de recaudo sobre lo facturado en un periodo. */
export function porcentajeRecaudo(cuotas: Cuota[], periodo: Periodo): number {
  const delPeriodo = cuotas.filter((cuota) => cuota.periodo === periodo)
  const facturado = delPeriodo.reduce((total, cuota) => total + cuota.valor, 0)
  if (facturado === 0) return 0
  const recaudado = delPeriodo
    .filter((cuota) => cuota.estado === 'pagada')
    .reduce((total, cuota) => total + cuota.valor, 0)
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

export interface ResultadoValidacion {
  valido: boolean
  motivo?: string
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

/**
 * RN-16 — El codigo solo es valido **dentro** de su vigencia.
 *
 * La vigencia tiene dos puntas y las dos cuentan: un visitante autorizado para el
 * sabado no puede entrar hoy. Antes de `vigenciaDesde` el codigo esta `programado`;
 * despues de `vigenciaHasta`, `vencido`. Ambas fechas son inclusive.
 */
export function estadoRealVisitante(
  visitante: Visitante,
  hoy: FechaISO = hoyISO(),
): Visitante['estado'] {
  if (visitante.estado === 'revocado') return 'revocado'
  if (visitante.vigenciaHasta < hoy) return 'vencido'
  if (visitante.vigenciaDesde > hoy) return 'programado'
  return 'activo'
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

/**
 * RN-27 — El peso del voto de una unidad en asamblea es su coeficiente.
 *
 * Confirmado por el equipo el 2026-08-26: el coeficiente no es solo un dato de
 * consulta, es lo que determina cuanto vale el voto de la unidad.
 *
 * Hoy solo lo usa la pantalla de consulta (CU-R-24). Cuando exista el modulo de
 * asambleas, esta es **la unica definicion** del peso del voto: la votacion debe
 * llamar aqui y no volver a leer `unidad.coeficiente` por su cuenta.
 */
export function pesoDelVoto(unidad: Unidad): number {
  return unidad.coeficiente
}

// ---------------------------------------------------------------------------
// Asambleas y votaciones — CU-R-13, CU-R-20
// ---------------------------------------------------------------------------

/**
 * RN-51 — Vota el propietario de la unidad, no quien la habita.
 *
 * Mary lo dijo asi el 2026-08-27: «el propietario va a tener la opcion para
 * votar los puntos de una asamblea». El arrendatario usa la copropiedad pero no
 * decide sobre ella; el voto va con la propiedad, igual que la cuota.
 *
 * Ojo: falta confirmar que pasa con el rol `autorizado` y con el apoderado
 * (CU-R-23), que vota unidades que no son suyas. Mientras no este definido, la
 * unica puerta abierta es la del propietario.
 */
export function puedeVotar(rol?: RolResidencia): boolean {
  return rol === 'propietario'
}

/** RN-29 — Un voto por unidad y por votacion. */
export function yaVoto(votos: Voto[], votacionId: string, unidadId?: string): Voto | undefined {
  if (!unidadId) return undefined
  return votos.find((voto) => voto.votacionId === votacionId && voto.unidadId === unidadId)
}

/** La votacion solo recibe votos mientras este abierta (RN-34). */
export function votacionRecibeVotos(votacion: Votacion): boolean {
  return votacion.estado === 'abierta'
}

export interface ConteoOpcion {
  opcionId: string
  texto: string
  /** Suma de coeficientes que eligieron la opcion (RN-27). */
  coeficiente: number
  unidades: number
}

export interface ConteoVotacion {
  porOpcion: ConteoOpcion[]
  /** Coeficiente total que voto. NO es el quorum: eso es otra cosa (RN-28). */
  coeficienteVotante: number
  unidadesVotantes: number
}

/**
 * Cuenta una votacion por coeficiente, no por cabezas (RN-27, RN-29).
 *
 * **No dice si el punto se aprobo**, y eso es a proposito: para eso hace falta la
 * mayoria exigida —simple, calificada, unanimidad— y el quorum con que se instalo
 * la asamblea, que son justo las reglas que el equipo tiene pendientes (RN-28,
 * T-10). Contar es aritmetica; declarar aprobado es derecho.
 */
export function contarVotacion(
  votacion: Votacion,
  votos: Voto[],
): ConteoVotacion {
  const emitidos = votos.filter((voto) => voto.votacionId === votacion.id)
  const porOpcion = votacion.opciones.map((opcion) => {
    const suyos = emitidos.filter((voto) => voto.opcionId === opcion.id)
    return {
      opcionId: opcion.id,
      texto: opcion.texto,
      coeficiente: Number(
        suyos.reduce((total, voto) => total + voto.coeficiente, 0).toFixed(4),
      ),
      unidades: suyos.length,
    }
  })
  return {
    porOpcion,
    coeficienteVotante: Number(
      emitidos.reduce((total, voto) => total + voto.coeficiente, 0).toFixed(4),
    ),
    unidadesVotantes: emitidos.length,
  }
}

/** Orden de la lista: primero lo que esta pasando, despues lo que viene, al final lo cerrado. */
export function ordenAsamblea(asamblea: Asamblea): number {
  return { instalada: 0, convocada: 1, cerrada: 2, cancelada: 3 }[asamblea.estado]
}

// ---------------------------------------------------------------------------
// Solicitudes — lo que el residente le pidio a la administracion
// ---------------------------------------------------------------------------

/**
 * Cuantas solicitudes de la unidad estan esperando respuesta.
 *
 * Es la suma de dos cosas que la persona vive igual —«pedi algo y no me han
 * contestado»— aunque en el modelo sean distintas: una PQRS sin cerrar y una
 * reserva sin aprobar. El paz y salvo no cuenta: se emite solo, no lo aprueba
 * nadie.
 *
 * Vive aqui y no en el cascaron porque es la definicion de «solicitud
 * pendiente», y esa la usa el contador de la pestana hoy y manana quien la
 * necesite.
 */
export function solicitudesEsperandoRespuesta(pqrs: Pqrs[], reservas: Reserva[]): number {
  return (
    pqrs.filter(pqrsAbierta).length +
    reservas.filter((reserva) => reserva.estado === 'solicitada').length
  )
}

