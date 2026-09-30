/**
 * CU-A-10 — Configurar zonas comunes y sus reglas.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-10
 *
 * Todo lo de una zona en un solo lugar, dentro de Reservas (Mary, 2026-10-01:
 * «lo de reservas va dentro de reservas»): crearla, cambiarle las reglas,
 * cerrarla por mantenimiento, desactivarla, y sus fotos y especificaciones.
 *
 * Reglas: RN-104 (fotos y especificaciones), RN-105 (una zona valida),
 * RN-106 (cambiar las reglas no toca lo ya reservado), RN-107 (desactivar
 * cancela con mensaje), RN-108 (cierre por mantenimiento), RN-109 (cobro por
 * uso y deposito, con respaldo), RN-110 (multa por no cancelar, del catalogo) y
 * RN-111 (uso exclusivo o compartido hasta el aforo), RN-114 (dias y horario
 * de cada dia, que define el administrador) y RN-117 (el cierre, avisado a toda
 * la copropiedad con una sola accion).
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  agregarFotoZona,
  cerrarZonaPorMantenimiento,
  crearZona,
  desactivarZona,
  editarEspecificacionesZona,
  editarZona,
  levantarCierreZona,
  quitarFotoZona,
  reactivarZona,
  type ResumenCancelacion,
} from '../../datos/repositorio'
import {
  cierreEnFecha,
  cierresPendientes,
  DURACIONES_TURNO,
  etiquetaUnidad,
  fechaCorta,
  franjasDeZona,
  hoyISO,
  MAXIMO_DESCRIPCION_ZONA,
  MAXIMO_ESPECIFICACIONES,
  MAXIMO_FOTOS_ZONA,
  MINIMO_MOTIVO_DESACTIVACION,
  ORIGENES_RESPALDO,
  motivoCierreInvalido,
  motivoDeCierre,
  motivoZonaInvalida,
  puedeAgregarFotoZona,
  puntosDeEspecificaciones,
  reservasQueCancelaCierre,
  reservasQueCancelaDesactivar,
  sumarDias,
  textoRespaldo,
  textoHorarioSemanal,
  ORDEN_SEMANA,
  NOMBRES_DIA,
  tieneCobroZona,
  textoReservaCancelada,
  textoCierreZona,
  residenciaVigente,
  zonaActiva,
  type DatosZona,
} from '../../dominio/reglas'
import type { ConceptoSancion, OrigenRespaldo, Reserva, ZonaComun } from '../../dominio/tipos'
import { CondicionesZona } from '../../componentes/CondicionesZona'
import { formatearDinero } from '../../utilidades/formato'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { FotosZona } from '../../componentes/FotosZona'
import { Modal } from '../../componentes/Modal'
import { EstadoVacio } from '../../componentes/EstadoVacio'

/** Lo que el administrador tiene abierto: una sola hoja a la vez. */
type Hoja =
  | { tipo: 'nueva' }
  | { tipo: 'editar'; zona: ZonaComun }
  | { tipo: 'cierre'; zona: ZonaComun }
  | { tipo: 'desactivar'; zona: ZonaComun }

const ZONA_EN_BLANCO: DatosZona = {
  nombre: '',
  descripcion: '',
  aforo: 10,
  requiereAprobacion: false,
  horaInicio: '08:00',
  horaFin: '20:00',
  duracionBloqueHoras: 2,
  anticipacionMinimaHoras: 24,
  cupoMensualPorUnidad: 4,
  modoUso: 'exclusivo',
}

/** Los selectores de hora del horario semanal: fuera de `.campo`, con su mismo aspecto. */
const ESTILO_HORA = {
  padding: '.4rem .5rem',
  border: '1px solid var(--color-borde-fuerte)',
  borderRadius: 'var(--radio-sm)',
  background: 'var(--color-superficie)',
}

const HORAS = Array.from({ length: 25 }, (_, h) => `${String(h).padStart(2, '0')}:00`)

function datosDe(zona: ZonaComun): DatosZona {
  return {
    nombre: zona.nombre,
    descripcion: zona.descripcion,
    aforo: zona.aforo,
    requiereAprobacion: zona.requiereAprobacion,
    horaInicio: zona.horaInicio,
    horaFin: zona.horaFin,
    duracionBloqueHoras: zona.duracionBloqueHoras,
    anticipacionMinimaHoras: zona.anticipacionMinimaHoras,
    cupoMensualPorUnidad: zona.cupoMensualPorUnidad,
    valorUso: zona.valorUso,
    deposito: zona.deposito,
    respaldoCobro: zona.respaldoCobro,
    multaNoCancelar: zona.multaNoCancelar,
    modoUso: zona.modoUso ?? 'exclusivo',
    horarioSemanal: zona.horarioSemanal,
  }
}

/** Una línea con las reglas, como la lee quien administra. */
function resumenReglas(zona: ZonaComun): string {
  return [
    textoHorarioSemanal(zona),
    `turnos de ${zona.duracionBloqueHoras} h`,
    zona.modoUso === 'compartido' ? `compartida hasta ${zona.aforo} personas` : `exclusiva · aforo ${zona.aforo}`,
    `${zona.anticipacionMinimaHoras} h de anticipación`,
    `${zona.cupoMensualPorUnidad} al mes por unidad`,
    zona.requiereAprobacion ? 'requiere aprobación' : 'confirmación inmediata',
  ].join(' · ')
}

/** Lo que cuenta la consola después de cancelar con aviso. */
function textoResumen(accion: string, resumen: ResumenCancelacion): string {
  if (resumen.canceladas === 0) return `${accion} No había reservas que cancelar.`
  const sinCelular =
    resumen.sinCelular > 0 ? ` ${resumen.sinCelular} sin celular: lo ven solo en la app.` : ''
  return `${accion} Se cancelaron ${resumen.canceladas} reservas y se les avisó a ${resumen.avisados}.${sinCelular}`
}

export function ZonasAdminPage() {
  const { bd, cargando, ejecutar, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [hoja, setHoja] = useState<Hoja | null>(null)

  if (!sesion) return null

  const zonas = sel.zonasDe(bd, sesion.copropiedadId)
  const conceptos = sel.conceptosSancionDe(bd, sesion.copropiedadId)
  // RN-117 — A cuántas personas les llegaría el aviso masivo.
  const unidades = new Set(bd.unidades.filter((u) => u.copropiedadId === sesion.copropiedadId).map((u) => u.id))
  const residentes = new Set(
    bd.residencias.filter((r) => unidades.has(r.unidadId) && residenciaVigente(r)).map((r) => r.personaId),
  ).size
  const activas = zonas.filter(zonaActiva)
  const desactivadas = zonas.filter((z) => !zonaActiva(z))

  return (
    <>
      <div className="fila" style={{ marginBottom: 'var(--e3)' }}>
        <span className="subtitulo">
          {activas.length} {activas.length === 1 ? 'zona activa' : 'zonas activas'}
          {desactivadas.length > 0 ? ` · ${desactivadas.length} desactivada${desactivadas.length === 1 ? '' : 's'}` : ''}
        </span>
        <button className="boton boton--primario" onClick={() => setHoja({ tipo: 'nueva' })}>
          Nueva zona
        </button>
      </div>

      {zonas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay zonas comunes"
          detalle="Crea la primera: el salón, la terraza, el gimnasio."
        />
      ) : (
        <div className="lista">
          {[...activas, ...desactivadas].map((zona) => (
            <TarjetaZona
              key={zona.id}
              zona={zona}
              conceptos={conceptos}
              cargando={cargando}
              alAbrir={setHoja}
              alLevantar={(cierreId) =>
                void ejecutar(
                  (base) => levantarCierreZona(base, { zonaId: zona.id, cierreId }),
                  'Cierre levantado. La zona se puede reservar otra vez.',
                )
              }
              alReactivar={() =>
                void ejecutar(
                  (base) => reactivarZona(base, zona.id),
                  `${zona.nombre} vuelve a recibir reservas.`,
                )
              }
            />
          ))}
        </div>
      )}

      {(hoja?.tipo === 'nueva' || hoja?.tipo === 'editar') && (
        <FormularioZona
          zona={hoja.tipo === 'editar' ? hoja.zona : undefined}
          zonas={zonas}
          conceptos={conceptos}
          cargando={cargando}
          alCerrar={() => setHoja(null)}
          alGuardar={async (datos) => {
            const hecho =
              hoja.tipo === 'editar'
                ? await ejecutar(
                    (base) => editarZona(base, { zonaId: hoja.zona.id, datos }),
                    'Reglas guardadas. Valen para las reservas nuevas.',
                  )
                : await ejecutar(
                    (base) => crearZona(base, { copropiedadId: sesion.copropiedadId, datos }),
                    'Zona creada. Ya se puede reservar; agrégale fotos y especificaciones.',
                  )
            if (hecho) setHoja(null)
          }}
        />
      )}

      {hoja?.tipo === 'cierre' && (
        <HojaCierre
          zona={hoja.zona}
          reservas={bd.reservas}
          residentes={residentes}
          copropiedad={sel.copropiedad(bd, sesion.copropiedadId)?.nombre ?? 'La copropiedad'}
          cargando={cargando}
          alCerrar={() => setHoja(null)}
          alConfirmar={async (cierre) => {
            const resumen = await ejecutar((base) =>
              cerrarZonaPorMantenimiento(base, { zonaId: hoja.zona.id, ...cierre }),
            )
            if (resumen) {
              const masivo = resumen.masivo
                ? ` Aviso a toda la copropiedad: comunicado en la cartelera y ${resumen.masivo.avisados} mensajes.`
                : ''
              mostrarAviso(textoResumen('Cierre registrado.', resumen) + masivo, 'exito')
              setHoja(null)
            }
          }}
        />
      )}

      {hoja?.tipo === 'desactivar' && (
        <HojaDesactivar
          zona={hoja.zona}
          reservas={bd.reservas}
          copropiedad={sel.copropiedad(bd, sesion.copropiedadId)?.nombre ?? 'La copropiedad'}
          cargando={cargando}
          alCerrar={() => setHoja(null)}
          alConfirmar={async (motivo) => {
            const resumen = await ejecutar((base) =>
              desactivarZona(base, { zonaId: hoja.zona.id, motivo }),
            )
            if (resumen) {
              mostrarAviso(textoResumen(`${hoja.zona.nombre} quedó desactivada.`, resumen), 'exito')
              setHoja(null)
            }
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// La tarjeta de una zona: estado, reglas, acciones, fotos y especificaciones
// ---------------------------------------------------------------------------

function TarjetaZona({
  zona,
  conceptos,
  cargando,
  alAbrir,
  alLevantar,
  alReactivar,
}: {
  zona: ZonaComun
  conceptos: ConceptoSancion[]
  cargando: boolean
  alAbrir: (hoja: Hoja) => void
  alLevantar: (cierreId: string) => void
  alReactivar: () => void
}) {
  const { ejecutar } = useDatos()
  const [fotoPara, setFotoPara] = useState(false)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')

  const activa = zonaActiva(zona)
  const hoy = hoyISO()
  const cerradaHoy = activa ? cierreEnFecha(zona, hoy) : undefined
  const pendientes = activa ? cierresPendientes(zona, hoy) : []

  return (
    <div className="tarjeta" style={activa ? undefined : { opacity: 0.85 }}>
      <div className="fila fila-inicio" style={{ marginBottom: 'var(--e2)' }}>
        <div className="columna" style={{ flex: 1, gap: 'var(--e1)' }}>
          <div className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', flexWrap: 'wrap' }}>
            <strong>{zona.nombre}</strong>
            {!activa ? (
              <span className="chip">Desactivada</span>
            ) : cerradaHoy ? (
              <span className="chip chip--alerta" style={{ whiteSpace: 'normal', borderRadius: 'var(--radio-sm)' }}>En mantenimiento hasta el {fechaCorta(cerradaHoy.hasta)}</span>
            ) : (
              <span className="chip chip--exito">Activa</span>
            )}
          </div>
          {zona.descripcion && <span className="subtitulo">{zona.descripcion}</span>}
          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            {resumenReglas(zona)}
          </span>
        </div>
      </div>

      {!activa && (
        <p className="subtitulo" style={{ marginBottom: 'var(--e2)' }}>
          Desactivada el {zona.desactivadaEn ? fechaCorta(zona.desactivadaEn) : '—'}. Motivo:{' '}
          {zona.motivoDesactivacion}
        </p>
      )}

      {/* RN-108 — Los cierres que todavía no terminan, cada uno con su «Levantar». */}
      {pendientes.length > 0 && (
        <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e2)' }}>
          {pendientes.map((cierre) => (
            <div key={cierre.id} className="fila fila-inicio">
              <span className="subtitulo" style={{ flex: 1 }}>
                Cerrada {cierre.desde === cierre.hasta ? `el ${fechaCorta(cierre.desde)}` : `del ${fechaCorta(cierre.desde)} al ${fechaCorta(cierre.hasta)}`}: {cierre.motivo}
              </span>
              <button className="boton boton--pequeno" disabled={cargando} onClick={() => alLevantar(cierre.id)}>
                Levantar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grupo-botones" style={{ marginBottom: 'var(--e3)' }}>
        {activa ? (
          <>
            <button className="boton boton--pequeno" disabled={cargando} onClick={() => alAbrir({ tipo: 'editar', zona })}>
              Editar reglas
            </button>
            <button className="boton boton--pequeno" disabled={cargando} onClick={() => alAbrir({ tipo: 'cierre', zona })}>
              Cerrar por mantenimiento
            </button>
            <button
              className="boton boton--pequeno boton--peligro"
              disabled={cargando}
              onClick={() => alAbrir({ tipo: 'desactivar', zona })}
            >
              Desactivar
            </button>
          </>
        ) : (
          <button className="boton boton--pequeno" disabled={cargando} onClick={alReactivar}>
            Reactivar
          </button>
        )}
      </div>

      {/* RN-109, RN-110 — Lo que cuesta y la multa: lo mismo que lee el residente. */}
      <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e3)' }}>
        <span className="titulo-seccion">Costos y multa</span>
        <CondicionesZona zona={zona} conceptos={conceptos} />
      </div>

      {/* RN-104 — Fotos: el residente las ve antes de reservar. */}
      <div className="columna" style={{ gap: 'var(--e2)' }}>
        <div className="fila">
          <span className="titulo-seccion">Fotos</span>
          <button
            className="boton boton--pequeno"
            disabled={cargando || !puedeAgregarFotoZona(zona)}
            onClick={() => setFotoPara(!fotoPara)}
          >
            {puedeAgregarFotoZona(zona) ? 'Agregar foto' : `Ya tiene ${MAXIMO_FOTOS_ZONA}`}
          </button>
        </div>
        <FotosZona
          fotos={zona.fotos}
          nombre={zona.nombre}
          vacio="Sin fotos todavía: el residente reserva a ciegas."
          alQuitar={(foto) =>
            void ejecutar(
              (base) => quitarFotoZona(base, { zonaId: zona.id, adjuntadoEn: foto.adjuntadoEn }),
              'Foto quitada.',
            )
          }
        />
        {fotoPara && (
          <CapturaFoto
            etiqueta={`Nueva foto de ${zona.nombre}`}
            ayuda="Como la ve quien entra: el salón montado, la terraza de día. Se guarda reducida."
            valor={null}
            alCambiar={(imagen) => {
              if (!imagen) return
              void ejecutar(
                (base) => agregarFotoZona(base, { zonaId: zona.id, imagen }),
                'Foto agregada. El residente ya la ve al reservar.',
              ).then((hecho) => {
                if (hecho) setFotoPara(false)
              })
            }}
          />
        )}

        {/* RN-104 — Especificaciones: qué incluye, qué no, cómo se usa. */}
        <span className="titulo-seccion">Especificaciones</span>
        {editando ? (
          <div className="campo">
            <label htmlFor={`especificaciones-${zona.id}`}>Especificaciones generales</label>
            <textarea
              id={`especificaciones-${zona.id}`}
              value={texto}
              maxLength={MAXIMO_ESPECIFICACIONES}
              onChange={(evento) => setTexto(evento.target.value)}
              placeholder={'Un punto por renglón. Por ejemplo:\nIncluye 8 mesas y 40 sillas\nCocineta con nevera y microondas\nSe entrega limpio y se devuelve limpio'}
              style={{ minHeight: 120 }}
            />
            <span className="ayuda-campo">
              {texto.length} de {MAXIMO_ESPECIFICACIONES} caracteres. Lo que el residente alcanza a leer antes de reservar.
            </span>
            <div className="grupo-botones">
              <button
                className="boton boton--primario boton--pequeno"
                disabled={cargando}
                onClick={() =>
                  void ejecutar(
                    (base) => editarEspecificacionesZona(base, { zonaId: zona.id, especificaciones: texto }),
                    'Especificaciones guardadas. El residente ya las ve al reservar.',
                  ).then((hecho) => {
                    if (hecho) setEditando(false)
                  })
                }
              >
                Guardar
              </button>
              <button className="boton boton--pequeno" disabled={cargando} onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="fila fila-inicio">
            {puntosDeEspecificaciones(zona).length > 0 ? (
              <ul className="especificaciones" style={{ flex: 1 }}>
                {puntosDeEspecificaciones(zona).map((punto, i) => (
                  <li key={i}>{punto}</li>
                ))}
              </ul>
            ) : (
              <span className="subtitulo" style={{ flex: 1 }}>
                Sin especificaciones: el residente no sabe qué incluye.
              </span>
            )}
            <button
              className="boton boton--pequeno"
              disabled={cargando}
              onClick={() => {
                setEditando(true)
                setTexto(zona.especificaciones ?? '')
              }}
            >
              {zona.especificaciones ? 'Editar' : 'Escribir'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Crear o editar: las reglas de la zona (RN-105, RN-106)
// ---------------------------------------------------------------------------

function FormularioZona({
  zona,
  zonas,
  conceptos,
  cargando,
  alCerrar,
  alGuardar,
}: {
  zona?: ZonaComun
  zonas: ZonaComun[]
  conceptos: ConceptoSancion[]
  cargando: boolean
  alCerrar: () => void
  alGuardar: (datos: DatosZona) => Promise<void>
}) {
  const [datos, setDatos] = useState<DatosZona>(zona ? datosDe(zona) : ZONA_EN_BLANCO)
  const [intento, setIntento] = useState(false)

  function cambiar<K extends keyof DatosZona>(campo: K, valor: DatosZona[K]) {
    setDatos((actual) => ({ ...actual, [campo]: valor }))
  }

  const porDia = !!datos.horarioSemanal

  /** RN-114 — Abre o cierra un día, o le cambia el horario. */
  function cambiarDia(dia: number, horario: { horaInicio: string; horaFin: string } | null) {
    const otros = (datos.horarioSemanal ?? []).filter((h) => h.dia !== dia)
    cambiar('horarioSemanal', horario ? [...otros, { dia, ...horario }].sort((a, b) => ORDEN_SEMANA.indexOf(a.dia) - ORDEN_SEMANA.indexOf(b.dia)) : otros)
  }

  /** RN-109 — Si aplican o no: lo escoge el administrador, zona por zona. */
  const [cobraUso, setCobraUso] = useState(!!zona?.valorUso)
  const [pideDeposito, setPideDeposito] = useState(!!zona?.deposito)
  const motivo =
    cobraUso && !((datos.valorUso ?? 0) > 0)
      ? 'Escribe el valor por reserva, o desmarca «Se cobra por usarla».'
      : pideDeposito && !((datos.deposito ?? 0) > 0)
        ? 'Escribe el valor del depósito, o desmarca «Pide depósito de garantía».'
        : motivoZonaInvalida(datos, zonas, zona?.id, conceptos)
  const multasActivas = conceptos.filter((c) => c.activo)
  const respaldo = datos.respaldoCobro ?? { origen: 'reglamento' as OrigenRespaldo, referencia: '' }
  const origenElegido = ORIGENES_RESPALDO.find((o) => o.id === respaldo.origen)
  // La vista previa de los turnos solo cuando el horario tiene sentido.
  const primerDia = datos.horarioSemanal?.[0]
  const turnos =
    motivo && /horario|turno|pedazo|día/i.test(motivo)
      ? []
      : franjasDeZona({ ...datos, ...(primerDia ?? {}), horarioSemanal: undefined })

  return (
    <Modal
      titulo={zona ? `Reglas de ${zona.nombre}` : 'Nueva zona común'}
      descripcion={
        zona
          ? 'Los cambios valen para las reservas nuevas; las ya hechas se respetan.'
          : 'Nace activa: los residentes la pueden reservar de una vez.'
      }
      onCerrar={alCerrar}
    >
      <div className="campo">
        <label htmlFor="zona-nombre">Nombre</label>
        <input
          id="zona-nombre"
          value={datos.nombre}
          onChange={(e) => cambiar('nombre', e.target.value)}
          placeholder="Ej: Piscina"
        />
      </div>
      <div className="campo">
        <label htmlFor="zona-descripcion">Descripción corta</label>
        <input
          id="zona-descripcion"
          value={datos.descripcion}
          maxLength={MAXIMO_DESCRIPCION_ZONA}
          onChange={(e) => cambiar('descripcion', e.target.value)}
          placeholder="Ej: Piscina climatizada con zona infantil."
        />
        <span className="ayuda-campo">Una línea. El detalle va en las especificaciones.</span>
      </div>

      {/* RN-114 — Los días y el horario los define el administrador. */}
      <div className="campo">
        <label htmlFor="zona-dias">Días y horario</label>
        <select
          id="zona-dias"
          value={porDia ? 'por-dia' : 'todos'}
          onChange={(e) =>
            cambiar(
              'horarioSemanal',
              e.target.value === 'por-dia'
                ? ORDEN_SEMANA.map((dia) => ({ dia, horaInicio: datos.horaInicio, horaFin: datos.horaFin }))
                : undefined,
            )
          }
        >
          <option value="todos">Todos los días, con el mismo horario</option>
          <option value="por-dia">Escoger los días y el horario de cada uno</option>
        </select>
      </div>

      {porDia && (
        <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
          {ORDEN_SEMANA.map((dia) => {
            const horario = datos.horarioSemanal!.find((h) => h.dia === dia)
            const nombre = NOMBRES_DIA[dia][0].toUpperCase() + NOMBRES_DIA[dia].slice(1)
            return (
              <div key={dia} className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', flexWrap: 'wrap' }}>
                <label className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', minWidth: 120 }}>
                  <input
                    type="checkbox"
                    aria-label={`Abre los ${NOMBRES_DIA[dia]}`}
                    checked={!!horario}
                    onChange={(e) => cambiarDia(dia, e.target.checked ? { horaInicio: datos.horaInicio, horaFin: datos.horaFin } : null)}
                  />
                  <span>{nombre}</span>
                </label>
                {horario ? (
                  <>
                    <select
                      aria-label={`Abre los ${NOMBRES_DIA[dia]} a las`}
                      style={ESTILO_HORA}
                      value={horario.horaInicio}
                      onChange={(e) => cambiarDia(dia, { ...horario, horaInicio: e.target.value })}
                    >
                      {HORAS.slice(0, 24).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <span className="subtitulo">a</span>
                    <select
                      aria-label={`Cierra los ${NOMBRES_DIA[dia]} a las`}
                      style={ESTILO_HORA}
                      value={horario.horaFin}
                      onChange={(e) => cambiarDia(dia, { ...horario, horaFin: e.target.value })}
                    >
                      {HORAS.slice(1).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </>
                ) : (
                  <span className="tenue">No abre</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="rejilla-dos">
        {!porDia && (
          <>
            <div className="campo">
              <label htmlFor="zona-desde">Abre a las</label>
              <select id="zona-desde" value={datos.horaInicio} onChange={(e) => cambiar('horaInicio', e.target.value)}>
                {HORAS.slice(0, 24).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="zona-hasta">Cierra a las</label>
              <select id="zona-hasta" value={datos.horaFin} onChange={(e) => cambiar('horaFin', e.target.value)}>
                {HORAS.slice(1).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="campo">
          <label htmlFor="zona-turno">Cada turno dura</label>
          <select
            id="zona-turno"
            value={datos.duracionBloqueHoras}
            onChange={(e) => cambiar('duracionBloqueHoras', Number(e.target.value))}
          >
            {DURACIONES_TURNO.map((h) => (
              <option key={h} value={h}>{h === 1 ? '1 hora' : `${h} horas`}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="zona-aforo">Aforo (personas)</label>
          <input
            id="zona-aforo"
            type="number"
            min={1}
            inputMode="numeric"
            value={datos.aforo}
            onChange={(e) => cambiar('aforo', Number(e.target.value))}
          />
        </div>
        <div className="campo">
          <label htmlFor="zona-anticipacion">Reservar con (horas antes)</label>
          <input
            id="zona-anticipacion"
            type="number"
            min={0}
            inputMode="numeric"
            value={datos.anticipacionMinimaHoras}
            onChange={(e) => cambiar('anticipacionMinimaHoras', Number(e.target.value))}
          />
        </div>
        <div className="campo">
          <label htmlFor="zona-cupo">Reservas al mes por unidad</label>
          <input
            id="zona-cupo"
            type="number"
            min={1}
            inputMode="numeric"
            value={datos.cupoMensualPorUnidad}
            onChange={(e) => cambiar('cupoMensualPorUnidad', Number(e.target.value))}
          />
        </div>
      </div>

      {/* RN-111 — Exclusiva: el turno es de una unidad. Compartida: varias hasta el aforo. */}
      <div className="campo">
        <label htmlFor="zona-modo">Cómo se usa cada turno</label>
        <select
          id="zona-modo"
          value={datos.modoUso ?? 'exclusivo'}
          onChange={(e) => cambiar('modoUso', e.target.value as DatosZona['modoUso'])}
        >
          <option value="exclusivo">Exclusiva: el turno es de una sola unidad (salón, BBQ)</option>
          <option value="compartido">Compartida: varias unidades, hasta llenar el aforo (gimnasio)</option>
        </select>
        <span className="ayuda-campo">
          {datos.modoUso === 'compartido'
            ? `Cada residente dice cuántas personas van; el turno se llena con ${datos.aforo || 0} personas.`
            : 'Quien reserva se queda con la zona todo el turno.'}
        </span>
      </div>

      <label className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
        <input
          type="checkbox"
          checked={datos.requiereAprobacion}
          onChange={(e) => cambiar('requiereAprobacion', e.target.checked)}
        />
        <span>La administración aprueba cada reserva</span>
      </label>


      {/* RN-109 — Cobro por uso y depósito: el administrador escoge si aplican. */}
      <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
        <span className="titulo-seccion">Costos</span>
        <label className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)' }}>
          <input
            type="checkbox"
            checked={cobraUso}
            onChange={(e) => {
              setCobraUso(e.target.checked)
              if (!e.target.checked) cambiar('valorUso', undefined)
            }}
          />
          <span>Se cobra por usarla</span>
        </label>
        {cobraUso && (
          <div className="campo">
            <label htmlFor="zona-valor-uso">Valor por reserva ($)</label>
            <input
              id="zona-valor-uso"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              value={datos.valorUso ?? ''}
              onChange={(e) => cambiar('valorUso', Number(e.target.value))}
            />
          </div>
        )}
        <label className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)' }}>
          <input
            type="checkbox"
            checked={pideDeposito}
            onChange={(e) => {
              setPideDeposito(e.target.checked)
              if (!e.target.checked) cambiar('deposito', undefined)
            }}
          />
          <span>Pide depósito de garantía</span>
        </label>
        {pideDeposito && (
          <div className="campo">
            <label htmlFor="zona-deposito">Depósito de garantía ($)</label>
            <input
              id="zona-deposito"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              value={datos.deposito ?? ''}
              onChange={(e) => cambiar('deposito', Number(e.target.value))}
            />
            <span className="ayuda-campo">Se devuelve si la zona queda como se entregó.</span>
          </div>
        )}
      </div>
      {tieneCobroZona(datos) && (
        <div className="rejilla-dos">
          <div className="campo">
            <label htmlFor="zona-respaldo-origen">Lo autoriza</label>
            <select
              id="zona-respaldo-origen"
              value={respaldo.origen}
              onChange={(e) => cambiar('respaldoCobro', { ...respaldo, origen: e.target.value as OrigenRespaldo })}
            >
              {ORIGENES_RESPALDO.map((o) => (
                <option key={o.id} value={o.id}>{o.texto}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="zona-respaldo-referencia">{origenElegido?.etiqueta ?? 'Referencia'}</label>
            <input
              id="zona-respaldo-referencia"
              value={respaldo.referencia}
              placeholder={`Ej: ${origenElegido?.ejemplo ?? 'Artículo 42'}`}
              onChange={(e) => cambiar('respaldoCobro', { ...respaldo, referencia: e.target.value })}
            />
          </div>
          {respaldo.origen === 'otro' && (
            <div className="campo">
              <label htmlFor="zona-respaldo-documento">Qué documento</label>
              <input
                id="zona-respaldo-documento"
                value={respaldo.documento ?? ''}
                placeholder="Ej: Resolución del consejo N.º 12"
                onChange={(e) => cambiar('respaldoCobro', { ...respaldo, documento: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {/* RN-110 — La multa por no cancelar sale del catálogo de multas. */}
      <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
        <span className="titulo-seccion">Multa por no cancelar</span>
        <label className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)' }}>
          <input
            type="checkbox"
            checked={!!datos.multaNoCancelar}
            disabled={multasActivas.length === 0 && !datos.multaNoCancelar}
            onChange={(e) =>
              cambiar(
                'multaNoCancelar',
                e.target.checked
                  ? { conceptoId: multasActivas[0]?.id ?? '', horasParaCancelar: Math.max(24, datos.anticipacionMinimaHoras) }
                  : undefined,
              )
            }
          />
          <span>Aplica multa si no se cancela a tiempo</span>
        </label>
        {multasActivas.length === 0 && (
          <span className="ayuda-campo">
            No hay multas activas en el catálogo. Créala primero en{' '}
            <Link to="/admin/multas" className="enlace">Multas</Link>: ahí queda su valor y su respaldo.
          </span>
        )}
        {datos.multaNoCancelar && (
          <div className="rejilla-dos">
            <div className="campo">
              <label htmlFor="zona-multa">Multa del catálogo</label>
              <select
                id="zona-multa"
                value={datos.multaNoCancelar.conceptoId}
                onChange={(e) => cambiar('multaNoCancelar', { ...datos.multaNoCancelar!, conceptoId: e.target.value })}
              >
                {multasActivas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} · {formatearDinero(c.valor)}
                  </option>
                ))}
              </select>
              {(() => {
                const elegido = conceptos.find((c) => c.id === datos.multaNoCancelar?.conceptoId)
                return elegido ? <span className="ayuda-campo">{textoRespaldo(elegido)}</span> : null
              })()}
            </div>
            <div className="campo">
              <label htmlFor="zona-multa-horas">Cancelar sin multa hasta (horas antes)</label>
              <input
                id="zona-multa-horas"
                type="number"
                min={1}
                inputMode="numeric"
                value={datos.multaNoCancelar.horasParaCancelar}
                onChange={(e) =>
                  cambiar('multaNoCancelar', { ...datos.multaNoCancelar!, horasParaCancelar: Number(e.target.value) })
                }
              />
            </div>
          </div>
        )}
        {datos.multaNoCancelar && (
          <span className="ayuda-campo">
            No se cobra sola: se impone con el proceso sancionatorio, con descargos e impugnación.
          </span>
        )}
      </div>

      <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e3)' }}>
        <span className="titulo-seccion">
          Así verá los turnos el residente{primerDia ? ` (los ${NOMBRES_DIA[primerDia.dia]})` : ''}
        </span>
        {turnos.length > 0 ? (
          <div className="franjas">
            {turnos.map((t) => (
              <span key={t.inicio} className="franja">
                {t.inicio} - {t.fin}
              </span>
            ))}
          </div>
        ) : (
          <span className="subtitulo">Ajusta el horario y el turno para ver los turnos.</span>
        )}
      </div>

      {intento && motivo && (
        <p className="ayuda-campo" style={{ color: 'var(--color-error)', marginBottom: 'var(--e2)' }}>
          {motivo}
        </p>
      )}

      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando}
        onClick={() => {
          setIntento(true)
          if (!motivo) void alGuardar(datos)
        }}
      >
        {zona ? 'Guardar reglas' : 'Crear zona'}
      </button>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Las reservas que se cancelan y el mensaje que les llega (RN-107, RN-108)
// ---------------------------------------------------------------------------

function ReservasAfectadas({ reservas, texto, vacio }: { reservas: Reserva[]; texto: string | null; vacio: string }) {
  const { bd } = useDatos()
  if (reservas.length === 0) {
    return (
      <p className="subtitulo" style={{ marginBottom: 'var(--e3)' }}>
        {vacio}
      </p>
    )
  }
  return (
    <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
      <span className="titulo-seccion">
        Se cancelan {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'}
      </span>
      <ul className="especificaciones">
        {reservas.map((r) => {
          const unidad = sel.unidad(bd, r.unidadId)
          return (
            <li key={r.id}>
              {unidad && etiquetaUnidad(unidad)} · {nombreCompleto(sel.persona(bd, r.personaId))} —{' '}
              {fechaCorta(r.fecha)}, {r.horaInicio} a {r.horaFin}
            </li>
          )
        })}
      </ul>
      {texto && (
        <div className="tarjeta tarjeta--plana">
          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            El mensaje que le llega a cada uno (el demo lo deja escrito, no lo envía)
          </span>
          <p style={{ marginTop: 'var(--e1)' }}>{texto}</p>
        </div>
      )}
    </div>
  )
}

function HojaCierre({
  zona,
  reservas,
  residentes,
  copropiedad,
  cargando,
  alCerrar,
  alConfirmar,
}: {
  zona: ZonaComun
  reservas: Reserva[]
  residentes: number
  copropiedad: string
  cargando: boolean
  alCerrar: () => void
  alConfirmar: (cierre: { desde: string; hasta: string; motivo: string; avisarATodos: boolean }) => Promise<void>
}) {
  const hoy = hoyISO()
  /** RN-117 — Marcado de entrada: un cierre es justo lo que todos deben saber. */
  const [avisarATodos, setAvisarATodos] = useState(true)
  const [desde, setDesde] = useState(sumarDias(hoy, 1))
  const [hasta, setHasta] = useState(sumarDias(hoy, 3))
  const [motivo, setMotivo] = useState('')
  const [intento, setIntento] = useState(false)

  const cierre = { desde, hasta, motivo }
  const invalido = motivoCierreInvalido(zona, cierre, hoy)
  const fechasBien = desde && hasta && hasta >= desde
  const afectadas = fechasBien ? reservasQueCancelaCierre(zona.id, reservas, desde, hasta) : []
  const texto =
    afectadas.length > 0 && motivo.trim()
      ? textoReservaCancelada(afectadas[0], zona, motivoDeCierre(cierre), copropiedad)
      : null

  return (
    <Modal
      titulo={`Cerrar ${zona.nombre} por mantenimiento`}
      descripcion="Mientras dure nadie la reserva; al terminar vuelve sola."
      onCerrar={alCerrar}
    >
      <div className="rejilla-dos">
        <div className="campo">
          <label htmlFor="cierre-desde">Desde</label>
          <input id="cierre-desde" type="date" min={hoy} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="cierre-hasta">Hasta (incluido)</label>
          <input id="cierre-hasta" type="date" min={desde || hoy} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="cierre-motivo">Motivo</label>
        <textarea
          id="cierre-motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: cambio del piso y pintura del salón."
        />
        <span className="ayuda-campo">Lo lee quien tenía reserva y quien quiera reservar esos días.</span>
      </div>

      <ReservasAfectadas reservas={afectadas} texto={texto} vacio="No hay reservas en esas fechas: nadie pierde su reserva." />

      {/* RN-117 — Una sola acción avisa a toda la copropiedad, sea de 20 o de 500 unidades. */}
      <label className="fila fila-inicio" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', marginBottom: 'var(--e2)' }}>
        <input type="checkbox" checked={avisarATodos} onChange={(e) => setAvisarATodos(e.target.checked)} />
        <span>
          <strong>Avisar a toda la copropiedad</strong>
          <span className="subtitulo" style={{ display: 'block' }}>
            Un comunicado en la cartelera y un mensaje a cada residente ({residentes} personas), de una vez.
          </span>
        </span>
      </label>
      {avisarATodos && motivo.trim() && fechasBien && (
        <div className="tarjeta tarjeta--plana" style={{ marginBottom: 'var(--e3)' }}>
          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            El mensaje para todos (el demo lo deja escrito, no lo envía)
          </span>
          <p style={{ marginTop: 'var(--e1)' }}>{textoCierreZona(zona, cierre, copropiedad)}</p>
        </div>
      )}

      {intento && invalido && (
        <p className="ayuda-campo" style={{ color: 'var(--color-error)', marginBottom: 'var(--e2)' }}>
          {invalido}
        </p>
      )}
      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando}
        onClick={() => {
          setIntento(true)
          if (!invalido) void alConfirmar({ ...cierre, avisarATodos })
        }}
      >
        {afectadas.length > 0 ? `Cerrar y avisar a ${afectadas.length}` : 'Cerrar por mantenimiento'}
      </button>
    </Modal>
  )
}

function HojaDesactivar({
  zona,
  reservas,
  copropiedad,
  cargando,
  alCerrar,
  alConfirmar,
}: {
  zona: ZonaComun
  reservas: Reserva[]
  copropiedad: string
  cargando: boolean
  alCerrar: () => void
  alConfirmar: (motivo: string) => Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const [intento, setIntento] = useState(false)
  const afectadas = reservasQueCancelaDesactivar(zona.id, reservas)
  const corto = motivo.trim().length < MINIMO_MOTIVO_DESACTIVACION
  const texto = afectadas.length > 0 && motivo.trim() ? textoReservaCancelada(afectadas[0], zona, motivo, copropiedad) : null

  return (
    <Modal
      titulo={`Desactivar ${zona.nombre}`}
      descripcion="Deja de recibir reservas, sin fecha de regreso. No se borra: su historia queda, y se puede reactivar."
      onCerrar={alCerrar}
    >
      <div className="campo">
        <label htmlFor="desactivar-motivo">Motivo</label>
        <textarea
          id="desactivar-motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Ej: la asamblea aprobó convertirla en parqueadero de visitantes."
        />
        <span className="ayuda-campo">Es la justificación que le llega a quien tenía reserva.</span>
      </div>

      <ReservasAfectadas reservas={afectadas} texto={texto} vacio="No tiene reservas de hoy en adelante: nadie tiene que ser avisado." />

      {intento && corto && (
        <p className="ayuda-campo" style={{ color: 'var(--color-error)', marginBottom: 'var(--e2)' }}>
          Escribe el motivo: es lo que le llega a quien tenía reserva.
        </p>
      )}
      <button
        className="boton boton--peligro boton--bloque"
        disabled={cargando}
        onClick={() => {
          setIntento(true)
          if (!corto) void alConfirmar(motivo)
        }}
      >
        {afectadas.length > 0 ? `Desactivar y avisar a ${afectadas.length}` : 'Desactivar zona'}
      </button>
    </Modal>
  )
}
