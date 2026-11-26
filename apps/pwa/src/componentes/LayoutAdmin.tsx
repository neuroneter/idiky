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
import { NOMBRE_USUARIO, cambiaEnModulo, moduloDeRutaConsola, veModulo } from '../dominio/permisos'

const SECCIONES: Array<{ ruta: string; texto: string; icono: NombreIcono; exacta?: boolean }> = [
  { ruta: '/admin', texto: 'Tablero', icono: 'tablero', exacta: true },
  { ruta: '/admin/registros', texto: 'Registros', icono: 'personas' },
  { ruta: '/admin/unidades', texto: 'Unidades', icono: 'unidades' },
  { ruta: '/admin/cartera', texto: 'Cartera', icono: 'cartera' },
  { ruta: '/admin/multas', texto: 'Multas', icono: 'alerta' },
  // El catalogo dice que multas existen; los procesos, a quien se le esta
  // imponiendo una y en que etapa va. Son dos cosas distintas y por eso son dos
  // entradas: parametrizar no es sancionar (RN-49, RN-69).
  { ruta: '/admin/sanciones', texto: 'Procesos', icono: 'certificado' },
  { ruta: '/admin/asambleas', texto: 'Asambleas', icono: 'asambleas' },
  { ruta: '/admin/pagos', texto: 'Pagos', icono: 'pagos' },
  { ruta: '/admin/reservas', texto: 'Reservas', icono: 'reservas' },
  { ruta: '/admin/pqrs', texto: 'PQRS', icono: 'pqrs' },
  { ruta: '/admin/comunicados', texto: 'Comunicados', icono: 'comunicados' },
  // Las obras: lo que mas plata mueve y menos se ve desde un apartamento
  // (CU-A-28). Va junto a comunicados porque cada avance es uno.
  { ruta: '/admin/proyectos', texto: 'Proyectos', icono: 'tablero' },
  { ruta: '/admin/correspondencia', texto: 'Correspondencia', icono: 'correspondencia' },
  { ruta: '/admin/directorio', texto: 'Directorio', icono: 'personas' },
  { ruta: '/admin/porteria', texto: 'Portería', icono: 'visitantes' },
  { ruta: '/admin/edificio', texto: 'Edificio', icono: 'unidades' },
]

const TITULOS: Record<string, string> = {
  '/admin': 'Tablero de la copropiedad',
  '/admin/registros': 'Registro de personas',
  '/admin/unidades': 'Unidades y residentes',
  '/admin/cartera': 'Cartera',
  '/admin/cartera/paz-y-salvo': 'Paz y salvo',
  '/admin/cartera/certificados': 'Certificados de pago',
  '/admin/multas': 'Catálogo de multas',
  '/admin/sanciones': 'Procesos sancionatorios',
  '/admin/asambleas': 'Asambleas',
  '/admin/pagos': 'Pagos y recibos de caja',
  '/admin/reservas': 'Reservas',
  '/admin/reservas/calendario': 'Calendario de ocupación',
  '/admin/reservas/informe': 'Informe de uso de las zonas',
  '/admin/reservas/zonas': 'Zonas comunes',
  '/admin/pqrs': 'Bandeja de PQRS',
  '/admin/comunicados': 'Comunicados',
  '/admin/proyectos': 'Proyectos y obras',
  '/admin/correspondencia': 'Correspondencia',
  '/admin/directorio': 'Directorio',
  '/admin/porteria': 'Minuta de portería',
  '/admin/edificio': 'Información del edificio',
}

export function LayoutAdmin() {
  const { bd, reiniciarDemo } = useDatos()
  const { sesion, cerrar, cambiarCopropiedad } = useSesion()
  const { pathname } = useLocation()

  if (!sesion) return null

  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const persona = sel.persona(bd, sesion.personaId)
  // CU-A-15 — Un administrador con varios edificios cambia de uno a otro sin salir.
  const edificios = sel.edificiosQueAdministra(bd, sesion.personaId)
  // PN-29 — Cada cargo ve solo sus secciones; las que solo puede ver, sin botones para cambiar.
  const usuario = sel.usuarioDeSesion(bd, sesion)
  const secciones = SECCIONES.filter((s) => {
    const modulo = moduloDeRutaConsola(s.ruta)
    return !modulo || veModulo(usuario, modulo)
  })
  const moduloActual = moduloDeRutaConsola(pathname)
  const permitida = !moduloActual || veModulo(usuario, moduloActual)
  const soloLectura = !!moduloActual && permitida && !cambiaEnModulo(usuario, moduloActual)

  return (
    <div className="consola">
      <aside className="lateral">
        <div className="lateral__marca">
          <Logotipo inverso />
          {edificios.length > 1 ? (
            <select
              aria-label="Edificio"
              className="lateral__edificio"
              value={sesion.copropiedadId}
              onChange={(e) => cambiarCopropiedad(e.target.value)}
              style={{ marginTop: 'var(--e2)', width: '100%', borderRadius: 'var(--radio-sm)', padding: '0.35rem 0.5rem' }}
            >
              {edificios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          ) : (
            <span className="lateral__marca-sub">{copropiedad?.nombre}</span>
          )}
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
          <div>{NOMBRE_USUARIO[usuario]}</div>
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
          {!permitida ? (
            <div className="tarjeta">
              <strong>Esta sección no es para tu perfil</strong>
              <p className="subtitulo">Como {NOMBRE_USUARIO[usuario]}, entra por el menú de la izquierda a lo que te toca.</p>
            </div>
          ) : soloLectura ? (
            <>
              <p className="acceso__nota" role="status">
                Como {NOMBRE_USUARIO[usuario]}, aquí <strong>puedes ver, no cambiar</strong>.
              </p>
              <fieldset disabled className="solo-lectura" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <Outlet />
              </fieldset>
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </div>

      <AvisoGlobal />
    </div>
  )
}
