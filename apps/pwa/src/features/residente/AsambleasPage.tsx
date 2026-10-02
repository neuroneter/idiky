/**
 * CU-R-20 — Recibir la citacion a asamblea y consultar el orden del dia.
 * CU-R-13 — Votar los puntos (se vota en el detalle).
 * Doc: docs/casos-de-uso/residente.md#cu-r-20
 *
 * La lista pone primero lo que esta pasando, despues lo convocado y al final el
 * historial. En una asamblea el tiempo lo es todo: una votacion abierta dura lo
 * que dura el punto, y si esa tarjeta no es la primera, llega tarde.
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { pesoDelVoto, puedeVotar } from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipAsamblea } from '../../componentes/Etiquetas'
import type { Asamblea } from '../../dominio/tipos'

/** El coeficiente se muestra con cuatro decimales (docs/05, RN-19). */
function formatearCoeficiente(coeficiente: number): string {
  return `${coeficiente.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

const MODALIDAD: Record<Asamblea['modalidad'], string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  mixta: 'Presencial y virtual',
}

export function AsambleasPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  const asambleas = sel.asambleasDe(bd, sesion.copropiedadId)
  const miRol = sel
    .residenciasDeUnidad(bd, sesion.unidadActivaId ?? '')
    .find((residencia) => residencia.personaId === sesion.personaId)?.rol

  if (asambleas.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin asambleas"
        detalle="Cuando la administración convoque una asamblea, la verás aquí con su orden del día."
      />
    )
  }

  return (
    <div className="pila">
      {/* Tu voto, antes de la lista: es el dato que la persona necesita para saber
          que hace en esta pantalla, y responde de una la pregunta de siempre
          —"¿yo cuánto peso aquí?"— sin tener que ir a Mi unidad (RN-27). */}
      {unidad && (
        <div className="tarjeta tarjeta--marca">
          <span className="subtitulo">
            {puedeVotar(miRol) ? 'Tu voto en la asamblea pesa' : 'El voto de tu unidad pesa'}
          </span>
          <div className="dato-grande numerico" style={{ margin: 'var(--e1) 0 var(--e2)' }}>
            {formatearCoeficiente(pesoDelVoto(unidad))}
          </div>
          <span className="subtitulo">
            {puedeVotar(miRol)
              ? 'Es tu coeficiente: en la asamblea no se cuenta una unidad, un voto.'
              : 'Vota el propietario de la unidad. Como arrendatario puedes seguir la asamblea, pero no votar.'}
          </span>
        </div>
      )}

      {asambleas.map((asamblea) => {
        const votaciones = sel.votacionesDe(bd, asamblea.id)
        const abiertas = votaciones.filter((votacion) => votacion.estado === 'abierta')
        const aVotar = asamblea.ordenDelDia.filter((punto) => punto.seVota).length
        return (
          <Link
            key={asamblea.id}
            to={`/app/asambleas/${asamblea.id}`}
            className="tarjeta tarjeta--accion"
          >
            <div className="fila">
              <span className="subtitulo">
                {asamblea.tipo === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}
              </span>
              <ChipAsamblea estado={asamblea.estado} />
            </div>
            <div className="columna" style={{ marginTop: 'var(--e2)' }}>
              <strong>{asamblea.titulo}</strong>
              <span className="subtitulo">{formatearFechaHora(asamblea.fechaHora)}</span>
              <span className="subtitulo">
                {MODALIDAD[asamblea.modalidad]}
                {asamblea.lugar ? ` · ${asamblea.lugar}` : ''}
              </span>
            </div>
            <div className="separador" />
            <div className="fila">
              <span className="subtitulo">
                {abiertas.length > 0
                  ? `${abiertas.length} ${abiertas.length === 1 ? 'votación abierta' : 'votaciones abiertas'}`
                  : `${aVotar} ${aVotar === 1 ? 'punto por votar' : 'puntos por votar'}`}
              </span>
              <Icono nombre="chevron" tamano={16} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
