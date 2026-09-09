/**
 * CU-A-12 — Convocar la asamblea y su orden del día.
 * CU-A-17 — Instalar la asamblea y ver quién asiste.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-12 · docs/adr/0007-transmision-en-vivo.md
 *
 * **La modalidad es lo primero que se pregunta, y no por orden estético.**
 * Decide qué más hay que pedir —lugar, enlace, o los dos— y qué va a ver el
 * copropietario. Preguntarla al final obliga a rehacer el formulario mentalmente
 * cuando ya se llenó.
 *
 * **Idiky no transmite: enlaza** (ADR-0007). Aquí se pega el enlace de Zoom, de
 * Meet o de lo que la copropiedad use, y eso es todo lo que la app hace con el
 * video. Lo que sí es suyo —y es lo que Zoom no puede dar— es la asistencia
 * ponderada por coeficiente, que se ve abajo mientras la asamblea corre.
 *
 * **Lo que esta pantalla no dice, a propósito: si hay quórum.** Suma
 * coeficientes, que es aritmética; el umbral, si lo virtual pesa igual que lo
 * presencial y cómo entran los poderes son derecho, y están sin decidir (RN-28,
 * §3 bis).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  cambiarEstadoAsamblea,
  convocarAsamblea,
  registrarPoder,
  revocarPoder,
} from '../../datos/repositorio'
import {
  MODALIDADES,
  acumuladoPorApoderado,
  convocatoriaCompleta,
  definicionModalidad,
  etiquetaUnidad,
  ordenAsamblea,
  poderVigente,
  resumenAsistencia,
} from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import type { Asamblea, ModalidadAsamblea, TipoAsamblea } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipAsamblea } from '../../componentes/Etiquetas'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { HojaPoder } from '../../componentes/HojaPoder'

function formatearCoeficiente(coeficiente: number): string {
  return `${coeficiente.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

export function AsambleasAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [convocando, setConvocando] = useState(false)
  const [viendo, setViendo] = useState<string | null>(null)
  const [dandoPoder, setDandoPoder] = useState<string | null>(null)
  const [viendoPoder, setViendoPoder] = useState<string | null>(null)

  if (!sesion) return null

  const asambleas = sel
    .asambleasDe(bd, sesion.copropiedadId)
    .slice()
    .sort((a, b) => ordenAsamblea(a) - ordenAsamblea(b))
  const enDetalle = asambleas.find((a) => a.id === viendo)

  async function cambiar(asambleaId: string, estado: Asamblea['estado'], mensaje: string) {
    const hecho = await ejecutar(
      (base) => cambiarEstadoAsamblea(base, { asambleaId, estado }),
      mensaje,
    )
    if (hecho && estado !== 'instalada') setViendo(null)
  }

  return (
    <div className="pila">
      <div className="fila">
        <span className="subtitulo">
          Idiky no transmite la asamblea: enlaza la reunión que ustedes ya hacen por Zoom o Meet
          (ADR-0007). Lo que sí lleva es quién asiste y cuánto pesa.
        </span>
        <button className="boton boton--primario" onClick={() => setConvocando(true)}>
          <Icono nombre="mas" tamano={16} />
          Convocar
        </button>
      </div>

      {asambleas.length === 0 ? (
        <EstadoVacio
          titulo="No hay asambleas"
          detalle="Cuando convoques una, aquí la instalas el día de la reunión y ves quién va llegando."
        />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Asamblea</th>
                  <th>Cuándo</th>
                  <th>Modalidad</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {asambleas.map((asamblea) => {
                  const resumen = resumenAsistencia(bd.asistencias, asamblea.id)
                  return (
                    <tr key={asamblea.id}>
                      <td>
                        <strong>{asamblea.titulo}</strong>
                        <div className="subtitulo">{asamblea.citacion}</div>
                      </td>
                      <td className="suave">{formatearFechaHora(asamblea.fechaHora)}</td>
                      <td className="suave">
                        {definicionModalidad(asamblea.modalidad).texto}
                        {/* El enlace se ve en la tabla: es lo que hay que revisar
                            antes de que empiece, no algo escondido en un detalle. */}
                        {asamblea.enlaceTransmision && <div className="subtitulo">Con enlace</div>}
                      </td>
                      <td>
                        <ChipAsamblea estado={asamblea.estado} />
                        {resumen.unidades > 0 && (
                          <div className="subtitulo numerico">
                            {resumen.unidades} unidades ·{' '}
                            {formatearCoeficiente(resumen.coeficiente)}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="boton boton--pequeno"
                          onClick={() => setViendo(asamblea.id)}
                        >
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
      )}

      {convocando && (
        <FormularioConvocatoria
          alCerrar={() => setConvocando(false)}
          alConvocar={async (datos) => {
            const creada = await ejecutar(
              (base) => convocarAsamblea(base, { copropiedadId: sesion.copropiedadId, ...datos }),
              'Asamblea convocada.',
            )
            if (creada) setConvocando(false)
          }}
        />
      )}

      {/* El detalle se esconde mientras se registra un poder: dos modales
          encimados dejan dos fondos oscurecidos, dos `aria-modal` peleando por
          el foco y un «cerrar» ambiguo. Al cerrar el formulario, vuelve. */}
      {enDetalle && !dandoPoder && !viendoPoder && (
        <DetalleAsamblea
          asamblea={enDetalle}
          bd={bd}
          cargando={cargando}
          alCerrar={() => setViendo(null)}
          alCambiar={cambiar}
          alRegistrarPoder={setDandoPoder}
          alVerPoder={setViendoPoder}
          alRevocar={async (poderId) => {
            await ejecutar(
              (base) => revocarPoder(base, { poderId }),
              'Poder revocado. Queda en el expediente de la asamblea.',
            )
          }}
        />
      )}

      {viendoPoder && (
        <VistaPoder bd={bd} poderId={viendoPoder} alCerrar={() => setViendoPoder(null)} />
      )}

      {dandoPoder && (
        <FormularioPoder
          unidades={sel.unidadesDe(bd, sesion.copropiedadId)}
          alCerrar={() => setDandoPoder(null)}
          alRegistrar={async (datos) => {
            const hecho = await ejecutar(
              (base) =>
                registrarPoder(base, {
                  asambleaId: dandoPoder,
                  registradoPor: sesion.personaId,
                  ...datos,
                }),
              'Poder registrado. El apoderado queda como usuario temporal de la asamblea.',
            )
            if (hecho) setDandoPoder(null)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function DetalleAsamblea({
  asamblea,
  bd,
  cargando,
  alCambiar,
  alRegistrarPoder,
  alVerPoder,
  alRevocar,
  alCerrar,
}: {
  asamblea: Asamblea
  bd: ReturnType<typeof useDatos>['bd']
  cargando: boolean
  alCambiar: (id: string, estado: Asamblea['estado'], mensaje: string) => Promise<void>
  alRegistrarPoder: (asambleaId: string) => void
  alVerPoder: (poderId: string) => void
  alRevocar: (poderId: string) => Promise<void>
  alCerrar: () => void
}) {
  const definicion = definicionModalidad(asamblea.modalidad)
  const asistencias = sel.asistenciasDeAsamblea(bd, asamblea.id)
  const resumen = resumenAsistencia(bd.asistencias, asamblea.id)
  const poderes = sel.poderesDeAsambleaTodos(bd, asamblea.id)
  const vigentes = poderes.filter(poderVigente)
  const acumulado = acumuladoPorApoderado(
    bd.poderes,
    asamblea.id,
    (unidadId) => sel.unidad(bd, unidadId)?.coeficiente ?? 0,
  )

  return (
    <Modal titulo={asamblea.titulo} descripcion={asamblea.citacion} onCerrar={alCerrar}>
      <div className="lista lista--compacta">
        <div className="fila">
          <span className="subtitulo">Cuándo</span>
          <strong>{formatearFechaHora(asamblea.fechaHora)}</strong>
        </div>
        <div className="fila">
          <span className="subtitulo">Modalidad</span>
          <strong>{definicion.texto}</strong>
        </div>
        {asamblea.lugar && (
          <div className="fila fila-inicio">
            <span className="subtitulo">Lugar</span>
            <strong style={{ textAlign: 'right' }}>{asamblea.lugar}</strong>
          </div>
        )}
        {asamblea.enlaceTransmision && (
          <div className="fila fila-inicio">
            <span className="subtitulo">Reunión</span>
            <a
              href={asamblea.enlaceTransmision}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textAlign: 'right', wordBreak: 'break-all' }}
            >
              {asamblea.enlaceTransmision}
            </a>
          </div>
        )}
        <div className="fila">
          <span className="subtitulo">Estado</span>
          <ChipAsamblea estado={asamblea.estado} />
        </div>
      </div>

      <div className="separador" />
      <span className="titulo-seccion">Orden del día</span>
      <ol className="lista lista--compacta" style={{ paddingLeft: 'var(--e4)' }}>
        {asamblea.ordenDelDia.map((punto) => (
          <li key={punto.id}>
            <strong>{punto.titulo}</strong>
            {punto.seVota && <span className="chip chip--marca">Se vota</span>}
          </li>
        ))}
      </ol>

      {asamblea.estado !== 'cerrada' && asamblea.estado !== 'cancelada' && (
        <>
          <div className="separador" />
          <div className="fila">
            <span className="titulo-seccion">Poderes ({vigentes.length})</span>
            <button className="boton boton--pequeno" onClick={() => alRegistrarPoder(asamblea.id)}>
              <Icono nombre="mas" tamano={14} />
              Registrar poder
            </button>
          </div>
          <p className="subtitulo">
            La asamblea es de propietarios; el poder es lo que deja entrar a quien no lo es (RN-30).
            Se otorga fuera de la app, así que aquí se valida y se adjunta el papel.
          </p>

          {/* El acumulado por apoderado, a la vista: el tope legal no lo tenemos
              (RN-30, §3 bis), así que en vez de inventar un número se le pone el
              dato delante a quien registra, para que juzgue con el reglamento. */}
          {acumulado.length > 0 && (
            <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
              {acumulado.map((linea) => {
                const persona = sel.persona(bd, linea.apoderadoId)
                return (
                  <div key={linea.apoderadoId} className="fila">
                    <span className="subtitulo">
                      {persona ? nombreCompleto(persona) : 'Apoderado'}
                    </span>
                    <span className="subtitulo numerico">
                      {linea.unidades} {linea.unidades === 1 ? 'unidad' : 'unidades'} ·{' '}
                      {formatearCoeficiente(linea.coeficiente)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {poderes.length > 0 && (
            <div className="contenedor-tabla" style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table className="tabla">
                <tbody>
                  {poderes.map((poder) => {
                    const unidad = sel.unidad(bd, poder.unidadId)
                    const persona = sel.persona(bd, poder.apoderadoId)
                    return (
                      <tr key={poder.id}>
                        <td>
                          <strong>{unidad ? etiquetaUnidad(unidad) : '—'}</strong>
                          <div className="subtitulo">
                            {persona ? nombreCompleto(persona) : '—'}
                            {persona?.documento ? ` · ${persona.documento}` : ''}
                          </div>
                        </td>
                        <td>
                          {poder.revocadoEn ? (
                            <span className="chip">Revocado</span>
                          ) : (
                            <span className="chip chip--exito">Vigente</span>
                          )}
                          {/* De dónde salió: es lo que dice qué lo respalda —el
                              papel firmado, o la sesión del propietario— y por
                              tanto qué mirar si alguien lo impugna. */}
                          <div className="subtitulo">
                            {poder.origen === 'papel' ? 'En papel' : 'Otorgado en la app'}
                          </div>
                        </td>
                        <td>
                          <div className="grupo-botones">
                            {/* Poder ver el documento es la mitad del trabajo:
                                registrar uno que después nadie puede leer no
                                sirve el día que alguien lo impugne. */}
                            <button
                              className="boton boton--pequeno"
                              onClick={() => alVerPoder(poder.id)}
                            >
                              Ver
                            </button>
                            {!poder.revocadoEn && (
                              <button
                                className="boton boton--pequeno"
                                disabled={cargando}
                                onClick={() => void alRevocar(poder.id)}
                              >
                                Revocar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {acumulado.length > 0 && (
            <p className="acceso__nota" style={{ margin: 'var(--e3) 0' }}>
              Falta el <strong>tope</strong> que fija la Ley 675: cuántas unidades puede acumular un
              apoderado y hasta qué porcentaje. Mientras no esté, Idiky muestra el acumulado pero{' '}
              <strong>no rechaza a nadie</strong> — el número de arriba es para juzgarlo con el
              reglamento en la mano.
            </p>
          )}
        </>
      )}

      {asamblea.estado !== 'convocada' && (
        <>
          <div className="separador" />
          <span className="titulo-seccion">Quién asiste</span>
          {/* Se suma y se reparte por forma —que es lo que el acta necesita en una
              mixta— pero **no se declara quórum**: el umbral está sin decidir
              (RN-28, §3 bis). */}
          <div className="lista lista--compacta">
            <div className="fila">
              <span className="subtitulo">Unidades</span>
              <strong className="numerico">{resumen.unidades}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Coeficiente reunido</span>
              <strong className="numerico">{formatearCoeficiente(resumen.coeficiente)}</strong>
            </div>
            {asamblea.modalidad === 'mixta' && (
              <div className="fila">
                <span className="subtitulo">Cómo</span>
                <span className="subtitulo">
                  {resumen.presenciales} en el salón · {resumen.virtuales} conectadas
                </span>
              </div>
            )}
          </div>

          <p className="acceso__nota" style={{ margin: 'var(--e3) 0' }}>
            Falta decidir cuánto quórum se exige, si la asistencia virtual pesa igual que la
            presencial y cómo entran los poderes (RN-28). Por eso aquí se suma, pero no se afirma
            que haya quórum.
          </p>

          {asistencias.length > 0 && (
            <div className="contenedor-tabla" style={{ maxHeight: 240, overflowY: 'auto' }}>
              <table className="tabla">
                <tbody>
                  {asistencias.map((asistencia) => {
                    const unidad = sel.unidad(bd, asistencia.unidadId)
                    const persona = sel.persona(bd, asistencia.personaId)
                    return (
                      <tr key={asistencia.id}>
                        <td>
                          <strong>{unidad ? etiquetaUnidad(unidad) : '—'}</strong>
                          <div className="subtitulo">{persona ? nombreCompleto(persona) : '—'}</div>
                        </td>
                        <td className="suave">
                          {asistencia.forma === 'presencial' ? 'En el salón' : 'Conectada'}
                        </td>
                        <td className="numerico">{formatearCoeficiente(asistencia.coeficiente)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="separador" />

      {asamblea.estado === 'convocada' && (
        <div className="grupo-botones">
          <button
            className="boton boton--primario"
            disabled={cargando}
            onClick={() =>
              void alCambiar(
                asamblea.id,
                'instalada',
                'Asamblea instalada. Ya se puede marcar asistencia.',
              )
            }
          >
            Instalar la asamblea
          </button>
          <button
            className="boton"
            disabled={cargando}
            onClick={() => void alCambiar(asamblea.id, 'cancelada', 'Asamblea cancelada.')}
          >
            Cancelar
          </button>
        </div>
      )}

      {asamblea.estado === 'instalada' && (
        <button
          className="boton boton--bloque"
          disabled={cargando}
          onClick={() =>
            void alCambiar(
              asamblea.id,
              'cerrada',
              'Asamblea cerrada. La asistencia y los votos quedan.',
            )
          }
        >
          Cerrar la asamblea
        </button>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------

interface DatosConvocatoria {
  tipo: TipoAsamblea
  titulo: string
  fechaHora: string
  modalidad: ModalidadAsamblea
  lugar?: string
  enlaceTransmision?: string
  citacion: string
  ordenDelDia: Array<{ titulo: string; descripcion: string; seVota: boolean }>
}

function FormularioConvocatoria({
  alConvocar,
  alCerrar,
}: {
  alConvocar: (datos: DatosConvocatoria) => Promise<void>
  alCerrar: () => void
}) {
  // La modalidad primero: decide qué más se pide (ADR-0007).
  const [modalidad, setModalidad] = useState<ModalidadAsamblea>('mixta')
  const [tipo, setTipo] = useState<TipoAsamblea>('ordinaria')
  const [titulo, setTitulo] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [lugar, setLugar] = useState('')
  const [enlace, setEnlace] = useState('')
  const [citacion, setCitacion] = useState('')
  const [puntos, setPuntos] = useState<
    Array<{ titulo: string; descripcion: string; seVota: boolean }>
  >([{ titulo: '', descripcion: '', seVota: false }])
  const [error, setError] = useState<string | null>(null)

  const definicion = definicionModalidad(modalidad)
  const respaldoListo = convocatoriaCompleta({
    modalidad,
    lugar,
    enlaceTransmision: enlace,
  })

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    if (titulo.trim().length < 6) {
      setError('Ponle un título que diga de qué es la asamblea.')
      return
    }
    if (!fechaHora) {
      setError('Falta la fecha y la hora.')
      return
    }
    if (citacion.trim().length < 4) {
      setError('Di qué la convoca: el acta del consejo o la citación con su número.')
      return
    }
    const utiles = puntos.filter((punto) => punto.titulo.trim())
    if (utiles.length === 0) {
      setError('Una convocatoria sin orden del día no convoca a nada.')
      return
    }
    void alConvocar({
      tipo,
      titulo: titulo.trim(),
      // El input entrega hora local; se guarda con el desfase de Colombia, que
      // es donde ocurre la asamblea.
      fechaHora: `${fechaHora}:00-05:00`,
      modalidad,
      lugar: definicion.exigeLugar ? lugar.trim() : undefined,
      enlaceTransmision: definicion.exigeEnlace ? enlace.trim() : undefined,
      citacion: citacion.trim(),
      ordenDelDia: utiles,
    })
  }

  return (
    <Modal
      titulo="Convocar una asamblea"
      descripcion="Lo primero es la modalidad: decide qué más hace falta y qué va a ver el copropietario."
      onCerrar={alCerrar}
    >
      <form onSubmit={enviar}>
        {/* La modalidad, arriba del todo y como opciones a la vista: es una
            decisión, no un desplegable que se deja como venga (ADR-0007). */}
        <div className="campo">
          <label>¿Cómo se reúnen?</label>
          <div className="pila" style={{ gap: 'var(--e2)' }}>
            {MODALIDADES.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className="opcion-categoria"
                aria-pressed={modalidad === opcion.id}
                onClick={() => setModalidad(opcion.id)}
              >
                <strong>{opcion.texto}</strong>
                <span className="subtitulo">{opcion.detalle}</span>
              </button>
            ))}
          </div>
        </div>

        {definicion.exigeLugar && (
          <div className="campo">
            <label htmlFor="lugar">¿Dónde?</label>
            <input
              id="lugar"
              value={lugar}
              onChange={(evento) => setLugar(evento.target.value)}
              placeholder="Salón social, Torre 1"
            />
          </div>
        )}

        {definicion.exigeEnlace && (
          <div className="campo">
            <label htmlFor="enlace">Enlace de la reunión</label>
            <input
              id="enlace"
              value={enlace}
              onChange={(evento) => setEnlace(evento.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
            />
            <span className="ayuda-campo">
              El de Zoom, Meet o la herramienta que usen. Idiky no transmite: enlaza la reunión que
              ustedes ya hacen (ADR-0007).
            </span>
          </div>
        )}

        <div className="separador" />

        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="tipo-asamblea">Tipo</label>
            <select
              id="tipo-asamblea"
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as TipoAsamblea)}
            >
              <option value="ordinaria">Ordinaria</option>
              <option value="extraordinaria">Extraordinaria</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="fecha-hora">Fecha y hora</label>
            <input
              id="fecha-hora"
              type="datetime-local"
              value={fechaHora}
              onChange={(evento) => setFechaHora(evento.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="titulo-asamblea">Título</label>
          <input
            id="titulo-asamblea"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Asamblea ordinaria anual"
          />
        </div>

        <div className="campo">
          <label htmlFor="citacion">¿Qué la convoca?</label>
          <input
            id="citacion"
            value={citacion}
            onChange={(evento) => setCitacion(evento.target.value)}
            placeholder="Citación 004 del consejo de administración"
          />
        </div>

        <div className="separador" />
        <span className="titulo-seccion">Orden del día</span>
        {puntos.map((punto, i) => (
          <div key={i} className="campo">
            <label htmlFor={`punto-${i}`}>Punto {i + 1}</label>
            <input
              id={`punto-${i}`}
              value={punto.titulo}
              onChange={(evento) =>
                setPuntos(
                  puntos.map((p, j) => (i === j ? { ...p, titulo: evento.target.value } : p)),
                )
              }
              placeholder="Aprobación del presupuesto"
            />
            <input
              value={punto.descripcion}
              onChange={(evento) =>
                setPuntos(
                  puntos.map((p, j) => (i === j ? { ...p, descripcion: evento.target.value } : p)),
                )
              }
              placeholder="De qué se trata"
              style={{ marginTop: 'var(--e2)' }}
            />
            <label
              className="fila"
              style={{ justifyContent: 'flex-start', gap: 'var(--e2)', marginTop: 'var(--e2)' }}
            >
              <input
                type="checkbox"
                checked={punto.seVota}
                onChange={(evento) =>
                  setPuntos(
                    puntos.map((p, j) => (i === j ? { ...p, seVota: evento.target.checked } : p)),
                  )
                }
              />
              <span className="subtitulo">Este punto se somete a votación</span>
            </label>
          </div>
        ))}
        <button
          type="button"
          className="boton boton--pequeno"
          onClick={() => setPuntos([...puntos, { titulo: '', descripcion: '', seVota: false }])}
        >
          <Icono nombre="mas" tamano={14} />
          Agregar punto
        </button>

        {error && (
          <p className="acceso__error" style={{ marginTop: 'var(--e3)' }}>
            {error}
          </p>
        )}

        {/* Deshabilitado y con el motivo a la vista, como en la extraordinaria:
            dejar pulsar para contestar «falta el enlace» enseña a llenar por
            llenar. El repositorio lo vuelve a comprobar. */}
        {!respaldoListo && (
          <p className="acceso__nota" style={{ margin: 'var(--e3) 0' }}>
            {definicion.exigeLugar && !lugar.trim()
              ? 'Falta el lugar: una asamblea presencial tiene que decir dónde es.'
              : 'Falta el enlace de la reunión: es donde se van a encontrar.'}
          </p>
        )}

        <button
          className="boton boton--primario boton--bloque"
          type="submit"
          disabled={!respaldoListo}
          style={{ marginTop: 'var(--e3)' }}
        >
          Convocar
        </button>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

/**
 * Registrar un poder (CU-A-19).
 *
 * **El papel primero.** Es lo que hace válido el poder; pedir los datos y el
 * documento al final invita a registrar de memoria «lo que trajo don Jorge» y
 * buscar el papel después.
 */
function FormularioPoder({
  unidades,
  alRegistrar,
  alCerrar,
}: {
  unidades: ReturnType<typeof sel.unidadesDe>
  alRegistrar: (datos: {
    unidadId: string
    nombresApoderado: string
    apellidosApoderado: string
    documentoApoderado: string
    telefonoApoderado?: string
    imagen: string
  }) => Promise<void>
  alCerrar: () => void
}) {
  const [imagen, setImagen] = useState<string | null>(null)
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? '')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <Modal
      titulo="Registrar un poder"
      descripcion="El poder se otorga fuera de la app. Aquí se valida, se adjunta y se da de alta a quien lo ejerce."
      onCerrar={alCerrar}
    >
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          setError(null)
          if (!imagen) {
            setError('Falta la foto del poder firmado: sin ella el poder no se registra.')
            return
          }
          if (nombres.trim().length < 2 || apellidos.trim().length < 2) {
            setError('Escribe el nombre completo del apoderado, como aparece en el poder.')
            return
          }
          if (documento.trim().length < 5) {
            setError('Falta el documento de identidad del apoderado.')
            return
          }
          void alRegistrar({
            unidadId,
            nombresApoderado: nombres.trim(),
            apellidosApoderado: apellidos.trim(),
            documentoApoderado: documento.trim(),
            telefonoApoderado: telefono.trim() || undefined,
            imagen,
          })
        }}
      >
        <CapturaFoto
          etiqueta="El poder firmado"
          ayuda="Fotografía o escaneo del documento. Es lo que respalda el voto si alguien lo impugna."
          valor={imagen}
          alCambiar={setImagen}
        />

        <div className="separador" />

        <div className="campo">
          <label htmlFor="unidad-poder">¿Qué unidad representa?</label>
          <select
            id="unidad-poder"
            value={unidadId}
            onChange={(evento) => setUnidadId(evento.target.value)}
          >
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {etiquetaUnidad(unidad)}
              </option>
            ))}
          </select>
          <span className="ayuda-campo">
            El coeficiente que va a representar es el de esta unidad, no el del apoderado.
          </span>
        </div>

        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="nombres-apoderado">Nombres</label>
            <input
              id="nombres-apoderado"
              value={nombres}
              onChange={(evento) => setNombres(evento.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="apellidos-apoderado">Apellidos</label>
            <input
              id="apellidos-apoderado"
              value={apellidos}
              onChange={(evento) => setApellidos(evento.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="documento-apoderado">Documento de identidad</label>
          <input
            id="documento-apoderado"
            inputMode="numeric"
            value={documento}
            onChange={(evento) => setDocumento(evento.target.value)}
          />
          {/* Se busca por documento, no por nombre: si esa persona ya está en el
              sistema se reutiliza en vez de duplicarla (RN-61). */}
          <span className="ayuda-campo">
            Si esa persona ya existe en Idiky, se reutiliza. Si no, queda como{' '}
            <strong>usuario temporal de la asamblea</strong>: su única vinculación con la
            copropiedad es este poder.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="telefono-apoderado">Celular (opcional)</label>
          <input
            id="telefono-apoderado"
            value={telefono}
            onChange={(evento) => setTelefono(evento.target.value)}
            placeholder="+57 300 000 0000"
          />
        </div>

        {error && <p className="acceso__error">{error}</p>}

        <button className="boton boton--primario boton--bloque" type="submit">
          Registrar el poder
        </button>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

/**
 * El poder, tal como se lee (CU-A-19).
 *
 * **La misma hoja que ve el propietario**, y eso es deliberado: el apoderado
 * llega mostrando algo y la administración tiene que estar leyendo eso mismo. Si
 * cada uno viera su versión, el día que discutan no habría un documento común.
 *
 * Y cuando el poder llegó **en papel**, debajo va la foto: la hoja dice lo que
 * dice, pero lo que respalda ese poder es la firma del documento adjunto.
 */
function VistaPoder({
  bd,
  poderId,
  alCerrar,
}: {
  bd: ReturnType<typeof useDatos>['bd']
  poderId: string
  alCerrar: () => void
}) {
  const poder = bd.poderes.find((p) => p.id === poderId)
  if (!poder) return null

  const unidad = sel.unidad(bd, poder.unidadId)
  const documento = poder.documentoId
    ? bd.documentos.find((d) => d.id === poder.documentoId)
    : undefined

  return (
    <Modal
      titulo="Poder"
      descripcion={unidad ? etiquetaUnidad(unidad) : undefined}
      onCerrar={alCerrar}
    >
      {poder.revocadoEn && (
        <p className="acceso__nota" style={{ marginBottom: 'var(--e3)' }}>
          Este poder está <strong>revocado</strong>. Se conserva porque, si votó antes de
          revocarse, hay que poder explicarlo (RN-61).
        </p>
      )}

      <div className="previsualizacion-hoja">
        <HojaPoder
          poder={poder}
          documento={documento}
          copropiedad={sel.copropiedad(bd, unidad?.copropiedadId ?? '')}
          asamblea={sel.asamblea(bd, poder.asambleaId)}
          unidad={unidad}
          otorgante={sel.persona(bd, poder.otorgadoPor)}
          apoderado={sel.persona(bd, poder.apoderadoId)}
        />
      </div>

      {poder.soporte && (
        <>
          <div className="separador" />
          <span className="titulo-seccion">El documento firmado</span>
          <p className="subtitulo">
            Es lo que respalda este poder: llegó en papel y la administración lo adjuntó.
          </p>
          <img
            src={poder.soporte.imagen}
            alt="Poder firmado"
            style={{
              width: '100%',
              borderRadius: 'var(--radio-sm)',
              border: '1px solid var(--color-borde)',
              marginTop: 'var(--e2)',
            }}
          />
        </>
      )}
    </Modal>
  )
}
