/**
 * Descargar una tabla como CSV que Excel en español abre bien.
 *
 * Excel configurado en español separa las columnas con punto y coma (la coma es
 * el separador decimal), y sin la marca BOM al comienzo muestra mal las tildes.
 * Por eso: `;` y `﻿`. Sin dependencias: un Blob y un enlace.
 */

type Celda = string | number

function celdaCsv(valor: Celda): string {
  const texto = String(valor)
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function textoCsv(filas: Celda[][]): string {
  return filas.map((fila) => fila.map(celdaCsv).join(';')).join('\r\n')
}

export function descargarCsv(nombreArchivo: string, filas: Celda[][]): void {
  const blob = new Blob(['﻿' + textoCsv(filas)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}
