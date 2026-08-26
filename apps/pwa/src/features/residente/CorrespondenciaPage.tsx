/**
 * CU-R-11 — Ver correspondencia pendiente.
 * Doc: docs/casos-de-uso/residente.md#cu-r-11
 *
 * Solo lectura: quien registra y entrega es la administracion/porteria (CU-A-09).
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { formatearFechaHora } from '../../utilidades/formato'
import { capitalizar } from '../../utilidades/formato'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipCorrespondencia } from '../../componentes/Etiquetas'

export function CorrespondenciaPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const registros = sel.correspondenciaDeUnidad(bd, sesion.unidadActivaId)
  const pendientes = registros.filter((registro) => registro.estado === 'en_porteria')

  if (registros.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin correspondencia"
        detalle="Cuando llegue un paquete o carta a tu nombre, aparecera aqui."
      />
    )
  }

  return (
    <>
      <div className="tarjeta tarjeta--marca">
        <span className="subtitulo">Te espera en porteria</span>
        <div className="dato-grande" style={{ marginTop: 'var(--e1)' }}>
          {pendientes.length}
        </div>
      </div>

      <div className="lista lista--compacta">
        {registros.map((registro) => (
          <div key={registro.id} className="tarjeta tarjeta--plana">
            <div className="fila fila-inicio">
              <div className="columna" style={{ flex: 1 }}>
                <strong>
                  {capitalizar(registro.tipo)} de {registro.remitente}
                </strong>
                <span className="subtitulo">
                  Recibido el {formatearFechaHora(registro.fechaRecepcion)}
                </span>
                {registro.observaciones && (
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {registro.observaciones}
                  </span>
                )}
                {registro.estado === 'entregada' && registro.fechaEntrega && (
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    Entregado a {registro.recibidoPor} el{' '}
                    {formatearFechaHora(registro.fechaEntrega)}
                  </span>
                )}
              </div>
              <ChipCorrespondencia estado={registro.estado} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
