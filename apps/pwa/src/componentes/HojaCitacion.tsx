/**
 * La citación a asamblea tal como se lee y se imprime — CU-A-12, CU-R-20,
 * RN-219, ADR-0006.
 *
 * Es **la misma hoja** para la administración y para el propietario, como el
 * poder: si cada uno viera la suya, el día que alguien impugne la convocatoria
 * no habría un papel común. Sigue el patrón de `HojaPoder`: se ve en la
 * previsualización y sale sola al imprimir (`@media print`); el PDF de verdad
 * lo genera el servidor (ADR-0006).
 *
 * Lleva lo que pide la Ley 675 de 2001: fecha, hora y lugar, el orden del día
 * (art. 39), y —en la primera convocatoria— a qué hora y día se reúne la
 * segunda si no hay quórum (art. 41).
 */

import type { Asamblea, Copropiedad, Documento, Persona } from '../dominio/tipos'
import { formatearFecha, formatearFechaHora } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'
import { HORA_SEGUNDA_CONVOCATORIA, definicionModalidad, fechaSegundaConvocatoria } from '../dominio/reglas'

export function HojaCitacion({
  asamblea,
  documento,
  copropiedad,
  administrador,
}: {
  asamblea: Asamblea
  documento?: Documento
  copropiedad?: Copropiedad
  administrador?: Persona
}) {
  const tipo = asamblea.tipo === 'ordinaria' ? 'ORDINARIA' : 'EXTRAORDINARIA'
  const segunda = asamblea.numeroConvocatoria === 2
  const modalidad = definicionModalidad(asamblea.modalidad)
  const emitido = documento?.emitidoEn ?? asamblea.fechaHora.slice(0, 10)

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>
          CONVOCATORIA A ASAMBLEA GENERAL {tipo} DE COPROPIETARIOS
          {segunda ? ' — SEGUNDA CONVOCATORIA' : ''}
        </h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      <p>
        {copropiedad?.ciudad ? `${copropiedad.ciudad}, ` : ''}
        {formatearFecha(emitido)}
      </p>

      <p>
        Señores <strong>propietarios</strong> de {copropiedad?.nombre ?? 'la copropiedad'}:
      </p>

      <p>
        {segunda ? (
          <>
            Como la asamblea convocada no reunió el quórum, y conforme al artículo 41 de la Ley 675
            de 2001, se les cita a una <strong>segunda convocatoria</strong>, que sesionará y
            decidirá válidamente con cualquier número plural de propietarios, cualquiera que sea el
            porcentaje de coeficientes representados.
          </>
        ) : (
          <>
            Conforme al artículo 39 de la Ley 675 de 2001 y al reglamento de propiedad horizontal,
            se les convoca a la <strong>asamblea general {asamblea.tipo}</strong> de copropietarios.
          </>
        )}
      </p>

      <p>
        <strong>Fecha y hora:</strong> {formatearFechaHora(asamblea.fechaHora)}
        <br />
        <strong>Modalidad:</strong> {modalidad.texto}
        {asamblea.lugar && (
          <>
            <br />
            <strong>Lugar:</strong> {asamblea.lugar}
          </>
        )}
        {asamblea.enlaceTransmision && (
          <>
            <br />
            <strong>Enlace:</strong> {asamblea.enlaceTransmision}
          </>
        )}
        {asamblea.citacion && (
          <>
            <br />
            <strong>Convoca:</strong> {asamblea.citacion}
          </>
        )}
      </p>

      <p>
        <strong>Orden del día</strong>
      </p>
      <ol>
        {asamblea.ordenDelDia.map((punto) => (
          <li key={punto.id}>
            {punto.titulo}
            {punto.seVota ? ' (se somete a votación)' : ''}
          </li>
        ))}
      </ol>

      {/* Art. 41 — Se avisa desde la primera: así nadie se entera tarde. */}
      {!segunda && (
        <p>
          Si a la hora señalada no se reúne el quórum —más de la mitad de los coeficientes
          (art. 45)—, la asamblea se reunirá por derecho propio el{' '}
          <strong>{formatearFecha(fechaSegundaConvocatoria(asamblea.fechaHora))}</strong> a las{' '}
          <strong>{HORA_SEGUNDA_CONVOCATORIA === '20:00' ? '8:00 p. m.' : HORA_SEGUNDA_CONVOCATORIA}</strong>
          {asamblea.lugar ? `, en el mismo lugar` : ''}, y decidirá con cualquier número plural de
          propietarios (art. 41).
        </p>
      )}

      <p>
        Quien no pueda asistir puede hacerse representar mediante <strong>poder</strong>, que se
        otorga desde la aplicación o por escrito. Cada poder vale solo para esta asamblea.
      </p>

      <div className="hoja-documento__firma">
        <p>Atentamente,</p>
        <div className="hoja-documento__linea" />
        <p>
          <strong>{nombreCompleto(administrador).toUpperCase()}</strong>
          <br />
          Administración {copropiedad?.nombre ?? ''}
        </p>
      </div>

      <footer className="hoja-documento__pie">
        {documento ? (
          <>
            Documento {documento.numero} · código de verificación {documento.codigoVerificacion} ·
            emitido el {formatearFecha(emitido)} · enviado a cada propietario · generado con Idiky
          </>
        ) : (
          <>Citación sin documento emitido · Idiky</>
        )}
      </footer>
    </article>
  )
}
