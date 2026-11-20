/**
 * CU-R-41 — El calendario del edificio (PN-07).
 * Doc: docs/casos-de-uso/residente.md#cu-r-41
 *
 * Lo que programó la administración, las asambleas y las fechas propias (la
 * cuota que vence, la reserva confirmada), en un solo lugar.
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { formatearFecha, formatearFechaCorta } from '../../../utilidades/formato'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { EstadoVacio } from '../../../componentes/EstadoVacio'

export function CalendarioPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const filas = sel.calendarioDelEdificio(bd, sesion.copropiedadId, sesion.unidadActivaId)

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/edificio" texto="Tu edificio" />
        <h1 className="titulo">Calendario</h1>
      </div>
      {filas.length === 0 && <EstadoVacio titulo="No hay nada programado" detalle="Aquí verás mantenimientos, cortes y asambleas." />}
      <div className="lista lista--compacta">
        {filas.map((fila) => {
          const contenido = (
            <div className="tarjeta__cuerpo">
              <span className="bloque-fecha">
                <span className="bloque-fecha__dia">{Number(fila.fecha.slice(8, 10))}</span>
                <span className="bloque-fecha__mes">{formatearFechaCorta(fila.fecha).split(' ')[1] ?? ''}</span>
              </span>
              <div className="columna" style={{ flex: 1 }}>
                <strong style={fila.cancelado ? { textDecoration: 'line-through' } : undefined}>{fila.titulo}</strong>
                <span className="subtitulo">
                  {formatearFecha(fila.fecha)}
                  {fila.hora ? ` · ${fila.hora}` : ''}
                </span>
                {fila.cancelado ? (
                  <span className="subtitulo">Cancelado: {fila.cancelado}</span>
                ) : (
                  fila.detalle && <span className="subtitulo">{fila.detalle}</span>
                )}
              </div>
              <span className={fila.tipo === 'evento' ? 'chip chip--info' : 'chip chip--marca'}>{fila.etiqueta}</span>
            </div>
          )
          return fila.enlace ? (
            <Link key={fila.id} to={fila.enlace} className="tarjeta tarjeta--accion tarjeta--plana">
              {contenido}
            </Link>
          ) : (
            <div key={fila.id} className="tarjeta tarjeta--plana">
              {contenido}
            </div>
          )
        })}
      </div>
    </div>
  )
}
