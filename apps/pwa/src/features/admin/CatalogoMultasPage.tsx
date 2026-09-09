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
import type { OrigenRespaldo } from '../../dominio/tipos'
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
          Agregar concepto
        </button>
      </div>

      {conceptos.length === 0 ? (
        <EstadoVacio
          titulo="El catálogo está vacío"
          detalle="Sin conceptos no se puede imponer ninguna multa. Agrega los que estén en el manual de convivencia o en el reglamento."
        />
      ) : (
        <>
          <div className="pila">
            <span className="titulo-seccion">Se pueden imponer ({activos.length})</span>
            <TablaConceptos
              conceptos={activos}
              accion="Inhabilitar"
              deshabilitado={cargando}
              alCambiar={(id) =>
                void ejecutar(
                  (base) => cambiarEstadoConceptoSancion(base, { conceptoId: id, activo: false }),
                  'Concepto inhabilitado. Sigue en el catálogo, ya no se puede imponer.',
                )
              }
            />
          </div>

          {/* Los inhabilitados siguen a la vista, en su propia sección: esconderlos
              haría creer que se borraron, y las multas impuestas los citan. */}
          {inactivos.length > 0 && (
            <div className="pila">
              <span className="titulo-seccion">Inhabilitados ({inactivos.length})</span>
              <TablaConceptos
                conceptos={inactivos}
                accion="Habilitar"
                deshabilitado={cargando}
                alCambiar={(id) =>
                  void ejecutar(
                    (base) => cambiarEstadoConceptoSancion(base, { conceptoId: id, activo: true }),
                    'Concepto habilitado.',
                  )
                }
              />
              <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                Un concepto inhabilitado no se borra (RN-40): las multas que se impusieron con
                él lo siguen citando.
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
              'Concepto agregado al catálogo.',
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
              <th>Qué la autoriza</th>
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
  const [error, setError] = useState<string | null>(null)

  const definicion = ORIGENES_RESPALDO.find((o) => o.id === origen)!

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

    void alCrear({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      valor: monto,
      origen,
      referencia: referencia.trim(),
      documento: origen === 'otro' ? documento.trim() : undefined,
    })
  }

  return (
    <Modal
      titulo="Agregar un concepto al catálogo"
      descripcion="Traslada lo que ya dice el reglamento, el manual o un acta. Aquí no se inventan multas."
      onCerrar={alCerrar}
    >
      <form onSubmit={enviar}>
        {/* El respaldo primero: es lo que decide si el concepto puede existir. */}
        <div className="campo">
          <label htmlFor="origen">¿Qué autoriza esta multa?</label>
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

        {error && <p className="acceso__error">{error}</p>}

        <button className="boton boton--primario boton--bloque" type="submit">
          Agregar al catálogo
        </button>
      </form>
    </Modal>
  )
}
