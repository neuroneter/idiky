/**
 * CU-R-47 — Calificar la atención de una PQRS (PN-15).
 * Doc: docs/casos-de-uso/residente.md#cu-r-47
 *
 * Cuando la administración la resuelve: «¿Cómo te atendimos?», de 1 a 5, con un
 * comentario opcional. Una sola vez. Se pregunta en positivo y se agradece.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { calificarAtencion } from '../../datos/repositorio'
import { TEXTO_PUNTAJE } from '../../dominio/reglas'
import type { Pqrs } from '../../dominio/tipos'

export function Estrellas({ puntaje }: { puntaje: number }) {
  return (
    <span aria-label={`${puntaje} de 5: ${TEXTO_PUNTAJE[puntaje]}`} style={{ color: 'var(--color-acento)', letterSpacing: '0.1em' }}>
      {'★'.repeat(puntaje)}
      <span className="tenue">{'☆'.repeat(5 - puntaje)}</span>
    </span>
  )
}

export function CalificarAtencion({ pqrs }: { pqrs: Pqrs }) {
  const { ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [puntaje, setPuntaje] = useState(0)
  const [comentario, setComentario] = useState('')
  if (!sesion || (pqrs.estado !== 'resuelta' && pqrs.estado !== 'cerrada')) return null

  if (pqrs.calificacion) {
    return (
      <div className="columna" style={{ gap: 'var(--e1)', marginTop: 'var(--e3)' }}>
        <span className="subtitulo">
          Tu calificación: <Estrellas puntaje={pqrs.calificacion.puntaje} /> {TEXTO_PUNTAJE[pqrs.calificacion.puntaje]}
        </span>
        {pqrs.calificacion.comentario && <span className="tenue">«{pqrs.calificacion.comentario}»</span>}
      </div>
    )
  }

  return (
    <div className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e2)', marginTop: 'var(--e3)' }}>
      <strong>¿Cómo te atendimos?</strong>
      <div className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e1)' }} role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={puntaje === n}
            aria-label={`${n}: ${TEXTO_PUNTAJE[n]}`}
            className="boton boton--fantasma"
            style={{ fontSize: '1.6rem', padding: '0 var(--e1)', color: n <= puntaje ? 'var(--color-acento)' : 'var(--color-borde-fuerte)' }}
            onClick={() => setPuntaje(n)}
          >
            ★
          </button>
        ))}
        {puntaje > 0 && <span className="subtitulo">{TEXTO_PUNTAJE[puntaje]}</span>}
      </div>
      <div className="campo">
        <label htmlFor={`comentario-${pqrs.id}`}>¿Algo que quieras contarnos? (opcional)</label>
        <textarea id={`comentario-${pqrs.id}`} maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} />
      </div>
      <button
        className="boton boton--primario"
        disabled={cargando || puntaje === 0}
        onClick={() =>
          void ejecutar(
            (base) => calificarAtencion(base, { pqrsId: pqrs.id, personaId: sesion.personaId, puntaje, comentario }),
            '¡Gracias! Tu opinión nos ayuda a atenderte mejor.',
          )
        }
      >
        Enviar mi calificación
      </button>
    </div>
  )
}
