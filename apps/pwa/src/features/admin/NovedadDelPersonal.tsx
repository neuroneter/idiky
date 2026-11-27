/**
 * PN-32 — Aseo, Mantenimiento y el Piscinero registran sus novedades en la minuta del edificio
 * (CU-P-02; Mary, 2026-11-27). Doc: docs/casos-de-uso/administrador.md#cu-a-09
 *
 * Pensado para el celular: el personal camina el edificio, no está en un escritorio. Qué pasó, dónde y
 * una foto si sirve. Mantenimiento puede unirla a una PQRS de daño: quien la radicó ve lo que se hizo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { registrarNovedadDelPersonal } from '../../datos/repositorio'
import { AREA_DEL_CARGO, TEXTO_AREA_NOVEDAD, pqrsAbierta } from '../../dominio/reglas'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { formatearFechaHora } from '../../utilidades/formato'

export function RegistrarNovedadDelPersonal() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [texto, setTexto] = useState('')
  const [lugar, setLugar] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [pqrsId, setPqrsId] = useState('')
  if (!sesion) return null
  const area = sesion.cargo ? AREA_DEL_CARGO[sesion.cargo] : undefined
  if (!area) return null
  // Mantenimiento atiende las PQRS abiertas: ve toda la bandeja (RN-380; Mary, 2026-11-27).
  const deDanos =
    area === 'mantenimiento' ? bd.pqrs.filter((p) => p.copropiedadId === sesion.copropiedadId && pqrsAbierta(p)) : []

  return (
    <div className="tarjeta">
      <strong>Registrar una novedad · {TEXTO_AREA_NOVEDAD[area]}</strong>
      <p className="subtitulo">Queda en la minuta del edificio, con la hora y tu nombre.</p>
      <div className="campo" style={{ marginTop: 'var(--e2)' }}>
        <label htmlFor="novedad-lugar">Dónde</label>
        <input id="novedad-lugar" value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Torre 2, piso 5" />
      </div>
      <div className="campo">
        <label htmlFor="novedad-texto">Qué pasó o qué hiciste</label>
        <textarea id="novedad-texto" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <CapturaFoto etiqueta="Foto (opcional)" ayuda="Sirve para ver cómo quedó." valor={foto} alCambiar={setFoto} />
      {deDanos.length > 0 && (
        <div className="campo">
          <label htmlFor="novedad-pqrs">¿Atendiste una PQRS de daño?</label>
          <select id="novedad-pqrs" value={pqrsId} onChange={(e) => setPqrsId(e.target.value)}>
            <option value="">No</option>
            {deDanos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.radicado} · {p.asunto}
              </option>
            ))}
          </select>
          <span className="ayuda-campo">Quien la radicó ve lo que hiciste. La cierra la administración.</span>
        </div>
      )}
      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando}
        onClick={async () => {
          const hecho = await ejecutar(
            (base) =>
              registrarNovedadDelPersonal(base, {
                copropiedadId: sesion.copropiedadId,
                personaId: sesion.personaId,
                texto,
                lugar,
                ...(foto ? { foto: { imagen: foto, adjuntadoEn: new Date().toISOString() } } : {}),
                ...(pqrsId ? { pqrsId } : {}),
              }),
            'Novedad registrada en la minuta.',
          )
          if (hecho) {
            setTexto('')
            setLugar('')
            setFoto(null)
            setPqrsId('')
          }
        }}
      >
        Registrar novedad
      </button>
    </div>
  )
}

/** PN-32 — Las novedades del personal, para la administración y para quien las registró. */
export function NovedadesDelPersonal({ soloMias = false }: { soloMias?: boolean }) {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const lista = sel.novedadesDelPersonal(bd, sesion.copropiedadId).filter((n) => !soloMias || n.registradaPor === sesion.personaId)
  if (lista.length === 0) return null
  return (
    <div className="tarjeta tarjeta--plana">
      <strong>{soloMias ? 'Tus novedades' : 'Novedades del personal'}</strong>
      <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
        {lista.slice(0, 20).map((n) => {
          const pqrs = n.pqrsId ? bd.pqrs.find((p) => p.id === n.pqrsId) : undefined
          return (
            <div key={n.id} className="columna" style={{ gap: 2 }}>
              <span>
                <strong>{TEXTO_AREA_NOVEDAD[n.area!]}</strong> · {n.lugar}: {n.texto}
              </span>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {formatearFechaHora(n.registradaEn)} · {sel.nombreCompleto(sel.persona(bd, n.registradaPor))}
                {pqrs ? ` · atendió la ${pqrs.radicado}` : ''}
                {n.foto ? ' · con foto' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
