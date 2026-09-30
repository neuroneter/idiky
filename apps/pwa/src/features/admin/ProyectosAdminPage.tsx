/**
 * CU-A-28 — Registrar un proyecto y sus avances.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-28
 *
 * «El administrador registra un proyecto y va registrando el avance del
 * proyecto; a los propietarios les llega un mensaje con los avances y pueden
 * entrar a ver un tablero» (Mary, 2026-09-29). Registrar un avance aquí es
 * publicarlo (RN-101): no hay un paso aparte de «avisar», porque un avance
 * que la administración conoce y el propietario no es exactamente lo que
 * este módulo existe para evitar.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { crearProyecto, registrarAvanceProyecto } from '../../datos/repositorio'
import { estadoProyecto, motivoAvanceInvalido, porcentajeProyecto, ultimoAvance } from '../../dominio/reglas'
import { formatearFechaCorta } from '../../utilidades/formato'
import type { Proyecto } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { BarraAvance, ChipProyecto, FichaProyecto, HistoriaProyecto } from '../../componentes/TableroProyecto'

export function ProyectosAdminPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [creando, setCreando] = useState(false)
  const [viendo, setViendo] = useState<string | null>(null)

  if (!sesion) return null

  const proyectos = sel.proyectosDe(bd, sesion.copropiedadId)
  const enDetalle = proyectos.find((p) => p.id === viendo)
  const enMarcha = proyectos.filter((p) => estadoProyecto(p) === 'en_curso').length

  return (
    <div className="pila">
      <div className="fila">
        <span className="subtitulo">
          Las obras de la copropiedad y en qué van. Cada avance que registres se publica en la
          cartelera y le llega por mensaje a cada propietario (RN-101).
        </span>
        <button className="boton boton--primario" onClick={() => setCreando(true)}>
          <Icono nombre="mas" tamano={16} />
          Nuevo proyecto
        </button>
      </div>

      <div className="rejilla-indicadores">
        <div className="tarjeta indicador">
          <span className="indicador__valor numerico">{enMarcha}</span>
          <span className="indicador__etiqueta">En marcha</span>
        </div>
        <div className="tarjeta indicador">
          <span className="indicador__valor numerico">
            {proyectos.filter((p) => estadoProyecto(p) === 'terminado').length}
          </span>
          <span className="indicador__etiqueta">Terminados</span>
        </div>
        <div className="tarjeta indicador">
          <span className="indicador__valor numerico">
            {proyectos.filter((p) => estadoProyecto(p) === 'planeado').length}
          </span>
          <span className="indicador__etiqueta">Planeados</span>
        </div>
      </div>

      {proyectos.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay proyectos"
          detalle="Registra la primera obra: los propietarios la verán en su tablero desde el primer avance."
        />
      ) : (
        <div className="rejilla-dos">
          {proyectos.map((proyecto) => {
            const ultimo = ultimoAvance(proyecto)
            return (
              <div key={proyecto.id} className="tarjeta columna" style={{ gap: 'var(--e3)' }}>
                <div className="fila fila-inicio">
                  <strong>{proyecto.nombre}</strong>
                  <ChipProyecto proyecto={proyecto} />
                </div>
                <BarraAvance proyecto={proyecto} />
                <span className="subtitulo">
                  {ultimo
                    ? `Último avance: ${ultimo.titulo} (${formatearFechaCorta(ultimo.fecha)})`
                    : 'Sin avances todavía.'}
                </span>
                <button className="boton boton--pequeno" onClick={() => setViendo(proyecto.id)}>
                  {proyecto.avances.length === 0
                    ? 'Abrir el tablero'
                    : `Ver los ${proyecto.avances.length} ${proyecto.avances.length === 1 ? 'avance' : 'avances'} y registrar`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {creando && (
        <FormularioProyecto
          alCerrar={() => setCreando(false)}
          alCrear={async (datos) => {
            const creado = await ejecutar(
              (base) =>
                crearProyecto(base, {
                  copropiedadId: sesion.copropiedadId,
                  creadoPor: sesion.personaId,
                  ...datos,
                }),
              'Proyecto creado. Regístrale el primer avance cuando arranque.',
            )
            if (creado) {
              setCreando(false)
              setViendo(creado.id)
            }
          }}
        />
      )}

      {enDetalle && (
        <DetalleProyecto
          proyecto={enDetalle}
          cargando={cargando}
          personaDe={(id) => sel.persona(bd, id)}
          alCerrar={() => setViendo(null)}
          alRegistrarAvance={async (datos) => {
            const hecho = await ejecutar(
              (base) =>
                registrarAvanceProyecto(base, {
                  proyectoId: enDetalle.id,
                  registradoPor: sesion.personaId,
                  ...datos,
                }),
            )
            if (hecho) {
              // Se dice a cuántos les llegó y a cuántos no: «se avisó» sin
              // número es la frase que después nadie puede comprobar (RN-64).
              const { avisados, sinCelular } = hecho
              const detalle =
                sinCelular > 0
                  ? ` ${sinCelular} ${sinCelular === 1 ? 'propietario no tiene' : 'propietarios no tienen'} celular registrado.`
                  : ''
              mostrarAviso(
                `Avance publicado en la cartelera y avisado por mensaje a ${avisados} ${avisados === 1 ? 'propietario' : 'propietarios'}.${detalle}`,
                'exito',
              )
            }
            return !!hecho
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function FormularioProyecto({
  alCrear,
  alCerrar,
}: {
  alCrear: (datos: {
    nombre: string
    descripcion: string
    responsable?: string
    fechaInicio?: string
    fechaFinPrevista?: string
    presupuesto?: number
  }) => Promise<void>
  alCerrar: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <Modal titulo="Nuevo proyecto" descripcion="Una obra o un trabajo de la copropiedad que los propietarios van a seguir." onCerrar={alCerrar}>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          setError(null)
          if (nombre.trim().length < 3) {
            setError('Ponle nombre al proyecto.')
            return
          }
          if (descripcion.trim().length < 10) {
            setError('Describe el proyecto: es lo primero que lee el propietario.')
            return
          }
          const monto = presupuesto.trim() ? Number(presupuesto.replace(/[^\d]/g, '')) : undefined
          void alCrear({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            responsable: responsable.trim() || undefined,
            fechaInicio: inicio || undefined,
            fechaFinPrevista: fin || undefined,
            presupuesto: monto,
          })
        }}
      >
        <div className="campo">
          <label htmlFor="nombre-proyecto">Nombre</label>
          <input id="nombre-proyecto" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Impermeabilización de cubiertas" />
        </div>
        <div className="campo">
          <label htmlFor="descripcion-proyecto">Qué se va a hacer</label>
          <textarea id="descripcion-proyecto" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="En palabras de propietario: qué, dónde y para qué." />
        </div>
        <div className="campo">
          <label htmlFor="responsable-proyecto">Quién lo ejecuta (opcional)</label>
          <input id="responsable-proyecto" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Contratista, empresa o comité" />
        </div>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="inicio-proyecto">Inicio (opcional)</label>
            <input id="inicio-proyecto" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="fin-proyecto">Fin previsto (opcional)</label>
            <input id="fin-proyecto" type="date" value={fin} min={inicio || undefined} onChange={(e) => setFin(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="presupuesto-proyecto">Presupuesto (opcional)</label>
          <input id="presupuesto-proyecto" inputMode="numeric" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} placeholder="40000000" />
          <span className="ayuda-campo">
            En pesos, sin puntos. Si lo paga una cuota extraordinaria, dilo en la descripción: el
            propietario quiere saber en qué se va su plata.
          </span>
        </div>
        {error && <p className="acceso__error">{error}</p>}
        <button className="boton boton--primario boton--bloque" type="submit">
          Crear el proyecto
        </button>
      </form>
    </Modal>
  )
}

// ---------------------------------------------------------------------------

function DetalleProyecto({
  proyecto,
  cargando,
  personaDe,
  alRegistrarAvance,
  alCerrar,
}: {
  proyecto: Proyecto
  cargando: boolean
  personaDe: (id: string) => ReturnType<typeof sel.persona>
  alRegistrarAvance: (datos: { porcentaje: number; titulo: string; detalle: string; foto?: string }) => Promise<boolean>
  alCerrar: () => void
}) {
  const terminado = estadoProyecto(proyecto) === 'terminado'
  const [porcentaje, setPorcentaje] = useState(String(Math.min(100, porcentajeProyecto(proyecto) + 10)))
  const [titulo, setTitulo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [registrando, setRegistrando] = useState(false)

  const borrador = { porcentaje: Number(porcentaje), titulo, detalle }
  // RN-100 — El motivo se calcula con la misma regla que usa el repositorio,
  // y se muestra junto al botón en vez de esperar al error.
  const motivo = terminado ? null : motivoAvanceInvalido(proyecto, borrador)

  return (
    <Modal titulo={proyecto.nombre} descripcion={proyecto.descripcion} onCerrar={alCerrar}>
      <div className="columna" style={{ gap: 'var(--e3)' }}>
        <div className="fila">
          <ChipProyecto proyecto={proyecto} />
        </div>
        <BarraAvance proyecto={proyecto} />
        <FichaProyecto proyecto={proyecto} />
      </div>

      {/* Los avances van antes del formulario: el tablero es para ver en qué
          va la obra; registrar es lo que se hace después de mirar. */}
      <div className="separador" />
      <span className="titulo-seccion">
        Avances ({proyecto.avances.length})
      </span>
      <div style={{ marginTop: 'var(--e3)', marginBottom: 'var(--e3)' }}>
        <HistoriaProyecto proyecto={proyecto} personaDe={personaDe} />
      </div>

      <div className="separador" />

      {terminado ? (
        <p className="acceso__nota">
          El proyecto llegó al 100 % y quedó <strong>terminado</strong>. Si hay algo más que hacer,
          es otro proyecto (RN-100).
        </p>
      ) : !registrando ? (
        <button className="boton boton--primario boton--bloque" onClick={() => setRegistrando(true)}>
          <Icono nombre="mas" tamano={16} />
          Registrar un avance
        </button>
      ) : (
        <div className="columna" style={{ gap: 'var(--e2)' }}>
          <span className="titulo-seccion">Nuevo avance</span>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="porcentaje-avance">Avance total (%)</label>
              <input
                id="porcentaje-avance"
                inputMode="numeric"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value.replace(/[^\d]/g, ''))}
              />
              <span className="ayuda-campo">
                Hoy va en {porcentajeProyecto(proyecto)} %. Es el avance de toda la obra, no de esta
                etapa.
              </span>
            </div>
            <div className="campo">
              <label htmlFor="titulo-avance">Qué se hizo</label>
              <input id="titulo-avance" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Reparación de grietas en la Torre 2" />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="detalle-avance">Detalle (opcional, salvo si el avance baja)</label>
            <textarea id="detalle-avance" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Lo que el propietario querría saber: qué falta, qué sigue, si hubo un imprevisto." />
          </div>
          <CapturaFoto
            etiqueta="Foto de la obra (opcional)"
            ayuda="Una foto vale más que el porcentaje: el propietario ve la cubierta sin subir a mirarla."
            valor={foto}
            alCambiar={setFoto}
          />
          {motivo && <p className="acceso__nota">{motivo}</p>}
          <p className="subtitulo">
            Al registrarlo se publica en la cartelera y le llega un mensaje a cada propietario
            (RN-101). No se edita después: si algo quedó mal, se corrige con otro avance (RN-100).
          </p>
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando || !!motivo}
              onClick={async () => {
                const hecho = await alRegistrarAvance({ ...borrador, foto: foto ?? undefined })
                if (hecho) {
                  setRegistrando(false)
                  setTitulo('')
                  setDetalle('')
                  setFoto(null)
                  setPorcentaje(String(Math.min(100, borrador.porcentaje + 10)))
                }
              }}
            >
              Registrar y avisar
            </button>
            <button className="boton" disabled={cargando} onClick={() => setRegistrando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </Modal>
  )
}
