/**
 * PN-29 — El inicio de la consola para quien no es el Administrador ni el Delegado (tabla de Mary,
 * 2026-11-26): qué secciones le tocan y si en cada una puede cambiar o solo ver.
 * Doc: docs/recursos/roles-de-alice.md §4 bis
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { NovedadesDelPersonal, RegistrarNovedadDelPersonal } from './NovedadDelPersonal'
import { NOMBRE_USUARIO, cambiaEnModulo, moduloDeRutaConsola, veModulo } from '../../dominio/permisos'

const ENTRADAS: Array<{ ruta: string; texto: string }> = [
  { ruta: '/admin/cartera', texto: 'Cartera' },
  { ruta: '/admin/cartera/paz-y-salvo', texto: 'Paz y salvo' },
  { ruta: '/admin/pagos', texto: 'Pagos' },
  { ruta: '/admin/unidades', texto: 'Unidades' },
  { ruta: '/admin/registros', texto: 'Registros' },
  { ruta: '/admin/asambleas', texto: 'Asambleas' },
  { ruta: '/admin/reservas', texto: 'Reservas' },
  { ruta: '/admin/pqrs', texto: 'PQRS' },
  { ruta: '/admin/comunicados', texto: 'Comunicados' },
  { ruta: '/admin/proyectos', texto: 'Proyectos' },
  { ruta: '/admin/edificio', texto: 'Información del edificio' },
  { ruta: '/admin/correspondencia', texto: 'Correspondencia' },
  { ruta: '/admin/porteria', texto: 'Minuta de portería' },
]

export function TableroDelCargo() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const usuario = sel.usuarioDeSesion(bd, sesion)
  const mias = ENTRADAS.filter((e) => veModulo(usuario, moduloDeRutaConsola(e.ruta)!))
  const persona = sel.persona(bd, sesion.personaId)

  return (
    <div className="pila">
      {/* PN-32 — Aseo, Mantenimiento y el Piscinero: lo primero, registrar la novedad (desde el celular). */}
      <RegistrarNovedadDelPersonal />
      <NovedadesDelPersonal soloMias />
      <div className="tarjeta">
        <strong>
          Hola, {persona?.nombres.split(' ')[0]}. Entraste como {NOMBRE_USUARIO[usuario]}.
        </strong>
        <p className="subtitulo">Esto es lo que te toca en el edificio. Lo demás no se te muestra.</p>
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
          {mias.map((e) => (
            <div key={e.ruta} className="fila">
              <span>
                {e.texto}{' '}
                <span className="tenue">· {cambiaEnModulo(usuario, moduloDeRutaConsola(e.ruta)!) ? 'puedes cambiar' : 'solo ver'}</span>
              </span>
              <Link to={e.ruta} className="boton boton--pequeno">
                Entrar
              </Link>
            </div>
          ))}
          {mias.length === 0 && <span className="tenue">Por ahora no tienes secciones en la consola.</span>}
        </div>
      </div>
    </div>
  )
}
