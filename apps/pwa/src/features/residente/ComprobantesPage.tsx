/**
 * CU-R-19 — Consultar y descargar mis comprobantes de pago.
 * Doc: docs/casos-de-uso/residente.md#cu-r-19
 *
 * Todos los pagos de la unidad, del más reciente al más antiguo, con su recibo
 * de caja (RN-77). Cada uno se abre, se ve como la hoja que firma la
 * administración y se imprime o guarda en PDF (ADR-0006). Los anulados se
 * siguen viendo, marcados (RN-78); los abonos por conciliar todavía no tienen
 * recibo y se ven en Mi cuenta.
 */

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { ChipPago } from '../../componentes/Etiquetas'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { HojaReciboCaja, TEXTO_MEDIO_PAGO } from '../../componentes/HojaReciboCaja'

export function ComprobantesPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [parametros] = useSearchParams()
  const [abierto, setAbierto] = useState<string | null>(parametros.get('pago'))
  if (!sesion) return null

  const pagos = sel
    .pagosDeUnidad(bd, sesion.unidadActivaId)
    .filter((pago) => pago.estado !== 'reportado' && pago.recibo)
    .sort((a, b) => (b.fechaAplicacion ?? b.fecha).localeCompare(a.fechaAplicacion ?? a.fecha))
  const pago = pagos.find((p) => p.id === abierto)

  return (
    <>
      <Link to="/app/cuenta" className="boton boton--pequeno">
        <Icono nombre="volver" tamano={14} />
        Mi cuenta
      </Link>

      {pagos.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay pagos" detalle="Cuando pagues, aquí quedará tu recibo de caja." />
      ) : (
        <div className="lista lista--compacta">
          {pagos.map((p) => (
            <button
              key={p.id}
              className="tarjeta tarjeta--accion tarjeta--plana"
              style={{ textAlign: 'left' }}
              aria-pressed={p.id === abierto}
              onClick={() => setAbierto(p.id === abierto ? null : p.id)}
            >
              <div className="fila fila-inicio">
                <div className="columna" style={{ flex: 1 }}>
                  <strong className="numerico">{formatearDinero(p.valor)}</strong>
                  <span className="subtitulo">
                    {formatearFecha((p.fechaAplicacion ?? p.fecha).slice(0, 10))} · {TEXTO_MEDIO_PAGO[p.medio]} ·
                    recibo {p.recibo}
                  </span>
                  <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                    {p.imputaciones.length === 1 ? '1 cuota' : `${p.imputaciones.length} cuotas`}
                    {p.origen === 'administracion' ? ' · registrado por la administración' : ''}
                  </span>
                </div>
                <ChipPago estado={p.estado} />
              </div>
            </button>
          ))}
        </div>
      )}

      {pago && (
        <>
          <div className="tarjeta">
            <div className="fila">
              <strong>Recibo de caja {pago.recibo}</strong>
            </div>
            {/* Imprimir es como se obtiene el PDF: el sistema ofrece «Guardar como PDF» (ADR-0006). */}
            <button className="boton boton--primario boton--bloque" onClick={() => window.print()} style={{ marginTop: 'var(--e2)' }}>
              <Icono nombre="certificado" tamano={18} />
              Descargar PDF
            </button>
            <p className="tenue" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--e2)' }}>
              Tu teléfono ofrece «Guardar como PDF»: el recibo queda como archivo para enviarlo o guardarlo.
            </p>
          </div>
          {/* Solo se monta el abierto: así no salen impresos todos juntos. */}
          <div className="previsualizacion-hoja">
            <HojaReciboCaja
              pago={pago}
              copropiedad={sel.copropiedad(bd, sesion.copropiedadId)}
              unidad={sel.unidad(bd, pago.unidadId)}
              propietarios={sel.propietariosDeUnidad(bd, pago.unidadId)}
              cuotaDe={(id) => bd.cuotas.find((c) => c.id === id)}
            />
          </div>
        </>
      )}
    </>
  )
}
