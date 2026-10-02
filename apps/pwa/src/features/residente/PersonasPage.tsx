/**
 * CU-R-27 — Registrar y dar de baja a las personas de mi unidad.
 * Doc: docs/casos-de-uso/residente.md#cu-r-27
 *
 * **Registrar a alguien son tres actos, no un formulario** (RN-57 a RN-59), y
 * esta pantalla existe para que se vean los tres:
 *
 *   1. **Registrar** — quien responde por la unidad dice a quién quiere meter.
 *   2. **Adjuntar** — la propia persona sube su documento y su foto, desde su
 *      teléfono (RN-58). Esto es lo que convierte el trámite en un soporte: una
 *      foto de cédula que sube un tercero no prueba nada sobre quién la subió.
 *   3. **Autorizar** — quien registró mira los soportes y responde. Recién ahí
 *      la persona existe para la copropiedad.
 *
 * Entre uno y otro pasa tiempo real —se registra hoy, la persona adjunta esta
 * noche, se autoriza mañana—, y por eso los registros en curso van arriba y no
 * escondidos: son lo único de esta pantalla que le pide algo a alguien.
 *
 * **Quién ve qué** (RN-60): el propietario registra residentes, arrendatarios y
 * temporales; el arrendatario solo visitantes. Lo decide `reglas.ts`, no un
 * `if` escrito aquí.
 *
 * **Nada se borra** (Mary, 2026-09-07: «no se borran, se inhabilitan»). Dar de
 * baja cierra el vínculo con fecha y el histórico queda: es lo único que después
 * permite responder quién vivía aquí en tal fecha, o quién autorizó a quien
 * recibió aquel paquete.
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  autorizarRegistro,
  cerrarRegistro,
  cambiarEstadia,
  decidirCambioComoPropietario,
  decidirEstadiaComoPropietario,
  crearRegistroPersona,
  desvincularResidente,
  registrarAccesoSoportes,
} from '../../datos/repositorio'
import {
  categoriasQuePuedeRegistrar,
  puedeAutorizar,
  categoriaDeResidencia,
  condicionDeResidencia,
  esperaAlPropietario,
  puedeInhabilitar,
  registroEnCurso,
  verSoportesDejaConstancia,
} from '../../dominio/reglas'
import { formatearFecha, formatearFechaHora } from '../../utilidades/formato'
import {
  textoClase,
  textoCondicion,
  CATEGORIAS,
  DetalleRegistro,
  ESTADOS,
  FormularioRegistro,
} from '../../componentes/Registro'
import { BotonVolver } from '../../componentes/BotonVolver'
import { CambiarEstadia } from '../../componentes/CambiarEstadia'
import type { Residencia } from '../../dominio/tipos'
import { EstadoVacio } from '../../componentes/EstadoVacio'

export function PersonasPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  // La pantalla de visitantes entra aqui con la categoria ya escogida: quien
  // venia a autorizar una visita no deberia tener que volver a decir que es.
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const pedida = parametros.get('nuevo')
  const [registrando, setRegistrando] = useState(pedida === 'visitante')
  const [viendo, setViendo] = useState<string | null>(null)
  /** El vínculo al que se le cambia la condición o la fecha (RN-68). */
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [noAprobando, setNoAprobando] = useState<string | null>(null)
  const [motivoNo, setMotivoNo] = useState('')
  /** Registros cuyos soportes se abrieron en esta visita a la pantalla. */
  const [abiertos, setAbiertos] = useState<string[]>([])

  if (!sesion) return null

  const unidadId = sesion.unidadActivaId
  const miRol = sel
    .residenciasDePersona(bd, sesion.personaId)
    .find((residencia) => residencia.unidadId === unidadId)?.rol
  const categorias = categoriasQuePuedeRegistrar(miRol)

  const residencias = sel.residenciasDeUnidad(bd, unidadId ?? '')
  const registros = sel.registrosDeUnidad(bd, unidadId)
  const enCurso = registros.filter(registroEnCurso)
  const cerrados = registros.filter((registro) => !registroEnCurso(registro))
  const enDetalle = registros.find((registro) => registro.id === viendo)

  /** RN-65 — Quien registró o, subiendo en la cadena, el propietario o la administración. */
  function puedeResponder(residencia: Residencia) {
    return puedeInhabilitar({ ...sel.responsablesDelVinculo(bd, residencia), personaId: sesion!.personaId, rol: sesion!.rol })
  }
  const enCambio = residencias.find((r) => r.id === cambiando)

  async function darDeBaja(residenciaId: string, nombre: string) {
    await ejecutar(
      (base) => desvincularResidente(base, { residenciaId, personaId: sesion!.personaId }),
      `${nombre} quedó inhabilitado en esta unidad.`,
    )
  }

  return (
    <div className="pila">
      <BotonVolver a="/app/unidad" texto="Mi unidad" />

      <div className="encabezado-seccion">
        <h2>Personas de la unidad</h2>
        {categorias.length > 0 && (
          <button className="enlace" onClick={() => setRegistrando(true)}>
            Registrar
          </button>
        )}
      </div>

      {/* Lo que le pide algo a alguien va primero. Un registro esperando
          autorización escondido debajo de una lista es un registro que se queda
          ahí una semana. */}
      {enCurso.length > 0 && (
        <div className="pila">
          <span className="titulo-seccion">En trámite</span>
          {enCurso.map((registro) => (
            <button
              key={registro.id}
              className="tarjeta tarjeta--accion tarjeta--pendiente"
              onClick={() => setViendo(registro.id)}
            >
              <div className="fila">
                <div className="columna">
                  <strong>
                    {registro.nombres} {registro.apellidos}
                  </strong>
                  <span className="subtitulo">
                    {textoClase(registro)} · {formatearFechaHora(registro.creadoEn)}
                  </span>
                </div>
                <span className={ESTADOS[registro.estado].chip}>
                  {ESTADOS[registro.estado].texto}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="pila">
        <span className="titulo-seccion">Viven aquí</span>
        {residencias.length === 0 ? (
          <EstadoVacio
            titulo="Nadie vinculado"
            detalle="Cuando registres a alguien y lo autorices, aparecerá aquí."
          />
        ) : (
          <div className="lista">
            {residencias.map((residencia) => {
              const persona = sel.persona(bd, residencia.personaId)
              const soyYo = residencia.personaId === sesion.personaId
              return (
                <div key={residencia.id} className="tarjeta">
                  <div className="fila">
                    <div className="columna">
                      <strong>{nombreCompleto(persona)}</strong>
                      <span className="subtitulo">
                        {CATEGORIAS[categoriaDeResidencia(residencia)].texto} ·{' '}
                        {textoCondicion(categoriaDeResidencia(residencia), condicionDeResidencia(residencia))}
                        {' · desde '}
                        {formatearFecha(residencia.desde)}
                        {residencia.hasta ? ` hasta ${formatearFecha(residencia.hasta)}` : ''}
                      </span>
                    </div>
                    {/* Quién puede inhabilitar depende de quién creó el vínculo
                        (RN-65): lo que registró el propietario lo quita él o la
                        administración; lo que registró la administración, solo
                        ella. Y nadie se inhabilita a sí mismo: quedaría una
                        unidad sin quien responda por ella, y sin nadie que
                        pudiera arreglarlo desde adentro. */}
                    <div className="grupo-botones">
                      {(puedeResponder(residencia) || (soyYo && residencia.rol === 'propietario')) &&
                        !residencia.cambioPendiente && (
                          <button className="boton boton--pequeno" disabled={cargando} onClick={() => setCambiando(residencia.id)}>
                            Cambiar
                          </button>
                        )}
                    {!soyYo &&
                      puedeResponder(residencia) && (
                        <button
                          className="boton boton--pequeno boton--peligro"
                          disabled={cargando}
                          onClick={() => void darDeBaja(residencia.id, nombreCompleto(persona))}
                        >
                          Inhabilitar
                        </button>
                      )}
                    </div>
                  </div>
                  {/* RN-60 — El cambio que pidió el arrendatario espera al propietario. */}
                  {residencia.cambioPendiente && (
                    <div className="pila" style={{ marginTop: 'var(--e2)' }}>
                      <span className="chip chip--alerta">
                        Pide quedarse hasta el {formatearFecha(residencia.cambioPendiente.hasta ?? '')}: espera al propietario
                      </span>
                      {miRol === 'propietario' && (
                        <div className="grupo-botones">
                          <button
                            className="boton boton--pequeno boton--primario"
                            disabled={cargando}
                            onClick={() =>
                              void ejecutar(
                                (base) => decidirCambioComoPropietario(base, { residenciaId: residencia.id, personaId: sesion.personaId, aprobar: true }),
                                'Cambio aprobado.',
                              )
                            }
                          >
                            Aprobar
                          </button>
                          <button className="boton boton--pequeno" disabled={cargando} onClick={() => setNoAprobando(residencia.id)}>
                            No aprobar
                          </button>
                        </div>
                      )}
                      {noAprobando === residencia.id && (
                        <div className="campo">
                          <label htmlFor={`no-${residencia.id}`}>¿Por qué no lo apruebas? Tu arrendatario lo va a leer.</label>
                          <textarea id={`no-${residencia.id}`} value={motivoNo} onChange={(e) => setMotivoNo(e.target.value)} />
                          <button
                            className="boton boton--pequeno boton--peligro"
                            disabled={cargando || motivoNo.trim().length < 5}
                            onClick={() =>
                              void ejecutar(
                                (base) =>
                                  decidirCambioComoPropietario(base, {
                                    residenciaId: residencia.id,
                                    personaId: sesion.personaId,
                                    aprobar: false,
                                    motivo: motivoNo,
                                  }),
                                'Cambio no aprobado.',
                              ).then((hecho) => {
                                if (hecho) {
                                  setNoAprobando(null)
                                  setMotivoNo('')
                                }
                              })
                            }
                          >
                            Enviar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {residencia.cambioNoAprobado && !residencia.cambioPendiente && (
                    <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                      El propietario no aprobó alargar la estadía: {residencia.cambioNoAprobado.motivo}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {cerrados.length > 0 && (
        <details className="historial">
          <summary>Registros cerrados ({cerrados.length})</summary>
          <div className="lista" style={{ marginTop: 'var(--e3)' }}>
            {cerrados.map((registro) => (
              <button
                key={registro.id}
                className="tarjeta tarjeta--plana tarjeta--accion"
                onClick={() => setViendo(registro.id)}
              >
                <div className="fila">
                  <div className="columna">
                    <strong>
                      {registro.nombres} {registro.apellidos}
                    </strong>
                    <span className="subtitulo">{textoClase(registro)}</span>
                  </div>
                  <span className={ESTADOS[registro.estado].chip}>
                    {ESTADOS[registro.estado].texto}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Se dice de dónde salen los datos que no están aquí: el arrendatario ve
          esta pantalla y no puede registrar residentes, y merece saber por qué. */}
      {miRol !== 'propietario' && (
        <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
          Registrar residentes y arrendatarios es del propietario de la unidad (RN-60). Tú puedes
          registrar visitantes.
        </p>
      )}

      {registrando && (
        <FormularioRegistro
          categorias={categorias}
          registraArrendatario={miRol === 'arrendatario'}
          categoriaInicial={pedida === 'visitante' ? 'visitante' : undefined}
          alCerrar={() => setRegistrando(false)}
          alCrear={async (datos) => {
            const creado = await ejecutar(
              (base) =>
                crearRegistroPersona(base, {
                  ...datos,
                  copropiedadId: sesion.copropiedadId,
                  // La unidad es la de la sesion, siempre: aqui nadie registra
                  // gente en la unidad de otro.
                  unidadId: unidadId!,
                  creadoPor: sesion.personaId,
                }),
              datos.categoria === 'visitante' && datos.condicion === 'no_residente' && !datos.pedirFotos
                ? 'Registro creado.'
                : 'Registro creado. Ahora la persona adjunta sus fotos.',
            )
            if (creado) {
              setRegistrando(false)
              // Una visita queda autorizada de una vez: lo que la persona
              // necesita enseguida es el codigo de entrada, que vive en la
              // pantalla de visitantes. Mostrarle el detalle del registro seria
              // dejarla a un toque de lo que vino a buscar.
              if (creado.visitanteId) navegar('/app/visitantes')
              else setViendo(creado.id)
            }
          }}
        />
      )}

      {enCambio && (
        <CambiarEstadia
          residencia={enCambio}
          nombre={nombreCompleto(sel.persona(bd, enCambio.personaId))}
          registraArrendatario={miRol === 'arrendatario'}
          alCerrar={() => setCambiando(null)}
          alGuardar={async (condicion, hasta) => {
            const hecho = await ejecutar(
              (base) => cambiarEstadia(base, { residenciaId: enCambio.id, personaId: sesion.personaId, condicion, hasta }),
              'Cambio guardado.',
            )
            if (hecho) setCambiando(null)
          }}
        />
      )}

      {enDetalle && (
        <DetalleRegistro
          registro={enDetalle}
          mensaje={bd.mensajes.find((m) => m.registroId === enDetalle.id)}
          // Ya decidido, las fotos se abren a propósito y queda constancia (RN-67).
          mostrarSoportes={!verSoportesDejaConstancia(enDetalle) || abiertos.includes(enDetalle.id)}
          accesos={bd.accesosSoportes
            .filter((acceso) => acceso.registroId === enDetalle.id)
            .map((acceso) => ({
              id: acceso.id,
              quien: nombreCompleto(sel.persona(bd, acceso.personaId)),
              vistoEn: acceso.vistoEn,
            }))}
          alAbrirSoportes={async () => {
            setAbiertos((antes) => [...antes, enDetalle.id])
            await ejecutar((base) =>
              registrarAccesoSoportes(base, {
                registroId: enDetalle.id,
                personaId: sesion.personaId,
              }),
            )
          }}
          puedoAutorizar={puedeAutorizar(enDetalle, sesion.personaId)}
          alDecidirEstadia={
            miRol === 'propietario' && esperaAlPropietario(enDetalle)
              ? async (aprobar, motivo) => {
                  const hecho = await ejecutar(
                    (base) =>
                      decidirEstadiaComoPropietario(base, {
                        registroId: enDetalle.id,
                        personaId: sesion.personaId,
                        aprobar,
                        motivo,
                      }),
                    aprobar ? 'Estadía aprobada. Ahora tu arrendatario la autoriza.' : 'Estadía no aprobada.',
                  )
                  if (hecho && !aprobar) setViendo(null)
                }
              : undefined
          }
          esMio={enDetalle.creadoPor === sesion.personaId}
          alCerrar={() => setViendo(null)}
          alAutorizar={async () => {
            const hecho = await ejecutar(
              (base) =>
                autorizarRegistro(base, {
                  registroId: enDetalle.id,
                  personaId: sesion.personaId,
                }),
              'Autorizado. La persona ya está registrada en la unidad.',
            )
            if (hecho) setViendo(null)
          }}
          alRechazar={async (motivo, anular) => {
            if (motivo.trim().length < 5) {
              mostrarAviso(
                'Escribe por qué: sin motivo, el rechazo no le dice nada a nadie.',
                'error',
              )
              return
            }
            const hecho = await ejecutar(
              (base) =>
                cerrarRegistro(base, {
                  registroId: enDetalle.id,
                  personaId: sesion.personaId,
                  motivo: motivo.trim(),
                  anular,
                }),
              anular ? 'Registro retirado.' : 'Registro rechazado.',
            )
            if (hecho) setViendo(null)
          }}
        />
      )}
    </div>
  )
}
