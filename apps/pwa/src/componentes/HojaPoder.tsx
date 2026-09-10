/**
 * El poder tal como se lee y se imprime — CU-R-23, CU-A-19, ADR-0006.
 *
 * **Un poder es un documento que alguien va a presentar.** El apoderado llega a
 * la asamblea y tiene que poder mostrar con qué viene; la administración tiene
 * que poder leer lo mismo que él muestra. Por eso esta hoja existe en las dos
 * caras y es **la misma**: si cada uno viera su versión, el día que discutan no
 * habría un documento común sobre el cual discutir — igual que el expediente
 * sancionatorio.
 *
 * Sigue el patrón de `HojaPazYSalvo`: se ve en pantalla dentro de la
 * previsualización y sale sola al imprimir (`@media print`). El PDF de verdad lo
 * genera el servidor, que todavía no existe (ADR-0006, ADR-0008), y por eso
 * **aquí no hay ningún botón de descargar**.
 *
 * **El texto no supone el género de nadie.** La fórmula notarial de siempre
 * —«identificado con documento»— nombra a una persona concreta y se equivoca la
 * mitad de las veces. «Con documento» dice lo mismo y no se equivoca nunca.
 */

import type { Asamblea, Copropiedad, Documento, Persona, Poder, Unidad } from '../dominio/tipos'
import { diaEnLetras, formatearFecha, formatearFechaHora } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'
import { etiquetaUnidad } from '../dominio/reglas'

export function HojaPoder({
  poder,
  documento,
  copropiedad,
  asamblea,
  unidad,
  otorgante,
  apoderado,
}: {
  poder: Poder
  /** Solo cuando Idiky lo emitió (`origen: 'app'`). En papel, el documento es el papel. */
  documento?: Documento
  copropiedad?: Copropiedad
  asamblea?: Asamblea
  unidad?: Unidad
  otorgante?: Persona
  apoderado?: Persona
}) {
  const emitido = (documento?.emitidoEn ?? poder.registradoEn).slice(0, 10)
  const [anio, , dia] = emitido.split('-')
  const nombreMes = formatearFecha(emitido).split(' de ')[1]
  const numeroDia = Number(dia)

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>PODER PARA ASAMBLEA</h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      <p>
        Yo, <strong>{nombreCompleto(otorgante).toUpperCase()}</strong>
        {otorgante?.documento ? `, con documento ${otorgante.documento},` : ','} en mi calidad de{' '}
        <strong>propietario</strong> del inmueble{' '}
        <strong>{unidad ? etiquetaUnidad(unidad) : ''}</strong> de{' '}
        {copropiedad?.nombre ?? 'la copropiedad'}, confiero poder a{' '}
        <strong>{nombreCompleto(apoderado).toUpperCase()}</strong>
        {apoderado?.documento ? `, con documento ${apoderado.documento},` : ','} para que me
        represente con voz y voto en la <strong>{asamblea?.titulo ?? 'asamblea'}</strong>
        {asamblea ? `, del ${formatearFechaHora(asamblea.fechaHora)}` : ''}.
      </p>

      {/* El coeficiente va en el papel: es **lo que se está cediendo**, y quien
          recibe el poder tiene derecho a saber con cuánto peso llega. */}
      <p>
        La representación comprende la asistencia, la deliberación y el voto de la unidad, cuyo
        coeficiente de copropiedad es{' '}
        <strong>{unidad ? `${unidad.coeficiente} %` : 'el que le corresponda'}</strong>, en todos
        los puntos del orden del día.
      </p>

      <p>
        Para constancia se firma a los {numeroDia} ({diaEnLetras(numeroDia)}) días del mes de{' '}
        {nombreMes} de {anio}.
      </p>

      <div className="hoja-documento__firma">
        <p>Atentamente,</p>
        <div className="hoja-documento__linea" />
        <p>
          <strong>{nombreCompleto(otorgante).toUpperCase()}</strong>
          <br />
          {otorgante?.documento ? `C.C. ${otorgante.documento}` : ''}
          <br />
          Propietario {unidad ? etiquetaUnidad(unidad) : ''}
        </p>
      </div>

      {/* Qué respalda este poder, dicho en el papel: no es lo mismo uno firmado
          a mano que uno otorgado desde una sesión autenticada, y quien lo recibe
          tiene que poder distinguirlos sin preguntar. */}
      <footer className="hoja-documento__pie">
        {poder.origen === 'app' && documento ? (
          <>
            Documento {documento.numero} · código de verificación {documento.codigoVerificacion} ·
            otorgado desde la aplicación por su propietario el {formatearFecha(emitido)} · generado
            con Idiky
          </>
        ) : (
          <>
            Poder suscrito fuera de la aplicación y registrado por la administración el{' '}
            {formatearFecha(emitido)} · el documento firmado reposa como soporte · Idiky
          </>
        )}
      </footer>
    </article>
  )
}
