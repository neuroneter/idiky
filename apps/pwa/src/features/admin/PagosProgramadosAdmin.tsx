/**
 * CU-R-36 · PN-02 — Los pagos programados, vistos por la administración.
 *
 * Para saber cuánto va a entrar solo cada mes y de qué unidades. Solo se ve:
 * el pago programado lo deja y lo cambia el propietario o el arrendatario.
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { etiquetaUnidad } from '../../dominio/reglas'
import { formatearDinero } from '../../utilidades/formato'

export function PagosProgramadosAdmin() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const unidades = new Set(sel.unidadesDe(bd, sesion.copropiedadId).map((u) => u.id))
  const programados = (bd.pagosProgramados ?? []).filter((p) => p.activo && unidades.has(p.unidadId)).sort((a, b) => a.dia - b.dia)
  if (programados.length === 0) return null
  const ordinariaDe = (unidadId: string) =>
    sel.cuotasDeUnidad(bd, unidadId).filter((c) => c.tipo === 'ordinaria').sort((a, b) => b.periodo.localeCompare(a.periodo))[0]?.valor ?? 0
  const esperado = programados.reduce((s, p) => s + ordinariaDe(p.unidadId), 0)

  return (
    <div className="tarjeta">
      <div className="fila">
        <strong>Pagos programados</strong>
        <span className="chip chip--info">{programados.length}</span>
      </div>
      <p className="subtitulo">
        Unidades que pagan solas su cuota de administración. Cerca de {formatearDinero(esperado)} al mes.
      </p>
      <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
        {programados.map((p) => {
          const unidad = sel.unidad(bd, p.unidadId)
          return (
            <div key={p.id} className="fila">
              <span>
                {unidad ? etiquetaUnidad(unidad) : ''} · {sel.nombreCompleto(sel.persona(bd, p.personaId))}
              </span>
              <span className="subtitulo">
                Día {p.dia} · {p.medio === 'pse' ? 'débito PSE' : 'tarjeta'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
