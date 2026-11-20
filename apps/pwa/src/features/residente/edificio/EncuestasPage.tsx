/**
 * CU-R-39 — Responder las encuestas del edificio (PN-05).
 * Doc: docs/casos-de-uso/residente.md#cu-r-39
 *
 * No es una votación de asamblea: no obliga. Una respuesta por unidad; los
 * resultados se ven después de responder, sin nombres.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { responderEncuesta } from '../../../datos/repositorio'
import { decideEnLaUnidad, encuestaAbierta, hoyISO, respuestaDeUnidad } from '../../../dominio/reglas'
import { formatearFecha } from '../../../utilidades/formato'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { EstadoVacio } from '../../../componentes/EstadoVacio'
import { ResultadosEncuesta } from '../../../componentes/ResultadosEncuesta'

export function EncuestasPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [eleccion, setEleccion] = useState<Record<string, string>>({})
  if (!sesion) return null
  const unidadId = sesion.unidadActivaId ?? ''
  const hoy = hoyISO()
  const encuestas = sel.encuestasDe(bd, sesion.copropiedadId)
  // PN-20 — Responde el propietario o el arrendatario; los demás ven los resultados.
  const responde = decideEnLaUnidad(sel.rolEnUnidad(bd, sesion.personaId, unidadId))

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/edificio" texto="Tu edificio" />
        <h1 className="titulo">Encuestas</h1>
      </div>
      {encuestas.length === 0 && <EstadoVacio titulo="No hay encuestas" detalle="Cuando la administración pregunte algo, lo verás aquí." />}
      {encuestas.map((encuesta) => {
        const abierta = encuestaAbierta(encuesta, hoy)
        const mia = respuestaDeUnidad(encuesta, unidadId)
        return (
          <div key={encuesta.id} className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila fila-inicio">
              <strong>{encuesta.pregunta}</strong>
              <span className={abierta ? 'chip chip--info' : 'chip'}>{abierta ? 'Abierta' : 'Cerrada'}</span>
            </div>
            {encuesta.descripcion && <span className="subtitulo">{encuesta.descripcion}</span>}
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              {abierta ? `Responde hasta el ${formatearFecha(encuesta.cierraEl)}` : `Cerró el ${formatearFecha(encuesta.cierraEl)}`}
            </span>
            {abierta && !mia && responde ? (
              <>
                {encuesta.opciones.map((o) => (
                  <label key={o.id} className="opcion-huella" style={{ margin: 0 }}>
                    <input
                      type="radio"
                      name={encuesta.id}
                      checked={eleccion[encuesta.id] === o.id}
                      onChange={() => setEleccion({ ...eleccion, [encuesta.id]: o.id })}
                    />
                    <span>{o.texto}</span>
                  </label>
                ))}
                <button
                  className="boton boton--primario"
                  disabled={cargando || !eleccion[encuesta.id]}
                  onClick={() =>
                    void ejecutar(
                      (base) =>
                        responderEncuesta(base, {
                          encuestaId: encuesta.id,
                          unidadId,
                          personaId: sesion.personaId,
                          opcionId: eleccion[encuesta.id],
                        }),
                      '¡Gracias por tu opinión!',
                    )
                  }
                >
                  Enviar mi respuesta
                </button>
              </>
            ) : (
              <>
                {mia && <span className="chip chip--exito" style={{ alignSelf: 'flex-start' }}>Tu unidad ya respondió</span>}
                <ResultadosEncuesta encuesta={encuesta} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
