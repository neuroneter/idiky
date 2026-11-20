/**
 * CU-A-35 — Programar el calendario del edificio (PN-07).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-35
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import { cancelarEventoEdificio, programarEventoEdificio } from '../../../datos/repositorio'
import { TEXTO_TIPO_EVENTO, hoyISO, motivoEventoInvalido } from '../../../dominio/reglas'
import type { TipoEventoEdificio } from '../../../dominio/tipos'
import { formatearFecha } from '../../../utilidades/formato'

export function CalendarioAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const hoy = hoyISO()
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoEventoEdificio>('mantenimiento')
  const [fecha, setFecha] = useState(hoy)
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [detalle, setDetalle] = useState('')
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  if (!sesion) return null
  const eventos = (bd.eventosEdificio ?? [])
    .filter((e) => e.copropiedadId === sesion.copropiedadId && e.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const motivo = motivoEventoInvalido({ titulo, fecha, horaInicio, horaFin }, hoy)

  return (
    <div className="rejilla-dos">
      <div className="tarjeta">
        <strong>Programar</strong>
        <p className="subtitulo">Lo ven los propietarios en el calendario de la app, junto con las asambleas y sus fechas.</p>
        <div className="campo" style={{ marginTop: 'var(--e3)' }}>
          <label htmlFor="titulo-evento">Qué va a pasar</label>
          <input id="titulo-evento" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Corte de agua por lavado de tanques" />
        </div>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="tipo-evento">Tipo</label>
            <select id="tipo-evento" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEventoEdificio)}>
              {(Object.keys(TEXTO_TIPO_EVENTO) as TipoEventoEdificio[]).map((t) => (
                <option key={t} value={t}>
                  {TEXTO_TIPO_EVENTO[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="fecha-evento">Fecha</label>
            <input id="fecha-evento" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="inicio-evento">Desde (opcional)</label>
            <input id="inicio-evento" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="fin-evento">Hasta (opcional)</label>
            <input id="fin-evento" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="detalle-evento">Qué debe saber el propietario (opcional)</label>
          <input id="detalle-evento" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        </div>
        {motivo && titulo && <p className="acceso__nota">{motivo}</p>}
        <button
          className="boton boton--primario boton--bloque"
          disabled={cargando || !!motivo}
          onClick={async () => {
            const hecho = await ejecutar(
              (base) =>
                programarEventoEdificio(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, titulo, tipo, fecha, horaInicio, horaFin, detalle }),
              'Quedó en el calendario del edificio.',
            )
            if (hecho) {
              setTitulo('')
              setDetalle('')
            }
          }}
        >
          Agregar al calendario
        </button>
      </div>
      <div className="tarjeta">
        <strong>Próximos</strong>
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
          {eventos.length === 0 && <p className="subtitulo">No hay nada programado.</p>}
          {eventos.map((e) => (
            <div key={e.id} className="columna" style={{ gap: 'var(--e1)' }}>
              <div className="fila">
                <span style={e.cancelacion ? { textDecoration: 'line-through' } : undefined}>
                  {formatearFecha(e.fecha)} · {e.titulo}
                </span>
                {!e.cancelacion && (
                  <button className="boton boton--pequeno" onClick={() => setCancelando(e.id)}>
                    Cancelar
                  </button>
                )}
              </div>
              {cancelando === e.id && (
                <div className="fila">
                  <input aria-label="Motivo de la cancelación" value={motivoCancelacion} onChange={(ev) => setMotivoCancelacion(ev.target.value)} placeholder="El proveedor cambió la fecha" style={{ flex: 1 }} />
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando || motivoCancelacion.trim().length < 5}
                    onClick={async () => {
                      const hecho = await ejecutar((base) => cancelarEventoEdificio(base, { eventoId: e.id, personaId: sesion.personaId, motivo: motivoCancelacion }), 'Evento cancelado.')
                      if (hecho) {
                        setCancelando(null)
                        setMotivoCancelacion('')
                      }
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
