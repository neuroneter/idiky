/**
 * Estado del acceso, **simulado** (ADR-0004).
 *
 * Guarda dos cosas por navegador: que cuentas se activaron y si este dispositivo
 * ya es conocido. Con eso alcanza para que el demo muestre el flujo que decidio
 * el equipo el 2026-08-28:
 *
 *   la administracion vincula la unidad (CU-A-02)
 *   -> la persona activa su cuenta con su documento (CU-R-25)
 *   -> entra con documento y contrasena (CU-R-01)
 *   -> en un telefono nuevo, ademas, un codigo de un solo uso (RN-54)
 *
 * **Aqui no se guarda ninguna contrasena, ni cifrada ni en claro.** No es un
 * descuido, es lo contrario: guardar credenciales de mentira ensena la forma
 * equivocada, y en la fase 2 esto lo hace un servidor. El demo comprueba que la
 * contrasena tenga la longitud minima y nada mas; la pantalla lo dice en voz alta
 * para que nadie confunda el demo con un sistema de autenticacion.
 */

const CLAVE_ACTIVADAS = 'idiky.demo.cuentas-activadas'
const CLAVE_DISPOSITIVO = 'idiky.demo.dispositivo-conocido'

/** Longitud minima de la contrasena en el demo. */
export const MINIMO_CONTRASENA = 6

/** Digitos del codigo de un solo uso. */
export const DIGITOS_CODIGO = 6

function leerLista(clave: string): string[] {
  try {
    const bruto = window.localStorage.getItem(clave)
    return bruto ? (JSON.parse(bruto) as string[]) : []
  } catch {
    return []
  }
}

function guardarLista(clave: string, valores: string[]): void {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valores))
  } catch {
    // Modo privado: la activacion vale solo mientras la pestana este abierta.
  }
}

export function cuentaActivada(personaId: string): boolean {
  return leerLista(CLAVE_ACTIVADAS).includes(personaId)
}

export function activarCuenta(personaId: string): void {
  const activadas = leerLista(CLAVE_ACTIVADAS)
  if (!activadas.includes(personaId)) guardarLista(CLAVE_ACTIVADAS, [...activadas, personaId])
}

/**
 * RN-54 — En un dispositivo nuevo se pide un codigo ademas de la contrasena.
 *
 * «Conocido» es por persona y por navegador: que un familiar haya entrado en este
 * telefono no vuelve conocido el mio.
 */
export function dispositivoConocido(personaId: string): boolean {
  return leerLista(CLAVE_DISPOSITIVO).includes(personaId)
}

export function recordarDispositivo(personaId: string): void {
  const conocidos = leerLista(CLAVE_DISPOSITIVO)
  if (!conocidos.includes(personaId)) guardarLista(CLAVE_DISPOSITIVO, [...conocidos, personaId])
}

/**
 * Codigo de un solo uso.
 *
 * En la version real lo genera el servidor y lo manda por SMS, WhatsApp o correo.
 * Aqui se genera en el navegador y **se muestra en pantalla**, porque un demo que
 * pide un codigo que nunca llega no se puede mostrar a nadie.
 */
export function generarCodigo(): string {
  let codigo = ''
  for (let i = 0; i < DIGITOS_CODIGO; i += 1) {
    codigo += Math.floor(Math.random() * 10)
  }
  return codigo
}

/**
 * Deja el documento en su forma comparable: sin puntos, espacios ni guiones.
 *
 * La gente escribe su cedula de las dos maneras —1.010.000.000 y 1010000000— y
 * las dos son la misma. Fallar por un punto seria una barrera absurda justo en la
 * puerta.
 */
export function normalizarDocumento(documento: string): string {
  return documento.replace(/[\s.,-]/g, '')
}
