/**
 * CU-R-05 — Reservar una zona comun.
 * CU-R-06 — Cancelar una reserva.
 * Doc: docs/casos-de-uso/residente.md#cu-r-05
 *
 * Reglas aplicadas: RN-08 (mora bloquea), RN-09 (franja ocupada),
 * RN-10 (anticipacion minima) y el cupo mensual por unidad. Solo se ofrecen las
 * zonas activas (RN-107); la cerrada por mantenimiento se ve con su aviso y no
 * se reserva en esas fechas (RN-108). El costo, el deposito y la multa por no
 * cancelar se leen antes de reservar (RN-109, RN-110). En la zona compartida
 * varias unidades toman el turno hasta el aforo (RN-111); quien reserva dice
 * cuantas personas van (RN-113); cancelar fuera de plazo se advierte antes
 * (RN-112); cada dia tiene su horario (RN-114).
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
  zonaCompartida,
  cuposLibres,
  horarioDelDia,
  diaDeLaSemana,
  NOMBRES_DIA,
  multaAlCancelar,
  textoHorarioSemanal,
  textoRespaldo,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import type { Reserva, ZonaComun } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { FotosZona } from '../../componentes/FotosZona'
import { CondicionesZona, resumenCondicionesZona } from '../../componentes/CondicionesZona'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipReserva } from '../../componentes/Etiquetas'

export function ReservasPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [zonaElegida, setZonaElegida] = useState<ZonaComun | null>(null)
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 3))
  const [franja, setFranja] = useState<string | null>(null)
  /** RN-113 — Cuántas personas van, contando a quien reserva. */
  const [personas, setPersonas] = useState(1)
  /** RN-112 — La reserva que va a cancelar dentro del plazo con multa. */
  const [cancelando, setCancelando] = useState<Reserva | null>(null)

  if (!sesion) return null

  const unidadId = sesion.unidadActivaId!
  const zonas = sel.zonasDe(bd, sesion.copropiedadId).filter(zonaActiva)
  const hoy = hoyISO()
  const conceptos = sel.conceptosSancionDe(bd, sesion.copropiedadId)
  const misReservas = sel.reservasDeUnidad(bd, unidadId)
  const cuotas = sel.cuotasDeUnidad(bd, unidadId)
  const enMora = estaEnMora(cuotas)
  const cierreDelDia = zonaElegida ? cierreEnFecha(zonaElegida, fecha) : undefined
  const compartida = zonaElegida ? zonaCompartida(zonaElegida) : false
  const abreEseDia = zonaElegida ? !!horarioDelDia(zonaElegida, fecha) : true
  const multaCancelando = cancelando
    ? multaAlCancelar(cancelando, sel.zona(bd, cancelando.zonaId), conceptos)
    : null

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
    setPersonas(1)
    setFecha(sumarDias(hoyISO(), Math.ceil(zona.anticipacionMinimaHoras / 24) || 1))
  }

  /** RN-112 — Si cancelar ahora tiene multa, primero se advierte. */
  function pedirCancelacion(reserva: Reserva) {
    if (multaAlCancelar(reserva, sel.zona(bd, reserva.zonaId), conceptos)) {
      setCancelando(reserva)
      return
    }
    void ejecutar((base) => cancelarReserva(base, reserva.id), 'Reserva cancelada.')
  }

  async function confirmar() {
    if (!zonaElegida || !franja) return
    const franjas = franjasDeZona(zonaElegida, fecha)
    const seleccionada = franjas.find((f) => f.inicio === franja)
    if (!seleccionada) return

    const validacion = validarReserva({
      zona: zonaElegida,
      fecha,
      horaInicio: seleccionada.inicio,
      unidadId,
      cuotasDeLaUnidad: cuotas,
      reservas: bd.reservas,
      personas,
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
          personas,
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
                    {textoHorarioSemanal(zona)} ·{' '}
                    {zonaCompartida(zona) ? `compartida, hasta ${zona.aforo} personas por turno` : `aforo ${zona.aforo}`} ·{' '}
                    {zona.requiereAprobacion ? 'requiere aprobacion' : 'confirmación inmediata'}
                    {zona.fotos && zona.fotos.length > 1 ? ` · ${zona.fotos.length} fotos` : ''}
                  </span>
                  {/* RN-109, RN-110 — Lo que cuesta, a la vista antes de abrirla. */}
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {resumenCondicionesZona(zona, conceptos)}
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
                        {reserva.personas ? ` · ${reserva.personas} ${reserva.personas === 1 ? 'persona' : 'personas'}` : ''}
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
                          onClick={() => pedirCancelacion(reserva)}
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
          {/* RN-109, RN-110 — Antes de la fecha: cuánto cuesta y qué pasa si no cancela. */}
          <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e3)' }}>
            <span className="titulo-seccion">Costos y cancelación</span>
            <CondicionesZona zona={zonaElegida} conceptos={conceptos} />
          </div>
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

          {/* RN-113 — Cuántos van: llena el turno compartido y no pasa del aforo. */}
          <div className="campo">
            <label htmlFor="personas-reserva">¿Cuántas personas van, contándote?</label>
            <input
              id="personas-reserva"
              type="number"
              min={1}
              max={zonaElegida.aforo}
              inputMode="numeric"
              value={personas}
              onChange={(evento) => {
                setPersonas(Number(evento.target.value))
                setFranja(null)
              }}
            />
            <span className="ayuda-campo">
              {compartida
                ? `Se comparte con otras unidades: el turno se llena con ${zonaElegida.aforo} personas.`
                : `Es solo para tu unidad. Aforo: ${zonaElegida.aforo} personas. Portería lo ve para dejar entrar a tus invitados.`}
            </span>
          </div>

          {!cierreDelDia && !abreEseDia && (
            <p className="ayuda-campo" style={{ color: 'var(--color-error)', marginBottom: 'var(--e2)' }}>
              {zonaElegida.nombre} no abre los {NOMBRES_DIA[diaDeLaSemana(fecha)]}. Escoge otra fecha.
            </p>
          )}

          <div className="campo">
            <label>Franja horaria</label>
            <div className="franjas">
              {franjasDeZona(zonaElegida, fecha).map((opcion) => {
                const libres = compartida ? cuposLibres(zonaElegida, bd.reservas, fecha, opcion.inicio) : null
                const ocupada =
                  !!cierreDelDia ||
                  (compartida
                    ? (libres ?? 0) < Math.max(1, personas)
                    : franjaOcupada(bd.reservas, zonaElegida.id, fecha, opcion.inicio))
                return (
                  <button
                    key={opcion.inicio}
                    className="franja"
                    disabled={ocupada}
                    aria-pressed={franja === opcion.inicio}
                    onClick={() => setFranja(opcion.inicio)}
                  >
                    {opcion.inicio} - {opcion.fin}
                    {libres !== null && (
                      <span style={{ display: 'block', fontWeight: 400 }}>
                        {libres === 0 ? 'lleno' : `quedan ${libres}`}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <span className="ayuda-campo">
              {compartida
                ? 'Las franjas tachadas no tienen cupo para tantas personas.'
                : 'Las franjas tachadas ya están reservadas por otra unidad.'}
            </span>
          </div>

          <button
            className="boton boton--primario boton--bloque"
            disabled={!franja || cargando || !!cierreDelDia || personas < 1 || personas > zonaElegida.aforo}
            onClick={confirmar}
          >
            {zonaElegida.requiereAprobacion ? 'Solicitar reserva' : 'Confirmar reserva'}
          </button>
        </Modal>
      )}

      {/* RN-112 — Cancelar dentro del plazo: primero se sabe, después se decide. */}
      {cancelando && multaCancelando && (
        <Modal
          titulo="Cancelar fuera de plazo"
          descripcion={`${sel.zona(bd, cancelando.zonaId)?.nombre ?? 'Zona'} · ${formatearFecha(cancelando.fecha)} · ${cancelando.horaInicio} a ${cancelando.horaFin}`}
          onCerrar={() => setCancelando(null)}
        >
          <div className="tarjeta tarjeta--plana tarjeta--alerta" style={{ marginBottom: 'var(--e4)' }}>
            <p>
              Faltan <strong>{multaCancelando.horasRestantes} horas</strong> y esta zona se cancela sin multa hasta{' '}
              {multaCancelando.plazo} horas antes. Si cancelas ahora, puede aplicarse la multa de{' '}
              <strong>{formatearDinero(multaCancelando.concepto.valor)}</strong> («{multaCancelando.concepto.nombre}»,{' '}
              {textoRespaldo(multaCancelando.concepto)}).
            </p>
            <p className="subtitulo" style={{ marginTop: 'var(--e2)' }}>
              No se cobra sola: la administración decide si abre el proceso, y en él puedes presentar descargos.
            </p>
          </div>
          <div className="columna" style={{ gap: 'var(--e2)' }}>
            <button className="boton boton--primario boton--bloque" onClick={() => setCancelando(null)}>
              Conservar mi reserva
            </button>
            <button
              className="boton boton--peligro boton--bloque"
              disabled={cargando}
              onClick={() =>
                void ejecutar((base) => cancelarReserva(base, cancelando.id), 'Reserva cancelada fuera de plazo.').then(
                  (hecho) => {
                    if (hecho) setCancelando(null)
                  },
                )
              }
            >
              Cancelar de todos modos
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
