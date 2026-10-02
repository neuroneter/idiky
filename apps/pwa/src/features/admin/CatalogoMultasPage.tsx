/**
 * CU-A-22 — Administrar el catálogo de multas.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-22
 *
 * **El administrador no define las multas: las parametriza** (Mary, 2026-09-08).
 * *«Las define la asamblea normalmente, o ya están establecidas en el reglamento
 * de propiedad horizontal o el manual de convivencia.»* Esta pantalla **traslada
 * al sistema** lo que esos documentos ya dicen; no es donde se inventa una
 * sanción.
 *
 * De ahí salen las dos decisiones que la ordenan:
 *
 *  - **El respaldo va arriba, no al final.** Lo primero que se escoge es de qué
 *    documento sale la multa, porque es lo que decide si el concepto puede
 *    existir (RN-38). Un formulario que pregunta el respaldo de último invita a
 *    escribir la multa primero y buscarle sustento después.
 *  - **Cada origen pide lo suyo.** El reglamento y el manual se citan por
 *    artículo, el acta por fecha, y «otro documento» obliga a decir cuál. Pedir
 *    «referencia» a secas deja que cada quien escriba una cosa distinta, que es
 *    lo que hace que después nadie pueda comprobar nada.
 *
 * **Nada se borra** (RN-40): un concepto se **inhabilita** —mismo verbo que con
 * las personas (RN-61), porque es lo mismo que pasa— y sigue en la lista. Las
 * multas impuestas con él lo referencian, y una multa que apunta a un concepto
 * que ya no existe es una multa que nadie puede explicar.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cambiarEstadoConceptoSancion, crearConceptoSancion } from '../../datos/repositorio'
import { ORIGENES_RESPALDO, respaldoCompleto, textoRespaldo } from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import type { OrigenRespaldo, Reincidencia } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function CatalogoMultasPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [creando, setCreando] = useState(false)

  if (!sesion) return null

  const conceptos = sel.conceptosSancionDe(bd, sesion.copropiedadId)
  const activos = conceptos.filter((concepto) => concepto.activo)
  const inactivos = conceptos.filter((concepto) => !concepto.activo)

  return (
    <div className="pila">
      <div className="fila">
        <div className="columna">
          <span className="subtitulo">
            Aquí se traslada al sistema lo que ya dicen el reglamento, el manual de convivencia o
            un acta. La administración parametriza; las multas las define la asamblea o esos
            documentos (RN-38, RN-49).
          </span>
        </div>
        <button className="boton boton--primario" onClick={() => setCreando(true)}>
          <Icono nombre="mas" tamano={16} />
          Agregar multa
        </button>
      </div>

      {conceptos.length === 0 ? (
        <EstadoVacio
          titulo="El catálogo está vacío"
          detalle="Sin multas en el catálogo no se puede imponer ninguna. Agrega las que estén en el manual de convivencia o en el reglamento."
        />
      ) : (
        <>
          <div className="pila">
            <span className="titulo-seccion">Se imponen multas por ({activos.length}):</span>
            <TablaConceptos
              conceptos={activos}
              accion="Inhabilitar"
              deshabilitado={cargando}
              alCambiar={(id) =>
                void ejecutar(
                  (base) => cambiarEstadoConceptoSancion(base, { conceptoId: id, activo: false }),
                  'Multa inhabilitada. Sigue en el catálogo, ya no se puede imponer.',
                )
              }
            />
          </div>

          {/* Los inhabilitados siguen a la vista, en su propia sección: esconderlos
              haría creer que se borraron, y las multas impuestas los citan. */}
          {inactivos.length > 0 && (
            <div className="pila">
              <span className="titulo-seccion">Multas inhabilitadas ({inactivos.length})</span>
              <TablaConceptos
                conceptos={inactivos}
                accion="Habilitar"
                deshabilitado={cargando}
                alCambiar={(id) =>
                  void ejecutar(
                    (base) => cambiarEstadoConceptoSancion(base, { conceptoId: id, activo: true }),
                    'Multa habilitada.',
                  )
                }
              />
              <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                Una multa inhabilitada no se borra (RN-40): las que se impusieron con ella la
                siguen citando.
              </p>
            </div>
          )}
        </>
      )}

      {creando && (
        <FormularioConcepto
          alCerrar={() => setCreando(false)}
          alCrear={async (datos) => {
            const creado = await ejecutar(
              (base) =>
                crearConceptoSancion(base, { copropiedadId: sesion.copropiedadId, ...datos }),
              'Multa agregada al catálogo.',
            )
            if (creado) setCreando(false)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function TablaConceptos({
  conceptos,
  accion,
  deshabilitado,
  alCambiar,
}: {
  conceptos: ReturnType<typeof sel.conceptosSancionDe>
  accion: string
  deshabilitado: boolean
  alCambiar: (conceptoId: string) => void
}) {
  return (
    <div className="tarjeta" style={{ padding: 0 }}>
      <div className="contenedor-tabla">
        <table className="tabla">
          <thead>
            <tr>
              <th>Conducta</th>
              <th>Qué la aprueba</th>
              <th className="numerico">Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {conceptos.map((concepto) => (
              <tr key={concepto.id}>
                <td>
                  <strong>{concepto.nombre}</strong>
                  <div className="subtitulo">{concepto.descripcion}</div>
                </td>
                {/* El respaldo va en su propia columna y no escondido en un
                    detalle: es lo que hace legítima la multa, y quien mira el
                    catálogo tiene que poder verlo de un vistazo (RN-38). */}
                <td className="suave">
                  {textoRespaldo(concepto)}
                  {concepto.inactivoDesde && (
                    <div className="subtitulo">
                      Inhabilitado desde {formatearFecha(concepto.inactivoDesde)}
                    </div>
                  )}
                </td>
                <td className="numerico">
                  <strong>{formatearDinero(concepto.valor)}</strong>
                  {/* La reincidencia va pegada al valor, que es lo que cambia.
                      Y solo aparece si alguien la parametrizó: la ausencia
                      también informa — esta multa no sube (RN-72). */}
                  {concepto.reincidencia && (
                    <div className="subtitulo">
                      Si se repite: {formatearDinero(concepto.reincidencia.valor)}
                      <div className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                        {textoRespaldo(concepto.reincidencia)}
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  <button
                    className="boton boton--pequeno"
                    disabled={deshabilitado}
                    onClick={() => alCambiar(concepto.id)}
                  >
                    {accion}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface DatosConcepto {
  nombre: string
  descripcion: string
  valor: number
  origen: OrigenRespaldo
  referencia: string
  documento?: string
  reincidencia?: Reincidencia
}

function FormularioConcepto({
  alCrear,
  alCerrar,
}: {
  alCrear: (datos: DatosConcepto) => Promise<void>
  alCerrar: () => void
}) {
  const [origen, setOrigen] = useState<OrigenRespaldo>('manual')
  const [referencia, setReferencia] = useState('')
  const [documento, setDocumento] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [valor, setValor] = useState('')
  // La reincidencia es opcional y arranca apagada: encenderla es una decision,
  // y la mayoria de las multas del manual no la tienen (RN-72).
  const [agrava, setAgrava] = useState(false)
  const [valorReincidencia, setValorReincidencia] = useState('')
  const [origenReincidencia, setOrigenReincidencia] = useState<OrigenRespaldo>('manual')
  const [referenciaReincidencia, setReferenciaReincidencia] = useState('')
  const [documentoReincidencia, setDocumentoReincidencia] = useState('')
  const [error, setError] = useState<string | null>(null)

  const definicion = ORIGENES_RESPALDO.find((o) => o.id === origen)!
  const definicionReincidencia = ORIGENES_RESPALDO.find((o) => o.id === origenReincidencia)!

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)

    if (!respaldoCompleto({ origen, referencia, documento })) {
      setError(
        origen === 'otro'
          ? 'Di cuál es el documento y dónde lo dice: sin eso el respaldo no se puede comprobar.'
          : `Falta ${definicion.etiqueta.toLowerCase()}.`,
      )
      return
    }
    if (nombre.trim().length < 4) {
      setError('Ponle un nombre a la conducta, como aparece en el documento.')
      return
    }
    if (descripcion.trim().length < 10) {
      setError('Describe qué conducta se sanciona: es lo que va a leer quien reciba la multa.')
      return
    }
    const monto = Number(valor.replace(/\D/g, ''))
    if (!monto) {
      setError('Escribe el valor que fija el documento.')
      return
    }

    let reincidencia: Reincidencia | undefined
    if (agrava) {
      const montoReincidencia = Number(valorReincidencia.replace(/\D/g, ''))
      if (!montoReincidencia) {
        setError('Escribe el valor que fija el documento para la reincidencia.')
        return
      }
      if (montoReincidencia <= monto) {
        setError(
          'El valor por reincidencia tiene que ser mayor que el de la primera vez. Si no sube, no hay nada que parametrizar.',
        )
        return
      }
      if (
        !respaldoCompleto({
          origen: origenReincidencia,
          referencia: referenciaReincidencia,
          documento: documentoReincidencia,
        })
      ) {
        setError(
          'Di dónde dice que la multa sube cuando la conducta se repite: sin eso el aumento no se puede comprobar.',
        )
        return
      }
      reincidencia = {
        valor: montoReincidencia,
        origen: origenReincidencia,
        referencia: referenciaReincidencia.trim(),
        documento: origenReincidencia === 'otro' ? documentoReincidencia.trim() : undefined,
      }
    }

    void alCrear({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      valor: monto,
      origen,
      referencia: referencia.trim(),
      documento: origen === 'otro' ? documento.trim() : undefined,
      reincidencia,
    })
  }

  return (
    <Modal
      titulo="Agregar una multa al catálogo"
      descripcion="Traslada lo que ya dice el reglamento, el manual o un acta. Aquí no se inventan multas: se registran las que esos documentos ya contemplan."
      onCerrar={alCerrar}
    >
      <form onSubmit={enviar}>
        {/* El respaldo primero: es lo que decide si el concepto puede existir. */}
        <div className="campo">
          <label htmlFor="origen">¿Qué aprueba esta multa?</label>
          <select
            id="origen"
            value={origen}
            onChange={(evento) => setOrigen(evento.target.value as OrigenRespaldo)}
          >
            {ORIGENES_RESPALDO.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.texto}
              </option>
            ))}
          </select>
        </div>

        {origen === 'otro' && (
          <div className="campo">
            <label htmlFor="documento">¿Cuál documento?</label>
            <input
              id="documento"
              value={documento}
              onChange={(evento) => setDocumento(evento.target.value)}
              placeholder="Resolución del consejo N.º 12 del 3 de marzo"
            />
            <span className="ayuda-campo">
              Sin decir cuál es, el respaldo no se puede comprobar y el concepto no se crea.
            </span>
          </div>
        )}

        <div className="campo">
          <label htmlFor="referencia">{definicion.etiqueta}</label>
          <input
            id="referencia"
            value={referencia}
            onChange={(evento) => setReferencia(evento.target.value)}
            placeholder={definicion.ejemplo}
          />
        </div>

        <div className="separador" />

        <div className="campo">
          <label htmlFor="nombre">Conducta</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Ruido fuera de horario"
          />
        </div>

        <div className="campo">
          <label htmlFor="descripcion">¿Qué se sanciona exactamente?</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="Música o trabajos ruidosos entre las 10:00 p. m. y las 7:00 a. m."
          />
          <span className="ayuda-campo">
            Es lo que va a leer quien reciba la multa. Que se entienda sin abrir el manual.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="valor">Valor que fija el documento</label>
          <input
            id="valor"
            inputMode="numeric"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            placeholder="180000"
          />
        </div>

        <div className="separador" />

        {/* La reincidencia, al final y apagada: agravar es sancionar mas duro y
            tiene que haberlo decidido antes la asamblea o el reglamento, igual
            que la multa base (Mary, 2026-09-09). Sin esto, la multa no sube. */}
        <div className="campo">
          <label
            className="fila"
            htmlFor="agrava"
            style={{ justifyContent: 'flex-start', gap: 'var(--e2)' }}
          >
            <input
              id="agrava"
              type="checkbox"
              checked={agrava}
              onChange={(evento) => setAgrava(evento.target.checked)}
            />
            <span>¿El documento dice que la multa sube si la conducta se repite?</span>
          </label>
          <span className="ayuda-campo">
            Si no lo dice, déjalo apagado: sin un documento que lo respalde la multa no sube,
            por muchas veces que se repita.
          </span>
        </div>

        {agrava && (
          <>
            <div className="campo">
              <label htmlFor="valor-reincidencia">Valor a partir de la segunda vez</label>
              <input
                id="valor-reincidencia"
                inputMode="numeric"
                value={valorReincidencia}
                onChange={(evento) => setValorReincidencia(evento.target.value)}
                placeholder="360000"
              />
            </div>

            {/* Con su propio respaldo, no el de la multa base: es normal que el
                reglamento fije la multa y una asamblea posterior la agrave. */}
            <div className="campo">
              <label htmlFor="origen-reincidencia">¿Qué aprueba el aumento?</label>
              <select
                id="origen-reincidencia"
                value={origenReincidencia}
                onChange={(evento) => setOrigenReincidencia(evento.target.value as OrigenRespaldo)}
              >
                {ORIGENES_RESPALDO.map((opcion) => (
                  <option key={opcion.id} value={opcion.id}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </div>

            {origenReincidencia === 'otro' && (
              <div className="campo">
                <label htmlFor="documento-reincidencia">¿Cuál documento?</label>
                <input
                  id="documento-reincidencia"
                  value={documentoReincidencia}
                  onChange={(evento) => setDocumentoReincidencia(evento.target.value)}
                  placeholder="Acta de asamblea extraordinaria del 3 de marzo"
                />
              </div>
            )}

            <div className="campo">
              <label htmlFor="referencia-reincidencia">{definicionReincidencia.etiqueta}</label>
              <input
                id="referencia-reincidencia"
                value={referenciaReincidencia}
                onChange={(evento) => setReferenciaReincidencia(evento.target.value)}
                placeholder={definicionReincidencia.ejemplo}
              />
            </div>
          </>
        )}

        {error && <p className="acceso__error">{error}</p>}

        <button className="boton boton--primario boton--bloque" type="submit">
          Agregar al catálogo
        </button>
      </form>
    </Modal>
  )
}
