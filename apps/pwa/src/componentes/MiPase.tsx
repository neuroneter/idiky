/**
 * RN-367, RN-371, RN-392 — El pase del visitante, en su propia ALICE (BLOKY; adoptadas por Mary,
 * 2026-11-27). Doc: docs/casos-de-uso/residente.md#cu-r-10
 *
 * El visitante entra con su cuenta de IDIKY y aquí ve su pase: un QR firmado que **cambia cada dos
 * minutos** y no se puede reenviar ni guardar en foto. Fuera de su franja de horas no sale.
 */

import { useEffect, useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { VIGENCIA_PASE_MS, codigoPase, estadoRealVisitante, etiquetaUnidad, fueraDeFranja } from '../dominio/reglas'
import { CodigoVisual } from './CodigoVisual'
import { formatearFecha } from '../utilidades/formato'

function horaDe(ms: number): string {
  return new Date(ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota' })
}

export function MiPase() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [ahora, setAhora] = useState(() => Date.now())
  const [emitido, setEmitido] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  // Vencido, se pide uno nuevo solo.
  useEffect(() => {
    if (ahora - emitido >= VIGENCIA_PASE_MS) setEmitido(ahora)
  }, [ahora, emitido])
  if (!sesion) return null
  const mios = bd.visitantes.filter((v) => v.personaVisitanteId === sesion.personaId && estadoRealVisitante(v) !== 'revocado' && estadoRealVisitante(v) !== 'vencido')
  if (mios.length === 0) return null

  return (
    <>
      {mios.map((v) => {
        const unidad = sel.unidad(bd, v.unidadId)
        const activo = estadoRealVisitante(v) === 'activo'
        const fuera = fueraDeFranja(v, horaDe(ahora))
        const segundos = Math.max(0, Math.ceil((VIGENCIA_PASE_MS - (ahora - emitido)) / 1000))
        return (
          <div key={v.id} className="tarjeta" style={{ textAlign: 'center' }}>
            <strong>Tu pase para entrar</strong>
            <p className="subtitulo">
              {unidad ? etiquetaUnidad(unidad) : ''} · hasta el {formatearFecha(v.vigenciaHasta)}
              {v.horaDesde ? `, de ${v.horaDesde} a ${v.horaHasta}` : ''}
            </p>
            {!activo ? (
              <p className="acceso__nota">Tu pase empieza el {formatearFecha(v.vigenciaDesde)}.</p>
            ) : fuera ? (
              <p className="acceso__nota">
                Tu pase es de {v.horaDesde} a {v.horaHasta}. Fuera de esa franja no sale.
              </p>
            ) : (
              <>
                <div style={{ marginTop: 'var(--e2)' }}>
                  <CodigoVisual codigo={codigoPase(v.id, emitido)} tamano={200} />
                </div>
                <p className="subtitulo" style={{ marginTop: 'var(--e2)' }}>
                  Muéstralo en portería. Cambia en {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, '0')}.
                </p>
              </>
            )}
          </div>
        )
      })}
    </>
  )
}
