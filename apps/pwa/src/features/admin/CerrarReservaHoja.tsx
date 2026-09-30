/**
 * CU-A-06 — Cerrar una reserva después del turno (RN-119 a RN-121).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-06
 *
 * Es el momento en que se mueve la plata: ¿se usó o no se presentó? Si se usó,
 * cómo quedó la zona y qué pasa con el depósito. En los dos casos, el cobro por
 * uso va al estado de cuenta; si no se presentó, la administración decide si
 * abre el proceso por la multa.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { cerrarReserva } from '../../datos/repositorio'
import { etiquetaUnidad, motivoCierreReservaInvalido } from '../../dominio/reglas'
import type { Reserva, ZonaComun } from '../../dominio/tipos'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { Modal } from '../../componentes/Modal'
import { CapturaFoto } from '../../componentes/CapturaFoto'

export function CerrarReservaHoja({
  reserva,
  zona,
  alCerrar,
}: {
  reserva: Reserva
  zona: ZonaComun
  alCerrar: () => void
}) {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [resultado, setResultado] = useState<'usada' | 'no_se_presento'>('usada')
  const [estadoZona, setEstadoZona] = useState<'bien' | 'con_novedades'>('bien')
  const [observaciones, setObservaciones] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [retener, setRetener] = useState(0)
  const [motivoRetencion, setMotivoRetencion] = useState('')
  const [abrirProceso, setAbrirProceso] = useState(false)
  const [intento, setIntento] = useState(false)

  const unidad = sel.unidad(bd, reserva.unidadId)
  const concepto = zona.multaNoCancelar
    ? bd.conceptosSancion.find((c) => c.id === zona.multaNoCancelar!.conceptoId)
    : undefined
  const recibido = reserva.depositoRecibidoEn ? (reserva.deposito ?? 0) : 0
  const usada = resultado === 'usada'
  const datos = {
    resultado,
    estadoZona: usada ? estadoZona : undefined,
    observaciones,
    retener: usada && estadoZona === 'con_novedades' ? retener : 0,
    motivoRetencion,
  }
  const invalido = motivoCierreReservaInvalido(reserva, datos)
  const devolver = recibido - (datos.retener ?? 0)

  async function confirmar() {
    setIntento(true)
    if (invalido || !sesion) return
    const hecho = await ejecutar((base) =>
      cerrarReserva(base, {
        reservaId: reserva.id,
        ...datos,
        foto: foto ?? undefined,
        registradoPor: nombreCompleto(sel.persona(bd, sesion.personaId)),
        abrirProceso: !usada && abrirProceso,
      }),
    )
    if (!hecho) return
    const partes = ['Reserva cerrada.']
    if (hecho.cuota) partes.push(`Cobro de ${formatearDinero(hecho.cuota.valor)} en el estado de cuenta.`)
    if (recibido) partes.push(`Depósito: se devuelven ${formatearDinero(hecho.reserva.cierre?.depositoDevuelto ?? 0)}.`)
    if (hecho.sancion) partes.push(`Proceso ${hecho.sancion.radicado} abierto.`)
    mostrarAviso(partes.join(' '), 'exito')
    alCerrar()
  }

  return (
    <Modal
      titulo={`Cerrar reserva de ${zona.nombre}`}
      descripcion={`${formatearFecha(reserva.fecha)} · ${reserva.horaInicio} a ${reserva.horaFin} · ${unidad ? etiquetaUnidad(unidad) : ''} · ${nombreCompleto(sel.persona(bd, reserva.personaId))}`}
      onCerrar={alCerrar}
    >
      <div className="campo">
        <label>¿Qué pasó?</label>
        <div className="grupo-botones">
          <button className="filtro" aria-pressed={usada} onClick={() => setResultado('usada')}>
            Se usó
          </button>
          <button className="filtro" aria-pressed={!usada} onClick={() => setResultado('no_se_presento')}>
            No se presentó
          </button>
        </div>
      </div>

      {usada && (
        <>
          {/* RN-120 — Cómo quedó la zona: es la prueba para el depósito. */}
          <div className="campo">
            <label>¿Cómo quedó la zona?</label>
            <div className="grupo-botones">
              <button className="filtro" aria-pressed={estadoZona === 'bien'} onClick={() => setEstadoZona('bien')}>
                Quedó bien
              </button>
              <button
                className="filtro"
                aria-pressed={estadoZona === 'con_novedades'}
                onClick={() => setEstadoZona('con_novedades')}
              >
                Con daños o faltantes
              </button>
            </div>
          </div>
          {estadoZona === 'con_novedades' && (
            <div className="campo">
              <label htmlFor="cierre-observaciones">Qué se dañó o qué faltó</label>
              <textarea
                id="cierre-observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: dos sillas rotas y el piso manchado de vino."
              />
            </div>
          )}
          <CapturaFoto
            etiqueta="Foto de cómo se recibió (opcional)"
            ayuda="Es la prueba si hay que retener el depósito. Se guarda reducida."
            valor={foto}
            alCambiar={setFoto}
          />
        </>
      )}

      {/* RN-119 — El cobro por uso, que se genera al cerrar. */}
      <div className="tarjeta tarjeta--plana" style={{ margin: 'var(--e3) 0' }}>
        <span className="titulo-seccion">Lo que se mueve</span>
        <ul className="especificaciones" style={{ marginTop: 'var(--e1)' }}>
          <li>
            {reserva.valorUso
              ? `Cobro por uso: ${formatearDinero(reserva.valorUso)} al estado de cuenta de ${unidad ? etiquetaUnidad(unidad) : 'la unidad'}${usada ? '' : ': el turno quedó apartado'}.`
              : 'Sin cobro por uso: la zona era gratis al reservar.'}
          </li>
          {reserva.deposito ? (
            recibido ? (
              <li>
                Depósito de {formatearDinero(recibido)}: se devuelven <strong>{formatearDinero(devolver)}</strong>
                {datos.retener ? ` y se retienen ${formatearDinero(datos.retener)}` : ''}.
              </li>
            ) : (
              <li>El depósito de {formatearDinero(reserva.deposito)} no se registró como recibido.</li>
            )
          ) : null}
        </ul>
      </div>

      {usada && estadoZona === 'con_novedades' && recibido > 0 && (
        <>
          <div className="campo">
            <label htmlFor="cierre-retener">Retener del depósito ($)</label>
            <input
              id="cierre-retener"
              type="number"
              min={0}
              max={recibido}
              step={1000}
              inputMode="numeric"
              value={retener}
              onChange={(e) => setRetener(Number(e.target.value))}
            />
            <span className="ayuda-campo">Hasta {formatearDinero(recibido)}. En 0, se devuelve completo.</span>
          </div>
          {retener > 0 && (
            <div className="campo">
              <label htmlFor="cierre-motivo-retencion">Por qué se retiene</label>
              <textarea
                id="cierre-motivo-retencion"
                value={motivoRetencion}
                onChange={(e) => setMotivoRetencion(e.target.value)}
                placeholder="Ej: reposición de dos sillas, según la cotización del proveedor."
              />
            </div>
          )}
        </>
      )}

      {/* RN-121 — No se presentó: la administración decide si abre el proceso. */}
      {!usada && concepto && (
        <label className="fila fila-inicio" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
          <input type="checkbox" checked={abrirProceso} onChange={(e) => setAbrirProceso(e.target.checked)} />
          <span>
            <strong>Abrir el proceso por la multa</strong>
            <span className="subtitulo" style={{ display: 'block' }}>
              «{concepto.nombre}», {formatearDinero(concepto.valor)}. Se le notifica y puede presentar descargos.
            </span>
          </span>
        </label>
      )}

      {intento && invalido && (
        <p className="ayuda-campo" style={{ color: 'var(--color-error)', marginBottom: 'var(--e2)' }}>
          {invalido}
        </p>
      )}
      <button className="boton boton--primario boton--bloque" disabled={cargando} onClick={() => void confirmar()}>
        Cerrar reserva
      </button>
    </Modal>
  )
}
