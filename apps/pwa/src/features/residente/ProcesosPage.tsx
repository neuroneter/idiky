/**
 * CU-R-29 — Ver un proceso sancionatorio y defenderme.
 * Doc: docs/casos-de-uso/residente.md#cu-r-29
 *
 * **El mismo expediente que ve la administración, con las acciones al revés.**
 * Aquí no se resuelve nada: se lee lo que se le imputa a la unidad y se
 * responde. Todo lo que se escribe entra a la línea de tiempo con nombre y
 * fecha, y es lo que la administración tiene que estudiar antes de decidir.
 *
 * La decisión que ordena la pantalla es la misma que en la consola: **de quién
 * es el turno.** Arriba, lo que espera al copropietario, porque es lo único que
 * tiene plazo corriendo; después, lo que espera a la administración; al final,
 * cerrado, lo que ya terminó.
 *
 * Y una cosa que la pantalla dice en voz alta: mientras el proceso está abierto
 * **no hay nada que pagar**. La multa solo se convierte en plata al quedar en
 * firme (RN-39), y confundir las dos cosas es lo que hace que la gente pague por
 * miedo en vez de defenderse.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { impugnarSancion, presentarDescargos } from '../../datos/repositorio'
import {
  etiquetaUnidad,
  puedeImpugnar,
  puedePresentarDescargos,
  sancionEnCurso,
} from '../../dominio/reglas'
import { formatearDinero } from '../../utilidades/formato'
import type { Sancion } from '../../dominio/tipos'
import {
  CabeceraSancion,
  EstadoSancionChip,
  HechosSancion,
  LineaDeTiempo,
  PlazoSancion,
} from '../../componentes/Expediente'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'

export function ProcesosPage() {
  const { bd, ejecutar } = useDatos()
  const { sesion } = useSesion()
  const [viendo, setViendo] = useState<string | null>(null)

  if (!sesion) return null

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  const sanciones = sel.sancionesDeUnidad(bd, sesion.unidadActivaId)
  const miTurno = sanciones.filter(
    (sancion) => puedePresentarDescargos(sancion) || puedeImpugnar(sancion),
  )
  const enTramite = sanciones.filter(
    (sancion) => sancionEnCurso(sancion) && !miTurno.includes(sancion),
  )
  const cerradas = sanciones.filter((sancion) => !sancionEnCurso(sancion))
  const enDetalle = sanciones.find((sancion) => sancion.id === viendo)

  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver />
      </div>

      {sanciones.length === 0 ? (
        <EstadoVacio
          titulo="No tienes procesos abiertos"
          detalle="Si alguna vez se abre uno contra tu unidad, aquí vas a ver de qué se te acusa, cuánto tiempo tienes para responder y todo lo que se ha actuado."
        />
      ) : (
        <>
          {/* Antes que nada, lo que tiene plazo corriendo: un plazo que se vence
              en silencio es una defensa que se pierde sola. */}
          {miTurno.length > 0 && (
            <div className="pila">
              <div className="encabezado-seccion">
                <h2>Te toca responder</h2>
              </div>
              {miTurno.map((sancion) => (
                <TarjetaProceso
                  key={sancion.id}
                  sancion={sancion}
                  destacada
                  alAbrir={() => setViendo(sancion.id)}
                />
              ))}
            </div>
          )}

          {enTramite.length > 0 && (
            <div className="pila">
              <div className="encabezado-seccion">
                <h2>En trámite</h2>
              </div>
              {enTramite.map((sancion) => (
                <TarjetaProceso
                  key={sancion.id}
                  sancion={sancion}
                  alAbrir={() => setViendo(sancion.id)}
                />
              ))}
            </div>
          )}

          {cerradas.length > 0 && (
            <details className="historial">
              <summary>Procesos cerrados ({cerradas.length})</summary>
              <div className="pila" style={{ marginTop: 'var(--e3)' }}>
                {cerradas.map((sancion) => (
                  <TarjetaProceso
                    key={sancion.id}
                    sancion={sancion}
                    alAbrir={() => setViendo(sancion.id)}
                  />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {enDetalle && (
        <DetalleProceso
          sancion={enDetalle}
          unidad={unidad ? etiquetaUnidad(unidad) : undefined}
          alCerrar={() => setViendo(null)}
          alResponder={async (texto) => {
            const impugna = puedeImpugnar(enDetalle)
            const hecho = await ejecutar(
              (base) =>
                impugna
                  ? impugnarSancion(base, {
                      sancionId: enDetalle.id,
                      personaId: sesion.personaId,
                      texto,
                    })
                  : presentarDescargos(base, {
                      sancionId: enDetalle.id,
                      personaId: sesion.personaId,
                      texto,
                    }),
              impugna
                ? 'Impugnación radicada. La administración tiene que resolverla.'
                : 'Descargos radicados. La administración tiene que estudiarlos antes de decidir.',
            )
            if (hecho) setViendo(null)
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------

function TarjetaProceso({
  sancion,
  destacada,
  alAbrir,
}: {
  sancion: Sancion
  destacada?: boolean
  alAbrir: () => void
}) {
  return (
    <button
      className={`tarjeta tarjeta--accion${destacada ? ' tarjeta--pendiente' : ''}`}
      onClick={alAbrir}
    >
      <div className="fila fila-inicio">
        <div className="columna" style={{ flex: 1, gap: 'var(--e1)' }}>
          <strong>{sancion.concepto}</strong>
          <span className="subtitulo numerico">{sancion.radicado}</span>
          {/* El chip va en su propia caja: dentro de la columna se estiraria a
              todo el ancho y dejaria de leerse como etiqueta. */}
          <div>
            <EstadoSancionChip sancion={sancion} />
          </div>
          <PlazoSancion sancion={sancion} />
        </div>
        <div className="columna" style={{ alignItems: 'flex-end', gap: 'var(--e1)' }}>
          <strong className="numerico">{formatearDinero(sancion.valor)}</strong>
          <Icono nombre="chevron" tamano={16} className="tenue" />
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------

function DetalleProceso({
  sancion,
  unidad,
  alResponder,
  alCerrar,
}: {
  sancion: Sancion
  unidad?: string
  alResponder: (texto: string) => Promise<void>
  alCerrar: () => void
}) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const descargos = puedePresentarDescargos(sancion)
  const impugna = puedeImpugnar(sancion)

  return (
    <Modal
      titulo={sancion.concepto}
      descripcion={`${sancion.radicado}${unidad ? ` · ${unidad}` : ''}`}
      onCerrar={alCerrar}
    >
      <CabeceraSancion sancion={sancion} />
      <PlazoSancion sancion={sancion} />

      <div className="separador" />
      <HechosSancion sancion={sancion} />

      <div className="separador" />
      <LineaDeTiempo sancion={sancion} />

      {(descargos || impugna) && (
        <>
          <div className="separador" />
          <form
            onSubmit={(evento) => {
              evento.preventDefault()
              setError(null)
              if (texto.trim().length < 10) {
                setError(
                  impugna
                    ? 'Escribe por qué no estás de acuerdo con la decisión.'
                    : 'Escribe tu versión de los hechos: es lo que la administración tiene que estudiar.',
                )
                return
              }
              void alResponder(texto.trim())
            }}
          >
            <div className="campo">
              <label htmlFor="respuesta">
                {impugna ? '¿Por qué impugnas la decisión?' : 'Tu versión de los hechos'}
              </label>
              <textarea
                id="respuesta"
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                placeholder={
                  impugna
                    ? 'La decisión no tuvo en cuenta que…'
                    : 'Esa noche no había nadie en el apartamento; puedo aportar…'
                }
                style={{ minHeight: 120 }}
              />
              <span className="ayuda-campo">
                Queda en el expediente con tu nombre y la fecha. La administración no puede decidir
                sin haberlo leído.
              </span>
            </div>

            {error && <p className="acceso__error">{error}</p>}

            <button className="boton boton--primario boton--bloque" type="submit">
              {impugna ? 'Impugnar la decisión' : 'Presentar descargos'}
            </button>
          </form>
        </>
      )}

      {/* Lo que NO hay que hacer todavía, dicho explícitamente: mientras el
          proceso vive, la multa no es una deuda. */}
      {sancionEnCurso(sancion) && (
        <p className="acceso__nota" style={{ marginTop: 'var(--e3)' }}>
          Mientras el proceso esté abierto no hay nada que pagar. El valor solo se carga a tu cuenta
          si la sanción queda en firme.
        </p>
      )}

      {sancion.estado === 'firme' && (
        <p className="subtitulo" style={{ marginTop: 'var(--e3)' }}>
          La sanción quedó en firme y se cargó a tu estado de cuenta.
        </p>
      )}

      {sancion.estado === 'archivada' && (
        <p className="subtitulo" style={{ marginTop: 'var(--e3)' }}>
          El proceso se archivó: no hay sanción y no se cobró nada.
        </p>
      )}
    </Modal>
  )
}
