/**
 * Formateo para presentacion. Nunca se usa para almacenar datos:
 * los datos siempre viajan en ISO y en pesos enteros (docs/05-modelo-de-datos.md).
 */

const MONEDA = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatearDinero(valor: number): string {
  return MONEDA.format(valor)
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Lleva una cadena ISO a la fecha y hora **locales** del dispositivo.
 *
 * Hay dos clases de dato en el modelo y se tratan distinto a proposito:
 *
 *  - **Fecha sola** (`2026-08-26`): un dia del calendario, sin instante. Se parte la
 *    cadena y ya. Convertirla seria un error: `new Date('2026-08-26')` se interpreta
 *    como medianoche UTC y en Colombia mostraria el dia anterior.
 *  - **Instante completo** (`2026-08-27T01:30:00.000Z`): se guarda en UTC porque un
 *    instante es universal, pero **se muestra en la hora local**. Sin esta conversion,
 *    un pago hecho a las 8:30 p. m. del 26 en Bogota se veia como "27 ago, 01:30".
 */
function aLocal(iso: string): { fecha: string; hora: string } {
  if (!iso.includes('T')) return { fecha: iso.slice(0, 10), hora: '' }
  const instante = new Date(iso)
  if (Number.isNaN(instante.getTime())) {
    return { fecha: iso.slice(0, 10), hora: iso.slice(11, 16) }
  }
  const dosDigitos = (n: number) => String(n).padStart(2, '0')
  return {
    fecha: `${instante.getFullYear()}-${dosDigitos(instante.getMonth() + 1)}-${dosDigitos(
      instante.getDate(),
    )}`,
    hora: `${dosDigitos(instante.getHours())}:${dosDigitos(instante.getMinutes())}`,
  }
}

/** `2026-08-26` -> `26 de agosto de 2026`. */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = aLocal(iso).fecha.split('-')
  const indiceMes = Number(mes) - 1
  if (!anio || Number.isNaN(indiceMes) || !MESES[indiceMes]) return iso
  return `${Number(dia)} de ${MESES[indiceMes]} de ${anio}`
}

/** `2026-08-26` -> `26 ago`. Para listas compactas. */
export function formatearFechaCorta(iso: string): string {
  const [, mes, dia] = aLocal(iso).fecha.split('-')
  const indiceMes = Number(mes) - 1
  if (!MESES[indiceMes]) return iso
  return `${Number(dia)} ${MESES[indiceMes].slice(0, 3)}`
}

/** `2026-08-27T01:30:00.000Z` -> `26 ago, 20:30` en Bogota. */
export function formatearFechaHora(iso: string): string {
  const { hora } = aLocal(iso)
  const fecha = formatearFechaCorta(iso)
  return hora ? `${fecha}, ${hora}` : fecha
}

/** `2026-08` -> `agosto 2026`. */
export function formatearPeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-')
  const indiceMes = Number(mes) - 1
  if (!MESES[indiceMes]) return periodo
  return `${MESES[indiceMes]} ${anio}`
}

export function iniciales(nombres: string, apellidos: string): string {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
}

/** Primera letra en mayuscula, para etiquetas provenientes de valores tecnicos. */
export function capitalizar(texto: string): string {
  const limpio = texto.replace(/_/g, ' ')
  return limpio.charAt(0).toUpperCase() + limpio.slice(1)
}

const UNIDADES = [
  '',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciseis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
  'veintiuno',
  'veintidos',
  'veintitres',
  'veinticuatro',
  'veinticinco',
  'veintiseis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
  'treinta',
  'treinta y uno',
]

/**
 * `7` -> `siete`. Solo dias del mes (1 a 31), que es donde se usa.
 *
 * Los documentos formales escriben el dia con numero y letra —«a los 7 (siete)
 * dias»— porque un numero suelto se altera con un trazo y una palabra no.
 */
export function diaEnLetras(dia: number): string {
  return UNIDADES[dia] ?? String(dia)
}

/** Ultimo dia del mes de un periodo `AAAA-MM`, en ISO. */
export function finDePeriodo(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number)
  if (!anio || !mes) return periodo
  const ultimo = new Date(anio, mes, 0).getDate()
  return `${anio}-${String(mes).padStart(2, '0')}-${String(ultimo).padStart(2, '0')}`
}
