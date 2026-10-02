/**
 * CU-A-29 — Ver la ocupación de las zonas comunes en un calendario.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-29
 *
 * La semana de una zona de un vistazo (Mary, 2026-10-01: «con el 7»): los días
 * en columnas y los turnos en filas. Cada casilla dice si está libre, quién la
 * tiene y con cuántas personas, cuánto lleva el turno compartido o si está
 * cerrada por mantenimiento. Sirve para ver cuándo se llena el salón, qué días
 * nadie usa la cancha, y dónde cabe un mantenimiento sin cancelarle a nadie.
 *
 * Es una vista: no cambia ninguna regla. Junta RN-09, RN-108, RN-111 y RN-114.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  celdaCalendario,
  DIAS_CORTOS,
  diaDeLaSemana,
  etiquetaUnidad,
  franjasDeLaSemana,
  hoyISO,
  lunesDeLaSemana,
  ocupacionDeLaSemana,
  sumarDias,
  zonaActiva,
  zonaCompartida,
  type CeldaCalendario,
} from '../../dominio/reglas'
import type { Reserva } from '../../dominio/tipos'
import { formatearFecha } from '../../utilidades/formato'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipReserva } from '../../componentes/Etiquetas'
import { Modal } from '../../componentes/Modal'

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** `2026-10-05` → `Lun 5 oct`. */
function encabezadoDia(fecha: string): string {
  const [, mes, dia] = fecha.split('-')
  return `${DIAS_CORTOS[diaDeLaSemana(fecha)]} ${Number(dia)} ${MESES_CORTOS[Number(mes) - 1]}`
}

/** El color de la casilla sale de los tokens: se lee igual en claro y en oscuro. */
function estiloCelda(celda: CeldaCalendario, compartida: boolean, aforo: number, pasada: boolean) {
  const base = { opacity: pasada ? 0.55 : 1 }
  if (celda.tipo === 'no_abre') return { ...base, background: 'var(--color-superficie-2)', color: 'var(--color-texto-tenue)' }
  if (celda.tipo === 'cerrada') return { ...base, background: 'var(--color-alerta-suave)', color: 'var(--color-alerta)' }
  if (celda.tipo === 'libre') return { ...base, background: 'var(--color-exito-suave)', color: 'var(--color-exito)' }
  const lleno = !compartida || celda.personas >= aforo
  return lleno
    ? { ...base, background: 'var(--color-marca-suave)', color: 'var(--color-marca)' }
    : { ...base, background: 'var(--color-info-suave)', color: 'var(--color-info)' }
}

export function CalendarioZonasPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const zonas = sesion ? sel.zonasDe(bd, sesion.copropiedadId).filter(zonaActiva) : []
  const [zonaId, setZonaId] = useState(zonas[0]?.id ?? '')
  const [lunes, setLunes] = useState(lunesDeLaSemana(hoyISO()))
  /** La casilla que el administrador abrió para ver quién la tiene. */
  const [detalle, setDetalle] = useState<{ fecha: string; inicio: string; fin: string; reservas: Reserva[] } | null>(null)

  if (!sesion) return null
  if (zonas.length === 0) {
    return <EstadoVacio titulo="No hay zonas activas" detalle="Crea una zona en la pestaña Zonas comunes." />
  }

  const zona = zonas.find((z) => z.id === zonaId) ?? zonas[0]
  const compartida = zonaCompartida(zona)
  const hoy = hoyISO()
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
  const franjas = franjasDeLaSemana(zona, dias)
  const ocupacion = ocupacionDeLaSemana(zona, bd.reservas, dias)

  return (
    <>
      <div className="fila" style={{ flexWrap: 'wrap', gap: 'var(--e3)', marginBottom: 'var(--e3)' }}>
        <div className="campo" style={{ marginBottom: 0, minWidth: 220 }}>
          <label htmlFor="calendario-zona">Zona</label>
          <select id="calendario-zona" value={zona.id} onChange={(e) => setZonaId(e.target.value)}>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
            ))}
          </select>
        </div>
        <div className="grupo-botones" role="group" aria-label="Semana">
          <button className="boton boton--pequeno" onClick={() => setLunes(sumarDias(lunes, -7))}>
            ← Anterior
          </button>
          <button className="boton boton--pequeno" onClick={() => setLunes(lunesDeLaSemana(hoy))}>
            Esta semana
          </button>
          <button className="boton boton--pequeno" onClick={() => setLunes(sumarDias(lunes, 7))}>
            Siguiente →
          </button>
        </div>
      </div>

      {/* Lo que dice la semana, en una línea. */}
      <p className="subtitulo" style={{ marginBottom: 'var(--e3)' }}>
        Semana del {encabezadoDia(dias[0])} al {encabezadoDia(dias[6])}:{' '}
        <strong>
          {ocupacion.ocupados} de {ocupacion.turnos} turnos con reserva
        </strong>
        {compartida && ocupacion.cupo > 0
          ? ` · ${ocupacion.personas} de ${ocupacion.cupo} cupos (${Math.round((ocupacion.personas / ocupacion.cupo) * 100)} %)`
          : ''}
        .
      </p>

      {franjas.length === 0 ? (
        <EstadoVacio titulo="Esta semana no abre" detalle="Revisa los días y el horario de la zona." />
      ) : (
        <div className="tarjeta" style={{ padding: 0 }}>
          <div className="contenedor-tabla">
            <table className="tabla" style={{ tableLayout: 'fixed', minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ width: 96 }}>Turno</th>
                  {dias.map((dia) => (
                    <th key={dia} style={dia === hoy ? { color: 'var(--color-acento)' } : undefined}>
                      {encabezadoDia(dia)}
                      {dia === hoy ? ' · hoy' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {franjas.map((franja) => (
                  <tr key={franja.inicio}>
                    <td className="suave numerico" style={{ fontSize: 'var(--texto-xs)' }}>
                      {franja.inicio}
                      <br />
                      {franja.fin}
                    </td>
                    {dias.map((dia) => {
                      const celda = celdaCalendario(zona, bd.reservas, dia, franja.inicio)
                      const estilo = {
                        ...estiloCelda(celda, compartida, zona.aforo, dia < hoy),
                        display: 'block',
                        width: '100%',
                        minHeight: 48,
                        padding: 'var(--e1) var(--e2)',
                        border: 0,
                        borderRadius: 'var(--radio-sm)',
                        fontSize: 'var(--texto-xs)',
                        fontWeight: 600,
                        textAlign: 'left' as const,
                        lineHeight: 1.3,
                      }
                      const texto = textoCelda(celda, compartida, zona.aforo, bd)
                      return (
                        <td key={dia} style={{ padding: 4 }}>
                          {celda.tipo === 'ocupada' ? (
                            <button
                              style={estilo}
                              title="Ver quién la tiene"
                              onClick={() => setDetalle({ fecha: dia, ...franja, reservas: celda.reservas })}
                            >
                              {texto}
                            </button>
                          ) : (
                            <span style={estilo} title={celda.tipo === 'cerrada' ? celda.motivo : undefined}>
                              {texto}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* La leyenda: el color nunca va solo, cada casilla dice también en palabras qué es. */}
      <div className="fila" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 'var(--e2)', marginTop: 'var(--e3)' }}>
        <span className="chip chip--exito">Libre</span>
        <span className="chip chip--marca">{compartida ? 'Lleno' : 'Reservado'}</span>
        {compartida && <span className="chip chip--info">Con cupo</span>}
        <span className="chip chip--alerta">Mantenimiento</span>
        <span className="chip">No abre</span>
      </div>

      {detalle && (
        <Modal
          titulo={`${zona.nombre} · ${detalle.inicio} a ${detalle.fin}`}
          descripcion={formatearFecha(detalle.fecha)}
          onCerrar={() => setDetalle(null)}
        >
          <div className="lista lista--compacta">
            {detalle.reservas.map((r) => {
              const unidad = sel.unidad(bd, r.unidadId)
              return (
                <div key={r.id} className="tarjeta tarjeta--plana">
                  <div className="fila fila-inicio">
                    <div className="columna">
                      <strong>{unidad ? etiquetaUnidad(unidad) : 'Unidad'}</strong>
                      <span className="subtitulo">
                        {nombreCompleto(sel.persona(bd, r.personaId))} · {r.personas ?? 1}{' '}
                        {(r.personas ?? 1) === 1 ? 'persona' : 'personas'}
                      </span>
                    </div>
                    <ChipReserva estado={r.estado} />
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}
    </>
  )
}

/** Lo que dice la casilla, en palabras. */
function textoCelda(
  celda: CeldaCalendario,
  compartida: boolean,
  aforo: number,
  bd: ReturnType<typeof useDatos>['bd'],
): string {
  if (celda.tipo === 'no_abre') return '—'
  if (celda.tipo === 'cerrada') return 'Mantenimiento'
  if (celda.tipo === 'libre') return 'Libre'
  if (compartida) return `${celda.personas} de ${aforo}`
  const r = celda.reservas[0]
  const unidad = sel.unidad(bd, r.unidadId)
  const porAprobar = r.estado === 'solicitada' ? ' · por aprobar' : ''
  return `${unidad ? etiquetaUnidad(unidad) : 'Unidad'} · ${r.personas ?? 1} p.${porAprobar}`
}
