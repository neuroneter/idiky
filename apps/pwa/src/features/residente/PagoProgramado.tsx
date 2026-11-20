/**
 * CU-R-36 — Programar el pago de mi cuota (PN-02).
 * Doc: docs/casos-de-uso/residente.md#cu-r-36
 *
 * El propietario elige el día y el medio, y la cuota de administración de cada
 * mes se paga sola; le llega un mensaje con el recibo. Solo la ordinaria: lo
 * demás lo decide él. Simulado en el demo (sin pasarela, fase 4).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cancelarPagoProgramado, programarPago } from '../../datos/repositorio'
import { decideEnLaUnidad, motivoPagoProgramadoInvalido } from '../../dominio/reglas'
import type { MedioProgramado } from '../../dominio/tipos'

const MEDIOS: Record<MedioProgramado, string> = { pse: 'Débito PSE de mi cuenta', tarjeta: 'Tarjeta de crédito' }

export function PagoProgramado() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const actual = sel.pagoProgramadoDe(bd, sesion?.unidadActivaId)
  const prontoPago = sesion ? sel.copropiedad(bd, sesion.copropiedadId)?.prontoPago : undefined
  const [editando, setEditando] = useState(false)
  const [dia, setDia] = useState(String(actual?.dia ?? (prontoPago?.activo ? Math.min(prontoPago.diaLimite, 5) : 5)))
  const [medio, setMedio] = useState<MedioProgramado>(actual?.medio ?? 'pse')
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  // PN-20 — Solo para el propietario o el arrendatario.
  if (!decideEnLaUnidad(sel.rolEnUnidad(bd, sesion.personaId, unidadId))) return null
  const motivo = motivoPagoProgramadoInvalido(Number(dia))

  return (
    <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
      <div className="fila">
        <strong>Pago programado</strong>
        <span className={actual ? 'chip chip--exito' : 'chip'}>{actual ? 'Activo' : 'Sin programar'}</span>
      </div>
      {actual && !editando ? (
        <>
          <p className="subtitulo">
            La cuota de administración se paga sola el día <strong>{actual.dia}</strong> de cada mes con{' '}
            {MEDIOS[actual.medio].toLowerCase()}. Te avisamos con el recibo.
          </p>
          <div className="grupo-botones">
            <button className="boton" onClick={() => setEditando(true)}>
              Cambiar
            </button>
            <button
              className="boton"
              disabled={cargando}
              onClick={() =>
                void ejecutar(
                  (base) => cancelarPagoProgramado(base, { programadoId: actual.id, personaId: sesion.personaId }),
                  'Listo, ya no se paga solo. Puedes pagar cuando quieras.',
                )
              }
            >
              Desactivar
            </button>
          </div>
        </>
      ) : !editando ? (
        <>
          <p className="subtitulo">Olvídate de la fecha: elige un día y tu cuota de administración se paga sola.</p>
          <button className="boton" onClick={() => setEditando(true)}>
            Programar el pago
          </button>
        </>
      ) : (
        <>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="dia-programado">Día del mes</label>
              <input id="dia-programado" type="number" min={1} max={28} value={dia} onChange={(e) => setDia(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="medio-programado">Con</label>
              <select id="medio-programado" value={medio} onChange={(e) => setMedio(e.target.value as MedioProgramado)}>
                {(Object.keys(MEDIOS) as MedioProgramado[]).map((m) => (
                  <option key={m} value={m}>
                    {MEDIOS[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {prontoPago?.activo && Number(dia) <= prontoPago.diaLimite && (
            <p className="subtitulo" style={{ color: 'var(--color-exito)' }}>
              Con ese día ganas el descuento por pronto pago ({prontoPago.porcentaje} %).
            </p>
          )}
          {motivo && <p className="acceso__nota">{motivo}</p>}
          <p className="ayuda-campo">
            Solo se paga la cuota de administración del mes. Si el día de este mes ya pasó, empieza el próximo.
            Demo: no se hace ningún cobro real.
          </p>
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando || !!motivo}
              onClick={async () => {
                const hecho = await ejecutar(
                  (base) => programarPago(base, { unidadId, personaId: sesion.personaId, medio, dia: Number(dia) }),
                  'Pago programado. Te avisamos cada mes con tu recibo.',
                )
                if (hecho) setEditando(false)
              }}
            >
              Guardar
            </button>
            <button className="boton" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
