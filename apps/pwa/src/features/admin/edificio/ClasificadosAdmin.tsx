/**
 * CU-A-36 — Cuidar los clasificados del edificio (PN-08).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-36
 *
 * La administración no aprueba cada aviso: retira, con respeto y con motivo,
 * el que no cumple el manual de convivencia. Nada se borra.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { cerrarAviso } from '../../../datos/repositorio'
import { TEXTO_TIPO_AVISO, etiquetaUnidad } from '../../../dominio/reglas'
import { formatearDinero } from '../../../utilidades/formato'

export function ClasificadosAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [retirando, setRetirando] = useState<string | null>(null)
  const [detalle, setDetalle] = useState('')
  if (!sesion) return null
  const avisos = sel.clasificadosVigentes(bd, sesion.copropiedadId)

  return (
    <div className="tarjeta">
      <strong>Avisos vigentes ({avisos.length})</strong>
      <p className="subtitulo">Los publican los vecinos y duran 30 días. Retira solo el que no cumpla el manual de convivencia.</p>
      <div className="lista lista--compacta" style={{ marginTop: 'var(--e3)' }}>
        {avisos.map((a) => {
          const unidad = sel.unidad(bd, a.unidadId)
          return (
            <div key={a.id} className="columna" style={{ gap: 'var(--e1)' }}>
              <div className="fila">
                <span>
                  <strong>{TEXTO_TIPO_AVISO[a.tipo]}:</strong> {a.titulo}
                  {a.precio ? ` · ${formatearDinero(a.precio)}` : ''}
                </span>
                <button className="boton boton--pequeno" onClick={() => setRetirando(a.id)}>
                  Retirar
                </button>
              </div>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {sel.nombreCompleto(sel.persona(bd, a.personaId))} · {unidad ? etiquetaUnidad(unidad) : ''}
              </span>
              {retirando === a.id && (
                <div className="fila">
                  <input aria-label="Motivo del retiro" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="El manual no permite ventas de comida preparada" style={{ flex: 1 }} />
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando || detalle.trim().length < 10}
                    onClick={async () => {
                      const hecho = await ejecutar(
                        (base) => cerrarAviso(base, { avisoId: a.id, personaId: sesion.personaId, motivo: 'retirado_admin', detalle }),
                        'Aviso retirado.',
                      )
                      if (hecho) {
                        setRetirando(null)
                        setDetalle('')
                      }
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
