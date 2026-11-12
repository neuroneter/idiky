/**
 * RN-236 — La minuta de un turno de portería, en orden de hora. La usan el
 * puesto de portería y la consola de la administración: es la misma.
 */

import { useDatos } from '../estado/DatosContext'
import * as sel from '../datos/selectores'
import type { TurnoPorteria } from '../dominio/tipos'
import { formatearFechaHora } from '../utilidades/formato'

const MARCA: Record<string, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  paquete: 'Paquete',
  entrega: 'Entrega',
  novedad: 'Novedad',
}

export function MinutaTurno({ turno }: { turno: TurnoPorteria }) {
  const { bd } = useDatos()
  const lineas = sel.minutaDeTurno(bd, turno)
  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      <span className="subtitulo">
        Turno de {sel.nombreCompleto(sel.persona(bd, turno.personaId))} · desde {formatearFechaHora(turno.abiertoEn)}
        {turno.cerradoEn ? ` hasta ${formatearFechaHora(turno.cerradoEn)}` : ' · abierto'}
      </span>
      {lineas.length === 0 ? (
        <p className="subtitulo">Todavía no hay nada anotado en este turno.</p>
      ) : (
        <ul className="especificaciones">
          {lineas.map((l, i) => (
            <li key={`${l.en}-${i}`}>
              <strong>{formatearFechaHora(l.en).split(', ').pop()}</strong> · {MARCA[l.tipo]}: {l.texto}
            </li>
          ))}
        </ul>
      )}
      {turno.entrega && (
        <p className="acceso__nota">
          <strong>Entrega del turno:</strong> {turno.entrega}
        </p>
      )}
    </div>
  )
}
