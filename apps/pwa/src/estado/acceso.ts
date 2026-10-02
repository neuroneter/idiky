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
 * **Aqui no se guarda ninguna clave, ni cifrada ni en claro.** No es un descuido,
 * es lo contrario: guardar credenciales de mentira ensena la forma equivocada, y
 * en la fase 2 esto lo hace un servidor. El demo comprueba que la clave tenga los
 * digitos que debe y nada mas; la pantalla lo dice en voz alta para que nadie
 * confunda el demo con un sistema de autenticacion.
 */

const CLAVE_ACTIVADAS = 'idiky.demo.cuentas-activadas'
const CLAVE_DISPOSITIVO = 'idiky.demo.dispositivo-conocido'
const CLAVE_ULTIMA = 'idiky.demo.ultima-persona'

/**
 * Digitos de la clave de acceso.
 *
 * Cuatro, no una contrasena larga (Mary, 2026-08-28): **la app la usan adultos
 * mayores**, y una contrasena con mayusculas y simbolos en un teclado de telefono
 * es la barrera que hace que la persona deje de entrar y vuelva a llamar a la
 * administracion.
 *
 * La seguridad no se baja, se **mueve de sitio**. Cuatro digitos son debiles si
 * cualquiera puede probarlos mil veces contra un servidor; aqui no puede:
 *
 *  - la clave **solo sirve en un dispositivo ya probado** con un codigo de un
 *    solo uso (RN-54);
 *  - **los intentos se acaban** (`INTENTOS_MAXIMOS`), y despues hay que volver a
 *    probar la identidad con el codigo;
 *  - quien quiera, entra con **huella** y no teclea nada (RN-55).
 *
 * Es el mismo razonamiento de la clave del cajero: cuatro digitos bastan cuando
 * hacen falta la tarjeta y un numero limitado de intentos.
 */
export const DIGITOS_CLAVE = 4

/** Intentos seguidos antes de exigir el codigo de un solo uso otra vez. */
export const INTENTOS_MAXIMOS = 5

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

/**
 * Quien entro por ultima vez en este telefono.
 *
 * Con esto la puerta deja de pedir el documento cada vez: **una vez creada la
 * cuenta, solo se pide la contrasena** (Mary, 2026-08-28). El documento sirve
 * para reconocer a alguien que la app no conoce; volver a pedirselo a quien ya
 * entro aqui es hacerle teclear diez digitos por nada.
 *
 * Es del telefono, no de la cuenta: no viaja, no se sincroniza y se borra con
 * los datos del navegador.
 */
export function recordarUltimaPersona(personaId: string): void {
  try {
    window.localStorage.setItem(CLAVE_ULTIMA, personaId)
  } catch {
    // Modo privado: la proxima vez se pide el documento, que es el camino largo
    // pero siempre funciona.
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

/**
 * Intentos fallidos seguidos, por persona y por dispositivo.
 *
 * Es lo que sostiene que la clave pueda ser de cuatro digitos: sin limite de
 * intentos, cuatro digitos se prueban enteros en un rato.
 */
const CLAVE_INTENTOS = 'idiky.demo.intentos'

function leerIntentos(): Record<string, number> {
  try {
    const bruto = window.localStorage.getItem(CLAVE_INTENTOS)
    return bruto ? (JSON.parse(bruto) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export function intentosFallidos(personaId: string): number {
  return leerIntentos()[personaId] ?? 0
}

export function registrarFallo(personaId: string): number {
  const intentos = leerIntentos()
  const nuevos = (intentos[personaId] ?? 0) + 1
  try {
    window.localStorage.setItem(CLAVE_INTENTOS, JSON.stringify({ ...intentos, [personaId]: nuevos }))
  } catch {
    // Sin poder guardar el conteo, el limite no aplica en esta sesion.
  }
  return nuevos
}

export function limpiarFallos(personaId: string): void {
  const intentos = leerIntentos()
  delete intentos[personaId]
  try {
    window.localStorage.setItem(CLAVE_INTENTOS, JSON.stringify(intentos))
  } catch {
    // Nada que limpiar.
  }
}
