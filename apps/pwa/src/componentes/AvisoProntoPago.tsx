/**
 * CU-R-35 · PN-01 — El aviso del descuento por pronto pago, para el propietario.
 *
 * Se dice en positivo —«te ahorras»—, nunca como castigo al que paga después
 * (docs/08-convenciones.md §6 bis). Si hay una cuota que todavía lo gana, se dice
 * cuánto paga y hasta cuándo; si no, se recuerda que el edificio lo ofrece.
 */

import type { Cuota, ProntoPago } from '../dominio/tipos'
import { descuentoProntoPago, fechaLimiteProntoPago, hoyISO } from '../dominio/reglas'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../utilidades/formato'

export function AvisoProntoPago({ cuotas, config }: { cuotas: Cuota[]; config?: ProntoPago }) {
  if (!config?.activo) return null
  const hoy = hoyISO()
  const ganan = cuotas
    .map((cuota) => ({ cuota, descuento: descuentoProntoPago(cuota, config, hoy) }))
    .filter((c) => c.descuento > 0)

  return (
    <div className="tarjeta tarjeta--plana tarjeta--exito columna" style={{ gap: 'var(--e1)' }}>
      <strong>Descuento por pronto pago: {config.porcentaje} %</strong>
      {ganan.length > 0 ? (
        ganan.map(({ cuota, descuento }) => (
          <span key={cuota.id} className="subtitulo">
            Si pagas la cuota de {formatearPeriodo(cuota.periodo)} hasta el{' '}
            <strong>{formatearFecha(fechaLimiteProntoPago(cuota.periodo, config.diaLimite))}</strong>, pagas{' '}
            <strong>{formatearDinero(cuota.saldo - descuento)}</strong> y te ahorras {formatearDinero(descuento)}.
          </span>
        ))
      ) : (
        <span className="subtitulo">
          Pagando la cuota de administración hasta el día {config.diaLimite} de cada mes, te ahorras el{' '}
          {config.porcentaje} %.
        </span>
      )}
    </div>
  )
}
