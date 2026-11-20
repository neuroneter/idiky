/**
 * PN-13 — El depósito de un trasteo: en qué va y qué se puede hacer con él.
 * Lo usan la administración (que además puede retener) y portería.
 * Mary, 2026-11-20: «sí, agrégalo».
 */

import { useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import { cerrarDepositoTrasteo, recibirDepositoTrasteo } from '../datos/repositorio'
import { TEXTO_ESTADO_DEPOSITO, estadoDeposito } from '../dominio/reglas'
import type { Trasteo } from '../dominio/tipos'
import { formatearDinero } from '../utilidades/formato'

const CHIP = {
  por_recibir: 'chip chip--info',
  recibido: 'chip chip--marca',
  devuelto: 'chip chip--exito',
  retenido: 'chip chip--alerta',
} as const

/** Lo que se lee del depósito, igual para todos. */
export function TextoDeposito({ trasteo }: { trasteo: Trasteo }) {
  const deposito = trasteo.deposito
  if (!deposito) return null
  const estado = estadoDeposito(deposito)
  return (
    <span className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', flexWrap: 'wrap' }}>
      <span className={CHIP[estado]}>{TEXTO_ESTADO_DEPOSITO[estado]}</span>
      <span className="subtitulo">
        {formatearDinero(deposito.valor)}
        {deposito.cierre?.resultado === 'retenido'
          ? ` · se retuvieron ${formatearDinero(deposito.cierre.valorRetenido ?? 0)}: ${deposito.cierre.motivo}`
          : ''}
      </span>
    </span>
  )
}

/** Los botones: recibir, devolver y —solo la administración— retener. */
export function AccionesDeposito({ trasteo, puedeRetener }: { trasteo: Trasteo; puedeRetener: boolean }) {
  const { ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [reteniendo, setReteniendo] = useState(false)
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState('')
  const deposito = trasteo.deposito
  if (!sesion || !deposito || deposito.cierre) return null
  if (trasteo.estado === 'rechazado' || trasteo.estado === 'cancelado') return null

  if (!deposito.recibido) {
    return (
      <button
        className="boton boton--pequeno"
        style={{ alignSelf: 'flex-start' }}
        disabled={cargando}
        onClick={() =>
          void ejecutar(
            (base) => recibirDepositoTrasteo(base, { trasteoId: trasteo.id, personaId: sesion.personaId }),
            'Depósito recibido.',
          )
        }
      >
        Depósito recibido
      </button>
    )
  }
  if (!trasteo.realizado) return null

  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      <div className="grupo-botones">
        <button
          className="boton boton--pequeno"
          disabled={cargando}
          onClick={() =>
            void ejecutar(
              (base) => cerrarDepositoTrasteo(base, { trasteoId: trasteo.id, personaId: sesion.personaId, resultado: 'devuelto' }),
              'Depósito devuelto. Le avisamos al residente.',
            )
          }
        >
          Devolver el depósito
        </button>
        {puedeRetener && (
          <button className="boton boton--pequeno" onClick={() => setReteniendo(!reteniendo)}>
            Retener por daños
          </button>
        )}
      </div>
      {reteniendo && (
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor={`retenido-${trasteo.id}`}>Valor retenido</label>
            <input id={`retenido-${trasteo.id}`} inputMode="numeric" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor={`motivo-retenido-${trasteo.id}`}>Qué daño cubre</label>
            <input id={`motivo-retenido-${trasteo.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Rayón en la puerta del ascensor" />
          </div>
          <button
            className="boton boton--pequeno"
            disabled={cargando}
            onClick={async () => {
              const hecho = await ejecutar(
                (base) =>
                  cerrarDepositoTrasteo(base, {
                    trasteoId: trasteo.id,
                    personaId: sesion.personaId,
                    resultado: 'retenido',
                    valorRetenido: Number(valor.replace(/[^\d]/g, '')),
                    motivo,
                  }),
                'Depósito cerrado. Le explicamos al residente lo retenido.',
              )
              if (hecho) setReteniendo(false)
            }}
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  )
}
