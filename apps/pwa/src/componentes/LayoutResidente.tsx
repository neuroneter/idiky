/**
 * Cascaron de la app movil del residente.
 * CU-R-01 (unidad activa) · CU-R-02 … CU-R-11 y CU-R-24 se renderizan dentro del <Outlet>.
 */

import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { nombreCompleto } from '../datos/selectores'
import { etiquetaUnidad, solicitudesEsperandoRespuesta } from '../dominio/reglas'
import { capitalizar, iniciales } from '../utilidades/formato'
import { Icono, type NombreIcono } from './Icono'
import { Logotipo } from './Logotipo'
import { Modal } from './Modal'
import { AvisoGlobal } from './Aviso'

/**
 * Cinco pestanas, que es el maximo que caben sin que el texto se parta.
 *
 * Reservas y PQRS se unificaron en "Solicitudes" el 2026-08-27 para hacerle sitio
 * a Asambleas (Mary). Es mejor reparto que el anterior: reservar el salon y
 * radicar una queja son la misma accion —pedirle algo a la administracion— y no
 * merecian dos pestanas, mientras que la asamblea, que es donde el copropietario
 * decide, no tenia ninguna.
 */
const PESTANAS: Array<{ ruta: string; texto: string; icono: NombreIcono; exacta?: boolean }> = [
  { ruta: '/app', texto: 'Inicio', icono: 'inicio', exacta: true },
  { ruta: '/app/cuenta', texto: 'Cuenta', icono: 'cuenta' },
  { ruta: '/app/solicitudes', texto: 'Solicitudes', icono: 'solicitudes' },
  { ruta: '/app/asambleas', texto: 'Asambleas', icono: 'asambleas' },
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
  '/app/solicitudes/reservas': 'Zonas comunes',
  '/app/solicitudes/pqrs': 'Peticiones y quejas',
  '/app/solicitudes/paz-y-salvo': 'Paz y salvo',
  '/app/asambleas': 'Asambleas',
  '/app/comunicados': 'Cartelera',
  '/app/visitantes': 'Visitantes',
  '/app/correspondencia': 'Correspondencia',
  '/app/unidad': 'Mi unidad',
}

/**
 * El titulo de la barra para una ruta.
 *
 * El detalle de una asamblea lleva id en la ruta, asi que no puede salir de una
 * tabla fija. Antes de esto la barra decia "Idiky" en cualquier pantalla que no
 * estuviera en la lista, que es como no decir nada.
 */
function tituloDe(pathname: string): string {
  if (TITULOS[pathname]) return TITULOS[pathname]
  if (pathname.startsWith('/app/asambleas/')) return 'Asamblea'
  if (pathname.startsWith('/app/solicitudes')) return 'Solicitudes'
  return 'Idiky'
}

export function LayoutResidente() {
  const { bd } = useDatos()
  const { sesion, cerrar, cambiarUnidadActiva } = useSesion()
  const { pathname } = useLocation()
  const [eligiendoUnidad, setEligiendoUnidad] = useState(false)
  const [viendoPerfil, setViendoPerfil] = useState(false)

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const unidadActiva = sel.unidad(bd, sesion.unidadActivaId)
  const misResidencias = sel.residenciasDePersona(bd, sesion.personaId)
  const miRol = misResidencias.find((r) => r.unidadId === sesion.unidadActivaId)?.rol

  // El inicio tenia un acceso directo a Solicitudes con este mismo numero, al lado
  // de una pestana que llevaba al mismo sitio. Se quito el acceso directo y el dato
  // se quedo aqui, que es donde hay una sola puerta (Mary, 2026-08-27).
  const pendientes = solicitudesEsperandoRespuesta(
    sel.pqrsDeUnidad(bd, sesion.unidadActivaId),
    sel.reservasDeUnidad(bd, sesion.unidadActivaId),
  )

  return (
    <div className="app-movil app-movil--marca">
      {/* Zona de marca: el degradado es el fondo de toda la app del residente, fijo
          a la pantalla. La silueta de torres es la copropiedad misma, dibujada
          con el mismo trazo del logotipo. */}
      <div className="zona-marca" aria-hidden="true">
        <svg className="zona-marca__siluetas" viewBox="0 0 320 150" fill="none">
          <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
            <path d="M12 150V54l30-20 30 20v96M42 150v-30h18v30" />
            <path d="M96 150V78l26-17 26 17v72M122 150v-24h14v24" />
            <path d="M172 150V42l34-22 34 22v108M206 150v-34h20v34" />
            <path d="M260 150V88l24-16 24 16v62" />
            <path d="M0 150h320" />
          </g>
        </svg>
      </div>

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
                : tituloDe(pathname)}
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
            {/* El circulo abre el perfil, no cierra la sesion. Antes cerraba de
                un toque y sin preguntar, y al leerse como un avatar la gente
                esperaba justo lo contrario: ver quien es. La salida esta dentro,
                que es un paso deliberado para algo irreversible. */}
            <button
              className="avatar"
              onClick={() => setViendoPerfil(true)}
              aria-label="Tu perfil"
            >
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
            <span className="nav-inferior__icono">
              <Icono nombre={pestana.icono} />
              {pestana.ruta === '/app/solicitudes' && pendientes > 0 && (
                <span className="nav-inferior__contador" aria-hidden="true">
                  {pendientes}
                </span>
              )}
            </span>
            <span>
              {pestana.texto}
              {pestana.ruta === '/app/solicitudes' && pendientes > 0 && (
                /* Para el lector de pantalla, que no ve el globo del contador. */
                <span className="solo-lectura-pantalla">
                  , {pendientes} esperando respuesta
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      <AvisoGlobal />

      {viendoPerfil && (
        <Modal titulo="Tu perfil" onCerrar={() => setViendoPerfil(false)}>
          <div className="fila fila-inicio" style={{ gap: 'var(--e3)' }}>
            <span className="avatar avatar--perfil">
              {persona ? iniciales(persona.nombres, persona.apellidos) : '··'}
            </span>
            <div className="columna" style={{ flex: 1 }}>
              <strong>{nombreCompleto(persona)}</strong>
              <span className="subtitulo">
                {miRol ? `${capitalizar(miRol)} · ` : ''}
                {unidadActiva ? etiquetaUnidad(unidadActiva) : 'Sin unidad'}
              </span>
              {persona?.email && <span className="subtitulo">{persona.email}</span>}
            </div>
          </div>

          <div className="separador" />

          {/* Neutro, no rojo: el rojo esta reservado para la plata (mora, cuota
              vencida). Cerrar sesión no es un error ni pierde nada, y pintarlo de
              rojo le quita fuerza a la senal que si tiene que alarmar
              (docs/08-convenciones.md). */}
          <button className="boton boton--bloque" onClick={cerrar} style={{ minHeight: 44 }}>
            <Icono nombre="salir" tamano={16} />
            Cerrar sesión
          </button>
        </Modal>
      )}

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
