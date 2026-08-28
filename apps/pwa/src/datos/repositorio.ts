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
  Documento,
  MedioPago,
  Pago,
  Periodo,
  Pqrs,
  Reserva,
  Residencia,
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
  puedeVotar,
  sumarDias,
  vencimientoDelPeriodo,
  votacionRecibeVotos,
  yaVoto,
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
// CU-R-13 — Votar un punto del orden del dia
// ---------------------------------------------------------------------------

/** Dias que vale un paz y salvo emitido. Provisional: el plazo esta por confirmar. */
const VIGENCIA_PAZ_Y_SALVO_DIAS = 30

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

  // RN-51: vota el propietario. La comprobacion va aqui y no solo en la pantalla:
  // esconder el boton no es una regla (T-16).
  const residencia = bd.residencias.find(
    (r) => r.unidadId === unidad.id && r.personaId === parametros.personaId && !r.hasta,
  )
  if (!puedeVotar(residencia?.rol)) {
    throw new ErrorDeNegocio('Solo el propietario de la unidad puede votar.')
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
  const documento: Documento = {
    id: nuevoId('doc'),
    tipo: 'paz_y_salvo',
    // RN-36: consecutivo unico por tipo, mas el codigo que lo hace verificable.
    numero: `PS-${hoy.slice(0, 4)}-${String(consecutivo).padStart(4, '0')}`,
    codigoVerificacion: nuevoCodigoVerificacion(),
    copropiedadId: parametros.copropiedadId,
    unidadId: unidad.id,
    emitidoEn: hoy,
    vigenteHasta: sumarDias(hoy, VIGENCIA_PAZ_Y_SALVO_DIAS),
    estado: 'vigente',
  }
  bd.documentos.push(documento)
  bd.consecutivos.pazYSalvo = consecutivo + 1
  return persistir(bd, documento)
}
