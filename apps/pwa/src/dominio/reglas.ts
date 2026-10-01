/**
 * Reglas de negocio del dominio (RN-xx de docs/05-modelo-de-datos.md).
 *
 * IMPORTANTE: funciones puras, sin React y sin acceso a datos. Son la unica
 * definicion de cada regla; las pantallas las consumen, no las reimplementan.
 * Cuando exista el backend, este archivo se comparte con el servidor.
 */

import type {
  Acta,
  Correspondencia,
  Residencia,
  AvanceProyecto,
  Proyecto,
  VerificacionActa,
  Asamblea,
  Asistencia,
  FormaAsistencia,
  MayoriaExigida,
  ModalidadAsamblea,
  Poder,
  CategoriaRegistro,
  ConceptoSancion,
  EstadoSancion,
  OrigenRespaldo,
  Sancion,
  RolUsuario,
  Cuota,
  EstadoCuota,
  FechaISO,
  Imputacion,
  EstadoCuentaCongelado,
  MovimientoCuenta,
  Pago,
  Periodo,
  Pqrs,
  RegistroPersona,
  CierreZona,
  HorarioDia,
  ModoUsoZona,
  MultaNoCancelar,
  RespaldoCobroZona,
  Hora,
  Reserva,
  RolResidencia,
  TipoCuota,
  Unidad,
  Visitante,
  Votacion,
  Voto,
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

/**
 * Suma **dias habiles**: salta sabados y domingos.
 *
 * Hace falta porque la Ley 675 cuenta asi los plazos del acta (art. 47: «veinte
 * dias habiles»). No contempla festivos —eso exige el calendario colombiano de
 * cada ano, que es un dato que la app no tiene— y por eso el plazo que calcula
 * es **el mas corto posible**: nunca dice que hay mas tiempo del que hay.
 */
export function sumarDiasHabiles(fecha: FechaISO, dias: number): FechaISO {
  let resultado = fecha
  let restantes = dias
  while (restantes > 0) {
    resultado = sumarDias(resultado, 1)
    const diaSemana = new Date(`${resultado}T12:00:00`).getDay()
    if (diaSemana !== 0 && diaSemana !== 6) restantes -= 1
  }
  return resultado
}

/** Corre una fecha `meses` hacia atras. Usa el calendario, no 30 dias por mes. */
export function restarMeses(fecha: FechaISO, meses: number): FechaISO {
  const base = new Date(`${fecha}T12:00:00`)
  base.setMonth(base.getMonth() - meses)
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
 * RN-46, RN-47 — Una cuota extraordinaria no existe sin el acta que la aprobo.
 *
 * **Solo la ordinaria puede ir sin respaldo.** Es la del mes, la que sostiene el
 * edificio y la que el reglamento ya autoriza de una vez y para siempre. Todo lo
 * demas es un cobro que alguien decidio en algun momento, y el copropietario
 * tiene derecho a saber quien y cuando.
 *
 * Y no basta con marcar «asamblea»: hace falta **cual** acta y **para que**
 * (RN-47, RN-48). «Aprobado en asamblea» sin fecha no se puede comprobar, y sin
 * destinacion no se puede reclamar cuando la plata se va a otra cosa.
 */
export function respaldoDeCuotaCompleto(parametros: {
  tipo: TipoCuota
  referencia?: string
  justificacion?: string
}): boolean {
  if (parametros.tipo !== 'extraordinaria') return true
  return !!parametros.referencia?.trim() && !!parametros.justificacion?.trim()
}

/**
 * RN-04 — Una cuota es `vencida` si su vencimiento ya paso y aun tiene saldo.
 * RN-75 — Si tiene abonos parciales pero todavia debe algo, esta `abonada`.
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
 * RN-76 — El abono puede cubrir una cuota solo en parte: se reparte hasta
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

/** RN-76 — Parte del pago que no quedo aplicada a ninguna cuota. */
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

/** RN-77 — Numero de recibo de caja: consecutivo por copropiedad, sin reuso. */
export function numeroRecibo(consecutivo: number): string {
  return `RC-${String(consecutivo).padStart(5, '0')}`
}

/** RN-78 — Solo se puede anular un recibo que este aplicado. */
export function sePuedeAnular(pago: Pago): boolean {
  return pago.estado === 'aplicado'
}

/** RN-79 — Un abono informado por el propietario espera a que se aplique. */
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
  /** En una zona compartida, cuantas personas van (RN-111). */
  personas?: number
}): ResultadoValidacion {
  const { zona, fecha, horaInicio, unidadId, cuotasDeLaUnidad, reservas, ahora } = parametros
  const personas = parametros.personas ?? 1

  if (!zonaActiva(zona)) {
    return { valido: false, motivo: 'Esta zona no está recibiendo reservas.' }
  }
  if (!horarioDelDia(zona, fecha)) {
    return { valido: false, motivo: `${zona.nombre} no abre los ${NOMBRES_DIA[diaDeLaSemana(fecha)]}.` }
  }
  const cierre = cierreEnFecha(zona, fecha)
  if (cierre) {
    return {
      valido: false,
      motivo: `La zona está cerrada por mantenimiento del ${fechaCorta(cierre.desde)} al ${fechaCorta(cierre.hasta)}.`,
    }
  }
  if (estaEnMora(cuotasDeLaUnidad)) {
    return {
      valido: false,
      motivo: 'La unidad tiene cuotas vencidas. Ponte al dia para reservar zonas comunes.',
    }
  }
  const motivoFranja = motivoFranjaNoDisponible(zona, reservas, fecha, horaInicio, unidadId, personas)
  if (motivoFranja) return { valido: false, motivo: motivoFranja }
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
export function franjasDeZona(
  zona: Pick<ZonaComun, 'horaInicio' | 'horaFin' | 'duracionBloqueHoras' | 'horarioSemanal'>,
  fecha?: FechaISO,
): Array<{ inicio: string; fin: string }> {
  const franjas: Array<{ inicio: string; fin: string }> = []
  // RN-114 — Con fecha, el horario de ese dia; un dia que no abre no tiene franjas.
  const horario = fecha ? horarioDelDia(zona, fecha) : zona
  if (!horario) return franjas
  const [horaInicio] = horario.horaInicio.split(':').map(Number)
  const [horaFin] = horario.horaFin.split(':').map(Number)
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
// Modalidad y asistencia — ADR-0007
//
// **La asistencia es la constante; el video es la variable.** El video existe en
// dos de las tres modalidades y en ninguna es el sistema de registro: por eso lo
// puede poner un tercero (Zoom, Meet) sin que Idiky pierda nada.
// ---------------------------------------------------------------------------

/** Que exige cada modalidad al convocar, y como se le explica a quien convoca. */
export const MODALIDADES: ReadonlyArray<{
  id: ModalidadAsamblea
  texto: string
  /** Que le pasa a quien asiste. */
  detalle: string
  exigeLugar: boolean
  exigeEnlace: boolean
}> = [
  {
    id: 'presencial',
    texto: 'Presencial',
    detalle: 'Se reúnen en un lugar. No hay transmisión.',
    exigeLugar: true,
    exigeEnlace: false,
  },
  {
    id: 'virtual',
    texto: 'Virtual',
    detalle: 'Se reúnen por Zoom, Meet, Teams o Vimeo. Idiky enlaza esa reunión o transmisión.',
    exigeLugar: false,
    exigeEnlace: true,
  },
  {
    id: 'mixta',
    texto: 'Mixta',
    // Ya se puede decir que suman al mismo quorum: lo respondio Mary el
    // 2026-09-10 y ademas lo dice la ley (RN-92). Se siguen contando por
    // separado porque el acta necesita el reparto, no porque pesen distinto.
    detalle: 'Unos en el salón y otros conectados. Las dos formas pesan igual (RN-92).',
    exigeLugar: true,
    exigeEnlace: true,
  },
]

export function definicionModalidad(modalidad: ModalidadAsamblea) {
  return MODALIDADES.find((m) => m.id === modalidad)!
}

// ---------------------------------------------------------------------------
// RN-98 — La herramienta se reconoce por el enlace, y **una transmision no es
// una reunion**.
//
// «Incluyamos Vimeo como una opcion, dejando las salvedades» (Mary,
// 2026-09-28). Entra sin tocar ADR-0007: un enlace es un enlace. Lo que si
// cambia es **como interviene quien esta conectado**: en Zoom, Meet o Teams
// habla; en Vimeo o YouTube ve y oye, e interviene por el chat de la
// transmision. Y eso importa por la ley: el art. 42 de la Ley 675 admite la
// reunion no presencial cuando los copropietarios pueden **deliberar** por
// un medio de comunicacion simultanea o sucesiva. Con una transmision de una
// sola via, la deliberacion depende de ese chat.
//
// Idiky **lo dice, no lo impide** (mismo criterio que el tope de poderes,
// RN-30): quien convoca ve la salvedad y decide; el copropietario conectado
// sabe por donde intervenir; y queda como pregunta para el abogado si el
// chat basta para deliberar (§3 bis).
// ---------------------------------------------------------------------------

export type HerramientaTransmision = 'zoom' | 'meet' | 'teams' | 'vimeo' | 'youtube' | 'otra'

export const HERRAMIENTAS_TRANSMISION: ReadonlyArray<{
  id: HerramientaTransmision
  nombre: string
  /** Fragmentos del dominio que la identifican. */
  dominios: string[]
  /** `true`: transmision de una sola via — se ve, no se habla. */
  unaVia: boolean
  /** Como interviene quien esta conectado. Se le dice al copropietario. */
  comoIntervenir: string
}> = [
  { id: 'zoom', nombre: 'Zoom', dominios: ['zoom.us', 'zoom.com'], unaVia: false, comoIntervenir: 'Pides la palabra en la reunión.' },
  { id: 'meet', nombre: 'Meet', dominios: ['meet.google.com'], unaVia: false, comoIntervenir: 'Pides la palabra en la reunión.' },
  { id: 'teams', nombre: 'Teams', dominios: ['teams.microsoft.com', 'teams.live.com'], unaVia: false, comoIntervenir: 'Pides la palabra en la reunión.' },
  { id: 'vimeo', nombre: 'Vimeo', dominios: ['vimeo.com'], unaVia: true, comoIntervenir: 'Ves y oyes la asamblea; intervienes por el chat de la transmisión.' },
  { id: 'youtube', nombre: 'YouTube', dominios: ['youtube.com', 'youtu.be'], unaVia: true, comoIntervenir: 'Ves y oyes la asamblea; intervienes por el chat de la transmisión.' },
  { id: 'otra', nombre: 'la reunión', dominios: [], unaVia: false, comoIntervenir: 'Pides la palabra en la reunión.' },
]

/** Que herramienta hay detras del enlace. Sin enlace, nada. */
export function herramientaDeEnlace(enlace?: string) {
  if (!enlace?.trim()) return undefined
  let host = ''
  try {
    host = new URL(enlace.trim()).hostname.toLowerCase()
  } catch {
    host = enlace.trim().toLowerCase()
  }
  return (
    HERRAMIENTAS_TRANSMISION.find((h) => h.dominios.some((d) => host === d || host.endsWith('.' + d))) ??
    HERRAMIENTAS_TRANSMISION[HERRAMIENTAS_TRANSMISION.length - 1]
  )
}

/**
 * RN-98 — La salvedad que ve quien convoca, o `null` si no hace falta: solo
 * cuando hay gente conectada (virtual o mixta) y el canal es de una via.
 */
export function salvedadCanalDeUnaVia(asamblea: {
  modalidad: ModalidadAsamblea
  enlaceTransmision?: string
}): string | null {
  if (asamblea.modalidad === 'presencial') return null
  const herramienta = herramientaDeEnlace(asamblea.enlaceTransmision)
  if (!herramienta?.unaVia) return null
  return (
    `${herramienta.nombre} es una transmisión de una sola vía: los conectados ven y oyen, pero no hablan. ` +
    'Intervienen por el chat de la transmisión y votan en Idiky. La Ley 675 (art. 42) exige que en la reunión ' +
    'no presencial los copropietarios puedan deliberar; si el chat basta para eso es una pregunta para el abogado.'
  )
}

/**
 * RN-99 — La grabacion se enlaza y el acta la cita; no reemplaza nada.
 *
 * Solo tiene sentido cuando hubo transmision y la asamblea ya empezo: antes no
 * hay nada grabado.
 */
export function admiteGrabacion(asamblea: Asamblea): boolean {
  return asamblea.modalidad !== 'presencial' && asamblea.estado !== 'convocada' && asamblea.estado !== 'cancelada'
}

/**
 * ADR-0007 — La convocatoria esta completa segun **su** modalidad.
 *
 * Una asamblea virtual sin enlace no dice donde es, y una presencial sin lugar
 * tampoco. Es el mismo examen que el respaldo de un cobro (RN-45): lo que se
 * exige depende de que clase de cosa se esta creando, no de un formulario que
 * pide todo por si acaso.
 */
export function convocatoriaCompleta(asamblea: {
  modalidad: ModalidadAsamblea
  lugar?: string
  enlaceTransmision?: string
}): boolean {
  const definicion = definicionModalidad(asamblea.modalidad)
  if (definicion.exigeLugar && !asamblea.lugar?.trim()) return false
  if (definicion.exigeEnlace && !asamblea.enlaceTransmision?.trim()) return false
  return true
}

/** Formas de asistir que admite la modalidad (ADR-0007). */
export function formasDeAsistir(modalidad: ModalidadAsamblea): FormaAsistencia[] {
  if (modalidad === 'presencial') return ['presencial']
  if (modalidad === 'virtual') return ['virtual']
  return ['presencial', 'virtual']
}

/** La asistencia de una unidad a una asamblea, si la marco. */
export function asistenciaDeUnidad(
  asistencias: Asistencia[],
  asambleaId: string,
  unidadId: string,
): Asistencia | undefined {
  return asistencias.find((a) => a.asambleaId === asambleaId && a.unidadId === unidadId)
}

/**
 * RN-92 — **La forma de asistir no cambia lo que pesa la unidad.**
 *
 * «La asistencia virtual pesa igual que la presencial» (Mary, 2026-09-10), y la
 * ley dice lo mismo por dos lados. El art. 42 de la Ley 675 admite la reunion no
 * presencial «de conformidad con **el quorum requerido para el respectivo
 * caso**» —el mismo quorum, no uno propio— y el Decreto 398 de 2020, art. 1, lo
 * deja escrito para las mixtas: «Las disposiciones legales y estatutarias sobre
 * convocatoria, quorum y mayorias de las reuniones presenciales seran igualmente
 * aplicables a las reuniones no presenciales… y a las reuniones mixtas».
 *
 * Por eso `coeficiente` es **una sola suma**: quien esta en el salon y quien
 * esta conectado entran al mismo total. El reparto por forma se sigue llevando,
 * pero **para el acta, no para el quorum** — el art. 47 exige decir quien
 * asistio y como, y en una mixta eso es justamente lo que hay que poder mostrar.
 *
 * La distincion que si importa no es donde estaba la persona sino **si es
 * propietario o apoderado** (RN-51, RN-30): esa si cambia si suma.
 */
export function resumenAsistencia(
  asistencias: Asistencia[],
  asambleaId: string,
): {
  unidades: number
  coeficiente: number
  presenciales: number
  virtuales: number
} {
  const dela = asistencias.filter((a) => a.asambleaId === asambleaId)
  return {
    unidades: dela.length,
    coeficiente: dela.reduce((total, a) => total + a.coeficiente, 0),
    presenciales: dela.filter((a) => a.forma === 'presencial').length,
    virtuales: dela.filter((a) => a.forma === 'virtual').length,
  }
}

/**
 * RN-28 — **¿Hay quorum?** Ley 675 de 2001, articulos 41 y 45.
 *
 * Verificado contra la norma el 2026-09-10, y conviene escribir lo que dice
 * porque de memoria se repite mal:
 *
 * > «La asamblea general sesionara con un **numero plural de propietarios** de
 * > unidades privadas que representen por lo menos, **mas de la mitad de los
 * > coeficientes** de propiedad» (art. 45).
 *
 * Tres cosas que no son lo que uno diria:
 *
 * 1. **Son dos condiciones, no una.** «Numero plural» significa **dos
 *    propietarios como minimo**: una sola unidad con el 60 % del edificio **no
 *    hace quorum**. Es lo que impide que un solo dueno mayoritario sesione solo.
 * 2. **Se supera la mitad, no se alcanza.** Con 50 exacto no hay quorum; con
 *    50,5 si. El «51 %» que se dice de memoria deja fuera asambleas validas.
 * 3. **El 50 + 1 no es esto.** Ese es el umbral de la *decision*, y sobre lo
 *    representado en la sesion, no sobre el edificio (ver `resultadoVotacion`).
 *
 * Y la valvula de escape (art. 41): si la primera convocatoria no pudo sesionar,
 * **la segunda sesiona con cualquier numero plural de propietarios, sea cual sea
 * el coeficiente**. Sin eso, una copropiedad donde la gente no va quedaria
 * paralizada para siempre.
 *
 * Lo que se cuenta es **la unidad**, este quien este y **este donde este**: la
 * forma de asistir no cambia el peso (RN-92).
 */
export function hayQuorum(
  asamblea: Asamblea,
  resumen: { unidades: number; coeficiente: number },
  quorumMinimo: number,
): boolean {
  // Numero plural: en las dos convocatorias.
  if (resumen.unidades < 2) return false
  if (asamblea.numeroConvocatoria === 2) return true
  return resumen.coeficiente > quorumMinimo
}

/** Lo que le falta al quorum, en coeficiente. `0` si ya lo hay. */
export function faltaParaQuorum(
  asamblea: Asamblea,
  resumen: { unidades: number; coeficiente: number },
  quorumMinimo: number,
): number {
  if (hayQuorum(asamblea, resumen, quorumMinimo)) return 0
  if (asamblea.numeroConvocatoria === 2) return 0
  return Number((quorumMinimo - resumen.coeficiente).toFixed(4))
}

/**
 * RN-74 — **¿Se aprobo el punto?** Ley 675 de 2001, articulos 45 y 46.
 *
 * Las dos mayorias se miden **sobre bases distintas**, y confundirlas es el
 * error que anula una votacion:
 *
 * - **Simple** (art. 45): «el voto favorable de la **mitad mas uno de los
 *   coeficientes representados en la respectiva sesion**». La base es **lo que
 *   asistio**, no el edificio.
 * - **Calificada** (art. 46): «el **setenta por ciento (70 %) de los
 *   coeficientes que integran el edificio** o conjunto». Aqui la base **si** es
 *   el edificio entero, y por eso es tan dificil de alcanzar — es a proposito.
 *
 * Se devuelve tambien `base` para poder **decir sobre que se calculo**: un
 * resultado que no dice su base es un numero que nadie puede comprobar.
 */
export function resultadoVotacion(parametros: {
  conteo: ConteoVotacion
  mayoria: MayoriaExigida
  /** Coeficiente representado en la sesion (asistencia), para la simple. */
  coeficienteRepresentado: number
  /** Coeficiente total del edificio, para la calificada. Normalmente 100. */
  coeficienteEdificio: number
}): {
  aprobada?: { opcionId: string; texto: string; coeficiente: number }
  umbral: number
  base: number
  baseTexto: string
} {
  const { conteo, mayoria, coeficienteRepresentado, coeficienteEdificio } = parametros
  const base = mayoria === 'calificada' ? coeficienteEdificio : coeficienteRepresentado
  const umbral = mayoria === 'calificada' ? base * 0.7 : base / 2
  const baseTexto =
    mayoria === 'calificada'
      ? 'del coeficiente del edificio'
      : 'del coeficiente representado en la sesión'

  // La calificada se **alcanza** (70 %); la simple se **supera** (mas de la
  // mitad). No es un detalle: con exactamente la mitad, la simple no pasa.
  const ganadora = conteo.porOpcion.find((opcion) =>
    mayoria === 'calificada' ? opcion.coeficiente >= umbral : opcion.coeficiente > umbral,
  )

  return {
    aprobada: ganadora
      ? { opcionId: ganadora.opcionId, texto: ganadora.texto, coeficiente: ganadora.coeficiente }
      : undefined,
    umbral: Number(umbral.toFixed(4)),
    base: Number(base.toFixed(4)),
    baseTexto,
  }
}

// ---------------------------------------------------------------------------
// El acta — Ley 675 de 2001, articulo 47 · CU-A-20
// ---------------------------------------------------------------------------

/**
 * RN-35 — Un acta se genera **de una asamblea cerrada**, no antes.
 *
 * Antes de cerrar no hay de que dar fe: podrian entrar mas asistentes y abrirse
 * mas votaciones, y un acta que cambia sola no es un acta.
 */
export function puedeGenerarActa(asamblea: Asamblea): boolean {
  return asamblea.estado === 'cerrada'
}

/**
 * Art. 47 — El plazo para verificarla y ponerla a disposicion.
 *
 * «Dentro del termino que fije el reglamento y, en su defecto, dentro de los
 * **veinte (20) dias habiles** siguientes al de la respectiva reunion».
 */
export const DIAS_HABILES_ACTA = 20

export function limiteVerificacionActa(fechaAsamblea: string): FechaISO {
  return sumarDiasHabiles(fechaAsamblea.slice(0, 10), DIAS_HABILES_ACTA)
}

/**
 * Que le falta al acta para poder aprobarse (art. 47).
 *
 * Devuelve **la lista de lo que falta**, no un booleano: un boton que se niega
 * sin decir por que obliga a adivinar, y aqui lo que falta son cosas concretas
 * y distintas entre si.
 */
export function faltaEnActa(acta: Acta, hoy: FechaISO = hoyISO()): string[] {
  const falta: string[] = []
  if (!acta.presidenteId) falta.push('quién presidió la asamblea')
  if (!acta.secretarioId) falta.push('quién actuó como secretario')
  if (acta.desarrollo.trim().length < 20) falta.push('el desarrollo de la reunión')
  // RN-95 — Con comision, el plazo no es opcional: sin el, la revision no
  // termina nunca y el acta tampoco.
  if (actaTieneComision(acta) && !acta.limiteComision) {
    falta.push('el plazo máximo de la comisión verificadora')
  }
  const pendientes = verificadoresQueBloquean(acta, hoy)
  if (pendientes.length > 0) {
    falta.push(
      pendientes.length === 1
        ? 'la revisión de un miembro de la comisión verificadora'
        : `la revisión de ${pendientes.length} miembros de la comisión verificadora`,
    )
  }
  return falta
}

// ---------------------------------------------------------------------------
// RN-93 — La comision verificadora del acta: **opcional**.
//
// «Dejala como una opcion para que el administrador seleccione, **a veces hay
// revision**» (Mary, 2026-09-10). Y es exacto: la Ley 675 no la exige. El
// art. 47 pide que el acta la firmen el presidente y el secretario y no
// menciona ninguna comision — la designa la asamblea o la impone el reglamento,
// asi que la app **no puede exigirla ni puede ignorarla**.
//
// De ahi la forma: una lista que puede estar vacia. Vacia, el acta se aprueba
// como siempre; con gente, no se aprueba hasta que todos revisen. Sin ninguna
// bandera aparte que se pueda desincronizar de los datos.
// ---------------------------------------------------------------------------

/** Si esta asamblea designo comision. Vacio es una respuesta, no un dato falta. */
export function actaTieneComision(acta: Acta): boolean {
  return acta.verificadores.length > 0
}

/**
 * RN-93 — **Una revision vale sobre el texto que se reviso.**
 *
 * Si el acta se edita despues de que alguien la reviso, esa revision deja de
 * valer: reviso otra cosa. Lo contrario permitiria recoger las firmas y despues
 * cambiar el texto, que es precisamente el fraude que una comision existe para
 * impedir.
 *
 * **No se borra nada** (RN-61): la revision queda con su fecha y se ve que
 * quedo sin efecto. Que el administrador edito despues es, en si mismo, un dato
 * del expediente.
 */
export function verificacionVigente(acta: Acta, verificacion: VerificacionActa): boolean {
  return verificacion.verificadaEn >= (acta.editadaEn ?? acta.creadaEn)
}

/** Las revisiones que todavia valen sobre el texto de hoy. */
export function verificacionesVigentes(acta: Acta): VerificacionActa[] {
  return acta.verificaciones.filter((v) => verificacionVigente(acta, v))
}

/** Quienes de la comision no han revisado —o revisaron un texto ya cambiado. */
export function verificadoresPendientes(acta: Acta): string[] {
  const yaRevisaron = new Set(verificacionesVigentes(acta).map((v) => v.personaId))
  return acta.verificadores.filter((personaId) => !yaRevisaron.has(personaId))
}

// ---------------------------------------------------------------------------
// RN-95 — La comision tiene un plazo maximo, y lo fija el administrador.
//
// «Para la revision del acta debe existir un plazo maximo que lo define el
// administrador» (Mary, 2026-09-17). Sin plazo, un solo miembro que no revise
// deja el acta en borrador para siempre, y con ella las decisiones de la
// asamblea. El plazo es lo que impide que la comision —que existe para
// garantizar el acta— termine bloqueandola.
//
// Dos cosas fijas alrededor de lo que el administrador decide:
// - **No puede pasar del termino del art. 47** (`limiteVerificacion`): el acta
//   tiene que estar a disposicion en esos veinte dias habiles, con o sin
//   revision. Un plazo de comision mas largo obligaria al administrador a
//   incumplir la ley para respetarlo.
// - **Vencido, no se borra nada** (RN-61): quien no reviso queda en el acta
//   como «no reviso dentro del plazo». La comision fue designada por la
//   asamblea y el acta tiene que decir que paso con ella.
// ---------------------------------------------------------------------------

/**
 * Por que no sirve una fecha como plazo de la comision, o `null` si sirve.
 *
 * Devuelve el motivo y no un booleano por lo mismo que `faltaEnActa`: el
 * formulario lo muestra tal cual, y el repositorio lo lanza tal cual.
 */
export function motivoPlazoComisionInvalido(
  acta: Pick<Acta, 'limiteVerificacion'>,
  limiteComision: FechaISO,
  hoy: FechaISO = hoyISO(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(limiteComision)) return 'El plazo tiene que ser una fecha.'
  if (limiteComision < hoy) return 'El plazo de la comisión no puede estar en el pasado.'
  // El tope legal solo se aplica mientras existe: si el termino del art. 47 ya
  // paso, el acta ya va tarde y acortar mas a la comision no lo remedia.
  const tope = topePlazoComision(acta, hoy)
  if (tope && limiteComision > tope) {
    return 'El plazo de la comisión no puede pasar del término para poner el acta a disposición (Ley 675, art. 47).'
  }
  return null
}

/**
 * Hasta donde puede llegar el plazo de la comision: el termino del art. 47,
 * **mientras no haya pasado**. Pasado, no hay tope (`undefined`) — ver arriba.
 */
export function topePlazoComision(
  acta: Pick<Acta, 'limiteVerificacion'>,
  hoy: FechaISO = hoyISO(),
): FechaISO | undefined {
  return acta.limiteVerificacion >= hoy ? acta.limiteVerificacion : undefined
}

/** La comision ya no tiene tiempo: hubo plazo y `hoy` lo pasó. */
export function comisionVencida(acta: Acta, hoy: FechaISO = hoyISO()): boolean {
  return actaTieneComision(acta) && !!acta.limiteComision && hoy > acta.limiteComision
}

/**
 * Quienes de la comision todavia **detienen** la aprobacion: los pendientes,
 * mientras el plazo corre. Vencido el plazo, nadie — la espera termino.
 */
export function verificadoresQueBloquean(acta: Acta, hoy: FechaISO = hoyISO()): string[] {
  return comisionVencida(acta, hoy) ? [] : verificadoresPendientes(acta)
}

/** Quienes no revisaron **y ya no pueden**: lo que el acta deja escrito. */
export function verificadoresFueraDePlazo(acta: Acta, hoy: FechaISO = hoyISO()): string[] {
  return comisionVencida(acta, hoy) ? verificadoresPendientes(acta) : []
}

/**
 * El acta paso la revision. **Sin comision, pasa sola**: no hay nada que pasar.
 * **Con el plazo vencido, tambien** (RN-95): lo que quedo sin revisar consta,
 * pero ya no detiene el acta.
 */
export function actaVerificada(acta: Acta, hoy: FechaISO = hoyISO()): boolean {
  return verificadoresQueBloquean(acta, hoy).length === 0
}

/**
 * En que va el acta. **Se deriva, no se guarda**: un estado guardado que
 * depende de otros campos es un estado que tarde o temprano los contradice.
 */
export function estadoActa(
  acta: Acta,
  hoy: FechaISO = hoyISO(),
): 'borrador' | 'en_verificacion' | 'aprobada' {
  if (acta.estado === 'aprobada') return 'aprobada'
  if (actaTieneComision(acta) && !actaVerificada(acta, hoy)) return 'en_verificacion'
  return 'borrador'
}

/**
 * RN-35 — **Un acta aprobada no se edita.**
 *
 * Y no se edita de verdad: la comprobacion vive en el repositorio, no en un
 * boton escondido. Para corregirla se emite un **acta aclaratoria** que la
 * referencia (CU-A-20, A2) — corregir el pasado y corregirlo *a la vista* no
 * son lo mismo, y de un acta lo segundo es lo unico admisible.
 */
export function actaCongelada(acta: Acta): boolean {
  return acta.estado === 'aprobada'
}

/** El acta de una asamblea, si ya se genero. */
export function actaDeAsamblea(actas: Acta[], asambleaId: string): Acta | undefined {
  return actas.find((acta) => acta.asambleaId === asambleaId && !acta.aclaraActaId)
}

/** Las aclaratorias de un acta, de la mas vieja a la mas nueva. */
export function aclaratoriasDe(actas: Acta[], actaId: string): Acta[] {
  return actas
    .filter((acta) => acta.aclaraActaId === actaId)
    .sort((a, b) => a.creadaEn.localeCompare(b.creadaEn))
}

/** La mayoria que exige un punto. Sin decir nada, la general de la ley. */
export function mayoriaDelPunto(punto: { mayoria?: MayoriaExigida }): MayoriaExigida {
  return punto.mayoria ?? 'simple'
}

/**
 * RN-94 — **Hay decisiones que esta sesion no puede tomar, aunque se voten.**
 *
 * El paragrafo del articulo 46 es facil de pasar por alto y caro de pasar por
 * alto: «Las decisiones previstas en este articulo **no podran tomarse en
 * reuniones no presenciales**, ni en reuniones de segunda convocatoria, salvo
 * que en este ultimo caso se obtenga la mayoria exigida por esta ley». Y el
 * mismo articulo cierra: las decisiones adoptadas en contravencion suya son
 * **absolutamente nulas**.
 *
 * O sea que no es una recomendacion ni un umbral mas alto: es una **puerta
 * cerrada**. Una copropiedad puede reunirse por Zoom para todo (art. 42,
 * RN-92), pero no para reformar el reglamento ni para aprobar la extraordinaria
 * grande. Sin esto, Idiky abriria la votacion, sumaria los coeficientes y el
 * acta reportaria «se APRUEBA» una decision que nace nula — que es el peor de
 * los errores posibles en este modulo, porque nadie se entera hasta que alguien
 * la impugna.
 *
 * **La segunda convocatoria no se bloquea**: la ley la admite si aun asi se
 * obtiene el 70 %, y eso ya lo comprueba `resultadoVotacion`, que nunca relaja
 * el umbral de la calificada.
 *
 * **La mixta se trata como no presencial, y es una deduccion, no una cita.** El
 * art. 46 dice «no presenciales» y en 2001 no existia la mixta. Quien la trae al
 * caso es el Decreto 398 de 2020, art. 1: «Las reglas relativas a las reuniones
 * no presenciales seran igualmente aplicables a las reuniones mixtas». Se sigue
 * el camino conservador —restringe, no habilita— y **queda anotado como pregunta
 * para el abogado** (§3 bis): si se resolviera que la mixta con quorum presencial
 * suficiente si puede, esto se afloja en una linea.
 */
export function decisionAdmisibleEnLaSesion(
  asamblea: { modalidad: ModalidadAsamblea },
  punto: { mayoria?: MayoriaExigida },
): { admisible: boolean; motivo?: string } {
  if (mayoriaDelPunto(punto) !== 'calificada') return { admisible: true }
  if (asamblea.modalidad === 'presencial') return { admisible: true }
  return {
    admisible: false,
    motivo:
      'Las decisiones de mayoría calificada no pueden tomarse en reuniones no presenciales ' +
      '(Ley 675 de 2001, artículo 46, parágrafo). Este punto tiene que llevarse a una sesión ' +
      'presencial: lo que se decida aquí sería absolutamente nulo.',
  }
}

/** Solo tiene sentido marcar asistencia mientras la asamblea esta instalada. */
export function admiteAsistencia(asamblea: Asamblea): boolean {
  return asamblea.estado === 'instalada'
}

// ---------------------------------------------------------------------------
// Poderes — RN-29, RN-30 · CU-A-19
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// RN-96 — El poder que el propietario envia en foto **no vale hasta que la
// administracion lo valide**.
//
// «Que el propietario lo envie adjuntando una foto del documento» (Mary,
// 2026-09-17). Es la tercera puerta, y se distingue de las otras dos en quien
// vio el papel: en CU-A-19 lo tuvo el administrador en la mano, en CU-R-23 no
// hay papel porque respalda la sesion. Aqui el papel lo vio el propietario, y
// lo que hace valido un poder en papel es que **la administracion** lo vea.
// Mientras tanto la unidad no esta representada: vota su propietario, como si
// el poder no existiera. Un rechazo lleva motivo y no se borra (RN-61).
// ---------------------------------------------------------------------------

/** Enviado desde la app y todavia sin mirar por la administracion. */
export function poderEsperandoValidacion(poder: Poder): boolean {
  return poder.validacion?.estado === 'esperando'
}

export function poderRechazado(poder: Poder): boolean {
  return poder.validacion?.estado === 'rechazado'
}

/**
 * Un poder representa cuando no esta revocado **y esta validado** (RN-96). Los
 * que no llevan `validacion` lo estan por construccion. **No se borra** (RN-61).
 */
export function poderVigente(poder: Poder): boolean {
  return !poder.revocadoEn && !poderEsperandoValidacion(poder) && !poderRechazado(poder)
}

/**
 * Vigente **o esperando**: lo que ocupa el lugar de representante de la unidad.
 * Un poder por validar no representa, pero si impide dar otro mientras tanto —
 * si no, el propietario podria dejar dos en cola y la administracion validar
 * los dos.
 */
export function poderEnCurso(poder: Poder): boolean {
  return !poder.revocadoEn && !poderRechazado(poder)
}

/** El poder en curso de la unidad (vigente o por validar), si lo hay. */
export function poderEnCursoDeUnidad(
  poderes: Poder[],
  asambleaId: string,
  unidadId: string,
): Poder | undefined {
  return poderes.find(
    (poder) => poder.asambleaId === asambleaId && poder.unidadId === unidadId && poderEnCurso(poder),
  )
}

/**
 * El ultimo poder que la administracion rechazo a esta unidad, **si no hay
 * otro en curso**: es lo que el propietario necesita ver para corregir y
 * volver a enviar. Con uno en curso, el rechazo anterior ya es historia.
 */
export function ultimoPoderRechazadoDeUnidad(
  poderes: Poder[],
  asambleaId: string,
  unidadId: string,
): Poder | undefined {
  if (poderEnCursoDeUnidad(poderes, asambleaId, unidadId)) return undefined
  return poderes
    .filter((p) => p.asambleaId === asambleaId && p.unidadId === unidadId && poderRechazado(p))
    .sort((a, b) => b.registradoEn.localeCompare(a.registradoEn))[0]
}

/** Los poderes vigentes de una asamblea. */
export function poderesDeAsamblea(poderes: Poder[], asambleaId: string): Poder[] {
  return poderes.filter((poder) => poder.asambleaId === asambleaId && poderVigente(poder))
}

/** Quien representa a esta unidad en esta asamblea, si alguien la representa. */
export function poderDeUnidad(
  poderes: Poder[],
  asambleaId: string,
  unidadId: string,
): Poder | undefined {
  return poderesDeAsamblea(poderes, asambleaId).find((poder) => poder.unidadId === unidadId)
}

/** Las unidades que una persona representa en esta asamblea (RN-29, RN-30). */
export function unidadesRepresentadas(
  poderes: Poder[],
  asambleaId: string,
  apoderadoId: string,
): Poder[] {
  return poderesDeAsamblea(poderes, asambleaId).filter(
    (poder) => poder.apoderadoId === apoderadoId,
  )
}

/**
 * RN-30 — **El tope no existe en el codigo porque no existe en la ley.**
 *
 * Revisado el 2026-09-10 contra la Ley 675 de 2001: **no fija ningun tope** de
 * poderes por apoderado. Lo puede fijar el **reglamento** de cada copropiedad
 * —la practica comun son tres o cuatro— y mientras este no lo haga, no hay nada
 * que comprobar.
 *
 * Lo que si se puede hacer, y se hace, es **poner el dato a la vista**: cuantas
 * unidades y cuanto coeficiente acumula cada apoderado, para que el
 * administrador lo juzgue con el reglamento en la mano. Ver
 * `acumuladoPorApoderado`.
 */
export function acumuladoPorApoderado(
  poderes: Poder[],
  asambleaId: string,
  coeficienteDe: (unidadId: string) => number,
): Array<{ apoderadoId: string; unidades: number; coeficiente: number }> {
  const porPersona = new Map<string, { apoderadoId: string; unidades: number; coeficiente: number }>()
  for (const poder of poderesDeAsamblea(poderes, asambleaId)) {
    const actual = porPersona.get(poder.apoderadoId) ?? {
      apoderadoId: poder.apoderadoId,
      unidades: 0,
      coeficiente: 0,
    }
    actual.unidades += 1
    actual.coeficiente += coeficienteDe(poder.unidadId)
    porPersona.set(poder.apoderadoId, actual)
  }
  return [...porPersona.values()].sort((a, b) => b.coeficiente - a.coeficiente)
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


// ---------------------------------------------------------------------------
// Porteria — CU-P-01, CU-P-02
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Registro de personas — RN-57 a RN-62 · CU-R-27, CU-R-28
//
// Tres actos separados: **registrar**, **adjuntar** y **autorizar**. Nunca los
// hace la misma persona en el mismo momento, y de ahi sale todo lo demas.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Debido proceso sancionatorio — RN-39, RN-69 · CU-A-23, CU-R-29
//
// La Ley 675 de 2001 exige que el copropietario sea oido antes de sancionarlo.
// **Los terminos no los fija la app**: los fija el reglamento de cada
// copropiedad, y aqui se leen de sus parametros (RN-49).
// ---------------------------------------------------------------------------

/**
 * Las seis etapas, con lo que significan y quien tiene la pelota.
 *
 * Saber **de quien es el turno** es la mitad de lo que hace util esta pantalla:
 * un expediente en el que los dos creen que espera al otro es un expediente que
 * se vence solo.
 */
export const ETAPAS_SANCION: Record<
  EstadoSancion,
  { texto: string; chip: string; turno: 'copropietario' | 'administracion' | 'nadie' }
> = {
  notificada: { texto: 'Esperando descargos', chip: 'chip chip--alerta', turno: 'copropietario' },
  en_estudio: { texto: 'Descargos por revisar', chip: 'chip chip--info', turno: 'administracion' },
  resuelta: { texto: 'Sancionada, puede impugnar', chip: 'chip chip--alerta', turno: 'copropietario' },
  impugnada: { texto: 'Impugnación por resolver', chip: 'chip chip--info', turno: 'administracion' },
  firme: { texto: 'En firme', chip: 'chip chip--error', turno: 'nadie' },
  archivada: { texto: 'Archivada', chip: 'chip chip--exito', turno: 'nadie' },
}

/** Un expediente sigue vivo mientras alguien pueda hacer algo con el. */
export function sancionEnCurso(sancion: Sancion): boolean {
  return sancion.estado !== 'firme' && sancion.estado !== 'archivada'
}

/**
 * RN-69 — El copropietario puede hablar mientras su plazo no se venza.
 *
 * Se compara con la fecha limite que se **copio al imponer la sancion**, no con
 * el parametro de hoy: si la copropiedad cambia el termino manana, los
 * expedientes en curso conservan el que se les notifico. Cambiar las reglas a
 * mitad del proceso es exactamente lo que el debido proceso prohibe.
 */
export function puedePresentarDescargos(sancion: Sancion, hoy: FechaISO = hoyISO()): boolean {
  return sancion.estado === 'notificada' && hoy <= sancion.limiteDescargos
}

export function puedeImpugnar(sancion: Sancion, hoy: FechaISO = hoyISO()): boolean {
  return (
    sancion.estado === 'resuelta' &&
    !!sancion.limiteImpugnacion &&
    hoy <= sancion.limiteImpugnacion
  )
}

/**
 * RN-39 — Cuando la sancion puede quedar en firme, que es cuando nace la cuota.
 *
 * Dos caminos: **se vencio el plazo de impugnacion sin que impugnara**, o
 * **se resolvio la impugnacion**. Nunca antes: una multa que se cobra mientras
 * el copropietario todavia puede impugnarla es una multa cobrada sin proceso.
 */
export function puedeQuedarEnFirme(sancion: Sancion, hoy: FechaISO = hoyISO()): boolean {
  if (sancion.estado === 'impugnada') return true
  return (
    sancion.estado === 'resuelta' &&
    !!sancion.limiteImpugnacion &&
    hoy > sancion.limiteImpugnacion
  )
}

/** Dias que le quedan a quien tenga el turno. Negativo si ya se vencio. */
export function diasDePlazo(sancion: Sancion, hoy: FechaISO = hoyISO()): number | null {
  if (sancion.estado === 'notificada') return diasEntre(hoy, sancion.limiteDescargos)
  if (sancion.estado === 'resuelta' && sancion.limiteImpugnacion) {
    return diasEntre(hoy, sancion.limiteImpugnacion)
  }
  return null
}

/** Lo que le toca a la administracion resolver ahora. */
export function sancionesPorResolver(sanciones: Sancion[]): Sancion[] {
  return sanciones.filter(
    (sancion) => sancion.estado === 'en_estudio' || sancion.estado === 'impugnada',
  )
}

// ---------------------------------------------------------------------------
// Catalogo de multas — RN-38, RN-40 · CU-A-22
// ---------------------------------------------------------------------------

/**
 * Como se cita cada origen del respaldo (RN-38).
 *
 * No es cosmetica: **decide que se le pide a quien parametriza**. Un reglamento
 * se cita por articulo y un acta por fecha, y pedir «referencia» a secas deja
 * que cada quien escriba una cosa distinta — que es lo que hace que despues nadie
 * pueda comprobar nada.
 */
export const ORIGENES_RESPALDO: ReadonlyArray<{
  id: OrigenRespaldo
  texto: string
  /** Que se escribe en `referencia`. */
  etiqueta: string
  ejemplo: string
}> = [
  {
    id: 'reglamento',
    texto: 'Reglamento de propiedad horizontal',
    etiqueta: 'Artículo del reglamento',
    ejemplo: 'Artículo 42',
  },
  {
    id: 'manual',
    texto: 'Manual de convivencia',
    etiqueta: 'Artículo del manual',
    ejemplo: 'Artículo 14, numeral 3',
  },
  {
    id: 'asamblea',
    texto: 'Acta de asamblea',
    etiqueta: 'Fecha del acta',
    ejemplo: 'Asamblea ordinaria del 15 de marzo de 2026',
  },
  {
    id: 'otro',
    texto: 'Otro documento',
    etiqueta: 'Dónde lo dice',
    ejemplo: 'Artículo 4',
  },
]

/**
 * RN-38 — El respaldo de un concepto de multa esta completo.
 *
 * Se exige **siempre** la referencia, y **ademas el nombre del documento cuando
 * el origen es `otro`**. Sin ese campo, «otro» seria la puerta por donde se
 * escapa el principio entero: bastaria marcarlo para no justificar nada, y el
 * respaldo dejaria de ser comprobable (Mary, 2026-09-08).
 *
 * «Resolucion del consejo N.º 12 del 3 de marzo, articulo 4» se puede ir a
 * buscar; «otro» a secas, no.
 */
export function respaldoCompleto(concepto: {
  origen: OrigenRespaldo
  referencia: string
  documento?: string
}): boolean {
  if (!concepto.referencia.trim()) return false
  if (concepto.origen === 'otro') return !!concepto.documento?.trim()
  return true
}

/** Como se lee el respaldo de un concepto, en una linea. */
export function textoRespaldo(concepto: {
  origen: OrigenRespaldo
  referencia: string
  documento?: string
}): string {
  const nombre =
    concepto.origen === 'otro'
      ? (concepto.documento ?? 'Otro documento')
      : (ORIGENES_RESPALDO.find((o) => o.id === concepto.origen)?.texto ?? concepto.origen)
  return `${nombre} · ${concepto.referencia}`
}

/**
 * RN-72 — Cuantas veces se sanciono **en firme y dentro de la ventana** a esta
 * unidad por esta conducta.
 *
 * Solo cuentan las firmes, y es deliberado: un proceso archivado termino en que
 * **no hubo infraccion**, y uno todavia abierto no ha establecido nada. Contar
 * cualquiera de los dos seria agravar una multa con hechos que nadie probo — que
 * es justo lo que el debido proceso existe para impedir (RN-69, RN-70).
 *
 * **Y la reincidencia caduca** (Mary, 2026-09-09): un antecedente deja de
 * agravar cuando pasa la ventana que fija el reglamento —`mesesReincidencia`,
 * doce meses en esta copropiedad—. Una multa de hace cuatro anos no dice nada
 * sobre quien vive alli hoy.
 */
export function vecesSancionada(
  sanciones: Sancion[],
  unidadId: string,
  conceptoId: string,
  mesesVigencia: number,
  hoy: FechaISO = hoyISO(),
): number {
  const desde = restarMeses(hoy, mesesVigencia)
  return sanciones.filter(
    (sancion) =>
      sancion.unidadId === unidadId &&
      sancion.conceptoId === conceptoId &&
      sancion.estado === 'firme' &&
      // La ventana se cuenta desde la **imposicion**, no desde la firmeza
      // (Mary, 2026-09-09: «la reincidencia caduca al ano»). Es la fecha con la
      // que la sancion esta fechada, y sobre todo **no se estira**: si contara
      // desde la firmeza, un proceso largo —con descargos e impugnacion—
      // alargaria la ventana, y quien se defendio quedaria expuesto mas tiempo
      // que quien no dijo nada. Defenderse no puede costar caro.
      sancion.fechaImposicion.slice(0, 10) >= desde,
  ).length
}

/**
 * RN-72 — El valor y la norma que aplican, segun sea la primera vez o no.
 *
 * **La mitad importante de esta funcion es la que no hace nada.** Si el concepto
 * no tiene reincidencia parametrizada, devuelve el valor base por muchas veces
 * que la unidad haya reincidido: agravar una multa sin un documento que lo diga
 * es inventarse una sancion, y eso no lo puede hacer ni el administrador ni la
 * app (RN-38, RN-49).
 */
export function multaAplicable(
  concepto: ConceptoSancion,
  vecesPrevias: number,
): { valor: number; respaldo: string; reincidencia: boolean } {
  if (vecesPrevias > 0 && concepto.reincidencia) {
    return {
      valor: concepto.reincidencia.valor,
      respaldo: textoRespaldo(concepto.reincidencia),
      reincidencia: true,
    }
  }
  return { valor: concepto.valor, respaldo: textoRespaldo(concepto), reincidencia: false }
}

/** RN-40 — Los que se pueden imponer hoy. Los inactivos siguen existiendo. */
export function conceptosActivos(conceptos: ConceptoSancion[]): ConceptoSancion[] {
  return conceptos.filter((concepto) => concepto.activo)
}

/**
 * RN-67 — Quien puede mirar los soportes, y que queda cuando los mira.
 *
 * Dos accesos distintos, y conviene no confundirlos:
 *
 *  - **Mientras se decide**, quien tiene que autorizar ve las dos fotos a la
 *    vista. Es el acto: comparar la cara con el documento *es* autorizar. Pedirle
 *    un clic extra ahi seria estorbo, no cuidado.
 *  - **Despues de autorizado**, las fotos quedan guardadas y **abrirlas es un
 *    acto deliberado que deja constancia** (Mary, 2026-09-07: la administracion
 *    puede verlas, «con registro»). Una foto de cedula archivada que cualquiera
 *    abre sin dejar rastro es una foto de cedula sin dueno.
 *
 * No se trata de desconfiar de la administracion: se trata de que el dia que un
 * titular pregunte «¿quien vio mi documento?», la respuesta exista.
 *
 * Quien puede: **la administracion siempre** —responde legalmente por el
 * tratamiento— y **quien registro a la persona**.
 *
 * ## La porteria es un caso aparte, y va al reves de lo que parecia
 *
 * «La porteria debe poder ver la foto porque, ¿como reconoce al que ingresa?»
 * (Mary, 2026-09-07). Es cierto y es su trabajo: un portero que nunca vio la cara
 * de quien vive ahi no puede distinguirlo de un desconocido, y menos de noche o
 * en un turno nuevo.
 *
 * Pero ve **solo el rostro, nunca el documento**. Es la diferencia entre
 * *reconocerte* y *tener tu identidad*: para lo primero basta una cara; lo
 * segundo es un dato que la porteria no necesita para nada, y que ademas suele
 * quedar en manos de personal de una empresa externa que rota.
 *
 * Su consulta **no deja constancia individual**, y es deliberado: mirar caras es
 * su tarea de todo el dia, y un registro de cada mirada seria ruido que esconde
 * los accesos que si importan. Lo que se registra es quien abre **el documento**,
 * que es el dato sensible.
 */
export function puedeVerSoportes(parametros: {
  creadoPor: string
  personaId: string
  rol: RolUsuario
}): boolean {
  if (parametros.rol === 'admin') return true
  return parametros.creadoPor === parametros.personaId
}

/** La porteria ve el rostro de quien vive ahi; el documento, nunca. */
export function puedeVerRostros(rol: RolUsuario | undefined): boolean {
  return rol === 'porteria' || rol === 'admin'
}

/** Si mirarlos deja constancia. Solo despues de decidir; durante, es el acto. */
export function verSoportesDejaConstancia(registro: RegistroPersona): boolean {
  return registro.estado === 'autorizado'
}

/**
 * RN-65 — Quien inhabilita depende de quien creo.
 *
 * «Lo que crea el propietario lo puede inhabilitar el propietario o el
 * administrador de la propiedad, y lo que crea el administrador de la propiedad
 * lo puede inhabilitar el administrador de la propiedad o quien este designe con
 * el perfil» (Mary, 2026-09-07).
 *
 * Es **la cadena de RN-63 leida al reves**: se crea hacia abajo y se inhabilita
 * hacia arriba. Puede inhabilitar quien creo, y cualquiera que este por encima
 * suyo en la cadena — nunca por debajo.
 *
 * Lo que esto impide, y es el punto: **un propietario no puede sacar de la unidad
 * a un copropietario que registro la administracion**. Si pudiera, dos duenos de
 * un mismo apartamento tendrian cada uno el boton para borrar al otro, y ganaria
 * el que llegara primero.
 *
 * Los vinculos que **no salieron de un registro** —los de la semilla, y en el
 * producto real los que existian antes de Idiky— se tratan como creados por la
 * administracion: es lo conservador, porque deja la decision en el eslabon de
 * arriba en vez de repartirla.
 *
 * **Pendiente:** «o quien este designe con el perfil». Delegar la facultad exige
 * un modelo de perfiles que todavia no existe (T-08); hoy la administracion la
 * ejerce directamente.
 */
export function puedeInhabilitar(parametros: {
  /** Quien creo el vinculo. `undefined` = lo creo la administracion. */
  creadoPor?: string
  /** Quien quiere inhabilitarlo. */
  personaId: string
  /** Su rol de sesion: el administrador esta por encima de cualquier propietario. */
  rol: RolUsuario
}): boolean {
  if (parametros.rol === 'admin') return true
  return !!parametros.creadoPor && parametros.creadoPor === parametros.personaId
}

/**
 * RN-63 — La cadena de registro: cada eslabon crea el siguiente, y solo ese.
 *
 * «El administrador de Idiky crea al administrador del edificio, y el
 * administrador del edificio crea a un propietario, y el propietario a otros
 * propietarios de su propiedad» (Mary, 2026-09-07).
 *
 *   Idiky (operador)  ->  administrador de la copropiedad
 *   administrador     ->  propietario de una unidad
 *   propietario       ->  otros propietarios, arrendatarios y temporales de SU unidad
 *   propietario o arrendatario -> visitantes de su unidad
 *
 * Esto **no reemplaza** a RN-53, la corrige: la cuenta sigue naciendo vinculada,
 * lo que cambia es quien la vincula segun el eslabon. Y explica por que nadie se
 * registra solo: en una copropiedad no existe el «crea tu cuenta», porque el
 * derecho a estar aqui se lo da a uno alguien que ya esta.
 *
 * Nadie puede saltarse un eslabon. Que el administrador pudiera crear
 * arrendatarios directamente parece un atajo comodo y es justamente lo que
 * rompe la trazabilidad: el propietario dejaria de saber quien vive en su
 * unidad.
 *
 * **El operador de Idiky todavia no existe en el demo**: es un actor por encima
 * de la copropiedad y su consola es trabajo de otra fase. Aqui esta el eslabon
 * escrito para que el modelo no lo olvide.
 */
export const CADENA_DE_REGISTRO: ReadonlyArray<{
  quien: string
  registra: string
  donde: string
}> = [
  { quien: 'Operador de Idiky', registra: 'Administrador de la copropiedad', donde: 'La plataforma' },
  { quien: 'Administrador', registra: 'Propietario de una unidad', donde: 'La copropiedad' },
  { quien: 'Propietario', registra: 'Propietarios, arrendatarios y temporales', donde: 'Su unidad' },
  { quien: 'Propietario o arrendatario', registra: 'Visitantes', donde: 'Su unidad' },
]

/**
 * RN-60 — Quien puede registrar a quien.
 *
 * El **propietario** registra a quien va a vivir en su unidad —otros
 * propietarios y arrendatarios— porque es el titular del derecho de dominio y
 * quien responde por la unidad ante la copropiedad. El **arrendatario** vive
 * ahi, pero no dispone de quien mas vive ahi: puede registrar **visitantes** y
 * nada mas.
 *
 * El `autorizado` no registra a nadie. Es alguien a quien un residente le dio
 * acceso; darle la facultad de traer mas gente convierte una autorizacion en una
 * cadena sin dueno.
 */
const CATEGORIAS_POR_ROL: Record<RolResidencia, readonly CategoriaRegistro[]> = {
  propietario: ['residente', 'residente_temporal', 'visitante'],
  arrendatario: ['visitante'],
  autorizado: [],
}

export function categoriasQuePuedeRegistrar(
  rol: RolResidencia | undefined,
): readonly CategoriaRegistro[] {
  return rol ? CATEGORIAS_POR_ROL[rol] : []
}

export function puedeRegistrar(
  rol: RolResidencia | undefined,
  categoria: CategoriaRegistro,
): boolean {
  return categoriasQuePuedeRegistrar(rol).includes(categoria)
}

/**
 * RN-59 — Quien autoriza es quien responde por la unidad.
 *
 * «El propietario o arrendatario segun sea el caso» (Mary, 2026-09-07): quien
 * creo el registro es quien lo autoriza. No es un tramite doble por gusto —
 * entre crear y autorizar pasa algo, que es que la persona adjunta sus soportes,
 * y autorizar es decir «los vi y son quien dice ser».
 */
export function puedeAutorizar(registro: RegistroPersona, personaId: string): boolean {
  return registro.creadoPor === personaId && registro.estado === 'esperando_autorizacion'
}

/**
 * RN-57 — Los soportes se le exigen **a quien se queda a dormir**.
 *
 * «El tramite le corresponde a quien se queda a dormir» (Mary, 2026-09-07). El
 * residente y el residente temporal —el huesped de Airbnb, el familiar unos
 * meses— usan las zonas comunes y la porteria los ve a diario: ahi las dos fotos
 * y la autorizacion valen lo que cuestan. El visitante de una tarde, no.
 *
 * No es una comodidad, es seguridad: **pedirle cedula fotografiada a quien viene
 * a almorzar es el requisito que hace que la gente deje de registrar visitas y
 * las meta sin avisar**. Un tramite que se evade protege menos que uno liviano
 * que se cumple.
 */
export function exigeSoportes(categoria: CategoriaRegistro): boolean {
  return categoria !== 'visitante'
}

// ---------------------------------------------------------------------------
// RN-97 — La marca «No obligatorio»: el administrador exime de los soportes.
//
// «Una opcion para el administrador que le permita colocarle una marca para que
// un propietario, arrendatario o visitante que no quiera adjuntar la foto y/o
// el documento no lo haga» (equipo, 2026-09-17). Es una excepcion a RN-57, y
// por eso tiene tres limites: la pone **el administrador**, se pone **sobre un
// registro concreto** —no sobre la copropiedad, que dejaria RN-57 sin efecto— y
// **queda escrito quien la puso**. Al visitante no le hace falta: ya no lleva
// fotos (RN-57).
//
// Con la marca, el registro no tiene nada que esperar de la persona: pasa a la
// autorizacion de quien lo creo, y la persona entra a Idiky como todos, con un
// codigo a su celular o correo (CU-R-01, desde el 2026-10-01).
// ---------------------------------------------------------------------------

/** Si a este registro se le pueden eximir los soportes: solo a quien los debe. */
export function admiteMarcaNoObligatorio(registro: RegistroPersona): boolean {
  return exigeSoportes(registro.categoria) && registroEnCurso(registro)
}

/** Este registro lleva la marca y por eso no trae fotos. */
export function sinSoportesPorMarca(registro: RegistroPersona): boolean {
  return exigeSoportes(registro.categoria) && !!registro.soportesNoObligatorios
}

/**
 * Un registro no pasa de la espera de soportes sin las dos fotos (RN-57) —
 * salvo que el administrador lo haya marcado como no obligatorio (RN-97).
 */
export function soportesCompletos(registro: RegistroPersona): boolean {
  if (!exigeSoportes(registro.categoria)) return true
  if (registro.soportesNoObligatorios) return true
  return !!registro.fotoDocumento && !!registro.fotoPersona
}


/**
 * RN-62 — La vigencia depende de la categoria, no del capricho de quien registra.
 *
 * El residente se queda hasta que lo desvinculen: ponerle fecha de fin a quien
 * compro un apartamento no tiene sentido. Las otras dos **exigen** fecha de fin,
 * y esa es justamente la diferencia entre un residente temporal y un residente.
 */
export function exigeVigencia(categoria: CategoriaRegistro): boolean {
  return categoria !== 'residente'
}

/**
 * RN-62 — **El visitante es de un solo dia** (Mary, 2026-09-07).
 *
 * No se registra un rango: se registra el dia en que viene, y ese dia entra y
 * sale. Es lo que mantiene separadas las dos categorias de estadia — una
 * autorizacion de visitante «del 5 al 20» es un residente temporal sin sus
 * soportes, y por ahi se cuela justo lo que RN-57 pide para quien se queda a
 * dormir.
 *
 * Tambien es lo que hace barato no pedirle fotos: una autorizacion que caduca
 * esta misma noche no es una llave.
 */
export function soloUnDia(categoria: CategoriaRegistro): boolean {
  return categoria === 'visitante'
}

/** El rol con el que queda vinculada la persona; el visitante no se vincula. */
export function rolDeCategoria(
  categoria: CategoriaRegistro,
  rolPedido?: RolResidencia,
): RolResidencia | undefined {
  if (categoria === 'visitante') return undefined
  if (categoria === 'residente_temporal') return 'autorizado'
  return rolPedido ?? 'arrendatario'
}

/** Un registro sigue vivo mientras espera algo de alguien. */
export function registroEnCurso(registro: RegistroPersona): boolean {
  return registro.estado === 'esperando_soportes' || registro.estado === 'esperando_autorizacion'
}

/** Lo que le toca a **esta** persona, que es lo unico que hay que mostrarle. */
export function registrosPorAutorizar(
  registros: RegistroPersona[],
  personaId: string,
): RegistroPersona[] {
  return registros.filter((registro) => puedeAutorizar(registro, personaId))
}

/**
 * Los residentes vigentes de una unidad (RN-61).
 *
 * Vigente = sin fecha de fin, o con una fecha de fin que todavia no llega.
 * **Desvincular no borra**: cierra el vinculo con fecha, y el historico queda
 * para poder responder despues quien vivia aqui en tal fecha.
 */
export function residenciaVigente(
  residencia: { desde: FechaISO; hasta?: FechaISO },
  hoy: FechaISO = hoyISO(),
): boolean {
  if (residencia.desde > hoy) return false
  return !residencia.hasta || residencia.hasta >= hoy
}

/**
 * RN-52 — La porteria hace lo de la entrada, y nada mas.
 *
 * Registra y entrega correspondencia, y valida visitantes. **No ve la cartera**
 * ni las PQRS: quien debe cuanto no es asunto de la porteria, y el portero suele
 * ser empleado de una empresa de vigilancia externa, no de la copropiedad.
 *
 * La lista vive aqui, en el dominio, y no en el menu: un permiso que solo existe
 * como pestana escondida no es un permiso (T-16).
 */
const PERMISOS: Record<RolUsuario, readonly string[]> = {
  residente: ['cartera:propia', 'reservas:propias', 'pqrs:propias', 'visitantes:propios'],
  admin: ['cartera', 'unidades', 'reservas', 'pqrs', 'comunicados', 'correspondencia'],
  porteria: ['correspondencia', 'visitantes:validar', 'residentes:reconocer'],
}

export function puede(rol: RolUsuario | undefined, permiso: string): boolean {
  return !!rol && PERMISOS[rol].includes(permiso)
}

/** A donde entra cada rol al iniciar sesion. */
export function rutaInicial(rol: RolUsuario): string {
  return { residente: '/app', admin: '/admin', porteria: '/porteria' }[rol]
}

// ---------------------------------------------------------------------------
// Proyectos — RN-100, RN-101 · CU-A-28, CU-R-32
// ---------------------------------------------------------------------------

export type EstadoProyecto = 'planeado' | 'en_curso' | 'terminado'

/** Los avances del mas viejo al mas nuevo. */
export function avancesDelProyecto(proyecto: Proyecto): AvanceProyecto[] {
  return [...proyecto.avances].sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function ultimoAvance(proyecto: Proyecto): AvanceProyecto | undefined {
  const avances = avancesDelProyecto(proyecto)
  return avances[avances.length - 1]
}

/**
 * RN-100 — **El avance del proyecto es el ultimo avance registrado.**
 *
 * No un promedio, no el mayor: el ultimo. Si la obra retrocedio —se
 * desmonto lo hecho, se cambio el contratista— el tablero tiene que decirlo,
 * no esconderlo detras del maximo alcanzado.
 */
export function porcentajeProyecto(proyecto: Proyecto): number {
  return ultimoAvance(proyecto)?.porcentaje ?? 0
}

/**
 * En que va el proyecto. **Se deriva, no se guarda** (mismo criterio que el
 * estado del acta): sin avances esta planeado; con avances, en curso; al
 * 100 %, terminado.
 */
export function estadoProyecto(proyecto: Proyecto): EstadoProyecto {
  if (proyecto.avances.length === 0) return 'planeado'
  return porcentajeProyecto(proyecto) >= 100 ? 'terminado' : 'en_curso'
}

/**
 * RN-100 — Por que no se puede registrar este avance, o `null` si se puede.
 *
 * El porcentaje es un entero entre 0 y 100. **Puede ser menor que el
 * anterior** —las obras retroceden— pero entonces el detalle es obligatorio:
 * un tablero que baja del 60 al 40 sin decir por que es peor que uno que no
 * se actualiza. Se devuelve el motivo, no un booleano, para que el
 * formulario lo muestre tal cual y el repositorio lo lance tal cual.
 */
export function motivoAvanceInvalido(
  proyecto: Proyecto,
  avance: { porcentaje: number; titulo: string; detalle: string },
): string | null {
  if (!Number.isInteger(avance.porcentaje) || avance.porcentaje < 0 || avance.porcentaje > 100) {
    return 'El avance es un número entero entre 0 y 100.'
  }
  if (avance.titulo.trim().length < 3) return 'Escribe qué se hizo: es lo que le llega al propietario.'
  const anterior = porcentajeProyecto(proyecto)
  if (avance.porcentaje < anterior && avance.detalle.trim().length < 10) {
    return `El proyecto iba en ${anterior} %. Si retrocede, explica por qué en el detalle.`
  }
  if (estadoProyecto(proyecto) === 'terminado') {
    return 'El proyecto ya está terminado. Si hay algo más que hacer, es otro proyecto.'
  }
  return null
}

/** Los proyectos de una copropiedad, primero los que estan en marcha. */
export function proyectosOrdenados(proyectos: Proyecto[], copropiedadId: string): Proyecto[] {
  const orden: Record<EstadoProyecto, number> = { en_curso: 0, planeado: 1, terminado: 2 }
  return proyectos
    .filter((p) => p.copropiedadId === copropiedadId)
    .sort((a, b) => {
      const porEstado = orden[estadoProyecto(a)] - orden[estadoProyecto(b)]
      if (porEstado !== 0) return porEstado
      const ua = ultimoAvance(a)?.fecha ?? a.creadoEn
      const ub = ultimoAvance(b)?.fecha ?? b.creadoEn
      return ub.localeCompare(ua)
    })
}

/**
 * RN-101 — **Cada avance se les cuenta a los propietarios**, por dos vias:
 * un comunicado en la cartelera y un mensaje al celular de cada propietario.
 * Este es el texto del mensaje. Corto, con el nombre del proyecto, el
 * porcentaje y a donde entrar: es lo que cabe en un SMS.
 */
export function textoAvanceProyecto(
  proyecto: Proyecto,
  avance: { porcentaje: number; titulo: string },
  copropiedad: string,
): string {
  return (
    `${copropiedad}: ${proyecto.nombre} va en ${avance.porcentaje} %. ${avance.titulo.trim()}. ` +
    'Mira el tablero del proyecto en Idiky.'
  )
}

/**
 * RN-102 — **El silencio de una obra también se reporta.**
 *
 * «Una alerta de reportar avance si han pasado dos semanas sin actualización»
 * (Mary, 2026-10-01). Un tablero que dice «40 %» desde hace un mes no informa:
 * el propietario no sabe si la obra sigue, se paró o se olvidó actualizarla.
 * Por eso la alerta es para el administrador, que es quien puede resolverla
 * con un avance —aunque sea «sigue igual, esperando el material».
 *
 * Desde cuándo se cuenta: en una obra **en marcha**, desde el último avance;
 * en una **planeada** cuya fecha de inicio ya pasó, desde esa fecha (debió
 * empezar y no ha dicho nada); una planeada sin fecha, o con fecha futura, no
 * debe nada todavía; una **terminada**, nunca.
 */
export const DIAS_SIN_AVANCE_ALERTA = 14

export function diasSinAvance(proyecto: Proyecto, hoy: FechaISO = hoyISO()): number | null {
  const estado = estadoProyecto(proyecto)
  if (estado === 'terminado') return null
  if (estado === 'en_curso') return diasEntre(ultimoAvance(proyecto)!.fecha, hoy)
  if (proyecto.fechaInicio && proyecto.fechaInicio <= hoy) return diasEntre(proyecto.fechaInicio, hoy)
  return null
}

/** Los proyectos que deben un avance, del más callado al menos. */
export function proyectosSinAvanceReciente(
  proyectos: Proyecto[],
  copropiedadId: string,
  hoy: FechaISO = hoyISO(),
): Array<{ proyecto: Proyecto; dias: number }> {
  return proyectos
    .filter((p) => p.copropiedadId === copropiedadId)
    .map((proyecto) => ({ proyecto, dias: diasSinAvance(proyecto, hoy) }))
    .filter((x): x is { proyecto: Proyecto; dias: number } => x.dias !== null && x.dias >= DIAS_SIN_AVANCE_ALERTA)
    .sort((a, b) => b.dias - a.dias)
}

/**
 * RN-103 — **La entrega la cierra quien recibe.**
 *
 * «En la vista del propietario o arrendatario, en paquetes, incluir el boton
 * Recibido» (Mary, 2026-10-01). Porteria registra a quien se lo entrego; eso
 * es la palabra de porteria. La confirmacion del residente desde su app es la
 * otra mitad: con las dos, la cadena de custodia (RN-52) cierra de punta a
 * punta, y «a mi nunca me llego» deja de ser una discusion.
 *
 * Puede confirmar **cualquier residente vigente de la unidad**, no solo a
 * quien porteria anoto: el paquete es de la unidad, y quien lo recogio puede
 * no ser quien tiene la app en la mano. Si porteria todavia no lo marco como
 * entregado, la confirmacion vale como entrega: el residente lo tiene.
 * Se confirma una sola vez.
 */
export function puedeConfirmarRecepcion(
  registro: Correspondencia,
  residencias: Residencia[],
  personaId: string,
): boolean {
  if (registro.confirmadoEn) return false
  return residencias.some(
    (r) => r.unidadId === registro.unidadId && r.personaId === personaId && residenciaVigente(r),
  )
}

/**
 * RN-104 — **La zona se reserva viendo como es.**
 *
 * «En reservas debe ser posible ver la foto o fotos de la zona que el
 * residente quiere reservar» (Mary, 2026-10-01). Hasta cinco fotos por zona:
 * bastan para un salon, una terraza o un gimnasio, y en el demo, que vive en
 * el navegador, cinco por zona no lo llenan (ADR-0009). Son configuracion, no
 * registro: el administrador las agrega y las quita desde la consola, y
 * quitar una no borra ninguna historia.
 */
export const MAXIMO_FOTOS_ZONA = 5

export function puedeAgregarFotoZona(zona: { fotos?: unknown[] }): boolean {
  return (zona.fotos?.length ?? 0) < MAXIMO_FOTOS_ZONA
}

/** Tope de las especificaciones: cabe una hoja, no un reglamento entero. */
export const MAXIMO_ESPECIFICACIONES = 1200

/**
 * RN-104 — Las especificaciones, como lista: un renglon por punto. Se escriben
 * en texto libre porque cada zona es distinta —el salon tiene cocineta, el
 * gimnasio tiene horario de aseo— y un formulario con campos fijos dejaria
 * fuera justo lo que importa.
 */
export function puntosDeEspecificaciones(zona: { especificaciones?: string }): string[] {
  return (zona.especificaciones ?? '')
    .split('\n')
    .map((linea) => linea.replace(/^[-•*]\s*/, '').trim())
    .filter((linea) => linea.length > 0)
}

// ---------------------------------------------------------------------------
// Zonas comunes: crearlas, cambiarlas y desactivarlas — CU-A-10 · RN-105 a RN-107
// ---------------------------------------------------------------------------

/** Lo que el administrador define de una zona: sus reglas de reserva. */
export interface DatosZona {
  nombre: string
  descripcion: string
  aforo: number
  requiereAprobacion: boolean
  horaInicio: Hora
  horaFin: Hora
  duracionBloqueHoras: number
  anticipacionMinimaHoras: number
  cupoMensualPorUnidad: number
  /** RN-109 — Cobro por uso y deposito, con su respaldo. */
  valorUso?: number
  deposito?: number
  respaldoCobro?: RespaldoCobroZona
  /** RN-110 — La multa del catalogo si no se cancela a tiempo. */
  multaNoCancelar?: MultaNoCancelar
  /** RN-111 — Exclusiva o compartida hasta el aforo. */
  modoUso?: ModoUsoZona
  /** RN-114 — Horario por dia de la semana. */
  horarioSemanal?: HorarioDia[]
}

/** Los turnos que se ofrecen: de una a doce horas. */
export const DURACIONES_TURNO = [1, 2, 3, 4, 6, 12]

/** Una descripcion es la linea bajo el nombre, no las especificaciones (RN-104). */
export const MAXIMO_DESCRIPCION_ZONA = 140

/** Una zona que no dice lo contrario esta activa (las que ya existian no se migran). */
export function zonaActiva(zona: ZonaComun): boolean {
  return zona.activa !== false
}

function horaEntera(hora: string): number | null {
  const coincide = /^(\d{2}):00$/.exec(hora)
  if (!coincide) return null
  const valor = Number(coincide[1])
  return valor >= 0 && valor <= 24 ? valor : null
}

/**
 * RN-105 — **Una zona se reserva por turnos que caben exactos en su horario.**
 *
 * «Terminemos de configurar zonas comunes» (Mary, 2026-10-01). Hasta hoy las
 * reglas de cada zona venian de los datos de ejemplo; desde CU-A-10 las
 * escribe el administrador, y por eso se validan: el nombre no se repite en la
 * copropiedad (dos «Salón social» confunden al que reserva), el horario va en
 * horas en punto y termina despues de empezar, el turno divide el horario sin
 * sobrar (un horario de 9 a 21 con turnos de 5 horas deja dos horas que nadie
 * puede reservar), y aforo y cupo son de al menos 1.
 *
 * Devuelve el motivo por el que no se puede guardar, o `null` si se puede.
 */
export function motivoZonaInvalida(
  datos: DatosZona,
  zonasDeLaCopropiedad: ZonaComun[],
  zonaId?: string,
  conceptosSancion: ConceptoSancion[] = [],
): string | null {
  const nombre = datos.nombre.trim()
  if (!nombre) return 'La zona necesita un nombre.'
  const repetida = zonasDeLaCopropiedad.some(
    (z) => z.id !== zonaId && z.nombre.trim().toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'),
  )
  if (repetida) return `Ya hay una zona que se llama «${nombre}».`
  if (datos.descripcion.trim().length > MAXIMO_DESCRIPCION_ZONA) {
    return `La descripción cabe en ${MAXIMO_DESCRIPCION_ZONA} caracteres; el detalle va en las especificaciones.`
  }
  const inicio = horaEntera(datos.horaInicio)
  const fin = horaEntera(datos.horaFin)
  if (inicio === null || fin === null) return 'El horario va en horas en punto.'
  if (fin <= inicio) return 'El horario tiene que terminar después de empezar.'
  if (!DURACIONES_TURNO.includes(datos.duracionBloqueHoras)) return 'Escoge la duración del turno.'
  if ((fin - inicio) % datos.duracionBloqueHoras !== 0) {
    return `Con turnos de ${datos.duracionBloqueHoras} horas, el horario de ${fin - inicio} horas deja un pedazo que nadie puede reservar.`
  }
  const motivoSemana = motivoHorarioSemanalInvalido(datos.horarioSemanal, datos.duracionBloqueHoras)
  if (motivoSemana) return motivoSemana
  if (!Number.isInteger(datos.aforo) || datos.aforo < 1) return 'El aforo es de al menos una persona.'
  if (!Number.isInteger(datos.cupoMensualPorUnidad) || datos.cupoMensualPorUnidad < 1) {
    return 'Cada unidad debe poder reservar al menos una vez al mes.'
  }
  if (!Number.isInteger(datos.anticipacionMinimaHoras) || datos.anticipacionMinimaHoras < 0) {
    return 'La anticipación va en horas, desde 0.'
  }
  return motivoCobroZonaInvalido(datos, conceptosSancion)
}

/**
 * RN-106 — **Cambiar las reglas de una zona no toca las reservas ya hechas.**
 *
 * El nuevo horario, turno, aforo o cupo vale para las reservas que se hagan
 * desde ese momento. La que ya estaba se respeta tal como se pidio: el
 * residente reservo con las reglas que habia, y cambiarselas despues es
 * quitarle algo sin decirle. Si la administracion necesita la zona, la
 * desactiva, y eso si cancela con aviso (RN-107).
 *
 * No necesita funcion propia: la garantiza que editar una zona no recorra
 * `bd.reservas`. Queda escrita aqui para que nadie lo «arregle».
 */

/**
 * RN-107 — **Desactivar una zona cancela sus reservas futuras, y a cada quien
 * que reservo le llega un mensaje con la justificacion.**
 *
 * Decision de Mary (2026-10-01): «le debe llegar un mensaje al que reservó con
 * la justificación de la cancelación». Se cancelan las reservas activas
 * (solicitadas o confirmadas) de hoy en adelante; las pasadas quedan como
 * fueron. El motivo es obligatorio porque es lo que se le manda: «cancelada»
 * sin porque es la queja que sigue. El mensaje va a la persona que hizo la
 * reserva, no a toda la unidad, y el residente ademas lo ve en su app, junto a
 * la reserva. La zona no se borra: se reactiva cuando vuelva a estar lista, y
 * las reservas canceladas no reviven.
 */
export const MINIMO_MOTIVO_DESACTIVACION = 10

export function reservasQueCancelaDesactivar(
  zonaId: string,
  reservas: Reserva[],
  hoy: FechaISO = hoyISO(),
): Reserva[] {
  return reservas
    .filter((r) => r.zonaId === zonaId && reservaOcupaFranja(r) && r.fecha >= hoy)
    .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))
}

/** RN-107 — El texto del mensaje: que se cancelo, cuando era, por que, y que hacer. */
export function textoReservaCancelada(
  reserva: Reserva,
  zona: ZonaComun,
  motivo: string,
  copropiedad: string,
): string {
  const porque = motivo.trim().replace(/[.\s]+$/, '')
  return (
    `${copropiedad}: la administración canceló tu reserva de ${zona.nombre} del ` +
    `${fechaCorta(reserva.fecha)} de ${reserva.horaInicio} a ${reserva.horaFin}. ` +
    `Motivo: ${porque}. Puedes reservar otra zona en Idiky.`
  )
}

/**
 * RN-108 — **Una zona se puede cerrar por mantenimiento entre dos fechas.**
 *
 * «Me gusta lo de mantenimiento, es una opción para el administrador» (Mary,
 * 2026-10-01). La piscina en reparación o el salón en pintura no dejan de
 * existir: se cierran unos días. El cierre lleva fechas y motivo; mientras
 * dura, nadie reserva en esas fechas y la zona se sigue viendo, con el aviso
 * del cierre, para que el residente sepa cuándo vuelve. Al pasar la fecha
 * final vuelve sola, sin que nadie tenga que acordarse de reabrirla.
 *
 * Como en RN-107, las reservas activas que caen dentro del cierre se cancelan
 * y a quien reservó le llega el mensaje con la justificación. Dos cierres de
 * la misma zona no se cruzan; el cierre empieza hoy o después. La
 * administración lo puede levantar antes: desde ese día se reserva otra vez.
 * Nada se borra: el cierre levantado queda en la historia de la zona.
 */
export function cierreVigente(cierre: CierreZona, hoy: FechaISO = hoyISO()): boolean {
  if (cierre.levantadoEn) return false
  return cierre.hasta >= hoy
}

/** El cierre que cubre esa fecha, si hay uno. */
export function cierreEnFecha(zona: ZonaComun, fecha: FechaISO): CierreZona | undefined {
  return (zona.cierres ?? []).find(
    (c) => !c.levantadoEn && c.desde <= fecha && fecha <= c.hasta,
  )
}

/** Los cierres que todavía no terminan, del más próximo al más lejano. */
export function cierresPendientes(zona: ZonaComun, hoy: FechaISO = hoyISO()): CierreZona[] {
  return (zona.cierres ?? [])
    .filter((c) => cierreVigente(c, hoy))
    .sort((a, b) => a.desde.localeCompare(b.desde))
}

export const MINIMO_MOTIVO_CIERRE = MINIMO_MOTIVO_DESACTIVACION

/** RN-108 — Por qué no se puede registrar ese cierre, o `null` si se puede. */
export function motivoCierreInvalido(
  zona: ZonaComun,
  cierre: { desde: FechaISO; hasta: FechaISO; motivo: string },
  hoy: FechaISO = hoyISO(),
): string | null {
  if (!zonaActiva(zona)) return 'La zona está desactivada: no hay nada que cerrar.'
  if (!cierre.desde || !cierre.hasta) return 'Escoge desde y hasta cuándo se cierra.'
  if (cierre.desde < hoy) return 'El cierre empieza hoy o después.'
  if (cierre.hasta < cierre.desde) return 'La fecha final va después de la inicial.'
  if (cierre.motivo.trim().length < MINIMO_MOTIVO_CIERRE) {
    return 'Escribe el motivo: es lo que le llega a quien tenía reserva.'
  }
  const cruzado = cierresPendientes(zona, hoy).find(
    (c) => c.desde <= cierre.hasta && cierre.desde <= c.hasta,
  )
  if (cruzado) return `Ya hay un cierre del ${fechaCorta(cruzado.desde)} al ${fechaCorta(cruzado.hasta)}.`
  return null
}

/** RN-108 — Las reservas activas que caen dentro del cierre. */
export function reservasQueCancelaCierre(
  zonaId: string,
  reservas: Reserva[],
  desde: FechaISO,
  hasta: FechaISO,
): Reserva[] {
  return reservas
    .filter((r) => r.zonaId === zonaId && reservaOcupaFranja(r) && r.fecha >= desde && r.fecha <= hasta)
    .sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`))
}

/** `2026-10-05` → `05/10/2026`: lo que cabe en un SMS y se lee igual en todos lados. */
export function fechaCorta(fecha: FechaISO): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

/** El motivo que viaja en el mensaje de un cierre: las fechas primero, después el porqué. */
export function motivoDeCierre(cierre: { desde: FechaISO; hasta: FechaISO; motivo: string }): string {
  const fechas =
    cierre.desde === cierre.hasta
      ? `el ${fechaCorta(cierre.desde)}`
      : `del ${fechaCorta(cierre.desde)} al ${fechaCorta(cierre.hasta)}`
  return `la zona estará cerrada por mantenimiento ${fechas}: ${cierre.motivo.trim()}`
}

/**
 * RN-109 — **Usar una zona puede costar, y el cobro necesita respaldo.**
 *
 * «Incluir la opción para que cuando el administrador esté parametrizando las
 * zonas comunes incluya el cobro por uso, el depósito si aplica y la multa por
 * no cancelar» (Mary, 2026-10-01). El **cobro por uso** es lo que vale reservar
 * (el salón, $80.000); el **depósito** es una garantía que se devuelve si la
 * zona queda bien. Los dos son opcionales: en 0, la zona es gratis o no pide
 * depósito.
 *
 * Como todo cobro que no es la cuota ordinaria (RN-45), el que tiene valor
 * necesita el documento que lo autoriza: el artículo del reglamento o del
 * manual, o el acta que lo aprobó; «otro» exige además el nombre del
 * documento (RN-38). Un cobro que no se puede explicar termina en una PQRS.
 *
 * **Si aplican o no lo escoge el administrador**, zona por zona: «Se cobra
 * por usarla» y «Pide depósito de garantía» (Mary: «hay copropiedades que
 * cobran el depósito… hay que dejar la opción para que el administrador
 * seleccione si aplica o no»). Marcada, pide el valor.
 *
 * Hoy el cobro y el depósito se **parametrizan y se informan**: el residente
 * los ve antes de reservar. Generar el cobro en el estado de cuenta y registrar
 * la devolución del depósito es lo que sigue.
 */
export function tieneCobroZona(zona: { valorUso?: number; deposito?: number }): boolean {
  return (zona.valorUso ?? 0) > 0 || (zona.deposito ?? 0) > 0
}

/**
 * RN-110 — **La multa por no cancelar sale del catálogo de multas.**
 *
 * La zona no inventa una multa: escoge un concepto **activo** del catálogo
 * (CU-A-22), que ya trae su valor y su respaldo (RN-37, RN-38), y fija hasta
 * cuántas horas antes de la reserva se puede cancelar sin multa. El residente
 * lo ve antes de reservar. La multa **no se cobra sola**: como toda multa, se
 * impone con el proceso sancionatorio, con descargos e impugnación, y la cuota
 * nace solo cuando queda firme (RN-39, RN-69).
 */
export function motivoCobroZonaInvalido(
  datos: Pick<DatosZona, 'valorUso' | 'deposito' | 'respaldoCobro' | 'multaNoCancelar'>,
  conceptosSancion: ConceptoSancion[],
): string | null {
  for (const [valor, nombre] of [
    [datos.valorUso, 'El cobro por uso'],
    [datos.deposito, 'El depósito'],
  ] as const) {
    if (valor !== undefined && (!Number.isInteger(valor) || valor < 0)) {
      return `${nombre} va en pesos, sin decimales, desde 0.`
    }
  }
  if (tieneCobroZona(datos)) {
    if (!datos.respaldoCobro || !respaldoCompleto(datos.respaldoCobro)) {
      return 'Un cobro necesita su respaldo: el artículo del reglamento o el acta que lo autoriza.'
    }
  }
  const multa = datos.multaNoCancelar
  if (multa) {
    const concepto = conceptosSancion.find((c) => c.id === multa.conceptoId)
    if (!concepto) return 'Escoge la multa del catálogo de multas.'
    if (!concepto.activo) return `«${concepto.nombre}» ya no está activa en el catálogo.`
    if (!Number.isInteger(multa.horasParaCancelar) || multa.horasParaCancelar < 1) {
      return 'El plazo para cancelar sin multa va en horas, desde 1.'
    }
  }
  return null
}

/**
 * RN-111 — **Una zona se usa de forma exclusiva o compartida.**
 *
 * «Si una familia reserva el gimnasio de 6 a 8, nadie más puede entrar a esa
 * hora» era el comportamiento de RN-09 para todas las zonas, y está bien para
 * el salón pero no para el gimnasio, que tiene aforo 8. Desde el 2026-10-01
 * (Mary: «arranca con 1 y 2») el administrador escoge en cada zona:
 *
 * - **Exclusiva** (el salón, la terraza): el turno es de una sola unidad. Es
 *   RN-09 tal como estaba, y es lo que vale cuando la zona no dice nada.
 * - **Compartida** (el gimnasio, el coworking): varias unidades reservan el
 *   mismo turno, cada una diciendo cuántas personas van, hasta llenar el aforo.
 *   Una unidad tiene una sola reserva por turno: si van más, se cancela y se
 *   vuelve a pedir con el número nuevo.
 *
 * El cupo mensual por unidad (uso justo) aplica igual en las dos.
 *
 * RN-113 — **Quien reserva dice cuántas personas van**, en las dos clases de
 * zona, contándose a sí mismo. En la compartida es lo que llena el turno; en la
 * exclusiva no puede pasar del aforo, y es el dato con el que portería deja
 * entrar a los invitados («el 402 tiene el salón con 30 personas»).
 */
export function zonaCompartida(zona: ZonaComun): boolean {
  return zona.modoUso === 'compartido'
}

/** Las personas que ya tienen el turno, sumando las reservas activas. */
export function personasEnFranja(
  reservas: Reserva[],
  zonaId: string,
  fecha: FechaISO,
  horaInicio: string,
): number {
  return reservas
    .filter(
      (r) => r.zonaId === zonaId && r.fecha === fecha && r.horaInicio === horaInicio && reservaOcupaFranja(r),
    )
    .reduce((total, r) => total + (r.personas ?? 1), 0)
}

/** RN-111 — Cuántos cupos le quedan al turno de una zona compartida. */
export function cuposLibres(zona: ZonaComun, reservas: Reserva[], fecha: FechaISO, horaInicio: string): number {
  return Math.max(0, zona.aforo - personasEnFranja(reservas, zona.id, fecha, horaInicio))
}

/** RN-09 / RN-111 — Por qué no se puede tomar ese turno, o `null` si se puede. */
export function motivoFranjaNoDisponible(
  zona: ZonaComun,
  reservas: Reserva[],
  fecha: FechaISO,
  horaInicio: string,
  unidadId: string,
  personas = 1,
): string | null {
  if (!Number.isInteger(personas) || personas < 1) return 'Di cuántas personas van, desde una.'
  if (!zonaCompartida(zona)) {
    if (franjaOcupada(reservas, zona.id, fecha, horaInicio)) return 'Esa franja ya esta reservada.'
    // RN-113 — En la exclusiva, lo declarado no pasa del aforo.
    if (personas > zona.aforo) return `El aforo de ${zona.nombre} es de ${zona.aforo} personas.`
    return null
  }
  const yaTiene = reservas.some(
    (r) =>
      r.zonaId === zona.id &&
      r.fecha === fecha &&
      r.horaInicio === horaInicio &&
      r.unidadId === unidadId &&
      reservaOcupaFranja(r),
  )
  if (yaTiene) return 'Tu unidad ya tiene ese turno. Si van más personas, cancela y vuelve a reservar.'
  const libres = cuposLibres(zona, reservas, fecha, horaInicio)
  if (libres === 0) return 'Ese turno ya está lleno.'
  if (personas > libres) return `En ese turno quedan ${libres} ${libres === 1 ? 'cupo' : 'cupos'}.`
  return null
}

/**
 * RN-112 — **Antes de cancelar fuera de plazo, el residente sabe que hay multa.**
 *
 * Si la zona tiene multa por no cancelar (RN-110) y faltan menos horas que el
 * plazo, la app lo advierte antes de confirmar, con el valor, el concepto y
 * su respaldo. Solo cuenta para la reserva **confirmada**: la que la
 * administración todavía no aprobó no le ha quitado el turno a nadie.
 *
 * Avisar no es multar: si cancela de todos modos, la reserva queda marcada
 * «fuera de plazo» y la administración decide si abre el proceso
 * sancionatorio, con descargos e impugnación (RN-39, RN-69).
 *
 * Devuelve las horas que faltan y el concepto, o `null` si cancelar no tiene
 * multa.
 */
export function multaAlCancelar(
  reserva: Reserva,
  zona: ZonaComun | undefined,
  conceptosSancion: ConceptoSancion[],
  ahora: Date = new Date(),
): { horasRestantes: number; concepto: ConceptoSancion; plazo: number } | null {
  if (!zona?.multaNoCancelar || reserva.estado !== 'confirmada') return null
  const concepto = conceptosSancion.find((c) => c.id === zona.multaNoCancelar!.conceptoId)
  if (!concepto) return null
  const inicio = new Date(`${reserva.fecha}T${reserva.horaInicio}:00`).getTime()
  const horasRestantes = (inicio - ahora.getTime()) / 3_600_000
  const plazo = zona.multaNoCancelar.horasParaCancelar
  if (horasRestantes >= plazo) return null
  return { horasRestantes: Math.max(0, Math.floor(horasRestantes)), concepto, plazo }
}

/**
 * RN-114 — **Cada zona puede tener un horario distinto según el día.**
 *
 * El gimnasio cierra los domingos; el salón solo se alquila de viernes a
 * domingo; la cancha abre más tarde el sábado. Sin horario semanal, la zona
 * abre todos los días con su horario general, como antes. Con horario
 * semanal, abre solo los días marcados, cada uno con sus horas. El turno es el
 * mismo toda la semana y cada día tiene que dividirse en turnos exactos
 * (RN-105). Un día que no abre no ofrece franjas y no se puede reservar.
 */
export const NOMBRES_DIA = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']
export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
/** De lunes a domingo, como se lee una semana en Colombia. */
export const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0]

export function diaDeLaSemana(fecha: FechaISO): number {
  return new Date(`${fecha}T12:00:00`).getDay()
}

/** El horario de esa fecha, o `null` si ese día la zona no abre. */
export function horarioDelDia(
  zona: Pick<ZonaComun, 'horaInicio' | 'horaFin' | 'horarioSemanal'>,
  fecha: FechaISO,
): { horaInicio: Hora; horaFin: Hora } | null {
  if (!zona.horarioSemanal) return { horaInicio: zona.horaInicio, horaFin: zona.horaFin }
  return zona.horarioSemanal.find((h) => h.dia === diaDeLaSemana(fecha)) ?? null
}

export function motivoHorarioSemanalInvalido(
  horario: HorarioDia[] | undefined,
  duracionBloqueHoras: number,
): string | null {
  if (!horario) return null
  if (horario.length === 0) return 'Marca al menos un día en que abre la zona.'
  for (const dia of horario) {
    const nombre = NOMBRES_DIA[dia.dia]
    const inicio = horaEntera(dia.horaInicio)
    const fin = horaEntera(dia.horaFin)
    if (inicio === null || fin === null) return `El horario de los ${nombre} va en horas en punto.`
    if (fin <= inicio) return `El horario de los ${nombre} tiene que terminar después de empezar.`
    if ((fin - inicio) % duracionBloqueHoras !== 0) {
      return `Los ${nombre}, con turnos de ${duracionBloqueHoras} horas, sobra un pedazo que nadie puede reservar.`
    }
  }
  return null
}

/** El horario en palabras: «Lun a Vie 05:00–21:00 · Sáb 08:00–14:00». */
export function textoHorarioSemanal(zona: Pick<ZonaComun, 'horaInicio' | 'horaFin' | 'horarioSemanal'>): string {
  if (!zona.horarioSemanal) return `Todos los días ${zona.horaInicio} a ${zona.horaFin}`
  const dias = ORDEN_SEMANA.map((d) => zona.horarioSemanal!.find((h) => h.dia === d)).filter(
    (h): h is HorarioDia => !!h,
  )
  // Se agrupan los días seguidos con el mismo horario.
  const grupos: Array<{ desde: number; hasta: number; horario: string }> = []
  for (const h of dias) {
    const horario = `${h.horaInicio} a ${h.horaFin}`
    const ultimo = grupos[grupos.length - 1]
    const posicion = ORDEN_SEMANA.indexOf(h.dia)
    if (ultimo && ultimo.horario === horario && ORDEN_SEMANA.indexOf(ultimo.hasta) === posicion - 1) {
      ultimo.hasta = h.dia
    } else {
      grupos.push({ desde: h.dia, hasta: h.dia, horario })
    }
  }
  return grupos
    .map((g) =>
      g.desde === g.hasta
        ? `${DIAS_CORTOS[g.desde]} ${g.horario}`
        : `${DIAS_CORTOS[g.desde]} a ${DIAS_CORTOS[g.hasta]} ${g.horario}`,
    )
    .join(' · ')
}

/**
 * RN-115 — **La administración puede cancelar una sola reserva, con motivo, y a
 * quien reservó le llega el mensaje.**
 *
 * Hasta hoy solo podía rechazar la que estaba por aprobar, o cerrar la zona
 * entera (RN-107, RN-108). Pero pasa que el salón se necesita para una reunión
 * del consejo, o que se reservó violando el reglamento. Se cancela la reserva
 * activa de hoy en adelante; el motivo es obligatorio y viaja en el mismo
 * mensaje de RN-107. No es una multa ni la genera.
 */
export function puedeCancelarLaAdministracion(reserva: Reserva, hoy: FechaISO = hoyISO()): boolean {
  return reserva.estado === 'confirmada' && reserva.fecha >= hoy
}

/**
 * RN-116 — **Portería ve las reservas de hoy.**
 *
 * «El vigilante no sabe que el 402 tiene el salón hoy de 1 a 5 con 30
 * invitados», y sin eso los invitados esperan en la puerta mientras alguien
 * llama al apartamento. En el turno aparecen las reservas **confirmadas** de
 * hoy, por hora: la zona, el horario, la unidad, quién reservó y cuántas
 * personas van (RN-113). Nada de costos, depósitos ni multas: como la
 * cartera, no son asunto de la portería (RN-52).
 */
export function reservasDeHoyParaPorteria(
  reservas: Reserva[],
  zonasDeLaCopropiedad: ZonaComun[],
  hoy: FechaISO = hoyISO(),
): Reserva[] {
  const zonas = new Set(zonasDeLaCopropiedad.map((z) => z.id))
  return reservas
    .filter((r) => zonas.has(r.zonaId) && r.fecha === hoy && r.estado === 'confirmada')
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
}

/**
 * RN-117 — **El cierre por mantenimiento se le puede avisar a toda la
 * copropiedad.**
 *
 * «Es importante que el administrador tenga la opción, si el área común se
 * cierra por mantenimiento, de seleccionar esta opción y que se genere un
 * mensaje masivo» (Mary, 2026-10-01). A quien tenía reserva le llega siempre
 * su cancelación (RN-108); con esta opción, además, todos se enteran antes de
 * intentar reservar. Va por las dos vías de siempre, como los avances de obra
 * (RN-101): un comunicado de mantenimiento en la cartelera y un mensaje a cada
 * persona con residencia vigente —propietarios, arrendatarios y autorizados—,
 * uno por persona aunque tenga varias unidades. Quien ya recibió la
 * cancelación de su reserva no recibe un segundo mensaje: ya lo sabe.
 */
export function textoCierreZona(
  zona: ZonaComun,
  cierre: { desde: FechaISO; hasta: FechaISO; motivo: string },
  copropiedad: string,
): string {
  const fechas =
    cierre.desde === cierre.hasta
      ? `el ${fechaCorta(cierre.desde)}`
      : `del ${fechaCorta(cierre.desde)} al ${fechaCorta(cierre.hasta)}`
  const porque = cierre.motivo.trim().replace(/[.\s]+$/, '')
  return `${copropiedad}: ${zona.nombre} estará cerrada por mantenimiento ${fechas}. Motivo: ${porque}. Más detalles en la cartelera de Idiky.`
}

// ---------------------------------------------------------------------------
// Calendario de ocupación — CU-A-29
// ---------------------------------------------------------------------------

/** El lunes de la semana de esa fecha: la semana se lee de lunes a domingo. */
export function lunesDeLaSemana(fecha: FechaISO): FechaISO {
  const dia = diaDeLaSemana(fecha)
  return sumarDias(fecha, dia === 0 ? -6 : 1 - dia)
}

/** Los turnos que existen en alguno de esos días, en orden (RN-114: cada día puede tener los suyos). */
export function franjasDeLaSemana(zona: ZonaComun, dias: FechaISO[]): Array<{ inicio: string; fin: string }> {
  const todas = new Map<string, { inicio: string; fin: string }>()
  for (const dia of dias) for (const f of franjasDeZona(zona, dia)) todas.set(`${f.inicio}-${f.fin}`, f)
  return [...todas.values()].sort((a, b) => a.inicio.localeCompare(b.inicio))
}

/**
 * Qué hay en una casilla del calendario. No es una regla nueva: junta las que
 * ya existen para que el administrador las vea de un vistazo —el horario del
 * día (RN-114), el cierre por mantenimiento (RN-108), la reserva exclusiva
 * (RN-09) o la ocupación del turno compartido (RN-111)—.
 */
export type CeldaCalendario =
  | { tipo: 'no_abre' }
  | { tipo: 'cerrada'; motivo: string }
  | { tipo: 'libre' }
  | { tipo: 'ocupada'; reservas: Reserva[]; personas: number }

export function celdaCalendario(
  zona: ZonaComun,
  reservas: Reserva[],
  fecha: FechaISO,
  horaInicio: string,
): CeldaCalendario {
  if (!franjasDeZona(zona, fecha).some((f) => f.inicio === horaInicio)) return { tipo: 'no_abre' }
  const cierre = cierreEnFecha(zona, fecha)
  if (cierre) return { tipo: 'cerrada', motivo: cierre.motivo }
  const delTurno = reservas.filter(
    (r) => r.zonaId === zona.id && r.fecha === fecha && r.horaInicio === horaInicio && reservaOcupaFranja(r),
  )
  if (delTurno.length === 0) return { tipo: 'libre' }
  return { tipo: 'ocupada', reservas: delTurno, personas: delTurno.reduce((t, r) => t + (r.personas ?? 1), 0) }
}

/**
 * La ocupación de la semana, en turnos: cuántos de los que abren tienen al
 * menos una reserva. En la zona compartida cuenta además las personas sobre
 * el cupo total, que es lo que dice si el gimnasio se queda corto.
 */
export function ocupacionDeLaSemana(
  zona: ZonaComun,
  reservas: Reserva[],
  dias: FechaISO[],
): { turnos: number; ocupados: number; personas: number; cupo: number } {
  let turnos = 0
  let ocupados = 0
  let personas = 0
  for (const dia of dias) {
    for (const f of franjasDeZona(zona, dia)) {
      const celda = celdaCalendario(zona, reservas, dia, f.inicio)
      if (celda.tipo === 'no_abre' || celda.tipo === 'cerrada') continue
      turnos += 1
      if (celda.tipo === 'ocupada') {
        ocupados += 1
        personas += celda.personas
      }
    }
  }
  return { turnos, ocupados, personas, cupo: turnos * zona.aforo }
}

// ---------------------------------------------------------------------------
// La plata de la reserva: cobro por uso, depósito y multa — RN-118 a RN-121
// ---------------------------------------------------------------------------

/**
 * RN-118 — **Lo que cuesta una reserva se fija al reservar.**
 *
 * El valor por uso y el depósito se copian de la zona a la reserva cuando se
 * crea, como el documento contable guarda su cuenta (RN-85): si la
 * administración sube el precio después, lo que el residente aceptó no cambia.
 */
export function valoresDeLaReserva(zona: ZonaComun): { valorUso?: number; deposito?: number } {
  return {
    ...(zona.valorUso ? { valorUso: zona.valorUso } : {}),
    ...(zona.deposito ? { deposito: zona.deposito } : {}),
  }
}

/**
 * RN-119 — **El cobro por uso se genera al cerrar la reserva, no al
 * confirmarla.**
 *
 * «Sigamos con el 8» (Mary, 2026-10-01). Después del turno, la administración
 * cierra la reserva: se usó, o no se presentó. En los dos casos se genera el
 * cobro por uso en el estado de cuenta de la unidad —el turno quedó apartado
 * y nadie más lo pudo usar—, como una cuota `uso_zona` con su justificación
 * y el documento que la autoriza (RN-45, RN-47), que vence a los diez días.
 *
 * Por qué al cerrar y no al confirmar: una reserva cancelada nunca deja un
 * cobro, y así no hace falta anular cuotas, que es tocar las reglas de cartera
 * que se comparten con la contable (RN-75 a RN-79). Se cierra una reserva
 * confirmada cuyo turno ya empezó, una sola vez.
 */
export const DIAS_PARA_PAGAR_USO = 10

export function puedeCerrarReserva(reserva: Reserva, ahora: Date = new Date()): boolean {
  if (reserva.estado !== 'confirmada' || reserva.cierre) return false
  return new Date(`${reserva.fecha}T${reserva.horaInicio}:00`).getTime() <= ahora.getTime()
}

/** Por qué se cobra, en la línea del estado de cuenta (RN-47). */
export function justificacionCobroUso(reserva: Reserva, zona: ZonaComun, noSePresento: boolean): string {
  const respaldo = zona.respaldoCobro ? ` (${textoRespaldo(zona.respaldoCobro)})` : ''
  const cuando = `${fechaCorta(reserva.fecha)}, ${reserva.horaInicio} a ${reserva.horaFin}`
  return noSePresento
    ? `Reserva de ${zona.nombre} del ${cuando}: el turno quedó apartado y no se usó${respaldo}.`
    : `Uso de ${zona.nombre} el ${cuando}${respaldo}.`
}

/**
 * RN-120 — **El depósito se devuelve completo si la zona queda bien; si no, se
 * retiene una parte, con motivo.**
 *
 * La administración registra que lo recibió. Al cerrar la reserva anota cómo
 * quedó la zona —bien, o con novedades, que se describen, con una foto si la
 * hay— y decide: devolverlo completo o retener una parte que no pasa del
 * depósito. Retener exige que haya novedades y el motivo: es la plata del
 * residente, y sin prueba es la queja que sigue. Si no se presentó, la zona no
 * se usó y el depósito se devuelve completo.
 */
export function motivoCierreReservaInvalido(
  reserva: Reserva,
  cierre: {
    resultado: 'usada' | 'no_se_presento'
    estadoZona?: 'bien' | 'con_novedades'
    observaciones?: string
    retener?: number
    motivoRetencion?: string
  },
): string | null {
  if (!puedeCerrarReserva(reserva)) return 'Esa reserva no se puede cerrar: tiene que estar confirmada y su turno ya empezado.'
  if (cierre.resultado === 'no_se_presento') return null
  if (!cierre.estadoZona) return 'Di cómo quedó la zona.'
  if (cierre.estadoZona === 'con_novedades' && (cierre.observaciones ?? '').trim().length < 10) {
    return 'Describe las novedades: qué se dañó o qué faltó.'
  }
  const retener = cierre.retener ?? 0
  if (retener > 0) {
    if (!reserva.depositoRecibidoEn) return 'No se puede retener un depósito que no se recibió.'
    if (cierre.estadoZona !== 'con_novedades') return 'Solo se retiene si la zona quedó con novedades.'
    if (!Number.isInteger(retener) || retener > (reserva.deposito ?? 0)) {
      return 'Lo retenido va en pesos y no pasa del depósito.'
    }
    if ((cierre.motivoRetencion ?? '').trim().length < 10) return 'Escribe por qué se retiene: es lo que lee el residente.'
  }
  return null
}

/**
 * RN-121 — **Si no se presentó, o canceló fuera de plazo, la administración
 * puede abrir el proceso por la multa.**
 *
 * Con la multa que la zona tiene en el catálogo (RN-110), un solo proceso por
 * reserva y con los hechos ya escritos: qué zona, qué turno y qué pasó. La
 * administración decide si lo abre —no es automático—, y desde ahí es un
 * proceso sancionatorio como cualquiera: descargos, decisión, impugnación y
 * la cuota solo cuando queda firme (RN-39, RN-69).
 */
export function puedeAbrirProcesoPorReserva(reserva: Reserva, zona: ZonaComun | undefined): boolean {
  if (!zona?.multaNoCancelar || reserva.sancionId) return false
  return reserva.cierre?.resultado === 'no_se_presento' || !!reserva.canceladaFueraDePlazo
}

export function hechosDeLaReserva(reserva: Reserva, zona: ZonaComun): string {
  const cuando = `el ${fechaCorta(reserva.fecha)} de ${reserva.horaInicio} a ${reserva.horaFin}`
  // RN-124 — Si aceptó las condiciones al reservar, los hechos lo dicen.
  const acepto = reserva.condicionesAceptadas
    ? ` Al reservar aceptó las condiciones de la zona, incluida la multa, el ${fechaCorta(reserva.condicionesAceptadas.aceptadasEn.slice(0, 10))}.`
    : ''
  return (reserva.canceladaFueraDePlazo
    ? `La unidad canceló su reserva de ${zona.nombre} ${cuando} fuera del plazo de ${zona.multaNoCancelar?.horasParaCancelar ?? 0} horas que fija la zona.`
    : `La unidad reservó ${zona.nombre} ${cuando}, no se presentó y no canceló la reserva.`) + acepto
}

// ---------------------------------------------------------------------------
// Solicitudes, avisos, condiciones e invitados — RN-122 a RN-126
// ---------------------------------------------------------------------------

function inicioDeReserva(reserva: Reserva): number {
  return new Date(`${reserva.fecha}T${reserva.horaInicio}:00`).getTime()
}

/** `80000` → `$80.000`, dentro de un texto que se guarda o se manda. */
function pesos(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}

/**
 * RN-122 — **La solicitud que nadie contesta vence en su turno** (CU-S-03).
 *
 * «Implementar del 1 al 5» (Mary, 2026-10-01). Una zona con aprobación deja
 * la reserva en `solicitada`, y así el turno queda apartado. Si la
 * administración no la aprueba ni la rechaza, al llegar la hora del turno la
 * solicitud **vence**: queda `vencida`, el turno se libera y al residente le
 * llega un mensaje. Antes de eso, el tablero del administrador avisa las
 * solicitudes a las que les faltan menos de 48 horas.
 *
 * El demo no tiene un servidor que corra a la hora exacta: el vencimiento se
 * aplica cada vez que se abre la app, que para una reserva ya pasada da lo
 * mismo.
 */
export const HORAS_ALERTA_SOLICITUD = 48

export function solicitudVencida(reserva: Reserva, ahora: Date = new Date()): boolean {
  return reserva.estado === 'solicitada' && inicioDeReserva(reserva) <= ahora.getTime()
}

/** Las solicitudes a las que les faltan menos de 48 horas, la más urgente primero. */
export function solicitudesPorVencer(
  reservas: Reserva[],
  zonasDeLaCopropiedad: ZonaComun[],
  ahora: Date = new Date(),
): Array<{ reserva: Reserva; horas: number }> {
  const zonas = new Set(zonasDeLaCopropiedad.map((z) => z.id))
  return reservas
    .filter((r) => zonas.has(r.zonaId) && r.estado === 'solicitada')
    .map((reserva) => ({ reserva, horas: (inicioDeReserva(reserva) - ahora.getTime()) / 3_600_000 }))
    .filter((x) => x.horas > 0 && x.horas <= HORAS_ALERTA_SOLICITUD)
    .map((x) => ({ reserva: x.reserva, horas: Math.floor(x.horas) }))
    .sort((a, b) => a.horas - b.horas)
}

export function textoReservaVencida(reserva: Reserva, zona: ZonaComun, copropiedad: string): string {
  return (
    `${copropiedad}: tu solicitud de ${zona.nombre} del ${fechaCorta(reserva.fecha)} de ` +
    `${reserva.horaInicio} a ${reserva.horaFin} venció sin respuesta de la administración. ` +
    'No tiene ningún cobro. Puedes volver a reservar en Idiky.'
  )
}

/**
 * RN-123 — **Al residente le llega la respuesta a su solicitud.**
 *
 * Aprobada o rechazada, con el motivo si se rechazó: es lo que promete CU-A-06
 * («el residente se entera»), por el mismo canal de los demás avisos (RN-64).
 */
export function textoReservaDecidida(
  reserva: Reserva,
  zona: ZonaComun,
  decision: 'confirmada' | 'rechazada',
  motivo: string | undefined,
  copropiedad: string,
): string {
  const cuando = `del ${fechaCorta(reserva.fecha)} de ${reserva.horaInicio} a ${reserva.horaFin}`
  if (decision === 'confirmada') {
    const deposito = reserva.deposito ? ` Recuerda entregar el depósito de ${pesos(reserva.deposito)} antes del turno.` : ''
    return `${copropiedad}: la administración aprobó tu reserva de ${zona.nombre} ${cuando}.${deposito}`
  }
  const porque = (motivo ?? '').trim().replace(/[.\s]+$/, '')
  return `${copropiedad}: la administración rechazó tu reserva de ${zona.nombre} ${cuando}.${porque ? ` Motivo: ${porque}.` : ''}`
}

/**
 * RN-124 — **Quien reserva acepta las condiciones, y queda constancia.**
 *
 * Si la zona cobra, pide depósito o tiene multa por no cancelar, antes de
 * confirmar el residente marca que las acepta. Se guarda **el texto tal como
 * lo leyó** y la hora: si mañana la zona cambia, la constancia sigue diciendo
 * lo que aceptó. Es lo que respalda el cobro (RN-119), la retención (RN-120) y
 * la multa (RN-121) si después se reclaman. Una zona sin nada de eso no pide
 * aceptar nada.
 */
export function condicionesDeLaZona(zona: ZonaComun, conceptosSancion: ConceptoSancion[]): string | null {
  const partes: string[] = []
  // Cada cosa con su respaldo: el cobro y el depósito, el de la zona; la multa, el de su concepto.
  const cobros: string[] = []
  if (zona.valorUso) cobros.push(`valor por reserva de ${pesos(zona.valorUso)}`)
  if (zona.deposito) cobros.push(`depósito de garantía de ${pesos(zona.deposito)}, que se devuelve si la zona queda como se entregó`)
  if (cobros.length) {
    const respaldo = zona.respaldoCobro ? ` (${textoRespaldo(zona.respaldoCobro)})` : ''
    partes.push(`${cobros.join('; ')}${respaldo}`)
  }
  const multa = zona.multaNoCancelar
  const concepto = multa ? conceptosSancion.find((c) => c.id === multa.conceptoId) : undefined
  if (multa && concepto) {
    partes.push(
      `multa de ${pesos(concepto.valor)} («${concepto.nombre}», ${textoRespaldo(concepto)}) si no cancelo con al menos ${multa.horasParaCancelar} horas de anticipación o no me presento`,
    )
  }
  if (partes.length === 0) return null
  return `Acepto las condiciones de ${zona.nombre}: ${partes.join('; ')}.`
}

/**
 * RN-125 — **El día antes, un recordatorio.**
 *
 * A la reserva confirmada de hoy o de mañana que todavía no empieza le llega
 * un mensaje, una sola vez: qué zona, a qué hora y, si falta, que entregue el
 * depósito. Evita el «se me olvidó» que termina en «no se presentó» (RN-121).
 * Como el vencimiento (RN-122), se aplica al abrir la app.
 */
export function debeRecordarse(reserva: Reserva, ahora: Date = new Date()): boolean {
  if (reserva.estado !== 'confirmada' || reserva.cierre || reserva.recordatorioEnviadoEn) return false
  const faltan = inicioDeReserva(reserva) - ahora.getTime()
  const manana = new Date(ahora)
  manana.setDate(manana.getDate() + 1)
  const fechaManana = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`
  return faltan > 0 && reserva.fecha <= fechaManana
}

export function textoRecordatorioReserva(reserva: Reserva, zona: ZonaComun, copropiedad: string, hoy: FechaISO = hoyISO()): string {
  const cuando = reserva.fecha === hoy ? 'hoy' : 'mañana'
  const deposito =
    reserva.deposito && !reserva.depositoRecibidoEn ? ` Recuerda entregar el depósito de ${pesos(reserva.deposito)} a la administración.` : ''
  const invitados = reserva.invitados?.length ? ` Portería tiene la lista de tus ${reserva.invitados.length} invitados.` : ''
  return `${copropiedad}: ${cuando} tienes ${zona.nombre} de ${reserva.horaInicio} a ${reserva.horaFin}.${deposito}${invitados} Si no vas a ir, cancela en Idiky.`
}

/**
 * RN-126 — **La lista de invitados la ve portería.**
 *
 * Quien reserva puede escribir los nombres de sus invitados, uno por renglón,
 * al reservar o después, hasta que empiece el turno. Caben tantos como
 * personas declaró menos él mismo (RN-113). Portería los ve en las reservas de
 * hoy (RN-116), para dejarlos entrar sin llamar al apartamento. Son nombres,
 * no documentos: portería pide el documento en la entrada como a cualquier
 * visitante.
 */
export const MAXIMO_LARGO_INVITADO = 80

export function limpiarInvitados(texto: string): string[] {
  return texto
    .split('\n')
    .map((linea) => linea.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter((linea) => linea.length > 0)
}

export function motivoInvitadosInvalido(invitados: string[], personas: number): string | null {
  const maximo = Math.max(0, personas - 1)
  if (invitados.length > maximo) {
    return `Declaraste ${personas} ${personas === 1 ? 'persona' : 'personas'}: caben ${maximo} ${maximo === 1 ? 'invitado' : 'invitados'} además de ti.`
  }
  if (invitados.some((n) => n.length > MAXIMO_LARGO_INVITADO)) return 'Cada nombre cabe en 80 caracteres.'
  return null
}

export function puedeEditarInvitados(reserva: Reserva, ahora: Date = new Date()): boolean {
  return (reserva.estado === 'solicitada' || reserva.estado === 'confirmada') && inicioDeReserva(reserva) > ahora.getTime()
}

// ---------------------------------------------------------------------------
// Informe de uso de las zonas comunes — CU-A-30
// ---------------------------------------------------------------------------

/** Los días de un periodo, de `desde` a `hasta`, incluidos los dos. */
export function diasDelPeriodo(desde: FechaISO, hasta: FechaISO): FechaISO[] {
  const dias: FechaISO[] = []
  for (let dia = desde; dia <= hasta && dias.length < 400; dia = sumarDias(dia, 1)) dias.push(dia)
  return dias
}

/** Lo que dice el informe de una zona en un periodo. */
export interface FilaInformeZona {
  zona: ZonaComun
  /** Todas las reservas con fecha en el periodo, en cualquier estado. */
  solicitudes: number
  /** Las que quedaron tomadas: confirmadas, usadas o no. */
  tomadas: number
  usadas: number
  noSePresento: number
  canceladasPorResidente: number
  canceladasFueraDePlazo: number
  canceladasPorAdministracion: number
  rechazadas: number
  vencidas: number
  /** Personas declaradas en las tomadas (RN-113). */
  personas: number
  /** Turnos que abrieron en el periodo y cuántos tuvieron al menos una reserva. */
  turnos: number
  turnosOcupados: number
  /** Cobros por uso generados al cerrar (RN-119) y lo que ya se pagó de ellos. */
  cobrado: number
  recaudado: number
  depositoRetenido: number
  procesos: number
}

/**
 * CU-A-30 — **El informe de uso cuenta lo que ya está registrado; no inventa.**
 *
 * «Me gusta la idea del informe del uso de las zonas comunes» (Mary,
 * 2026-10-01). Toma las reservas con fecha dentro del periodo y cuenta así:
 * tomadas son las confirmadas (se hayan cerrado o no); usadas y «no se
 * presentó» salen del cierre (RN-119); las canceladas se separan por quién y
 * cuándo (el residente a tiempo, fuera de plazo —RN-112— o la administración,
 * RN-107, RN-108, RN-115); la ocupación son los turnos que abrieron con al
 * menos una reserva, con los días y cierres de cada zona (RN-114, RN-108); lo
 * cobrado son las cuotas de uso generadas y lo recaudado, lo que ya se pagó
 * de ellas (RN-75). No es una regla nueva: es la suma de las que ya existen.
 */
export function informeDeUsoDeZonas(
  zonas: ZonaComun[],
  reservas: Reserva[],
  cuotas: Cuota[],
  desde: FechaISO,
  hasta: FechaISO,
): FilaInformeZona[] {
  const dias = diasDelPeriodo(desde, hasta)
  return zonas.map((zona) => {
    const delPeriodo = reservas.filter((r) => r.zonaId === zona.id && r.fecha >= desde && r.fecha <= hasta)
    const tomadas = delPeriodo.filter((r) => r.estado === 'confirmada')
    const canceladas = delPeriodo.filter((r) => r.estado === 'cancelada')
    const ocupacion = ocupacionDeLaSemana(zona, reservas, dias)
    let cobrado = 0
    let recaudado = 0
    let depositoRetenido = 0
    for (const r of tomadas) {
      const cuota = r.cierre?.cuotaUsoId ? cuotas.find((c) => c.id === r.cierre!.cuotaUsoId) : undefined
      if (cuota) {
        cobrado += cuota.valor
        recaudado += cuota.valor - cuota.saldo
      }
      depositoRetenido += r.cierre?.depositoRetenido ?? 0
    }
    return {
      zona,
      solicitudes: delPeriodo.length,
      tomadas: tomadas.length,
      usadas: tomadas.filter((r) => r.cierre?.resultado === 'usada').length,
      noSePresento: tomadas.filter((r) => r.cierre?.resultado === 'no_se_presento').length,
      canceladasPorResidente: canceladas.filter((r) => !r.motivoCancelacion && !r.canceladaFueraDePlazo).length,
      canceladasFueraDePlazo: canceladas.filter((r) => r.canceladaFueraDePlazo).length,
      canceladasPorAdministracion: canceladas.filter((r) => !!r.motivoCancelacion).length,
      rechazadas: delPeriodo.filter((r) => r.estado === 'rechazada').length,
      vencidas: delPeriodo.filter((r) => r.estado === 'vencida').length,
      personas: tomadas.reduce((t, r) => t + (r.personas ?? 1), 0),
      turnos: ocupacion.turnos,
      turnosOcupados: ocupacion.ocupados,
      cobrado,
      recaudado,
      depositoRetenido,
      procesos: delPeriodo.filter((r) => r.sancionId).length,
    }
  })
}

/** Las unidades que más turnos tomaron en el periodo, de más a menos. */
export function unidadesQueMasReservan(
  reservas: Reserva[],
  zonas: ZonaComun[],
  desde: FechaISO,
  hasta: FechaISO,
  cuantas = 5,
): Array<{ unidadId: string; reservas: number; noSePresento: number }> {
  const ids = new Set(zonas.map((z) => z.id))
  const conteo = new Map<string, { reservas: number; noSePresento: number }>()
  for (const r of reservas) {
    if (!ids.has(r.zonaId) || r.fecha < desde || r.fecha > hasta || r.estado !== 'confirmada') continue
    const actual = conteo.get(r.unidadId) ?? { reservas: 0, noSePresento: 0 }
    actual.reservas += 1
    if (r.cierre?.resultado === 'no_se_presento') actual.noSePresento += 1
    conteo.set(r.unidadId, actual)
  }
  return [...conteo.entries()]
    .map(([unidadId, c]) => ({ unidadId, ...c }))
    .sort((a, b) => b.reservas - a.reservas)
    .slice(0, cuantas)
}

// ---------------------------------------------------------------------------
// Estado de cuenta — CU-R-18 · RN-127
// ---------------------------------------------------------------------------

/**
 * RN-127 — **El estado de cuenta cuenta lo que se cobró y lo que se aplicó, y
 * congela lo que afirma.**
 *
 * «Sí, por favor» (Mary, 2026-10-01, al escoger CU-R-18). Para un rango de
 * periodos —por defecto el año en curso— el estado de cuenta lista:
 *
 * - **Saldo anterior:** lo cobrado antes del rango menos lo aplicado antes.
 * - **Cargos:** cada cuota con periodo dentro del rango —ordinarias,
 *   extraordinarias, intereses, multas en firme, uso de zonas—, por su valor.
 * - **Abonos:** cada pago **aplicado** con fecha de aplicación dentro del
 *   rango, por su valor completo; si sobró, el saldo final queda a favor
 *   (RN-76). El abono que el propietario informó y la administración no ha
 *   aplicado **no cuenta** (RN-79), y el anulado tampoco (RN-78).
 * - **Saldo final** = saldo anterior + cargos − abonos, con el saldo corrido
 *   en cada renglón.
 *
 * Se emite como documento con consecutivo y código de verificación (RN-36,
 * ADR-0006) y **guarda lo que afirmó**: reimprimirlo en junio da el papel de
 * marzo, no uno nuevo con el mismo número. Sin movimientos ni saldo en el
 * rango no se emite: se avisa antes (CU-R-18, A1).
 */
export function estadoDeCuenta(
  cuotas: Cuota[],
  pagos: Pago[],
  desde: Periodo,
  hasta: Periodo,
): Omit<EstadoCuentaCongelado, 'solicitadoPor'> {
  const aplicados = pagos.filter((p) => p.estado === 'aplicado')
  const mesDePago = (p: Pago) => (p.fechaAplicacion ?? p.fecha).slice(0, 7)
  const saldoInicial =
    cuotas.filter((c) => c.periodo < desde).reduce((t, c) => t + c.valor, 0) -
    aplicados.filter((p) => mesDePago(p) < desde).reduce((t, p) => t + p.valor, 0)

  const renglones: Array<Omit<MovimientoCuenta, 'saldo'>> = [
    ...cuotas
      .filter((c) => c.periodo >= desde && c.periodo <= hasta)
      .map((c) => ({ fecha: `${c.periodo}-01`, tipo: 'cargo' as const, concepto: c.concepto, valor: c.valor })),
    ...aplicados
      .filter((p) => mesDePago(p) >= desde && mesDePago(p) <= hasta)
      .map((p) => ({
        fecha: (p.fechaAplicacion ?? p.fecha).slice(0, 10),
        tipo: 'abono' as const,
        concepto: p.recibo ? `Pago aplicado · recibo ${p.recibo}` : 'Pago aplicado',
        valor: p.valor,
      })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.tipo === b.tipo ? 0 : a.tipo === 'cargo' ? -1 : 1))

  let saldo = saldoInicial
  const movimientos = renglones.map((r) => {
    saldo += r.tipo === 'cargo' ? r.valor : -r.valor
    return { ...r, saldo }
  })
  const totalCargos = renglones.filter((r) => r.tipo === 'cargo').reduce((t, r) => t + r.valor, 0)
  const totalAbonos = renglones.filter((r) => r.tipo === 'abono').reduce((t, r) => t + r.valor, 0)
  return { desde, hasta, saldoInicial, movimientos, totalCargos, totalAbonos, saldoFinal: saldo }
}

/** Por qué no se puede emitir con ese rango, o `null` si se puede. */
export function motivoEstadoCuentaInvalido(desde: Periodo, hasta: Periodo, estado: { saldoInicial: number; movimientos: unknown[] }): string | null {
  if (!/^\d{4}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}$/.test(hasta)) return 'Escoge el mes inicial y el final.'
  if (desde > hasta) return 'El mes final va después del inicial.'
  if (estado.movimientos.length === 0 && estado.saldoInicial === 0) {
    return 'En ese rango no hay cobros, pagos ni saldo: no hay nada que certificar.'
  }
  return null
}
