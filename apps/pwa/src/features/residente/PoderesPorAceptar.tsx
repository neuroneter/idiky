/**
 * CU-R-23 (T-46) — El apoderado acepta, o no, el poder que le dieron (RN-217).
 * Doc: docs/casos-de-uso/residente.md#cu-r-23
 *
 * Solo lo ve quien tiene la app (es usuario en alguna copropiedad): al
 * apoderado externo no se le pregunta, y basta con que la administración lo
 * reciba (RN-218). Va en el inicio porque el poder puede venir de otro
 * edificio: no tiene por qué estar en las asambleas del suyo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { aceptarPoder, noAceptarPoder } from '../../datos/repositorio'
import { etiquetaUnidad, poderEsperandoAceptacion } from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'

export function PoderesPorAceptar() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [respondiendo, setRespondiendo] = useState<string>()
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null

  const porAceptar = bd.poderes.filter(
    (p) => p.apoderadoId === sesion.personaId && !p.revocadoEn && poderEsperandoAceptacion(p),
  )
  if (porAceptar.length === 0) return null

  return (
    <div className="tarjeta tarjeta--alerta">
      <strong>{porAceptar.length === 1 ? 'Te dieron un poder' : `Te dieron ${porAceptar.length} poderes`}</strong>
      <p className="subtitulo">
        Si lo aceptas, votas por esa unidad en la asamblea. Si no puedes ir, no lo aceptes: así su
        propietario puede dárselo a otra persona.
      </p>
      {porAceptar.map((poder) => {
        const asamblea = bd.asambleas.find((a) => a.id === poder.asambleaId)
        const unidad = sel.unidad(bd, poder.unidadId)
        const otorgante = sel.persona(bd, poder.otorgadoPor)
        const copropiedad = asamblea ? sel.copropiedad(bd, asamblea.copropiedadId) : undefined
        return (
          <div key={poder.id} className="columna" style={{ gap: 'var(--e2)', marginTop: 'var(--e3)' }}>
            <span>
              <strong>{otorgante ? sel.nombreCompleto(otorgante) : 'Un propietario'}</strong> te da poder por{' '}
              <strong>{unidad ? etiquetaUnidad(unidad) : 'su unidad'}</strong>
              {copropiedad ? ` de ${copropiedad.nombre}` : ''}
              {asamblea ? ` para «${asamblea.titulo}», el ${formatearFechaHora(asamblea.fechaHora)}` : ''}.
            </span>
            {respondiendo === poder.id ? (
              <div className="campo">
                <label htmlFor={`motivo-${poder.id}`}>¿Por qué no lo aceptas? (opcional)</label>
                <input
                  id={`motivo-${poder.id}`}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Por ejemplo: ese día no puedo"
                />
                <div className="grupo-botones">
                  <button
                    className="boton boton--peligro"
                    disabled={cargando}
                    onClick={() =>
                      void ejecutar(
                        (base) => noAceptarPoder(base, { poderId: poder.id, personaId: sesion.personaId, motivo }),
                        'Listo. Le avisamos al propietario.',
                      ).then(() => {
                        setRespondiendo(undefined)
                        setMotivo('')
                      })
                    }
                  >
                    No aceptar el poder
                  </button>
                  <button className="boton" disabled={cargando} onClick={() => setRespondiendo(undefined)}>
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
                      (base) => aceptarPoder(base, { poderId: poder.id, personaId: sesion.personaId }),
                      'Poder aceptado. Falta que la administración lo reciba.',
                    )
                  }
                >
                  Aceptar el poder
                </button>
                <button className="boton" disabled={cargando} onClick={() => setRespondiendo(poder.id)}>
                  No lo acepto
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
