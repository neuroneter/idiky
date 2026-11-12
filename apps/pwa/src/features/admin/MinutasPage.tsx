/**
 * CU-P-01, CU-P-02 — La administración lee la minuta de cada turno de portería (RN-236).
 * Doc: docs/casos-de-uso/porteria.md#cu-p-02
 *
 * Solo lectura: la minuta la escribe la portería, y nada se borra (RN-61).
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { formatearFechaHora } from '../../utilidades/formato'
import { MinutaTurno } from '../../componentes/MinutaTurno'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function MinutasPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const turnos = sel.turnosDe(bd, sesion.copropiedadId)
  const adentro = sel.visitantesAdentro(bd, sesion.copropiedadId)

  return (
    <div className="pila">
      <p className="subtitulo">
        La minuta de cada turno de portería: quién entró y salió, los paquetes y las novedades. La escribe
        la portería y no se borra. {adentro.length > 0 ? `Ahora hay ${adentro.length} ${adentro.length === 1 ? 'visitante' : 'visitantes'} adentro.` : ''}
      </p>
      {turnos.length === 0 ? (
        <EstadoVacio titulo="Sin turnos" detalle="Cuando la portería abra su turno, su minuta aparece aquí." />
      ) : (
        turnos.map((turno, i) => (
          <details key={turno.id} className="tarjeta tarjeta--plana" open={i === 0}>
            <summary style={{ cursor: 'pointer' }}>
              <strong>
                {formatearFechaHora(turno.abiertoEn)} · {sel.nombreCompleto(sel.persona(bd, turno.personaId))}
              </strong>
              <span className={turno.cerradoEn ? 'chip' : 'chip chip--exito'} style={{ marginLeft: 'var(--e2)' }}>
                {turno.cerradoEn ? 'Cerrado' : 'Abierto'}
              </span>
            </summary>
            <div style={{ marginTop: 'var(--e2)' }}>
              <MinutaTurno turno={turno} />
            </div>
          </details>
        ))
      )}
    </div>
  )
}
