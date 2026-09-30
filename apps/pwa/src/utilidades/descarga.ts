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

/** Cómo terminó la descarga, para decírselo a quien la pidió. */
export type ResultadoDescarga = 'descargado' | 'cancelado' | 'no_disponible'

interface VisorClaude {
  use?: (nombre: string) => Promise<{ save: (p: { filename: string; data: string }) => Promise<unknown> } | null>
}

export async function descargarCsv(nombreArchivo: string, filas: Celda[][]): Promise<ResultadoDescarga> {
  const contenido = '\uFEFF' + textoCsv(filas)
  const visor = (window as unknown as { claude?: VisorClaude }).claude
  if (visor?.use) {
    const descargas = await visor.use('downloads').catch(() => null)
    if (!descargas) return 'no_disponible'
    try {
      await descargas.save({ filename: nombreArchivo, data: contenido })
      return 'descargado'
    } catch (error) {
      return (error as { code?: string }).code === 'declined' ? 'cancelado' : 'no_disponible'
    }
  }
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
  return 'descargado'
}
