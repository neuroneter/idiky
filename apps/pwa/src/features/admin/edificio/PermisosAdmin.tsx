/**
 * CU-A-37 — Aprobar los trasteos y las obras en los apartamentos (PN-10, PN-11).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-37
 *
 * Si no se aprueba, se explica con amabilidad para que lo puedan pedir de nuevo.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { decidirPermiso } from '../../../datos/repositorio'
import { TEXTO_ESTADO_PERMISO, etiquetaUnidad, hoyISO } from '../../../dominio/reglas'
import { formatearFecha } from '../../../utilidades/formato'

export function PermisosAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [noAprobando, setNoAprobando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null
  const hoy = hoyISO()
  const trasteos = (bd.trasteos ?? []).filter((t) => t.copropiedadId === sesion.copropiedadId && t.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const obras = (bd.permisosObra ?? []).filter((o) => o.copropiedadId === sesion.copropiedadId && o.hasta >= hoy).sort((a, b) => a.desde.localeCompare(b.desde))

  const decidir = (tipo: 'trasteo' | 'obra', id: string, aprobar: boolean) =>
    ejecutar(
      (base) => decidirPermiso(base, { tipo, id, personaId: sesion.personaId, aprobar, motivo }),
      aprobar ? 'Aprobado. Le avisamos y portería ya lo tiene.' : 'Le avisamos por qué no se aprobó.',
    ).then((hecho) => {
      if (hecho) {
        setNoAprobando(null)
        setMotivo('')
      }
    })

  const acciones = (tipo: 'trasteo' | 'obra', id: string) => (
    <>
      <div className="grupo-botones">
        <button className="boton boton--primario boton--pequeno" disabled={cargando} onClick={() => void decidir(tipo, id, true)}>
          Aprobar
        </button>
        <button className="boton boton--pequeno" onClick={() => setNoAprobando(id)}>
          No aprobar
        </button>
      </div>
      {noAprobando === id && (
        <div className="fila">
          <input aria-label="Por qué no se aprueba" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ese día hay mantenimiento del ascensor" style={{ flex: 1 }} />
          <button className="boton boton--pequeno" disabled={cargando || motivo.trim().length < 10} onClick={() => void decidir(tipo, id, false)}>
            Confirmar
          </button>
        </div>
      )}
    </>
  )

  return (
    <div className="rejilla-dos">
      <div className="tarjeta">
        <strong>Trasteos</strong>
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
          {trasteos.length === 0 && <p className="subtitulo">No hay trasteos próximos.</p>}
          {trasteos.map((t) => {
            const unidad = sel.unidad(bd, t.unidadId)
            return (
              <div key={t.id} className="columna" style={{ gap: 'var(--e1)' }}>
                <div className="fila">
                  <span>
                    {unidad ? etiquetaUnidad(unidad) : ''} · {t.sentido === 'llegada' ? 'llega' : 'se va'} · {formatearFecha(t.fecha)}, {t.horaInicio} a {t.horaFin}
                  </span>
                  <span className="chip">{TEXTO_ESTADO_PERMISO[t.estado]}</span>
                </div>
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  {sel.nombreCompleto(sel.persona(bd, t.personaId))}
                  {t.empresa ? ` · ${t.empresa}` : ''}
                  {t.placa ? ` · placa ${t.placa}` : ''}
                </span>
                {t.estado === 'solicitado' && acciones('trasteo', t.id)}
              </div>
            )
          })}
        </div>
      </div>
      <div className="tarjeta">
        <strong>Obras en los apartamentos</strong>
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
          {obras.length === 0 && <p className="subtitulo">No hay obras.</p>}
          {obras.map((o) => {
            const unidad = sel.unidad(bd, o.unidadId)
            return (
              <div key={o.id} className="columna" style={{ gap: 'var(--e1)' }}>
                <div className="fila fila-inicio">
                  <span>
                    {unidad ? etiquetaUnidad(unidad) : ''} · {o.descripcion}
                  </span>
                  <span className="chip">{TEXTO_ESTADO_PERMISO[o.estado]}</span>
                </div>
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  Del {formatearFecha(o.desde)} al {formatearFecha(o.hasta)} · {o.trabajadores.map((t) => t.nombre).join(', ')}
                </span>
                {o.estado === 'solicitado' && acciones('obra', o.id)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
