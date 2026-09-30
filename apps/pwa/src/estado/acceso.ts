/**
 * Lo que la puerta de la app necesita saber, por fuera de los datos de la
 * copropiedad — CU-R-01.
 *
 * **Desde el 2026-10-01 no hay clave.** Mary: «necesitamos que el ingreso sea
 * con su correo autenticado o con SMS, como funciona ahora la mayoria de
 * ingresos». La persona se identifica con su documento, su celular o su
 * correo, elige por donde recibir un **codigo de un solo uso** y entra con
 * el. La primera vez, eso mismo activa la cuenta: no hay activacion ni
 * recuperacion aparte (RN-53, RN-54). Es lo mismo que BLOKY ya hace con el
 * administrador (CU-B-01).
 *
 * **Aqui no se guarda ninguna credencial.** El codigo se genera en el
 * navegador y se muestra en pantalla, porque un demo que pide un codigo que
 * nunca llega no se puede mostrar a nadie (ADR-0004). En la fase 2 lo genera
 * y lo envia el servidor (T-18). La huella si es real (RN-56): la registra y
 * la comprueba el aparato, en `servicios/plataforma.ts`.
 */

import type { Persona } from '../dominio/tipos'

const CLAVE_ULTIMA = 'idiky.demo.ultima-persona'

/** Digitos del codigo de un solo uso. */
export const DIGITOS_CODIGO = 6

/** Minutos que vale un codigo. Despues hay que pedir otro. */
export const VIGENCIA_CODIGO_MINUTOS = 10

/** Intentos con el mismo codigo. Agotados, hay que pedir otro. */
export const INTENTOS_CODIGO = 5

export type CanalCodigo = 'sms' | 'correo'

/**
 * Por donde puede recibir el codigo esta persona: solo los canales que tiene
 * registrados. Sin celular ni correo no hay por donde entrar, y eso se le
 * dice (RN-53: quien la registro tiene que completarle el dato).
 */
export function canalesDe(persona: Persona): Array<{ canal: CanalCodigo; destino: string }> {
  const canales: Array<{ canal: CanalCodigo; destino: string }> = []
  if (persona.telefono?.trim()) canales.push({ canal: 'sms', destino: enmascararCelular(persona.telefono) })
  if (persona.email?.trim()) canales.push({ canal: 'correo', destino: enmascararCorreo(persona.email) })
  return canales
}

/** «···2233»: lo justo para reconocer el numero sin mostrarlo entero. */
export function enmascararCelular(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '')
  return digitos.length <= 4 ? '···' + digitos : '···' + digitos.slice(-4)
}

/** «m···a@gmail.com»: la primera y la ultima letra, y el dominio. */
export function enmascararCorreo(correo: string): string {
  const [usuario, dominio] = correo.trim().toLowerCase().split('@')
  if (!dominio) return '···'
  const visible = usuario.length <= 2 ? usuario[0] + '···' : `${usuario[0]}···${usuario[usuario.length - 1]}`
  return `${visible}@${dominio}`
}

/**
 * Codigo de un solo uso.
 *
 * En la version real lo genera el servidor y lo manda por SMS, WhatsApp o
 * correo. Aqui se genera en el navegador y **se muestra en pantalla**.
 */
export function generarCodigo(): string {
  let codigo = ''
  for (let i = 0; i < DIGITOS_CODIGO; i += 1) {
    codigo += Math.floor(Math.random() * 10)
  }
  return codigo
}

/** El codigo sigue valiendo si no han pasado los minutos de vigencia. */
export function codigoVigente(emitidoEn: number, ahora: number = Date.now()): boolean {
  return ahora - emitidoEn < VIGENCIA_CODIGO_MINUTOS * 60_000
}

/**
 * Deja el documento en su forma comparable: sin puntos, espacios ni guiones.
 *
 * La gente escribe su cedula de las dos maneras —1.010.000.000 y 1010000000— y
 * las dos son la misma. Fallar por un punto seria una barrera absurda justo en
 * la puerta.
 */
export function normalizarDocumento(documento: string): string {
  return documento.replace(/[\s.,-]/g, '')
}

/**
 * Quien es, a partir de lo que escribio: documento, celular o correo.
 *
 * Un solo campo y no tres, porque la persona no tiene por que saber con cual
 * de los tres la registraron. Si escribio un correo se compara como correo; si
 * escribio numeros, contra el documento y contra el celular.
 */
export function identificarPersona(personas: Persona[], texto: string): Persona | undefined {
  const limpio = texto.trim().toLowerCase()
  if (!limpio) return undefined
  if (limpio.includes('@')) {
    return personas.find((p) => p.email?.trim().toLowerCase() === limpio)
  }
  const digitos = limpio.replace(/\D/g, '')
  if (!digitos) return undefined
  return (
    personas.find((p) => normalizarDocumento(p.documento) === digitos) ??
    personas.find((p) => p.telefono && p.telefono.replace(/\D/g, '').endsWith(digitos) && digitos.length >= 7)
  )
}

/**
 * Quien entro por ultima vez en este telefono.
 *
 * Con esto la puerta deja de pedir el documento cada vez: muestra el nombre y
 * ofrece la huella (RN-56) o un codigo nuevo. Es del telefono, no de la
 * cuenta: no viaja, no se sincroniza y se borra con los datos del navegador.
 */
export function recordarUltimaPersona(personaId: string): void {
  try {
    window.localStorage.setItem(CLAVE_ULTIMA, personaId)
  } catch {
    // Modo privado: la proxima vez se pide el documento, que siempre funciona.
  }
}

export function ultimaPersona(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_ULTIMA)
  } catch {
    return null
  }
}

export function olvidarUltimaPersona(): void {
  try {
    window.localStorage.removeItem(CLAVE_ULTIMA)
  } catch {
    // Nada que olvidar.
  }
}
