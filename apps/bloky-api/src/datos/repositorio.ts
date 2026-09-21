/**
 * Lo que BLOKY guarda por su cuenta para el ingreso (CU-B-01): sesiones, intentos y el estado
 * de ida y vuelta con Google o Microsoft. Una interfaz, dos adaptadores (ADR-0003): memoria
 * para desarrollo y pruebas, PostgreSQL en el servidor.
 *
 * Nada se borra: una sesion se revoca (RN-165) y los intentos quedan como registro.
 */
import type { EstadoOauth, IntentoIngreso, Sesion, TipoDocumento } from '../dominio/tipos.js'

export interface Repositorio {
  guardarSesion(sesion: Sesion): Promise<void>
  sesion(id: string): Promise<Sesion | undefined>
  revocarSesion(id: string, cuando: string): Promise<void>
  registrarIntento(intento: IntentoIngreso): Promise<void>
  /** Cuantos codigos incorrectos lleva este documento desde `desde` (RN-166). */
  intentosFallidosDesde(tipoDocumento: TipoDocumento, numeroDocumento: string, desde: string): Promise<number>
  guardarEstadoOauth(estado: EstadoOauth): Promise<void>
  /** Devuelve y consume el estado: solo sirve una vez. */
  consumirEstadoOauth(estado: string): Promise<EstadoOauth | undefined>
  cerrar(): Promise<void>
}
