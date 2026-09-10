/**
 * El trámite de registro de una persona, compartido por las tres consolas.
 * CU-R-27, CU-A-25 · docs/casos-de-uso/residente.md#cu-r-27
 *
 * **Un solo trámite para los tres eslabones de RN-63.** El administrador
 * registra propietarios, el propietario registra residentes y arrendatarios, y
 * cualquier residente registra visitantes: cambia quién puede escoger qué
 * categoría, no el trámite. Si cada consola tuviera su propio formulario, en dos
 * meses una pediría los soportes y la otra no, y el modelo de datos diría que
 * las dos los tienen.
 *
 * Por eso lo que varía entra por parámetros —qué categorías se ofrecen, si hay
 * que escoger unidad— y lo que no varía vive aquí: las dos fotos, la vigencia
 * según la categoría, y que autorizar venga después de mirar los soportes.
 */

import { useState } from 'react'
import { formatearFecha, formatearFechaHora } from '../utilidades/formato'
import type {
  CategoriaRegistro,
  Mensaje,
  RegistroPersona,
  RolResidencia,
  Unidad,
} from '../dominio/tipos'
import {
  etiquetaUnidad,
  exigeSoportes,
  exigeVigencia,
  hoyISO,
  soloUnDia,
  sumarDias,
} from '../dominio/reglas'
import { Modal } from './Modal'
import { Icono } from './Icono'

/**
 * La marca de residente segun la categoria (RN-68, Mary 2026-09-07).
 *
 *   propietario  -> la escoge quien registra: puede tener la unidad arrendada
 *   arrendatario -> si, arrienda para vivir ahi
 *   temporal     -> si, vive ahi un tiempo
 *   visitante    -> no, viene de visita
 *
 * En un solo sitio para que no se conteste distinto en cada pantalla.
 */
export function marcaResidente(
  categoria: CategoriaRegistro,
  rol: RolResidencia | undefined,
  escogida: boolean,
): boolean {
  if (categoria === 'visitante') return false
  if (categoria === 'residente' && rol === 'propietario') return escogida
  return true
}

/** Cómo se llama cada categoría delante de quien la escoge, y qué significa. */
export const CATEGORIAS: Record<CategoriaRegistro, { texto: string; ayuda: string }> = {
  residente: {
    texto: 'Residente',
    ayuda: 'Vive aquí de forma permanente. Enseguida escoges si es propietario o arrendatario.',
  },
  residente_temporal: {
    texto: 'Residente temporal',
    ayuda: 'Se queda a dormir un tiempo: un huésped de Airbnb, un familiar unos meses.',
  },
  visitante: {
    texto: 'Visitante',
    ayuda: 'Viene de visita, una tarde o unos días. Entra con un código para la portería.',
  },
}

export const ESTADOS: Record<RegistroPersona['estado'], { texto: string; chip: string }> = {
  esperando_soportes: { texto: 'Esperando sus fotos', chip: 'chip chip--alerta' },
  esperando_autorizacion: { texto: 'Falta autorizar', chip: 'chip chip--info' },
  autorizado: { texto: 'Autorizado', chip: 'chip chip--exito' },
  rechazado: { texto: 'Rechazado', chip: 'chip chip--error' },
  anulado: { texto: 'Retirado', chip: 'chip' },
}

export interface DatosRegistro {
  categoria: CategoriaRegistro
  rol?: RolResidencia
  nombres: string
  apellidos: string
  documento: string
  email: string
  telefono: string
  vigenciaDesde?: string
  vigenciaHasta?: string
  placa?: string
  /** La marca de residente (RN-68). */
  reside?: boolean
  /** Solo cuando quien registra puede escoger unidad (el administrador). */
  unidadId?: string
}

/**
 * El formulario. **La categoría va primero y cambia lo que se pregunta después**:
 * pedirle fecha de salida a quien compró un apartamento no tiene sentido, y no
 * pedírsela a un temporal es justo lo que lo vuelve indistinguible de un
 * residente (RN-62).
 */
export function FormularioRegistro({
  categorias,
  unidades,
  categoriaInicial,
  alCrear,
  alCerrar,
}: {
  categorias: readonly CategoriaRegistro[]
  /** Solo la consola del administrador: ahí hay que decir a qué unidad entra. */
  unidades?: Unidad[]
  categoriaInicial?: CategoriaRegistro
  alCrear: (datos: DatosRegistro) => Promise<void>
  alCerrar: () => void
}) {
  const [categoria, setCategoria] = useState<CategoriaRegistro>(
    categoriaInicial && categorias.includes(categoriaInicial) ? categoriaInicial : categorias[0],
  )
  const [unidadId, setUnidadId] = useState(unidades?.[0]?.id ?? '')
  const [rol, setRol] = useState<RolResidencia>('arrendatario')
  /** La marca de residente. Solo el propietario puede no llevarla. */
  const [reside, setReside] = useState(true)
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(sumarDias(hoyISO(), 30))
  const [placa, setPlaca] = useState('')
  const [error, setError] = useState<string | null>(null)

  const conVigencia = exigeVigencia(categoria)
  /* Lo que se le promete a quien registra cambia con la categoria, porque el
     tramite cambia con ella (RN-57): anunciarle fotos a quien registra una
     visita de una tarde seria prometerle un paso que no va a existir. */
  const conSoportes = exigeSoportes(categoria)
  const unDia = soloUnDia(categoria)
  /** Solo el propietario tiene algo que decidir aquí (RN-68). */
  const marcaEditable = categoria === 'residente' && rol === 'propietario'
  /** Lo que va a quedar: lo escogido si se puede escoger, o lo que manda la regla. */
  const marca = marcaResidente(categoria, rol, reside)

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    if (nombres.trim().length < 2 || apellidos.trim().length < 2) {
      setError('Escribe nombres y apellidos completos.')
      return
    }
    if (documento.trim().length < 5) {
      setError(
        'El documento de identidad es obligatorio: es con lo que la persona abre su registro.',
      )
      return
    }
    if (conVigencia && !unDia && hasta < desde) {
      setError('La fecha de salida no puede ser anterior a la de entrada.')
      return
    }
    if (unDia && desde < hoyISO()) {
      setError('Esa fecha ya pasó. Escoge el día en que viene la visita.')
      return
    }
    if (unidades && !unidadId) {
      setError('Escoge la unidad a la que entra.')
      return
    }
    void alCrear({
      categoria,
      rol: categoria === 'residente' ? rol : undefined,
      reside: marca,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      documento: documento.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      vigenciaDesde: desde,
      // La visita entra y sale el mismo dia (RN-62).
      vigenciaHasta: unDia ? desde : conVigencia ? hasta : undefined,
      placa: categoria === 'visitante' ? placa.trim() || undefined : undefined,
      ...(unidades ? { unidadId } : {}),
    })
  }

  return (
    <Modal
      titulo="Registrar una persona"
      descripcion={
        conSoportes
          ? 'Después de crearlo, la persona adjunta sus fotos desde su teléfono y tú autorizas.'
          : 'Queda autorizado de una vez, con su código para la portería.'
      }
      onCerrar={alCerrar}
    >
      <form onSubmit={enviar}>
        {unidades && (
          <div className="campo">
            <label htmlFor="unidad">¿A qué unidad entra?</label>
            <select
              id="unidad"
              value={unidadId}
              onChange={(evento) => setUnidadId(evento.target.value)}
            >
              {unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {etiquetaUnidad(unidad)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="campo">
          <label>¿Qué es esta persona?</label>
          <div className="pila" style={{ gap: 'var(--e2)' }}>
            {categorias.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="opcion-categoria"
                aria-pressed={categoria === opcion}
                onClick={() => setCategoria(opcion)}
              >
                <span className="columna">
                  <strong>{CATEGORIAS[opcion].texto}</strong>
                  <span className="subtitulo">{CATEGORIAS[opcion].ayuda}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {categoria === 'residente' && (
          <div className="campo">
            <label htmlFor="rol">¿Con qué título?</label>
            <select
              id="rol"
              value={rol}
              onChange={(evento) => setRol(evento.target.value as RolResidencia)}
            >
              <option value="propietario">Propietario</option>
              <option value="arrendatario">Arrendatario</option>
            </select>
          </div>
        )}

        {/* La marca **se ve siempre y solo se cambia en el propietario** (Mary,
            2026-09-07). Se ve siempre porque quien registra tiene que saber qué
            marca va a quedar antes de crear a la persona; se cambia solo en el
            propietario porque en los demás no hay nada que decidir: el
            arrendatario arrienda para vivir ahí, al temporal se le llama
            temporal porque vive ahí un tiempo, y el visitante viene de visita.
            Un propietario, en cambio, puede tener su apartamento arrendado o
            vacío y sigue siendo propietario —vota, recibe la cuota y registra
            gente—; lo que cambia es que la portería no tiene que reconocerlo. */}
        <div className="campo">
          <label>¿Vive en la unidad?</label>
          <div className="segmentos">
            <button
              type="button"
              className="segmento"
              aria-current={marca ? 'page' : undefined}
              disabled={!marcaEditable}
              onClick={() => setReside(true)}
            >
              Sí, vive aquí
            </button>
            <button
              type="button"
              className="segmento"
              aria-current={!marca ? 'page' : undefined}
              disabled={!marcaEditable}
              onClick={() => setReside(false)}
            >
              No vive aquí
            </button>
          </div>
          <span className="ayuda-campo">
            {!marcaEditable
              ? categoria === 'visitante'
                ? 'Un visitante no vive aquí. No se puede cambiar.'
                : 'Quien entra con este título vive en la unidad. No se puede cambiar.'
              : marca
                ? 'Lleva la marca de residente: la portería lo va a reconocer en la entrada.'
                : 'Tiene la unidad arrendada o vacía. Sigue siendo propietario —vota, recibe la cuota y registra gente—, pero no aparece en la lista de la portería.'}
          </span>
        </div>

        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="nombres">Nombres</label>
            <input id="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="apellidos">Apellidos</label>
            <input
              id="apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label htmlFor="documento">Documento de identidad</label>
          <input
            id="documento"
            inputMode="numeric"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
          <span className="ayuda-campo">
            {conSoportes
              ? 'Con este número y el código que sale al terminar, la persona abre su registro para adjuntar las fotos.'
              : 'Es lo que la portería le pide en la entrada, junto con su código.'}
          </span>
        </div>

        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="telefono">Celular</label>
            <input
              id="telefono"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* La visita es de un solo dia (RN-62), asi que se pregunta un dia y no un
            rango: dos campos donde solo cabe una fecha invitan a poner un rango
            y despues rebota la regla. */}
        {unDia ? (
          <div className="campo">
            <label htmlFor="desde">¿Qué día viene?</label>
            <input
              id="desde"
              type="date"
              min={hoyISO()}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
            <span className="ayuda-campo">
              Entra y sale ese día. Si se queda a dormir varios días, regístrala como residente
              temporal.
            </span>
          </div>
        ) : (
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="desde">Entra el</label>
              <input
                id="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            {conVigencia && (
              <div className="campo">
                <label htmlFor="hasta">Sale el</label>
                <input
                  id="hasta"
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {categoria === 'visitante' && (
          <div className="campo">
            <label htmlFor="placa">Placa del vehículo (opcional)</label>
            <input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} />
          </div>
        )}

        {error && <p className="acceso__error">{error}</p>}

        <button className="boton boton--primario boton--bloque" type="submit">
          {conSoportes ? 'Crear el registro' : 'Autorizar la visita'}
        </button>
      </form>
    </Modal>
  )
}

/**
 * El detalle: lo que hay que hacer con este registro, y los soportes cuando
 * llegan.
 *
 * Mientras espera soportes, lo único útil que puede mostrar es **el código**,
 * porque es lo que hay que hacerle llegar a la persona. En el producto real esto
 * lo manda un mensaje; aquí se muestra para poder dictarlo (misma honestidad que
 * el código de un solo uso del ingreso, ADR-0004).
 */
export function DetalleRegistro({
  registro,
  mensaje,
  mostrarSoportes = true,
  accesos,
  alAbrirSoportes,
  puedoAutorizar,
  esMio,
  alAutorizar,
  alRechazar,
  alCerrar,
}: {
  registro: RegistroPersona
  /** El mensaje que se le mandó a la persona, si hubo (RN-64). */
  mensaje?: Mensaje
  /** Si las fotos se muestran ya, o hay que abrirlas dejando constancia (RN-67). */
  mostrarSoportes?: boolean
  /** Quiénes las han mirado, en orden. */
  accesos?: Array<{ id: string; quien: string; vistoEn: string }>
  alAbrirSoportes?: () => Promise<void>
  puedoAutorizar: boolean
  esMio: boolean
  alAutorizar: () => Promise<void>
  alRechazar: (motivo: string, anular: boolean) => Promise<void>
  alCerrar: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(false)

  return (
    <Modal
      titulo={`${registro.nombres} ${registro.apellidos}`}
      descripcion={CATEGORIAS[registro.categoria].texto}
      onCerrar={alCerrar}
    >
      <div className="lista lista--compacta">
        <div className="fila">
          <span className="subtitulo">Documento</span>
          <strong className="numerico">{registro.documento}</strong>
        </div>
        {registro.vigenciaHasta && (
          <div className="fila">
            <span className="subtitulo">Hasta</span>
            <strong>{formatearFecha(registro.vigenciaHasta)}</strong>
          </div>
        )}
        <div className="fila">
          <span className="subtitulo">Estado</span>
          <span className={ESTADOS[registro.estado].chip}>{ESTADOS[registro.estado].texto}</span>
        </div>
      </div>

      {/* Al visitante no se le piden soportes (RN-57), asi que su registro nace
          autorizado y no tiene codigo que dictarle a nadie: el codigo que
          importa es el del visitante, y vive en la pantalla de visitantes. */}
      {registro.estado === 'esperando_soportes' && (
        <>
          <div className="separador" />
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <strong>Pásale este código</strong>
            <span className="subtitulo">
              Con su documento y este código entra a <strong>Adjuntar mis documentos</strong>, en la
              pantalla de ingreso, y sube las dos fotos.
            </span>
            <span className="codigo-registro numerico">{registro.codigo}</span>
          </div>
          <p className="acceso__nota" style={{ marginTop: 'var(--e3)' }}>
            <strong>Demo:</strong> el código se muestra aquí. En la versión real le llega a la
            persona por mensaje.
          </p>
        </>
      )}

      {registro.fotoDocumento && registro.fotoPersona && (
        <>
          <div className="separador" />
          <span className="titulo-seccion">Soportes que adjuntó</span>
          {/* La constancia de la autorizacion, junto a lo que autoriza. Es lo que
              la ley le exige probar a quien trata los datos, y quien autoriza el
              registro tiene que poder verla sin buscarla (RN-66). */}
          {registro.consentimiento && (
            <span className="subtitulo">
              Autorizó el tratamiento de sus datos el{' '}
              {formatearFechaHora(registro.consentimiento.aceptadoEn)} · política{' '}
              {registro.consentimiento.version}
            </span>
          )}
          {/* Mientras se decide, las fotos están a la vista: compararlas **es**
              autorizar, y pedir un clic extra ahí sería estorbo. Una vez
              decidido se guardan, y abrirlas deja constancia de quién las miró
              (RN-67) — no por desconfianza, sino para que el día que alguien
              pregunte «¿quién vio mi documento?» la respuesta exista. */}
          {mostrarSoportes ? (
            <div className="soportes">
              <figure className="soporte">
                <img src={registro.fotoDocumento.imagen} alt="Documento de identidad" />
                <figcaption>Documento</figcaption>
              </figure>
              <figure className="soporte">
                <img src={registro.fotoPersona.imagen} alt="Foto de la persona" />
                <figcaption>La persona</figcaption>
              </figure>
            </div>
          ) : (
            <button
              className="boton boton--bloque"
              style={{ marginTop: 'var(--e3)' }}
              onClick={() => void alAbrirSoportes?.()}
            >
              <Icono nombre="buscar" tamano={16} />
              Ver los soportes
            </button>
          )}
          {!mostrarSoportes && (
            <span className="ayuda-campo" style={{ display: 'block', marginTop: 'var(--e2)' }}>
              Quedará constancia de que los abriste.
            </span>
          )}
          {mostrarSoportes && accesos && accesos.length > 0 && (
            <details className="historial" style={{ marginTop: 'var(--e3)' }}>
              <summary>Quién los ha mirado ({accesos.length})</summary>
              <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
                {accesos.map((acceso) => (
                  <div key={acceso.id} className="fila">
                    <span className="subtitulo">{acceso.quien}</span>
                    <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                      {formatearFechaHora(acceso.vistoEn)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}

      {/* El mensaje que salio, con su texto exacto. Quien autoriza tiene que poder
          ver que se le dijo a la persona: es lo que despues zanja el «a mi nadie
          me aviso» (RN-64). Y si no habia celular, se dice, porque entonces le
          toca avisarle por su cuenta. */}
      {registro.estado === 'autorizado' && (
        <>
          <div className="separador" />
          {mensaje ? (
            <div className="columna" style={{ gap: 'var(--e2)' }}>
              <span className="titulo-seccion">Mensaje enviado</span>
              <span className="subtitulo">
                A {mensaje.destino} · {formatearFechaHora(mensaje.enviadoEn)}
              </span>
              <p className="mensaje mensaje--administracion">{mensaje.texto}</p>
              <span className="ayuda-campo">
                <strong>Demo:</strong> el texto es el que saldría; todavía no hay quién lo envíe.
              </span>
            </div>
          ) : (
            <div className="columna" style={{ gap: 'var(--e1)' }}>
              <strong>No pudimos avisarle</strong>
              <span className="subtitulo">
                Este registro no tiene celular, así que no salió ningún mensaje. Cuéntale tú que
                ya quedó.
              </span>
            </div>
          )}
        </>
      )}

      {registro.motivo && (
        <p className="mensaje" style={{ marginTop: 'var(--e4)' }}>
          <span className="mensaje__meta">Motivo</span>
          {registro.motivo}
        </p>
      )}

      {puedoAutorizar && !rechazando && (
        <>
          <div className="separador" />
          {/* Autorizar es decir «vi los soportes y es quien dice ser». Por eso el
              botón está debajo de las fotos y no arriba: se firma después de
              mirar, no antes. */}
          <button
            className="boton boton--primario boton--bloque"
            onClick={() => void alAutorizar()}
          >
            <Icono nombre="check" tamano={18} />
            Autorizar el registro
          </button>
          <button
            className="boton boton--bloque"
            style={{ marginTop: 'var(--e2)' }}
            onClick={() => setRechazando(true)}
          >
            Rechazar
          </button>
        </>
      )}

      {esMio && registro.estado === 'esperando_soportes' && !rechazando && (
        <button
          className="boton boton--bloque"
          style={{ marginTop: 'var(--e4)' }}
          onClick={() => setRechazando(true)}
        >
          Retirar el registro
        </button>
      )}

      {rechazando && (
        <div style={{ marginTop: 'var(--e4)' }}>
          <div className="campo">
            <label htmlFor="motivo">¿Por qué?</label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="La foto del documento no se lee, por ejemplo."
            />
          </div>
          <button
            className="boton boton--peligro boton--bloque"
            onClick={() => void alRechazar(motivo, registro.estado === 'esperando_soportes')}
          >
            {registro.estado === 'esperando_soportes' ? 'Retirar' : 'Rechazar'}
          </button>
        </div>
      )}
    </Modal>
  )
}
