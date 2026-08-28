/**
 * Cascaron del puesto de porteria. CU-P-01 y CU-P-02 dentro del <Outlet>.
 *
 * Es la consola del administrador con **tres secciones y nada mas**, y esa es la
 * diferencia que importa: la porteria no ve cartera ni PQRS (RN-52). Quien cuida
 * la entrada suele trabajar para una empresa de vigilancia externa, y quien debe
 * cuanto no es asunto suyo.
 *
 * Lo que se ve sale de `puede()` en `reglas.ts`, no de una lista escrita a mano
 * en el menu: un permiso que solo existe como pestana escondida no es un permiso.
 *
 * **La sesion es del turno, no del telefono de nadie.** Por eso aqui no hay
 * «recordar este dispositivo» ni huella: el equipo de la porteria es compartido y
 * se turnan varias personas en el dia. Lo que en la app del propietario es
 * comodidad, aqui seria un agujero.
 */

import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { nombreCompleto } from '../datos/selectores'
import { puede } from '../dominio/reglas'
import { Logotipo } from './Logotipo'
import { Icono, type NombreIcono } from './Icono'
import { AvisoGlobal } from './Aviso'

const SECCIONES: Array<{
  ruta: string
  texto: string
  icono: NombreIcono
  permiso: string
  exacta?: boolean
}> = [
  { ruta: '/porteria', texto: 'El turno', icono: 'tablero', permiso: 'correspondencia', exacta: true },
  {
    ruta: '/porteria/visitantes',
    texto: 'Visitantes',
    icono: 'visitantes',
    permiso: 'visitantes:validar',
  },
  {
    ruta: '/porteria/correspondencia',
    texto: 'Correspondencia',
    icono: 'correspondencia',
    permiso: 'correspondencia',
  },
]

const TITULOS: Record<string, string> = {
  '/porteria': 'El turno',
  '/porteria/visitantes': 'Validar visitantes',
  '/porteria/correspondencia': 'Correspondencia',
}

export function LayoutPorteria() {
  const { bd } = useDatos()
  const { sesion, cerrar } = useSesion()
  const { pathname } = useLocation()

  if (!sesion) return null

  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const persona = sel.persona(bd, sesion.personaId)
  const secciones = SECCIONES.filter((seccion) => puede(sesion.rol, seccion.permiso))

  return (
    <div className="consola">
      <aside className="lateral">
        <div className="lateral__marca">
          <Logotipo inverso />
          <span className="lateral__marca-sub">{copropiedad?.nombre}</span>
        </div>

        <nav className="lateral__nav">
          {secciones.map((seccion) => (
            <NavLink
              key={seccion.ruta}
              to={seccion.ruta}
              end={seccion.exacta}
              className={({ isActive }) => `lateral__enlace${isActive ? ' activo' : ''}`}
            >
              <Icono nombre={seccion.icono} />
              <span>{seccion.texto}</span>
            </NavLink>
          ))}
        </nav>

        <div className="lateral__pie">
          <div>{nombreCompleto(persona)}</div>
          <div>Portería</div>
        </div>
      </aside>

      <div className="consola__principal">
        <header className="consola__barra">
          <h1 className="titulo">{TITULOS[pathname] ?? 'Portería'}</h1>
          {/* Sin «reiniciar demo»: borrar los datos de todos no es de la porteria. */}
          <button className="boton boton--pequeno" onClick={cerrar}>
            <Icono nombre="salir" tamano={14} />
            Cerrar turno
          </button>
        </header>

        <div className="consola__contenido">
          <Outlet />
        </div>
      </div>

      <AvisoGlobal />
    </div>
  )
}
