/**
 * «Hay una version nueva» — el aviso para quien tiene la app abierta cuando
 * alguien despliega.
 *
 * Sin esto, la persona sigue con la version vieja hasta que cierre la app, y
 * «a mi no me sale» es la primera llamada que recibe la administracion. Se
 * dice y se ofrece el boton; no se recarga sola, porque podria estar a mitad
 * de un formulario.
 */

import { useEffect, useState } from 'react'
import { vigilarRevision } from '../servicios/version'

export function AvisoVersionNueva() {
  const [nueva, setNueva] = useState<string | null>(null)

  useEffect(() => vigilarRevision(setNueva), [])

  if (!nueva) return null

  return (
    <div className="aviso aviso--version" role="status">
      <span>
        Hay una versión nueva de Idiky (<span className="numerico">{nueva}</span>).
      </span>
      <button className="boton boton--pequeno" onClick={() => window.location.reload()}>
        Actualizar
      </button>
    </div>
  )
}
