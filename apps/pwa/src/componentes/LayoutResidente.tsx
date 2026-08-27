/**
 * Cascaron de la app movil del residente.
 * CU-R-01 (unidad activa) · CU-R-02 … CU-R-11 y CU-R-24 se renderizan dentro del <Outlet>.
 */

import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { etiquetaUnidad } from '../dominio/reglas'
import { iniciales } from '../utilidades/formato'
import { Icono, type NombreIcono } from './Icono'
import { Logotipo } from './Logotipo'
import { Modal } from './Modal'
import { AvisoGlobal } from './Aviso'

const PESTANAS: Array<{ ruta: string; texto: string; icono: NombreIcono; exacta?: boolean }> = [
  { ruta: '/app', texto: 'Inicio', icono: 'inicio', exacta: true },
  { ruta: '/app/cuenta', texto: 'Cuenta', icono: 'cuenta' },
  { ruta: '/app/reservas', texto: 'Reservas', icono: 'reservas' },
  { ruta: '/app/pqrs', texto: 'PQRS', icono: 'pqrs' },
  { ruta: '/app/comunicados', texto: 'Cartelera', icono: 'comunicados' },
]

/**
 * Titulo de cada pantalla. `/app` no esta aqui a proposito: en el inicio la barra
 * muestra el logotipo en vez del titulo, porque decir "Inicio" cuando ya estas en
 * el inicio no informa nada, y esa es la unica cara de la app del residente donde
 * la marca alcanza a verse.
 */
const TITULOS: Record<string, string> = {
  '/app/cuenta': 'Estado de cuenta',
  '/app/cuenta/pagar': 'Pagar',
  '/app/reservas': 'Zonas comunes',
  '/app/pqrs': 'Peticiones y quejas',
  '/app/comunicados': 'Cartelera',
  '/app/visitantes': 'Visitantes',
  '/app/correspondencia': 'Correspondencia',
  '/app/unidad': 'Mi unidad',
}

export function LayoutResidente() {
  const { bd } = useDatos()
  const { sesion, cerrar, cambiarUnidadActiva } = useSesion()
  const { pathname } = useLocation()
  const [eligiendoUnidad, setEligiendoUnidad] = useState(false)

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const unidadActiva = sel.unidad(bd, sesion.unidadActivaId)
  const misResidencias = sel.residenciasDePersona(bd, sesion.personaId)

  return (
    <div className="app-movil">
      <header className="barra-superior">
        <div className="barra-superior__fila">
          {/* La marca encabeza la barra y debajo va donde estas. Queda en el
              mismo sitio en todas las pantallas: una marca que cambia de lado
              segun la vista no se memoriza, y la esquina derecha es la zona de
              controles (unidad y avatar), que no es donde va un logotipo. */}
          <div className="columna">
            <Logotipo inverso tamano="var(--texto-sm)" />
            <span className="barra-superior__titulo">
              {pathname === '/app'
                ? `Hola, ${persona?.nombres.split(' ')[0] ?? 'residente'}`
                : (TITULOS[pathname] ?? 'Idiky')}
            </span>
          </div>
          <div className="fila" style={{ gap: 'var(--e2)' }}>
            <button
              className="selector-unidad"
              onClick={() => misResidencias.length > 1 && setEligiendoUnidad(true)}
              title={
                misResidencias.length > 1 ? 'Cambiar de unidad' : 'Tu unidad en la copropiedad'
              }
            >
              {unidadActiva ? etiquetaUnidad(unidadActiva) : 'Sin unidad'}
              {misResidencias.length > 1 && <Icono nombre="chevron" tamano={12} />}
            </button>
            <button className="avatar" onClick={cerrar} title="Cerrar sesion">
              {persona ? iniciales(persona.nombres, persona.apellidos) : '··'}
            </button>
          </div>
        </div>
      </header>

      <main className="contenido-movil">
        <Outlet />
      </main>

      <nav className="nav-inferior">
        {PESTANAS.map((pestana) => (
          <NavLink
            key={pestana.ruta}
            to={pestana.ruta}
            end={pestana.exacta}
            className={({ isActive }) =>
              `nav-inferior__enlace${isActive ? ' activo' : ''}`
            }
          >
            <Icono nombre={pestana.icono} />
            <span>{pestana.texto}</span>
          </NavLink>
        ))}
      </nav>

      <AvisoGlobal />

      {eligiendoUnidad && (
        <Modal
          titulo="Cambiar de unidad"
          descripcion="Todo lo que veas corresponde a la unidad activa."
          onCerrar={() => setEligiendoUnidad(false)}
        >
          <div className="lista">
            {misResidencias.map((residencia) => {
              const unidad = sel.unidad(bd, residencia.unidadId)
              if (!unidad) return null
              const activa = unidad.id === sesion.unidadActivaId
              return (
                <button
                  key={residencia.id}
                  className="tarjeta tarjeta--accion"
                  onClick={() => {
                    cambiarUnidadActiva(unidad.id)
                    setEligiendoUnidad(false)
                  }}
                >
                  <div className="fila">
                    <div className="columna">
                      <strong>{etiquetaUnidad(unidad)}</strong>
                      <span className="subtitulo">Como {residencia.rol}</span>
                    </div>
                    {activa && <span className="chip chip--marca">Activa</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </Modal>
      )}
    </div>
  )
}
