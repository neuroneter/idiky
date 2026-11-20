/**
 * CU-R-44 — Pedir permiso para un trasteo (PN-10).
 * CU-R-45 — Pedir permiso para una obra en el apartamento (PN-11).
 * Doc: docs/casos-de-uso/residente.md#cu-r-44
 *
 * Los dos trámites que más se repiten con la administración y que hoy se hacen
 * por WhatsApp o en papel. La administración los aprueba y portería los ve el
 * día que toca.
 */

import { TextoDeposito } from '../../componentes/DepositoTrasteo'
import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cancelarPermiso, solicitarPermisoObra, solicitarTrasteo } from '../../datos/repositorio'
import {
  HORARIO_OBRAS,
  reglasTrasteoDe,
  ascensoresHabilitados,
  TEXTO_ESTADO_PERMISO,
  hoyISO,
  motivoPermisoObraInvalido,
  motivoTrasteoInvalido,
  sumarDias,
} from '../../dominio/reglas'
import type { EstadoPermiso, TrabajadorObra } from '../../dominio/tipos'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'

const CHIP: Record<EstadoPermiso, string> = {
  solicitado: 'chip chip--info',
  aprobado: 'chip chip--exito',
  rechazado: 'chip chip--alerta',
  cancelado: 'chip',
}

export function PermisosPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [pidiendo, setPidiendo] = useState<'trasteo' | 'obra' | null>(null)
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  const trasteos = (bd.trasteos ?? []).filter((t) => t.unidadId === unidadId).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const obras = (bd.permisosObra ?? []).filter((p) => p.unidadId === unidadId).sort((a, b) => b.desde.localeCompare(a.desde))

  const cancelar = (tipo: 'trasteo' | 'obra', id: string) =>
    void ejecutar((base) => cancelarPermiso(base, { tipo, id, personaId: sesion.personaId }), 'Solicitud cancelada.')

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/unidad" texto="Mi unidad" />
        <h1 className="titulo">Trasteos y obras</h1>
      </div>

      <div className="encabezado-seccion">
        <h2>Trasteos</h2>
      </div>
      <button className="boton boton--primario boton--bloque" onClick={() => setPidiendo('trasteo')}>
        <Icono nombre="mas" tamano={16} />
        Pedir permiso de trasteo
      </button>
      {trasteos.map((t) => (
        <div key={t.id} className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e1)' }}>
          <div className="fila">
            <strong>
              {t.sentido === 'llegada' ? 'Llegada' : 'Salida'} · {formatearFecha(t.fecha)}
            </strong>
            <span className={CHIP[t.estado]}>{t.realizado ? 'Hecho' : TEXTO_ESTADO_PERMISO[t.estado]}</span>
          </div>
          <span className="subtitulo">
            De {t.horaInicio} a {t.horaFin}
            {t.empresa ? ` · ${t.empresa}` : ''}
          </span>
          {t.decision?.motivo && <span className="subtitulo">Administración: {t.decision.motivo}</span>}
          {t.deposito && !t.deposito.recibido && (t.estado === 'solicitado' || t.estado === 'aprobado') && (
            <span className="subtitulo">Entrega el depósito en la administración o en portería antes del trasteo.</span>
          )}
          <TextoDeposito trasteo={t} />
          {(t.estado === 'solicitado' || t.estado === 'aprobado') && !t.realizado && t.personaId === sesion.personaId && (
            <button className="boton boton--pequeno" style={{ alignSelf: 'flex-start' }} disabled={cargando} onClick={() => cancelar('trasteo', t.id)}>
              Cancelar
            </button>
          )}
        </div>
      ))}

      <div className="encabezado-seccion" style={{ marginTop: 'var(--e3)' }}>
        <h2>Obras en el apartamento</h2>
      </div>
      <button className="boton boton--primario boton--bloque" onClick={() => setPidiendo('obra')}>
        <Icono nombre="mas" tamano={16} />
        Pedir permiso de obra
      </button>
      {obras.map((o) => (
        <div key={o.id} className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e1)' }}>
          <div className="fila fila-inicio">
            <strong>{o.descripcion}</strong>
            <span className={CHIP[o.estado]}>{TEXTO_ESTADO_PERMISO[o.estado]}</span>
          </div>
          <span className="subtitulo">
            Del {formatearFecha(o.desde)} al {formatearFecha(o.hasta)} · {o.trabajadores.length}{' '}
            {o.trabajadores.length === 1 ? 'trabajador' : 'trabajadores'}
          </span>
          {o.decision?.motivo && <span className="subtitulo">Administración: {o.decision.motivo}</span>}
          {(o.estado === 'solicitado' || o.estado === 'aprobado') && o.personaId === sesion.personaId && (
            <button className="boton boton--pequeno" style={{ alignSelf: 'flex-start' }} disabled={cargando} onClick={() => cancelar('obra', o.id)}>
              Cancelar
            </button>
          )}
        </div>
      ))}

      {pidiendo === 'trasteo' && <PedirTrasteo unidadId={unidadId} alCerrar={() => setPidiendo(null)} />}
      {pidiendo === 'obra' && <PedirObra unidadId={unidadId} alCerrar={() => setPidiendo(null)} />}
    </div>
  )
}

function PedirTrasteo({ unidadId, alCerrar }: { unidadId: string; alCerrar: () => void }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const reglas = reglasTrasteoDe(sesion ? sel.copropiedad(bd, sesion.copropiedadId) : undefined)
  const hoy = hoyISO()
  const [sentido, setSentido] = useState<'llegada' | 'salida'>('llegada')
  const [fecha, setFecha] = useState(sumarDias(hoy, reglas.diasAnticipacion))
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFin, setHoraFin] = useState('11:00')
  const [empresa, setEmpresa] = useState('')
  const [placa, setPlaca] = useState('')
  const habilitados = ascensoresHabilitados(reglas)
  const [ascensorId, setAscensorId] = useState(habilitados[0]?.id ?? '')
  if (!sesion) return null
  const motivo = motivoTrasteoInvalido(
    { fecha, horaInicio, horaFin, ascensorId },
    reglas,
    (bd.trasteos ?? []).filter((t) => t.copropiedadId === sesion.copropiedadId),
    hoy,
  )

  return (
    <Modal
      titulo="Permiso de trasteo"
      descripcion={`Horario de ${reglas.horaDesde} a ${reglas.horaHasta}, con ${reglas.diasAnticipacion} días de anticipación. Domingos y festivos no.`}
      onCerrar={alCerrar}
    >
      <div className="segmentos">
        <button className="segmento" aria-current={sentido === 'llegada' ? 'page' : undefined} onClick={() => setSentido('llegada')}>
          Llego
        </button>
        <button className="segmento" aria-current={sentido === 'salida' ? 'page' : undefined} onClick={() => setSentido('salida')}>
          Me voy
        </button>
      </div>
      <div className="campo">
        <label htmlFor="fecha-trasteo">Fecha</label>
        <input id="fecha-trasteo" type="date" min={sumarDias(hoy, reglas.diasAnticipacion)} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </div>
      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="inicio-trasteo">Desde</label>
          <input id="inicio-trasteo" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="fin-trasteo">Hasta</label>
          <input id="fin-trasteo" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
        </div>
      </div>
      {habilitados.length > 0 && (
        <div className="campo">
          <label htmlFor="ascensor-trasteo">Ascensor</label>
          <select id="ascensor-trasteo" value={ascensorId} onChange={(e) => setAscensorId(e.target.value)}>
            {habilitados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="empresa-trasteo">Empresa (opcional)</label>
          <input id="empresa-trasteo" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="placa-trasteo">Placa del camión (opcional)</label>
          <input id="placa-trasteo" value={placa} onChange={(e) => setPlaca(e.target.value)} style={{ textTransform: 'uppercase' }} />
        </div>
      </div>
      {reglas.deposito ? (
        <p className="subtitulo">El edificio pide un depósito de {formatearDinero(reglas.deposito)} que se devuelve si no hay daños.</p>
      ) : null}
      {motivo && <p className="acceso__nota">{motivo}</p>}
      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando || !!motivo}
        onClick={async () => {
          const hecho = await ejecutar(
            (base) => solicitarTrasteo(base, { unidadId, personaId: sesion.personaId, sentido, fecha, horaInicio, horaFin, ascensorId, empresa, placa }),
            'Listo. Te avisamos cuando la administración lo apruebe.',
          )
          if (hecho) alCerrar()
        }}
      >
        Pedir el permiso
      </button>
    </Modal>
  )
}

function PedirObra({ unidadId, alCerrar }: { unidadId: string; alCerrar: () => void }) {
  const { ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const hoy = hoyISO()
  const [descripcion, setDescripcion] = useState('')
  const [desde, setDesde] = useState(sumarDias(hoy, 3))
  const [hasta, setHasta] = useState(sumarDias(hoy, 10))
  const [contratista, setContratista] = useState('')
  const [trabajadores, setTrabajadores] = useState<TrabajadorObra[]>([{ nombre: '', documento: '' }])
  if (!sesion) return null
  const motivo = motivoPermisoObraInvalido({ descripcion, desde, hasta, trabajadores }, hoy)
  const cambiar = (i: number, campo: keyof TrabajadorObra, valor: string) =>
    setTrabajadores(trabajadores.map((t, j) => (j === i ? { ...t, [campo]: valor } : t)))

  return (
    <Modal titulo="Permiso de obra" descripcion={`Horario de obras: ${HORARIO_OBRAS}`} onCerrar={alCerrar}>
      <div className="campo">
        <label htmlFor="descripcion-obra">Qué se va a hacer</label>
        <textarea id="descripcion-obra" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Cambio del enchape de la cocina" />
      </div>
      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="desde-obra">Desde</label>
          <input id="desde-obra" type="date" min={sumarDias(hoy, 1)} value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="hasta-obra">Hasta</label>
          <input id="hasta-obra" type="date" min={desde} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>
      <div className="campo">
        <label htmlFor="contratista-obra">Contratista (opcional)</label>
        <input id="contratista-obra" value={contratista} onChange={(e) => setContratista(e.target.value)} />
      </div>
      <span className="titulo-seccion">Trabajadores que entran</span>
      {trabajadores.map((t, i) => (
        <div key={i} className="fila-campos">
          <div className="campo">
            <label htmlFor={`nombre-trabajador-${i}`}>Nombre</label>
            <input id={`nombre-trabajador-${i}`} value={t.nombre} onChange={(e) => cambiar(i, 'nombre', e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor={`documento-trabajador-${i}`}>Documento</label>
            <input id={`documento-trabajador-${i}`} inputMode="numeric" value={t.documento} onChange={(e) => cambiar(i, 'documento', e.target.value)} />
          </div>
        </div>
      ))}
      {trabajadores.length < 10 && (
        <button className="boton boton--pequeno" onClick={() => setTrabajadores([...trabajadores, { nombre: '', documento: '' }])}>
          Agregar trabajador
        </button>
      )}
      {motivo && descripcion && <p className="acceso__nota" style={{ marginTop: 'var(--e2)' }}>{motivo}</p>}
      <button
        className="boton boton--primario boton--bloque"
        style={{ marginTop: 'var(--e3)' }}
        disabled={cargando || !!motivo}
        onClick={async () => {
          const hecho = await ejecutar(
            (base) => solicitarPermisoObra(base, { unidadId, personaId: sesion.personaId, descripcion, desde, hasta, contratista, trabajadores }),
            'Listo. Te avisamos cuando la administración lo apruebe.',
          )
          if (hecho) alCerrar()
        }}
      >
        Pedir el permiso
      </button>
    </Modal>
  )
}
