/**
 * RN-23 (T-59) — El día en que vence la cuota en este edificio, en la
 * parametrización de la cartera (Mary, 2026-11-23: «depende de las reglas de
 * cada edificio: hay estándares que dicen el 10 y otros el día 15»).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { configurarDiaVencimiento } from '../../datos/repositorio'
import { DIA_VENCIMIENTO_CUOTA, motivoDiaVencimientoInvalido } from '../../dominio/reglas'

export function DiaVencimientoTarjeta() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const actual = (sesion && sel.copropiedad(bd, sesion.copropiedadId)?.diaVencimiento) || DIA_VENCIMIENTO_CUOTA
  const [dia, setDia] = useState(String(actual))
  if (!sesion) return null
  const motivo = motivoDiaVencimientoInvalido(Number(dia))

  return (
    <div className="tarjeta">
      <div className="fila">
        <strong>Vencimiento de la cuota</strong>
        <span className="chip chip--info">Día {actual}</span>
      </div>
      <p className="subtitulo">Lo fija el reglamento del edificio. Aplica a las cuotas que se generen desde ahora.</p>
      <label className="fila" style={{ gap: 'var(--e1)', justifyContent: 'flex-start', marginTop: 'var(--e2)' }}>
        <span className="subtitulo">Vence el día</span>
        <input type="number" min={1} max={28} aria-label="Día de vencimiento" value={dia} onChange={(e) => setDia(e.target.value)} style={{ width: '5rem' }} />
        <span className="subtitulo">de cada mes</span>
      </label>
      {motivo && <p className="acceso__nota">{motivo}</p>}
      <button
        className="boton boton--primario"
        style={{ marginTop: 'var(--e2)' }}
        disabled={cargando || !!motivo || Number(dia) === actual}
        onClick={() =>
          void ejecutar(
            (base) => configurarDiaVencimiento(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, dia: Number(dia) }),
            'Día de vencimiento guardado.',
          )
        }
      >
        Guardar
      </button>
    </div>
  )
}
