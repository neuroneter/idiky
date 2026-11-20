/**
 * CU-R-10 — El código del visitante como **QR real y escaneable** (PN-12).
 *
 * Desde el 2026-11-20 (ADR-0005, actualizado) es un QR de verdad, generado sin
 * librerías (`utilidades/qr.ts`): lleva el código alfanumérico, el mismo que
 * portería puede escribir a mano si no tiene cámara.
 */

import { useMemo } from 'react'
import { generarQr } from '../utilidades/qr'

/** El QR como SVG, con su margen blanco de cuatro módulos (lo exige la norma). */
export function svgDelQr(texto: string, escala = 8): string {
  const m = generarQr(texto)
  const n = m.length + 8
  let ruta = ''
  m.forEach((fila, y) =>
    fila.forEach((oscuro, x) => {
      if (oscuro) ruta += `M${x + 4} ${y + 4}h1v1h-1z`
    }),
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n * escala}" height="${n * escala}" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${ruta}" fill="#000"/></svg>`
}

export function CodigoVisual({ codigo, tamano = 200 }: { codigo: string; tamano?: number }) {
  const matriz = useMemo(() => generarQr(codigo), [codigo])
  const n = matriz.length + 8
  let ruta = ''
  matriz.forEach((fila, y) =>
    fila.forEach((oscuro, x) => {
      if (oscuro) ruta += `M${x + 4} ${y + 4}h1v1h-1z`
    }),
  )
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Código QR del visitante ${codigo}`}
      data-qr={codigo}
      style={{ background: '#fff', borderRadius: 'var(--radio-sm)' }}
    >
      <rect width={n} height={n} fill="#fff" />
      <path d={ruta} fill="#000" />
    </svg>
  )
}
