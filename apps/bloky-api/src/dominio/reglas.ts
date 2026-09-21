/**
 * Reglas de negocio del ingreso a BLOKY (CU-B-01). Funciones puras, sin Strapi, sin base de
 * datos, sin red: la definicion que manda esta en docs/05-modelo-de-datos.md.
 *
 * Rango de la integracion (docs/11 §0): RN-160 en adelante.
 */
import type { AccesoCopropiedad, AsignacionBob, Canal, PersonaBob } from './tipos.js'

/** RN-166 — Cinco codigos equivocados en quince minutos bloquean el documento quince minutos. */
export const MAXIMO_INTENTOS_FALLIDOS = 5
export const MINUTOS_VENTANA_INTENTOS = 15

/**
 * RN-161 — Solo entra a una copropiedad quien tiene en BOB una asignacion **vigente** como
 * administrador o delegado: estado `vigente`, que ya empezo y que no ha terminado.
 */
export function asignacionVigente(asignacion: AsignacionBob, hoy: string): boolean {
  if (asignacion.estado !== 'vigente') return false
  if (asignacion.desde > hoy) return false
  if (asignacion.hasta && asignacion.hasta < hoy) return false
  return true
}

/**
 * RN-162 — La copropiedad tiene que estar **activa** o **en implementacion**. Un prospecto no
 * ha contratado; una suspendida o retirada no da acceso (lo que conserva sigue abierto, docs/13 §7).
 */
export function copropiedadAdmiteIngreso(estado: AsignacionBob['copropiedad']['estado']): boolean {
  return estado === 'activa' || estado === 'en_implementacion'
}

/** Las copropiedades a las que la persona puede entrar hoy, con su rol (RN-161 + RN-162). */
export function copropiedadesAccesibles(persona: PersonaBob, hoy: string): AccesoCopropiedad[] {
  const vistas = new Set<string>()
  const resultado: AccesoCopropiedad[] = []
  for (const a of persona.asignaciones) {
    if (!asignacionVigente(a, hoy) || !copropiedadAdmiteIngreso(a.copropiedad.estado)) continue
    // Una persona no es administrador y delegado de la misma copropiedad (docs/13 §3.4); si
    // BOB llegara a tener las dos, manda la primera vigente.
    if (vistas.has(a.copropiedad.id)) continue
    vistas.add(a.copropiedad.id)
    resultado.push({ copropiedadId: a.copropiedad.id, nombre: a.copropiedad.nombre, rol: a.rol })
  }
  return resultado
}

/**
 * RN-163 — El codigo de un solo uso va **al celular registrado en BOB**, nunca a un numero
 * que la persona escriba. Devuelve el numero en formato E.164 o `undefined` si no sirve.
 * En Colombia un celular son 10 digitos que empiezan por 3; si ya trae indicativo se respeta.
 */
export function celularParaCodigo(celular: string): string | undefined {
  const limpio = celular.replace(/[\s()-]/g, '')
  if (/^\+[1-9]\d{7,14}$/.test(limpio)) return limpio
  if (/^3\d{9}$/.test(limpio)) return `+57${limpio}`
  if (/^57 ?3\d{9}$/.test(limpio)) return `+${limpio.replace(' ', '')}`
  return undefined
}

/**
 * RN-164 — Con Google o Microsoft, el correo que el proveedor verifico tiene que ser **el
 * mismo que esta en BOB**. Se compara sin mayusculas ni espacios; nada mas.
 */
export function correoCoincide(correoBob: string, correoProveedor: string | undefined): boolean {
  if (!correoProveedor) return false
  return correoBob.trim().toLowerCase() === correoProveedor.trim().toLowerCase()
}

/**
 * RN-167 — A la persona se le ofrece **solo el proveedor de su correo**, no todos: quien tiene
 * un Gmail ve «Entrar con Google»; quien tiene Hotmail, Outlook, Live o MSN ve «Entrar con
 * Microsoft»; quien tiene Yahoo (o Ymail, Rocketmail) ve «Entrar con Yahoo». Un correo de otro
 * dominio (una empresa) no ve ninguno: solo el SMS.
 * Mostrarle a alguien un boton con el que no puede entrar es una pregunta que no sabe
 * responder (responsable de integracion, 2026-09-21).
 *
 * Se decide por el dominio del correo, sin consultar nada. Un dominio de empresa puede ser
 * de Google Workspace o de Microsoft 365, pero eso no se sabe mirandolo: queda para cuando
 * haya un caso real (se podria deducir del registro MX).
 */
export function proveedorDelCorreo(correo: string): 'google' | 'microsoft' | 'yahoo' | undefined {
  const dominio = correo.trim().toLowerCase().split('@')[1] ?? ''
  if (/^(gmail|googlemail)\.com$/.test(dominio)) return 'google'
  if (/^(hotmail|outlook|live|msn)\.[a-z]{2,}(\.[a-z]{2,})?$/.test(dominio)) return 'microsoft'
  if (/^(yahoo|ymail|rocketmail)\.[a-z]{2,}(\.[a-z]{2,})?$/.test(dominio)) return 'yahoo'
  return undefined
}

/** Los canales que se le pueden ofrecer a la persona, con una pista que no revela el dato. */
export function canalesDisponibles(
  persona: PersonaBob,
  proveedores: { google: boolean; microsoft: boolean; yahoo: boolean },
): Array<{ tipo: Canal; pista: string }> {
  const canales: Array<{ tipo: Canal; pista: string }> = []
  if (celularParaCodigo(persona.celular)) canales.push({ tipo: 'sms', pista: pistaCelular(persona.celular) })
  if (persona.correo) {
    const proveedor = proveedorDelCorreo(persona.correo) // RN-167
    if (proveedor && proveedores[proveedor]) canales.push({ tipo: proveedor, pista: pistaCorreo(persona.correo) })
  }
  return canales
}

/** «••• 1234»: los ultimos cuatro digitos, que es lo que la persona reconoce. */
export function pistaCelular(celular: string): string {
  const digitos = celular.replace(/\D/g, '')
  return `••• ${digitos.slice(-4)}`
}

/** «m•••@gmail.com»: la primera letra y el dominio. */
export function pistaCorreo(correo: string): string {
  const [usuario, dominio] = correo.split('@')
  if (!usuario || !dominio) return '•••'
  return `${usuario[0]}•••@${dominio}`
}

/** RN-166 — ¿Ya se agotaron los intentos en la ventana? */
export function documentoBloqueado(fallidosEnVentana: number): boolean {
  return fallidosEnVentana >= MAXIMO_INTENTOS_FALLIDOS
}

/** RN-165 — Cuando vence una sesion creada ahora. */
export function vencimientoSesion(creadaEn: Date, horas: number): Date {
  return new Date(creadaEn.getTime() + horas * 3_600_000)
}

export function hoyISO(ahora: Date = new Date()): string {
  return ahora.toISOString().slice(0, 10)
}
