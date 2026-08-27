/**
 * Cascaron de la consola de administracion (escritorio).
 * CU-A-01 … CU-A-09 se renderizan dentro del <Outlet>.
 */

import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { nombreCompleto } from '../datos/selectores'
import { Logotipo } from './Logotipo'
import { Icono, type NombreIcono } from './Icono'
import { AvisoGlobal } from './Aviso'

const SECCIONES: Array<{ ruta: string; texto: string; icono: NombreIcono; exacta?: boolean }> = [
  { ruta: '/admin', texto: 'Tablero', icono: 'tablero', exacta: true },
  { ruta: '/admin/unidades', texto: 'Unidades', icono: 'unidades' },
  { ruta: '/admin/cartera', texto: 'Cartera', icono: 'cartera' },
  { ruta: '/admin/reservas', texto: 'Reservas', icono: 'reservas' },
  { ruta: '/admin/pqrs', texto: 'PQRS', icono: 'pqrs' },
  { ruta: '/admin/comunicados', texto: 'Comunicados', icono: 'comunicados' },
  { ruta: '/admin/correspondencia', texto: 'Correspondencia', icono: 'correspondencia' },
]

const TITULOS: Record<string, string> = {
  '/admin': 'Tablero de la copropiedad',
  '/admin/unidades': 'Unidades y residentes',
  '/admin/cartera': 'Cartera',
  '/admin/reservas': 'Reservas por aprobar',
  '/admin/pqrs': 'Bandeja de PQRS',
  '/admin/comunicados': 'Comunicados',
  '/admin/correspondencia': 'Correspondencia',
}

export function LayoutAdmin() {
  const { bd, reiniciarDemo } = useDatos()
  const { sesion, cerrar } = useSesion()
  const { pathname } = useLocation()

  if (!sesion) return null

  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const persona = sel.persona(bd, sesion.personaId)

  return (
    <div className="consola">
      <aside className="lateral">
        <div className="lateral__marca">
          <Logotipo inverso />
          <span className="lateral__marca-sub">{copropiedad?.nombre}</span>
        </div>

        <nav className="lateral__nav">
          {SECCIONES.map((seccion) => (
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
          <div>Administradora</div>
        </div>
      </aside>

      <div className="consola__principal">
        <header className="consola__barra">
          <h1 className="titulo">{TITULOS[pathname] ?? 'Consola'}</h1>
          <div className="grupo-botones">
            <button className="boton boton--pequeno" onClick={reiniciarDemo} title="Vuelve los datos del demo a su estado inicial">
              <Icono nombre="reiniciar" tamano={14} />
              Reiniciar demo
            </button>
            <button className="boton boton--pequeno" onClick={cerrar}>
              <Icono nombre="salir" tamano={14} />
              Salir
            </button>
          </div>
        </header>

        <div className="consola__contenido">
          <Outlet />
        </div>
      </div>

      <AvisoGlobal />
    </div>
  )
}
