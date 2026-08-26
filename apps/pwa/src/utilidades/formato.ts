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

/** `2026-08-26` -> `26 de agosto de 2026`. Sin depender de la zona horaria. */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  const indiceMes = Number(mes) - 1
  if (!anio || Number.isNaN(indiceMes) || !MESES[indiceMes]) return iso
  return `${Number(dia)} de ${MESES[indiceMes]} de ${anio}`
}

/** `2026-08-26` -> `26 ago`. Para listas compactas. */
export function formatearFechaCorta(iso: string): string {
  const [, mes, dia] = iso.slice(0, 10).split('-')
  const indiceMes = Number(mes) - 1
  if (!MESES[indiceMes]) return iso
  return `${Number(dia)} ${MESES[indiceMes].slice(0, 3)}`
}

export function formatearFechaHora(iso: string): string {
  const fecha = formatearFechaCorta(iso)
  const hora = iso.slice(11, 16)
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
