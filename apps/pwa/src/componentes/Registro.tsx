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
  CondicionRegistro,
  Mensaje,
  RegistroPersona,
  Unidad,
} from '../dominio/tipos'
import {
  condicionesPosibles,
  DIAS_SIN_APROBACION_DEL_PROPIETARIO,
  esperaAlPropietario,
  requiereAprobacionPropietario,
  etiquetaUnidad,
  exigeSoportes,
  exigeVigencia,
  hoyISO,
  soloUnDia,
  sumarDias,
  admiteMarcaNoObligatorio,
  sinSoportesPorMarca,
} from '../dominio/reglas'
import { Modal } from './Modal'
import { Icono } from './Icono'

/** Cómo se llama cada quién delante de quien lo escoge, y qué significa. */
export const CATEGORIAS: Record<CategoriaRegistro, { texto: string; ayuda: string }> = {
  propietario: {
    texto: 'Propietario',
    ayuda: 'Dueño o copropietario de la unidad: vota, recibe la cuota y registra a los demás.',
  },
  arrendatario: {
    texto: 'Arrendatario',
    ayuda: 'Arrienda la unidad para vivir en ella.',
  },
  visitante: {
    texto: 'Visitante',
    ayuda: 'Viene de visita: una tarde, o se queda unos días (huésped de Airbnb, un familiar).',
  },
}

/**
 * Cómo se queda (RN-62, RN-68). El texto del visitante no residente es «de un
 * día», porque eso es lo que es: entra y sale el mismo día.
 */
export function textoCondicion(categoria: CategoriaRegistro, condicion: CondicionRegistro): string {
  if (condicion === 'residente') return 'Residente'
  if (condicion === 'temporal') return 'Residente temporal'
  return categoria === 'visitante' ? 'De un día' : 'No residente'
}

/** «Propietario · No residente», para las listas y el detalle. */
export function textoClase(registro: Pick<RegistroPersona, 'categoria' | 'condicion'>): string {
  return `${CATEGORIAS[registro.categoria].texto} · ${textoCondicion(registro.categoria, registro.condicion)}`
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
  condicion: CondicionRegistro
  pedirFotos?: boolean
  nombres: string
  apellidos: string
  documento: string
  email: string
  telefono: string
  vigenciaDesde?: string
  vigenciaHasta?: string
  placa?: string
  /** Solo cuando quien registra puede escoger unidad (el administrador). */
  unidadId?: string
  /** La marca «No obligatorio», solo desde la consola del administrador (RN-97). */
  soportesNoObligatorios?: boolean
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
  unidadInicial,
  categoriaInicial,
  permitirNoObligatorio = false,
  registraArrendatario = false,
  alCrear,
  alCerrar,
}: {
  categorias: readonly CategoriaRegistro[]
  /** Solo la consola del administrador: ahí hay que decir a qué unidad entra. */
  unidades?: Unidad[]
  /** La unidad ya escogida, cuando se llega desde un cambio de propietario. */
  unidadInicial?: string
  categoriaInicial?: CategoriaRegistro
  /** Solo el administrador puede eximir de los soportes (RN-97). */
  permitirNoObligatorio?: boolean
  /** Quien registra es arrendatario: la estadía larga la aprueba el propietario (RN-60). */
  registraArrendatario?: boolean
  alCrear: (datos: DatosRegistro) => Promise<void>
  alCerrar: () => void
}) {
  const [noObligatorio, setNoObligatorio] = useState(false)
  const [categoria, setCategoria] = useState<CategoriaRegistro>(
    categoriaInicial && categorias.includes(categoriaInicial) ? categoriaInicial : categorias[0],
  )
  const [unidadId, setUnidadId] = useState(
    unidadInicial && unidades?.some((u) => u.id === unidadInicial) ? unidadInicial : (unidades?.[0]?.id ?? ''),
  )
  const [condicion, setCondicion] = useState<CondicionRegistro>(condicionesPosibles(categoria)[0])
  const [pedirFotos, setPedirFotos] = useState(false)
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [documento, setDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [desde, setDesde] = useState(hoyISO())
  const [hasta, setHasta] = useState(sumarDias(hoyISO(), 30))
  const [placa, setPlaca] = useState('')
  const [error, setError] = useState<string | null>(null)

  const posibles = condicionesPosibles(categoria)
  const clase = { categoria, condicion, pedirFotos }
  const conVigencia = exigeVigencia(clase)
  /* Lo que se le promete a quien registra cambia con la clase, porque el
     tramite cambia con ella (RN-57): anunciarle fotos a quien registra una
     visita de una tarde seria prometerle un paso que no va a existir. */
  const conSoportes = exigeSoportes(clase)
  const unDia = soloUnDia(clase)
  const necesitaAlPropietario = requiereAprobacionPropietario(registraArrendatario ? 'arrendatario' : undefined, {
    ...clase,
    vigenciaDesde: desde,
    vigenciaHasta: hasta,
  })

  /** Al cambiar quién es, la condición vuelve a una que le aplique (RN-68). */
  function escogerCategoria(opcion: CategoriaRegistro) {
    setCategoria(opcion)
    if (!condicionesPosibles(opcion).includes(condicion)) setCondicion(condicionesPosibles(opcion)[0])
  }

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
      condicion,
      pedirFotos: unDia ? pedirFotos : undefined,
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
      ...(permitirNoObligatorio && conSoportes ? { soportesNoObligatorios: noObligatorio } : {}),
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
          <label>{categorias.length > 1 ? '¿Quién es esta persona?' : 'Quién es'}</label>
          <div className="pila" style={{ gap: 'var(--e2)' }}>
            {categorias.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="opcion-categoria"
                aria-pressed={categoria === opcion}
                onClick={() => escogerCategoria(opcion)}
              >
                <span className="columna">
                  <strong>{CATEGORIAS[opcion].texto}</strong>
                  <span className="subtitulo">{CATEGORIAS[opcion].ayuda}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* RN-68 — Cómo se queda: se escoge siempre (Mary, 2026-10-02). Solo
            se ofrece lo que le aplica a quien es: el arrendatario no es «no
            residente» y el visitante no es residente. */}
        <div className="campo">
          <label>¿Cómo se queda?</label>
          <div className="segmentos">
            {posibles.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="segmento"
                aria-current={condicion === opcion ? 'page' : undefined}
                onClick={() => setCondicion(opcion)}
              >
                {textoCondicion(categoria, opcion)}
              </button>
            ))}
          </div>
          <span className="ayuda-campo">
            {condicion === 'temporal'
              ? 'Vive aquí un tiempo, con fecha de salida. Lleva la marca de residente mientras esté.'
              : condicion === 'residente'
                ? 'Vive aquí. Lleva la marca de residente: la portería lo reconoce en la entrada.'
                : categoria === 'visitante'
                  ? 'Viene un solo día y entra con un código para la portería.'
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

        {/* RN-57 — La visita de un día no lleva fotos, salvo que quien la
            registra las pida (Mary, 2026-10-02). */}
        {unDia && (
          <div className="campo">
            <label className="fila" style={{ gap: 'var(--e2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={pedirFotos} onChange={(e) => setPedirFotos(e.target.checked)} />
              <span>Pedirle las fotos del documento y de su cara</span>
            </label>
            <span className="ayuda-campo">
              {pedirFotos
                ? 'La persona las sube desde su teléfono y tú autorizas; ahí recibe su código.'
                : 'Sin fotos, sale con su código para la portería de una vez.'}
            </span>
          </div>
        )}

        {necesitaAlPropietario && (
          <p className="ayuda-campo" style={{ color: "var(--color-alerta)" }}>
            Son más de {DIAS_SIN_APROBACION_DEL_PROPIETARIO} días: el propietario tiene que aprobar la
            estadía antes de que la autorices (RN-60). Le llega un aviso.
          </p>
        )}

        {categoria === 'visitante' && (
          <div className="campo">
            <label htmlFor="placa">Placa del vehículo (opcional)</label>
            <input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} />
          </div>
        )}

        {error && <p className="acceso__error">{error}</p>}

        {/* RN-97 — La marca «No obligatorio», solo en la consola del
            administrador. Se dice lo que implica: la persona no adjunta nada y
            entra con el código que Idiky le asigna; el registro sigue teniendo
            que autorizarse. Va junto al botón porque es lo último que se decide. */}
        {permitirNoObligatorio && conSoportes && (
          <div className="campo">
            <label className="fila" style={{ gap: 'var(--e2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={noObligatorio}
                onChange={(evento) => setNoObligatorio(evento.target.checked)}
              />
              <span>
                <strong>No obligatorio</strong>: no le pidas la foto ni el documento
              </span>
            </label>
            <span className="ayuda-campo">
              El registro pasa directo a autorizar y la persona entra como todos, con un código a su
              celular o correo. Queda escrito que lo eximió la administración (RN-97).
            </span>
          </div>
        )}

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
  alMarcarNoObligatorio,
  alDecidirEstadia,
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
  /** Solo la consola del administrador: poner o quitar la marca (RN-97). */
  alMarcarNoObligatorio?: (marcar: boolean) => Promise<void>
  /** Solo el propietario, cuando la estadía larga del arrendatario lo espera (RN-60). */
  alDecidirEstadia?: (aprobar: boolean, motivo: string) => Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const marcado = sinSoportesPorMarca(registro)

  return (
    <Modal
      titulo={`${registro.nombres} ${registro.apellidos}`}
      descripcion={textoClase(registro)}
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
        {registro.aprobacionPropietario && (
          <div className="fila">
            <span className="subtitulo">Estadía de más de una semana</span>
            {registro.aprobacionPropietario.aprobadoPor ? (
              <span className="chip chip--exito">Aprobada por el propietario</span>
            ) : esperaAlPropietario(registro) ? (
              <span className="chip chip--alerta">Espera al propietario</span>
            ) : (
              <span className="chip">Sin aprobar</span>
            )}
          </div>
        )}
        {marcado && (
          <div className="fila">
            <span className="subtitulo">Soportes</span>
            <span className="chip">No obligatorio</span>
          </div>
        )}
      </div>

      {/* RN-97 — La marca, a la vista de todos y editable solo por el
          administrador. Quien autoriza tiene que saber que va a autorizar sin
          fotos y quién decidió eso. */}
      {(marcado || (alMarcarNoObligatorio && admiteMarcaNoObligatorio(registro))) && (
        <>
          <div className="separador" />
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <strong>Soportes no obligatorios</strong>
            <span className="subtitulo">
              {marcado
                ? `La administración eximió a esta persona de adjuntar la foto y el documento el ${formatearFechaHora(registro.soportesNoObligatorios!.marcadoEn)}. Se autoriza sin soportes y entra como todos, con un código a su celular o correo.`
                : 'Si esta persona no quiere adjuntar la foto ni el documento, márcala: el registro pasa directo a autorizar y la persona entra como todos, con un código a su celular o correo.'}
            </span>
            {alMarcarNoObligatorio && admiteMarcaNoObligatorio(registro) && (
              <button
                className="boton"
                onClick={() => void alMarcarNoObligatorio(!marcado)}
              >
                {marcado ? 'Quitar la marca «No obligatorio»' : 'Marcar como «No obligatorio»'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Con la marca no hay soportes que adjuntar, así que el código de
          registro no hace falta para nada: la persona entra a Idiky como todos,
          con un código a su celular o correo (CU-R-01, RN-97). Se le dice a
          quien la registró, que es quien se lo iba a dictar. */}
      {marcado && registro.estado !== 'rechazado' && registro.estado !== 'anulado' && (
        <>
          <div className="separador" />
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <strong>No necesita ningún código</strong>
            <span className="subtitulo">
              Entra a Idiky con su documento, celular o correo, y el código que le llega por SMS o
              correo{registro.estado === 'autorizado' ? '.' : ', en cuanto el registro quede autorizado.'}{' '}
              {!registro.telefono && !registro.email
                ? 'Ojo: este registro no tiene celular ni correo, y sin eso no puede entrar.'
                : ''}
            </span>
          </div>
        </>
      )}

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

      {alDecidirEstadia && esperaAlPropietario(registro) && !rechazando && (
        <>
          <div className="separador" />
          <p className="subtitulo">
            Tu arrendatario registró esta estadía de más de una semana. Si la apruebas, él la autoriza.
          </p>
          <button className="boton boton--primario boton--bloque" onClick={() => void alDecidirEstadia(true, '')}>
            <Icono nombre="check" tamano={18} />
            Aprobar la estadía
          </button>
          <div className="campo" style={{ marginTop: 'var(--e3)' }}>
            <label htmlFor="motivo-estadia">Si no la apruebas, ¿por qué?</label>
            <textarea id="motivo-estadia" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <button
            className="boton boton--bloque"
            disabled={motivo.trim().length < 5}
            onClick={() => void alDecidirEstadia(false, motivo)}
          >
            No aprobar
          </button>
        </>
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
