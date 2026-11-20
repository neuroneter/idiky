/**
 * El certificado de pagos del año tal como se lee y se descarga — CU-R-46, PN-14.
 *
 * Lo pide el propietario para la declaración de renta (sobre todo quien arrienda
 * su apartamento) o para quien se lo exija. Certifica lo pagado en el año, recibo
 * por recibo, y lo congelado al emitirlo: reimprimirlo da el mismo papel.
 * Sigue el patrón de las otras hojas: se ve en la previsualización y sale sola
 * al descargar el PDF (ADR-0006).
 */

import type { Copropiedad, Documento, Persona, Unidad } from '../dominio/tipos'
import { formatearDinero, formatearFecha } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'
import { etiquetaUnidad } from '../dominio/reglas'
import { TEXTO_MEDIO_PAGO } from './HojaReciboCaja'

export function HojaCertificadoPagos({
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
  const certificado = documento.certificadoPagos
  if (!certificado) return null
  const nombres = propietarios.map((p) => nombreCompleto(p).toUpperCase())

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>CERTIFICADO DE PAGOS {certificado.anio}</h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      {documento.estado === 'anulado' && (
        <p>
          <strong>ANULADO</strong>
          {documento.motivoAnulacion ? `: ${documento.motivoAnulacion}` : ''}. Este certificado ya no vale.
        </p>
      )}

      <p>
        La administración de <strong>{copropiedad?.nombre}</strong>
        {copropiedad?.ciudad ? `, de la ciudad de ${copropiedad.ciudad},` : ''} certifica que por la unidad{' '}
        <strong>{unidad ? etiquetaUnidad(unidad) : ''}</strong>, a nombre de{' '}
        <strong>{nombres.length > 0 ? nombres.join(' Y ') : 'su propietario'}</strong>, se recibieron durante el año{' '}
        <strong>{certificado.anio}</strong> pagos por un total de <strong>{formatearDinero(certificado.total)}</strong>,
        así:
      </p>

      <table className="hoja-documento__tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Recibo</th>
            <th>Concepto</th>
            <th>Medio</th>
            <th style={{ textAlign: 'right' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {certificado.pagos.map((p) => (
            <tr key={p.recibo}>
              <td>{formatearFecha(p.fecha)}</td>
              <td>{p.recibo}</td>
              <td>{p.conceptos}</td>
              <td>{TEXTO_MEDIO_PAGO[p.medio]}</td>
              <td style={{ textAlign: 'right' }}>{formatearDinero(p.valor)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={4}>
              <strong>Total pagado en {certificado.anio}</strong>
            </td>
            <td style={{ textAlign: 'right' }}>
              <strong>{formatearDinero(certificado.total)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {certificado.descuentos > 0 && (
        <p>
          Además, se concedieron descuentos por pronto pago por {formatearDinero(certificado.descuentos)}, que no
          están incluidos en el total pagado.
        </p>
      )}

      <p>Se expide a solicitud del interesado el {formatearFecha(documento.emitidoEn)}.</p>

      <div className="hoja-documento__firma">
        <div className="hoja-documento__linea" />
        <p>
          <strong>{nombreCompleto(administrador).toUpperCase()}</strong>
          <br />
          Administración {copropiedad?.nombre ?? ''}
        </p>
      </div>

      <footer className="hoja-documento__pie">
        Documento {documento.numero} · código de verificación {documento.codigoVerificacion} · expedido el{' '}
        {formatearFecha(documento.emitidoEn)} · generado con Idiky
      </footer>
    </article>
  )
}
