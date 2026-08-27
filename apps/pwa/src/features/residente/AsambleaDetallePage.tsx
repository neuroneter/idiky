/**
 * CU-R-13 — Votar los puntos del orden del dia de una asamblea.
 * CU-R-20 — Ver la citacion y el orden del dia.
 * Doc: docs/casos-de-uso/residente.md#cu-r-13
 *
 * Vale para la ordinaria y para la extraordinaria: en las dos se vota (Mary,
 * 2026-08-27).
 *
 * **Lo que esta pantalla no dice, a proposito: si el punto se aprobo.** Para eso
 * hacen falta la mayoria exigida y el quorum con que se instalo la asamblea, que
 * son las reglas que el equipo tiene pendientes (RN-28, T-10). Contar votos es
 * aritmetica y se puede hacer hoy; declarar aprobado es derecho, y eso no se
 * escribe de memoria. Por eso se muestra el conteo por coeficiente y nada mas.
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { useParams } from 'react-router-dom'
import * as sel from '../../datos/selectores'
import { emitirVoto } from '../../datos/repositorio'
import { contarVotacion, pesoDelVoto, puedeVotar, yaVoto } from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Icono } from '../../componentes/Icono'
import { ChipAsamblea } from '../../componentes/Etiquetas'
import type { Asamblea, PuntoOrdenDelDia, Votacion } from '../../dominio/tipos'

const MODALIDAD: Record<Asamblea['modalidad'], string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  mixta: 'Presencial y virtual',
}

function formatearCoeficiente(coeficiente: number): string {
  return `${coeficiente.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

export function AsambleaDetallePage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const { asambleaId } = useParams()
  if (!sesion) return null

  const asamblea = sel.asamblea(bd, asambleaId)
  if (!asamblea) {
    return (
      <>
        <div className="encabezado-pagina">
          <BotonVolver a="/app/asambleas" texto="Asambleas" />
        </div>
        <EstadoVacio
          titulo="Esa asamblea no existe"
          detalle="Puede que se haya cancelado. Vuelve al listado para ver las vigentes."
        />
      </>
    )
  }

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  const miRol = sel
    .residenciasDeUnidad(bd, sesion.unidadActivaId ?? '')
    .find((residencia) => residencia.personaId === sesion.personaId)?.rol
  const puedo = puedeVotar(miRol)

  async function votar(votacion: Votacion, opcionId: string) {
    if (!unidad) return
    await ejecutar(
      (base) =>
        emitirVoto(base, {
          votacionId: votacion.id,
          unidadId: unidad.id,
          personaId: sesion!.personaId,
          opcionId,
        }),
      'Tu voto quedó registrado.',
    )
  }

  function bloqueVotacion(punto: PuntoOrdenDelDia) {
    const votacion = sel.votacionDePunto(bd, punto.id)
    if (!votacion) {
      return (
        <p className="subtitulo">
          La administración abrirá la votación de este punto durante la asamblea.
        </p>
      )
    }

    const votos = sel.votosDe(bd, votacion.id)
    const miVoto = yaVoto(votos, votacion.id, unidad?.id)
    const conteo = contarVotacion(votacion, votos)
    const abierta = votacion.estado === 'abierta'

    return (
      <>
        <p style={{ margin: '0 0 var(--e3)' }}>
          <strong>{votacion.pregunta}</strong>
        </p>

        {votacion.estado === 'preparada' && (
          <p className="subtitulo">
            La votación se abre cuando la asamblea se instale y el punto entre a discusión.
          </p>
        )}

        {abierta && !puedo && (
          <p className="subtitulo">
            Vota el propietario de la unidad. Puedes seguir la discusión, pero no votar este
            punto.
          </p>
        )}

        {abierta && puedo && !miVoto && (
          <div className="lista">
            {votacion.opciones.map((opcion) => (
              <button
                key={opcion.id}
                className="tarjeta tarjeta--accion"
                disabled={cargando}
                onClick={() => void votar(votacion, opcion.id)}
              >
                <div className="fila">
                  <strong>{opcion.texto}</strong>
                  <Icono nombre="voto" tamano={18} />
                </div>
              </button>
            ))}
            {unidad && (
              <p className="subtitulo">
                Tu voto pesa {formatearCoeficiente(pesoDelVoto(unidad))}, que es el coeficiente de
                tu unidad. Una vez emitido no se cambia.
              </p>
            )}
          </div>
        )}

        {miVoto && (
          <div className="tarjeta tarjeta--plana tarjeta--exito">
            <div className="tarjeta__cuerpo">
              <Icono nombre="check" tamano={20} />
              <div className="columna">
                <strong>
                  Votaste {votacion.opciones.find((o) => o.id === miVoto.opcionId)?.texto}
                </strong>
                <span className="subtitulo">
                  {formatearFechaHora(miVoto.fecha)} · con un peso de{' '}
                  {formatearCoeficiente(miVoto.coeficiente)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* El conteo se muestra siempre que haya votos: en una asamblea el
            resultado parcial es publico, se canta en voz alta. */}
        {conteo.unidadesVotantes > 0 && (
          <div style={{ marginTop: 'var(--e4)' }}>
            <div className="lista lista--compacta">
              {conteo.porOpcion.map((opcion) => (
                <div key={opcion.opcionId} className="columna" style={{ gap: 'var(--e1)' }}>
                  <div className="fila">
                    <span className="subtitulo">{opcion.texto}</span>
                    <strong className="numerico">{formatearCoeficiente(opcion.coeficiente)}</strong>
                  </div>
                  <div className="medidor">
                    <div
                      className="medidor__relleno"
                      style={{
                        width: `${conteo.coeficienteVotante > 0 ? (opcion.coeficiente / conteo.coeficienteVotante) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {opcion.unidades} {opcion.unidades === 1 ? 'unidad' : 'unidades'}
                  </span>
                </div>
              ))}
            </div>
            <div className="separador" />
            <span className="subtitulo">
              Han votado {conteo.unidadesVotantes}{' '}
              {conteo.unidadesVotantes === 1 ? 'unidad' : 'unidades'}, que suman{' '}
              {formatearCoeficiente(conteo.coeficienteVotante)} de coeficiente.
            </span>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver a="/app/asambleas" texto="Asambleas" />
      </div>

      <div className="tarjeta tarjeta--marca">
        <div className="fila">
          <span className="subtitulo">
            {asamblea.tipo === 'ordinaria' ? 'Asamblea ordinaria' : 'Asamblea extraordinaria'}
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
          <span className="subtitulo">{asamblea.citacion}</span>
        </div>
      </div>

      {/* La transmisión en vivo es CU-R-21 y depende del proveedor (ADR-0007, sin
          escribir). Se anuncia el enlace en vez de fingir un reproductor. */}
      {asamblea.estado === 'instalada' && asamblea.enlaceTransmision && (
        <div className="tarjeta tarjeta--plana">
          <div className="columna">
            <strong>Transmisión en vivo</strong>
            <span className="subtitulo">
              La asamblea se está transmitiendo. La reproducción dentro de la app llega con la
              versión real: falta elegir el proveedor (ADR-0007).
            </span>
          </div>
        </div>
      )}

      <div className="pila">
        <span className="titulo-seccion">Orden del día</span>
        {asamblea.ordenDelDia.map((punto) => (
          <div key={punto.id} className="tarjeta">
            <div className="fila">
              <span className="subtitulo numerico">Punto {punto.orden}</span>
              {punto.seVota ? (
                <span className="chip chip--marca">Se vota</span>
              ) : (
                <span className="chip">Informativo</span>
              )}
            </div>
            <div className="columna" style={{ marginTop: 'var(--e2)' }}>
              <strong>{punto.titulo}</strong>
              <span className="subtitulo">{punto.descripcion}</span>
            </div>
            {punto.seVota && (
              <>
                <div className="separador" />
                {bloqueVotacion(punto)}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Lo que falta se nombra, no se esconde: es la diferencia entre un demo
          honesto y uno que promete lo que nadie ha decidido todavía. */}
      <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        El conteo es por coeficiente (RN-27). Si un punto quedó aprobado depende de la mayoría
        exigida y del quórum con que se instaló la asamblea, reglas que el equipo todavía tiene
        que definir.
      </p>
    </>
  )
}
