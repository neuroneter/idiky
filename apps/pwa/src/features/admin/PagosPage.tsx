/**
 * CU-A-04 — Registrar un pago manual.
 * CU-A-18 — Conciliar abonos informados y administrar recibos de caja.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-18
 *
 * Este es el modulo de pagos: la caja de la copropiedad. Tiene dos entradas —
 * lo que el propietario informa (y hay que conciliar) y lo que la
 * administracion recibe directamente — y una salida unica: el recibo de caja.
 */

import { useMemo, useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { anularPago, aplicarPago, registrarPago } from '../../datos/repositorio'
import {
  cuotasPorAntiguedad,
  etiquetaUnidad,
  imputarPago,
  saldoAFavorDelPago,
  sePuedeAnular,
  totalImputado,
} from '../../dominio/reglas'
import type { Cuota, Imputacion, MedioPago, Pago } from '../../dominio/tipos'
import { formatearDinero, formatearFechaHora, formatearPeriodo } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { ChipPago } from '../../componentes/Etiquetas'
import { EstadoVacio } from '../../componentes/EstadoVacio'

type Pestana = 'conciliar' | 'recibos'

/** Reparto en edicion: cuanto se lleva cada cuota. */
type Reparto = Record<string, number>

function repartoDesde(imputaciones: Imputacion[]): Reparto {
  return Object.fromEntries(imputaciones.map((linea) => [linea.cuotaId, linea.valor]))
}

function aImputaciones(reparto: Reparto): Imputacion[] {
  return Object.entries(reparto)
    .filter(([, valor]) => valor > 0)
    .map(([cuotaId, valor]) => ({ cuotaId, valor }))
}

/**
 * Editor del reparto de un abono entre las cuotas de la unidad.
 * Arranca con la sugerencia por antiguedad (RN-06), pero el administrador
 * puede moverlo: es el que sabe que le dijo el propietario.
 */
function EditorReparto({
  cuotas,
  valor,
  reparto,
  onCambio,
}: {
  cuotas: Cuota[]
  valor: number
  reparto: Reparto
  onCambio: (reparto: Reparto) => void
}) {
  const repartido = totalImputado(aImputaciones(reparto))
  const aFavor = saldoAFavorDelPago(valor, aImputaciones(reparto))
  const excedido = repartido > valor

  return (
    <>
      <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
        <span className="titulo-seccion">Como se aplica</span>
        <button
          className="boton boton--pequeno"
          onClick={() => onCambio(repartoDesde(imputarPago(cuotas, valor)))}
        >
          Sugerir por antiguedad
        </button>
      </div>

      {cuotas.length === 0 ? (
        <EstadoVacio
          titulo="La unidad no tiene cuotas pendientes"
          detalle="El pago quedara completo como saldo a favor."
        />
      ) : (
        <div className="lista lista--compacta">
          {cuotas.map((cuota) => (
            <div key={cuota.id} className="tarjeta tarjeta--plana">
              <div className="fila fila-inicio">
                <div className="columna" style={{ flex: 1 }}>
                  <strong style={{ fontSize: 'var(--texto-sm)' }}>{cuota.concepto}</strong>
                  <span className="subtitulo">
                    {formatearPeriodo(cuota.periodo)} · debe {formatearDinero(cuota.saldo)}
                  </span>
                </div>
                <div className="campo" style={{ width: 140, marginBottom: 0 }}>
                  <input
                    type="number"
                    min={0}
                    max={cuota.saldo}
                    className="numerico"
                    aria-label={`Valor a aplicar a ${cuota.concepto}`}
                    value={reparto[cuota.id] ?? 0}
                    onChange={(evento) =>
                      onCambio({ ...reparto, [cuota.id]: Number(evento.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="separador" />
      <div className="fila">
        <span className="subtitulo">Repartido</span>
        <strong className="numerico" style={{ color: excedido ? 'var(--color-error)' : undefined }}>
          {formatearDinero(repartido)} de {formatearDinero(valor)}
        </strong>
      </div>
      {aFavor > 0 && (
        <div className="fila">
          <span className="subtitulo">Queda a favor de la unidad</span>
          <strong className="numerico">{formatearDinero(aFavor)}</strong>
        </div>
      )}
      {excedido && (
        <p className="ayuda-campo" style={{ color: 'var(--color-error)' }}>
          Estas repartiendo mas de lo que se recibio.
        </p>
      )}
    </>
  )
}

export function PagosPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [pestana, setPestana] = useState<Pestana>('conciliar')
  const [conciliando, setConciliando] = useState<Pago | null>(null)
  const [reciboAbierto, setReciboAbierto] = useState<Pago | null>(null)
  const [registrando, setRegistrando] = useState(false)
  const [reparto, setReparto] = useState<Reparto>({})
  const [motivoAnulacion, setMotivoAnulacion] = useState('')

  // Formulario de pago manual (CU-A-04).
  const [unidadId, setUnidadId] = useState('')
  const [valor, setValor] = useState(0)
  const [medio, setMedio] = useState<MedioPago>('transferencia')
  const [referencia, setReferencia] = useState('')

  if (!sesion) return null

  const persona = sel.persona(bd, sesion.personaId)
  const porConciliar = sel.abonosReportados(bd, sesion.copropiedadId)
  const recibos = sel.recibosEmitidos(bd, sesion.copropiedadId)
  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)

  const totalPorConciliar = porConciliar.reduce((total, pago) => total + pago.valor, 0)
  const totalAplicado = recibos
    .filter((pago) => pago.estado === 'aplicado')
    .reduce((total, pago) => total + pago.valor, 0)

  /** Cuotas con saldo de la unidad involucrada en el modal que este abierto. */
  const unidadEnFoco = conciliando?.unidadId ?? unidadId
  const cuotasDelReparto = useMemo(
    () => cuotasPorAntiguedad(sel.cuotasDeUnidad(bd, unidadEnFoco)),
    [bd, unidadEnFoco],
  )

  function abrirConciliacion(pago: Pago) {
    const cuotas = cuotasPorAntiguedad(sel.cuotasDeUnidad(bd, pago.unidadId))
    setConciliando(pago)
    setReparto(repartoDesde(imputarPago(cuotas, pago.valor)))
  }

  function abrirRegistro() {
    const primera = unidades[0]?.id ?? ''
    setUnidadId(primera)
    setValor(0)
    setReferencia('')
    setReparto({})
    setRegistrando(true)
  }

  function cambiarUnidadDelPago(nuevaUnidad: string) {
    setUnidadId(nuevaUnidad)
    setReparto({})
  }

  function cambiarValorDelPago(nuevoValor: number) {
    setValor(nuevoValor)
    const cuotas = cuotasPorAntiguedad(sel.cuotasDeUnidad(bd, unidadId))
    setReparto(repartoDesde(imputarPago(cuotas, nuevoValor)))
  }

  async function confirmarConciliacion() {
    if (!conciliando) return
    const aplicado = await ejecutar(
      (base) =>
        aplicarPago(base, {
          pagoId: conciliando.id,
          imputaciones: aImputaciones(reparto),
          aplicadoPor: nombreCompleto(persona),
        }),
      'Abono aplicado y recibo de caja emitido.',
    )
    if (aplicado) {
      setConciliando(null)
      setReciboAbierto(aplicado)
    }
  }

  async function confirmarRegistro() {
    if (!unidadId) {
      mostrarAviso('Selecciona la unidad que pago.', 'error')
      return
    }
    const pago = await ejecutar(
      (base) =>
        registrarPago(base, {
          unidadId,
          valor,
          medio,
          referencia,
          registradoPor: nombreCompleto(persona),
          imputaciones: aImputaciones(reparto),
        }),
      'Pago registrado y recibo de caja emitido.',
    )
    if (pago) {
      setRegistrando(false)
      setReciboAbierto(pago)
    }
  }

  async function confirmarAnulacion() {
    if (!reciboAbierto) return
    const anulado = await ejecutar(
      (base) => anularPago(base, { pagoId: reciboAbierto.id, motivo: motivoAnulacion }),
      'Recibo anulado. El saldo volvio a las cuotas.',
    )
    if (anulado) {
      setReciboAbierto(null)
      setMotivoAnulacion('')
    }
  }

  /** Nombre del residente vinculado a la unidad, para leer la cartera "por cliente". */
  function propietarioDe(unidadIdBuscado: string): string {
    const residencia = sel.residenciasDeUnidad(bd, unidadIdBuscado)[0]
    return residencia ? nombreCompleto(sel.persona(bd, residencia.personaId)) : 'Sin registrar'
  }

  function etiquetaDeUnidad(unidadIdBuscado: string): string {
    const unidad = sel.unidad(bd, unidadIdBuscado)
    return unidad ? etiquetaUnidad(unidad) : unidadIdBuscado
  }

  return (
    <>
      <div className="fila">
        <div className="filtros">
          <button
            className="filtro"
            aria-pressed={pestana === 'conciliar'}
            onClick={() => setPestana('conciliar')}
          >
            Por conciliar {porConciliar.length > 0 && `(${porConciliar.length})`}
          </button>
          <button
            className="filtro"
            aria-pressed={pestana === 'recibos'}
            onClick={() => setPestana('recibos')}
          >
            Recibos de caja
          </button>
        </div>
        <button className="boton boton--primario" onClick={abrirRegistro}>
          <Icono nombre="mas" tamano={15} />
          Registrar pago
        </button>
      </div>

      <div className="rejilla-indicadores">
        <div className="tarjeta">
          <div className="indicador">
            <span className="indicador__etiqueta">Abonos por conciliar</span>
            <span className="indicador__valor">{formatearDinero(totalPorConciliar)}</span>
          </div>
        </div>
        <div className="tarjeta">
          <div className="indicador">
            <span className="indicador__etiqueta">Recaudo aplicado</span>
            <span className="indicador__valor">{formatearDinero(totalAplicado)}</span>
          </div>
        </div>
        <div className="tarjeta">
          <div className="indicador">
            <span className="indicador__etiqueta">Recibos emitidos</span>
            <span className="indicador__valor">{recibos.length}</span>
          </div>
        </div>
      </div>

      {/* CU-A-18 — bandeja de abonos informados por los propietarios */}
      {pestana === 'conciliar' &&
        (porConciliar.length === 0 ? (
          <EstadoVacio
            titulo="No hay abonos por conciliar"
            detalle="Cuando un propietario informe un pago desde su app aparecera aqui."
          />
        ) : (
          <div className="lista">
            {porConciliar.map((pago) => (
              <div key={pago.id} className="tarjeta">
                <div className="fila fila-inicio">
                  <div className="columna" style={{ flex: 1 }}>
                    <div className="fila" style={{ gap: 'var(--e2)', justifyContent: 'flex-start' }}>
                      <strong>{etiquetaDeUnidad(pago.unidadId)}</strong>
                      <ChipPago estado={pago.estado} />
                    </div>
                    <span className="subtitulo">
                      {propietarioDe(pago.unidadId)} · {formatearFechaHora(pago.fecha)} ·{' '}
                      {pago.medio} {pago.referencia}
                    </span>
                  </div>
                  <strong className="numerico dato-grande">{formatearDinero(pago.valor)}</strong>
                </div>

                {pago.conceptoInformado && (
                  <div className="cita-abono">
                    <span className="indicador__etiqueta">El propietario informa</span>
                    <p>{pago.conceptoInformado}</p>
                    {pago.cuotasInformadas && pago.cuotasInformadas.length > 0 && (
                      <span className="subtitulo">
                        Senala {pago.cuotasInformadas.length} cuota
                        {pago.cuotasInformadas.length > 1 ? 's' : ''} en particular.
                      </span>
                    )}
                  </div>
                )}

                <div className="grupo-botones" style={{ marginTop: 'var(--e3)' }}>
                  <button className="boton boton--primario" onClick={() => abrirConciliacion(pago)}>
                    Conciliar y aplicar
                  </button>
                  <button
                    className="boton"
                    onClick={() => {
                      setReciboAbierto(pago)
                      setMotivoAnulacion('')
                    }}
                  >
                    Ver y anular
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* Libro de recibos de caja */}
      {pestana === 'recibos' && (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Recibo</th>
                  <th>Unidad</th>
                  <th>Propietario</th>
                  <th>Fecha</th>
                  <th className="numerico">Valor</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recibos.map((pago) => (
                  <tr key={pago.id}>
                    <td>
                      <strong className="numerico">{pago.recibo ?? '—'}</strong>
                    </td>
                    <td>{etiquetaDeUnidad(pago.unidadId)}</td>
                    <td className="suave">{propietarioDe(pago.unidadId)}</td>
                    <td className="suave">{formatearFechaHora(pago.fecha)}</td>
                    <td className="numerico">{formatearDinero(pago.valor)}</td>
                    <td>
                      <ChipPago estado={pago.estado} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="boton boton--pequeno"
                        onClick={() => {
                          setReciboAbierto(pago)
                          setMotivoAnulacion('')
                        }}
                      >
                        Ver recibo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recibos.length === 0 && <EstadoVacio titulo="Todavia no se ha emitido ningun recibo" />}
        </div>
      )}

      {/* Conciliacion de un abono informado */}
      {conciliando && (
        <Modal
          titulo={`Conciliar abono de ${etiquetaDeUnidad(conciliando.unidadId)}`}
          descripcion="Revisa lo que informo el propietario y decide como se aplica."
          onCerrar={() => setConciliando(null)}
        >
          <div className="fila">
            <span className="subtitulo">Valor recibido</span>
            <strong className="numerico dato-grande">{formatearDinero(conciliando.valor)}</strong>
          </div>
          {conciliando.conceptoInformado && (
            <div className="cita-abono" style={{ marginTop: 'var(--e3)' }}>
              <span className="indicador__etiqueta">El propietario informa</span>
              <p>{conciliando.conceptoInformado}</p>
            </div>
          )}

          <div className="separador" />
          <EditorReparto
            cuotas={cuotasDelReparto}
            valor={conciliando.valor}
            reparto={reparto}
            onCambio={setReparto}
          />

          <button
            className="boton boton--primario boton--bloque"
            style={{ marginTop: 'var(--e4)' }}
            disabled={cargando}
            onClick={confirmarConciliacion}
          >
            Aplicar y emitir recibo
          </button>
        </Modal>
      )}

      {/* CU-A-04 — pago manual */}
      {registrando && (
        <Modal
          titulo="Registrar pago"
          descripcion="Para pagos que llegaron por fuera de la app: consignacion, efectivo o transferencia."
          onCerrar={() => setRegistrando(false)}
        >
          <div className="campo">
            <label htmlFor="unidad-pago">Unidad</label>
            <select
              id="unidad-pago"
              value={unidadId}
              onChange={(evento) => cambiarUnidadDelPago(evento.target.value)}
            >
              {unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {etiquetaUnidad(unidad)} — {propietarioDe(unidad.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="valor-pago">Valor recibido</label>
              <input
                id="valor-pago"
                type="number"
                min={0}
                value={valor}
                onChange={(evento) => cambiarValorDelPago(Number(evento.target.value))}
              />
            </div>
            <div className="campo">
              <label htmlFor="medio-pago">Medio</label>
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
          </div>

          <div className="campo">
            <label htmlFor="referencia-pago">Referencia</label>
            <input
              id="referencia-pago"
              value={referencia}
              onChange={(evento) => setReferencia(evento.target.value)}
              placeholder="Numero de consignacion"
            />
          </div>

          <div className="separador" />
          <EditorReparto
            cuotas={cuotasDelReparto}
            valor={valor}
            reparto={reparto}
            onCambio={setReparto}
          />

          <button
            className="boton boton--primario boton--bloque"
            style={{ marginTop: 'var(--e4)' }}
            disabled={cargando || valor <= 0}
            onClick={confirmarRegistro}
          >
            Registrar y emitir recibo
          </button>
        </Modal>
      )}

      {/* Detalle del recibo de caja */}
      {reciboAbierto && (
        <Modal
          titulo={reciboAbierto.recibo ? `Recibo ${reciboAbierto.recibo}` : 'Abono por conciliar'}
          descripcion={`${etiquetaDeUnidad(reciboAbierto.unidadId)} · ${propietarioDe(reciboAbierto.unidadId)}`}
          onCerrar={() => setReciboAbierto(null)}
        >
          <div className="lista lista--compacta">
            <div className="fila">
              <span className="subtitulo">Valor</span>
              <strong className="numerico">{formatearDinero(reciboAbierto.valor)}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Medio y referencia</span>
              <span>
                {reciboAbierto.medio} · {reciboAbierto.referencia}
              </span>
            </div>
            <div className="fila">
              <span className="subtitulo">Fecha</span>
              <span>{formatearFechaHora(reciboAbierto.fecha)}</span>
            </div>
            <div className="fila">
              <span className="subtitulo">Estado</span>
              <ChipPago estado={reciboAbierto.estado} />
            </div>
            <div className="fila">
              <span className="subtitulo">Registrado por</span>
              <span>{reciboAbierto.registradoPor}</span>
            </div>
          </div>

          {reciboAbierto.conceptoInformado && (
            <div className="cita-abono" style={{ marginTop: 'var(--e3)' }}>
              <span className="indicador__etiqueta">El propietario informo</span>
              <p>{reciboAbierto.conceptoInformado}</p>
            </div>
          )}

          {reciboAbierto.imputaciones.length > 0 && (
            <>
              <div className="separador" />
              <span className="titulo-seccion">Se aplico a</span>
              <div className="lista lista--compacta">
                {reciboAbierto.imputaciones.map((linea) => {
                  const cuota = bd.cuotas.find((c) => c.id === linea.cuotaId)
                  return (
                    <div key={linea.cuotaId} className="fila">
                      <span className="subtitulo">
                        {cuota ? `${cuota.concepto} · ${formatearPeriodo(cuota.periodo)}` : linea.cuotaId}
                      </span>
                      <strong className="numerico">{formatearDinero(linea.valor)}</strong>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {reciboAbierto.saldoAFavor > 0 && (
            <div className="fila" style={{ marginTop: 'var(--e2)' }}>
              <span className="subtitulo">Saldo a favor</span>
              <strong className="numerico">{formatearDinero(reciboAbierto.saldoAFavor)}</strong>
            </div>
          )}

          {reciboAbierto.estado === 'anulado' ? (
            <p className="ayuda-campo" style={{ marginTop: 'var(--e3)' }}>
              Anulado el {formatearFechaHora(reciboAbierto.fechaAnulacion ?? '')}:{' '}
              {reciboAbierto.motivoAnulacion}
            </p>
          ) : (
            <>
              <div className="separador" />
              <div className="campo">
                <label htmlFor="motivo-anulacion">Motivo de anulacion</label>
                <input
                  id="motivo-anulacion"
                  value={motivoAnulacion}
                  onChange={(evento) => setMotivoAnulacion(evento.target.value)}
                  placeholder="Por que se anula este recibo"
                />
                <span className="ayuda-campo">
                  El recibo no se borra: queda anulado y el saldo vuelve a las cuotas (RN-29).
                </span>
              </div>
              <button
                className="boton boton--bloque"
                disabled={cargando || !motivoAnulacion.trim()}
                onClick={confirmarAnulacion}
              >
                {sePuedeAnular(reciboAbierto) ? 'Anular recibo' : 'Descartar abono informado'}
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  )
}
