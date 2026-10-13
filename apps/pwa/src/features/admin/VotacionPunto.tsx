/**
 * CU-A-18 — Preparar, abrir, cerrar y anular la votación de un punto.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-18
 *
 * Vive dentro del orden del día de la asamblea, junto al punto que se vota:
 * es ahí donde el administrador está cuando el punto entra a discusión.
 *
 * - **Preparar** (RN-213): pregunta, opciones y **si la decisión es de contenido
 *   económico, escogido siempre** —decide si se cuenta por coeficiente o una
 *   unidad, un voto (RN-211)—.
 * - **Abrir** (RN-212): con la asamblea instalada —el quórum se verificó al
 *   instalarla (RN-215)— y si la sesión puede tomar esa decisión (RN-94).
 * - **Abierta:** cuántas unidades han votado y cuánto coeficiente suman, **sin
 *   quién votó qué**.
 * - **Cerrar:** el resultado queda fijo (RN-34) y se dice sobre qué base se contó.
 * - **Anular** (RN-34): con motivo; queda en el historial y el punto se puede
 *   votar de nuevo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { abrirVotacion, anularVotacion, cerrarVotacion, prepararVotacion } from '../../datos/repositorio'
import {
  baseDeVoto,
  contarVotacion,
  mayoriaDelPunto,
  quorumDeLaSesion,
  motivoNoAbreVotacion,
  resultadoVotacion,
  definicionMayoria,
  resumenAsistencia,
  sumaCoeficientes,
  unidadesNecesarias,
} from '../../dominio/reglas'
import type { Asamblea, PuntoOrdenDelDia } from '../../dominio/tipos'

function porcentaje(valor: number): string {
  return `${valor.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

const OPCIONES_POR_DEFECTO = ['A favor', 'En contra', 'Me abstengo']

export function VotacionPunto({ asamblea, punto }: { asamblea: Asamblea; punto: PuntoOrdenDelDia }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [preparando, setPreparando] = useState(false)
  const [pregunta, setPregunta] = useState(`¿Aprueba ${punto.titulo.charAt(0).toLowerCase()}${punto.titulo.slice(1)}?`)
  const [opciones, setOpciones] = useState<string[]>(OPCIONES_POR_DEFECTO)
  const [economica, setEconomica] = useState<boolean | undefined>(undefined)
  const [anulando, setAnulando] = useState(false)
  const [motivo, setMotivo] = useState('')
  if (!sesion || !punto.seVota) return null

  const votacion = sel.votacionDePunto(bd, punto.id)
  const anuladas = sel.votacionesAnuladasDePunto(bd, punto.id)
  const copropiedad = sel.copropiedad(bd, asamblea.copropiedadId)
  const unidades = sel.unidadesDe(bd, asamblea.copropiedadId)
  const resumen = resumenAsistencia(bd.asistencias, asamblea.id)
  const quorum = quorumDeLaSesion(asamblea, resumen, copropiedad?.quorumMinimo ?? 50)
  const mayoria = mayoriaDelPunto(punto)
  const terminada = asamblea.estado === 'cerrada' || asamblea.estado === 'cancelada'

  const historial = anuladas.length > 0 && (
    <ul className="tenue" style={{ fontSize: 'var(--texto-xs)', margin: 'var(--e1) 0 0', paddingLeft: 'var(--e4)' }}>
      {anuladas.map((v) => (
        <li key={v.id}>
          Votación anulada: «{v.pregunta}». Motivo: {v.anulacion?.motivo}
        </li>
      ))}
    </ul>
  )

  // Sin votación vigente: prepararla.
  if (!votacion) {
    if (terminada) return historial || null
    if (!preparando) {
      return (
        <div style={{ marginTop: 'var(--e2)' }}>
          <button className="boton boton--pequeno" onClick={() => setPreparando(true)}>
            Preparar la votación
          </button>
          {historial}
        </div>
      )
    }
    return (
      <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e2)' }}>
        <div className="campo">
          <label htmlFor={`pregunta-${punto.id}`}>Pregunta</label>
          <input id={`pregunta-${punto.id}`} value={pregunta} onChange={(e) => setPregunta(e.target.value)} />
        </div>
        <div className="campo">
          <label>Opciones</label>
          {opciones.map((opcion, i) => (
            <div key={i} className="fila" style={{ gap: 'var(--e2)', marginBottom: 'var(--e1)' }}>
              <input
                aria-label={`Opción ${i + 1}`}
                value={opcion}
                onChange={(e) => setOpciones(opciones.map((o, j) => (j === i ? e.target.value : o)))}
              />
              {opciones.length > 2 && (
                <button type="button" className="boton boton--pequeno" onClick={() => setOpciones(opciones.filter((_, j) => j !== i))}>
                  Quitar
                </button>
              )}
            </div>
          ))}
          <button type="button" className="boton boton--pequeno" onClick={() => setOpciones([...opciones, ''])}>
            Agregar opción
          </button>
        </div>
        {/* RN-211, RN-213 — Se escoge siempre: no viene marcado (Mary, 2026-10-02). */}
        <div className="campo">
          <label>¿Es una decisión de contenido económico?</label>
          <div className="segmentos">
            <button type="button" className="segmento" aria-current={economica === true ? 'page' : undefined} onClick={() => setEconomica(true)}>
              Sí, es económica
            </button>
            <button type="button" className="segmento" aria-current={economica === false ? 'page' : undefined} onClick={() => setEconomica(false)}>
              No es económica
            </button>
          </div>
          <span className="ayuda-campo">
            {economica === undefined
              ? 'Escógelo: de eso depende cómo se cuentan los votos.'
              : baseDeVoto(copropiedad, { contenidoEconomico: economica }) === 'unidad'
                ? 'Se contará una unidad, un voto (Corte Constitucional, C-522 de 2002).'
                : 'Se contará por coeficiente (Ley 675 de 2001, art. 37).'}
          </span>
        </div>
        <p className="subtitulo">
          Mayoría que exige el punto: {definicionMayoria(mayoria).corto}, {definicionMayoria(mayoria).fuente}.
        </p>
        <div className="grupo-botones">
          <button
            className="boton boton--primario"
            disabled={cargando || economica === undefined}
            onClick={() =>
              void ejecutar(
                (base) =>
                  prepararVotacion(base, {
                    asambleaId: asamblea.id,
                    puntoId: punto.id,
                    personaId: sesion.personaId,
                    pregunta,
                    opciones,
                    contenidoEconomico: economica,
                  }),
                'Votación preparada. Ábrela cuando el punto entre a discusión.',
              ).then((hecha) => hecha && setPreparando(false))
            }
          >
            Guardar la votación
          </button>
          <button className="boton" onClick={() => setPreparando(false)}>
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  const votos = sel.votosDe(bd, votacion.id)
  const conteo = contarVotacion(votacion, votos)
  const base = baseDeVoto(copropiedad, votacion)
  const porUnidad = base === 'unidad'
  const resultado = resultadoVotacion({
    conteo,
    mayoria,
    coeficienteRepresentado: resumen.coeficiente,
    coeficienteEdificio: sumaCoeficientes(unidades),
    baseDeVoto: base,
    unidadesRepresentadas: resumen.unidades,
    unidadesEdificio: unidades.length,
  })
  const noAbre = motivoNoAbreVotacion({ asamblea, votacion, punto })
  const valor = (unidadesOpcion: number, coeficiente: number) =>
    porUnidad ? `${unidadesOpcion} ${unidadesOpcion === 1 ? 'voto' : 'votos'}` : porcentaje(coeficiente)

  return (
    <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e2)' }}>
      <div className="fila" style={{ flexWrap: 'wrap', gap: 'var(--e2)' }}>
        <strong>{votacion.pregunta}</strong>
        <span className={votacion.estado === 'abierta' ? 'chip chip--exito' : votacion.estado === 'cerrada' ? 'chip' : 'chip chip--info'}>
          {votacion.estado === 'preparada' ? 'Preparada' : votacion.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
        </span>
      </div>
      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        {votacion.contenidoEconomico ? 'Económica' : 'No económica'} · se cuenta{' '}
        {porUnidad ? 'una unidad, un voto' : 'por coeficiente'} · mayoría{' '}
        {definicionMayoria(mayoria).corto} · opciones: {votacion.opciones.map((o) => o.texto).join(', ')}
      </span>

      {votacion.estado === 'preparada' && (
        <div style={{ marginTop: 'var(--e2)' }}>
          <button
            className="boton boton--primario boton--pequeno"
            disabled={cargando || !!noAbre}
            onClick={() =>
              void ejecutar(
                (b) => abrirVotacion(b, { votacionId: votacion.id, personaId: sesion.personaId }),
                'Votación abierta: los asistentes ya pueden votar.',
              )
            }
          >
            Abrir la votación
          </button>
          {noAbre && <span className="ayuda-campo"> {noAbre}</span>}
        </div>
      )}

      {/* Abierta: cuánto se ha votado, sin quién votó qué (CU-A-18, paso 4). */}
      {votacion.estado === 'abierta' && (
        <div style={{ marginTop: 'var(--e2)' }}>
          <p className="subtitulo">
            Han votado <strong>{conteo.unidadesVotantes}</strong> de {resumen.unidades}{' '}
            {resumen.unidades === 1 ? 'unidad presente' : 'unidades presentes'} ({porcentaje(conteo.coeficienteVotante)} del
            coeficiente). El detalle se ve al cerrar.
          </p>
          <button
            className="boton boton--pequeno"
            disabled={cargando}
            onClick={() =>
              void ejecutar(
                (b) => cerrarVotacion(b, { votacionId: votacion.id, personaId: sesion.personaId }),
                'Votación cerrada: el resultado quedó fijo.',
              )
            }
          >
            Cerrar la votación
          </button>
        </div>
      )}

      {votacion.estado === 'cerrada' && (
        <div style={{ marginTop: 'var(--e2)' }}>
          <ul className="especificaciones">
            {conteo.porOpcion.map((o) => (
              <li key={o.opcionId}>
                {o.texto}: <strong>{valor(o.unidades, o.coeficiente)}</strong>
              </li>
            ))}
          </ul>
          <p className={resultado.aprobada ? 'chip chip--exito' : 'chip chip--error'}>
            {!quorum
              ? 'Sin efectos: la asamblea no tiene quórum'
              : resultado.aprobada
                ? `Aprobado: ${resultado.aprobada.texto}`
                : 'No alcanzó la mayoría exigida'}
          </p>
          <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            Se necesitaba{' '}
            {porUnidad
              ? `al menos ${unidadesNecesarias(resultado.umbral, mayoria)} ${resultado.baseTexto}`
              : `${mayoria === 'simple' ? 'más de ' : ''}${porcentaje(resultado.umbral)} ${resultado.baseTexto}`}
            .
          </p>
        </div>
      )}

      {!terminada && !anulando && (
        <button className="boton boton--pequeno boton--peligro" style={{ marginTop: 'var(--e2)' }} onClick={() => setAnulando(true)}>
          Anular
        </button>
      )}
      {anulando && (
        <div className="campo" style={{ marginTop: 'var(--e2)' }}>
          <label htmlFor={`motivo-${votacion.id}`}>Motivo de la anulación (queda en el acta)</label>
          <textarea id={`motivo-${votacion.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="grupo-botones">
            <button
              className="boton boton--pequeno boton--peligro"
              disabled={cargando || motivo.trim().length < 10}
              onClick={() =>
                void ejecutar(
                  (b) => anularVotacion(b, { votacionId: votacion.id, personaId: sesion.personaId, motivo }),
                  'Votación anulada. Puedes preparar una nueva para este punto.',
                ).then((hecha) => {
                  if (hecha) {
                    setAnulando(false)
                    setMotivo('')
                  }
                })
              }
            >
              Anular la votación
            </button>
            <button className="boton boton--pequeno" onClick={() => setAnulando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {historial}
    </div>
  )
}
