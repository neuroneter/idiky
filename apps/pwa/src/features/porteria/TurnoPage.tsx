/**
 * CU-P-01, CU-P-02 — El puesto de portería: lo primero que se ve al abrir turno.
 * Doc: docs/casos-de-uso/porteria.md
 *
 * **La portería no es una app más pequeña: es un puesto de trabajo.** Alguien de
 * pie, con un paquete en una mano, al que interrumpen cada tres minutos y que le
 * entrega el turno a otra persona a las seis. De ahí sale esta pantalla:
 *
 *  - **Lo pendiente primero.** Los paquetes sin entregar y los visitantes
 *    autorizados de hoy son lo que un turno hereda del anterior. Si hay que
 *    buscarlos, se pierden.
 *  - **Dos acciones, no un menú.** Validar un visitante y registrar un paquete
 *    son el 90 % del día, y van en botones grandes: la otra mano sostiene el
 *    paquete.
 *  - **Todo queda a nombre de quien está en el turno** (RN-52). Por eso el
 *    nombre encabeza la pantalla: no es un saludo, es de quién es la
 *    responsabilidad de lo que se registre en la próxima hora.
 *  - **Las reservas de hoy** (RN-116): quién tiene qué zona, a qué hora y con
 *    cuántas personas, para dejar entrar a los invitados sin llamar a nadie;
 *    con la lista de sus nombres si quien reservó la escribió (RN-126).
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { estadoRealVisitante, etiquetaUnidad, hoyISO, reservasDeHoyParaPorteria } from '../../dominio/reglas'
import { formatearFechaHora } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'

export function TurnoPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const pendientes = sel.correspondenciaPendiente(bd, sesion.copropiedadId)
  const hoy = hoyISO()
  const autorizados = bd.visitantes.filter((v) => estadoRealVisitante(v, hoy) === 'activo')
  const zonas = sel.zonasDe(bd, sesion.copropiedadId)
  const reservasHoy = reservasDeHoyParaPorteria(bd.reservas, zonas, hoy)

  return (
    <div className="pila">
      <div className="tarjeta tarjeta--marca">
        <span className="subtitulo">Turno de {nombreCompleto(persona)}</span>
        <div className="fila" style={{ marginTop: 'var(--e3)', gap: 'var(--e4)' }}>
          <div className="columna">
            <span className="dato-grande numerico">{pendientes.length}</span>
            <span className="subtitulo">
              {pendientes.length === 1 ? 'paquete sin entregar' : 'paquetes sin entregar'}
            </span>
          </div>
          <div className="columna">
            <span className="dato-grande numerico">{autorizados.length}</span>
            <span className="subtitulo">
              {autorizados.length === 1 ? 'visitante autorizado hoy' : 'visitantes autorizados hoy'}
            </span>
          </div>
        </div>
      </div>

      {/* Las dos acciones del día, grandes y antes que cualquier lista. */}
      <div className="acciones-turno">
        <Link to="/porteria/visitantes" className="boton boton--primario accion-turno">
          <Icono nombre="visitantes" tamano={22} />
          Validar visitante
        </Link>
        <Link to="/porteria/correspondencia" className="boton accion-turno">
          <Icono nombre="correspondencia" tamano={22} />
          Registrar paquete
        </Link>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Sin entregar</span>
        {pendientes.length === 0 ? (
          <p className="subtitulo">No queda nada por entregar. El turno arranca limpio.</p>
        ) : (
          <div className="lista">
            {pendientes.slice(0, 6).map((registro) => {
              const unidad = sel.unidad(bd, registro.unidadId)
              return (
                <Link
                  key={registro.id}
                  to="/porteria/correspondencia"
                  className="tarjeta tarjeta--accion tarjeta--plana"
                >
                  <div className="fila">
                    <div className="columna">
                      <strong>{unidad ? etiquetaUnidad(unidad) : 'Unidad no encontrada'}</strong>
                      <span className="subtitulo">
                        {registro.remitente} · {formatearFechaHora(registro.fechaRecepcion)}
                      </span>
                      {/* Quién lo recibió: es el comienzo de la cadena de
                          custodia, y lo primero que se pregunta si algo se
                          pierde (RN-52). */}
                      <span className="subtitulo">Lo recibió {registro.registradoPor}</span>
                    </div>
                    <Icono nombre="chevron" tamano={16} className="tenue" />
                  </div>
                </Link>
              )
            })}
            {pendientes.length > 6 && (
              <Link to="/porteria/correspondencia" className="subtitulo">
                Ver los {pendientes.length}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* RN-116 — Las reservas de hoy: sin costos ni saldos, solo lo que la entrada necesita. */}
      <div className="pila">
        <span className="titulo-seccion">Reservas de hoy</span>
        {reservasHoy.length === 0 ? (
          <p className="subtitulo">Hoy nadie tiene zonas reservadas.</p>
        ) : (
          <div className="lista lista--compacta">
            {reservasHoy.map((reserva) => {
              const zona = sel.zona(bd, reserva.zonaId)
              const unidad = sel.unidad(bd, reserva.unidadId)
              return (
                <div key={reserva.id} className="tarjeta tarjeta--plana">
                  <div className="fila fila-inicio">
                    <div className="columna">
                      <strong>
                        {zona?.nombre} · {reserva.horaInicio} a {reserva.horaFin}
                      </strong>
                      <span className="subtitulo">
                        {unidad ? etiquetaUnidad(unidad) : 'Unidad'} · {nombreCompleto(sel.persona(bd, reserva.personaId))}
                      </span>
                    </div>
                    <span className="chip chip--marca">
                      {reserva.personas ?? 1} {(reserva.personas ?? 1) === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  {/* RN-126 — Los invitados que escribió quien reservó. Se pide el documento en la entrada. */}
                  {reserva.invitados?.length ? (
                    <details style={{ marginTop: 'var(--e2)' }}>
                      <summary className="subtitulo" style={{ cursor: 'pointer' }}>
                        Invitados ({reserva.invitados.length})
                      </summary>
                      <ul className="especificaciones" style={{ marginTop: 'var(--e1)' }}>
                        {reserva.invitados.map((nombre) => (
                          <li key={nombre}>{nombre}</li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <span className="tenue" style={{ fontSize: 'var(--texto-xs)', display: 'block', marginTop: 'var(--e1)' }}>
                      Sin lista de invitados.
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Se dice lo que falta en vez de dejar creer que la app ya lo hace. */}
      <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        El registro de ingresos y salidas —la minuta del turno— todavía no existe: falta decidir
        qué se anota, quién la lee y cuánto se conserva.
      </p>
    </div>
  )
}
