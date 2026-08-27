/**
 * CU-A-03 — Consultar cartera y morosidad.
 * CU-A-04 — Registrar un pago manual.
 * CU-A-05 — Generar cuotas del periodo.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-03
 */

import { useMemo, useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  generarCuotas,
  previsualizarCuotas,
  registrarPago,
  type ParametrosGeneracion,
} from '../../datos/repositorio'
import {
  calcularSaldo,
  calcularSaldoVencido,
  cuotaPendiente,
  diasDeMora,
  estaEnMora,
  estadoRealCuota,
  etiquetaUnidad,
  periodoActual,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../../utilidades/formato'
import type { MedioPago } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { ChipCuota } from '../../componentes/Etiquetas'
import { EstadoVacio } from '../../componentes/EstadoVacio'

type Filtro = 'todas' | 'mora' | 'al-dia'

export function CarteraPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [unidadPago, setUnidadPago] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [medio, setMedio] = useState<MedioPago>('transferencia')
  const [referencia, setReferencia] = useState('')
  const [generando, setGenerando] = useState(false)
  const [generacion, setGeneracion] = useState<ParametrosGeneracion>({
    copropiedadId: '',
    periodo: periodoActual(),
    tipo: 'ordinaria',
    concepto: 'Cuota de administración',
    valor: 45000,
  })

  if (!sesion) return null

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const persona = sel.persona(bd, sesion.personaId)

  const filas = unidades
    .map((unidad) => {
      const cuotas = sel.cuotasDeUnidad(bd, unidad.id)
      return {
        unidad,
        cuotas,
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

  const cuotasDelPago = useMemo(() => {
    if (!unidadPago) return []
    return sel
      .cuotasDeUnidad(bd, unidadPago)
      .filter(cuotaPendiente)
      .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento))
  }, [bd, unidadPago])

  const previsualizacion = useMemo(
    () =>
      generando
        ? previsualizarCuotas(bd, { ...generacion, copropiedadId: sesion.copropiedadId })
        : [],
    [bd, generando, generacion, sesion.copropiedadId],
  )

  async function confirmarPago() {
    if (!unidadPago || seleccion.length === 0) {
      mostrarAviso('Selecciona al menos una cuota.', 'error')
      return
    }
    const pago = await ejecutar(
      (base) =>
        registrarPago(base, {
          unidadId: unidadPago,
          cuotaIds: seleccion,
          medio,
          referencia: referencia.trim() || undefined,
          registradoPor: nombreCompleto(persona),
        }),
      'Pago registrado.',
    )
    if (pago) {
      setUnidadPago(null)
      setSeleccion([])
      setReferencia('')
    }
  }

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
              ['al-dia', 'Al día'],
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

      <div className="tarjeta" style={{ padding: 0 }}>
        <div className="contenedor-tabla">
          <table className="tabla">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Residente</th>
                <th className="numerico">Saldo</th>
                <th className="numerico">Vencido</th>
                <th className="numerico">Mora</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => {
                const residencia = sel.residenciasDeUnidad(bd, fila.unidad.id)[0]
                return (
                  <tr key={fila.unidad.id}>
                    <td>
                      <strong>{etiquetaUnidad(fila.unidad)}</strong>
                    </td>
                    <td className="suave">
                      {residencia
                        ? nombreCompleto(sel.persona(bd, residencia.personaId))
                        : 'Sin registrar'}
                    </td>
                    <td className="numerico">{formatearDinero(fila.saldo)}</td>
                    <td className="numerico" style={{ color: fila.vencido ? 'var(--color-error)' : undefined }}>
                      {formatearDinero(fila.vencido)}
                    </td>
                    <td className="numerico suave">{fila.mora ? `${fila.mora} d` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="boton boton--pequeno"
                        disabled={fila.saldo === 0}
                        onClick={() => {
                          setUnidadPago(fila.unidad.id)
                          setSeleccion([])
                        }}
                      >
                        Registrar pago
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filas.length === 0 && <EstadoVacio titulo="Sin unidades en este filtro" />}
      </div>

      {/* CU-A-04 */}
      {unidadPago && (
        <Modal
          titulo="Registrar pago"
          descripcion="Los pagos se imputan a la deuda más antigua primero."
          onCerrar={() => setUnidadPago(null)}
        >
          <div className="lista lista--compacta">
            {cuotasDelPago.map((cuota) => {
              const marcada = seleccion.includes(cuota.id)
              return (
                <label
                  key={cuota.id}
                  className="tarjeta tarjeta--plana"
                  style={{ cursor: 'pointer', borderColor: marcada ? 'var(--color-marca)' : undefined }}
                >
                  <div className="fila">
                    <div className="fila" style={{ gap: 'var(--e3)' }}>
                      <input
                        type="checkbox"
                        checked={marcada}
                        style={{ width: 'auto' }}
                        onChange={() =>
                          setSeleccion((actual) =>
                            marcada
                              ? actual.filter((id) => id !== cuota.id)
                              : [...actual, cuota.id],
                          )
                        }
                      />
                      <div className="columna">
                        <strong style={{ fontSize: 'var(--texto-sm)' }}>{cuota.concepto}</strong>
                        <span className="subtitulo">
                          {formatearPeriodo(cuota.periodo)} · vence{' '}
                          {formatearFecha(cuota.fechaVencimiento)}
                        </span>
                      </div>
                    </div>
                    <div className="columna" style={{ alignItems: 'flex-end' }}>
                      <strong className="numerico">{formatearDinero(cuota.valor)}</strong>
                      <ChipCuota estado={estadoRealCuota(cuota)} />
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="fila-campos" style={{ marginTop: 'var(--e4)' }}>
            <div className="campo">
              <label htmlFor="medio-pago">Medio de pago</label>
              <select
                id="medio-pago"
                value={medio}
                onChange={(evento) => setMedio(evento.target.value as MedioPago)}
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="pse">PSE</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="referencia-pago">Referencia</label>
              <input
                id="referencia-pago"
                value={referencia}
                onChange={(evento) => setReferencia(evento.target.value)}
                placeholder="Número de consignación"
              />
            </div>
          </div>

          <div className="fila" style={{ marginBottom: 'var(--e3)' }}>
            <span className="subtitulo">Total</span>
            <strong className="numerico">
              {formatearDinero(
                cuotasDelPago
                  .filter((cuota) => seleccion.includes(cuota.id))
                  .reduce((total, cuota) => total + cuota.valor, 0),
              )}
            </strong>
          </div>

          <button
            className="boton boton--primario boton--bloque"
            disabled={cargando || seleccion.length === 0}
            onClick={confirmarPago}
          >
            Registrar pago
          </button>
        </Modal>
      )}

      {/* CU-A-05 */}
      {generando && (
        <Modal
          titulo="Generar cuotas del periodo"
          descripcion="Revisa la previsualización antes de confirmar."
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
                        ? 'Cuota de administración'
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
                ? 'El valor de cada unidad es su coeficiente multiplicado por este número.'
                : 'Se reparte entre las unidades según su coeficiente (RN-05).'}
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
