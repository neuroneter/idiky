/**
 * CU-A-34 — Crear encuestas rápidas y ver sus resultados (PN-05).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-34
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { cerrarEncuesta, crearEncuesta } from '../../../datos/repositorio'
import { encuestaAbierta, hoyISO, motivoEncuestaInvalida, sumarDias } from '../../../dominio/reglas'
import { formatearFecha } from '../../../utilidades/formato'
import { ResultadosEncuesta } from '../../../componentes/ResultadosEncuesta'

export function EncuestasAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const hoy = hoyISO()
  const [pregunta, setPregunta] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [opciones, setOpciones] = useState(['', ''])
  const [cierraEl, setCierraEl] = useState(sumarDias(hoy, 7))
  if (!sesion) return null
  const encuestas = sel.encuestasDe(bd, sesion.copropiedadId)
  const motivo = motivoEncuestaInvalida({ pregunta, opciones, cierraEl }, hoy)

  return (
    <div className="rejilla-dos">
      <div className="tarjeta">
        <strong>Nueva encuesta</strong>
        <p className="subtitulo">No es una votación de asamblea: no obliga. Una respuesta por unidad, sin nombres.</p>
        <div className="campo" style={{ marginTop: 'var(--e3)' }}>
          <label htmlFor="pregunta-encuesta">Pregunta</label>
          <input id="pregunta-encuesta" value={pregunta} onChange={(e) => setPregunta(e.target.value)} placeholder="¿Qué color prefieres para la fachada?" />
        </div>
        <div className="campo">
          <label htmlFor="descripcion-encuesta">Para qué es (opcional)</label>
          <input id="descripcion-encuesta" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        {opciones.map((o, i) => (
          <div key={i} className="campo">
            <label htmlFor={`opcion-${i}`}>Opción {i + 1}</label>
            <input id={`opcion-${i}`} value={o} onChange={(e) => setOpciones(opciones.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
        {opciones.length < 6 && (
          <button className="boton boton--pequeno" onClick={() => setOpciones([...opciones, ''])}>
            Agregar opción
          </button>
        )}
        <div className="campo" style={{ marginTop: 'var(--e3)' }}>
          <label htmlFor="cierre-encuesta">Recibe respuestas hasta</label>
          <input id="cierre-encuesta" type="date" min={hoy} value={cierraEl} onChange={(e) => setCierraEl(e.target.value)} />
        </div>
        {motivo && pregunta && <p className="acceso__nota">{motivo}</p>}
        <button
          className="boton boton--primario boton--bloque"
          disabled={cargando || !!motivo}
          onClick={async () => {
            const hecho = await ejecutar(
              (base) => crearEncuesta(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, pregunta, descripcion, opciones, cierraEl }),
              'Encuesta publicada. Los propietarios ya la ven en la app.',
            )
            if (hecho) {
              setPregunta('')
              setDescripcion('')
              setOpciones(['', ''])
            }
          }}
        >
          Publicar la encuesta
        </button>
      </div>
      <div className="pila">
        {encuestas.map((e) => (
          <div key={e.id} className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila fila-inicio">
              <strong>{e.pregunta}</strong>
              <span className={encuestaAbierta(e, hoy) ? 'chip chip--info' : 'chip'}>{encuestaAbierta(e, hoy) ? 'Abierta' : 'Cerrada'}</span>
            </div>
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>Hasta el {formatearFecha(e.cierraEl)}</span>
            <ResultadosEncuesta encuesta={e} />
            {encuestaAbierta(e, hoy) && (
              <button
                className="boton boton--pequeno"
                style={{ alignSelf: 'flex-start' }}
                disabled={cargando}
                onClick={() => void ejecutar((base) => cerrarEncuesta(base, { encuestaId: e.id, personaId: sesion.personaId }), 'Encuesta cerrada.')}
              >
                Cerrar ahora
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
