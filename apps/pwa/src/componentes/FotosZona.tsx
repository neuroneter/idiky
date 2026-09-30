/**
 * Las fotos de una zona común: la tira de miniaturas y la foto grande al tocar.
 *
 * Es el mismo componente en las dos caras (RN-104): el residente las mira
 * antes de reservar, el administrador las mira mientras las carga. Sin fotos
 * no dibuja nada, salvo que se le pida decirlo.
 */

import { useState } from 'react'
import type { Soporte } from '../dominio/tipos'

export function FotosZona({
  fotos,
  nombre,
  alQuitar,
  vacio,
}: {
  fotos: Soporte[] | undefined
  nombre: string
  /** Solo en la consola: quitar una foto (configuración, RN-104). */
  alQuitar?: (foto: Soporte) => void
  /** Qué decir cuando no hay fotos. Sin esto, no se dibuja nada. */
  vacio?: string
}) {
  const [grande, setGrande] = useState<Soporte | null>(null)
  const lista = fotos ?? []

  if (lista.length === 0) {
    return vacio ? <span className="subtitulo">{vacio}</span> : null
  }

  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      <div className="fotos-zona">
        {lista.map((foto, i) => (
          <div key={foto.adjuntadoEn + i} className="fotos-zona__miniatura">
            <button
              type="button"
              onClick={() => setGrande(grande?.adjuntadoEn === foto.adjuntadoEn ? null : foto)}
              aria-label={`Ver foto ${i + 1} de ${nombre}`}
            >
              <img src={foto.imagen} alt={`${nombre}, foto ${i + 1}`} />
            </button>
            {alQuitar && (
              <button
                type="button"
                className="boton boton--pequeno boton--peligro fotos-zona__quitar"
                onClick={() => alQuitar(foto)}
              >
                Quitar
              </button>
            )}
          </div>
        ))}
      </div>
      {grande && (
        <button
          type="button"
          className="fotos-zona__grande"
          onClick={() => setGrande(null)}
          aria-label="Cerrar la foto"
        >
          <img src={grande.imagen} alt={`${nombre}, ampliada`} />
        </button>
      )}
    </div>
  )
}
