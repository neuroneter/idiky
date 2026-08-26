/** Hoja modal reutilizable: en movil sube desde abajo, en escritorio se centra. */

import type { ReactNode } from 'react'
import { Icono } from './Icono'

export function Modal({
  titulo,
  descripcion,
  children,
  onCerrar,
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
  onCerrar: () => void
}) {
  return (
    <div
      className="fondo-modal"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div className="modal">
        <div className="fila" style={{ marginBottom: 'var(--e4)' }}>
          <div className="columna">
            <h2 className="titulo">{titulo}</h2>
            {descripcion && <p className="subtitulo">{descripcion}</p>}
          </div>
          <button className="boton boton--fantasma" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
