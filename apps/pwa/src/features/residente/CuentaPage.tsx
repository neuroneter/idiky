/**
 * CU-R-03 — Consultar estado de cuenta.
 * Doc: docs/casos-de-uso/residente.md#cu-r-03
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { calcularSaldo, calcularSaldoVencido, diasDeMora, estadoRealCuota } from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../../utilidades/formato'
import { ChipCuota } from '../../componentes/Etiquetas'
import { EstadoVacio } from '../../componentes/EstadoVacio'

type Filtro = 'todas' | 'pendientes' | 'pagadas'

const FILTROS: Array<{ id: Filtro; texto: string }> = [
  { id: 'todas', texto: 'Todas' },
  { id: 'pendientes', texto: 'Por pagar' },
  { id: 'pagadas', texto: 'Pagadas' },
]

export function CuentaPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  if (!sesion) return null

  const cuotas = sel.cuotasDeUnidad(bd, sesion.unidadActivaId)
  const saldo = calcularSaldo(cuotas)
  const vencido = calcularSaldoVencido(cuotas)
  const mora = diasDeMora(cuotas)

  const visibles = cuotas.filter((cuota) => {
    if (filtro === 'pendientes') return cuota.estado !== 'pagada'
    if (filtro === 'pagadas') return cuota.estado === 'pagada'
    return true
  })

  return (
    <>
      <div className="tarjeta">
        {/* El mismo nombre que en el inicio. "Saldo" es lenguaje contable y se
            queda en la consola, donde quien lee es el administrador. */}
        <span className="indicador__etiqueta">Valor adeudado</span>
        <div className="dato-grande" style={{ margin: 'var(--e1) 0' }}>
          {formatearDinero(saldo)}
        </div>
        {vencido > 0 ? (
          <p className="subtitulo">
            De ese total, <strong>{formatearDinero(vencido)}</strong> está vencido
            {mora > 0 && ` (${mora} dias de mora)`}.
          </p>
        ) : (
          <p className="subtitulo">Tu unidad no tiene cuotas vencidas.</p>
        )}
        {saldo > 0 && (
          <Link
            to="/app/cuenta/pagar"
            className="boton boton--primario boton--bloque"
            style={{ marginTop: 'var(--e3)' }}
          >
            Pagar
          </Link>
        )}
      </div>

      <div className="filtros">
        {FILTROS.map((opcion) => (
          <button
            key={opcion.id}
            className="filtro"
            aria-pressed={filtro === opcion.id}
            onClick={() => setFiltro(opcion.id)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio
          titulo="No hay movimientos"
          detalle="Cuando la administración genere cuotas aparecerán aquí."
        />
      ) : (
        <div className="lista lista--compacta">
          {visibles.map((cuota) => {
            const estado = estadoRealCuota(cuota)
            const pago = sel.pagoPorId(bd, cuota.pagoId)
            return (
              <div key={cuota.id} className="tarjeta tarjeta--plana">
                <div className="fila fila-inicio">
                  <div className="columna" style={{ flex: 1 }}>
                    <strong>{cuota.concepto}</strong>
                    <span className="subtitulo">
                      {formatearPeriodo(cuota.periodo)} · vence{' '}
                      {formatearFecha(cuota.fechaVencimiento)}
                    </span>
                    {pago && (
                      <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                        Comprobante {pago.comprobante}
                      </span>
                    )}
                  </div>
                  <div className="columna" style={{ alignItems: 'flex-end' }}>
                    <strong className="numerico">{formatearDinero(cuota.valor)}</strong>
                    <ChipCuota estado={estado} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
