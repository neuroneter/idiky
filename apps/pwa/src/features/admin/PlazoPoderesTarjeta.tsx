/**
 * RN-309 — Hasta cuándo se dan y se revocan los poderes (Daniel, 2026-11-03; confirmada por Mary,
 * 2026-11-27). Doc: docs/casos-de-uso/administrador.md#cu-a-12
 *
 * La Ley 675 no fija plazo: lo dice el reglamento de cada edificio. Nunca durante la reunión: el
 * poder que no se revocó antes queda para esa asamblea.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { configurarPlazoPoderes } from '../../datos/repositorio'
import { PLAZO_PODERES_POR_DEFECTO, textoPlazoPoderes } from '../../dominio/reglas'
import type { PlazoPoderes } from '../../dominio/tipos'

export function PlazoPoderesTarjeta() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const actual = sel.copropiedad(bd, sesion?.copropiedadId ?? '')?.plazoPoderes ?? PLAZO_PODERES_POR_DEFECTO
  const [tipo, setTipo] = useState<PlazoPoderes['tipo']>(actual.tipo)
  const [dias, setDias] = useState(actual.tipo === 'dias_antes' ? String(actual.dias) : '2')
  if (!sesion) return null
  const plazo: PlazoPoderes = tipo === 'dias_antes' ? { tipo, dias: Number(dias) } : { tipo }

  return (
    <div className="tarjeta">
      <strong>Plazo de los poderes</strong>
      <p className="subtitulo">
        Hoy se dan y se revocan <strong>{textoPlazoPoderes(actual)}</strong>. La ley no fija plazo: escoge el que dice
        el reglamento. Durante la reunión nunca.
      </p>
      <div className="segmentos" style={{ marginTop: 'var(--e2)' }}>
        {(
          [
            ['hasta_quorum', 'Hasta verificar el quórum'],
            ['dia_anterior', 'Hasta el día anterior'],
            ['dias_antes', 'Unos días antes'],
          ] as Array<[PlazoPoderes['tipo'], string]>
        ).map(([id, texto]) => (
          <button key={id} type="button" className="segmento" aria-current={tipo === id ? 'page' : undefined} onClick={() => setTipo(id)}>
            {texto}
          </button>
        ))}
      </div>
      {tipo === 'dias_antes' && (
        <div className="campo" style={{ marginTop: 'var(--e2)' }}>
          <label htmlFor="plazo-dias">Cuántos días antes</label>
          <input id="plazo-dias" type="number" min={1} max={15} value={dias} onChange={(e) => setDias(e.target.value)} style={{ width: '8rem' }} />
        </div>
      )}
      <button
        className="boton boton--pequeno boton--primario"
        style={{ marginTop: 'var(--e2)' }}
        disabled={cargando}
        onClick={() =>
          void ejecutar(
            (base) => configurarPlazoPoderes(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, plazo }),
            `Guardado: los poderes se reciben ${textoPlazoPoderes(plazo)}.`,
          )
        }
      >
        Guardar el plazo
      </button>
    </div>
  )
}
