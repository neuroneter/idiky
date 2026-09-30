/**
 * CU-R-11 — Ver correspondencia pendiente y confirmar que la recibi.
 * Doc: docs/casos-de-uso/residente.md#cu-r-11
 *
 * Quien registra y entrega es porteria (CU-P-01); el residente **confirma** que
 * lo recibio con el boton «Recibido» (RN-103, Mary 2026-10-01): la otra mitad
 * de la cadena de custodia.
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { confirmarRecepcionCorrespondencia } from '../../datos/repositorio'
import { puedeConfirmarRecepcion } from '../../dominio/reglas'
import { Icono } from '../../componentes/Icono'
import { formatearFechaHora } from '../../utilidades/formato'
import { capitalizar } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipCorrespondencia } from '../../componentes/Etiquetas'

export function CorrespondenciaPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const registros = sel.correspondenciaDeUnidad(bd, sesion.unidadActivaId)
  const pendientes = registros.filter((registro) => registro.estado === 'en_porteria')

  if (registros.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin correspondencia"
        detalle="Cuando llegue un paquete o carta a tu nombre, aparecera aquí."
      />
    )
  }

  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver />
      </div>

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
                    {!registro.confirmadoEn && ', según portería'}
                  </span>
                )}
                {registro.confirmadoEn && (
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    Confirmaste que lo recibiste el {formatearFechaHora(registro.confirmadoEn)}
                  </span>
                )}
              </div>
              <div className="columna" style={{ alignItems: 'flex-end', gap: 'var(--e2)' }}>
                {registro.confirmadoEn ? (
                  <span className="chip chip--exito">Recibido</span>
                ) : (
                  <ChipCorrespondencia estado={registro.estado} />
                )}
                {/* RN-103 — El botón que cierra la entrega desde el lado de quien
                    recibe. Aparece mientras no haya confirmado, esté o no
                    entregado según portería: si ya lo tiene en la mano, lo dice. */}
                {puedeConfirmarRecepcion(registro, bd.residencias, sesion.personaId) && (
                  <button
                    className="boton boton--primario boton--pequeno"
                    disabled={cargando}
                    onClick={() =>
                      void ejecutar(
                        (base) =>
                          confirmarRecepcionCorrespondencia(base, {
                            correspondenciaId: registro.id,
                            personaId: sesion.personaId,
                          }),
                        'Listo. Queda registrado que lo recibiste.',
                      )
                    }
                  >
                    <Icono nombre="check" tamano={14} />
                    Recibido
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
