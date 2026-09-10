/**
 * El acta de la asamblea — CU-A-20, Ley 675 de 2001 artículo 47, ADR-0006.
 *
 * **Casi todo lo que la ley exige ya estaba registrado.** El artículo 47 pide
 * que el acta indique «si la reunión es ordinaria o extraordinaria, la forma de
 * la convocatoria, orden del día, nombre y calidad de los asistentes, su unidad
 * privada y su respectivo coeficiente, y los votos emitidos en cada caso».
 *
 * Idiky tiene las cinco cosas, así que **esta hoja no las copia: las lee**. Y
 * ahí se paga una decisión vieja: la asistencia y el voto guardan **su propio
 * coeficiente, copiado en el momento** (RN-37). Si mañana cambia el coeficiente
 * de una unidad, esta acta sigue diciendo con cuánto se contó — que es
 * exactamente lo que un acta tiene que poder hacer.
 *
 * Lo único que se escribe a mano es lo que el sistema no puede saber: quién
 * presidió, quién fue secretario, y qué se dijo.
 */

import type {
  Acta,
  Asamblea,
  Asistencia,
  Copropiedad,
  Documento,
  Persona,
  Unidad,
  Votacion,
  Voto,
} from '../dominio/tipos'
import { formatearFecha, formatearFechaHora } from '../utilidades/formato'
import { nombreCompleto } from '../datos/selectores'
import {
  actaTieneComision,
  contarVotacion,
  etiquetaUnidad,
  hayQuorum,
  mayoriaDelPunto,
  resultadoVotacion,
  resumenAsistencia,
  verificacionVigente,
} from '../dominio/reglas'

function porcentaje(valor: number): string {
  return `${valor.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

export function HojaActa({
  acta,
  documento,
  copropiedad,
  asamblea,
  asistencias,
  personaDe,
  unidadDe,
  votacionDePunto,
  votosDe,
  presidente,
  secretario,
  coeficienteEdificio,
  quorumMinimo,
  actaOriginal,
}: {
  acta: Acta
  documento?: Documento
  copropiedad?: Copropiedad
  asamblea?: Asamblea
  asistencias: Asistencia[]
  personaDe: (id: string) => Persona | undefined
  unidadDe: (id: string) => Unidad | undefined
  votacionDePunto: (puntoId: string) => Votacion | undefined
  votosDe: (votacionId: string) => Voto[]
  presidente?: Persona
  secretario?: Persona
  coeficienteEdificio: number
  quorumMinimo: number
  /** Si esta acta aclara otra, la original — para citarla. */
  actaOriginal?: Acta
}) {
  if (!asamblea) return null

  const resumen = resumenAsistencia(asistencias, asamblea.id)
  const quorum = hayQuorum(asamblea, resumen, quorumMinimo)
  const deLaAsamblea = asistencias.filter((a) => a.asambleaId === asamblea.id)

  return (
    <article className="hoja-documento">
      <header className="hoja-documento__encabezado">
        <h1>{acta.aclaraActaId ? 'ACTA ACLARATORIA' : 'ACTA DE ASAMBLEA'}</h1>
        <p>
          {copropiedad?.nombre}
          {copropiedad?.nit ? ` · NIT ${copropiedad.nit}` : ''}
        </p>
      </header>

      {/* Una aclaratoria dice de entrada a qué acta aclara: si hay que leerla
          suelta, tiene que poder encontrarse la original. */}
      {acta.aclaraActaId && (
        <p>
          La presente acta <strong>aclara</strong> el acta de la misma asamblea
          {actaOriginal?.aprobadaEn
            ? `, aprobada el ${formatearFecha(actaOriginal.aprobadaEn.slice(0, 10))}`
            : ''}
          . La original <strong>no se modifica</strong>.
        </p>
      )}

      {/* Art. 47: ordinaria o extraordinaria, y la forma de la convocatoria. */}
      <p>
        En {copropiedad?.ciudad ?? ''}, siendo el {formatearFechaHora(asamblea.fechaHora)}, se
        reunió la <strong>asamblea general {asamblea.tipo}</strong> de{' '}
        {copropiedad?.nombre ?? 'la copropiedad'}, convocada mediante{' '}
        <strong>{asamblea.citacion}</strong>, en{' '}
        {asamblea.modalidad === 'presencial'
          ? `sesión presencial en ${asamblea.lugar}`
          : asamblea.modalidad === 'virtual'
            ? 'sesión virtual'
            : `sesión mixta, presencial en ${asamblea.lugar} y virtual`}
        , en{' '}
        <strong>{asamblea.numeroConvocatoria === 2 ? 'segunda' : 'primera'} convocatoria</strong>.
      </p>

      {/* Art. 45 y 41: el quorum, y con qué regla se verificó. */}
      <h2>Verificación del quórum</h2>
      <p>
        Se registró la asistencia de <strong>{resumen.unidades}</strong>{' '}
        {resumen.unidades === 1 ? 'unidad privada' : 'unidades privadas'}, que representan{' '}
        <strong>{porcentaje(resumen.coeficiente)}</strong> de los coeficientes de copropiedad
        {asamblea.modalidad === 'mixta' &&
          ` (${resumen.presenciales} de forma presencial y ${resumen.virtuales} de forma virtual)`}
        .{' '}
        {asamblea.numeroConvocatoria === 2
          ? 'Tratándose de reunión de segunda convocatoria, la asamblea sesiona válidamente con cualquier número plural de propietarios (Ley 675 de 2001, artículo 41).'
          : `Se ${quorum ? 'verificó' : 'no verificó'} el quórum exigido por el artículo 45 de la Ley 675 de 2001: número plural de propietarios que representen más de la mitad de los coeficientes.`}
      </p>

      {/* RN-75 — En una sesión que no fue solo presencial, el acta dice por qué
          la asistencia remota cuenta igual. Es lo que se impugna. */}
      {asamblea.modalidad !== 'presencial' && (
        <p>
          La asistencia registrada por medio virtual computa en las mismas condiciones que la
          presencial, conforme al artículo 42 de la Ley 675 de 2001 —que admite la reunión no
          presencial «de conformidad con el quórum requerido para el respectivo caso»— y al artículo
          1.º del Decreto 398 de 2020, según el cual las disposiciones sobre convocatoria, quórum y
          mayorías de las reuniones presenciales se aplican por igual a las no presenciales y a las
          mixtas.
        </p>
      )}

      {/* **Sin quórum no hay decisiones válidas**, y el acta tiene que decirlo
          antes de listar nada. Un acta que constata que faltó quórum y a
          renglón seguido reporta puntos «aprobados» es exactamente la que se
          anula: se contradice a sí misma. */}
      {!quorum && (
        <p>
          <strong>
            Al no haberse verificado el quórum exigido, la asamblea no quedó habilitada para adoptar
            decisiones válidas.
          </strong>{' '}
          Lo que sigue se deja como constancia de lo actuado, sin que las votaciones relacionadas
          produzcan efectos.
        </p>
      )}

      {/* Art. 47: nombre y calidad de los asistentes, su unidad y su coeficiente. */}
      <h2>Asistentes</h2>
      <table className="hoja-documento__tabla">
        <thead>
          <tr>
            <th>Unidad privada</th>
            <th>Asistente</th>
            <th>Calidad</th>
            <th>Coeficiente</th>
          </tr>
        </thead>
        <tbody>
          {deLaAsamblea.map((asistencia) => {
            const unidad = unidadDe(asistencia.unidadId)
            const persona = personaDe(asistencia.personaId)
            return (
              <tr key={asistencia.id}>
                <td>{unidad ? etiquetaUnidad(unidad) : '—'}</td>
                <td>{persona ? nombreCompleto(persona) : '—'}</td>
                <td>{asistencia.poderId ? 'Apoderado' : 'Propietario'}</td>
                <td>{porcentaje(asistencia.coeficiente)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h2>Orden del día</h2>
      <ol>
        {asamblea.ordenDelDia.map((punto) => (
          <li key={punto.id}>{punto.titulo}</li>
        ))}
      </ol>

      {/* Art. 47: los votos emitidos en cada caso. */}
      <h2>Desarrollo y decisiones</h2>
      {asamblea.ordenDelDia.map((punto) => {
        const votacion = votacionDePunto(punto.id)
        if (!punto.seVota || !votacion) {
          return (
            <p key={punto.id}>
              <strong>
                {punto.orden}. {punto.titulo}.
              </strong>{' '}
              {punto.descripcion} Punto informativo; no se sometió a votación.
            </p>
          )
        }
        const votos = votosDe(votacion.id)
        const conteo = contarVotacion(votacion, votos)
        const mayoria = mayoriaDelPunto(punto)
        const resultado = resultadoVotacion({
          conteo,
          mayoria,
          coeficienteRepresentado: resumen.coeficiente,
          coeficienteEdificio,
        })
        return (
          <div key={punto.id}>
            <p>
              <strong>
                {punto.orden}. {punto.titulo}.
              </strong>{' '}
              Se sometió a votación: «{votacion.pregunta}». Votaron {conteo.unidadesVotantes}{' '}
              {conteo.unidadesVotantes === 1 ? 'unidad' : 'unidades'}, que representan{' '}
              {porcentaje(conteo.coeficienteVotante)} de coeficiente, así:{' '}
              {conteo.porOpcion
                .map((opcion) => `${opcion.texto}, ${porcentaje(opcion.coeficiente)}`)
                .join('; ')}
              .
            </p>
            <p>
              Exigiendo este punto{' '}
              {mayoria === 'calificada'
                ? `mayoría calificada del 70 % de los coeficientes que integran el conjunto (Ley 675 de 2001, artículo 46), esto es ${porcentaje(resultado.umbral)}`
                : `mayoría de la mitad más uno de los coeficientes representados en la sesión (Ley 675 de 2001, artículo 45), esto es más de ${porcentaje(resultado.umbral)}`}
              ,{' '}
              <strong>
                {!quorum
                  ? 'la votación no produce efectos por falta de quórum'
                  : resultado.aprobada
                    ? `se APRUEBA: ${resultado.aprobada.texto}`
                    : 'NO se alcanzó la mayoría exigida'}
              </strong>
              .
            </p>
          </div>
        )
      })}

      {/* Lo que el sistema no puede saber. Va al final porque lo demás es
          constatación y esto es relato. */}
      {acta.desarrollo.trim() && (
        <>
          <h2>Constancias e intervenciones</h2>
          {acta.desarrollo
            .trim()
            .split('\n')
            .filter((linea) => linea.trim())
            .map((linea, i) => (
              <p key={i}>{linea}</p>
            ))}
        </>
      )}

      {/* RN-76 — La comision, **solo si la hubo**. Un acta sin comision no dice
          «sin comision»: dice lo que paso, y lo que paso es que la asamblea no
          designo ninguna. Con comision, en cambio, tiene que constar quien
          reviso y que anoto: es la razon de ser de la figura. */}
      {actaTieneComision(acta) && (
        <>
          <h2>Comisión verificadora</h2>
          <p>
            La asamblea designó una comisión para revisar la presente acta, integrada por{' '}
            {acta.verificadores
              .map((id) => nombreCompleto(personaDe(id)))
              .join(', ')
              .replace(/, ([^,]*)$/, ' y $1')}
            .
          </p>
          <table className="hoja-documento__tabla">
            <thead>
              <tr>
                <th>Integrante</th>
                <th>Revisó</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {acta.verificadores.map((id) => {
                const verificacion = acta.verificaciones.find((v) => v.personaId === id)
                const vigente = verificacion && verificacionVigente(acta, verificacion)
                return (
                  <tr key={id}>
                    <td>{nombreCompleto(personaDe(id))}</td>
                    <td>
                      {!verificacion
                        ? 'Pendiente'
                        : vigente
                          ? formatearFechaHora(verificacion.verificadaEn)
                          : // No se oculta: que reviso y que el texto cambio
                            // despues es un dato del acta, no un borron.
                            `Revisó el ${formatearFecha(verificacion.verificadaEn.slice(0, 10))}; el texto se modificó después`}
                    </td>
                    <td>{verificacion?.observacion ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Art. 47: la firman el presidente y el secretario. */}
      <div className="hoja-documento__firmas">
        <div className="hoja-documento__firma">
          <div className="hoja-documento__linea" />
          <p>
            <strong>{nombreCompleto(presidente).toUpperCase()}</strong>
            <br />
            {presidente?.documento ? `C.C. ${presidente.documento}` : ''}
            <br />
            Presidente de la asamblea
          </p>
        </div>
        <div className="hoja-documento__firma">
          <div className="hoja-documento__linea" />
          <p>
            <strong>{nombreCompleto(secretario).toUpperCase()}</strong>
            <br />
            {secretario?.documento ? `C.C. ${secretario.documento}` : ''}
            <br />
            Secretario de la asamblea
          </p>
        </div>
      </div>

      <footer className="hoja-documento__pie">
        {documento ? (
          <>
            Documento {documento.numero} · código de verificación {documento.codigoVerificacion} ·
            aprobada el {formatearFecha(documento.emitidoEn)} · generado con Idiky
          </>
        ) : (
          <>
            <strong>Borrador</strong> · sin aprobar · plazo para verificarla y ponerla a
            disposición: {formatearFecha(acta.limiteVerificacion)} (Ley 675 de 2001, artículo 47)
          </>
        )}
      </footer>
    </article>
  )
}
