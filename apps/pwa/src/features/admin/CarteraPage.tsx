/**
 * CU-A-03 — Consultar cartera y morosidad.
 * CU-A-05 — Generar cuotas del periodo.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-03
 *
 * Cartera responde dos preguntas: quien debe y por que. Registrar la plata que
 * entra es el otro modulo (`PagosPage`), para no mezclar la consulta con la caja.
 */

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { generarCuotas, previsualizarCuotas, type ParametrosGeneracion } from '../../datos/repositorio'
import {
  abonadoDeCuota,
  calcularSaldo,
  calcularSaldoVencido,
  cuotaPendiente,
  diasDeMora,
  estadoRealCuota,
  estaEnMora,
  etiquetaUnidad,
  periodoActual,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearFechaHora, formatearPeriodo } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { ChipCuota, ChipPago } from '../../componentes/Etiquetas'
import { EstadoVacio } from '../../componentes/EstadoVacio'

type Filtro = 'todas' | 'mora' | 'al-dia'

export function CarteraPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [unidadDetalle, setUnidadDetalle] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [generacion, setGeneracion] = useState<ParametrosGeneracion>({
    copropiedadId: '',
    periodo: periodoActual(),
    tipo: 'ordinaria',
    concepto: 'Cuota de administracion',
    valor: 45000,
  })

  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)

  const filas = unidades
    .map((unidad) => {
      const cuotas = sel.cuotasDeUnidad(bd, unidad.id)
      const residencia = sel.residenciasDeUnidad(bd, unidad.id)[0]
      return {
        unidad,
        cuotas,
        propietario: residencia
          ? nombreCompleto(sel.persona(bd, residencia.personaId))
          : 'Sin registrar',
        saldo: calcularSaldo(cuotas),
        vencido: calcularSaldoVencido(cuotas),
        mora: diasDeMora(cuotas),
        enMora: estaEnMora(cuotas),
      }
    })
    .filter((fila) => {
      if (filtro === 'mora') return fila.enMora
      if (filtro === 'al-dia') return !fila.enMora
      return true
    })
    .sort((a, b) => b.vencido - a.vencido || b.saldo - a.saldo)

  const totalSaldo = filas.reduce((total, fila) => total + fila.saldo, 0)
  const totalVencido = filas.reduce((total, fila) => total + fila.vencido, 0)

  /** Abonos informados y todavia sin conciliar: no bajan la cartera pero se avisan. */
  const porConciliar = sel.abonosReportados(bd, sesion.copropiedadId)

  const previsualizacion = useMemo(
    () =>
      generando
        ? previsualizarCuotas(bd, { ...generacion, copropiedadId: sesion.copropiedadId })
        : [],
    [bd, generando, generacion, sesion.copropiedadId],
  )

  const detalle = useMemo(() => {
    if (!unidadDetalle) return null
    const unidad = sel.unidad(bd, unidadDetalle)
    if (!unidad) return null
    const cuotas = sel.cuotasDeUnidad(bd, unidadDetalle)
    const residencia = sel.residenciasDeUnidad(bd, unidadDetalle)[0]
    return {
      unidad,
      cuotas,
      recibos: sel.pagosDeUnidad(bd, unidadDetalle).filter((pago) => pago.estado !== 'reportado'),
      propietario: residencia
        ? nombreCompleto(sel.persona(bd, residencia.personaId))
        : 'Sin registrar',
      saldo: calcularSaldo(cuotas),
      vencido: calcularSaldoVencido(cuotas),
    }
  }, [bd, unidadDetalle])

  async function confirmarGeneracion() {
    const creadas = await ejecutar(
      (base) => generarCuotas(base, { ...generacion, copropiedadId: sesion!.copropiedadId }),
      'Cuotas generadas.',
    )
    if (creadas) setGenerando(false)
  }

  return (
    <>
      <div className="fila">
        <div className="filtros">
          {(
            [
              ['todas', 'Todas'],
              ['mora', 'En mora'],
              ['al-dia', 'Al dia'],
            ] as Array<[Filtro, string]>
          ).map(([id, texto]) => (
            <button
              key={id}
              className="filtro"
              aria-pressed={filtro === id}
              onClick={() => setFiltro(id)}
            >
              {texto}
            </button>
          ))}
        </div>
        <button className="boton boton--primario" onClick={() => setGenerando(true)}>
          <Icono nombre="mas" tamano={15} />
          Generar cuotas
        </button>
      </div>

      <div className="rejilla-indicadores">
        <div className="tarjeta">
          <div className="indicador">
            <span className="indicador__etiqueta">Saldo total</span>
            <span className="indicador__valor">{formatearDinero(totalSaldo)}</span>
          </div>
        </div>
        <div className="tarjeta">
          <div className="indicador">
            <span className="indicador__etiqueta">Vencido</span>
            <span className="indicador__valor" style={{ color: 'var(--color-error)' }}>
              {formatearDinero(totalVencido)}
            </span>
          </div>
        </div>
        <div className="tarjeta">
          <div className="indicador">
            <span className="indicador__etiqueta">Unidades listadas</span>
            <span className="indicador__valor">{filas.length}</span>
          </div>
        </div>
      </div>

      {porConciliar.length > 0 && (
        <div className="tarjeta">
          <div className="fila">
            <div className="columna">
              <strong>
                {porConciliar.length} abono{porConciliar.length > 1 ? 's' : ''} sin conciliar
              </strong>
              <span className="subtitulo">
                Esta cartera no los descuenta todavia: hay que aplicarlos en Pagos.
              </span>
            </div>
            <Link to="/admin/pagos" className="boton">
              Ir a Pagos
            </Link>
          </div>
        </div>
      )}

      <div className="tarjeta" style={{ padding: 0 }}>
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Propietario</th>
                <th className="numerico">Saldo</th>
                <th className="numerico">Vencido</th>
                <th className="numerico">Mora</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.unidad.id}>
                  <td>
                    <strong>{etiquetaUnidad(fila.unidad)}</strong>
                  </td>
                  <td className="suave">{fila.propietario}</td>
                  <td className="numerico">{formatearDinero(fila.saldo)}</td>
                  <td
                    className="numerico"
                    style={{ color: fila.vencido ? 'var(--color-error)' : undefined }}
                  >
                    {formatearDinero(fila.vencido)}
                  </td>
                  <td className="numerico suave">{fila.mora ? `${fila.mora} d` : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="boton boton--pequeno"
                      onClick={() => setUnidadDetalle(fila.unidad.id)}
                    >
                      Estado de cuenta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filas.length === 0 && <EstadoVacio titulo="Sin unidades en este filtro" />}
      </div>

      {/* CU-A-03 — estado de cuenta de una unidad */}
      {detalle && (
        <Modal
          titulo={`Estado de cuenta · ${etiquetaUnidad(detalle.unidad)}`}
          descripcion={detalle.propietario}
          onCerrar={() => setUnidadDetalle(null)}
        >
          <div className="rejilla-indicadores">
            <div className="tarjeta tarjeta--plana">
              <div className="indicador">
                <span className="indicador__etiqueta">Saldo</span>
                <span className="indicador__valor">{formatearDinero(detalle.saldo)}</span>
              </div>
            </div>
            <div className="tarjeta tarjeta--plana">
              <div className="indicador">
                <span className="indicador__etiqueta">Vencido</span>
                <span className="indicador__valor" style={{ color: 'var(--color-error)' }}>
                  {formatearDinero(detalle.vencido)}
                </span>
              </div>
            </div>
          </div>

          <div className="separador" />
          <span className="titulo-seccion">Cuotas</span>
          <div className="lista lista--compacta">
            {detalle.cuotas.map((cuota) => {
              const estado = estadoRealCuota(cuota)
              const abonado = abonadoDeCuota(cuota)
              return (
                <div key={cuota.id} className="tarjeta tarjeta--plana">
                  <div className="fila fila-inicio">
                    <div className="columna" style={{ flex: 1 }}>
                      <strong style={{ fontSize: 'var(--texto-sm)' }}>{cuota.concepto}</strong>
                      <span className="subtitulo">
                        {formatearPeriodo(cuota.periodo)} · vence{' '}
                        {formatearFecha(cuota.fechaVencimiento)}
                      </span>
                      {abonado > 0 && cuota.saldo > 0 && (
                        <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                          Abonado {formatearDinero(abonado)} de {formatearDinero(cuota.valor)}
                        </span>
                      )}
                    </div>
                    <div className="columna" style={{ alignItems: 'flex-end' }}>
                      <strong className="numerico">
                        {formatearDinero(cuotaPendiente(cuota) ? cuota.saldo : cuota.valor)}
                      </strong>
                      <ChipCuota estado={estado} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="separador" />
          <span className="titulo-seccion">Recibos de caja</span>
          {detalle.recibos.length === 0 ? (
            <EstadoVacio titulo="Esta unidad no tiene pagos registrados" />
          ) : (
            <div className="lista lista--compacta">
              {detalle.recibos.map((pago) => (
                <div key={pago.id} className="fila">
                  <div className="columna">
                    <strong className="numerico" style={{ fontSize: 'var(--texto-sm)' }}>
                      {pago.recibo}
                    </strong>
                    <span className="subtitulo">{formatearFechaHora(pago.fecha)}</span>
                  </div>
                  <div className="columna" style={{ alignItems: 'flex-end' }}>
                    <strong className="numerico">{formatearDinero(pago.valor)}</strong>
                    <ChipPago estado={pago.estado} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/admin/pagos"
            className="boton boton--primario boton--bloque"
            style={{ marginTop: 'var(--e4)' }}
          >
            Registrar un pago de esta unidad
          </Link>
        </Modal>
      )}

      {/* CU-A-05 */}
      {generando && (
        <Modal
          titulo="Generar cuotas del periodo"
          descripcion="Revisa la previsualizacion antes de confirmar."
          onCerrar={() => setGenerando(false)}
        >
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="periodo">Periodo</label>
              <input
                id="periodo"
                type="month"
                value={generacion.periodo}
                onChange={(evento) =>
                  setGeneracion({ ...generacion, periodo: evento.target.value })
                }
              />
            </div>
            <div className="campo">
              <label htmlFor="tipo-cuota">Tipo</label>
              <select
                id="tipo-cuota"
                value={generacion.tipo}
                onChange={(evento) =>
                  setGeneracion({
                    ...generacion,
                    tipo: evento.target.value as 'ordinaria' | 'extraordinaria',
                    concepto:
                      evento.target.value === 'ordinaria'
                        ? 'Cuota de administracion'
                        : 'Cuota extraordinaria',
                  })
                }
              >
                <option value="ordinaria">Ordinaria</option>
                <option value="extraordinaria">Extraordinaria</option>
              </select>
            </div>
          </div>

          <div className="campo">
            <label htmlFor="concepto">Concepto</label>
            <input
              id="concepto"
              value={generacion.concepto}
              onChange={(evento) => setGeneracion({ ...generacion, concepto: evento.target.value })}
            />
          </div>

          <div className="campo">
            <label htmlFor="valor">
              {generacion.tipo === 'ordinaria'
                ? 'Valor por punto de coeficiente'
                : 'Valor total a prorratear'}
            </label>
            <input
              id="valor"
              type="number"
              min={0}
              value={generacion.valor}
              onChange={(evento) =>
                setGeneracion({ ...generacion, valor: Number(evento.target.value) })
              }
            />
            <span className="ayuda-campo">
              {generacion.tipo === 'ordinaria'
                ? 'El valor de cada unidad es su coeficiente multiplicado por este numero.'
                : 'Se reparte entre las unidades segun su coeficiente (RN-05).'}
            </span>
          </div>

          <div className="separador" />
          <span className="titulo-seccion">Previsualizacion</span>
          <div className="contenedor-tabla" style={{ maxHeight: 220, overflowY: 'auto' }}>
            <table className="tabla">
              <tbody>
                {previsualizacion.map((linea) => (
                  <tr key={linea.unidadId}>
                    <td>{linea.etiqueta}</td>
                    <td className="numerico">{formatearDinero(linea.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="fila" style={{ margin: 'var(--e3) 0' }}>
            <span className="subtitulo">Total a facturar</span>
            <strong className="numerico">
              {formatearDinero(previsualizacion.reduce((total, linea) => total + linea.valor, 0))}
            </strong>
          </div>

          <button
            className="boton boton--primario boton--bloque"
            disabled={cargando}
            onClick={confirmarGeneracion}
          >
            Generar {previsualizacion.length} cuotas
          </button>
        </Modal>
      )}
    </>
  )
}
