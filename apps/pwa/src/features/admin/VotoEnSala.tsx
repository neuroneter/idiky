/**
 * PN-30 — El voto en la sala (CU-A-18; Mary, 2026-11-27).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-18
 *
 * En la asamblea presencial, cada propietario vota desde su celular. **Quien no tiene celular** vota
 * de viva voz o con la mano, y la administración lo registra aquí por su unidad. Solo aparecen las
 * unidades que registraron su llegada y todavía no votan; el voto queda marcado «en sala».
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { registrarVotoEnSala } from '../../datos/repositorio'
import { etiquetaUnidad, presentesSinVotar } from '../../dominio/reglas'
import type { Votacion } from '../../dominio/tipos'

export function VotoEnSala({ votacion }: { votacion: Votacion }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [unidadId, setUnidadId] = useState('')
  const [opcionId, setOpcionId] = useState('')
  if (!sesion || votacion.estado !== 'abierta') return null
  const faltan = presentesSinVotar(bd.asistencias, votacion.asambleaId, bd.votos, votacion.id)

  return (
    <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e2)' }}>
      <strong>Votos en la sala</strong>
      <p className="subtitulo">
        {faltan.length === 0
          ? 'Ya votaron todas las unidades presentes.'
          : `${faltan.length === 1 ? 'Falta 1 unidad presente' : `Faltan ${faltan.length} unidades presentes`} por votar. Si alguien no tiene celular, registra aquí su voto.`}
      </p>
      {faltan.length > 0 && (
        <div className="fila" style={{ gap: 'var(--e2)', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <select aria-label="Unidad que vota en la sala" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
            <option value="">Unidad…</option>
            {faltan.map((a) => {
              const u = sel.unidad(bd, a.unidadId)
              const p = sel.persona(bd, a.personaId)
              return (
                <option key={a.unidadId} value={a.unidadId}>
                  {u ? etiquetaUnidad(u) : a.unidadId} · {p ? `${p.nombres} ${p.apellidos}` : ''}
                </option>
              )
            })}
          </select>
          <select aria-label="Opción que vota en la sala" value={opcionId} onChange={(e) => setOpcionId(e.target.value)}>
            <option value="">Opción…</option>
            {votacion.opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.texto}
              </option>
            ))}
          </select>
          <button
            className="boton boton--pequeno boton--primario"
            disabled={cargando || !unidadId || !opcionId}
            onClick={async () => {
              const hecho = await ejecutar(
                (base) => registrarVotoEnSala(base, { votacionId: votacion.id, unidadId, opcionId, personaId: sesion.personaId }),
                'Voto registrado en la sala.',
              )
              if (hecho) {
                setUnidadId('')
                setOpcionId('')
              }
            }}
          >
            Registrar voto
          </button>
        </div>
      )}
    </div>
  )
}
