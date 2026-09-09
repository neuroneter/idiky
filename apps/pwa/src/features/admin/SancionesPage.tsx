/**
 * CU-A-23 — Imponer una multa y llevar el proceso.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-23
 *
 * **Una multa no se impone: se tramita.** La Ley 675 de 2001 exige debido
 * proceso antes de sancionar, y esta pantalla existe para que el administrador
 * no pueda saltárselo aunque quiera: no hay ningún camino de aquí a la cartera
 * que no pase por notificar, oír y dejar impugnar.
 *
 * De ahí la decisión que la ordena: **lo primero es de quién es el turno.**
 * Arriba van los expedientes que esperan a la administración; abajo, los que
 * esperan al copropietario. Un proceso en el que los dos creen que espera al
 * otro es un proceso que se vence solo, y un plazo vencido es una multa que se
 * cae.
 *
 * **La cuota nace en un solo sitio** (RN-39): al dar firmeza. Ni al imponer, ni
 * al resolver. Es lo que separa una sanción de un cobro.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { darFirmezaSancion, imponerSancion, resolverSancion } from '../../datos/repositorio'
import {
  conceptosActivos,
  etiquetaUnidad,
  puedeQuedarEnFirme,
  multaAplicable,
  sancionEnCurso,
  vecesSancionada,
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
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function SancionesPage() {
  const { bd, ejecutar, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [imponiendo, setImponiendo] = useState(false)
  const [viendo, setViendo] = useState<string | null>(null)

  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const sanciones = bd.sanciones.filter((s) => s.copropiedadId === sesion.copropiedadId)
  const mias = sanciones.filter((s) => s.estado === 'en_estudio' || s.estado === 'impugnada')
  const esperando = sanciones.filter((s) => s.estado === 'notificada' || s.estado === 'resuelta')
  const cerradas = sanciones.filter((s) => !sancionEnCurso(s))
  const enDetalle = sanciones.find((s) => s.id === viendo)

  return (
    <div className="pila">
      <div className="fila">
        <div className="columna">
          <span className="subtitulo">
            Ninguna multa llega a la cartera sin haber sido notificada, oída e impugnable (Ley 675
            de 2001). La cuota nace solo al quedar en firme (RN-39).
          </span>
        </div>
        <button className="boton boton--primario" onClick={() => setImponiendo(true)}>
          <Icono nombre="mas" tamano={16} />
          Abrir proceso
        </button>
      </div>

      {sanciones.length === 0 ? (
        <EstadoVacio
          titulo="No hay procesos abiertos"
          detalle="Cuando se abra uno, aquí se ve en qué etapa está y de quién es el turno."
        />
      ) : (
        <>
          {/* Lo que espera a la administración, primero: es lo único que ella
              puede mover hoy. */}
          <div className="pila">
            <span className="titulo-seccion">Te toca resolver ({mias.length})</span>
            {mias.length === 0 ? (
              <p className="subtitulo">Nada pendiente de tu parte.</p>
            ) : (
              <ListaSanciones sanciones={mias} bd={bd} alAbrir={setViendo} />
            )}
          </div>

          <div className="pila">
            <span className="titulo-seccion">Esperando al copropietario ({esperando.length})</span>
            {esperando.length === 0 ? (
              <p className="subtitulo">Ninguno en plazo del copropietario.</p>
            ) : (
              <ListaSanciones sanciones={esperando} bd={bd} alAbrir={setViendo} />
            )}
          </div>

          {cerradas.length > 0 && (
            <details className="historial">
              <summary>Procesos cerrados ({cerradas.length})</summary>
              <div style={{ marginTop: 'var(--e3)' }}>
                <ListaSanciones sanciones={cerradas} bd={bd} alAbrir={setViendo} />
              </div>
            </details>
          )}
        </>
      )}

      {imponiendo && (
        <FormularioSancion
          unidades={unidades}
          conceptos={conceptosActivos(sel.conceptosSancionDe(bd, sesion.copropiedadId))}
          sanciones={sanciones}
          mesesReincidencia={sel.copropiedad(bd, sesion.copropiedadId)?.mesesReincidencia ?? 12}
          alCerrar={() => setImponiendo(false)}
          alImponer={async (datos) => {
            const creada = await ejecutar(
              (base) =>
                imponerSancion(base, {
                  copropiedadId: sesion.copropiedadId,
                  impuestaPor: sesion.personaId,
                  ...datos,
                }),
              'Proceso abierto y notificado al copropietario.',
            )
            if (creada) {
              setImponiendo(false)
              setViendo(creada.id)
            }
          }}
        />
      )}

      {enDetalle && (
        <DetalleSancion
          sancion={enDetalle}
          unidad={sel.unidad(bd, enDetalle.unidadId)}
          alCerrar={() => setViendo(null)}
          alResolver={async (sanciona, motivo) => {
            if (motivo.trim().length < 10) {
              mostrarAviso(
                'Escribe la motivación: sin ella la decisión no se puede controvertir.',
                'error',
              )
              return
            }
            const hecho = await ejecutar(
              (base) =>
                resolverSancion(base, {
                  sancionId: enDetalle.id,
                  personaId: sesion.personaId,
                  sanciona,
                  motivo,
                }),
              sanciona
                ? 'Decisión registrada. El copropietario puede impugnar.'
                : 'Proceso archivado.',
            )
            if (hecho) setViendo(null)
          }}
          alDarFirmeza={async (motivo) => {
            const hecho = await ejecutar(
              (base) =>
                darFirmezaSancion(base, {
                  sancionId: enDetalle.id,
                  personaId: sesion.personaId,
                  motivo: motivo || undefined,
                }),
              'La sanción quedó en firme y se cargó a la cartera de la unidad.',
            )
            if (hecho) setViendo(null)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function ListaSanciones({
  sanciones,
  bd,
  alAbrir,
}: {
  sanciones: Sancion[]
  bd: ReturnType<typeof useDatos>['bd']
  alAbrir: (id: string) => void
}) {
  return (
    <div className="tarjeta" style={{ padding: 0 }}>
      <div className="contenedor-tabla">
        <table className="tabla">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Conducta</th>
              <th>Etapa</th>
              <th className="numerico">Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sanciones.map((sancion) => {
              const unidad = sel.unidad(bd, sancion.unidadId)
              return (
                <tr key={sancion.id}>
                  <td>
                    <strong>{unidad ? etiquetaUnidad(unidad) : '—'}</strong>
                    <div className="subtitulo numerico">{sancion.radicado}</div>
                  </td>
                  <td className="suave">{sancion.concepto}</td>
                  <td>
                    <EstadoSancionChip sancion={sancion} />
                    <div>
                      <PlazoSancion sancion={sancion} />
                    </div>
                  </td>
                  <td className="numerico">{formatearDinero(sancion.valor)}</td>
                  <td>
                    <button className="boton boton--pequeno" onClick={() => alAbrir(sancion.id)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function FormularioSancion({
  unidades,
  conceptos,
  sanciones,
  mesesReincidencia,
  alImponer,
  alCerrar,
}: {
  unidades: ReturnType<typeof sel.unidadesDe>
  conceptos: ReturnType<typeof conceptosActivos>
  sanciones: Sancion[]
  mesesReincidencia: number
  alImponer: (datos: { unidadId: string; conceptoId: string; hechos: string }) => Promise<void>
  alCerrar: () => void
}) {
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? '')
  const [conceptoId, setConceptoId] = useState(conceptos[0]?.id ?? '')
  const [hechos, setHechos] = useState('')
  const [error, setError] = useState<string | null>(null)

  const concepto = conceptos.find((c) => c.id === conceptoId)
  // Lo que se va a imponer de verdad, contando la reincidencia (RN-72). Se
  // calcula aqui y no se adivina: el administrador tiene que ver el valor antes
  // de abrir el proceso, no enterarse despues.
  const vecesPrevias = concepto
    ? vecesSancionada(sanciones, unidadId, concepto.id, mesesReincidencia)
    : 0
  const aplicable = concepto ? multaAplicable(concepto, vecesPrevias) : null
  // «Ya fue sancionada una vez» a secas invita a pensar que cuenta cualquier
  // antecedente. La ventana se dice, porque es la mitad de la regla (RN-72).
  const ventana =
    mesesReincidencia === 12 ? 'el último año' : `los últimos ${mesesReincidencia} meses`

  if (conceptos.length === 0) {
    return (
      <Modal titulo="No hay multas en el catálogo" onCerrar={alCerrar}>
        <p className="subtitulo">
          Antes de abrir un proceso hay que tener en el catálogo la multa que lo respalda (RN-38).
          Agrégala en <strong>Multas</strong>.
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      titulo="Abrir un proceso sancionatorio"
      descripcion="Se le notifica al copropietario y empieza su plazo para presentar descargos. Todavía no se cobra nada."
      onCerrar={alCerrar}
    >
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          setError(null)
          if (hechos.trim().length < 20) {
            setError(
              'Describe los hechos: qué pasó, cuándo y dónde. Es lo que el copropietario puede controvertir.',
            )
            return
          }
          void alImponer({ unidadId, conceptoId, hechos: hechos.trim() })
        }}
      >
        <div className="campo">
          <label htmlFor="unidad">¿A qué unidad?</label>
          <select id="unidad" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {etiquetaUnidad(unidad)}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="concepto">¿Qué conducta?</label>
          <select id="concepto" value={conceptoId} onChange={(e) => setConceptoId(e.target.value)}>
            {conceptos.map((concepto) => (
              <option key={concepto.id} value={concepto.id}>
                {concepto.nombre}
              </option>
            ))}
          </select>
          {/* El valor y el respaldo no se escriben: salen del catálogo, que es
              lo que los hace comprobables (RN-38, RN-49). */}
          {concepto && aplicable && (
            <span className="ayuda-campo">
              {formatearDinero(aplicable.valor)} · {concepto.descripcion}
              {/* La norma, antes de imponer: el administrador aplica lo que
                  aprobó la asamblea o ya dice el reglamento, y tiene que verlo
                  para saber qué está aplicando (Mary, 2026-09-09). */}
              <br />
              <strong>{aplicable.respaldo}</strong>
            </span>
          )}
        </div>

        {/* Las dos caras de RN-72, y la segunda importa tanto como la primera:
            que la unidad haya reincidido **no** sube la multa por sí solo. Si
            ningún documento lo agrava, se dice — para que nadie crea que el
            sistema se olvidó de aplicarlo. */}
        {vecesPrevias > 0 && aplicable && (
          <p className="acceso__nota" style={{ marginBottom: 'var(--e3)' }}>
            {aplicable.reincidencia ? (
              <>
                Esta unidad ya fue sancionada{' '}
                {vecesPrevias === 1 ? 'una vez' : `${vecesPrevias} veces`} por esta conducta en{' '}
                {ventana}, así que aplica el valor agravado:{' '}
                <strong>{formatearDinero(aplicable.valor)}</strong>, según {aplicable.respaldo}.
              </>
            ) : (
              <>
                Esta unidad ya fue sancionada{' '}
                {vecesPrevias === 1 ? 'una vez' : `${vecesPrevias} veces`} por esta conducta en{' '}
                {ventana}, pero <strong>el valor no cambia</strong>: ningún documento dice que esta
                multa suba al repetirse. Para que suba hay que parametrizarlo en el catálogo, con la
                norma que lo respalde.
              </>
            )}
          </p>
        )}

        <div className="campo">
          <label htmlFor="hechos">¿Qué pasó?</label>
          <textarea
            id="hechos"
            value={hechos}
            onChange={(e) => setHechos(e.target.value)}
            placeholder="El sábado 5 a la 1:30 a. m. se recibieron tres llamadas de vecinos por música a alto volumen…"
            style={{ minHeight: 120 }}
          />
          <span className="ayuda-campo">
            Qué, cuándo y dónde. Es lo que se le notifica y lo único que puede controvertir: unos
            hechos vagos hacen que la multa se caiga.
          </span>
        </div>

        {error && <p className="acceso__error">{error}</p>}

        <button className="boton boton--primario boton--bloque" type="submit">
          Abrir y notificar
        </button>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

function DetalleSancion({
  sancion,
  unidad,
  alResolver,
  alDarFirmeza,
  alCerrar,
}: {
  sancion: Sancion
  unidad?: ReturnType<typeof sel.unidad>
  alResolver: (sanciona: boolean, motivo: string) => Promise<void>
  alDarFirmeza: (motivo: string) => Promise<void>
  alCerrar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const porResolver = sancion.estado === 'notificada' || sancion.estado === 'en_estudio'
  const enFirmeza = puedeQuedarEnFirme(sancion)

  return (
    <Modal
      titulo={unidad ? etiquetaUnidad(unidad) : 'Proceso sancionatorio'}
      descripcion={sancion.radicado}
      onCerrar={alCerrar}
    >
      <CabeceraSancion sancion={sancion} />
      <PlazoSancion sancion={sancion} />

      <div className="separador" />
      <HechosSancion sancion={sancion} />

      <div className="separador" />
      <LineaDeTiempo sancion={sancion} />

      {(porResolver || enFirmeza) && (
        <>
          <div className="separador" />
          <div className="campo">
            <label htmlFor="motivo">
              {enFirmeza && sancion.estado === 'impugnada'
                ? 'Cómo se resuelve la impugnación'
                : 'Motivación de la decisión'}
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Por qué se sanciona, o por qué se archiva."
            />
            <span className="ayuda-campo">
              Queda en el expediente y es lo que el copropietario puede controvertir.
            </span>
          </div>
        </>
      )}

      {/* Resolver ANTES de que venza el plazo de descargos es posible pero se
          advierte: si todavía puede hablar, decidir sin oírlo es lo que anula
          una sanción. */}
      {porResolver && sancion.estado === 'notificada' && (
        <p className="acceso__nota" style={{ marginBottom: 'var(--e3)' }}>
          Todavía está dentro del plazo para presentar descargos. Decidir ahora, sin haberlo oído,
          es lo que hace que una sanción se caiga.
        </p>
      )}

      {porResolver && (
        <div className="grupo-botones">
          <button className="boton boton--primario" onClick={() => void alResolver(true, motivo)}>
            Sancionar
          </button>
          <button className="boton" onClick={() => void alResolver(false, motivo)}>
            Archivar
          </button>
        </div>
      )}

      {enFirmeza && (
        <button
          className="boton boton--peligro boton--bloque"
          onClick={() => void alDarFirmeza(motivo)}
        >
          <Icono nombre="cartera" tamano={16} />
          Dar firmeza y cargar a la cartera
        </button>
      )}

      {sancion.estado === 'resuelta' && !enFirmeza && (
        <p className="subtitulo">
          Hay que esperar a que venza el plazo de impugnación antes de cargarla a la cartera.
        </p>
      )}
    </Modal>
  )
}
