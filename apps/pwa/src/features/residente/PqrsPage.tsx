/**
 * CU-R-07 — Radicar una PQRS.
 * CU-R-08 — Seguir una PQRS radicada.
 * Doc: docs/casos-de-uso/residente.md#cu-r-07
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { crearPqrs, responderPqrs } from '../../datos/repositorio'
import { diasRestantesSla, pqrsAbierta } from '../../dominio/reglas'
import { formatearFecha, formatearFechaHora } from '../../utilidades/formato'
import type { CategoriaPqrs, TipoPqrs } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipPqrs, ChipTipoPqrs } from '../../componentes/Etiquetas'

const TIPOS: Array<{ id: TipoPqrs; texto: string; ayuda: string }> = [
  { id: 'peticion', texto: 'Petición', ayuda: 'Solicitas algo a la administración' },
  { id: 'queja', texto: 'Queja', ayuda: 'Reportas una conducta o situacion' },
  { id: 'reclamo', texto: 'Reclamo', ayuda: 'Exiges la solución de un problema' },
  { id: 'sugerencia', texto: 'Sugerencia', ayuda: 'Propones una mejora' },
]

const CATEGORIAS: Array<{ id: CategoriaPqrs; texto: string }> = [
  { id: 'convivencia', texto: 'Convivencia' },
  { id: 'mantenimiento', texto: 'Mantenimiento' },
  { id: 'seguridad', texto: 'Seguridad' },
  { id: 'administracion', texto: 'Administración' },
  { id: 'otro', texto: 'Otro' },
]

export function PqrsPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [creando, setCreando] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoPqrs>('peticion')
  const [categoria, setCategoria] = useState<CategoriaPqrs>('mantenimiento')
  const [asunto, setAsunto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [respuesta, setRespuesta] = useState('')

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const misPqrs = sel.pqrsDeUnidad(bd, sesion.unidadActivaId)

  async function radicar() {
    if (asunto.trim().length < 5) {
      mostrarAviso('Escribe un asunto de al menos 5 caracteres.', 'error')
      return
    }
    if (descripcion.trim().length < 15) {
      mostrarAviso('Describe la situación con un poco más de detalle.', 'error')
      return
    }
    const creada = await ejecutar(
      (base) =>
        crearPqrs(base, {
          copropiedadId: sesion!.copropiedadId,
          unidadId: sesion!.unidadActivaId!,
          personaId: sesion!.personaId,
          tipo,
          categoria,
          asunto: asunto.trim(),
          descripcion: descripcion.trim(),
        }),
      'Solicitud radicada.',
    )
    if (creada) {
      setCreando(false)
      setAsunto('')
      setDescripcion('')
      setAbierta(creada.id)
    }
  }

  async function comentar(pqrsId: string) {
    if (respuesta.trim().length < 2) return
    const resultado = await ejecutar(
      (base) =>
        responderPqrs(base, {
          pqrsId,
          autor: 'residente',
          autorNombre: nombreCompleto(persona),
          texto: respuesta.trim(),
        }),
      'Comentario enviado.',
    )
    if (resultado) setRespuesta('')
  }

  return (
    <>
      <button className="boton boton--primario boton--bloque" onClick={() => setCreando(true)}>
        <Icono nombre="mas" tamano={16} />
        Nueva solicitud
      </button>

      {misPqrs.length === 0 ? (
        <EstadoVacio
          titulo="No has radicado solicitudes"
          detalle="Usa el boton de arriba para reportar algo a la administración."
        />
      ) : (
        <div className="lista lista--compacta">
          {misPqrs.map((pqrs) => {
            const desplegada = abierta === pqrs.id
            const dias = diasRestantesSla(pqrs)
            return (
              <div key={pqrs.id} className="tarjeta tarjeta--plana">
                <button
                  style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}
                  onClick={() => setAbierta(desplegada ? null : pqrs.id)}
                >
                  <div className="fila fila-inicio">
                    <div className="columna" style={{ flex: 1 }}>
                      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                        {pqrs.radicado}
                      </span>
                      <strong>{pqrs.asunto}</strong>
                      <span className="subtitulo">
                        Radicada el {formatearFecha(pqrs.fechaRadicacion)}
                      </span>
                    </div>
                    <div className="columna" style={{ alignItems: 'flex-end', gap: 'var(--e1)' }}>
                      <ChipPqrs estado={pqrs.estado} />
                      <ChipTipoPqrs tipo={pqrs.tipo} />
                    </div>
                  </div>
                </button>

                {desplegada && (
                  <>
                    <div className="separador" />
                    <p style={{ fontSize: 'var(--texto-sm)' }}>{pqrs.descripcion}</p>

                    {pqrsAbierta(pqrs) && (
                      <p className="ayuda-campo" style={{ marginTop: 'var(--e2)' }}>
                        {dias >= 0
                          ? `La administracion tiene ${dias} dias para responder (hasta el ${formatearFecha(pqrs.fechaLimite)}).`
                          : `El plazo de respuesta vencio hace ${Math.abs(dias)} dias.`}
                      </p>
                    )}

                    {pqrs.mensajes.length > 0 && (
                      <div className="lista lista--compacta" style={{ marginTop: 'var(--e3)' }}>
                        {pqrs.mensajes.map((mensaje) => (
                          <div
                            key={mensaje.id}
                            className={`mensaje mensaje--${mensaje.autor}`}
                          >
                            <div className="mensaje__meta">
                              {mensaje.autorNombre} · {formatearFechaHora(mensaje.fecha)}
                            </div>
                            {mensaje.texto}
                          </div>
                        ))}
                      </div>
                    )}

                    {pqrs.estado !== 'cerrada' && (
                      <div style={{ marginTop: 'var(--e3)' }}>
                        <div className="campo">
                          <label htmlFor={`respuesta-${pqrs.id}`}>Agregar un comentario</label>
                          <textarea
                            id={`respuesta-${pqrs.id}`}
                            value={respuesta}
                            onChange={(evento) => setRespuesta(evento.target.value)}
                            placeholder="Escribe aquí…"
                          />
                        </div>
                        <button
                          className="boton boton--pequeno"
                          disabled={cargando}
                          onClick={() => comentar(pqrs.id)}
                        >
                          Enviar
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {creando && (
        <Modal
          titulo="Nueva solicitud"
          descripcion="La administración tiene 15 días calendario para responder."
          onCerrar={() => setCreando(false)}
        >
          <div className="campo">
            <label htmlFor="tipo-pqrs">Tipo</label>
            <select
              id="tipo-pqrs"
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as TipoPqrs)}
            >
              {TIPOS.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.texto}
                </option>
              ))}
            </select>
            <span className="ayuda-campo">
              {TIPOS.find((opcion) => opcion.id === tipo)?.ayuda}
            </span>
          </div>

          <div className="campo">
            <label htmlFor="categoria-pqrs">Categoria</label>
            <select
              id="categoria-pqrs"
              value={categoria}
              onChange={(evento) => setCategoria(evento.target.value as CategoriaPqrs)}
            >
              {CATEGORIAS.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {opcion.texto}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="asunto-pqrs">Asunto</label>
            <input
              id="asunto-pqrs"
              value={asunto}
              onChange={(evento) => setAsunto(evento.target.value)}
              placeholder="Ej: filtración en el baño social"
            />
          </div>

          <div className="campo">
            <label htmlFor="descripcion-pqrs">Descripción</label>
            <textarea
              id="descripcion-pqrs"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Cuenta que paso, desde cuando y donde."
            />
          </div>

          <button className="boton boton--primario boton--bloque" disabled={cargando} onClick={radicar}>
            Radicar solicitud
          </button>
        </Modal>
      )}
    </>
  )
}
