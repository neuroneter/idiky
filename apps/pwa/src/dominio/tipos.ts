/**
 * Modelo de datos del dominio de copropiedad horizontal.
 * Documentacion: docs/05-modelo-de-datos.md
 *
 * Estos tipos son el contrato entre la interfaz y los datos. Cuando exista el
 * backend (fase 2) deben coincidir con el esquema de la API.
 */

// ---------------------------------------------------------------------------
// Convenciones
// ---------------------------------------------------------------------------
/** Fecha ISO `AAAA-MM-DD`. */
export type FechaISO = string
/** Fecha y hora ISO completa. */
export type FechaHoraISO = string
/** Periodo contable `AAAA-MM`. */
export type Periodo = string
/** Hora `HH:mm`. */
export type Hora = string
/** Valor en pesos enteros, sin decimales. */
export type Dinero = number

// ---------------------------------------------------------------------------
// Copropiedad y unidades
// ---------------------------------------------------------------------------
export interface Copropiedad {
  id: string
  nombre: string
  nit: string
  direccion: string
  ciudad: string
  tipo: 'residencial' | 'comercial' | 'mixto'
}

export type TipoUnidad = 'apartamento' | 'casa' | 'local'

export interface Unidad {
  id: string
  copropiedadId: string
  torre: string
  numero: string
  tipo: TipoUnidad
  /** Area privada en metros cuadrados. */
  area: number
  /** Porcentaje de participacion. La suma de la copropiedad es 100 (RN-19). */
  coeficiente: number
  parqueaderos: string[]
}

export interface Persona {
  id: string
  nombres: string
  apellidos: string
  documento: string
  email: string
  telefono: string
}

export type RolResidencia = 'propietario' | 'arrendatario' | 'autorizado'

/** Vinculo entre una persona y una unidad. Define el rol efectivo (RN-02). */
export interface Residencia {
  id: string
  personaId: string
  unidadId: string
  rol: RolResidencia
  desde: FechaISO
  hasta?: FechaISO
  /** Contacto principal de la unidad. */
  principal: boolean
}

// ---------------------------------------------------------------------------
// Cartera
// ---------------------------------------------------------------------------
export type TipoCuota = 'ordinaria' | 'extraordinaria' | 'interes' | 'sancion'
export type EstadoCuota = 'pendiente' | 'pagada' | 'vencida'

export interface Cuota {
  id: string
  unidadId: string
  periodo: Periodo
  tipo: TipoCuota
  concepto: string
  valor: Dinero
  fechaVencimiento: FechaISO
  estado: EstadoCuota
  pagoId?: string
}

export type MedioPago = 'pse' | 'tarjeta' | 'transferencia' | 'efectivo' | 'otro'

export interface Pago {
  id: string
  unidadId: string
  cuotaIds: string[]
  valor: Dinero
  medio: MedioPago
  referencia: string
  fecha: FechaHoraISO
  /** Consecutivo del comprobante (RN-07). */
  comprobante: string
  registradoPor: string
}

// ---------------------------------------------------------------------------
// Zonas comunes y reservas
// ---------------------------------------------------------------------------
export interface ZonaComun {
  id: string
  copropiedadId: string
  nombre: string
  descripcion: string
  icono: string
  aforo: number
  requiereAprobacion: boolean
  horaInicio: Hora
  horaFin: Hora
  duracionBloqueHoras: number
  anticipacionMinimaHoras: number
  cupoMensualPorUnidad: number
}

export type EstadoReserva = 'solicitada' | 'confirmada' | 'rechazada' | 'cancelada'

export interface Reserva {
  id: string
  zonaId: string
  unidadId: string
  personaId: string
  fecha: FechaISO
  horaInicio: Hora
  horaFin: Hora
  estado: EstadoReserva
  motivoRechazo?: string
  creadaEn: FechaHoraISO
}

// ---------------------------------------------------------------------------
// PQRS
// ---------------------------------------------------------------------------
export type TipoPqrs = 'peticion' | 'queja' | 'reclamo' | 'sugerencia'
export type CategoriaPqrs =
  | 'convivencia'
  | 'mantenimiento'
  | 'seguridad'
  | 'administracion'
  | 'otro'
export type EstadoPqrs = 'abierta' | 'en_gestion' | 'resuelta' | 'cerrada'

export interface MensajePqrs {
  id: string
  autor: 'residente' | 'administracion'
  autorNombre: string
  texto: string
  fecha: FechaHoraISO
}

export interface Pqrs {
  id: string
  /** Consecutivo `PQRS-AAAA-NNNN` (RN-12). */
  radicado: string
  copropiedadId: string
  unidadId: string
  personaId: string
  tipo: TipoPqrs
  categoria: CategoriaPqrs
  asunto: string
  descripcion: string
  estado: EstadoPqrs
  fechaRadicacion: FechaHoraISO
  /** Vencimiento del SLA (RN-13). */
  fechaLimite: FechaISO
  mensajes: MensajePqrs[]
}

// ---------------------------------------------------------------------------
// Comunicados
// ---------------------------------------------------------------------------
export type CategoriaComunicado = 'general' | 'urgente' | 'mantenimiento' | 'asamblea'

export interface Comunicado {
  id: string
  copropiedadId: string
  titulo: string
  cuerpo: string
  categoria: CategoriaComunicado
  fijado: boolean
  fechaPublicacion: FechaHoraISO
  vigenteHasta?: FechaISO
  autor: string
  /** Ids de persona que ya lo abrieron. */
  leidoPor: string[]
}

// ---------------------------------------------------------------------------
// Correspondencia
// ---------------------------------------------------------------------------
export type TipoCorrespondencia = 'paquete' | 'carta' | 'domicilio'
export type EstadoCorrespondencia = 'en_porteria' | 'entregada'

export interface Correspondencia {
  id: string
  unidadId: string
  tipo: TipoCorrespondencia
  remitente: string
  observaciones: string
  fechaRecepcion: FechaHoraISO
  estado: EstadoCorrespondencia
  recibidoPor?: string
  fechaEntrega?: FechaHoraISO
}

// ---------------------------------------------------------------------------
// Visitantes
// ---------------------------------------------------------------------------
export type EstadoVisitante = 'programado' | 'activo' | 'vencido' | 'revocado'

export interface Visitante {
  id: string
  unidadId: string
  personaId: string
  nombre: string
  documento: string
  placa?: string
  vigenciaDesde: FechaISO
  vigenciaHasta: FechaISO
  /** Codigo que presenta el visitante en porteria (RN-16, RN-17). */
  codigo: string
  recurrente: boolean
  estado: EstadoVisitante
  creadoEn: FechaHoraISO
}

// ---------------------------------------------------------------------------
// Sesion y perfiles demo
// ---------------------------------------------------------------------------
export type RolUsuario = 'residente' | 'admin'

/** Perfil seleccionable en la pantalla de acceso del demo (ADR-0004). */
export interface PerfilDemo {
  id: string
  etiqueta: string
  descripcion: string
  rol: RolUsuario
  personaId: string
  copropiedadId: string
  /** Unidad preseleccionada; los admin no tienen. */
  unidadId?: string
}

export interface Sesion {
  perfilId: string
  personaId: string
  rol: RolUsuario
  copropiedadId: string
  unidadActivaId?: string
}

// ---------------------------------------------------------------------------
// Estado completo persistido del demo
// ---------------------------------------------------------------------------
export interface BaseDatos {
  /** Version del esquema; si cambia, la semilla se regenera. */
  version: number
  copropiedades: Copropiedad[]
  unidades: Unidad[]
  personas: Persona[]
  residencias: Residencia[]
  cuotas: Cuota[]
  pagos: Pago[]
  zonasComunes: ZonaComun[]
  reservas: Reserva[]
  pqrs: Pqrs[]
  comunicados: Comunicado[]
  correspondencia: Correspondencia[]
  visitantes: Visitante[]
  perfilesDemo: PerfilDemo[]
  consecutivos: {
    pqrs: number
    comprobante: number
  }
}
