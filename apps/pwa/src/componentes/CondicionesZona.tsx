/**
 * Lo que cuesta una zona común y la multa si no se cancela a tiempo
 * (RN-109, RN-110). El mismo texto en la consola y en la app del residente:
 * «de igual manera se debe ver en la información de cada zona común» (Mary,
 * 2026-10-01). Lo que el administrador parametriza es lo que el residente lee.
 */

import type { ConceptoSancion, ZonaComun } from '../dominio/tipos'
import { textoRespaldo } from '../dominio/reglas'
import { formatearDinero } from '../utilidades/formato'

function multaDe(zona: ZonaComun, conceptos: ConceptoSancion[]) {
  if (!zona.multaNoCancelar) return undefined
  const concepto = conceptos.find((c) => c.id === zona.multaNoCancelar!.conceptoId)
  return concepto ? { concepto, horas: zona.multaNoCancelar.horasParaCancelar } : undefined
}

/** Una línea, para la lista de zonas: lo esencial para decidir de un vistazo. */
export function resumenCondicionesZona(zona: ZonaComun, conceptos: ConceptoSancion[]): string {
  const partes = [zona.valorUso ? `${formatearDinero(zona.valorUso)} por reserva` : 'sin costo']
  if (zona.deposito) partes.push(`depósito ${formatearDinero(zona.deposito)}`)
  const multa = multaDe(zona, conceptos)
  if (multa) partes.push(`multa si no cancelas con ${multa.horas} h`)
  return partes.join(' · ')
}

/** El detalle: valores, respaldo y la multa con su plazo. */
export function CondicionesZona({
  zona,
  conceptos,
}: {
  zona: ZonaComun
  conceptos: ConceptoSancion[]
}) {
  const multa = multaDe(zona, conceptos)
  return (
    <ul className="especificaciones">
      <li>
        {zona.valorUso ? (
          <>
            Valor por reserva: <strong>{formatearDinero(zona.valorUso)}</strong>
          </>
        ) : (
          'Reservarla no tiene costo.'
        )}
      </li>
      {zona.deposito ? (
        <li>
          Depósito de garantía: <strong>{formatearDinero(zona.deposito)}</strong>. Se devuelve si la
          zona queda como se entregó.
        </li>
      ) : null}
      {zona.respaldoCobro && (zona.valorUso || zona.deposito) ? (
        <li className="tenue">Lo autoriza: {textoRespaldo(zona.respaldoCobro)}</li>
      ) : null}
      {multa ? (
        <li>
          Si no cancelas con al menos <strong>{multa.horas} horas</strong> de anticipación: multa de{' '}
          <strong>{formatearDinero(multa.concepto.valor)}</strong> («{multa.concepto.nombre}»,{' '}
          {textoRespaldo(multa.concepto)}). Se aplica con el proceso sancionatorio, donde puedes
          presentar descargos.
        </li>
      ) : (
        <li>Cancelar no tiene multa.</li>
      )}
    </ul>
  )
}
