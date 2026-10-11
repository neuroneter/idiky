/**
 * CU-A-17, A2 — No hubo quórum: citar la segunda convocatoria (RN-216).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-17
 *
 * Ley 675 de 2001, art. 41: la nueva reunión es el **tercer día hábil siguiente
 * a las 8:00 p. m.** y sesiona con **cualquier número plural de propietarios**.
 * La fecha y la hora vienen puestas; se cambian solo si el reglamento dice otra
 * cosa.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { citarSegundaConvocatoria } from '../../datos/repositorio'
import {
  HORA_SEGUNDA_CONVOCATORIA,
  fechaSegundaConvocatoria,
  motivoNoCitaSegunda,
  resumenAsistencia,
} from '../../dominio/reglas'
import type { Asamblea } from '../../dominio/tipos'
import { formatearFechaHora } from '../../utilidades/formato'

export function SegundaConvocatoria({ asamblea }: { asamblea: Asamblea }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [fecha, setFecha] = useState(fechaSegundaConvocatoria(asamblea.fechaHora))
  const [hora, setHora] = useState(HORA_SEGUNDA_CONVOCATORIA)
  if (!sesion) return null

  // Ya se citó: se dice cuándo es la segunda.
  if (asamblea.estado === 'sin_quorum') {
    const segunda = bd.asambleas.find((a) => a.id === asamblea.segundaConvocatoriaId)
    return (
      <p className="acceso__nota" style={{ marginTop: 'var(--e3)' }}>
        No se reunió el quórum. Se citó a segunda convocatoria
        {segunda ? ` para el ${formatearFechaHora(segunda.fechaHora)}` : ''}, que sesiona con cualquier
        número plural de propietarios (Ley 675, art. 41). Los poderes de la primera no valen: se otorgan
        de nuevo para la segunda (RN-31).
      </p>
    )
  }

  const copropiedad = sel.copropiedad(bd, asamblea.copropiedadId)
  const motivo = motivoNoCitaSegunda(asamblea, resumenAsistencia(bd.asistencias, asamblea.id), copropiedad?.quorumMinimo ?? 50)
  if (motivo) return null

  return (
    <div className="tarjeta tarjeta--plana tarjeta--alerta" style={{ marginTop: 'var(--e3)' }}>
      <strong>¿No se reunió el quórum?</strong>
      <p className="subtitulo">
        Se cita a una segunda convocatoria con el mismo orden del día. Por ley es el tercer día hábil
        siguiente a las 8:00 p. m.; cámbialo solo si el reglamento dice otra cosa (Ley 675, art. 41).
        Sesiona con cualquier número plural de propietarios, y se publica en la cartelera. Los poderes
        son de cada asamblea: para la segunda se otorgan de nuevo (RN-31).
      </p>
      <div className="fila" style={{ gap: 'var(--e2)', flexWrap: 'wrap' }}>
        <input type="date" aria-label="Fecha de la segunda convocatoria" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <input type="time" aria-label="Hora de la segunda convocatoria" value={hora} onChange={(e) => setHora(e.target.value)} />
        <button
          className="boton boton--primario"
          disabled={cargando || !fecha || !hora}
          onClick={() =>
            void ejecutar(
              (base) =>
                citarSegundaConvocatoria(base, {
                  asambleaId: asamblea.id,
                  personaId: sesion.personaId,
                  fechaHora: `${fecha}T${hora}:00`,
                }),
              'Segunda convocatoria citada y publicada en la cartelera.',
            )
          }
        >
          Citar segunda convocatoria
        </button>
      </div>
    </div>
  )
}
