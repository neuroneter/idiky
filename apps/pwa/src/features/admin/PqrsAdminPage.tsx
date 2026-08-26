/**
 * CU-A-07 — Atender la bandeja de PQRS.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-07
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { cambiarEstadoPqrs, responderPqrs } from '../../datos/repositorio'
import { diasRestantesSla, etiquetaUnidad, pqrsAbierta, pqrsFueraDeSla } from '../../dominio/reglas'
import { capitalizar, formatearFecha, formatearFechaHora } from '../../utilidades/formato'
import type { EstadoPqrs } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipPqrs, ChipTipoPqrs } from '../../componentes/Etiquetas'

type Filtro = 'abiertas' | 'vencidas' | 'todas'

export function PqrsAdminPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('abiertas')
  const [abierta, setAbierta] = useState<string | null>(null)
  const [texto, setTexto] = useState('')

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const todas = sel.pqrsDeCopropiedad(bd, sesion.copropiedadId)
  const listado = todas.filter((solicitud) => {
    if (filtro === 'abiertas') return pqrsAbierta(solicitud)
    if (filtro === 'vencidas') return pqrsFueraDeSla(solicitud)
    return true
  })
  const detalle = todas.find((solicitud) => solicitud.id === abierta)

  async function responder() {
    if (!detalle) return
    if (texto.trim().length < 5) {
      mostrarAviso('Escribe una respuesta.', 'error')
      return
    }
    const resultado = await ejecutar(
      (base) =>
        responderPqrs(base, {
          pqrsId: detalle.id,
          autor: 'administracion',
          autorNombre: nombreCompleto(persona),
          texto: texto.trim(),
        }),
      'Respuesta enviada al residente.',
    )
    if (resultado) setTexto('')
  }

  return (
    <>
      <div className="filtros">
        {(
          [
            ['abiertas', 'Abiertas'],
            ['vencidas', 'Fuera de plazo'],
            ['todas', 'Todas'],
          ] as Array<[Filtro, string]>
        ).map(([id, etiqueta]) => (
          <button
            key={id}
            className="filtro"
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {listado.length === 0 ? (
        <EstadoVacio titulo="Bandeja vacia" detalle="No hay solicitudes en este filtro." />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Radicado</th>
                  <th>Asunto</th>
                  <th>Unidad</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {listado.map((solicitud) => {
                  const dias = diasRestantesSla(solicitud)
                  const vencida = pqrsFueraDeSla(solicitud)
                  const unidad = sel.unidad(bd, solicitud.unidadId)
                  return (
                    <tr
                      key={solicitud.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setAbierta(solicitud.id)}
                    >
                      <td className="suave">{solicitud.radicado}</td>
                      <td>
                        <strong>{solicitud.asunto}</strong>
                      </td>
                      <td className="suave">{unidad && etiquetaUnidad(unidad)}</td>
                      <td>
                        <ChipTipoPqrs tipo={solicitud.tipo} />
                      </td>
                      <td className="suave">{capitalizar(solicitud.categoria)}</td>
                      <td>
                        {!pqrsAbierta(solicitud) ? (
                          <span className="suave">—</span>
                        ) : vencida ? (
                          <span className="chip chip--error">Vencida</span>
                        ) : (
                          <span className={`chip${dias <= 3 ? ' chip--alerta' : ''}`}>
                            {dias} dias
                          </span>
                        )}
                      </td>
                      <td>
                        <ChipPqrs estado={solicitud.estado} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detalle && (
        <Modal
          titulo={detalle.asunto}
          descripcion={`${detalle.radicado} · ${capitalizar(detalle.tipo)} de ${capitalizar(detalle.categoria)}`}
          onCerrar={() => {
            setAbierta(null)
            setTexto('')
          }}
        >
          <div className="pila">
            <div className="tarjeta tarjeta--plana">
              <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
                <span className="subtitulo">
                  {nombreCompleto(sel.persona(bd, detalle.personaId))} ·{' '}
                  {sel.unidad(bd, detalle.unidadId) &&
                    etiquetaUnidad(sel.unidad(bd, detalle.unidadId)!)}
                </span>
                <ChipPqrs estado={detalle.estado} />
              </div>
              <p style={{ fontSize: 'var(--texto-sm)' }}>{detalle.descripcion}</p>
              <p className="ayuda-campo" style={{ marginTop: 'var(--e2)' }}>
                Radicada el {formatearFecha(detalle.fechaRadicacion)} · plazo hasta el{' '}
                {formatearFecha(detalle.fechaLimite)}
              </p>
            </div>

            {detalle.mensajes.length > 0 && (
              <div className="lista lista--compacta">
                {detalle.mensajes.map((mensaje) => (
                  <div key={mensaje.id} className={`mensaje mensaje--${mensaje.autor}`}>
                    <div className="mensaje__meta">
                      {mensaje.autorNombre} · {formatearFechaHora(mensaje.fecha)}
                    </div>
                    {mensaje.texto}
                  </div>
                ))}
              </div>
            )}

            {detalle.estado !== 'cerrada' && (
              <div>
                <div className="campo">
                  <label htmlFor="respuesta-admin">Responder</label>
                  <textarea
                    id="respuesta-admin"
                    value={texto}
                    onChange={(evento) => setTexto(evento.target.value)}
                    placeholder="Escribe la respuesta que vera el residente…"
                  />
                </div>
                <div className="grupo-botones">
                  <button className="boton boton--primario" disabled={cargando} onClick={responder}>
                    Enviar respuesta
                  </button>
                  {(['resuelta', 'cerrada'] as EstadoPqrs[]).map((estado) => (
                    <button
                      key={estado}
                      className="boton"
                      disabled={cargando || detalle.estado === estado}
                      onClick={() =>
                        ejecutar(
                          (base) => cambiarEstadoPqrs(base, detalle.id, estado),
                          `Solicitud marcada como ${estado}.`,
                        )
                      }
                    >
                      Marcar {estado}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
