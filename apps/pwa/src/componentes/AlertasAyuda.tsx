/**
 * CU-R-43 — Los pedidos de ayuda, para portería y la administración (PN-09).
 *
 * Arriba de la pantalla de portería, mientras haya uno sin atender. «Voy en
 * camino» le avisa al residente que alguien lo vio; «Atendida» lo cierra.
 */

import { useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { atenderAyuda } from '../datos/repositorio'
import { TEXTO_TIPO_AYUDA, alertasPendientes, etiquetaUnidad } from '../dominio/reglas'
import { formatearFechaHora } from '../utilidades/formato'

export function AlertasAyuda({ incluirAtendidas = false }: { incluirAtendidas?: boolean }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [notas, setNotas] = useState<Record<string, string>>({})
  if (!sesion) return null
  const pendientes = alertasPendientes(bd.alertasAyuda ?? [], sesion.copropiedadId)
  const atendidas = incluirAtendidas
    ? (bd.alertasAyuda ?? []).filter((a) => a.copropiedadId === sesion.copropiedadId && a.atendida).slice(0, 10)
    : []
  if (pendientes.length === 0 && !incluirAtendidas) return null

  return (
    <div className="pila">
      {pendientes.length === 0 && <p className="subtitulo">No hay pedidos de ayuda sin atender.</p>}
      {pendientes.map((alerta) => {
        const unidad = sel.unidad(bd, alerta.unidadId)
        const persona = sel.persona(bd, alerta.personaId)
        return (
          <div key={alerta.id} className="tarjeta tarjeta--alerta columna" role="alert" style={{ gap: 'var(--e2)' }}>
            <strong>
              Piden ayuda: {unidad ? etiquetaUnidad(unidad) : ''} · {TEXTO_TIPO_AYUDA[alerta.tipo]}
            </strong>
            <span className="subtitulo">
              {sel.nombreCompleto(persona)}
              {persona?.telefono ? ` · ${persona.telefono}` : ''} · {formatearFechaHora(alerta.creadaEn)}
              {alerta.detalle ? ` · «${alerta.detalle}»` : ''}
            </span>
            {alerta.vista && <span className="chip chip--info" style={{ alignSelf: 'flex-start' }}>En camino</span>}
            <input
              aria-label="Qué se hizo"
              placeholder="Qué se hizo (opcional)"
              value={notas[alerta.id] ?? ''}
              onChange={(e) => setNotas({ ...notas, [alerta.id]: e.target.value })}
            />
            <div className="grupo-botones">
              {!alerta.vista && (
                <button
                  className="boton boton--primario"
                  disabled={cargando}
                  onClick={() => void ejecutar((base) => atenderAyuda(base, { alertaId: alerta.id, personaId: sesion.personaId, paso: 'vista' }), 'Le avisamos que vas en camino.')}
                >
                  Voy en camino
                </button>
              )}
              <button
                className="boton"
                disabled={cargando}
                onClick={() =>
                  void ejecutar(
                    (base) => atenderAyuda(base, { alertaId: alerta.id, personaId: sesion.personaId, paso: 'atendida', nota: notas[alerta.id] }),
                    'Pedido de ayuda atendido.',
                  )
                }
              >
                Atendida
              </button>
            </div>
          </div>
        )
      })}
      {atendidas.length > 0 && (
        <div className="tarjeta">
          <strong>Atendidas</strong>
          {atendidas.map((a) => {
            const unidad = sel.unidad(bd, a.unidadId)
            return (
              <p key={a.id} className="subtitulo">
                {formatearFechaHora(a.creadaEn)} · {unidad ? etiquetaUnidad(unidad) : ''} · {TEXTO_TIPO_AYUDA[a.tipo]}
                {a.atendida?.nota ? ` · ${a.atendida.nota}` : ''}
              </p>
            )
          })}
        </div>
      )}
    </div>
  )
}
