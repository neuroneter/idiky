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
  pqrsAbierta,
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
  const pqrsAbiertas = sel.pqrsDeUnidad(bd, unidadId).filter(pqrsAbierta)
  const visitantesVigentes = sel
    .visitantesDeUnidad(bd, unidadId)
    .filter((visitante) => estadoRealVisitante(visitante, hoyISO()) === 'activo')

  return (
    <>
      {/* Cartera — CU-R-03 */}
      <Link to="/app/cuenta" className="tarjeta tarjeta--marca">
        <span className="subtitulo">
          {saldo === 0 ? 'Tu unidad esta al dia' : 'Valor adeudado'}
        </span>
        <div className="dato-grande" style={{ margin: 'var(--e1) 0 var(--e2)' }}>
          {formatearDinero(saldo)}
        </div>
        {vencido > 0 ? (
          <span className="chip chip--error">
            {formatearDinero(vencido)} vencido · {mora} dias de mora
          </span>
        ) : proximaCuota ? (
          <span className="subtitulo">
            Proximo vencimiento: {formatearFecha(proximaCuota.fechaVencimiento)}
          </span>
        ) : (
          <span className="subtitulo">No tienes cuotas pendientes</span>
        )}
      </Link>

      {/* Accesos directos a los modulos sin pestana propia */}
      <div className="accesos">
        <Link to="/app/cuenta/pagar" className="acceso-directo">
          <Icono nombre="cuenta" />
          Pagar
        </Link>
        <Link to="/app/visitantes" className="acceso-directo">
          <Icono nombre="visitantes" />
          Visitantes
          {visitantesVigentes.length > 0 && (
            <span className="acceso-directo__contador">{visitantesVigentes.length}</span>
          )}
        </Link>
        <Link to="/app/correspondencia" className="acceso-directo">
          <Icono nombre="correspondencia" />
          Paquetes
          {correspondenciaPendiente.length > 0 && (
            <span className="acceso-directo__contador">{correspondenciaPendiente.length}</span>
          )}
        </Link>
        <Link to="/app/pqrs" className="acceso-directo">
          <Icono nombre="pqrs" />
          Solicitudes
          {pqrsAbiertas.length > 0 && (
            <span className="acceso-directo__contador">{pqrsAbiertas.length}</span>
          )}
        </Link>
      </div>

      {/* Comunicado destacado — CU-R-09, RN-15 */}
      {destacado && (
        <div className="pila">
          <span className="titulo-seccion">De la administracion</span>
          <Link to="/app/comunicados" className="tarjeta tarjeta--accion">
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
          <span className="titulo-seccion">Tu unidad</span>
          <Link to="/app/unidad" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="columna">
                <strong>{etiquetaUnidad(unidad)}</strong>
                <span className="subtitulo">
                  Coeficiente {unidad.coeficiente} % · {unidad.area} m²
                </span>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}

      {/* Proxima reserva — CU-R-05 */}
      <div className="pila">
        <span className="titulo-seccion">Tu proxima reserva</span>
        {reserva && zonaReserva ? (
          <Link to="/app/reservas" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="columna">
                <strong>{zonaReserva.nombre}</strong>
                <span className="subtitulo">
                  {formatearFecha(reserva.fecha)} · {reserva.horaInicio} a {reserva.horaFin}
                </span>
              </div>
              <ChipReserva estado={reserva.estado} />
            </div>
          </Link>
        ) : (
          <Link to="/app/reservas" className="tarjeta tarjeta--accion">
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
          <span className="titulo-seccion">Te espera en porteria</span>
          <Link to="/app/correspondencia" className="tarjeta tarjeta--accion">
            <div className="fila">
              <div className="columna">
                <strong>
                  {correspondenciaPendiente.length}{' '}
                  {correspondenciaPendiente.length === 1 ? 'envio' : 'envios'} sin recoger
                </strong>
                <span className="subtitulo">
                  El mas reciente: {correspondenciaPendiente[0].remitente}
                </span>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </Link>
        </div>
      )}
    </>
  )
}
