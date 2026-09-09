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

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import { useParams } from 'react-router-dom'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { emitirVoto, marcarAsistencia, otorgarPoder, revocarPoder } from '../../datos/repositorio'
import {
  admiteAsistencia,
  asistenciaDeUnidad,
  contarVotacion,
  definicionModalidad,
  hayQuorum,
  mayoriaDelPunto,
  resultadoVotacion,
  sumaCoeficientes,
  etiquetaUnidad,
  formasDeAsistir,
  pesoDelVoto,
  poderDeUnidad,
  puedeVotar,
  resumenAsistencia,
  yaVoto,
} from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Icono } from '../../componentes/Icono'
import { ChipAsamblea } from '../../componentes/Etiquetas'
import { Modal } from '../../componentes/Modal'
import { HojaPoder } from '../../componentes/HojaPoder'
import type { FormaAsistencia, PuntoOrdenDelDia, Votacion } from '../../dominio/tipos'

function formatearCoeficiente(coeficiente: number): string {
  return `${coeficiente.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

export function AsambleaDetallePage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const { asambleaId } = useParams()
  const [dandoPoder, setDandoPoder] = useState(false)
  const [viendoHoja, setViendoHoja] = useState(false)
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
  const definicion = definicionModalidad(asamblea.modalidad)
  const formas = formasDeAsistir(asamblea.modalidad)
  const miAsistencia = asistenciaDeUnidad(bd.asistencias, asamblea.id, sesion.unidadActivaId ?? '')
  const resumen = resumenAsistencia(bd.asistencias, asamblea.id)
  const quorumMinimo = sel.copropiedad(bd, sesion.copropiedadId)?.quorumMinimo ?? 50
  const quorum = hayQuorum(asamblea, resumen, quorumMinimo)
  const miPoder = poderDeUnidad(bd.poderes, asamblea.id, sesion.unidadActivaId ?? '')
  const apoderado = miPoder ? sel.persona(bd, miPoder.apoderadoId) : undefined
  const documentoPoder = miPoder?.documentoId
    ? bd.documentos.find((d) => d.id === miPoder.documentoId)
    : undefined

  async function marcar(forma: FormaAsistencia) {
    if (!unidad) return
    await ejecutar(
      (base) =>
        marcarAsistencia(base, {
          asambleaId: asamblea!.id,
          unidadId: unidad.id,
          personaId: sesion!.personaId,
          forma,
        }),
      forma === 'presencial'
        ? 'Quedaste registrado en el salón.'
        : 'Quedaste registrado como conectado.',
    )
  }

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
    const mayoria = mayoriaDelPunto(punto)
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
    // Si la unidad está representada, el voto es del apoderado (RN-30). Mostrar
    // los botones y rechazarlos después es peor que no mostrarlos: la persona
    // cree que votó. El repositorio lo rechaza igual (T-16).
    const representada = !!miPoder && miPoder.apoderadoId !== sesion!.personaId
    const conteo = contarVotacion(votacion, votos)
    // El resultado se calcula sobre la base que exige la ley: lo representado
    // para la simple, el edificio entero para la calificada (arts. 45 y 46).
    const resultado = resultadoVotacion({
      conteo,
      mayoria,
      coeficienteRepresentado: resumen.coeficiente,
      coeficienteEdificio: sumaCoeficientes(sel.unidadesDe(bd, sesion!.copropiedadId)),
    })
    const abierta = votacion.estado === 'abierta'

    return (
      <>
        <p style={{ margin: '0 0 var(--e2)' }}>
          <strong>{votacion.pregunta}</strong>
        </p>

        {/* **Qué mayoría exige, antes de votar y no después.** Saber que este
            punto necesita el 70 % del edificio cambia cómo se lee la papeleta:
            es la diferencia entre «opino» y «esto no va a pasar sin más gente».
            La Ley 675 se verificó el 2026-09-10 (arts. 45 y 46). */}
        <div className="fila fila-inicio" style={{ marginBottom: 'var(--e3)' }}>
          <span className="subtitulo">
            {mayoria === 'calificada' ? 'Mayoría calificada' : 'Mayoría simple'}
          </span>
          {/* Cada mayoría dice su cifra una sola vez, y con la precisión que
              importa: la calificada **se alcanza** (70 %), la simple **se
              supera** (más de la mitad). Con exactamente la mitad, no pasa. */}
          <span className="subtitulo" style={{ textAlign: 'right' }}>
            {mayoria === 'calificada'
              ? `${formatearCoeficiente(resultado.umbral)} ${resultado.baseTexto} (art. 46)`
              : `más de ${formatearCoeficiente(resultado.umbral)} ${resultado.baseTexto} (art. 45)`}
          </span>
        </div>

        {votacion.estado === 'cerrada' && (
          <p className={resultado.aprobada ? 'chip chip--exito' : 'chip chip--error'}>
            {resultado.aprobada
              ? `Aprobado: ${resultado.aprobada.texto}`
              : 'No alcanzó la mayoría exigida'}
          </p>
        )}

        {votacion.estado === 'abierta' && resultado.aprobada && (
          <p className="subtitulo" style={{ marginBottom: 'var(--e3)' }}>
            Con los votos de ahora, <strong>{resultado.aprobada.texto}</strong> ya supera el
            umbral. El resultado se fija al cerrar la votación.
          </p>
        )}

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
            {/* Representada: las opciones **se ven pero no se pulsan** (Mary,
                2026-09-10). Esconderlas dejaría a quien dio poder sin saber qué
                se está decidiendo en su unidad, que es información suya aunque
                no sea su voto. El repositorio lo rechaza igual (T-16). */}
            {votacion.opciones.map((opcion) => (
              <button
                key={opcion.id}
                className="tarjeta tarjeta--accion"
                disabled={cargando || representada}
                onClick={() => void votar(votacion, opcion.id)}
              >
                <div className="fila">
                  <strong>{opcion.texto}</strong>
                  <Icono nombre="voto" tamano={18} />
                </div>
              </button>
            ))}
            {representada ? (
              <p className="subtitulo">
                Este punto lo vota{' '}
                <strong>{apoderado ? nombreCompleto(apoderado) : 'tu apoderado'}</strong>, que
                representa tu unidad. Si prefieres votar tú, revoca el poder arriba.
              </p>
            ) : (
              unidad && (
                <p className="subtitulo">
                  Tu voto pesa {formatearCoeficiente(pesoDelVoto(unidad))}, que es el coeficiente
                  de tu unidad. Una vez emitido no se cambia.
                </p>
              )
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
            {definicion.texto}
            {asamblea.lugar ? ` · ${asamblea.lugar}` : ''}
          </span>
          <span className="subtitulo">{asamblea.citacion}</span>
        </div>
      </div>

      {/* CU-R-21 — La sala, que cambia con la modalidad (ADR-0007).
          Idiky no transmite: enlaza la reunión que la copropiedad ya hace. Lo que
          sí es de Idiky —y por eso está aquí abajo, no allá— es la asistencia. */}
      {admiteAsistencia(asamblea) && (
        <div className="tarjeta">
          <div className="columna" style={{ gap: 'var(--e1)' }}>
            <strong>{definicion.texto}</strong>
            <span className="subtitulo">{definicion.detalle}</span>
          </div>

          {asamblea.lugar && (
            <div className="fila fila-inicio" style={{ marginTop: 'var(--e3)' }}>
              <span className="subtitulo">Dónde</span>
              <strong style={{ textAlign: 'right' }}>{asamblea.lugar}</strong>
            </div>
          )}

          {/* Se abre fuera de la app a propósito: el video es de un tercero, y
              fingir que es nuestro sería mentir sobre dónde están los datos. */}
          {asamblea.enlaceTransmision && (
            <a
              className="boton boton--primario boton--bloque"
              href={asamblea.enlaceTransmision}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: 'var(--e3)' }}
            >
              Entrar a la reunión
            </a>
          )}

          <div className="separador" />

          {!puedo ? (
            /* RN-51: vota y hace quórum el propietario. El arrendatario puede
               entrar a oír, pero su asistencia no suma coeficiente — y se le
               dice, en vez de esconderle el botón sin explicación. */
            <p className="subtitulo">
              Puedes entrar a la asamblea, pero la asistencia que cuenta para el quórum es la del
              propietario de la unidad.
            </p>
          ) : miAsistencia ? (
            <div className="columna" style={{ gap: 'var(--e2)' }}>
              <div className="fila">
                <span className="subtitulo">Tu asistencia</span>
                <span className="chip chip--exito">
                  {miAsistencia.forma === 'presencial' ? 'En el salón' : 'Conectado'}
                </span>
              </div>
              {formas.length > 1 && (
                <div className="grupo-botones">
                  {formas
                    .filter((forma) => forma !== miAsistencia!.forma)
                    .map((forma) => (
                      <button
                        key={forma}
                        className="boton boton--pequeno"
                        disabled={cargando}
                        onClick={() => marcar(forma)}
                      >
                        {forma === 'presencial' ? 'Me pasé al salón' : 'Me pasé a la reunión'}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="columna" style={{ gap: 'var(--e2)' }}>
              <span className="subtitulo">
                Marca tu asistencia: es la que cuenta para el quórum, no la lista de la reunión.
              </span>
              <div className="grupo-botones">
                {formas.map((forma) => (
                  <button
                    key={forma}
                    className="boton boton--primario"
                    disabled={cargando}
                    onClick={() => marcar(forma)}
                  >
                    {forma === 'presencial' ? 'Estoy en el salón' : 'Estoy conectado'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="separador" />

          {/* Ya se dice si hay quórum: la Ley 675 se verificó el 2026-09-10
              (arts. 41 y 45). Va **con el artículo**, porque un veredicto sin
              su regla es un número que nadie puede comprobar. */}
          <div className={`fila ${quorum ? '' : ''}`} style={{ marginBottom: 'var(--e2)' }}>
            <strong>{quorum ? 'Hay quórum' : 'Todavía no hay quórum'}</strong>
            <span className={quorum ? 'chip chip--exito' : 'chip chip--alerta'}>
              {asamblea.numeroConvocatoria === 2 ? 'Segunda convocatoria' : 'Primera'}
            </span>
          </div>
          <span className="subtitulo">
            {asamblea.numeroConvocatoria === 2
              ? 'En segunda convocatoria basta un número plural de propietarios (Ley 675, art. 41).'
              : `Hace falta más del ${quorumMinimo} % de los coeficientes y al menos dos propietarios (Ley 675, art. 45).`}
          </span>

          <div className="lista lista--compacta">
            <div className="fila">
              <span className="subtitulo">Unidades presentes</span>
              <strong className="numerico">{resumen.unidades}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Coeficiente reunido</span>
              <strong className="numerico">{formatearCoeficiente(resumen.coeficiente)}</strong>
            </div>
            {asamblea.modalidad === 'mixta' && (
              <div className="fila">
                <span className="subtitulo">Cómo asisten</span>
                <span className="subtitulo">
                  {resumen.presenciales} en el salón · {resumen.virtuales} conectadas
                </span>
              </div>
            )}
          </div>

          {asamblea.enlaceTransmision && (
            <p className="acceso__nota" style={{ marginTop: 'var(--e3)' }}>
              Las votaciones se hacen <strong>aquí</strong>, no en la reunión. Vuelve a esta
              pantalla cuando se abra un punto a votación.
            </p>
          )}
        </div>
      )}

      {/* CU-R-23 — Dar poder desde la app. Aparece antes del orden del día
          porque es una decisión sobre **si vas o no vas**: quien la toma, la
          toma antes de leer los puntos, no después. */}
      {puedo && !!unidad && asamblea.estado !== 'cerrada' && asamblea.estado !== 'cancelada' && (
        <div className="tarjeta">
          {miPoder ? (
            <div className="columna" style={{ gap: 'var(--e2)' }}>
              <div className="fila">
                <strong>Tu unidad la representa alguien más</strong>
                <span className="chip chip--alerta">Con poder</span>
              </div>
              <span className="subtitulo">
                {apoderado ? nombreCompleto(apoderado) : 'Apoderado'} vota por{' '}
                {etiquetaUnidad(unidad)} en esta asamblea.
              </span>
              {documentoPoder && (
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  {documentoPoder.numero} · código {documentoPoder.codigoVerificacion}
                </span>
              )}
              <button className="boton boton--primario" onClick={() => setViendoHoja(!viendoHoja)}>
                <Icono nombre={viendoHoja ? 'cerrar' : 'buscar'} tamano={16} />
                {viendoHoja ? 'Ocultar el poder' : 'Ver el poder'}
              </button>
              <button
                className="boton"
                disabled={cargando}
                onClick={() =>
                  void ejecutar(
                    (base) => revocarPoder(base, { poderId: miPoder!.id }),
                    'Poder revocado. Vuelves a votar tú.',
                  )
                }
              >
                Revocar el poder
              </button>
            </div>
          ) : (
            <div className="columna" style={{ gap: 'var(--e2)' }}>
              <strong>¿No puedes asistir?</strong>
              <span className="subtitulo">
                Puedes dar poder a alguien para que vote por tu unidad. No tiene que vivir aquí
                ni ser copropietario.
              </span>
              <button className="boton boton--primario" onClick={() => setDandoPoder(true)}>
                Dar poder
              </button>
            </div>
          )}
        </div>
      )}

      {/* La hoja del poder. Fuera de la previsualización no se ve en pantalla:
          es lo que sale al imprimir (ADR-0006). */}
      {miPoder && (
        <div className={viendoHoja ? 'previsualizacion-hoja' : undefined}>
          <HojaPoder
            poder={miPoder}
            documento={documentoPoder}
            copropiedad={sel.copropiedad(bd, sesion.copropiedadId)}
            asamblea={asamblea}
            unidad={unidad}
            otorgante={sel.persona(bd, miPoder.otorgadoPor)}
            apoderado={apoderado}
          />
        </div>
      )}

      {dandoPoder && unidad && (
        <FormularioDarPoder
          unidad={etiquetaUnidad(unidad)}
          alCerrar={() => setDandoPoder(false)}
          alOtorgar={async (datos) => {
            const hecho = await ejecutar(
              (base) =>
                otorgarPoder(base, {
                  asambleaId: asamblea!.id,
                  unidadId: unidad.id,
                  otorgadoPor: sesion!.personaId,
                  ...datos,
                }),
              'Poder otorgado. Quien lo recibe ya puede votar por tu unidad.',
            )
            if (hecho) setDandoPoder(false)
          }}
        />
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

// ---------------------------------------------------------------------------

/**
 * Dar poder desde la app (CU-R-23).
 *
 * **No pide una foto de nada**, y esa es la diferencia con el camino del papel:
 * aquí lo que respalda el poder es que **quien lo otorga está autenticado** —es
 * su voto y lo está cediendo él—. Idiky emite el documento y le da su número.
 */
function FormularioDarPoder({
  unidad,
  alOtorgar,
  alCerrar,
}: {
  unidad: string
  alOtorgar: (datos: {
    nombresApoderado: string
    apellidosApoderado: string
    documentoApoderado: string
    telefonoApoderado?: string
  }) => Promise<void>
  alCerrar: () => void
}) {
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <Modal
      titulo="Dar poder"
      descripcion={`Alguien más votará por ${unidad} en esta asamblea.`}
      onCerrar={alCerrar}
    >
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          setError(null)
          if (nombres.trim().length < 2 || apellidos.trim().length < 2) {
            setError('Escribe el nombre completo de quien va a representarte.')
            return
          }
          if (documento.trim().length < 5) {
            setError('Falta su documento de identidad: es con lo que se identifica en la asamblea.')
            return
          }
          void alOtorgar({
            nombresApoderado: nombres.trim(),
            apellidosApoderado: apellidos.trim(),
            documentoApoderado: documento.trim(),
            telefonoApoderado: telefono.trim() || undefined,
          })
        }}
      >
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="nombres-poder">Nombres</label>
            <input
              id="nombres-poder"
              value={nombres}
              onChange={(evento) => setNombres(evento.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="apellidos-poder">Apellidos</label>
            <input
              id="apellidos-poder"
              value={apellidos}
              onChange={(evento) => setApellidos(evento.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="documento-poder">Documento de identidad</label>
          <input
            id="documento-poder"
            inputMode="numeric"
            value={documento}
            onChange={(evento) => setDocumento(evento.target.value)}
          />
          <span className="ayuda-campo">
            No tiene que vivir aquí ni ser copropietario. Si no está en Idiky, se le crea una
            cuenta que existe solo para esta asamblea.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="telefono-poder">Su celular (opcional)</label>
          <input
            id="telefono-poder"
            value={telefono}
            onChange={(evento) => setTelefono(evento.target.value)}
            placeholder="+57 300 000 0000"
          />
        </div>

        {/* Se dice qué respalda el poder, porque es lo que la persona se está
            preguntando: «¿y esto vale?». Y se dice lo que todavía no hay. */}
        <p className="acceso__nota">
          El poder queda a tu nombre y con su número, porque lo estás otorgando tú desde tu
          cuenta. <strong>La descarga en PDF llega con la versión real</strong> (ADR-0006).
        </p>

        {error && <p className="acceso__error">{error}</p>}

        <button className="boton boton--primario boton--bloque" type="submit">
          Dar el poder
        </button>
      </form>
    </Modal>
  )
}
