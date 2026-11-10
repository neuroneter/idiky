/**
 * El recibo de caja tal como se lee y se imprime — CU-R-19, CU-A-27, RN-77.
 *
 * Es **la misma hoja** para el propietario y para la administración, como el
 * poder y la citación: si cada uno viera la suya, el día que discutan un pago no
 * habría un papel común. Sigue el patrón de las otras hojas: se ve dentro de la
 * previsualización y sale sola al imprimir (`@media print`), que es como se
 * obtiene el PDF (ADR-0006).
 *
 * Un recibo anulado se sigue pudiendo ver e imprimir, y lo dice en grande:
 * no se borra (RN-78), y quien lo presente tiene que ver que ya no vale.
 */

import type { Copropiedad, Cuota, MedioPago, Pago, Persona, Unidad } from '../dominio/tipos'
import { formatearDinero, formatearFecha, formatearFechaHora, formatearPeriodo } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'
import { etiquetaUnidad } from '../dominio/reglas'

export const TEXTO_MEDIO_PAGO: Record<MedioPago, string> = {
  pse: 'PSE',
  tarjeta: 'Tarjeta',
  bre_b: 'Bre-B',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  otro: 'Otro',
}

export function HojaReciboCaja({
  pago,
  copropiedad,
  unidad,
  propietarios,
  cuotaDe,
}: {
  pago: Pago
  copropiedad?: Copropiedad
  unidad?: Unidad
  propietarios: Persona[]
  cuotaDe: (cuotaId: string) => Cuota | undefined
}) {
  const anulado = pago.estado === 'anulado'
  const fecha = pago.fechaAplicacion ?? pago.fecha

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>RECIBO DE CAJA {pago.recibo ?? ''}</h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      {anulado && (
        <p>
          <strong>ANULADO</strong> el {formatearFechaHora(pago.fechaAnulacion ?? '')}
          {pago.motivoAnulacion ? `: ${pago.motivoAnulacion}` : ''}. Este recibo no vale como soporte
          de pago (RN-78).
        </p>
      )}

      <p>
        {copropiedad?.ciudad ? `${copropiedad.ciudad}, ` : ''}
        {formatearFecha(fecha.slice(0, 10))}
      </p>

      <p>
        Recibimos de{' '}
        <strong>
          {propietarios.length > 0
            ? propietarios.map((p) => nombreCompleto(p).toUpperCase()).join(' y ')
            : 'el propietario'}
        </strong>
        , por la unidad <strong>{unidad ? etiquetaUnidad(unidad) : ''}</strong>, la suma de{' '}
        <strong>{formatearDinero(pago.valor)}</strong>, pagada por {TEXTO_MEDIO_PAGO[pago.medio]}
        {pago.referencia ? ` con referencia ${pago.referencia}` : ''}.
      </p>

      <p>
        <strong>Aplicado a</strong>
      </p>
      <ul>
        {pago.imputaciones.map((linea) => {
          const cuota = cuotaDe(linea.cuotaId)
          return (
            <li key={linea.cuotaId}>
              {cuota ? `${cuota.concepto} · ${formatearPeriodo(cuota.periodo)}` : 'Cuota'}:{' '}
              {formatearDinero(linea.valor)}
            </li>
          )
        })}
        {pago.saldoAFavor > 0 && <li>Saldo a favor de la unidad: {formatearDinero(pago.saldoAFavor)}</li>}
      </ul>

      {/* CU-R-19 A1 — Quién lo registró: no es lo mismo pagar en la app que
          llevar la plata a la administración. */}
      <p>
        {pago.origen === 'administracion'
          ? `Pago registrado por la administración (${pago.registradoPor}).`
          : 'Pago hecho por el propietario desde la aplicación.'}
      </p>

      <footer className="hoja-documento__pie">
        Recibo de caja {pago.recibo ?? 'sin número'} · consecutivo único (RN-77) ·{' '}
        {anulado ? 'anulado' : 'vigente'} · generado con Idiky
      </footer>
    </article>
  )
}
