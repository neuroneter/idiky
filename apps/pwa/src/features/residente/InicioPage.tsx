/**
 * CU-R-02 — Ver resumen de mi copropiedad (inicio).
 * Doc: docs/casos-de-uso/residente.md#cu-r-02
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import {
  calcularSaldo,
  calcularSaldoVencido,
  diasDeMora,
  estadoRealVisitante,
  etiquetaUnidad,
  hoyISO,
  solicitudesEsperandoRespuesta,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearFechaCorta } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { ChipComunicado, ChipReserva } from '../../componentes/Etiquetas'

export function InicioPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const unidadId = sesion.unidadActivaId
  const unidad = sel.unidad(bd, unidadId)
  const cuotas = sel.cuotasDeUnidad(bd, unidadId)
  const saldo = calcularSaldo(cuotas)
  const vencido = calcularSaldoVencido(cuotas)
  const mora = diasDeMora(cuotas)
  const proximaCuota = cuotas
    .filter((cuota) => cuota.estado !== 'pagada')
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))[0]

  const comunicados = sel.comunicadosVigentes(bd, sesion.copropiedadId)
  const destacado = comunicados[0]
  const reserva = sel.proximaReserva(bd, unidadId)
  const zonaReserva = reserva ? sel.zona(bd, reserva.zonaId) : undefined
  const correspondenciaPendiente = sel
    .correspondenciaDeUnidad(bd, unidadId)
    .filter((registro) => registro.estado === 'en_porteria')
  // Cuenta la PQRS sin cerrar y la reserva sin aprobar: quien las hizo las vive
  // igual, «pedi algo y no me han contestado».
  const pendientes = solicitudesEsperandoRespuesta(
    sel.pqrsDeUnidad(bd, unidadId),
    sel.reservasDeUnidad(bd, unidadId),
  )
  const visitantesVigentes = sel
    .visitantesDeUnidad(bd, unidadId)
    .filter((visitante) => estadoRealVisitante(visitante, hoyISO()) === 'activo')

  return (
    <>
      {/* Cartera — CU-R-03. Va sobre la zona de marca, sin tarjeta: el monto es
          lo primero que la persona busca y no necesita una caja que lo encierre. */}
      <Link to="/app/cuenta" className="cartera-inicio">
        <span className="cartera-inicio__etiqueta">
          {saldo === 0 ? 'Tu unidad está al día' : 'Valor adeudado'}
        </span>
        <div className="cartera-inicio__monto">{formatearDinero(saldo)}</div>
        {vencido > 0 ? (
          /* Blanco sobre el degradado: el rojo no se lee sobre fucsia. */
          <span className="cartera-inicio__alerta">
            {formatearDinero(vencido)} vencido · {mora} dias de mora
          </span>
        ) : proximaCuota ? (
          <span className="cartera-inicio__etiqueta">
            Proximo vencimiento: {formatearFecha(proximaCuota.fechaVencimiento)}
          </span>
        ) : (
          <span className="cartera-inicio__etiqueta">No tienes cuotas pendientes</span>
        )}
      </Link>

      {/* Accesos directos. Solicitudes se queda aqui (Mary, 2026-08-27): lo que
          habia que unificar no era el sitio, era la identidad. Antes este acceso
          llevaba el icono de PQRS y aterrizaba en el segmento de PQRS, mientras la
          pestana llevaba otro icono y aterrizaba en la vista: se veian como dos
          destinos distintos. Ahora es **el mismo icono, el mismo nombre y el mismo
          destino** que la pestana. */}
      <div className="accesos">
        <Link to="/app/cuenta/pagar" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="cuenta" />
          </span>
          Pagar
        </Link>
        <Link to="/app/visitantes" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="visitantes" />
          </span>
          Visitantes
          {visitantesVigentes.length > 0 && (
            <span className="acceso-directo__contador">{visitantesVigentes.length}</span>
          )}
        </Link>
        <Link to="/app/correspondencia" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="correspondencia" />
          </span>
          Paquetes
          {correspondenciaPendiente.length > 0 && (
            <span className="acceso-directo__contador">{correspondenciaPendiente.length}</span>
          )}
        </Link>
        <Link to="/app/solicitudes" className="acceso-directo">
          <span className="acceso-directo__icono">
            <Icono nombre="solicitudes" />
          </span>
          Solicitudes
          {pendientes > 0 && <span className="acceso-directo__contador">{pendientes}</span>}
        </Link>
      </div>

      {/* Comunicado destacado — CU-R-09, RN-15 */}
      {destacado && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>De la administración</h2>
            <Link to="/app/comunicados">Ver cartelera</Link>
          </div>
          <Link to="/app/comunicados" className="tarjeta tarjeta--accion tarjeta--comunicado">
            <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
              <ChipComunicado categoria={destacado.categoria} />
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {formatearFechaCorta(destacado.fechaPublicacion)}
              </span>
            </div>
            <strong>{destacado.titulo}</strong>
            <p className="subtitulo" style={{ marginTop: 'var(--e1)' }}>
              {destacado.cuerpo.slice(0, 120)}
              {destacado.cuerpo.length > 120 ? '…' : ''}
            </p>
          </Link>
        </div>
      )}

      {/* Mi unidad y su coeficiente — CU-R-24 */}
      {unidad && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>Tu unidad</h2>
          </div>
          <Link to="/app/unidad" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                <span className="marca-tarjeta">
                  <Icono nombre="unidades" tamano={20} />
                </span>
                <div className="columna">
                  <strong>{etiquetaUnidad(unidad)}</strong>
                  <span className="subtitulo">
                    Coeficiente {unidad.coeficiente} % · {unidad.area} m²
                  </span>
                </div>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}

      {/* Proxima reserva — CU-R-05 */}
      <div className="pila">
        <div className="encabezado-seccion">
          <h2>Tu próxima reserva</h2>
          <Link to="/app/solicitudes/reservas">Ver reservas</Link>
        </div>
        {reserva && zonaReserva ? (
          <Link to="/app/solicitudes/reservas" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                {/* Bloque de calendario: una reserva es una fecha, y asi se
                    reconoce sin leer. */}
                <span className="bloque-fecha">
                  <span className="bloque-fecha__dia">{Number(reserva.fecha.slice(8, 10))}</span>
                  <span className="bloque-fecha__mes">
                    {formatearFechaCorta(reserva.fecha).split(' ')[1]}
                  </span>
                </span>
                <div className="columna">
                  <strong>{zonaReserva.nombre}</strong>
                  <span className="subtitulo">
                    {reserva.horaInicio} a {reserva.horaFin}
                  </span>
                </div>
              </div>
              <ChipReserva estado={reserva.estado} />
            </div>
          </Link>
        ) : (
          <Link to="/app/solicitudes/reservas" className="tarjeta tarjeta--accion">
            <div className="fila">
              <span className="subtitulo">No tienes reservas proximas.</span>
              <span className="chip chip--marca">Reservar</span>
            </div>
          </Link>
        )}
      </div>

      {/* Correspondencia — CU-R-11 */}
      {correspondenciaPendiente.length > 0 && (
        <div className="pila">
          <div className="encabezado-seccion">
            <h2>Te espera en portería</h2>
          </div>
          <Link to="/app/correspondencia" className="tarjeta tarjeta--accion tarjeta--pendiente">
            <div className="fila">
              <div className="tarjeta__cuerpo">
                <span className="marca-tarjeta marca-tarjeta--acento">
                  <Icono nombre="correspondencia" tamano={20} />
                </span>
                <div className="columna">
                  <strong>
                    {correspondenciaPendiente.length}{' '}
                    {correspondenciaPendiente.length === 1 ? 'envio' : 'envios'} sin recoger
                  </strong>
                  <span className="subtitulo">
                    El mas reciente: {correspondenciaPendiente[0].remitente}
                  </span>
                </div>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
