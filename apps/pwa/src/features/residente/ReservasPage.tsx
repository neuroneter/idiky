/**
 * CU-R-05 — Reservar una zona comun.
 * CU-R-06 — Cancelar una reserva.
 * Doc: docs/casos-de-uso/residente.md#cu-r-05
 *
 * Reglas aplicadas: RN-08 (mora bloquea), RN-09 (franja ocupada),
 * RN-10 (anticipacion minima) y el cupo mensual por unidad.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cancelarReserva, crearReserva } from '../../datos/repositorio'
import {
  estaEnMora,
  franjaOcupada,
  franjasDeZona,
  hoyISO,
  sePuedeCancelar,
  sumarDias,
  validarReserva,
} from '../../dominio/reglas'
import { formatearFecha } from '../../utilidades/formato'
import type { ZonaComun } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipReserva } from '../../componentes/Etiquetas'

export function ReservasPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [zonaElegida, setZonaElegida] = useState<ZonaComun | null>(null)
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 3))
  const [franja, setFranja] = useState<string | null>(null)

  if (!sesion) return null

  const unidadId = sesion.unidadActivaId!
  const zonas = sel.zonasDe(bd, sesion.copropiedadId)
  const misReservas = sel.reservasDeUnidad(bd, unidadId)
  const cuotas = sel.cuotasDeUnidad(bd, unidadId)
  const enMora = estaEnMora(cuotas)

  function abrirZona(zona: ZonaComun) {
    // RN-08: el bloqueo por mora se avisa antes de que el residente pierda tiempo.
    if (enMora) {
      mostrarAviso(
        'Tu unidad tiene cuotas vencidas. Ponte al dia para reservar zonas comunes.',
        'error',
      )
      return
    }
    setZonaElegida(zona)
    setFranja(null)
    setFecha(sumarDias(hoyISO(), Math.ceil(zona.anticipacionMinimaHoras / 24) || 1))
  }

  async function confirmar() {
    if (!zonaElegida || !franja) return
    const franjas = franjasDeZona(zonaElegida)
    const seleccionada = franjas.find((f) => f.inicio === franja)
    if (!seleccionada) return

    const validacion = validarReserva({
      zona: zonaElegida,
      fecha,
      horaInicio: seleccionada.inicio,
      unidadId,
      cuotasDeLaUnidad: cuotas,
      reservas: bd.reservas,
    })
    if (!validacion.valido) {
      mostrarAviso(validacion.motivo!, 'error')
      return
    }

    const reserva = await ejecutar(
      (base) =>
        crearReserva(base, {
          zonaId: zonaElegida.id,
          unidadId,
          personaId: sesion!.personaId,
          fecha,
          horaInicio: seleccionada.inicio,
          horaFin: seleccionada.fin,
        }),
      zonaElegida.requiereAprobacion
        ? 'Solicitud enviada. La administracion la revisara.'
        : 'Reserva confirmada.',
    )
    if (reserva) setZonaElegida(null)
  }

  return (
    <>
      {enMora && (
        <div className="tarjeta" style={{ background: 'var(--color-error-suave)', borderColor: 'transparent' }}>
          <strong style={{ color: 'var(--color-error)' }}>Reservas bloqueadas</strong>
          <p className="subtitulo" style={{ marginTop: 'var(--e1)' }}>
            El reglamento no permite reservar zonas comunes con cuotas vencidas. Ponte al dia
            desde tu estado de cuenta.
          </p>
        </div>
      )}

      <div className="pila">
        {/* Sin titulo de seccion: la barra superior ya dice "Zonas comunes" y
            repetirlo dos veces seguidas no informa nada. */}
        <div className="lista lista--compacta">
          {zonas.map((zona) => (
            <button
              key={zona.id}
              className="tarjeta tarjeta--accion"
              onClick={() => abrirZona(zona)}
            >
              <div className="fila fila-inicio">
                <div className="columna" style={{ flex: 1 }}>
                  <strong>{zona.nombre}</strong>
                  <span className="subtitulo">{zona.descripcion}</span>
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {zona.horaInicio} a {zona.horaFin} · aforo {zona.aforo} ·{' '}
                    {zona.requiereAprobacion ? 'requiere aprobacion' : 'confirmacion inmediata'}
                  </span>
                </div>
                <span className="chip chip--marca">Reservar</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Mis reservas</span>
        {misReservas.length === 0 ? (
          <EstadoVacio
            titulo="Todavia no has reservado"
            detalle="Elige una zona comun arriba para hacer tu primera reserva."
          />
        ) : (
          <div className="lista lista--compacta">
            {misReservas.map((reserva) => {
              const zona = sel.zona(bd, reserva.zonaId)
              return (
                <div key={reserva.id} className="tarjeta tarjeta--plana">
                  <div className="fila fila-inicio">
                    <div className="columna" style={{ flex: 1 }}>
                      <strong>{zona?.nombre ?? 'Zona'}</strong>
                      <span className="subtitulo">
                        {formatearFecha(reserva.fecha)} · {reserva.horaInicio} a{' '}
                        {reserva.horaFin}
                      </span>
                      {reserva.motivoRechazo && (
                        <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                          Motivo: {reserva.motivoRechazo}
                        </span>
                      )}
                    </div>
                    <div className="columna" style={{ alignItems: 'flex-end', gap: 'var(--e2)' }}>
                      <ChipReserva estado={reserva.estado} />
                      {sePuedeCancelar(reserva) && (
                        <button
                          className="boton boton--pequeno boton--peligro"
                          disabled={cargando}
                          onClick={() =>
                            ejecutar((base) => cancelarReserva(base, reserva.id), 'Reserva cancelada.')
                          }
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {zonaElegida && (
        <Modal
          titulo={zonaElegida.nombre}
          descripcion={`Reserva con al menos ${zonaElegida.anticipacionMinimaHoras} horas de anticipacion.`}
          onCerrar={() => setZonaElegida(null)}
        >
          <div className="campo">
            <label htmlFor="fecha-reserva">Fecha</label>
            <input
              id="fecha-reserva"
              type="date"
              value={fecha}
              min={hoyISO()}
              onChange={(evento) => {
                setFecha(evento.target.value)
                setFranja(null)
              }}
            />
          </div>

          <div className="campo">
            <label>Franja horaria</label>
            <div className="franjas">
              {franjasDeZona(zonaElegida).map((opcion) => {
                const ocupada = franjaOcupada(bd.reservas, zonaElegida.id, fecha, opcion.inicio)
                return (
                  <button
                    key={opcion.inicio}
                    className="franja"
                    disabled={ocupada}
                    aria-pressed={franja === opcion.inicio}
                    onClick={() => setFranja(opcion.inicio)}
                  >
                    {opcion.inicio} - {opcion.fin}
                  </button>
                )
              })}
            </div>
            <span className="ayuda-campo">
              Las franjas tachadas ya estan reservadas por otra unidad.
            </span>
          </div>

          <button
            className="boton boton--primario boton--bloque"
            disabled={!franja || cargando}
            onClick={confirmar}
          >
            {zonaElegida.requiereAprobacion ? 'Solicitar reserva' : 'Confirmar reserva'}
          </button>
        </Modal>
      )}
    </>
  )
}
