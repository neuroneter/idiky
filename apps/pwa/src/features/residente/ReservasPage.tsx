/**
 * CU-R-05 — Reservar una zona comun.
 * CU-R-06 — Cancelar una reserva.
 * Doc: docs/casos-de-uso/residente.md#cu-r-05
 *
 * Reglas aplicadas: RN-08 (mora bloquea), RN-09 (franja ocupada),
 * RN-10 (anticipacion minima) y el cupo mensual por unidad. Solo se ofrecen las
 * zonas activas (RN-107); la cerrada por mantenimiento se ve con su aviso y no
 * se reserva en esas fechas (RN-108).
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
  puntosDeEspecificaciones,
  cierreEnFecha,
  cierresPendientes,
  fechaCorta,
  zonaActiva,
} from '../../dominio/reglas'
import { formatearFecha } from '../../utilidades/formato'
import type { ZonaComun } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { FotosZona } from '../../componentes/FotosZona'
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
  const zonas = sel.zonasDe(bd, sesion.copropiedadId).filter(zonaActiva)
  const hoy = hoyISO()
  const misReservas = sel.reservasDeUnidad(bd, unidadId)
  const cuotas = sel.cuotasDeUnidad(bd, unidadId)
  const enMora = estaEnMora(cuotas)
  const cierreDelDia = zonaElegida ? cierreEnFecha(zonaElegida, fecha) : undefined

  function abrirZona(zona: ZonaComun) {
    // RN-08: el bloqueo por mora se avisa antes de que el residente pierda tiempo.
    if (enMora) {
      mostrarAviso(
        'Tu unidad tiene cuotas vencidas. Ponte al día para reservar zonas comunes.',
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
        ? 'Solicitud enviada. La administración la revisará.'
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
            El reglamento no permite reservar zonas comunes con cuotas vencidas. Ponte al día
            desde tu estado de cuenta.
          </p>
        </div>
      )}

      <div className="pila">
        {/* Sin titulo de seccion: la barra superior ya dice "Zonas comunes" y
            repetirlo dos veces seguidas no informa nada. */}
        <div className="lista lista--compacta">
          {zonas.map((zona) => {
            const cierre = cierresPendientes(zona, hoy)[0]
            return (
            <button
              key={zona.id}
              className="tarjeta tarjeta--accion"
              onClick={() => abrirZona(zona)}
            >
              <div className="fila fila-inicio">
                {/* RN-104 — La primera foto, en la lista: se elige viendo. */}
                {zona.fotos?.[0] && (
                  <img
                    src={zona.fotos[0].imagen}
                    alt={zona.nombre}
                    style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 'var(--radio-sm)', flex: '0 0 72px' }}
                  />
                )}
                <div className="columna" style={{ flex: 1 }}>
                  <strong>{zona.nombre}</strong>
                  <span className="subtitulo">{zona.descripcion}</span>
                  {/* RN-108 — El cierre se avisa en la lista: que no lo descubra al escoger fecha. */}
                  {cierre && (
                    <span className="chip chip--alerta" style={{ alignSelf: 'flex-start', whiteSpace: 'normal', borderRadius: 'var(--radio-sm)' }}>
                      {cierre.desde > hoy
                        ? `Se cierra por mantenimiento del ${fechaCorta(cierre.desde)} al ${fechaCorta(cierre.hasta)}`
                        : `Cerrada por mantenimiento hasta el ${fechaCorta(cierre.hasta)}`}
                    </span>
                  )}
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {zona.horaInicio} a {zona.horaFin} · aforo {zona.aforo} ·{' '}
                    {zona.requiereAprobacion ? 'requiere aprobacion' : 'confirmación inmediata'}
                    {zona.fotos && zona.fotos.length > 1 ? ` · ${zona.fotos.length} fotos` : ''}
                  </span>
                </div>
                <span className="chip chip--marca">Reservar</span>
              </div>
            </button>
            )
          })}
        </div>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Mis reservas</span>
        {misReservas.length === 0 ? (
          <EstadoVacio
            titulo="Todavia no has reservado"
            detalle="Elige una zona común arriba para hacer tu primera reserva."
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
                      {reserva.motivoCancelacion && (
                        <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                          Cancelada por la administración. Motivo: {reserva.motivoCancelacion}
                        </span>
                      )}
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
          {/* RN-104 — Las fotos y las especificaciones antes de la fecha:
              primero se mira qué es y qué incluye, después se reserva. */}
          <div style={{ marginBottom: 'var(--e3)' }}>
            <FotosZona fotos={zonaElegida.fotos} nombre={zonaElegida.nombre} />
          </div>
          {puntosDeEspecificaciones(zonaElegida).length > 0 && (
            <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e3)' }}>
              <span className="titulo-seccion">Qué incluye y cómo se usa</span>
              <ul className="especificaciones">
                {puntosDeEspecificaciones(zonaElegida).map((punto, i) => (
                  <li key={i}>{punto}</li>
                ))}
              </ul>
            </div>
          )}
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

          {cierreDelDia && (
            <p className="ayuda-campo" style={{ color: 'var(--color-error)', marginBottom: 'var(--e2)' }}>
              Cerrada por mantenimiento del {fechaCorta(cierreDelDia.desde)} al {fechaCorta(cierreDelDia.hasta)}:{' '}
              {cierreDelDia.motivo}. Escoge otra fecha.
            </p>
          )}

          <div className="campo">
            <label>Franja horaria</label>
            <div className="franjas">
              {franjasDeZona(zonaElegida).map((opcion) => {
                const ocupada =
                  !!cierreDelDia || franjaOcupada(bd.reservas, zonaElegida.id, fecha, opcion.inicio)
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
              Las franjas tachadas ya están reservadas por otra unidad.
            </span>
          </div>

          <button
            className="boton boton--primario boton--bloque"
            disabled={!franja || cargando || !!cierreDelDia}
            onClick={confirmar}
          >
            {zonaElegida.requiereAprobacion ? 'Solicitar reserva' : 'Confirmar reserva'}
          </button>
        </Modal>
      )}
    </>
  )
}
