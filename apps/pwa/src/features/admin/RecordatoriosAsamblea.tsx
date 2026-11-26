/**
 * PN-27 — Recordatorios de la asamblea a los propietarios (CU-A-12; Mary, 2026-11-26).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-12
 *
 * - `RecordatoriosAsambleaTarjeta`: la parametrización del edificio (Sí/No y
 *   cuántos días antes).
 * - `RecordatoriosDeLaAsamblea`: en cada asamblea convocada, lo que ya salió, el
 *   próximo y el botón para mandar uno a mano.
 *
 * Llegar al quórum es lo que más le cuesta a una ordinaria: el recordatorio es
 * una invitación, y a quien no puede ir le recuerda que puede dar su poder.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { configurarRecordatoriosAsamblea, enviarRecordatorioAsamblea } from '../../datos/repositorio'
import { DIAS_RECORDATORIO_ASAMBLEA, diasEntre, fechaLocalDe, hoyISO, recordatoriosAsambleaDe, sumarDias } from '../../dominio/reglas'
import type { Asamblea } from '../../dominio/tipos'
import { formatearFecha, formatearFechaHora } from '../../utilidades/formato'

function textoDia(d: number): string {
  if (d === 0) return 'el mismo día'
  if (d === 1) return 'el día anterior'
  return `${d} días antes`
}

export function RecordatoriosAsambleaTarjeta() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const config = recordatoriosAsambleaDe(sel.copropiedad(bd, sesion?.copropiedadId ?? ''))
  const [activo, setActivo] = useState(config.activo)
  const [dias, setDias] = useState<number[]>(config.dias)
  if (!sesion) return null

  return (
    <div className="tarjeta">
      <strong>Recordatorios de la asamblea</strong>
      <p className="subtitulo">
        Salen solos a los propietarios, por el canal que cada uno eligió. A quien no ha dado poder le recuerdan que
        puede darlo desde la app. La citación es aparte: esa siempre llega.
      </p>
      <div className="segmentos" style={{ marginTop: 'var(--e2)' }}>
        <button type="button" className="segmento" aria-current={activo ? 'page' : undefined} onClick={() => setActivo(true)}>
          Sí, enviar recordatorios
        </button>
        <button type="button" className="segmento" aria-current={!activo ? 'page' : undefined} onClick={() => setActivo(false)}>
          No
        </button>
      </div>
      {activo && (
        <div className="fila" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 'var(--e3)', marginTop: 'var(--e2)' }}>
          {DIAS_RECORDATORIO_ASAMBLEA.map((d) => (
            <label key={d} className="fila" style={{ gap: 'var(--e1)' }}>
              <input
                type="checkbox"
                checked={dias.includes(d)}
                onChange={(e) => setDias(e.target.checked ? [...dias, d] : dias.filter((x) => x !== d))}
              />
              <span>{textoDia(d)}</span>
            </label>
          ))}
        </div>
      )}
      <button
        className="boton boton--pequeno boton--primario"
        style={{ marginTop: 'var(--e2)' }}
        disabled={cargando}
        onClick={() =>
          void ejecutar(
            (base) => configurarRecordatoriosAsamblea(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, activo, dias }),
            'Recordatorios guardados.',
          )
        }
      >
        Guardar recordatorios
      </button>
    </div>
  )
}

export function RecordatoriosDeLaAsamblea({ asamblea }: { asamblea: Asamblea }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  if (!sesion || asamblea.estado !== 'convocada') return null
  const config = recordatoriosAsambleaDe(sel.copropiedad(bd, asamblea.copropiedadId))
  const enviados = (asamblea.recordatorios ?? []).filter((r) => r.dias === 'manual' || r.personas > 0)
  const reunion = fechaLocalDe(asamblea.fechaHora)
  const faltan = diasEntre(hoyISO(), reunion)
  const yaMarcados = new Set((asamblea.recordatorios ?? []).map((r) => r.dias))
  const proximo = config.activo
    ? config.dias.filter((d) => d < faltan && !yaMarcados.has(d)).sort((a, b) => b - a)[0]
    : undefined

  return (
    <div className="tarjeta tarjeta--plana">
      <strong>Recordatorios a los propietarios</strong>
      {enviados.length === 0 ? (
        <span className="tenue" style={{ display: 'block' }}>Todavía no ha salido ninguno.</span>
      ) : (
        <ul className="lista lista--compacta" style={{ paddingLeft: 'var(--e4)' }}>
          {enviados.map((r) => (
            <li key={`${r.dias}-${r.enviadoEn}`}>
              {r.dias === 'manual' ? 'Enviado a mano' : `Automático, ${textoDia(r.dias)}`}: {formatearFechaHora(r.enviadoEn)}, a{' '}
              {r.personas === 1 ? '1 propietario' : `${r.personas} propietarios`}
            </li>
          ))}
        </ul>
      )}
      <span className="subtitulo" style={{ display: 'block' }}>
        {!config.activo
          ? 'Los recordatorios automáticos están apagados en este edificio.'
          : proximo !== undefined
            ? `Próximo: ${textoDia(proximo)}, el ${formatearFecha(sumarDias(reunion, -proximo))}.`
            : 'No quedan recordatorios automáticos por enviar.'}
      </span>
      <button
        className="boton boton--pequeno"
        style={{ marginTop: 'var(--e2)' }}
        disabled={cargando}
        onClick={() =>
          void ejecutar(
            (base) => enviarRecordatorioAsamblea(base, { asambleaId: asamblea.id, personaId: sesion.personaId }),
            'Recordatorio enviado a los propietarios.',
          )
        }
      >
        Enviar un recordatorio ahora
      </button>
    </div>
  )
}
