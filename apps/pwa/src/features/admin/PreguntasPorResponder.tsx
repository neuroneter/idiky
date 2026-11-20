/**
 * CU-A-28 — Responder las preguntas de los propietarios sobre la obra (RN-239).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-28
 *
 * La administración ve quién preguntó (para responderle bien); los demás
 * propietarios verán la respuesta sin ese nombre. Al responder, a quien
 * preguntó le llega un mensaje.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { responderPreguntaProyecto } from '../../datos/repositorio'
import { etiquetaUnidad, motivoPreguntaInvalida, preguntasPorResponder } from '../../dominio/reglas'
import type { PreguntaProyecto, Proyecto } from '../../dominio/tipos'
import { formatearFechaCorta } from '../../utilidades/formato'

export function PreguntasPorResponder({ proyecto }: { proyecto: Proyecto }) {
  const pendientes = preguntasPorResponder(proyecto)
  const respondidas = (proyecto.preguntas ?? []).filter((p) => p.respuesta)
  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      <span className="titulo-seccion">
        Preguntas de los propietarios ({pendientes.length} por responder)
      </span>
      {pendientes.length === 0 && (
        <p className="subtitulo">
          No hay preguntas por responder.
          {respondidas.length > 0 ? ` ${respondidas.length} ya respondidas.` : ''}
        </p>
      )}
      {pendientes.map((pregunta) => (
        <Responder key={pregunta.id} proyecto={proyecto} pregunta={pregunta} />
      ))}
    </div>
  )
}

function Responder({ proyecto, pregunta }: { proyecto: Proyecto; pregunta: PreguntaProyecto }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [texto, setTexto] = useState('')
  if (!sesion) return null
  const unidad = sel.unidad(bd, pregunta.unidadId)
  const motivo = motivoPreguntaInvalida(texto, 'respuesta')

  return (
    <div className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e2)' }}>
      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        {sel.nombreCompleto(sel.persona(bd, pregunta.personaId))}
        {unidad ? ` · ${etiquetaUnidad(unidad)}` : ''} · {formatearFechaCorta(pregunta.fecha)}
      </span>
      <strong>{pregunta.texto}</strong>
      <div className="campo">
        <label htmlFor={`respuesta-${pregunta.id}`}>Respuesta</label>
        <textarea id={`respuesta-${pregunta.id}`} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <span className="ayuda-campo">
          La verán todos los propietarios, sin el nombre de quien preguntó. No se edita después.
        </span>
      </div>
      <button
        className="boton boton--primario"
        disabled={cargando || !!motivo}
        onClick={() =>
          void ejecutar(
            (base) =>
              responderPreguntaProyecto(base, {
                proyectoId: proyecto.id,
                preguntaId: pregunta.id,
                personaId: sesion.personaId,
                texto,
              }),
            'Respuesta publicada. Le avisamos por mensaje a quien preguntó.',
          )
        }
      >
        Responder
      </button>
    </div>
  )
}
