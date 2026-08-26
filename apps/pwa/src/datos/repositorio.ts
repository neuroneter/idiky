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
  BaseDatos,
  CategoriaComunicado,
  CategoriaPqrs,
  Comunicado,
  Correspondencia,
  Cuota,
  Imputacion,
  MedioPago,
  OrigenPago,
  Pago,
  Periodo,
  Pqrs,
  Reserva,
  Residencia,
  RolResidencia,
  TipoCorrespondencia,
  TipoPqrs,
  Visitante,
} from '../dominio/tipos'
import {
  ahoraISO,
  calcularFechaLimite,
  estadoRealCuota,
  hoyISO,
  imputarPago,
  numeroRecibo,
  prorratearPorCoeficiente,
  saldoAFavorDelPago,
  validarImputacion,
  vencimientoDelPeriodo,
} from '../dominio/reglas'
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
// CU-R-04 / CU-R-18 / CU-A-04 / CU-A-18 — Pagos y recibos de caja
// ---------------------------------------------------------------------------

/** Cuotas de una unidad, para validar e imputar contra ellas. */
function cuotasDe(bd: BaseDatos, unidadId: string): Cuota[] {
  return bd.cuotas.filter((cuota) => cuota.unidadId === unidadId)
}

/**
 * Aplica el reparto sobre las cuotas: baja el saldo y ajusta el estado.
 * Con `signo` -1 revierte, que es lo que hace la anulacion (RN-29).
 */
function moverSaldos(bd: BaseDatos, imputaciones: Imputacion[], signo: 1 | -1): void {
  for (const linea of imputaciones) {
    const cuota = bd.cuotas.find((c) => c.id === linea.cuotaId)
    if (!cuota) continue
    cuota.saldo = Math.min(cuota.valor, Math.max(0, cuota.saldo - linea.valor * signo))
    cuota.estado = estadoRealCuota(cuota)
  }
}

/** Toma el siguiente numero de recibo de caja y avanza el consecutivo (RN-28). */
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
 * CU-R-18 — El propietario informa un abono que ya consigno.
 *
 * El pago nace `reportado`: queda a la espera de que la administracion lo
 * concilie. No toca la cartera hasta ese momento (RN-30), justamente porque
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
 * administracion digita. Emite recibo de caja en el mismo acto (RN-28).
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
 * CU-A-18 — La administracion concilia un abono informado por el propietario.
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
 * CU-A-18 — Anula un recibo de caja.
 *
 * RN-29: no se borra el registro, se marca anulado con su motivo y el saldo
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

  const nuevas: Cuota[] = previsualizarCuotas(bd, parametros).map((linea) => ({
    id: nuevoId('cuo'),
    unidadId: linea.unidadId,
    periodo: parametros.periodo,
    tipo: parametros.tipo,
    concepto: parametros.concepto,
    valor: linea.valor,
    // RN-26: nace debiendo todo su valor.
    saldo: linea.valor,
    // RN-23: vencimiento por defecto el dia 10 del periodo.
    fechaVencimiento: vencimientoDelPeriodo(parametros.periodo),
    estado: 'pendiente',
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
