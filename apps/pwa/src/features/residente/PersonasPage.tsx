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
  crearRegistroPersona,
  desvincularResidente,
} from '../../datos/repositorio'
import { categoriasQuePuedeRegistrar, puedeAutorizar, registroEnCurso } from '../../dominio/reglas'
import { formatearFecha, formatearFechaHora } from '../../utilidades/formato'
import {
  CATEGORIAS,
  DetalleRegistro,
  ESTADOS,
  FormularioRegistro,
} from '../../componentes/Registro'
import { BotonVolver } from '../../componentes/BotonVolver'
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

  async function darDeBaja(residenciaId: string, nombre: string) {
    await ejecutar(
      (base) => desvincularResidente(base, residenciaId),
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
                    {CATEGORIAS[registro.categoria].texto} · {formatearFechaHora(registro.creadoEn)}
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
                        {residencia.rol === 'propietario'
                          ? 'Propietario'
                          : residencia.rol === 'arrendatario'
                            ? 'Arrendatario'
                            : 'Residente temporal'}
                        {' · desde '}
                        {formatearFecha(residencia.desde)}
                        {residencia.hasta ? ` hasta ${formatearFecha(residencia.hasta)}` : ''}
                      </span>
                    </div>
                    {/* Nadie se inhabilita a sí mismo: quedaría una unidad sin
                        quien responda por ella, y sin nadie que pueda arreglarlo
                        desde adentro. */}
                    {miRol === 'propietario' && !soyYo && (
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
                    <span className="subtitulo">{CATEGORIAS[registro.categoria].texto}</span>
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
              datos.categoria === 'visitante'
                ? 'Registro creado.'
                : 'Registro creado. Ahora la persona adjunta sus fotos.',
            )
            if (creado) {
              setRegistrando(false)
              // Una visita queda autorizada de una vez: lo que la persona
              // necesita enseguida es el codigo de entrada, que vive en la
              // pantalla de visitantes. Mostrarle el detalle del registro seria
              // dejarla a un toque de lo que vino a buscar.
              if (creado.categoria === 'visitante') navegar('/app/visitantes')
              else setViendo(creado.id)
            }
          }}
        />
      )}

      {enDetalle && (
        <DetalleRegistro
          registro={enDetalle}
          puedoAutorizar={puedeAutorizar(enDetalle, sesion.personaId)}
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
