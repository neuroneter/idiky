/**
 * El tablero de un proyecto: la barra de avance y la historia de la obra.
 *
 * Es **el mismo componente en las dos caras** (CU-A-28, CU-R-32): el
 * administrador registra sobre lo que el propietario ve, y si cada uno tuviera
 * su versión, el día que discutan «en qué va la cubierta» no habría un tablero
 * común sobre el cual discutir.
 */

import type { Persona, Proyecto } from '../dominio/tipos'
import { avancesDelProyecto, estadoProyecto, porcentajeProyecto } from '../dominio/reglas'
import { formatearDinero, formatearFecha, formatearFechaHora } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'

const ESTADO: Record<ReturnType<typeof estadoProyecto>, [string, string]> = {
  planeado: ['Planeado', 'chip'],
  en_curso: ['En marcha', 'chip chip--info'],
  terminado: ['Terminado', 'chip chip--exito'],
}

export function ChipProyecto({ proyecto }: { proyecto: Proyecto }) {
  const [texto, clase] = ESTADO[estadoProyecto(proyecto)]
  return <span className={clase}>{texto}</span>
}

/** La barra: el porcentaje del último avance (RN-100), dicho con el número al lado. */
export function BarraAvance({ proyecto }: { proyecto: Proyecto }) {
  const porcentaje = porcentajeProyecto(proyecto)
  return (
    <div className="columna" style={{ gap: 'var(--e1)' }}>
      <div className="fila">
        <span className="subtitulo">Avance</span>
        <strong className="numerico">{porcentaje} %</strong>
      </div>
      <div className="medidor" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
        <div className="medidor__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

/**
 * La historia: cada avance con su fecha, su porcentaje, su detalle y su foto.
 * Del más nuevo al más viejo, porque lo que se quiere saber es qué pasó
 * último; la historia completa queda debajo para quien la necesite.
 */
export function HistoriaProyecto({
  proyecto,
  personaDe,
}: {
  proyecto: Proyecto
  personaDe: (id: string) => Persona | undefined
}) {
  const avances = avancesDelProyecto(proyecto).reverse()
  if (avances.length === 0) {
    return (
      <p className="subtitulo">
        Todavía no hay avances registrados. El proyecto está planeado
        {proyecto.fechaInicio ? ` para empezar el ${formatearFecha(proyecto.fechaInicio)}` : ''}.
      </p>
    )
  }
  return (
    <ol className="actuaciones">
      {avances.map((avance, i) => {
        const anterior = avances[i + 1]
        const retrocede = anterior && avance.porcentaje < anterior.porcentaje
        return (
          <li key={avance.id} className="actuacion actuacion--administracion">
            <div className="fila">
              <strong>{avance.titulo}</strong>
              <span className={retrocede ? 'chip chip--alerta' : 'chip chip--info'}>
                {avance.porcentaje} %
              </span>
            </div>
            {avance.detalle && <span className="subtitulo">{avance.detalle}</span>}
            {avance.foto && (
              <img
                src={avance.foto.imagen}
                alt={avance.titulo}
                style={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'cover',
                  borderRadius: 'var(--radio-sm)',
                  border: '1px solid var(--color-borde)',
                  marginTop: 'var(--e2)',
                }}
              />
            )}
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              {formatearFechaHora(avance.fecha)}
              {personaDe(avance.registradoPor)
                ? ` · ${nombreCompleto(personaDe(avance.registradoPor))}`
                : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Los datos fijos del proyecto: quién lo ejecuta, cuándo y con cuánto. */
export function FichaProyecto({ proyecto }: { proyecto: Proyecto }) {
  return (
    <div className="lista lista--compacta">
      {proyecto.responsable && (
        <div className="fila fila-inicio">
          <span className="subtitulo">Lo ejecuta</span>
          <strong style={{ textAlign: 'right' }}>{proyecto.responsable}</strong>
        </div>
      )}
      {proyecto.fechaInicio && (
        <div className="fila">
          <span className="subtitulo">Inicio</span>
          <strong>{formatearFecha(proyecto.fechaInicio)}</strong>
        </div>
      )}
      {proyecto.fechaFinPrevista && (
        <div className="fila">
          <span className="subtitulo">Fin previsto</span>
          <strong>{formatearFecha(proyecto.fechaFinPrevista)}</strong>
        </div>
      )}
      {proyecto.presupuesto !== undefined && (
        <div className="fila">
          <span className="subtitulo">Presupuesto</span>
          <strong className="numerico">{formatearDinero(proyecto.presupuesto)}</strong>
        </div>
      )}
    </div>
  )
}
