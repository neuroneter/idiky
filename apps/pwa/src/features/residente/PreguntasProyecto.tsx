/**
 * CU-R-32 — Preguntar sobre la obra (RN-239).
 * Doc: docs/casos-de-uso/residente.md#cu-r-32
 *
 * El propietario pregunta desde el tablero y la administración responde. Las
 * respuestas las ven todos, **sin el nombre de quien preguntó**: la duda de uno
 * suele ser la de muchos, y nadie debe sentirse señalado (docs/08 §6 bis). Las
 * pendientes solo las ve quien las hizo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { preguntarSobreProyecto } from '../../datos/repositorio'
import { LARGO_PREGUNTA_PROYECTO, decideEnLaUnidad, motivoPreguntaInvalida, preguntasVisibles } from '../../dominio/reglas'
import * as sel from '../../datos/selectores'
import type { Proyecto } from '../../dominio/tipos'
import { formatearFechaCorta } from '../../utilidades/formato'

export function PreguntasProyecto({ proyecto }: { proyecto: Proyecto }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [escribiendo, setEscribiendo] = useState(false)
  const [texto, setTexto] = useState('')
  if (!sesion) return null
  const unidadId = sesion.unidadActivaId

  const preguntas = preguntasVisibles(proyecto, sesion.personaId)
  // PN-20 — Pregunta el propietario o el arrendatario; los demás leen las respuestas.
  const pregunta = decideEnLaUnidad(sel.rolEnUnidad(bd, sesion.personaId, unidadId))
  const motivo = motivoPreguntaInvalida(texto)

  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      <span className="titulo-seccion">Preguntas sobre la obra ({preguntas.length})</span>
      {preguntas.length === 0 && !escribiendo && pregunta && (
        <p className="subtitulo">¿Tienes una duda? Pregúntale a la administración: te responde aquí.</p>
      )}
      {preguntas.map((pregunta) => {
        const mia = pregunta.personaId === sesion.personaId
        return (
          <div key={pregunta.id} className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e1)' }}>
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              {mia ? 'Tu pregunta' : 'Pregunta de un propietario'} · {formatearFechaCorta(pregunta.fecha)}
            </span>
            <strong>{pregunta.texto}</strong>
            {pregunta.respuesta ? (
              <span className="subtitulo">
                <strong>Administración:</strong> {pregunta.respuesta.texto}
              </span>
            ) : (
              <span className="chip">La administración te responde pronto</span>
            )}
          </div>
        )
      })}

      {escribiendo ? (
        <div className="columna" style={{ gap: 'var(--e2)' }}>
          <div className="campo">
            <label htmlFor={`pregunta-${proyecto.id}`}>Tu pregunta</label>
            <textarea
              id={`pregunta-${proyecto.id}`}
              value={texto}
              maxLength={LARGO_PREGUNTA_PROYECTO.maximo}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Por ejemplo: ¿se va a cortar el agua durante la obra?"
            />
            <span className="ayuda-campo">
              La respuesta la verán todos los propietarios, sin tu nombre.
            </span>
          </div>
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando || !!motivo}
              onClick={async () => {
                const hecho = await ejecutar(
                  (base) =>
                    preguntarSobreProyecto(base, {
                      proyectoId: proyecto.id,
                      personaId: sesion.personaId,
                      unidadId: unidadId ?? '',
                      texto,
                    }),
                  'Gracias por preguntar. Te avisamos cuando la administración responda.',
                )
                if (hecho) {
                  setTexto('')
                  setEscribiendo(false)
                }
              }}
            >
              Enviar la pregunta
            </button>
            <button className="boton" onClick={() => setEscribiendo(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        unidadId && pregunta && (
        <button className="boton" onClick={() => setEscribiendo(true)}>
          Hacer una pregunta
        </button>
        )
      )}
    </div>
  )
}
