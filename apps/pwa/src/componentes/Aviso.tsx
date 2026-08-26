/** Mensaje efimero global. Se alimenta de `useDatos().aviso`. */

import { useDatos } from '../estado/DatosContext'

export function AvisoGlobal() {
  const { aviso, ocultarAviso } = useDatos()
  if (!aviso) return null
  return (
    <div className={`aviso aviso--${aviso.tipo}`} role="status" onClick={ocultarAviso}>
      {aviso.texto}
    </div>
  )
}
