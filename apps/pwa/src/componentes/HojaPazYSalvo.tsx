/**
 * El paz y salvo tal como se imprime — CU-R-12, ADR-0006.
 *
 * Sigue el modelo de paz y salvo que aporto Mary el 2026-08-28, que es como lo
 * escribe hoy un administrador. Dos cosas de ese modelo cambiaron el sistema, no
 * solo esta hoja:
 *
 *  - **Certifica «hasta el dia X»**, no «vale 30 dias». Es el fin del ultimo
 *    periodo cubierto. La caducidad del papel, si la hay, es otra decision.
 *  - **Nombra el parqueadero** junto al apartamento: es parte de lo que se
 *    certifica, y estaba en el modelo de datos sin usarse.
 *
 * En pantalla no se ve: existe para la hoja de impresion (`@media print`), que es
 * como el residente obtiene su PDF sin servidor y sin conexion.
 */

import type { Copropiedad, Documento, Persona, Unidad } from '../dominio/tipos'
import { diaEnLetras, formatearFecha } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'

export function HojaPazYSalvo({
  documento,
  copropiedad,
  unidad,
  propietarios,
  administrador,
}: {
  documento: Documento
  copropiedad?: Copropiedad
  unidad?: Unidad
  /** Puede ser mas de uno: el modelo original certifica a dos hermanas. */
  propietarios: Persona[]
  administrador?: Persona
}) {
  const [anio, , dia] = documento.emitidoEn.split('-')
  const nombreMes = formatearFecha(documento.emitidoEn).split(' de ')[1]
  const numeroDia = Number(dia)

  const parqueaderos = unidad?.parqueaderos ?? []
  const nombres = propietarios.map((p) => nombreCompleto(p).toUpperCase())

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>PAZ Y SALVO</h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      <p>
        El suscrito administrador de <strong>{copropiedad?.nombre}</strong>, ubicado en{' '}
        {copropiedad?.direccion} de la ciudad de {copropiedad?.ciudad}, se permite certificar
        que el {unidad?.tipo ?? 'inmueble'} <strong>{unidad?.numero}</strong> de la{' '}
        {unidad?.torre}
        {parqueaderos.length > 0 &&
          ` y el parqueadero ${parqueaderos.length > 1 ? 'número' : 'número'} ${parqueaderos.join(' y ')}`}
        , a nombre de <strong>{nombres.length > 0 ? nombres.join(' Y ') : 'su propietario'}</strong>,
        se encuentra <strong>a paz y salvo por concepto de cuotas de administración</strong>{' '}
        hasta el día {formatearFecha(documento.cubiertoHasta)}.
      </p>

      <p>
        Para constancia se firma a los {numeroDia} ({diaEnLetras(numeroDia)}) días del mes de{' '}
        {nombreMes} de {anio}.
      </p>

      <div className="hoja-documento__firma">
        <p>Atentamente,</p>
        <div className="hoja-documento__linea" />
        <p>
          <strong>{nombreCompleto(administrador).toUpperCase()}</strong>
          <br />
          {administrador?.documento ? `C.C. ${administrador.documento}` : ''}
          <br />
          Administrador
          {administrador?.email ? (
            <>
              <br />
              {administrador.email}
            </>
          ) : null}
          {administrador?.telefono ? (
            <>
              <br />
              {administrador.telefono}
            </>
          ) : null}
        </p>
      </div>

      {/* El pie va en todas las paginas: es lo que permite confirmar el documento
          con la administracion sin depender de la buena fe del papel. */}
      <footer className="hoja-documento__pie">
        Documento {documento.numero} · código de verificación {documento.codigoVerificacion} ·
        expedido el {formatearFecha(documento.emitidoEn)} · generado con Idiky
      </footer>
    </article>
  )
}
