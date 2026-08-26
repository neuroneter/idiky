/**
 * CU-R-01 — Ingresar y seleccionar unidad activa.
 * Doc: docs/casos-de-uso/residente.md#cu-r-01
 *
 * Demo sin autenticacion real (ADR-0004): se elige un perfil de la lista.
 */

import { useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { iniciales } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import type { PerfilDemo } from '../../dominio/tipos'

export function AccesoPage() {
  const { bd, reiniciarDemo } = useDatos()
  const { iniciar } = useSesion()
  const navegar = useNavigate()

  const copropiedad = bd.copropiedades[0]

  function entrar(perfil: PerfilDemo) {
    iniciar(perfil)
    navegar(perfil.rol === 'admin' ? '/admin' : '/app', { replace: true })
  }

  return (
    <div className="acceso">
      <div className="acceso__marca">
        <div className="acceso__logo">idiky</div>
        <p className="acceso__lema">
          Gestion de copropiedad horizontal
          <br />
          <strong>{copropiedad?.nombre}</strong>
        </p>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Entrar como</span>
        <div className="lista">
          {bd.perfilesDemo.map((perfil) => {
            const persona = sel.persona(bd, perfil.personaId)
            return (
              <button
                key={perfil.id}
                className="tarjeta tarjeta--accion"
                onClick={() => entrar(perfil)}
              >
                <div className="perfil">
                  <div
                    className={`perfil__avatar${
                      perfil.rol === 'admin' ? ' perfil__avatar--admin' : ''
                    }`}
                  >
                    {persona ? iniciales(persona.nombres, persona.apellidos) : '··'}
                  </div>
                  <div className="columna" style={{ flex: 1 }}>
                    <strong>{perfil.etiqueta}</strong>
                    <span className="subtitulo">{perfil.descripcion}</span>
                  </div>
                  <Icono nombre="chevron" tamano={16} className="tenue" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <p className="acceso__nota">
        <strong>Este es un demo.</strong> Los datos son ficticios y se guardan solo en este
        navegador; no hay contrasenas ni servidor. Puedes probar sin miedo a danar nada.
      </p>

      <button className="boton boton--fantasma" onClick={reiniciarDemo}>
        <Icono nombre="reiniciar" tamano={15} />
        Reiniciar los datos del demo
      </button>
    </div>
  )
}
