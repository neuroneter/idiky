/**
 * CU-A-06 — Aprobar o rechazar reservas, cancelarlas con motivo (RN-115) y
 * cerrarlas después del turno: cobro por uso, depósito y multa (RN-119 a RN-121).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-06
 *
 * Reservas tiene tres pestañas: las reservas, el calendario de ocupación
 * (CU-A-29, en `CalendarioZonasPage`) y las zonas comunes (CU-A-10, en
 * `ZonasAdminPage`). Lo de reservas va dentro de reservas (Mary, 2026-10-01).
 */

import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  abrirProcesoPorReserva,
  cancelarReservaPorAdministracion,
  decidirReserva,
  registrarDepositoRecibido,
} from '../../datos/repositorio'
import {
  etiquetaUnidad,
  hoyISO,
  MINIMO_MOTIVO_DESACTIVACION,
  puedeAbrirProcesoPorReserva,
  puedeCancelarLaAdministracion,
  puedeCerrarReserva,
  textoReservaCancelada,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { CerrarReservaHoja } from './CerrarReservaHoja'
import { Modal } from '../../componentes/Modal'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipReserva } from '../../componentes/Etiquetas'
import type { Reserva } from '../../dominio/tipos'

type Filtro = 'pendientes' | 'por_cerrar' | 'proximas' | 'todas'

/** Las pestañas de Reservas. Son navegación, no filtros: cada una tiene su ruta. */
export function ReservasSeccionAdmin() {
  return (
    <>
      <nav className="segmentos" aria-label="Reservas">
        <NavLink to="/admin/reservas" end className="segmento">
          Reservas
        </NavLink>
        <NavLink to="/admin/reservas/calendario" className="segmento">
          Calendario
        </NavLink>
        <NavLink to="/admin/reservas/zonas" className="segmento">
          Zonas comunes
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}

export function ReservasAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  /** RN-115 — La reserva que la administración va a cancelar, y su motivo. */
  const [cancelando, setCancelando] = useState<string | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  /** RN-119 — La reserva que se está cerrando después del turno. */
  const [cerrando, setCerrando] = useState<string | null>(null)

  if (!sesion) return null

  const hoy = hoyISO()
  const reservas = sel.reservasDeCopropiedad(bd, sesion.copropiedadId).filter((reserva) => {
    if (filtro === 'pendientes') return reserva.estado === 'solicitada'
    if (filtro === 'por_cerrar') return puedeCerrarReserva(reserva)
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
            ['por_cerrar', 'Por cerrar'],
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
                        {reserva.personas ? ` · ${reserva.personas} ${reserva.personas === 1 ? 'persona' : 'personas'}` : ''}
                      </td>
                      <td>
                        <ChipReserva estado={reserva.estado} />
                        {/* RN-119 a RN-121 — La plata de la reserva, a la vista. */}
                        <PlataDeLaReserva reserva={reserva} />
                        {reserva.canceladaFueraDePlazo && (
                          <div style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--e1)', color: 'var(--color-alerta)' }}>
                            Cancelada fuera de plazo: puede abrir el proceso por la multa
                          </div>
                        )}
                        {reserva.motivoCancelacion && (
                          <div className="tenue" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--e1)' }}>
                            Por la administración: {reserva.motivoCancelacion}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="grupo-botones" style={{ justifyContent: 'flex-end' }}>
                          {reserva.deposito && !reserva.depositoRecibidoEn && reserva.estado === 'confirmada' && !reserva.cierre && (
                            <button
                              className="boton boton--pequeno"
                              disabled={cargando}
                              onClick={() =>
                                ejecutar((base) => registrarDepositoRecibido(base, reserva.id), 'Depósito registrado como recibido.')
                              }
                            >
                              Recibí el depósito
                            </button>
                          )}
                          {puedeCerrarReserva(reserva) && (
                            <button className="boton boton--pequeno boton--primario" onClick={() => setCerrando(reserva.id)}>
                              Cerrar
                            </button>
                          )}
                          {puedeAbrirProcesoPorReserva(reserva, sel.zona(bd, reserva.zonaId)) && (
                            <button
                              className="boton boton--pequeno"
                              disabled={cargando}
                              onClick={() =>
                                ejecutar(
                                  (base) =>
                                    abrirProcesoPorReserva(base, {
                                      reservaId: reserva.id,
                                      impuestaPor: nombreCompleto(sel.persona(bd, sesion.personaId)),
                                    }),
                                  'Proceso abierto. Se ve en Procesos, con su plazo para descargos.',
                                )
                              }
                            >
                              Abrir proceso
                            </button>
                          )}
                        </div>
                        {puedeCancelarLaAdministracion(reserva) && (
                          <button
                            className="boton boton--pequeno boton--peligro"
                            onClick={() => {
                              setCancelando(reserva.id)
                              setMotivoCancelacion('')
                            }}
                          >
                            Cancelar
                          </button>
                        )}
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

      {cerrando && (() => {
        const reserva = bd.reservas.find((r) => r.id === cerrando)
        const zona = reserva && sel.zona(bd, reserva.zonaId)
        if (!reserva || !zona) return null
        return <CerrarReservaHoja reserva={reserva} zona={zona} alCerrar={() => setCerrando(null)} />
      })()}

      {cancelando && (() => {
        const reserva = bd.reservas.find((r) => r.id === cancelando)
        const zona = reserva && sel.zona(bd, reserva.zonaId)
        if (!reserva || !zona) return null
        const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)?.nombre ?? 'La copropiedad'
        const corto = motivoCancelacion.trim().length < MINIMO_MOTIVO_DESACTIVACION
        return (
          <Modal
            titulo="Cancelar reserva"
            descripcion={`${zona.nombre} · ${formatearFecha(reserva.fecha)} · ${reserva.horaInicio} a ${reserva.horaFin} · ${nombreCompleto(sel.persona(bd, reserva.personaId))}`}
            onCerrar={() => setCancelando(null)}
          >
            <div className="campo">
              <label htmlFor="motivo-cancelacion">Motivo</label>
              <textarea
                id="motivo-cancelacion"
                value={motivoCancelacion}
                onChange={(evento) => setMotivoCancelacion(evento.target.value)}
                placeholder="Ej: el consejo necesita el salón para la reunión extraordinaria."
              />
              <span className="ayuda-campo">Es la justificación que le llega a quien reservó.</span>
            </div>
            {!corto && (
              <div className="tarjeta tarjeta--plana" style={{ marginBottom: 'var(--e3)' }}>
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  El mensaje que le llega (el demo lo deja escrito, no lo envía)
                </span>
                <p style={{ marginTop: 'var(--e1)' }}>
                  {textoReservaCancelada(reserva, zona, motivoCancelacion, copropiedad)}
                </p>
              </div>
            )}
            <button
              className="boton boton--peligro boton--bloque"
              disabled={cargando || corto}
              onClick={() =>
                void ejecutar(
                  (base) => cancelarReservaPorAdministracion(base, { reservaId: reserva.id, motivo: motivoCancelacion }),
                  'Reserva cancelada. Se le avisó a quien reservó.',
                ).then((hecho) => {
                  if (hecho) setCancelando(null)
                })
              }
            >
              Cancelar y avisar
            </button>
          </Modal>
        )
      })()}

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
              placeholder="Ej: la zona está en mantenimiento ese día."
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

/** RN-119 a RN-121 — El cobro, el depósito y el proceso de una reserva, en pocas palabras. */
function PlataDeLaReserva({ reserva }: { reserva: Reserva }) {
  const { bd } = useDatos()
  const lineas: string[] = []
  const cierre = reserva.cierre
  if (cierre) {
    lineas.push(
      cierre.resultado === 'no_se_presento'
        ? 'No se presentó'
        : `Se usó · ${cierre.estadoZona === 'con_novedades' ? 'con novedades' : 'quedó bien'}`,
    )
    if (cierre.cuotaUsoId && reserva.valorUso) lineas.push(`Cobro ${formatearDinero(reserva.valorUso)}`)
    if (cierre.depositoDevuelto !== undefined) {
      lineas.push(
        cierre.depositoRetenido
          ? `Depósito: devuelto ${formatearDinero(cierre.depositoDevuelto)}, retenido ${formatearDinero(cierre.depositoRetenido)}`
          : `Depósito devuelto ${formatearDinero(cierre.depositoDevuelto)}`,
      )
    }
  } else if (reserva.deposito && reserva.estado === 'confirmada') {
    lineas.push(
      reserva.depositoRecibidoEn
        ? `Depósito ${formatearDinero(reserva.deposito)} recibido`
        : `Depósito ${formatearDinero(reserva.deposito)} por recibir`,
    )
  }
  const sancion = reserva.sancionId ? bd.sanciones.find((s) => s.id === reserva.sancionId) : undefined
  if (sancion) lineas.push(`Proceso ${sancion.radicado}`)
  // RN-124, RN-126 — La constancia de las condiciones y la lista para portería.
  if (reserva.condicionesAceptadas) lineas.push('Aceptó las condiciones')
  if (reserva.invitados?.length) lineas.push(`${reserva.invitados.length} invitados en lista`)
  if (lineas.length === 0) return null
  return (
    <div className="tenue" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--e1)' }}>
      {lineas.join(' · ')}
    </div>
  )
}
