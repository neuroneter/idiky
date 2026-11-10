/**
 * CU-R-33 (RN-228) — La administración revisa el soporte de las inmobiliarias
 * que registraron los propietarios: la recibe, o la rechaza con motivo.
 * Doc: docs/casos-de-uso/residente.md#cu-r-33
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { revisarInmobiliaria } from '../../datos/repositorio'
import { etiquetaUnidad } from '../../dominio/reglas'

export function InmobiliariasPorRevisar() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null
  const unidades = new Set(sel.unidadesDe(bd, sesion.copropiedadId).map((u) => u.id))
  const conInmobiliaria = bd.residencias.filter(
    (r) => unidades.has(r.unidadId) && r.inmobiliaria && !r.inmobiliaria.retiradaEn && r.inmobiliaria.revision.estado !== 'rechazada',
  )
  if (conInmobiliaria.length === 0) return null
  const porRevisar = conInmobiliaria.filter((r) => r.inmobiliaria!.revision.estado === 'esperando')

  return (
    <div className="tarjeta">
      <strong>Inmobiliarias</strong>
      <p className="subtitulo">
        {conInmobiliaria.length === 1 ? 'Una unidad la maneja' : `${conInmobiliaria.length} unidades las manejan`} una
        inmobiliaria.{porRevisar.length > 0 ? ' Revisa el soporte de las nuevas antes de recibirlas.' : ''}
      </p>
      {conInmobiliaria.map((r) => {
        const inm = r.inmobiliaria!
        const unidad = sel.unidad(bd, r.unidadId)
        return (
          <div key={r.id} className="columna" style={{ gap: 'var(--e2)', marginTop: 'var(--e3)' }}>
            <div className="fila">
              <span>
                <strong>{unidad ? etiquetaUnidad(unidad) : '—'}</strong>: {sel.nombreCompleto(sel.persona(bd, inm.personaId))}
                {inm.asisteAsambleas ? ' · asiste a asambleas' : ''}
                {inm.pagaAdministracion ? ' · paga la administración' : ''}
              </span>
              <span className={inm.revision.estado === 'recibida' ? 'chip chip--exito' : 'chip chip--alerta'}>
                {inm.revision.estado === 'recibida' ? 'Recibida' : 'Por revisar'}
              </span>
            </div>
            {inm.revision.estado === 'esperando' && (
              <>
                <img
                  src={inm.soporte.imagen}
                  alt={`Soporte de la inmobiliaria de ${unidad ? etiquetaUnidad(unidad) : 'la unidad'}`}
                  style={{ width: '100%', maxWidth: 360, borderRadius: 'var(--radio-sm)', border: '1px solid var(--color-borde)' }}
                />
                {rechazando === r.id ? (
                  <div className="campo">
                    <label htmlFor={`motivo-inm-${r.id}`}>¿Por qué no se recibe?</label>
                    <input id={`motivo-inm-${r.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                    <div className="grupo-botones">
                      <button
                        className="boton boton--peligro"
                        disabled={cargando || motivo.trim().length < 5}
                        onClick={async () => {
                          const hecho = await ejecutar(
                            (base) => revisarInmobiliaria(base, { residenciaId: r.id, personaId: sesion.personaId, recibe: false, motivo }),
                            'No se recibió. El propietario verá el motivo.',
                          )
                          if (hecho) {
                            setRechazando(null)
                            setMotivo('')
                          }
                        }}
                      >
                        No recibir
                      </button>
                      <button className="boton" onClick={() => setRechazando(null)}>
                        Volver
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grupo-botones">
                    <button
                      className="boton boton--primario"
                      disabled={cargando}
                      onClick={() =>
                        void ejecutar(
                          (base) => revisarInmobiliaria(base, { residenciaId: r.id, personaId: sesion.personaId, recibe: true }),
                          'Inmobiliaria recibida.',
                        )
                      }
                    >
                      Recibir
                    </button>
                    <button className="boton" disabled={cargando} onClick={() => setRechazando(r.id)}>
                      No recibir
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
