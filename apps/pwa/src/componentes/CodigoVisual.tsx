/**
 * CU-R-10 — Representacion visual del codigo de visitante.
 *
 * ATENCION (ADR-0005): esto NO es un codigo QR valido. Es un patron
 * determinista generado a partir del codigo, con apariencia de QR, para las
 * demostraciones. Cuando exista el lector de porteria (fase 3) este componente
 * se reemplaza por un generador de QR real sin tocar el caso de uso.
 */

import type { ReactElement } from 'react'

const MODULOS = 21

/** Hash estable de una cadena, para que un mismo codigo genere siempre el mismo patron. */
function hash(texto: string, semilla: number): number {
  let valor = semilla
  for (let i = 0; i < texto.length; i += 1) {
    valor = (valor * 31 + texto.charCodeAt(i)) >>> 0
  }
  return valor
}

function esModuloActivo(codigo: string, fila: number, columna: number): boolean {
  return hash(`${codigo}:${fila}:${columna}`, 2166136261) % 100 < 47
}

/**
 * Los tres cuadros de referencia de las esquinas.
 * Devuelve `true` si el modulo se pinta, `false` si esta dentro del ojo pero
 * vacio, y `null` si la celda no pertenece a ningun ojo.
 */
function enOjo(fila: number, columna: number): boolean | null {
  const esquinas = [
    [0, 0],
    [0, MODULOS - 7],
    [MODULOS - 7, 0],
  ]
  for (const [f, c] of esquinas) {
    const df = fila - f
    const dc = columna - c
    if (df < 0 || dc < 0 || df > 6 || dc > 6) continue
    const borde = df === 0 || df === 6 || dc === 0 || dc === 6
    const centro = df >= 2 && df <= 4 && dc >= 2 && dc <= 4
    return borde || centro
  }
  return null
}

export function CodigoVisual({ codigo, tamano = 168 }: { codigo: string; tamano?: number }) {
  const celdas: ReactElement[] = []

  for (let fila = 0; fila < MODULOS; fila += 1) {
    for (let columna = 0; columna < MODULOS; columna += 1) {
      const ojo = enOjo(fila, columna)
      const activo = ojo === null ? esModuloActivo(codigo, fila, columna) : ojo
      if (!activo) continue
      celdas.push(
        <rect
          key={`${fila}-${columna}`}
          x={columna}
          y={fila}
          width={1}
          height={1}
          rx={0.18}
          fill="currentColor"
        />,
      )
    }
  }

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`-1 -1 ${MODULOS + 2} ${MODULOS + 2}`}
      role="img"
      aria-label={`Codigo visual del visitante ${codigo}`}
      style={{ color: 'var(--color-texto)', background: '#fff', borderRadius: 'var(--radio-sm)' }}
    >
      {celdas}
    </svg>
  )
}
