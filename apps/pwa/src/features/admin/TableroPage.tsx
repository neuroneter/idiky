/**
 * CU-A-01 — Ver tablero de indicadores.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-01
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import {
  calcularSaldoVencido,
  estaEnMora,
  etiquetaUnidad,
  periodoActual,
  porcentajeRecaudo,
  pqrsAbierta,
  pqrsFueraDeSla,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../../utilidades/formato'
import { ChipPqrs, ChipReserva } from '../../componentes/Etiquetas'
import { EstadoVacio } from '../../componentes/EstadoVacio'

function Indicador({
  etiqueta,
  valor,
  detalle,
  destino,
}: {
  etiqueta: string
  valor: string
  detalle?: string
  destino: string
}) {
  return (
    <Link to={destino} className="tarjeta tarjeta--accion">
      <div className="indicador">
        <span className="indicador__etiqueta">{etiqueta}</span>
        <span className="indicador__valor">{valor}</span>
        {detalle && <span className="subtitulo">{detalle}</span>}
      </div>
    </Link>
  )
}

export function TableroPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const copropiedadId = sesion.copropiedadId
  const unidades = sel.unidadesDe(bd, copropiedadId)
  const cuotas = sel.cuotasDeCopropiedad(bd, copropiedadId)
  const periodo = periodoActual()

  const recaudo = porcentajeRecaudo(cuotas, periodo)
  const facturadoPeriodo = cuotas
    .filter((cuota) => cuota.periodo === periodo)
    .reduce((total, cuota) => total + cuota.valor, 0)
  const recaudadoPeriodo = cuotas
    .filter((cuota) => cuota.periodo === periodo && cuota.estado === 'pagada')
    .reduce((total, cuota) => total + cuota.valor, 0)

  const carteraVencida = calcularSaldoVencido(cuotas)
  const unidadesEnMora = unidades.filter((unidad) =>
    estaEnMora(cuotas.filter((cuota) => cuota.unidadId === unidad.id)),
  )

  const pqrs = sel.pqrsDeCopropiedad(bd, copropiedadId)
  const pqrsAbiertas = pqrs.filter(pqrsAbierta)
  const pqrsVencidas = pqrs.filter((solicitud) => pqrsFueraDeSla(solicitud))

  const reservas = sel.reservasDeCopropiedad(bd, copropiedadId)
  const reservasPendientes = reservas.filter((reserva) => reserva.estado === 'solicitada')

  const correspondenciaPendiente = sel
    .correspondenciaDeCopropiedad(bd, copropiedadId)
    .filter((registro) => registro.estado === 'en_porteria')

  return (
    <>
      <div className="rejilla-indicadores">
        <Indicador
          etiqueta={`Recaudo ${formatearPeriodo(periodo)}`}
          valor={`${recaudo}%`}
          detalle={`${formatearDinero(recaudadoPeriodo)} de ${formatearDinero(facturadoPeriodo)}`}
          destino="/admin/cartera"
        />
        <Indicador
          etiqueta="Cartera vencida"
          valor={formatearDinero(carteraVencida)}
          detalle={`${unidadesEnMora.length} de ${unidades.length} unidades en mora`}
          destino="/admin/cartera"
        />
        <Indicador
          etiqueta="PQRS abiertas"
          valor={String(pqrsAbiertas.length)}
          detalle={
            pqrsVencidas.length > 0
              ? `${pqrsVencidas.length} fuera del plazo de respuesta`
              : 'Todas dentro del plazo'
          }
          destino="/admin/pqrs"
        />
        <Indicador
          etiqueta="Reservas por aprobar"
          valor={String(reservasPendientes.length)}
          detalle={correspondenciaPendiente.length > 0
            ? `${correspondenciaPendiente.length} envios sin entregar`
            : 'Sin envios pendientes'}
          destino="/admin/reservas"
        />
      </div>

      <div className="tarjeta">
        <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
          <span className="titulo-seccion">Recaudo del periodo</span>
          <strong className="numerico">{recaudo}%</strong>
        </div>
        <div className="barra-progreso">
          <div style={{ width: `${recaudo}%` }} />
        </div>
      </div>

      <div className="rejilla-dos">
        <div className="tarjeta">
          <div className="fila" style={{ marginBottom: 'var(--e3)' }}>
            <span className="titulo-seccion">Reservas por aprobar</span>
            <Link to="/admin/reservas" className="boton boton--pequeno">
              Ver todas
            </Link>
          </div>
          {reservasPendientes.length === 0 ? (
            <EstadoVacio titulo="Nada pendiente" detalle="No hay reservas esperando decision." />
          ) : (
            <div className="lista lista--compacta">
              {reservasPendientes.slice(0, 4).map((reserva) => {
                const zona = sel.zona(bd, reserva.zonaId)
                const unidad = sel.unidad(bd, reserva.unidadId)
                return (
                  <div key={reserva.id} className="fila">
                    <div className="columna">
                      <strong style={{ fontSize: 'var(--texto-sm)' }}>{zona?.nombre}</strong>
                      <span className="subtitulo">
                        {unidad && etiquetaUnidad(unidad)} · {formatearFecha(reserva.fecha)}
                      </span>
                    </div>
                    <ChipReserva estado={reserva.estado} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="tarjeta">
          <div className="fila" style={{ marginBottom: 'var(--e3)' }}>
            <span className="titulo-seccion">PQRS recientes</span>
            <Link to="/admin/pqrs" className="boton boton--pequeno">
              Ver bandeja
            </Link>
          </div>
          {pqrsAbiertas.length === 0 ? (
            <EstadoVacio titulo="Bandeja al dia" detalle="No hay solicitudes abiertas." />
          ) : (
            <div className="lista lista--compacta">
              {pqrsAbiertas.slice(0, 4).map((solicitud) => {
                const unidad = sel.unidad(bd, solicitud.unidadId)
                return (
                  <div key={solicitud.id} className="fila">
                    <div className="columna">
                      <strong style={{ fontSize: 'var(--texto-sm)' }}>{solicitud.asunto}</strong>
                      <span className="subtitulo">
                        {solicitud.radicado} · {unidad && etiquetaUnidad(unidad)}
                      </span>
                    </div>
                    <div className="columna" style={{ alignItems: 'flex-end', gap: 'var(--e1)' }}>
                      <ChipPqrs estado={solicitud.estado} />
                      {pqrsFueraDeSla(solicitud) && <span className="chip chip--error">Vencida</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
