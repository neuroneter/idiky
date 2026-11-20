/**
 * CU-R-01 (A6) — Todas mis propiedades en una sola vista (PN-18).
 * Doc: docs/casos-de-uso/residente.md#cu-r-01
 *
 * Para quien tiene varios apartamentos —el que vive fuera, el que invierte— no
 * basta con cambiar de unidad una por una: aquí ve todas, lo que debe en cada
 * una y desde cuándo, y entra a la que quiera. La plata solo la ve quien es
 * propietario o arrendatario (PN-18).
 */

import { useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { capitalizar, formatearDinero, formatearFecha } from '../../utilidades/formato'
import { etiquetaUnidad } from '../../dominio/reglas'
import { BotonVolver } from '../../componentes/BotonVolver'

export function PropiedadesPage() {
  const { bd } = useDatos()
  const { sesion, cambiarUnidadActiva } = useSesion()
  const navegar = useNavigate()
  if (!sesion) return null
  const propiedades = sel.propiedadesDePersona(bd, sesion.personaId)
  const total = propiedades.reduce((s, p) => s + (p.saldo ?? 0), 0)
  const ir = (unidadId: string, ruta: string) => {
    cambiarUnidadActiva(unidadId)
    navegar(ruta)
  }

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver />
        <h1 className="titulo">Mis propiedades</h1>
      </div>

      <div className="tarjeta">
        <span className="indicador__etiqueta">Valor adeudado en todas</span>
        <div className="dato-grande numerico">{formatearDinero(total)}</div>
        <span className="subtitulo">
          {propiedades.length} {propiedades.length === 1 ? 'propiedad' : 'propiedades'}
          {total === 0 ? ' · ¡Todo al día, gracias!' : ''}
        </span>
      </div>

      {propiedades.map((p) => {
        const activa = p.unidad.id === sesion.unidadActivaId
        return (
          <div key={p.residencia.id} className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila fila-inicio">
              <div className="columna">
                <strong>{etiquetaUnidad(p.unidad)}</strong>
                <span className="subtitulo">
                  {p.copropiedad} · {capitalizar(p.residencia.rol)}
                  {p.residencia.reside === false ? ' · no vive aquí' : ''}
                </span>
              </div>
              {activa && <span className="chip chip--marca">Activa</span>}
            </div>
            {p.saldo !== null ? (
              <div className="columna" style={{ gap: 2 }}>
                <div className="fila">
                  <span className="subtitulo">Valor adeudado</span>
                  <strong className="numerico">{formatearDinero(p.saldo)}</strong>
                </div>
                {p.pendienteDesde && <span className="subtitulo">Hay algo pendiente desde el {formatearFecha(p.pendienteDesde)}.</span>}
                {p.proximoVencimiento && <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>Próximo vencimiento: {formatearFecha(p.proximoVencimiento)}</span>}
              </div>
            ) : (
              <span className="subtitulo">La cuenta de esta unidad la manejan el propietario o el arrendatario.</span>
            )}
            {p.pqrsAbiertas > 0 && (
              <span className="subtitulo">
                {p.pqrsAbiertas === 1 ? '1 solicitud en curso' : `${p.pqrsAbiertas} solicitudes en curso`}
              </span>
            )}
            <div className="grupo-botones">
              {p.saldo ? (
                <button className="boton boton--primario boton--pequeno" onClick={() => ir(p.unidad.id, '/app/cuenta/pagar')}>
                  Pagar esta
                </button>
              ) : null}
              <button className="boton boton--pequeno" onClick={() => ir(p.unidad.id, '/app')}>
                Entrar a esta unidad
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
