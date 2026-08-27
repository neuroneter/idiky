/**
 * CU-A-06 — Aprobar o rechazar reservas.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-06
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { decidirReserva } from '../../datos/repositorio'
import { etiquetaUnidad, hoyISO } from '../../dominio/reglas'
import { formatearFecha } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipReserva } from '../../componentes/Etiquetas'

type Filtro = 'pendientes' | 'proximas' | 'todas'

export function ReservasAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')

  if (!sesion) return null

  const hoy = hoyISO()
  const reservas = sel.reservasDeCopropiedad(bd, sesion.copropiedadId).filter((reserva) => {
    if (filtro === 'pendientes') return reserva.estado === 'solicitada'
    if (filtro === 'proximas') return reserva.fecha >= hoy
    return true
  })

  async function rechazar() {
    if (!rechazando) return
    const decidida = await ejecutar(
      (base) => decidirReserva(base, rechazando, 'rechazada', motivo.trim()),
      'Reserva rechazada.',
    )
    if (decidida) {
      setRechazando(null)
      setMotivo('')
    }
  }

  return (
    <>
      <div className="filtros">
        {(
          [
            ['pendientes', 'Por aprobar'],
            ['proximas', 'Proximas'],
            ['todas', 'Todas'],
          ] as Array<[Filtro, string]>
        ).map(([id, texto]) => (
          <button
            key={id}
            className="filtro"
            aria-pressed={filtro === id}
            onClick={() => setFiltro(id)}
          >
            {texto}
          </button>
        ))}
      </div>

      {reservas.length === 0 ? (
        <EstadoVacio
          titulo="No hay reservas en este filtro"
          detalle="Las solicitudes de los residentes aparecerán aquí."
        />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Zona</th>
                  <th>Unidad</th>
                  <th>Solicitante</th>
                  <th>Fecha</th>
                  <th>Franja</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => {
                  const zona = sel.zona(bd, reserva.zonaId)
                  const unidad = sel.unidad(bd, reserva.unidadId)
                  return (
                    <tr key={reserva.id}>
                      <td>
                        <strong>{zona?.nombre}</strong>
                      </td>
                      <td className="suave">{unidad && etiquetaUnidad(unidad)}</td>
                      <td className="suave">
                        {nombreCompleto(sel.persona(bd, reserva.personaId))}
                      </td>
                      <td className="suave">{formatearFecha(reserva.fecha)}</td>
                      <td className="suave">
                        {reserva.horaInicio} - {reserva.horaFin}
                      </td>
                      <td>
                        <ChipReserva estado={reserva.estado} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {reserva.estado === 'solicitada' && (
                          <div className="grupo-botones" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="boton boton--pequeno boton--primario"
                              disabled={cargando}
                              onClick={() =>
                                ejecutar(
                                  (base) => decidirReserva(base, reserva.id, 'confirmada'),
                                  'Reserva confirmada.',
                                )
                              }
                            >
                              Aprobar
                            </button>
                            <button
                              className="boton boton--pequeno boton--peligro"
                              onClick={() => setRechazando(reserva.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rechazando && (
        <Modal
          titulo="Rechazar reserva"
          descripcion="El residente verá el motivo en su aplicación."
          onCerrar={() => setRechazando(null)}
        >
          <div className="campo">
            <label htmlFor="motivo-rechazo">Motivo</label>
            <textarea
              id="motivo-rechazo"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Ej: la zona esta en mantenimiento ese dia."
            />
          </div>
          <button className="boton boton--peligro boton--bloque" disabled={cargando} onClick={rechazar}>
            Rechazar reserva
          </button>
        </Modal>
      )}
    </>
  )
}
