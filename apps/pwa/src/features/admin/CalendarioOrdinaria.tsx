/**
 * PN-26 — El calendario legal de la asamblea ordinaria (CU-A-12; Mary, 2026-11-23).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-12
 *
 * Las ordinarias se hacen de enero a marzo, y llegan todas a la vez. Aquí el
 * administrador ve las fechas que fija la ley y en qué va cada una, sin tener
 * que hacer la cuenta: si se le pasa la citación, lo ve antes de que pase.
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { calendarioOrdinaria, hoyISO, type EstadoPasoCalendario } from '../../dominio/reglas'
import { formatearFecha } from '../../utilidades/formato'

const CHIP: Record<EstadoPasoCalendario, { texto: string; clase: string }> = {
  hecho: { texto: 'Hecho', clase: 'chip chip--exito' },
  pendiente: { texto: 'Pendiente', clase: 'chip chip--marca' },
  vencido: { texto: 'Se pasó la fecha', clase: 'chip chip--alerta' },
  informativo: { texto: 'Para tener en cuenta', clase: 'chip' },
}

export function CalendarioOrdinaria() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const c = sesion.copropiedadId
  const { anio, asambleaId, pasos } = calendarioOrdinaria({
    hoy: hoyISO(),
    asambleas: bd.asambleas.filter((a) => a.copropiedadId === c),
    actas: bd.actas,
    documentosEdificio: (bd.documentosEdificio ?? []).filter((d) => d.copropiedadId === c),
  })

  return (
    <div className="tarjeta">
      <strong>Calendario de la asamblea ordinaria {anio}</strong>
      <p className="subtitulo">
        {asambleaId
          ? 'Ya está convocada. Esto es lo que sigue, con las fechas de la ley.'
          : 'Todavía no está convocada. Estas son las fechas que fija la ley.'}
      </p>
      <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
        {pasos.map((paso) => (
          <div key={paso.id} className="fila" style={{ alignItems: 'flex-start' }}>
            <div className="columna" style={{ gap: 2 }}>
              <span>
                <strong className="numerico">{formatearFecha(paso.fecha)}</strong> · {paso.titulo}
              </span>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {paso.detalle} {paso.fuente}.
              </span>
            </div>
            <span className={CHIP[paso.estado].clase} data-paso={paso.id}>
              {CHIP[paso.estado].texto}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
