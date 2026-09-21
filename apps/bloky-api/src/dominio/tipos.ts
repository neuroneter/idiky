/**
 * Tipos del dominio de BLOKY que atanen al ingreso (CU-B-01).
 *
 * La identidad de una persona y su relacion con cada copropiedad nacen en BOB (docs/13 §1):
 * BLOKY las lee, nunca las escribe. Lo que BLOKY si guarda es lo suyo: sesiones e intentos.
 */
export type TipoDocumento = 'CC' | 'CE' | 'PA' | 'PPT' | 'TI'
export type RolRaiz = 'administrador' | 'delegado'
export type EstadoAsignacion = 'vigente' | 'finalizada' | 'bloqueada'
export type EstadoCopropiedad = 'prospecto' | 'en_implementacion' | 'activa' | 'suspendida' | 'retirada'
export type Canal = 'sms' | 'google' | 'microsoft'

/** Lo que BOB sabe de una persona, ya leido y normalizado. */
export interface PersonaBob {
  id: string
  nombre: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  celular: string
  correo: string
  asignaciones: AsignacionBob[]
}

export interface AsignacionBob {
  rol: RolRaiz
  estado: EstadoAsignacion
  desde: string
  hasta?: string | null
  copropiedad: { id: string; nombre: string; estado: EstadoCopropiedad }
}

/** Una copropiedad a la que la persona puede entrar hoy, con el rol con el que entra. */
export interface AccesoCopropiedad {
  copropiedadId: string
  nombre: string
  rol: RolRaiz
}

export interface Sesion {
  id: string
  personaId: string
  nombre: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  canal: Canal
  copropiedades: AccesoCopropiedad[]
  creadaEn: string
  venceEn: string
  revocadaEn?: string | null
}

export interface IntentoIngreso {
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  canal: Canal
  resultado: 'codigo_enviado' | 'codigo_correcto' | 'codigo_incorrecto' | 'proveedor_ok' | 'correo_no_coincide' | 'sin_acceso'
  ip?: string
  fecha: string
}

/** Lo que guarda BLOKY mientras la persona va y vuelve de Google o Microsoft. */
export interface EstadoOauth {
  estado: string
  proveedor: 'google' | 'microsoft'
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nonce: string
  creadoEn: string
}
