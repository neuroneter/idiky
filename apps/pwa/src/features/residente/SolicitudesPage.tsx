/**
 * Solicitudes — lo que el residente le pide a la administracion.
 * CU-R-05 y CU-R-06 (zonas comunes) · CU-R-07 y CU-R-08 (PQRS) · CU-R-12 (paz y salvo).
 *
 * Las tres vivian —o iban a vivir— en pestanas distintas de la barra inferior.
 * Mary las unifico bajo un solo icono el 2026-08-27, y la razon se sostiene sola:
 * reservar el salon, radicar una queja y pedir el paz y salvo son la misma
 * accion desde el lado de quien la hace, pedirle algo a la administracion.
 *
 * Los segmentos son navegacion, no filtros: cada uno tiene su propia ruta, para
 * que el boton "atras" del telefono devuelva donde uno espera y para poder
 * enlazar directo a uno (el inicio lo hace).
 */

import { NavLink, Outlet } from 'react-router-dom'

/**
 * Sin iconos, a proposito: con tres segmentos en 390 px, el icono le robaba el
 * ancho al texto y "Paz y salvo" se partia en dos lineas, que era justo el
 * segmento mas dificil de reconocer de un vistazo.
 */
const SEGMENTOS = [
  { ruta: 'reservas', texto: 'Reservas' },
  { ruta: 'pqrs', texto: 'PQRS' },
  { ruta: 'paz-y-salvo', texto: 'Paz y salvo' },
]

export function SolicitudesPage() {
  return (
    <>
      <nav className="segmentos" aria-label="Tipo de solicitud">
        {SEGMENTOS.map((segmento) => (
          <NavLink
            key={segmento.ruta}
            to={segmento.ruta}
            /* El estado activo se pinta con `aria-current`, que NavLink ya pone: una
               clase mas seria decir dos veces lo mismo, y la que se le escapa a
               alguien es siempre la del lector de pantalla. */
            className="segmento"
          >
            {segmento.texto}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}
