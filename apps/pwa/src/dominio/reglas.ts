/**
 * Reglas de negocio del dominio (RN-xx de docs/05-modelo-de-datos.md).
 *
 * IMPORTANTE: funciones puras, sin React y sin acceso a datos. Son la unica
 * definicion de cada regla; las pantallas las consumen, no las reimplementan.
 * Cuando exista el backend, este archivo se comparte con el servidor.
 */

import type {
  Asamblea,
  Asistencia,
  FormaAsistencia,
  ModalidadAsamblea,
  CategoriaRegistro,
  ConceptoSancion,
  EstadoSancion,
  OrigenRespaldo,
  Sancion,
  RolUsuario,
  Cuota,
  FechaISO,
  Periodo,
  Pqrs,
  RegistroPersona,
  Reserva,
  RolResidencia,
  TipoCuota,
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
    detalle: 'Se reúnen por Zoom, Meet o la herramienta que usen. Idiky enlaza esa reunión.',
    exigeLugar: false,
    exigeEnlace: true,
  },
  {
    id: 'mixta',
    texto: 'Mixta',
    detalle: 'Unos en el salón y otros conectados. Las dos formas suman al mismo quórum.',
    exigeLugar: true,
    exigeEnlace: true,
  },
]

export function definicionModalidad(modalidad: ModalidadAsamblea) {
  return MODALIDADES.find((m) => m.id === modalidad)!
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
 * ADR-0007 — Lo que se puede decir de la asistencia **sin decidir el quorum**.
 *
 * Registrar quien asistio y sumar sus coeficientes no exige saber cuanto quorum
 * se necesita: son dos cosas distintas y solo la segunda esta sin decidir
 * (RN-28, §3 bis). Asi que esto suma y reparte por forma —que es lo que el acta
 * necesita en una mixta— y **deliberadamente no devuelve `hayQuorum`**: afirmarlo
 * con un umbral inventado seria peor que no decir nada.
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

/** Solo tiene sentido marcar asistencia mientras la asamblea esta instalada. */
export function admiteAsistencia(asamblea: Asamblea): boolean {
  return asamblea.estado === 'instalada'
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

/** Un registro no pasa de la espera de soportes sin las dos fotos (RN-57). */
export function soportesCompletos(registro: RegistroPersona): boolean {
  if (!exigeSoportes(registro.categoria)) return true
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
