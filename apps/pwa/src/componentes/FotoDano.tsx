/** CU-R-40 — Dónde está el daño y su foto, dentro de la PQRS. El mismo en las dos caras. */

import type { Pqrs } from '../dominio/tipos'

export function FotoDano({ pqrs }: { pqrs: Pqrs }) {
  if (!pqrs.foto && !pqrs.ubicacion) return null
  return (
    <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e2)' }}>
      {pqrs.ubicacion && (
        <span className="subtitulo">
          <strong>Dónde:</strong> {pqrs.ubicacion}
        </span>
      )}
      {pqrs.foto && (
        <img
          src={pqrs.foto.imagen}
          alt={`Foto del daño${pqrs.ubicacion ? ` en ${pqrs.ubicacion}` : ''}`}
          style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 'var(--radio-sm)', border: '1px solid var(--color-borde)' }}
        />
      )}
    </div>
  )
}
