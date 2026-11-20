/** PN-05 — Los resultados de una encuesta: por opción, sin nombres. El mismo en las dos caras. */

import type { Encuesta } from '../dominio/tipos'
import { resultadosEncuesta } from '../dominio/reglas'

export function ResultadosEncuesta({ encuesta }: { encuesta: Encuesta }) {
  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      {resultadosEncuesta(encuesta).map(({ opcion, votos, porcentaje }) => (
        <div key={opcion.id} className="columna" style={{ gap: 'var(--e1)' }}>
          <div className="fila">
            <span>{opcion.texto}</span>
            <span className="numerico subtitulo">
              {porcentaje} % · {votos}
            </span>
          </div>
          <div className="medidor" role="progressbar" aria-label={opcion.texto} aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
            <div className="medidor__relleno" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      ))}
      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        {encuesta.respuestas.length} {encuesta.respuestas.length === 1 ? 'unidad respondió' : 'unidades respondieron'}
      </span>
    </div>
  )
}
