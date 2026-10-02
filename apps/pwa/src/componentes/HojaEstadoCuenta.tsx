/**
 * El estado de cuenta tal como se imprime — CU-R-18, RN-127, ADR-0006.
 *
 * Misma plantilla que el paz y salvo: encabezado con la copropiedad y su NIT,
 * cuerpo propio, y el pie con número y código de verificación en todas las
 * páginas. Se dibuja **con lo que quedó congelado en el documento**, no con la
 * cartera de hoy: reimprimirlo da el mismo papel.
 *
 * En pantalla no se ve, salvo dentro de la vista previa: existe para la hoja de
 * impresión (`@media print`), que es como el propietario obtiene su PDF.
 */

import type { Copropiedad, Documento, Persona, Unidad } from '../dominio/tipos'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../utilidades/formato'
import { fechaCorta } from '../dominio/reglas'
import { nombreCompleto } from '../datos/selectores'

export function HojaEstadoCuenta({
  documento,
  copropiedad,
  unidad,
  propietarios,
  administrador,
}: {
  documento: Documento
  copropiedad?: Copropiedad
  unidad?: Unidad
  propietarios: Persona[]
  administrador?: Persona
}) {
  const estado = documento.estadoCuenta
  if (!estado) return null
  const nombres = propietarios.map((p) => nombreCompleto(p).toUpperCase())
  const aFavor = estado.saldoFinal < 0

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>ESTADO DE CUENTA</h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      <p>
        {unidad?.tipo ? `${unidad.tipo[0].toUpperCase()}${unidad.tipo.slice(1)}` : 'Unidad'}{' '}
        <strong>{unidad?.numero}</strong> de la {unidad?.torre}, a nombre de{' '}
        <strong>{nombres.length > 0 ? nombres.join(' Y ') : 'su propietario'}</strong>. Movimientos de{' '}
        {formatearPeriodo(estado.desde)} a {formatearPeriodo(estado.hasta)}, por concepto de cuotas y
        demás cobros de la copropiedad.
      </p>

      <table className="hoja-documento__tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th style={{ textAlign: 'right' }}>Cargo</th>
            <th style={{ textAlign: 'right' }}>Abono</th>
            <th style={{ textAlign: 'right' }}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td />
            <td>
              <strong>Saldo anterior</strong>
            </td>
            <td />
            <td />
            <td style={{ textAlign: 'right' }}>{formatearDinero(estado.saldoInicial)}</td>
          </tr>
          {estado.movimientos.map((m, i) => (
            <tr key={i}>
              <td style={{ whiteSpace: 'nowrap' }}>{fechaCorta(m.fecha)}</td>
              <td>{m.concepto}</td>
              <td style={{ textAlign: 'right' }}>{m.tipo === 'cargo' ? formatearDinero(m.valor) : ''}</td>
              <td style={{ textAlign: 'right' }}>{m.tipo === 'abono' ? formatearDinero(m.valor) : ''}</td>
              <td style={{ textAlign: 'right' }}>{formatearDinero(m.saldo)}</td>
            </tr>
          ))}
          <tr>
            <td />
            <td>
              <strong>Totales del periodo</strong>
            </td>
            <td style={{ textAlign: 'right' }}>
              <strong>{formatearDinero(estado.totalCargos)}</strong>
            </td>
            <td style={{ textAlign: 'right' }}>
              <strong>{formatearDinero(estado.totalAbonos)}</strong>
            </td>
            <td />
          </tr>
        </tbody>
      </table>

      <p>
        {aFavor ? (
          <>
            Al cierre del periodo la unidad tiene un <strong>saldo a favor de {formatearDinero(-estado.saldoFinal)}</strong>.
          </>
        ) : estado.saldoFinal === 0 ? (
          <>
            Al cierre del periodo la unidad <strong>no tiene saldo pendiente</strong>.
          </>
        ) : (
          <>
            Al cierre del periodo el <strong>valor adeudado es {formatearDinero(estado.saldoFinal)}</strong>.
          </>
        )}{' '}
        Los abonos informados que la administración todavía no ha aplicado no se incluyen. Este
        documento no es un paz y salvo.
      </p>

      <div className="hoja-documento__firma">
        <p>Expedido a solicitud de {estado.solicitadoPor}.</p>
        <div className="hoja-documento__linea" />
        <p>
          <strong>{nombreCompleto(administrador).toUpperCase()}</strong>
          <br />
          Administrador
          {administrador?.email ? (
            <>
              <br />
              {administrador.email}
            </>
          ) : null}
        </p>
      </div>

      <footer className="hoja-documento__pie">
        Documento {documento.numero} · código de verificación {documento.codigoVerificacion} ·
        expedido el {formatearFecha(documento.emitidoEn)} · generado con Idiky
      </footer>
    </article>
  )
}
