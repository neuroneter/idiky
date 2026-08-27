/**
 * Boton para regresar a la pantalla anterior en la app del residente.
 *
 * Existe porque tres pantallas —mi unidad, visitantes y correspondencia— se abren
 * desde los accesos directos del inicio y **no tienen pestana en la barra
 * inferior**: sin esto, la unica salida era acertarle a la pestana de inicio.
 *
 * El area tocable es de 44 px de alto como minimo, que es el tamano recomendado
 * para el dedo. El boton anterior tenia `padding: 0` y medida unos 21 px: para el
 * extremo de 60 anos del publico (docs/08-convenciones.md) eso es dificil de
 * acertar.
 */

import { Link } from 'react-router-dom'
import { Icono } from './Icono'

export function BotonVolver({
  a = '/app',
  texto = 'Inicio',
}: {
  /** Ruta de destino. Por defecto el inicio. */
  a?: string
  /** A donde dice que vuelve. Nombrar el destino evita el "¿volver a que?". */
  texto?: string
}) {
  return (
    <Link to={a} className="boton-volver" aria-label={`Volver a ${texto.toLowerCase()}`}>
      <Icono nombre="volver" tamano={18} />
      {texto}
    </Link>
  )
}
