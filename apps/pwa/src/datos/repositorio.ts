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
  Copropiedad,
  MotivoCierreVinculo,
  AccesoSoporte,
  AutorActuacion,
  BaseDatos,
  CategoriaComunicado,
  ConceptoSancion,
  Acta,
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
  CondicionRegistro,
  TipoIdentificacion,
  RolResidencia,
  CategoriaPqrs,
  CierreZona,
  Comunicado,
  Correspondencia,
  Cuota,
  Documento,
  FechaISO,
  ZonaComun,
  Proyecto,
  AvanceProyecto,
  MedioPago,
  MotivoMensaje,
  Imputacion,
  OrigenPago,
  Pago,
  Periodo,
  Pqrs,
  RegistroPersona,
  Reserva,
  Residencia,
  Sancion,
  TipoCorrespondencia,
  TipoPqrs,
  Visitante,
  Voto,
} from '../dominio/tipos'
import {
  ahoraISO,
  calcularFechaLimite,
  calcularSaldo,
  estadoRealCuota,
  hoyISO,
  imputarPago,
  numeroRecibo,
  prorratearPorCoeficiente,
  exigeSoportes,
  exigeVigencia,
  puedeAutorizar,
  puedeImpugnar,
  puedePresentarDescargos,
  puedeQuedarEnFirme,
  puedeVotar,
  multaAplicable,
  actaCongelada,
  actaDeAsamblea,
  admiteAsistencia,
  convocatoriaCompleta,
  faltaEnActa,
  limiteVerificacionActa,
  MAXIMO_FOTOS_ZONA,
  MAXIMO_ESPECIFICACIONES,
  puedeAgregarFotoZona,
  motivoZonaInvalida,
  reservasQueCancelaDesactivar,
  textoReservaCancelada,
  zonaActiva,
  MINIMO_MOTIVO_DESACTIVACION,
  motivoCierreInvalido,
  motivoDeCierre,
  reservasQueCancelaCierre,
  validarReserva,
  fechaCorta,
  etiquetaUnidad,
  puedeRegistrar,
  puedeInhabilitar,
  motivoNoRegistraAdministracion,
  puedeVerSoportes,
  reservaOcupaFranja,
  sePuedeCancelar,
  estadoDeCuenta,
  motivoEstadoCuentaInvalido,
  franjasDeZona,
  multaAlCancelar,
  puedeCancelarLaAdministracion,
  textoCierreZona,
  valoresDeLaReserva,
  debeCerrarseSola,
  solicitudVencida,
  textoReservaVencida,
  textoReservaDecidida,
  condicionesDeLaZona,
  debeRecordarse,
  textoRecordatorioReserva,
  motivoInvitadosInvalido,
  puedeEditarInvitados,
  justificacionCobroUso,
  motivoCierreReservaInvalido,
  puedeAbrirProcesoPorReserva,
  hechosDeLaReserva,
  DIAS_PARA_PAGAR_USO,
  type DatosZona,
  puedeConfirmarRecepcion,
  admiteGrabacion,
  motivoAvanceInvalido,
  textoAvanceProyecto,
  comisionVencida,
  motivoPlazoComisionInvalido,
  puedeGenerarActa,
  decisionAdmisibleEnLaSesion,
  poderDeUnidad,
  poderEnCursoDeUnidad,
  poderEsperandoValidacion,
  residenciaVigente,
  definicionModalidad,
  formasDeAsistir,
  respaldoCompleto,
  respaldoDeCuotaCompleto,
  rolDeRegistro,
  esVisitaDeUnDia,
  condicionesPosibles,
  marcaResidente,
  debeAvisarseFinDeEstadia,
  saleConCodigo,
  admiteMenor,
  TIPOS_IDENTIFICACION,
  categoriaDeResidencia,
  condicionDeResidencia,
  condicionesParaCambiar,
  faltaContacto,
  requiereAprobacionPropietario,
  aprobacionPropietarioActiva,
  esperaAlPropietario,
  soloUnDia,
  soportesCompletos,
  registroEnCurso,
  sumarDias,
  vecesSancionada,
  saldoAFavorDelPago,
  validarImputacion,
  vencimientoDelPeriodo,
  votacionRecibeVotos,
  yaVoto,
} from '../dominio/reglas'
import { redactar, textoAutorizacion, textoRechazo } from '../servicios/mensajeria'
import { finDePeriodo, formatearDinero, formatearFecha } from '../utilidades/formato'
import { guardar, leer, sembrar, ocupacion } from './almacen'
import { responsablesDeRegistro, responsablesDeVisita, responsablesDelVinculo, unidadTienePropietario } from './selectores'

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
  const bd = leer()
  if (aplicarProcesosDelSistema(bd)) guardar(bd)
  return bd
}

/**
 * Los procesos que en la fase 2 correrá un servidor a su hora, y que el demo
 * aplica al abrir la app: vencer las solicitudes que nadie contestó (RN-122,
 * CU-S-03), recordar las reservas de hoy y de mañana (RN-125) y cerrar las que
 * no mueven plata cuando termina su turno (RN-129). Devuelve si
 * cambió algo, para guardar solo entonces.
 */
function aplicarProcesosDelSistema(bd: BaseDatos, ahora: Date = new Date()): boolean {
  let cambio = false
  const momento = ahora.toISOString()
  for (const reserva of bd.reservas) {
    const zona = bd.zonasComunes.find((z) => z.id === reserva.zonaId)
    if (!zona) continue
    const copropiedad = bd.copropiedades.find((c) => c.id === zona.copropiedadId)?.nombre ?? 'La copropiedad'
    // RN-129 — La que no mueve plata se cierra sola al terminar su turno, sin mensaje.
    if (debeCerrarseSola(reserva, zona, ahora)) {
      reserva.cierre = { resultado: 'usada', registradoEn: momento, registradoPor: 'Cierre automático', automatico: true }
      cambio = true
      continue
    }
    let texto: string | null = null
    let motivo: MotivoMensaje | null = null
    if (solicitudVencida(reserva, ahora)) {
      reserva.estado = 'vencida'
      reserva.vencidaEn = momento
      texto = textoReservaVencida(reserva, zona, copropiedad)
      motivo = 'reserva_vencida'
    } else if (debeRecordarse(reserva, ahora)) {
      reserva.recordatorioEnviadoEn = momento
      texto = textoRecordatorioReserva(reserva, zona, copropiedad)
      motivo = 'recordatorio_reserva'
    }
    if (!texto || !motivo) continue
    cambio = true
    avisarAPersona(bd, {
      copropiedadId: zona.copropiedadId,
      personaId: reserva.personaId,
      texto,
      motivo,
      reservaId: reserva.id,
      ahora: momento,
    })
  }
  if (avisarFinesDeEstadia(bd, momento)) cambio = true
  return cambio
}

/**
 * Dos días antes de que termine una estadía temporal, se le avisa a quien
 * registró a la persona, para que la alargue si hace falta (Mary, 2026-10-02).
 * Una vez por fecha de salida: si la alargan, el aviso vuelve a tocar.
 */
function avisarFinesDeEstadia(bd: BaseDatos, momento: string): boolean {
  let cambio = false
  for (const residencia of bd.residencias) {
    if (!residencia.hasta || residencia.cierre || !residenciaVigente(residencia)) continue
    if (!debeAvisarseFinDeEstadia(residencia)) continue
    const registro = bd.registros.find((r) => r.id === residencia.registroId)
    const unidad = bd.unidades.find((u) => u.id === residencia.unidadId)
    const persona = bd.personas.find((p) => p.id === residencia.personaId)
    if (!registro || !unidad) continue
    residencia.avisoFinPara = residencia.hasta
    cambio = true
    avisarAPersona(bd, {
      copropiedadId: unidad.copropiedadId,
      personaId: registro.creadoPor,
      motivo: 'fin_de_estadia',
      texto:
        `Idiky: la estadía de ${persona?.nombres ?? 'tu residente temporal'} en ${etiquetaUnidad(unidad)} termina el ` +
        `${fechaCorta(residencia.hasta)}. Si se queda más tiempo, cámbiale la fecha de salida en la app.`,
      ahora: momento,
    })
  }
  return cambio
}

/** Devuelve el demo a su estado inicial. */
export async function reiniciar(): Promise<BaseDatos> {
  await esperar()
  const bd = sembrar()
  if (aplicarProcesosDelSistema(bd)) guardar(bd)
  return bd
}

// ---------------------------------------------------------------------------
// CU-R-04 / CU-R-30 / CU-A-04 / CU-A-27 — Pagos y recibos de caja
// ---------------------------------------------------------------------------

/** Cuotas de una unidad, para validar e imputar contra ellas. */
function cuotasDe(bd: BaseDatos, unidadId: string): Cuota[] {
  return bd.cuotas.filter((cuota) => cuota.unidadId === unidadId)
}

/**
 * Aplica el reparto sobre las cuotas: baja el saldo y ajusta el estado.
 * Con `signo` -1 revierte, que es lo que hace la anulacion (RN-78).
 */
function moverSaldos(bd: BaseDatos, imputaciones: Imputacion[], signo: 1 | -1): void {
  for (const linea of imputaciones) {
    const cuota = bd.cuotas.find((c) => c.id === linea.cuotaId)
    if (!cuota) continue
    cuota.saldo = Math.min(cuota.valor, Math.max(0, cuota.saldo - linea.valor * signo))
    cuota.estado = estadoRealCuota(cuota)
  }
}

/** Toma el siguiente numero de recibo de caja y avanza el consecutivo (RN-77). */
function emitirRecibo(bd: BaseDatos): string {
  const consecutivo = bd.consecutivos.recibo
  bd.consecutivos.recibo = consecutivo + 1
  return numeroRecibo(consecutivo)
}

export interface ParametrosPago {
  unidadId: string
  valor: number
  medio: MedioPago
  referencia?: string
  registradoPor: string
  /** Quien origina el pago. Por defecto lo registra la administracion. */
  origen?: OrigenPago
  /**
   * Reparto manual del abono entre cuotas. Si no viene, se imputa a la deuda
   * mas antigua primero (RN-06).
   */
  imputaciones?: Imputacion[]
  /** Lo que el propietario informa que esta pagando. */
  conceptoInformado?: string
}

/**
 * CU-R-30 — El propietario informa un abono que ya consigno.
 *
 * El pago nace `reportado`: queda a la espera de que la administracion lo
 * concilie. No toca la cartera hasta ese momento (RN-79), justamente porque
 * lo que el propietario informa todavia no esta verificado.
 */
export async function reportarAbono(
  bdActual: BaseDatos,
  parametros: {
    unidadId: string
    personaId: string
    valor: number
    medio: MedioPago
    referencia: string
    conceptoInformado: string
    cuotasInformadas: string[]
    reportadoPor: string
  },
): Promise<Resultado<Pago>> {
  await esperar()
  const bd = clonar(bdActual)

  if (parametros.valor <= 0) throw new ErrorDeNegocio('El valor del abono debe ser mayor que cero.')
  if (!parametros.referencia.trim()) {
    throw new ErrorDeNegocio('Indica el numero de consignacion o referencia del pago.')
  }
  if (!parametros.conceptoInformado.trim()) {
    throw new ErrorDeNegocio('Cuentanos a que corresponde tu abono.')
  }

  const pago: Pago = {
    id: nuevoId('pag'),
    unidadId: parametros.unidadId,
    valor: parametros.valor,
    medio: parametros.medio,
    referencia: parametros.referencia.trim(),
    fecha: ahoraISO(),
    estado: 'reportado',
    origen: 'residente',
    conceptoInformado: parametros.conceptoInformado.trim(),
    cuotasInformadas: parametros.cuotasInformadas,
    reportadoPor: parametros.personaId,
    imputaciones: [],
    saldoAFavor: 0,
    registradoPor: parametros.reportadoPor,
  }

  bd.pagos.unshift(pago)
  return persistir(bd, pago)
}

/**
 * CU-A-04 / CU-R-04 — Registra un pago que ya se recibio y lo aplica de una vez.
 *
 * Es el camino del pago en linea del residente y el del pago manual que la
 * administracion digita. Emite recibo de caja en el mismo acto (RN-77).
 */
export async function registrarPago(
  bdActual: BaseDatos,
  parametros: ParametrosPago,
): Promise<Resultado<Pago>> {
  await esperar()
  const bd = clonar(bdActual)
  const cuotas = cuotasDe(bd, parametros.unidadId)

  const imputaciones = parametros.imputaciones ?? imputarPago(cuotas, parametros.valor)
  const validacion = validarImputacion({ valor: parametros.valor, imputaciones, cuotas })
  if (!validacion.valido) throw new ErrorDeNegocio(validacion.motivo!)

  const pago: Pago = {
    id: nuevoId('pag'),
    unidadId: parametros.unidadId,
    valor: parametros.valor,
    medio: parametros.medio,
    referencia: parametros.referencia?.trim() || `REF${Date.now().toString().slice(-8)}`,
    fecha: ahoraISO(),
    estado: 'aplicado',
    origen: parametros.origen ?? 'administracion',
    conceptoInformado: parametros.conceptoInformado,
    recibo: emitirRecibo(bd),
    imputaciones: imputaciones.filter((linea) => linea.valor > 0),
    saldoAFavor: saldoAFavorDelPago(parametros.valor, imputaciones),
    fechaAplicacion: ahoraISO(),
    registradoPor: parametros.registradoPor,
  }

  moverSaldos(bd, pago.imputaciones, 1)
  bd.pagos.unshift(pago)
  return persistir(bd, pago)
}

/**
 * CU-A-27 — La administracion concilia un abono informado por el propietario.
 *
 * Aqui es donde el pago entra a la cartera: se reparte entre cuotas y se le
 * asigna el numero de recibo de caja. Si no se indica reparto, se aplica la
 * imputacion por antiguedad (RN-06), que casi siempre es lo que corresponde.
 */
export async function aplicarPago(
  bdActual: BaseDatos,
  parametros: {
    pagoId: string
    imputaciones?: Imputacion[]
    aplicadoPor: string
  },
): Promise<Resultado<Pago>> {
  await esperar()
  const bd = clonar(bdActual)
  const pago = bd.pagos.find((p) => p.id === parametros.pagoId)
  if (!pago) throw new ErrorDeNegocio('El pago no existe.')
  if (pago.estado !== 'reportado') {
    throw new ErrorDeNegocio('Solo se pueden aplicar los abonos que estan reportados.')
  }

  const cuotas = cuotasDe(bd, pago.unidadId)
  const imputaciones = parametros.imputaciones ?? imputarPago(cuotas, pago.valor)
  const validacion = validarImputacion({ valor: pago.valor, imputaciones, cuotas })
  if (!validacion.valido) throw new ErrorDeNegocio(validacion.motivo!)

  pago.imputaciones = imputaciones.filter((linea) => linea.valor > 0)
  pago.saldoAFavor = saldoAFavorDelPago(pago.valor, imputaciones)
  pago.estado = 'aplicado'
  pago.recibo = emitirRecibo(bd)
  pago.fechaAplicacion = ahoraISO()
  pago.registradoPor = parametros.aplicadoPor

  moverSaldos(bd, pago.imputaciones, 1)
  return persistir(bd, pago)
}

/**
 * CU-A-27 — Anula un recibo de caja.
 *
 * RN-78: no se borra el registro, se marca anulado con su motivo y el saldo
 * vuelve a las cuotas. El numero de recibo queda quemado, no se reutiliza.
 */
export async function anularPago(
  bdActual: BaseDatos,
  parametros: { pagoId: string; motivo: string },
): Promise<Resultado<Pago>> {
  await esperar()
  const bd = clonar(bdActual)
  const pago = bd.pagos.find((p) => p.id === parametros.pagoId)
  if (!pago) throw new ErrorDeNegocio('El pago no existe.')
  if (!parametros.motivo.trim()) throw new ErrorDeNegocio('Escribe el motivo de la anulacion.')

  if (pago.estado === 'anulado') throw new ErrorDeNegocio('Ese recibo ya esta anulado.')
  if (pago.estado === 'aplicado') moverSaldos(bd, pago.imputaciones, -1)

  pago.estado = 'anulado'
  pago.motivoAnulacion = parametros.motivo.trim()
  pago.fechaAnulacion = ahoraISO()
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
    const unidadesDeLaCopropiedad = new Set(
      bd.unidades.filter((u) => u.copropiedadId === parametros.copropiedadId).map((u) => u.id),
    )
    const yaExiste = bd.cuotas.some(
      (cuota) =>
        cuota.periodo === parametros.periodo &&
        cuota.tipo === 'ordinaria' &&
        unidadesDeLaCopropiedad.has(cuota.unidadId),
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
    // RN-75: nace debiendo todo su valor.
    saldo: linea.valor,
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
    /** RN-111 — En una zona compartida, cuantas personas van. */
    personas?: number
    /** RN-124 — Marcó que acepta las condiciones de la zona. */
    aceptaCondiciones?: boolean
    /** RN-126 — Los nombres de sus invitados. */
    invitados?: string[]
  },
): Promise<Resultado<Reserva>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('La zona comun no existe.')
  const franja = franjasDeZona(zona, parametros.fecha).find((f) => f.inicio === parametros.horaInicio)
  if (!franja) throw new ErrorDeNegocio('Ese turno no existe ese día en esta zona.')
  // Las reglas de la reserva se revisan otra vez aquí, con la misma función que
  // usa la pantalla: zona activa y abierta ese día (RN-107, RN-108, RN-114),
  // mora (RN-08), turno libre o con cupo (RN-09, RN-111, RN-113), anticipación
  // (RN-10) y cupo mensual. La pantalla avisa antes; esto es lo que no se salta
  // nadie, y lo que hereda un backend real (ADR-0003).
  const validacion = validarReserva({
    zona,
    fecha: parametros.fecha,
    horaInicio: parametros.horaInicio,
    unidadId: parametros.unidadId,
    cuotasDeLaUnidad: cuotasDe(bd, parametros.unidadId),
    reservas: bd.reservas,
    personas: parametros.personas ?? 1,
  })
  if (!validacion.valido) throw new ErrorDeNegocio(validacion.motivo ?? 'No se puede reservar ese turno.')
  // RN-124 — Si la zona tiene condiciones, se aceptan antes de reservar.
  const condiciones = condicionesDeLaZona(zona, bd.conceptosSancion)
  if (condiciones && !parametros.aceptaCondiciones) {
    throw new ErrorDeNegocio('Para reservar esta zona hay que aceptar sus condiciones.')
  }
  const invitados = parametros.invitados ?? []
  const motivoInvitados = motivoInvitadosInvalido(invitados, parametros.personas ?? 1)
  if (motivoInvitados) throw new ErrorDeNegocio(motivoInvitados)

  const reserva: Reserva = {
    id: nuevoId('rsv'),
    zonaId: parametros.zonaId,
    unidadId: parametros.unidadId,
    personaId: parametros.personaId,
    fecha: parametros.fecha,
    horaInicio: parametros.horaInicio,
    // El fin sale del turno de la zona, no de lo que diga quien llama.
    horaFin: franja.fin,
    // Si la zona no requiere aprobacion, la reserva nace confirmada.
    estado: zona.requiereAprobacion ? 'solicitada' : 'confirmada',
    creadaEn: ahoraISO(),
    personas: parametros.personas ?? 1,
    // RN-118 — Lo que cuesta se fija al reservar.
    ...valoresDeLaReserva(zona),
    ...(condiciones ? { condicionesAceptadas: { aceptadasEn: ahoraISO(), texto: condiciones } } : {}),
    ...(invitados.length ? { invitados } : {}),
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
  const zona = bd.zonasComunes.find((z) => z.id === reserva.zonaId)
  // RN-128 — Solo activa, sin cerrar y antes de su límite. Lo revisa el
  // repositorio, no solo el botón: así nadie esquiva el cobro ni el cierre.
  if (!sePuedeCancelar(reserva, zona)) {
    throw new ErrorDeNegocio(
      reserva.cierre || !reservaOcupaFranja(reserva)
        ? 'Esa reserva ya no se puede cancelar.'
        : 'Ya pasó el límite para cancelar esta reserva.',
    )
  }
  // RN-112 — Si cancela dentro del plazo con multa, queda anotado; no se multa aqui.
  const conceptos = zona ? conceptosDe(bd, zona.copropiedadId) : []
  if (multaAlCancelar(reserva, zona, conceptos)) reserva.canceladaFueraDePlazo = true
  reserva.estado = 'cancelada'
  reserva.canceladaEn = ahoraISO()
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
  // RN-123 — Al residente le llega la respuesta.
  const zona = bd.zonasComunes.find((z) => z.id === reserva.zonaId)
  if (zona) {
    const copropiedad = bd.copropiedades.find((c) => c.id === zona.copropiedadId)?.nombre ?? 'La copropiedad'
    avisarAPersona(bd, {
      copropiedadId: zona.copropiedadId,
      personaId: reserva.personaId,
      texto: textoReservaDecidida(reserva, zona, decision, reserva.motivoRechazo, copropiedad),
      motivo: 'reserva_decidida',
      reservaId: reserva.id,
    })
  }
  return persistir(bd, reserva)
}

/** RN-126 — Quien reservó cambia la lista de invitados, hasta que empiece el turno. */
export async function editarInvitados(
  bdActual: BaseDatos,
  parametros: { reservaId: string; invitados: string[] },
): Promise<Resultado<Reserva>> {
  await esperar()
  const bd = clonar(bdActual)
  const reserva = bd.reservas.find((r) => r.id === parametros.reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  if (!puedeEditarInvitados(reserva)) throw new ErrorDeNegocio('La lista se cambia hasta que empiece el turno.')
  const motivo = motivoInvitadosInvalido(parametros.invitados, reserva.personas ?? 1)
  if (motivo) throw new ErrorDeNegocio(motivo)
  reserva.invitados = parametros.invitados.length ? parametros.invitados : undefined
  return persistir(bd, reserva)
}

// ---------------------------------------------------------------------------
// La plata de la reserva — RN-119 a RN-121
// ---------------------------------------------------------------------------

/** RN-120 — La administración recibió el depósito. */
export async function registrarDepositoRecibido(
  bdActual: BaseDatos,
  reservaId: string,
): Promise<Resultado<Reserva>> {
  await esperar()
  const bd = clonar(bdActual)
  const reserva = bd.reservas.find((r) => r.id === reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  if (!reserva.deposito) throw new ErrorDeNegocio('Esa reserva no pide depósito.')
  if (reserva.depositoRecibidoEn) throw new ErrorDeNegocio('El depósito ya estaba recibido.')
  if (reserva.estado !== 'confirmada') throw new ErrorDeNegocio('Solo se recibe el depósito de una reserva confirmada.')
  reserva.depositoRecibidoEn = ahoraISO()
  return persistir(bd, reserva)
}

/**
 * RN-119 a RN-121 — Cierra la reserva después del turno: genera el cobro por
 * uso, devuelve o retiene el depósito y, si se pide, abre el proceso.
 */
export async function cerrarReserva(
  bdActual: BaseDatos,
  parametros: {
    reservaId: string
    resultado: 'usada' | 'no_se_presento'
    estadoZona?: 'bien' | 'con_novedades'
    observaciones?: string
    foto?: string
    retener?: number
    motivoRetencion?: string
    registradoPor: string
    abrirProceso?: boolean
  },
): Promise<Resultado<{ reserva: Reserva; cuota?: Cuota; sancion?: Sancion }>> {
  await esperar()
  const bd = clonar(bdActual)
  const reserva = bd.reservas.find((r) => r.id === parametros.reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  const zona = bd.zonasComunes.find((z) => z.id === reserva.zonaId)
  if (!zona) throw new ErrorDeNegocio('La zona de esa reserva no existe.')
  const invalido = motivoCierreReservaInvalido(reserva, parametros)
  if (invalido) throw new ErrorDeNegocio(invalido)

  const ahora = ahoraISO()
  const noSePresento = parametros.resultado === 'no_se_presento'

  // RN-119 — El cobro por uso, en el estado de cuenta.
  let cuota: Cuota | undefined
  if (reserva.valorUso) {
    const hoy = hoyISO()
    const origen = zona.respaldoCobro?.origen
    cuota = {
      id: nuevoId('cuo'),
      unidadId: reserva.unidadId,
      periodo: hoy.slice(0, 7),
      tipo: 'uso_zona',
      concepto: `Uso de ${zona.nombre} · ${fechaCorta(reserva.fecha)}`,
      valor: reserva.valorUso,
      saldo: reserva.valorUso,
      fechaVencimiento: sumarDias(hoy, DIAS_PARA_PAGAR_USO),
      estado: 'pendiente',
      ...(origen === 'reglamento' || origen === 'asamblea' ? { origen } : {}),
      ...(zona.respaldoCobro ? { referencia: zona.respaldoCobro.referencia } : {}),
      justificacion: justificacionCobroUso(reserva, zona, noSePresento),
    }
    bd.cuotas.push(cuota)
  }

  // RN-120 — El depósito: completo si no se usó o quedó bien; si no, lo que se retiene.
  const recibido = reserva.depositoRecibidoEn ? (reserva.deposito ?? 0) : 0
  const retenido = noSePresento ? 0 : Math.min(parametros.retener ?? 0, recibido)
  reserva.cierre = {
    resultado: parametros.resultado,
    registradoEn: ahora,
    registradoPor: parametros.registradoPor,
    ...(noSePresento
      ? {}
      : {
          estadoZona: parametros.estadoZona,
          ...(parametros.observaciones?.trim() ? { observaciones: parametros.observaciones.trim() } : {}),
          ...(parametros.foto ? { foto: { imagen: parametros.foto, adjuntadoEn: ahora } } : {}),
        }),
    ...(cuota ? { cuotaUsoId: cuota.id } : {}),
    ...(recibido
      ? {
          depositoDevuelto: recibido - retenido,
          ...(retenido ? { depositoRetenido: retenido, motivoRetencion: parametros.motivoRetencion!.trim() } : {}),
        }
      : {}),
  }

  if (!parametros.abrirProceso) return persistir(bd, { reserva, cuota })

  // RN-121 — El proceso por la multa, con el mismo camino que cualquier sanción.
  const conProceso = await abrirProcesoPorReservaEn(bd, reserva.id, parametros.registradoPor)
  return persistir(conProceso.bd, {
    reserva: conProceso.bd.reservas.find((r) => r.id === reserva.id)!,
    cuota,
    sancion: conProceso.datos,
  })
}

/** RN-121 — Abre el proceso por la multa de una reserva (no se presentó o canceló fuera de plazo). */
export async function abrirProcesoPorReserva(
  bdActual: BaseDatos,
  parametros: { reservaId: string; impuestaPor: string },
): Promise<Resultado<Sancion>> {
  return abrirProcesoPorReservaEn(clonar(bdActual), parametros.reservaId, parametros.impuestaPor)
}

async function abrirProcesoPorReservaEn(
  bd: BaseDatos,
  reservaId: string,
  impuestaPor: string,
): Promise<Resultado<Sancion>> {
  const reserva = bd.reservas.find((r) => r.id === reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  const zona = bd.zonasComunes.find((z) => z.id === reserva.zonaId)
  if (!zona || !puedeAbrirProcesoPorReserva(reserva, zona)) {
    throw new ErrorDeNegocio('Esa reserva no tiene un proceso por abrir.')
  }
  const resultado = await imponerSancion(bd, {
    copropiedadId: zona.copropiedadId,
    unidadId: reserva.unidadId,
    conceptoId: zona.multaNoCancelar!.conceptoId,
    hechos: hechosDeLaReserva(reserva, zona),
    impuestaPor,
  })
  const enLaNueva = resultado.bd.reservas.find((r) => r.id === reservaId)!
  enLaNueva.sancionId = resultado.datos.id
  return persistir(resultado.bd, resultado.datos)
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

/**
 * Cuanto del almacenamiento del demo va ocupado, para avisar antes de que se
 * llene (ADR-0009). Solo tiene sentido mientras los datos vivan en el
 * navegador: con backend, las fotos van a un archivo y esto desaparece.
 */
export function ocupacionDelDemo(bd: BaseDatos): { porcentaje: number; usadoKB: number; limiteKB: number } {
  const o = ocupacion(bd)
  return { porcentaje: o.porcentaje, usadoKB: Math.round(o.usado / 1024), limiteKB: Math.round(o.limite / 1024) }
}

// ---------------------------------------------------------------------------
// Proyectos — CU-A-28 · RN-100, RN-101
// ---------------------------------------------------------------------------

/** CU-A-28 — El administrador registra un proyecto. Nace planeado, sin avances. */
export async function crearProyecto(
  bdActual: BaseDatos,
  parametros: {
    copropiedadId: string
    nombre: string
    descripcion: string
    responsable?: string
    fechaInicio?: FechaISO
    fechaFinPrevista?: FechaISO
    presupuesto?: number
    creadoPor: string
  },
): Promise<Resultado<Proyecto>> {
  await esperar()
  const bd = clonar(bdActual)
  if (parametros.nombre.trim().length < 3) throw new ErrorDeNegocio('Ponle nombre al proyecto.')
  if (parametros.descripcion.trim().length < 10) {
    throw new ErrorDeNegocio('Describe el proyecto: es lo primero que lee el propietario.')
  }
  if (
    parametros.fechaInicio &&
    parametros.fechaFinPrevista &&
    parametros.fechaFinPrevista < parametros.fechaInicio
  ) {
    throw new ErrorDeNegocio('La fecha prevista de fin no puede ser anterior al inicio.')
  }
  if (parametros.presupuesto !== undefined && parametros.presupuesto < 0) {
    throw new ErrorDeNegocio('El presupuesto no puede ser negativo.')
  }
  const proyecto: Proyecto = {
    id: nuevoId('pro'),
    copropiedadId: parametros.copropiedadId,
    nombre: parametros.nombre.trim(),
    descripcion: parametros.descripcion.trim(),
    responsable: parametros.responsable?.trim() || undefined,
    fechaInicio: parametros.fechaInicio || undefined,
    fechaFinPrevista: parametros.fechaFinPrevista || undefined,
    presupuesto: parametros.presupuesto,
    avances: [],
    creadoPor: parametros.creadoPor,
    creadoEn: ahoraISO(),
  }
  bd.proyectos.unshift(proyecto)
  return persistir(bd, proyecto)
}

/**
 * CU-A-28 — Registrar un avance, y **contarlo** (RN-101).
 *
 * Tres cosas pasan de una vez, y por eso viven en una sola operacion: el
 * avance queda en el proyecto (RN-100: no se edita, se corrige con otro); se
 * publica un comunicado en la cartelera, enlazado al tablero; y sale un
 * mensaje al celular de cada propietario que lo tenga. Los que no tengan
 * celular no reciben mensaje, y se dice cuantos fueron.
 */
export async function registrarAvanceProyecto(
  bdActual: BaseDatos,
  parametros: {
    proyectoId: string
    porcentaje: number
    titulo: string
    detalle: string
    foto?: string
    registradoPor: string
  },
): Promise<Resultado<{ proyecto: Proyecto; avance: AvanceProyecto; avisados: number; sinCelular: number }>> {
  await esperar()
  const bd = clonar(bdActual)
  const proyecto = bd.proyectos.find((p) => p.id === parametros.proyectoId)
  if (!proyecto) throw new ErrorDeNegocio('Ese proyecto no existe.')
  const motivo = motivoAvanceInvalido(proyecto, parametros)
  if (motivo) throw new ErrorDeNegocio(motivo)

  const ahora = ahoraISO()
  const copropiedad = bd.copropiedades.find((c) => c.id === proyecto.copropiedadId)
  const nombreCopropiedad = copropiedad?.nombre ?? 'La copropiedad'

  // El comunicado: mismo canal que todo lo demas que dice la administracion.
  const comunicado: Comunicado = {
    id: nuevoId('com'),
    copropiedadId: proyecto.copropiedadId,
    titulo: `${proyecto.nombre}: ${parametros.porcentaje} %`,
    cuerpo: `${parametros.titulo.trim()}${parametros.detalle.trim() ? `. ${parametros.detalle.trim()}` : '.'}`,
    categoria: 'proyecto',
    fijado: false,
    fechaPublicacion: ahora,
    autor: 'Administración',
    leidoPor: [],
    proyectoId: proyecto.id,
  }
  bd.comunicados.unshift(comunicado)

  const avance: AvanceProyecto = {
    id: nuevoId('avn'),
    fecha: ahora,
    porcentaje: parametros.porcentaje,
    titulo: parametros.titulo.trim(),
    detalle: parametros.detalle.trim(),
    foto: parametros.foto ? { imagen: parametros.foto, adjuntadoEn: ahora } : undefined,
    registradoPor: parametros.registradoPor,
    comunicadoId: comunicado.id,
  }
  proyecto.avances.push(avance)

  // El mensaje, a cada propietario vigente con celular. Un propietario con
  // varias unidades recibe uno solo: se avisa a personas, no a unidades.
  const unidades = new Set(bd.unidades.filter((u) => u.copropiedadId === proyecto.copropiedadId).map((u) => u.id))
  const propietarios = new Set(
    bd.residencias
      .filter((r) => unidades.has(r.unidadId) && r.rol === 'propietario' && residenciaVigente(r))
      .map((r) => r.personaId),
  )
  const texto = textoAvanceProyecto(proyecto, avance, nombreCopropiedad)
  let avisados = 0
  let sinCelular = 0
  for (const personaId of propietarios) {
    const avisado = avisarAPersona(bd, {
      copropiedadId: proyecto.copropiedadId,
      personaId,
      texto,
      motivo: 'avance_proyecto',
      proyectoId: proyecto.id,
      ahora,
    })
    if (avisado) avisados += 1
    else sinCelular += 1
  }

  return persistir(bd, { proyecto, avance, avisados, sinCelular })
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

/**
 * CU-R-11 — El residente confirma que recibio el paquete (RN-103).
 *
 * Si porteria ya lo habia entregado, queda confirmado. Si no, la confirmacion
 * **es** la entrega: el residente lo tiene, y `recibidoPor` queda con su
 * nombre. La correspondencia entregada no se edita (RN-25); esto no la edita,
 * la cierra.
 */
export async function confirmarRecepcionCorrespondencia(
  bdActual: BaseDatos,
  parametros: { correspondenciaId: string; personaId: string },
): Promise<Resultado<Correspondencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.correspondencia.find((c) => c.id === parametros.correspondenciaId)
  if (!registro) throw new ErrorDeNegocio('El registro no existe.')
  if (registro.confirmadoEn) throw new ErrorDeNegocio('Ya confirmaste que lo recibiste.')
  if (!puedeConfirmarRecepcion(registro, bd.residencias, parametros.personaId)) {
    throw new ErrorDeNegocio('Solo un residente de esa unidad puede confirmar que lo recibio.')
  }
  const ahora = ahoraISO()
  const persona = bd.personas.find((p) => p.id === parametros.personaId)
  if (registro.estado !== 'entregada') {
    registro.estado = 'entregada'
    registro.recibidoPor = persona ? `${persona.nombres} ${persona.apellidos}` : 'El residente'
    registro.fechaEntrega = ahora
  }
  registro.confirmadoPor = parametros.personaId
  registro.confirmadoEn = ahora
  return persistir(bd, registro)
}

// ---------------------------------------------------------------------------
// Zonas comunes: sus fotos — CU-A-10 (parcial) · RN-104
// ---------------------------------------------------------------------------

export async function agregarFotoZona(
  bdActual: BaseDatos,
  parametros: { zonaId: string; imagen: string },
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  if (!parametros.imagen) throw new ErrorDeNegocio('Falta la foto.')
  if (!puedeAgregarFotoZona(zona)) {
    throw new ErrorDeNegocio(`Una zona lleva hasta ${MAXIMO_FOTOS_ZONA} fotos. Quita una para agregar otra.`)
  }
  zona.fotos = [...(zona.fotos ?? []), { imagen: parametros.imagen, adjuntadoEn: ahoraISO() }]
  return persistir(bd, zona)
}

/** CU-A-10 (parcial) — Las especificaciones generales de la zona (RN-104). */
export async function editarEspecificacionesZona(
  bdActual: BaseDatos,
  parametros: { zonaId: string; especificaciones: string },
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  const texto = parametros.especificaciones.trim()
  if (texto.length > MAXIMO_ESPECIFICACIONES) {
    throw new ErrorDeNegocio(`Las especificaciones caben en ${MAXIMO_ESPECIFICACIONES} caracteres: lo que el residente alcanza a leer antes de reservar.`)
  }
  zona.especificaciones = texto || undefined
  return persistir(bd, zona)
}

/** Las fotos son configuracion: quitar una no borra ninguna historia (RN-104). */
export async function quitarFotoZona(
  bdActual: BaseDatos,
  parametros: { zonaId: string; adjuntadoEn: string },
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  const antes = zona.fotos?.length ?? 0
  zona.fotos = (zona.fotos ?? []).filter((f) => f.adjuntadoEn !== parametros.adjuntadoEn)
  if (zona.fotos.length === antes) throw new ErrorDeNegocio('Esa foto ya no está.')
  return persistir(bd, zona)
}

// ---------------------------------------------------------------------------
// Zonas comunes: crearlas, cambiarlas, desactivarlas — CU-A-10 · RN-105 a RN-107
// ---------------------------------------------------------------------------

/**
 * Lo que se guarda: sin espacios sobrantes, y sin cobro, depósito ni respaldo
 * cuando no aplican (RN-109). Las claves van siempre, aunque vacías, para que
 * editar una zona también pueda quitarle el cobro o la multa.
 */
function datosZonaLimpios(datos: DatosZona): DatosZona {
  const valorUso = datos.valorUso || undefined
  const deposito = datos.deposito || undefined
  const respaldo = datos.respaldoCobro
  return {
    ...datos,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    valorUso,
    deposito,
    respaldoCobro:
      (valorUso || deposito) && respaldo
        ? {
            origen: respaldo.origen,
            referencia: respaldo.referencia.trim(),
            ...(respaldo.origen === 'otro' ? { documento: respaldo.documento?.trim() } : {}),
          }
        : undefined,
    multaNoCancelar: datos.multaNoCancelar,
  }
}

function conceptosDe(bd: BaseDatos, copropiedadId: string) {
  return bd.conceptosSancion.filter((c) => c.copropiedadId === copropiedadId)
}

/** CU-A-10 — Una zona nueva, que nace activa y recibe reservas de una vez (RN-105). */
export async function crearZona(
  bdActual: BaseDatos,
  parametros: { copropiedadId: string; datos: DatosZona },
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zonas = bd.zonasComunes.filter((z) => z.copropiedadId === parametros.copropiedadId)
  const motivo = motivoZonaInvalida(parametros.datos, zonas, undefined, conceptosDe(bd, parametros.copropiedadId))
  if (motivo) throw new ErrorDeNegocio(motivo)
  const zona: ZonaComun = {
    id: nuevoId('zon'),
    copropiedadId: parametros.copropiedadId,
    icono: 'zona',
    ...datosZonaLimpios(parametros.datos),
  }
  bd.zonasComunes.push(zona)
  return persistir(bd, zona)
}

/**
 * CU-A-10 — Cambia las reglas de una zona. RN-106: no recorre las reservas;
 * las ya hechas se respetan tal como se pidieron.
 */
export async function editarZona(
  bdActual: BaseDatos,
  parametros: { zonaId: string; datos: DatosZona },
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  const zonas = bd.zonasComunes.filter((z) => z.copropiedadId === zona.copropiedadId)
  const motivo = motivoZonaInvalida(parametros.datos, zonas, zona.id, conceptosDe(bd, zona.copropiedadId))
  if (motivo) throw new ErrorDeNegocio(motivo)
  Object.assign(zona, datosZonaLimpios(parametros.datos))
  return persistir(bd, zona)
}

/**
 * RN-107 — Desactiva la zona: cancela sus reservas de hoy en adelante y a cada
 * persona que reservo le deja el mensaje con la justificacion. La zona no se
 * borra; su historia sigue.
 */
export async function desactivarZona(
  bdActual: BaseDatos,
  parametros: { zonaId: string; motivo: string },
): Promise<Resultado<{ zona: ZonaComun } & ResumenCancelacion>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  if (!zonaActiva(zona)) throw new ErrorDeNegocio('Esa zona ya está desactivada.')
  const motivo = parametros.motivo.trim()
  if (motivo.length < MINIMO_MOTIVO_DESACTIVACION) {
    throw new ErrorDeNegocio('Escribe el motivo: es lo que le llega a quien tenía reserva.')
  }

  const ahora = ahoraISO()
  const aviso = cancelarConAviso(bd, zona, reservasQueCancelaDesactivar(zona.id, bd.reservas), motivo, ahora)
  zona.activa = false
  zona.desactivadaEn = ahora
  zona.motivoDesactivacion = motivo
  return persistir(bd, { zona, ...aviso })
}

/** Lo que cuenta la consola despues de cancelar con aviso (RN-107, RN-108). */
export interface ResumenCancelacion {
  canceladas: number
  avisados: number
  sinCelular: number
}

/**
 * RN-107 / RN-108 — Cancela las reservas y le deja a cada persona que reservo
 * el mensaje con la justificacion. Un solo lugar, para que el cierre y la
 * desactivacion digan lo mismo de la misma manera.
 */
function cancelarConAviso(
  bd: BaseDatos,
  zona: ZonaComun,
  afectadas: Reserva[],
  motivo: string,
  ahora: string,
): ResumenCancelacion {
  const nombreCopropiedad =
    bd.copropiedades.find((c) => c.id === zona.copropiedadId)?.nombre ?? 'La copropiedad'
  let avisados = 0
  let sinCelular = 0
  for (const reserva of afectadas) {
    reserva.estado = 'cancelada'
    reserva.motivoCancelacion = motivo
    reserva.canceladaEn = ahora
    const avisado = avisarAPersona(bd, {
      copropiedadId: zona.copropiedadId,
      personaId: reserva.personaId,
      texto: textoReservaCancelada(reserva, zona, motivo, nombreCopropiedad),
      motivo: 'reserva_cancelada',
      reservaId: reserva.id,
      ahora,
    })
    if (avisado) avisados += 1
    else sinCelular += 1
  }
  return { canceladas: afectadas.length, avisados, sinCelular }
}

/** RN-115 — La administración cancela una reserva, con motivo y mensaje. */
export async function cancelarReservaPorAdministracion(
  bdActual: BaseDatos,
  parametros: { reservaId: string; motivo: string },
): Promise<Resultado<{ reserva: Reserva } & ResumenCancelacion>> {
  await esperar()
  const bd = clonar(bdActual)
  const reserva = bd.reservas.find((r) => r.id === parametros.reservaId)
  if (!reserva) throw new ErrorDeNegocio('La reserva no existe.')
  if (!puedeCancelarLaAdministracion(reserva)) {
    throw new ErrorDeNegocio('Solo se cancela una reserva confirmada de hoy en adelante.')
  }
  const motivo = parametros.motivo.trim()
  if (motivo.length < MINIMO_MOTIVO_DESACTIVACION) {
    throw new ErrorDeNegocio('Escribe el motivo: es lo que le llega a quien reservó.')
  }
  const zona = bd.zonasComunes.find((z) => z.id === reserva.zonaId)
  if (!zona) throw new ErrorDeNegocio('La zona de esa reserva no existe.')
  const aviso = cancelarConAviso(bd, zona, [reserva], motivo, ahoraISO())
  return persistir(bd, { reserva, ...aviso })
}

/**
 * RN-108 — Cierra la zona por mantenimiento entre dos fechas: cancela con
 * aviso las reservas que caen dentro y la zona vuelve sola al terminar.
 */
export async function cerrarZonaPorMantenimiento(
  bdActual: BaseDatos,
  parametros: {
    zonaId: string
    desde: string
    hasta: string
    motivo: string
    /** RN-117 — Avisar a toda la copropiedad: comunicado y mensaje a cada persona. */
    avisarATodos?: boolean
  },
): Promise<Resultado<{ zona: ZonaComun; masivo?: { avisados: number; sinCelular: number } } & ResumenCancelacion>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  const invalido = motivoCierreInvalido(zona, parametros)
  if (invalido) throw new ErrorDeNegocio(invalido)

  const ahora = ahoraISO()
  const cierre: CierreZona = {
    id: nuevoId('cie'),
    desde: parametros.desde,
    hasta: parametros.hasta,
    motivo: parametros.motivo.trim(),
    registradoEn: ahora,
  }
  zona.cierres = [...(zona.cierres ?? []), cierre]
  const afectadas = reservasQueCancelaCierre(zona.id, bd.reservas, cierre.desde, cierre.hasta)
  const aviso = cancelarConAviso(bd, zona, afectadas, motivoDeCierre(cierre), ahora)
  const masivo = parametros.avisarATodos
    ? avisarCierreATodos(bd, zona, cierre, new Set(afectadas.map((r) => r.personaId)), ahora)
    : undefined
  return persistir(bd, { zona, ...aviso, masivo })
}

/**
 * RN-117 — El aviso masivo del cierre: un comunicado de mantenimiento en la
 * cartelera y un mensaje a cada persona con residencia vigente, salvo a quien
 * ya se le aviso la cancelacion de su reserva.
 */
function avisarCierreATodos(
  bd: BaseDatos,
  zona: ZonaComun,
  cierre: CierreZona,
  yaAvisados: Set<string>,
  ahora: string,
): { avisados: number; sinCelular: number } {
  const nombreCopropiedad =
    bd.copropiedades.find((c) => c.id === zona.copropiedadId)?.nombre ?? 'La copropiedad'
  const texto = textoCierreZona(zona, cierre, nombreCopropiedad)
  const comunicado: Comunicado = {
    id: nuevoId('com'),
    copropiedadId: zona.copropiedadId,
    titulo: `${zona.nombre}: cerrada por mantenimiento`,
    cuerpo: texto.slice(texto.indexOf(':') + 2),
    categoria: 'mantenimiento',
    fijado: false,
    fechaPublicacion: ahora,
    vigenteHasta: cierre.hasta,
    autor: 'Administración',
    leidoPor: [],
  }
  bd.comunicados.unshift(comunicado)
  cierre.comunicadoId = comunicado.id

  const unidades = new Set(bd.unidades.filter((u) => u.copropiedadId === zona.copropiedadId).map((u) => u.id))
  const personas = new Set(
    bd.residencias.filter((r) => unidades.has(r.unidadId) && residenciaVigente(r)).map((r) => r.personaId),
  )
  let avisados = 0
  let sinCelular = 0
  for (const personaId of personas) {
    if (yaAvisados.has(personaId)) continue
    const avisado = avisarAPersona(bd, {
      copropiedadId: zona.copropiedadId,
      personaId,
      texto,
      motivo: 'cierre_zona',
      zonaId: zona.id,
      ahora,
    })
    if (avisado) avisados += 1
    else sinCelular += 1
  }
  return { avisados, sinCelular }
}

/**
 * RN-108 — Termina un cierre antes de tiempo: la zona se reserva otra vez desde
 * ya. El cierre no se borra; queda levantado, en la historia de la zona.
 */
export async function levantarCierreZona(
  bdActual: BaseDatos,
  parametros: { zonaId: string; cierreId: string },
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === parametros.zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  const cierre = zona.cierres?.find((c) => c.id === parametros.cierreId)
  if (!cierre || cierre.levantadoEn) throw new ErrorDeNegocio('Ese cierre ya no está vigente.')
  cierre.levantadoEn = ahoraISO()
  return persistir(bd, zona)
}

/** RN-107 — La zona vuelve a recibir reservas; las canceladas no reviven. */
export async function reactivarZona(
  bdActual: BaseDatos,
  zonaId: string,
): Promise<Resultado<ZonaComun>> {
  await esperar()
  const bd = clonar(bdActual)
  const zona = bd.zonasComunes.find((z) => z.id === zonaId)
  if (!zona) throw new ErrorDeNegocio('Esa zona no existe.')
  zona.activa = true
  delete zona.desactivadaEn
  delete zona.motivoDesactivacion
  return persistir(bd, zona)
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
  parametros: { visitanteId: string; personaId: string },
): Promise<Resultado<Visitante>> {
  await esperar()
  const bd = clonar(bdActual)
  const visitante = bd.visitantes.find((v) => v.id === parametros.visitanteId)
  if (!visitante) throw new ErrorDeNegocio('El visitante no existe.')
  // RN-65 — Revoca quien lo autorizó o, subiendo en la cadena, el propietario o
  // la administración (Mary, 2026-10-02).
  const unidad = bd.unidades.find((u) => u.id === visitante.unidadId)
  const rol = unidad && esAdministracion(bd, parametros.personaId, unidad.copropiedadId) ? 'admin' : 'residente'
  if (!puedeInhabilitar({ ...responsablesDeVisita(bd, visitante), personaId: parametros.personaId, rol })) {
    throw new ErrorDeNegocio('A esta visita la revoca quien la autorizó, el propietario o la administración (RN-65).')
  }
  visitante.estado = 'revocado'
  return persistir(bd, visitante)
}

// ---------------------------------------------------------------------------
// CU-A-02 — Unidades y residentes
// ---------------------------------------------------------------------------

/**
 * Lo que deja quien sale de la unidad (RN-59, RN-61).
 *
 * - Sus registros **en curso** se anulan: solo él podía autorizarlos y ya no
 *   está. Vale para todos, y con el motivo del cambio de propietario si lo es.
 * - Si es **propietario**, sale con él su familia (Mary, 2026-10-02: al vender,
 *   la familia del dueño anterior no se queda); el arrendatario y las visitas
 *   que registró los hereda el siguiente propietario (RN-65).
 * - Si es **arrendatario**, salen con él su familia y los visitantes que
 *   registró: los temporales, los frecuentes y las visitas que aún no pasan
 *   (Mary, 2026-10-02). Los
 *   de un propietario, en cambio, los hereda el siguiente (RN-65).
 */
function cerrarLoQueDejo(bd: BaseDatos, residencia: Residencia, cerradoPor: string, motivo: MotivoCierreVinculo) {
  const ahora = ahoraISO()
  const ayer = sumarDias(hoyISO(), -1)
  for (const registro of bd.registros) {
    if (registro.unidadId === residencia.unidadId && registro.creadoPor === residencia.personaId && registroEnCurso(registro)) {
      registro.estado = 'anulado'
      registro.motivo =
        motivo === 'cambio_propietario'
          ? 'Cambio de propietario: quien hizo el registro ya no es propietario de la unidad.'
          : 'Quien hizo el registro ya no está en la unidad.'
      registro.decididoEn = ahora
      registro.decididoPor = cerradoPor
    }
  }
  // Las visitas que registró quien sale (el arrendatario, el familiar) se
  // revocan; las del propietario las hereda el siguiente (RN-65).
  const salen = new Set<string>(residencia.rol === 'propietario' ? [] : [residencia.personaId])
  if (residencia.rol === 'arrendatario' || residencia.rol === 'propietario') {
    const registrados = new Set(
      bd.registros.filter((r) => r.unidadId === residencia.unidadId && r.creadoPor === residencia.personaId).map((r) => r.id),
    )
    for (const vinculo of bd.residencias) {
      // Del propietario sale solo su familia (Mary, 2026-10-02); lo demás que
      // registró —el arrendatario, sus visitas— lo hereda el siguiente (RN-65).
      const saleConEl =
        residencia.rol === 'propietario' ? vinculo.rol === 'familiar' : vinculo.rol === 'autorizado' || vinculo.rol === 'familiar'
      if (saleConEl && vinculo.registroId && registrados.has(vinculo.registroId) && residenciaVigente(vinculo)) {
        vinculo.hasta = ayer
        vinculo.cierre = {
          motivo: 'otro',
          detalle: residencia.rol === 'propietario' ? 'Salió el propietario que lo registró.' : 'Salió el arrendatario que lo registró.',
          cerradoPor,
          cerradoEn: ahora,
        }
        salen.add(vinculo.personaId)
      }
    }
  }
  for (const visitante of bd.visitantes) {
    if (
      visitante.unidadId === residencia.unidadId &&
      salen.has(visitante.personaId) &&
      visitante.estado === 'activo' &&
      visitante.vigenciaHasta >= hoyISO()
    ) {
      visitante.estado = 'revocado'
    }
  }
}

/**
 * RN-68 — Cambiar la condición o la fecha de salida de un vínculo vigente, sin
 * repetir el trámite (Mary, 2026-10-02). Lo cambia el propio propietario, quien
 * responde por el vínculo (RN-65) o la administración. Si un arrendatario deja
 * a su visitante más de 7 días, el cambio espera al propietario (RN-60).
 */
export async function cambiarEstadia(
  bdActual: BaseDatos,
  parametros: { residenciaId: string; personaId: string; condicion: CondicionRegistro; hasta?: FechaISO },
): Promise<Resultado<Residencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const residencia = bd.residencias.find((r) => r.id === parametros.residenciaId)
  if (!residencia || !residenciaVigente(residencia) || residencia.cierre) throw new ErrorDeNegocio('Ese vínculo ya no está vigente.')
  const unidad = bd.unidades.find((u) => u.id === residencia.unidadId)
  const esAdmin = !!unidad && esAdministracion(bd, parametros.personaId, unidad.copropiedadId)
  const propio = residencia.personaId === parametros.personaId && residencia.rol === 'propietario'
  const { creadoPor, heredadoPor } = responsablesDelVinculo(bd, residencia)
  if (!propio && !puedeInhabilitar({ creadoPor, heredadoPor, personaId: parametros.personaId, rol: esAdmin ? 'admin' : 'residente' })) {
    throw new ErrorDeNegocio('Esto lo cambia quien registró a la persona, el propietario sobre sí mismo o la administración.')
  }
  if (!condicionesParaCambiar(residencia).includes(parametros.condicion)) {
    throw new ErrorDeNegocio(
      residencia.rol === 'autorizado'
        ? 'A un visitante temporal solo se le cambia la fecha de salida.'
        : 'Esa condición no aplica a esta persona (RN-68).',
    )
  }
  const hasta = parametros.condicion === 'temporal' ? parametros.hasta : undefined
  if (parametros.condicion === 'temporal' && (!hasta || hasta < hoyISO())) {
    throw new ErrorDeNegocio('Escoge una fecha de salida de hoy en adelante.')
  }
  const antes = condicionDeResidencia(residencia)
  if (antes === parametros.condicion && residencia.hasta === hasta) throw new ErrorDeNegocio('No hay nada que cambiar.')

  // RN-60 — El arrendatario que deja a su visitante más de una semana necesita
  // al propietario, igual que al registrarlo.
  const rolDeQuienCambia = bd.residencias.find(
    (r) => r.unidadId === residencia.unidadId && r.personaId === parametros.personaId && residenciaVigente(r),
  )?.rol
  const ahora = ahoraISO()
  if (
    !esAdmin &&
    requiereAprobacionPropietario(
      rolDeQuienCambia,
      {
        categoria: categoriaDeResidencia(residencia),
        condicion: parametros.condicion,
        vigenciaDesde: residencia.desde,
        vigenciaHasta: hasta,
      },
      aprobacionPropietarioActiva(bd.copropiedades.find((c) => c.id === unidad?.copropiedadId)),
    )
  ) {
    residencia.cambioPendiente = { condicion: parametros.condicion, hasta, pedidoPor: parametros.personaId, pedidoEn: ahora }
    const persona = bd.personas.find((p) => p.id === residencia.personaId)
    for (const dueno of bd.residencias.filter(
      (r) => r.unidadId === residencia.unidadId && r.rol === 'propietario' && residenciaVigente(r),
    )) {
      avisarAPersona(bd, {
        copropiedadId: unidad?.copropiedadId ?? '',
        personaId: dueno.personaId,
        motivo: 'estadia_por_aprobar',
        texto:
          `Idiky: tu arrendatario quiere alargar la estadía de ${persona?.nombres ?? 'su visitante'} hasta el ` +
          `${fechaCorta(hasta ?? '')}. Por ser más de una semana, necesita tu aprobación en la app.`,
        ahora,
      })
    }
    return persistir(bd, residencia)
  }
  aplicarCambio(residencia, parametros.condicion, hasta, parametros.personaId, ahora)
  return persistir(bd, residencia)
}

function aplicarCambio(
  residencia: Residencia,
  condicion: CondicionRegistro,
  hasta: FechaISO | undefined,
  por: string,
  ahora: string,
  aprobadoPor?: string,
) {
  residencia.cambios = [
    ...(residencia.cambios ?? []),
    { condicionAntes: condicionDeResidencia(residencia), condicion, hastaAntes: residencia.hasta, hasta, por, aprobadoPor, en: ahora },
  ]
  residencia.reside = marcaResidente({ categoria: categoriaDeResidencia(residencia), condicion })
  residencia.hasta = hasta
  delete residencia.cambioPendiente
}

/** RN-60 — El propietario aprueba, o no, el cambio que pidió su arrendatario. */
export async function decidirCambioComoPropietario(
  bdActual: BaseDatos,
  parametros: { residenciaId: string; personaId: string; aprobar: boolean; motivo?: string },
): Promise<Resultado<Residencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const residencia = bd.residencias.find((r) => r.id === parametros.residenciaId)
  const pendiente = residencia?.cambioPendiente
  if (!residencia || !pendiente) throw new ErrorDeNegocio('No hay un cambio esperando aprobación.')
  const esPropietario = bd.residencias.some(
    (r) => r.unidadId === residencia.unidadId && r.personaId === parametros.personaId && r.rol === 'propietario' && residenciaVigente(r),
  )
  if (!esPropietario) throw new ErrorDeNegocio('El cambio lo aprueba un propietario de la unidad.')
  const ahora = ahoraISO()
  if (parametros.aprobar) {
    aplicarCambio(residencia, pendiente.condicion, pendiente.hasta, pendiente.pedidoPor, ahora, parametros.personaId)
  } else {
    const motivo = (parametros.motivo ?? '').trim()
    if (motivo.length < 5) throw new ErrorDeNegocio('Escribe por qué no lo apruebas: el arrendatario lo va a leer.')
    residencia.cambioNoAprobado = { hasta: pendiente.hasta, motivo, por: parametros.personaId, en: ahora }
    delete residencia.cambioPendiente
  }
  const unidad = bd.unidades.find((u) => u.id === residencia.unidadId)
  const persona = bd.personas.find((p) => p.id === residencia.personaId)
  avisarAPersona(bd, {
    copropiedadId: unidad?.copropiedadId ?? '',
    personaId: pendiente.pedidoPor,
    motivo: 'estadia_decidida',
    texto: parametros.aprobar
      ? `Idiky: el propietario aprobó que ${persona?.nombres ?? 'tu visitante'} se quede hasta el ${fechaCorta(pendiente.hasta ?? '')}.`
      : `Idiky: el propietario no aprobó alargar la estadía de ${persona?.nombres ?? 'tu visitante'}: ${(parametros.motivo ?? '').trim()}`,
    ahora,
  })
  return persistir(bd, residencia)
}

/** Cierra el vinculo de un residente sin borrar el historico (trazabilidad, O3). */
export async function desvincularResidente(
  bdActual: BaseDatos,
  parametros: {
    residenciaId: string
    personaId: string
    /** «Cambio de propietario» solo aplica a un propietario. */
    motivo?: MotivoCierreVinculo
    detalle?: string
  },
): Promise<Resultado<Residencia>> {
  await esperar()
  const bd = clonar(bdActual)
  const residencia = bd.residencias.find((r) => r.id === parametros.residenciaId)
  if (!residencia) throw new ErrorDeNegocio('El vinculo no existe.')
  // RN-65 — Inhabilita quien registró, o la administración; nadie a sí mismo.
  // Se revisa aquí y no solo en la pantalla, igual que RN-60 al registrar.
  const unidad = bd.unidades.find((u) => u.id === residencia.unidadId)
  const rol = unidad && esAdministracion(bd, parametros.personaId, unidad.copropiedadId) ? 'admin' : 'residente'
  if (residencia.personaId === parametros.personaId) {
    throw new ErrorDeNegocio('Nadie se inhabilita a sí mismo: la unidad quedaría sin quien responda por ella.')
  }
  const { creadoPor, heredadoPor } = responsablesDelVinculo(bd, residencia)
  if (!puedeInhabilitar({ creadoPor, heredadoPor, personaId: parametros.personaId, rol })) {
    throw new ErrorDeNegocio('A esta persona la inhabilita quien la registró o la administración (RN-65).')
  }
  const motivo = parametros.motivo ?? 'otro'
  if (motivo === 'cambio_propietario' && residencia.rol !== 'propietario') {
    throw new ErrorDeNegocio('El cambio de propietario solo aplica a un propietario.')
  }
  residencia.cierre = {
    motivo,
    detalle: parametros.detalle?.trim() || undefined,
    cerradoPor: parametros.personaId,
    cerradoEn: ahoraISO(),
  }
  // `hasta` es el último día vigente (RN-62): quien se inhabilita hoy deja de
  // estar hoy mismo, así que su último día fue ayer.
  residencia.hasta = sumarDias(hoyISO(), -1)
  delete residencia.cambioPendiente
  cerrarLoQueDejo(bd, residencia, parametros.personaId, motivo)
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
    // Nace sin abonos: el saldo es el valor completo (RN-75).
    saldo: sancion.valor,
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
/**
 * RN-99 — Enlazar la grabacion de la sesion, para que el acta la cite.
 *
 * Se guarda como se guarda el enlace de la transmision: es una direccion en
 * la herramienta de un tercero, no un archivo de Idiky (ADR-0007).
 */
export async function registrarGrabacionAsamblea(
  bdActual: BaseDatos,
  parametros: { asambleaId: string; enlace: string },
): Promise<Resultado<Asamblea>> {
  await esperar()
  const bd = clonar(bdActual)
  const asamblea = bd.asambleas.find((a) => a.id === parametros.asambleaId)
  if (!asamblea) throw new ErrorDeNegocio('Esa asamblea no existe.')
  if (!admiteGrabacion(asamblea)) {
    throw new ErrorDeNegocio('La grabación se enlaza cuando la sesión ya empezó y hubo transmisión.')
  }
  const enlace = parametros.enlace.trim()
  if (!/^https?:\/\//i.test(enlace)) {
    throw new ErrorDeNegocio('El enlace de la grabación tiene que empezar por http:// o https://.')
  }
  asamblea.enlaceGrabacion = enlace
  return persistir(bd, asamblea)
}

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
// CU-A-20 — El acta · Ley 675 de 2001, articulo 47
//
// **Casi todo el contenido que exige la ley ya esta registrado.** El articulo 47
// pide que el acta indique si la reunion fue ordinaria o extraordinaria, la forma
// de la convocatoria, el orden del dia, el nombre y la calidad de los
// asistentes con su unidad y su coeficiente, y los votos emitidos en cada caso.
// Idiky tiene las cinco cosas, asi que el acta **no las copia: las lee**.
//
// Lo unico que se guarda aqui es lo que el sistema no puede saber —quien
// presidio, quien fue secretario, que se dijo y quien la reviso— mas el estado,
// que es lo unico que una persona podria cambiar despues.
// ---------------------------------------------------------------------------

export async function generarActa(
  bdActual: BaseDatos,
  parametros: { asambleaId: string },
): Promise<Resultado<Acta>> {
  await esperar()
  const bd = clonar(bdActual)

  const asamblea = bd.asambleas.find((a) => a.id === parametros.asambleaId)
  if (!asamblea) throw new ErrorDeNegocio('Esa asamblea no existe.')
  if (!puedeGenerarActa(asamblea)) {
    throw new ErrorDeNegocio(
      'El acta se levanta de una asamblea cerrada: antes de cerrar no hay de qué dar fe.',
    )
  }
  if (actaDeAsamblea(bd.actas, asamblea.id)) {
    throw new ErrorDeNegocio('Esa asamblea ya tiene acta. Para corregirla se emite una aclaratoria.')
  }

  const acta: Acta = {
    id: nuevoId('act'),
    asambleaId: asamblea.id,
    desarrollo: '',
    estado: 'borrador',
    // Vacia a proposito: la comision es opcional y **la designa la asamblea**,
    // no la app (RN-93). Nace sin ella y el administrador la registra si la hubo.
    verificadores: [],
    verificaciones: [],
    // Se copia al generarla, como los plazos del debido proceso (RN-69): si
    // manana cambia el reglamento, esta acta conserva el termino que tuvo.
    limiteVerificacion: limiteVerificacionActa(asamblea.fechaHora),
    creadaEn: ahoraISO(),
  }
  bd.actas.push(acta)
  return persistir(bd, acta)
}

/** RN-35 — Se edita **mientras es borrador**. Aprobada, no. */
export async function editarActa(
  bdActual: BaseDatos,
  parametros: {
    actaId: string
    presidenteId?: string
    secretarioId?: string
    desarrollo?: string
  },
): Promise<Resultado<Acta>> {
  await esperar()
  const bd = clonar(bdActual)
  const acta = bd.actas.find((a) => a.id === parametros.actaId)
  if (!acta) throw new ErrorDeNegocio('Esa acta no existe.')
  // La comprobacion vive aqui y no en un boton escondido (T-16): que un acta
  // aprobada no se edite es lo unico que la hace valer como prueba.
  if (actaCongelada(acta)) {
    throw new ErrorDeNegocio(
      'Un acta aprobada no se edita. Para corregirla se emite un acta aclaratoria.',
    )
  }

  // Se compara antes de asignar: **guardar sin cambiar nada no es editar**, y
  // si contara como edicion, un clic distraido en «Guardar borrador» tumbaria
  // las revisiones ya hechas (RN-93).
  const cambio =
    (parametros.presidenteId !== undefined && parametros.presidenteId !== acta.presidenteId) ||
    (parametros.secretarioId !== undefined && parametros.secretarioId !== acta.secretarioId) ||
    (parametros.desarrollo !== undefined && parametros.desarrollo !== acta.desarrollo)

  if (parametros.presidenteId !== undefined) acta.presidenteId = parametros.presidenteId
  if (parametros.secretarioId !== undefined) acta.secretarioId = parametros.secretarioId
  if (parametros.desarrollo !== undefined) acta.desarrollo = parametros.desarrollo
  if (cambio) acta.editadaEn = ahoraISO()
  return persistir(bd, acta)
}

/**
 * CU-A-20 — Registrar **quien revisa el acta**, si alguien la revisa (RN-93),
 * y **hasta cuando** (RN-95).
 *
 * Designar no es editar: cambiar quien revisa no cambia el texto revisado, asi
 * que **no tumba las revisiones ya hechas**. Quitar a alguien de la comision
 * tampoco borra lo que dejo escrito — su observacion sigue en el acta, que es
 * de lo que se trata (RN-61).
 *
 * El plazo lo fija el administrador, pero **dentro del termino legal**: la
 * comprobacion vive aqui y no solo en el `max` del campo de fecha (T-16).
 */
export async function designarComisionActa(
  bdActual: BaseDatos,
  parametros: { actaId: string; verificadores: string[]; limiteComision?: FechaISO },
): Promise<Resultado<Acta>> {
  await esperar()
  const bd = clonar(bdActual)
  const acta = bd.actas.find((a) => a.id === parametros.actaId)
  if (!acta) throw new ErrorDeNegocio('Esa acta no existe.')
  if (actaCongelada(acta)) {
    throw new ErrorDeNegocio('Esa acta ya está aprobada: la comisión ya cumplió su función.')
  }
  // Solo se valida el plazo que **cambia**: uno ya registrado que quedo en el
  // pasado no impide seguir marcando gente — impide, por diseno, que revisen.
  if (parametros.limiteComision !== undefined && parametros.limiteComision !== acta.limiteComision) {
    const motivo = motivoPlazoComisionInvalido(acta, parametros.limiteComision)
    if (motivo) throw new ErrorDeNegocio(motivo)
    acta.limiteComision = parametros.limiteComision
  }

  const asistieron = new Set(
    bd.asistencias.filter((a) => a.asambleaId === acta.asambleaId).map((a) => a.personaId),
  )
  for (const personaId of parametros.verificadores) {
    if (!asistieron.has(personaId)) {
      throw new ErrorDeNegocio('La comisión la integran quienes asistieron a la asamblea.')
    }
  }

  acta.verificadores = [...new Set(parametros.verificadores)]
  return persistir(bd, acta)
}

/**
 * CU-A-20 — Un miembro de la comision deja constancia de que reviso (RN-93).
 *
 * Se **reemplaza** la revision anterior de esa misma persona en vez de
 * acumularlas: lo que interesa es si esta conforme con el texto de hoy, y una
 * lista de revisiones sucesivas del mismo nombre no dice mas, dice menos.
 */
export async function verificarActa(
  bdActual: BaseDatos,
  parametros: { actaId: string; personaId: string; observacion?: string },
): Promise<Resultado<Acta>> {
  await esperar()
  const bd = clonar(bdActual)
  const acta = bd.actas.find((a) => a.id === parametros.actaId)
  if (!acta) throw new ErrorDeNegocio('Esa acta no existe.')
  if (actaCongelada(acta)) throw new ErrorDeNegocio('Esa acta ya estaba aprobada.')
  if (!acta.verificadores.includes(parametros.personaId)) {
    throw new ErrorDeNegocio('Esa persona no integra la comisión verificadora de esta acta.')
  }
  // RN-95 — Un plazo maximo que admite revisiones despues no es maximo. La
  // revision tardia no se registra; el acta dice quien no reviso a tiempo.
  if (comisionVencida(acta)) {
    throw new ErrorDeNegocio(
      `El plazo de la comisión venció el ${formatearFecha(acta.limiteComision!)}: el acta ya no espera esa revisión.`,
    )
  }

  acta.verificaciones = [
    ...acta.verificaciones.filter((v) => v.personaId !== parametros.personaId),
    {
      personaId: parametros.personaId,
      verificadaEn: ahoraISO(),
      observacion: parametros.observacion?.trim() || undefined,
    },
  ]
  return persistir(bd, acta)
}

/**
 * CU-A-20 — Aprobar el acta: se numera, se congela y queda a disposicion.
 *
 * Art. 47: la firman el presidente y el secretario, y el administrador debe
 * ponerla a disposicion de los residentes. Aqui «a disposicion» es literal —
 * desde ese momento el copropietario la ve desde su app.
 */
export async function aprobarActa(
  bdActual: BaseDatos,
  parametros: { actaId: string },
): Promise<Resultado<Acta>> {
  await esperar()
  const bd = clonar(bdActual)
  const acta = bd.actas.find((a) => a.id === parametros.actaId)
  if (!acta) throw new ErrorDeNegocio('Esa acta no existe.')
  if (actaCongelada(acta)) throw new ErrorDeNegocio('Esa acta ya estaba aprobada.')

  const falta = faltaEnActa(acta)
  if (falta.length > 0) {
    throw new ErrorDeNegocio(`Antes de aprobar falta ${falta.join(', ')}.`)
  }

  const asamblea = bd.asambleas.find((a) => a.id === acta.asambleaId)
  const consecutivo = bd.consecutivos.acta
  const hoy = hoyISO()
  const documento: Documento = {
    id: nuevoId('doc'),
    tipo: 'acta',
    numero: `ACTA-${hoy.slice(0, 4)}-${String(consecutivo).padStart(4, '0')}`,
    codigoVerificacion: nuevoCodigoVerificacion(),
    copropiedadId: asamblea?.copropiedadId ?? '',
    // El acta es de la asamblea, no de una unidad: no hay `unidadId` que poner.
    unidadId: '',
    asambleaId: acta.asambleaId,
    emitidoEn: hoy,
    estado: 'vigente',
  }
  bd.documentos.push(documento)
  bd.consecutivos.acta = consecutivo + 1

  acta.estado = 'aprobada'
  acta.documentoId = documento.id
  acta.aprobadaEn = ahoraISO()
  return persistir(bd, acta)
}

/**
 * CU-A-20 A2 — Corregir un acta aprobada: **con otra acta, no encima**.
 *
 * La original no se toca. Es la misma idea que la sancion archivada o el poder
 * revocado (RN-61): lo que ya produjo efectos se explica, no se borra.
 */
export async function crearActaAclaratoria(
  bdActual: BaseDatos,
  parametros: { actaId: string },
): Promise<Resultado<Acta>> {
  await esperar()
  const bd = clonar(bdActual)
  const original = bd.actas.find((a) => a.id === parametros.actaId)
  if (!original) throw new ErrorDeNegocio('Esa acta no existe.')
  if (!actaCongelada(original)) {
    throw new ErrorDeNegocio('Esa acta todavía es borrador: se corrige editándola.')
  }

  const acta: Acta = {
    id: nuevoId('act'),
    asambleaId: original.asambleaId,
    presidenteId: original.presidenteId,
    secretarioId: original.secretarioId,
    desarrollo: '',
    estado: 'borrador',
    // La aclaratoria **hereda la comision** de la original: si aquella asamblea
    // designo quien revisa sus actas, tambien revisa la que las corrige — que
    // es donde mas falta hace. Las verificaciones no se heredan: son de un texto.
    verificadores: [...original.verificadores],
    verificaciones: [],
    limiteVerificacion: original.limiteVerificacion,
    aclaraActaId: original.id,
    creadaEn: ahoraISO(),
  }
  bd.actas.push(acta)
  return persistir(bd, acta)
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
  // RN-31 — El poder vale para una sola asamblea: en una que terminó no hay poder nuevo.
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

  // Una unidad, un representante (RN-28, RN-29). Cuenta tambien el que esta
  // **por validar** (RN-96): dos en cola serian dos representantes en potencia.
  const enCurso = poderEnCursoDeUnidad(bd.poderes, parametros.asambleaId, parametros.unidadId)
  if (enCurso) {
    throw new ErrorDeNegocio(
      poderEsperandoValidacion(enCurso)
        ? 'Esa unidad ya envió un poder que la administración todavía no ha validado. Hay que retirarlo antes de dar otro.'
        : 'Esa unidad ya tiene un poder vigente en esta asamblea. Hay que revocarlo antes de dar otro.',
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

/**
 * CU-R-31 — El propietario **envia la foto del poder firmado** desde su app.
 *
 * La tercera puerta (Mary, 2026-09-17: que lo envie *«adjuntando una foto del
 * documento»*). Se parece a las otras dos y se distingue de ambas en un punto:
 * **quien vio el papel**. Por eso nace `esperando`: lo que hace valido un poder
 * en papel es que la administracion lo vea, y aqui todavia no lo vio (RN-96).
 * Mientras tanto la unidad **no esta representada** y vota su propietario.
 *
 * Solo el propietario de la sesion puede enviarlo (RN-51), como en CU-R-23, y
 * sin foto no hay nada que enviar, como en CU-A-19. Foto, no PDF: es lo que
 * el telefono ya sabe hacer y no bloquea nada (ADR-0009).
 */
export async function enviarPoderEnPapel(
  bdActual: BaseDatos,
  parametros: {
    asambleaId: string
    unidadId: string
    otorgadoPor: string
    nombresApoderado: string
    apellidosApoderado: string
    documentoApoderado: string
    telefonoApoderado?: string
    imagen: string
  },
): Promise<Resultado<Poder>> {
  await esperar()
  const bd = clonar(bdActual)

  if (!parametros.imagen) {
    throw new ErrorDeNegocio('Falta la foto del poder firmado: sin ella no hay nada que enviar.')
  }

  const { unidad, apoderado } = prepararPoder(bd, {
    ...parametros,
    exigirPropietario: parametros.otorgadoPor,
  })

  const poder: Poder = {
    id: nuevoId('pod'),
    asambleaId: parametros.asambleaId,
    unidadId: unidad.id,
    otorgadoPor: parametros.otorgadoPor,
    apoderadoId: apoderado.id,
    origen: 'papel',
    soporte: { imagen: parametros.imagen, adjuntadoEn: ahoraISO() },
    registradoPor: parametros.otorgadoPor,
    registradoEn: ahoraISO(),
    validacion: { estado: 'esperando' },
  }
  bd.poderes.push(poder)
  return persistir(bd, poder)
}

/**
 * CU-A-19 — La administracion **valida** el poder que llego en foto (RN-96).
 *
 * Es el momento en que el poder empieza a representar. Se vuelve a comprobar
 * que la unidad no tenga otro vigente: entre el envio y la validacion pudo
 * llegar uno en papel por la puerta de siempre.
 */
export async function validarPoder(
  bdActual: BaseDatos,
  parametros: { poderId: string; decididoPor: string },
): Promise<Resultado<Poder>> {
  await esperar()
  const bd = clonar(bdActual)
  const poder = bd.poderes.find((p) => p.id === parametros.poderId)
  if (!poder) throw new ErrorDeNegocio('Ese poder no existe.')
  if (!poderEsperandoValidacion(poder)) {
    throw new ErrorDeNegocio('Ese poder no está esperando validación.')
  }
  if (poder.revocadoEn) throw new ErrorDeNegocio('El propietario retiró ese poder.')

  const asamblea = bd.asambleas.find((a) => a.id === poder.asambleaId)
  if (!asamblea || asamblea.estado === 'cerrada' || asamblea.estado === 'cancelada') {
    throw new ErrorDeNegocio('Esa asamblea ya terminó: no admite poderes nuevos.')
  }
  const otro = poderDeUnidad(bd.poderes, poder.asambleaId, poder.unidadId)
  if (otro && otro.id !== poder.id) {
    throw new ErrorDeNegocio(
      'Esa unidad ya tiene otro poder vigente en esta asamblea. Hay que revocarlo antes de validar este.',
    )
  }

  poder.validacion = {
    estado: 'validado',
    decididoPor: parametros.decididoPor,
    decididoEn: ahoraISO(),
  }
  return persistir(bd, poder)
}

/**
 * CU-A-19 — La administracion **rechaza** el poder que llego en foto (RN-96).
 *
 * **Con motivo, siempre**: el propietario tiene que saber que corregir para
 * volver a enviarlo —la foto no se lee, falta la firma, no es su unidad— y el
 * expediente tiene que decir por que no valio. No se borra (RN-61).
 */
export async function rechazarPoder(
  bdActual: BaseDatos,
  parametros: { poderId: string; decididoPor: string; motivo: string },
): Promise<Resultado<Poder>> {
  await esperar()
  const bd = clonar(bdActual)
  const poder = bd.poderes.find((p) => p.id === parametros.poderId)
  if (!poder) throw new ErrorDeNegocio('Ese poder no existe.')
  if (!poderEsperandoValidacion(poder)) {
    throw new ErrorDeNegocio('Ese poder no está esperando validación.')
  }
  const motivo = parametros.motivo.trim()
  if (motivo.length < 5) {
    throw new ErrorDeNegocio('Un poder no se rechaza sin decir por qué: escribe el motivo.')
  }

  poder.validacion = {
    estado: 'rechazado',
    decididoPor: parametros.decididoPor,
    decididoEn: ahoraISO(),
    motivo,
  }
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
 * Deja escrito el mensaje para una persona, a su celular (RN-64). Un solo lugar
 * para los avisos de reservas, cierres de zonas y avances de obra: así todos
 * se guardan igual. Devuelve `false` si la persona no tiene celular: sin destino
 * no hay mensaje, y quien llama decide cómo contarlo.
 */
function avisarAPersona(
  bd: BaseDatos,
  aviso: {
    copropiedadId: string
    personaId: string
    texto: string
    motivo: MotivoMensaje
    reservaId?: string
    zonaId?: string
    proyectoId?: string
    registroId?: string
    ahora?: string
  },
): boolean {
  const persona = bd.personas.find((p) => p.id === aviso.personaId)
  const mensaje = redactar({
    id: nuevoId('msj'),
    copropiedadId: aviso.copropiedadId,
    destino: persona?.telefono ?? '',
    texto: aviso.texto,
    motivo: aviso.motivo,
    reservaId: aviso.reservaId,
    zonaId: aviso.zonaId,
    proyectoId: aviso.proyectoId,
    registroId: aviso.registroId,
    ahora: aviso.ahora ?? ahoraISO(),
  })
  if (!mensaje) return false
  bd.mensajes.unshift(mensaje)
  return true
}

/**
 * Si la persona es la administración de esa copropiedad. En el demo lo dice su
 * perfil; en BLOKY vendrá de las asignaciones de BOB (RN-161).
 */
function esAdministracion(bd: BaseDatos, personaId: string, copropiedadId: string): boolean {
  return bd.perfilesDemo.some((p) => p.rol === 'admin' && p.personaId === personaId && p.copropiedadId === copropiedadId)
}

/** Si la persona de ese documento ya tiene un vínculo vigente con la unidad (RN-61). */
function yaVinculadaALaUnidad(bd: BaseDatos, documento: string, unidadId: string): boolean {
  const persona = bd.personas.find((p) => p.documento === documento)
  return !!persona && bd.residencias.some((r) => r.unidadId === unidadId && r.personaId === persona.id && residenciaVigente(r))
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
    /** Residente, no residente o temporal (RN-62, RN-68). */
    condicion: CondicionRegistro
    /** Solo la visita de un día: si quien registra le pide las fotos (RN-57). */
    pedirFotos?: boolean
    /** Solo el visitante frecuente: los días de la semana en que viene. */
    dias?: number[]
    menorDeEdad?: boolean
    tipoIdentificacion?: TipoIdentificacion
    nombres: string
    apellidos: string
    documento: string
    email: string
    telefono: string
    vigenciaDesde?: string
    vigenciaHasta?: string
    placa?: string
    /** La marca «No obligatorio», si quien crea es el administrador (RN-97). */
    soportesNoObligatorios?: boolean
  },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)

  // RN-60 — Quién registra a quién. Se revisa aquí y no solo en la pantalla: el
  // arrendatario que llame a esta función directamente tampoco registra a un
  // residente. La administración registra lo que su consola ofrece (RN-63).
  let rolEnLaUnidad: RolResidencia | undefined
  if (esAdministracion(bd, parametros.creadoPor, parametros.copropiedadId)) {
    // RN-63 — La administración solo registra al primer propietario.
    const motivo = motivoNoRegistraAdministracion(
      parametros.categoria,
      unidadTienePropietario(bd, parametros.unidadId),
    )
    if (motivo) throw new ErrorDeNegocio(motivo)
  } else {
    const suVinculo = bd.residencias.find(
      (r) => r.unidadId === parametros.unidadId && r.personaId === parametros.creadoPor && residenciaVigente(r),
    )
    rolEnLaUnidad = suVinculo?.rol
    const esMenor = !!bd.registros.find((r) => r.id === suVinculo?.registroId)?.menorDeEdad
    if (!puedeRegistrar(rolEnLaUnidad, parametros.categoria, esMenor, parametros.condicion, suVinculo?.reside !== false)) {
      throw new ErrorDeNegocio('Tu papel en esta unidad no te permite registrar a esa clase de persona (RN-60).')
    }
  }

  // RN-60 — Sin celular ni correo no hay a dónde mandarle el código de entrada.
  // Menores de edad (2026-10-02): solo familia o visitas, y con tarjeta de
  // identidad o registro civil solo si son menores.
  if (parametros.menorDeEdad && !admiteMenor(parametros.categoria)) {
    throw new ErrorDeNegocio('El propietario y el arrendatario son mayores de edad.')
  }
  if (parametros.tipoIdentificacion && TIPOS_IDENTIFICACION[parametros.tipoIdentificacion].soloMenores && !parametros.menorDeEdad) {
    throw new ErrorDeNegocio('La tarjeta de identidad y el registro civil son documentos de menores de edad.')
  }
  // El visitante frecuente dice qué días viene.
  if (parametros.condicion === 'frecuente' && !(parametros.dias && parametros.dias.length > 0)) {
    throw new ErrorDeNegocio('Escoge los días de la semana en que viene.')
  }
  if (faltaContacto(parametros.categoria, parametros.telefono, parametros.email, parametros.menorDeEdad)) {
    throw new ErrorDeNegocio('Escribe el celular o el correo: es a donde le llega el código para entrar a la app.')
  }

  // RN-68 — El visitante no es residente: quien vive ahí no es una visita.
  if (!condicionesPosibles(parametros.categoria).includes(parametros.condicion)) {
    throw new ErrorDeNegocio(
      {
        visitante: 'Un visitante es de un día, frecuente o temporal; no puede ser residente.',
        propietario: 'El propietario es residente o no residente: no existe un propietario temporal.',
        arrendatario: 'El arrendatario es residente o temporal: arrienda para vivir ahí.',
        familiar: 'El familiar o acompañante vive ahí: es residente o temporal.',
      }[parametros.categoria],
    )
  }

  // RN-62: la vigencia no es opcional donde la condición la exige. Se valida aqui
  // y no solo en el formulario: el formulario es una comodidad, la regla es esto.
  if (exigeVigencia(parametros) && !parametros.vigenciaHasta) {
    throw new ErrorDeNegocio('Un registro temporal o una visita necesita fecha de salida.')
  }

  // RN-62: la visita es de un solo dia. Se valida aqui y no solo en el
  // formulario, porque el formulario es una comodidad y esto es la regla.
  if (soloUnDia(parametros) && parametros.vigenciaDesde !== parametros.vigenciaHasta) {
    throw new ErrorDeNegocio(
      'Una visita de un día se autoriza por un día. Para varios días, escoge «temporal».',
    )
  }

  // RN-61 — Quien ya está vinculado a la unidad no se registra otra vez: dos
  // vínculos vigentes de la misma persona son dos verdades sobre quién es ahí.
  // La visita no crea vínculo, así que no cuenta.
  if (!saleConCodigo(parametros) && yaVinculadaALaUnidad(bd, parametros.documento, parametros.unidadId)) {
    throw new ErrorDeNegocio('Esa persona ya está vinculada a esta unidad. Si cambia su papel, inhabilítala primero.')
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
  const { soportesNoObligatorios, pedirFotos, ...datos } = parametros
  const registro: RegistroPersona = {
    id: nuevoId('reg'),
    ...datos,
    ...(pedirFotos && esVisitaDeUnDia(parametros) ? { pedirFotos: true } : {}),
    ...(parametros.condicion !== 'frecuente' ? { dias: undefined } : {}),
    codigo: nuevoCodigoRegistro(),
    estado: 'esperando_soportes',
    creadoEn: ahora,
  }
  bd.registros.unshift(registro)

  // RN-60 — La estadía de más de una semana que registra un arrendatario la
  // aprueba el propietario. Se le avisa a cada uno.
  if (
    requiereAprobacionPropietario(
      rolEnLaUnidad,
      registro,
      aprobacionPropietarioActiva(bd.copropiedades.find((c) => c.id === registro.copropiedadId)),
    )
  ) {
    registro.aprobacionPropietario = {}
    const unidad = bd.unidades.find((u) => u.id === registro.unidadId)
    for (const dueno of bd.residencias.filter(
      (r) => r.unidadId === registro.unidadId && r.rol === 'propietario' && residenciaVigente(r),
    )) {
      avisarAPersona(bd, {
        copropiedadId: registro.copropiedadId,
        personaId: dueno.personaId,
        motivo: 'estadia_por_aprobar',
        registroId: registro.id,
        texto:
          `Idiky: tu arrendatario registró a ${registro.nombres} ${registro.apellidos} en ` +
          `${unidad ? etiquetaUnidad(unidad) : 'tu unidad'} del ${fechaCorta(registro.vigenciaDesde ?? '')} ` +
          `al ${fechaCorta(registro.vigenciaHasta ?? '')}. Por ser más de una semana, necesita tu aprobación en la app.`,
        ahora,
      })
    }
  }

  // RN-97: con la marca, no hay soportes que esperar. Queda quien la puso.
  if (soportesNoObligatorios && exigeSoportes(registro)) {
    registro.soportesNoObligatorios = { marcadoPor: registro.creadoPor, marcadoEn: ahora }
    registro.estado = 'esperando_autorizacion'
  }

  // RN-57: a la visita de un día no se le piden soportes, asi que su registro no espera
  // nada de nadie — se resuelve aqui mismo y sale con su codigo.
  //
  // **Sigue siendo un registro**, y esa es la parte que importa: aunque el
  // tramite sea de un toque, queda escrito quien dejo entrar a quien y cuando.
  // Aliviar el requisito no es renunciar al rastro.
  if (!exigeSoportes(registro)) {
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
    // El frecuente entra los días escogidos hasta su fecha (2026-10-02).
    recurrente: registro.condicion === 'frecuente',
    dias: registro.condicion === 'frecuente' ? registro.dias : undefined,
    estado: 'activo',
    creadoEn: ahoraISO(),
    registroId: registro.id,
  }
  bd.visitantes.unshift(visitante)
  return visitante
}

/**
 * RN-97 — El administrador pone o quita la marca «No obligatorio».
 *
 * Ponerla mueve el registro a la autorizacion —ya no espera nada de la
 * persona—; quitarla lo devuelve a esperar las fotos si todavia no las trajo.
 * Solo mientras el registro esta en curso: decidido, ya no hay nada que eximir.
 */
export async function marcarSoportesNoObligatorios(
  bdActual: BaseDatos,
  parametros: { registroId: string; marcadoPor: string; marcar: boolean },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.registros.find((r) => r.id === parametros.registroId)
  if (!registro) throw new ErrorDeNegocio('Ese registro no existe.')
  if (!exigeSoportes(registro)) {
    throw new ErrorDeNegocio('A un visitante no se le piden soportes: no hay nada que eximir.')
  }
  if (!registroEnCurso(registro)) {
    throw new ErrorDeNegocio('Ese registro ya está decidido: la marca solo se pone mientras está en curso.')
  }

  if (parametros.marcar) {
    registro.soportesNoObligatorios = { marcadoPor: parametros.marcadoPor, marcadoEn: ahoraISO() }
    if (registro.estado === 'esperando_soportes') registro.estado = 'esperando_autorizacion'
  } else {
    delete registro.soportesNoObligatorios
    if (registro.estado === 'esperando_autorizacion' && !soportesCompletos(registro)) {
      registro.estado = 'esperando_soportes'
    }
  }
  return persistir(bd, registro)
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
  if (esperaAlPropietario(registro)) {
    throw new ErrorDeNegocio('Falta que el propietario apruebe esta estadía de más de una semana (RN-60).')
  }
  if (!puedeAutorizar(registro, parametros.personaId)) {
    throw new ErrorDeNegocio('Solo quien creó el registro puede autorizarlo.')
  }
  // RN-57, salvo la marca del administrador (RN-97).
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

  if (saleConCodigo(registro)) {
    registro.visitanteId = crearVisitanteDeRegistro(bd, registro).id
  } else {
    // RN-61 — Entre crear y autorizar pudo vincularse por otro registro.
    if (yaVinculadaALaUnidad(bd, registro.documento, registro.unidadId)) {
      throw new ErrorDeNegocio('Esa persona ya está vinculada a esta unidad: cierra este registro.')
    }
    const residencia: Residencia = {
      id: nuevoId('res'),
      personaId: persona.id,
      unidadId: registro.unidadId,
      // El visitante temporal queda como `autorizado`: duerme ahí, pero no
      // registra a nadie (RN-60).
      rol: rolDeRegistro(registro) ?? 'autorizado',
      desde: registro.vigenciaDesde ?? hoyISO(),
      hasta: registro.condicion === 'temporal' ? registro.vigenciaHasta : undefined,
      principal: false,
      // RN-68 — La marca de residente sale de la condición escogida al registrar.
      reside: marcaResidente(registro),
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
 * RN-210 — La administración decide si en su edificio el propietario aprueba
 * las estadías largas que registra el arrendatario. Lo ya pedido no cambia:
 * apagar la opción no aprueba lo que estaba esperando.
 */
export async function configurarAprobacionPropietario(
  bdActual: BaseDatos,
  parametros: { copropiedadId: string; personaId: string; activa: boolean },
): Promise<Resultado<Copropiedad>> {
  await esperar()
  const bd = clonar(bdActual)
  if (!esAdministracion(bd, parametros.personaId, parametros.copropiedadId)) {
    throw new ErrorDeNegocio('Esta opción la cambia la administración del edificio (RN-210).')
  }
  const copropiedad = bd.copropiedades.find((c) => c.id === parametros.copropiedadId)
  if (!copropiedad) throw new ErrorDeNegocio('Esa copropiedad no existe.')
  copropiedad.aprobacionPropietario = parametros.activa
  return persistir(bd, copropiedad)
}

/**
 * RN-60 — El propietario aprueba, o no, la estadía de más de una semana que
 * registró su arrendatario. Aprobada, el arrendatario autoriza como siempre
 * (RN-59); no aprobada, el registro queda rechazado con el motivo.
 */
export async function decidirEstadiaComoPropietario(
  bdActual: BaseDatos,
  parametros: { registroId: string; personaId: string; aprobar: boolean; motivo?: string },
): Promise<Resultado<RegistroPersona>> {
  await esperar()
  const bd = clonar(bdActual)
  const registro = bd.registros.find((r) => r.id === parametros.registroId)
  if (!registro) throw new ErrorDeNegocio('Ese registro no existe.')
  if (!esperaAlPropietario(registro)) throw new ErrorDeNegocio('Ese registro no espera la aprobación del propietario.')
  const esPropietario = bd.residencias.some(
    (r) => r.unidadId === registro.unidadId && r.personaId === parametros.personaId && r.rol === 'propietario' && residenciaVigente(r),
  )
  if (!esPropietario) throw new ErrorDeNegocio('La estadía la aprueba un propietario de la unidad.')
  const ahora = ahoraISO()
  if (parametros.aprobar) {
    registro.aprobacionPropietario = { aprobadoPor: parametros.personaId, aprobadoEn: ahora }
  } else {
    const motivo = (parametros.motivo ?? '').trim()
    if (motivo.length < 5) throw new ErrorDeNegocio('Escribe por qué no la apruebas: el arrendatario lo va a leer.')
    registro.estado = 'rechazado'
    registro.motivo = `El propietario no aprobó la estadía: ${motivo}`
    registro.decididoEn = ahora
    registro.decididoPor = parametros.personaId
  }
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
  // RN-67 — Ve los soportes quien creó el registro, el propietario por encima (RN-65) o la administración.
  const rol = esAdministracion(bd, parametros.personaId, registro.copropiedadId) ? 'admin' : 'residente'
  const { heredadoPor } = responsablesDeRegistro(bd, registro)
  if (!puedeVerSoportes({ creadoPor: registro.creadoPor, heredadoPor, personaId: parametros.personaId, rol })) {
    throw new ErrorDeNegocio('Los soportes los ven quien creó el registro, el propietario o la administración.')
  }

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

  // RN-94 — Antes de mirar quien vota, **si esta sesion puede decidir esto**.
  // Va primero porque no depende de quien sea: si la decision no cabe en esta
  // reunion, no cabe para nadie, y recoger votos que nacen nulos es peor que no
  // recogerlos (art. 46, paragrafo).
  const asambleaDeLaVotacion = bd.asambleas.find((a) => a.id === votacion.asambleaId)
  const puntoVotado = asambleaDeLaVotacion?.ordenDelDia.find((p) => p.id === votacion.puntoId)
  if (asambleaDeLaVotacion && puntoVotado) {
    const admisible = decisionAdmisibleEnLaSesion(asambleaDeLaVotacion, puntoVotado)
    if (!admisible.admisible) throw new ErrorDeNegocio(admisible.motivo!)
  }

  const unidad = bd.unidades.find((u) => u.id === parametros.unidadId)
  if (!unidad) throw new ErrorDeNegocio('La unidad no existe.')

  // **Quien puede votar por esta unidad: el propietario, o su apoderado.** Si hay
  // poder, vota solo el apoderado: quien lo otorgó ya no vota esa unidad (RN-32).
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
      (r) => r.unidadId === unidad.id && r.personaId === parametros.personaId && residenciaVigente(r),
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
/**
 * CU-R-18 — Emite el estado de cuenta de la unidad para un rango de periodos
 * (RN-127): lo calcula, lo congela en el documento y le da su consecutivo y su
 * código (RN-36, ADR-0006). Se imprime desde la app, como el paz y salvo.
 */
export async function emitirEstadoCuenta(
  bdActual: BaseDatos,
  parametros: { copropiedadId: string; unidadId: string; desde: string; hasta: string; solicitadoPor: string },
): Promise<Resultado<Documento>> {
  await esperar()
  const bd = clonar(bdActual)
  const unidad = bd.unidades.find((u) => u.id === parametros.unidadId)
  if (!unidad) throw new ErrorDeNegocio('La unidad no existe.')
  const estado = estadoDeCuenta(
    cuotasDe(bd, unidad.id),
    bd.pagos.filter((p) => p.unidadId === unidad.id),
    parametros.desde,
    parametros.hasta,
  )
  const invalido = motivoEstadoCuentaInvalido(parametros.desde, parametros.hasta, estado)
  if (invalido) throw new ErrorDeNegocio(invalido)

  const hoy = hoyISO()
  const consecutivo = bd.consecutivos.estadoCuenta ?? 1
  const documento: Documento = {
    id: nuevoId('doc'),
    tipo: 'estado_cuenta',
    numero: `EC-${hoy.slice(0, 4)}-${String(consecutivo).padStart(4, '0')}`,
    codigoVerificacion: nuevoCodigoVerificacion(),
    copropiedadId: parametros.copropiedadId,
    unidadId: unidad.id,
    emitidoEn: hoy,
    estadoCuenta: { ...estado, solicitadoPor: parametros.solicitadoPor },
    estado: 'vigente',
  }
  bd.documentos.push(documento)
  bd.consecutivos.estadoCuenta = consecutivo + 1
  return persistir(bd, documento)
}

export async function emitirPazYSalvo(
  bdActual: BaseDatos,
  parametros: { copropiedadId: string; unidadId: string; emitidoPor?: string },
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
    ...(parametros.emitidoPor ? { emitidoPor: parametros.emitidoPor } : {}),
    estado: 'vigente',
  }
  bd.documentos.push(documento)
  bd.consecutivos.pazYSalvo = consecutivo + 1
  return persistir(bd, documento)
}

/**
 * CU-A-13 — Anula un documento emitido. No se borra (ADR-0006 §5, O3): queda
 * con su motivo, y quien lo reciba en papel puede confirmar con la
 * administración que ya no vale.
 */
export async function anularDocumento(
  bdActual: BaseDatos,
  parametros: { documentoId: string; motivo: string; anuladoPor: string },
): Promise<Resultado<Documento>> {
  await esperar()
  const bd = clonar(bdActual)
  const documento = bd.documentos.find((d) => d.id === parametros.documentoId)
  if (!documento) throw new ErrorDeNegocio('Ese documento no existe.')
  if (documento.estado === 'anulado') throw new ErrorDeNegocio('Ese documento ya estaba anulado.')
  const motivo = parametros.motivo.trim()
  if (motivo.length < 10) throw new ErrorDeNegocio('Escribe por qué se anula: es lo que se responde si alguien presenta el papel.')
  documento.estado = 'anulado'
  documento.anuladoEn = ahoraISO()
  documento.anuladoPor = parametros.anuladoPor
  documento.motivoAnulacion = motivo
  return persistir(bd, documento)
}
