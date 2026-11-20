/**
 * CU-R-10 · PN-12 — Compartir el código con el visitante.
 *
 * En el teléfono se comparte la imagen del QR con el texto (WhatsApp, correo…)
 * con la hoja de compartir del sistema. Si el aparato no puede compartir
 * imágenes, se manda el texto por WhatsApp: el código escrito también sirve.
 */

import { svgDelQr } from '../../componentes/CodigoVisual'
import { Icono } from '../../componentes/Icono'
import { formatearFecha } from '../../utilidades/formato'
import type { Visitante } from '../../dominio/tipos'

async function imagenDelQr(codigo: string): Promise<File | null> {
  try {
    const svg = new Blob([svgDelQr(codigo, 10)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(svg)
    const img = new Image()
    await new Promise((listo, error) => {
      img.onload = listo
      img.onerror = error
      img.src = url
    })
    const lienzo = document.createElement('canvas')
    lienzo.width = img.width
    lienzo.height = img.height
    lienzo.getContext('2d')?.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    const png = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, 'image/png'))
    return png ? new File([png], `acceso-${codigo}.png`, { type: 'image/png' }) : null
  } catch {
    return null
  }
}

export function CompartirCodigo({ visitante, edificio }: { visitante: Visitante; edificio: string }) {
  const texto =
    `Hola, ${visitante.nombre.split(' ')[0]}. Tu acceso a ${edificio}: muestra este código en portería: ` +
    `${visitante.codigo}. Válido hasta el ${formatearFecha(visitante.vigenciaHasta)}.`

  return (
    <button
      className="boton boton--primario boton--bloque"
      style={{ marginTop: 'var(--e3)' }}
      onClick={async () => {
        const archivo = await imagenDelQr(visitante.codigo)
        const navegador = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
        if (archivo && navegador.share && navegador.canShare?.({ files: [archivo] })) {
          try {
            await navegador.share({ files: [archivo], text: texto })
            return
          } catch {
            return
          }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
      }}
    >
      <Icono nombre="visitantes" tamano={18} />
      Compartir el código
    </button>
  )
}
