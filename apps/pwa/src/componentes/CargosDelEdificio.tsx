/**
 * PN-28 — Los elegidos y los cargos del edificio (CU-A-18, CU-A-20, CU-R-21;
 * Mary, 2026-11-26).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-18
 *
 * - `ElegidosDelPunto`: al cerrar la votación de una elección, quiénes quedaron
 *   y si aceptaron. La administración registra la respuesta de quien es de afuera
 *   o lo dijo en la sala.
 * - `MisCargosPorAceptar`: al elegido le aparece en el inicio, para aceptar o no.
 * - `CargosVigentes`: quién está hoy en el consejo, en el comité y de revisor
 *   fiscal. Lo ven todos: es transparencia.
 */

import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { responderCargo } from '../datos/repositorio'
import { CARGOS_ELECCION, cargoVigente, cargosVigentesDe, puestosDe, votacionVigente } from '../dominio/reglas'
import type { Asamblea, CargoElegido, CargoEleccion, PuntoOrdenDelDia } from '../dominio/tipos'
import { formatearFecha } from '../utilidades/formato'

function estadoCargo(c: CargoElegido): string {
  if (c.declinacion) return 'No aceptó'
  if (c.fin) return 'Terminó'
  if (c.aceptacion) return 'Aceptó'
  return 'Falta que acepte'
}

function BotonesRespuesta({ cargo, admin }: { cargo: CargoElegido; admin: boolean }) {
  const { ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  if (!sesion || cargo.aceptacion || cargo.declinacion || cargo.fin) return null
  const responder = (acepta: boolean) =>
    void ejecutar(
      (base) => responderCargo(base, { cargoId: cargo.id, personaId: sesion.personaId, acepta }),
      acepta ? (admin ? 'Aceptación registrada.' : '¡Gracias! Quedaste en el cargo.') : 'Respuesta registrada.',
    )
  return (
    <span className="grupo-botones">
      <button className="boton boton--pequeno boton--primario" disabled={cargando} onClick={() => responder(true)}>
        {admin ? 'Aceptó' : 'Acepto el cargo'}
      </button>
      <button className="boton boton--pequeno" disabled={cargando} onClick={() => responder(false)}>
        {admin ? 'No aceptó' : 'No acepto'}
      </button>
    </span>
  )
}

export function ElegidosDelPunto({ asamblea, punto, modo }: { asamblea: Asamblea; punto: PuntoOrdenDelDia; modo: 'residente' | 'admin' }) {
  const { bd } = useDatos()
  if (!punto.eleccion) return null
  const votacion = votacionVigente(bd.votaciones, punto.id)
  if (!votacion || votacion.estado !== 'cerrada') return null
  const elegidos = (bd.cargosElegidos ?? []).filter((c) => c.votacionId === votacion.id && c.asambleaId === asamblea.id)
  const puestos = puestosDe(punto)
  return (
    <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e2)' }}>
      <strong>
        {elegidos.length === 0 ? 'Nadie quedó elegido' : elegidos.length === 1 ? 'Quedó elegido' : 'Quedaron elegidos'} ·{' '}
        {CARGOS_ELECCION[punto.eleccion].nombre}
      </strong>
      <div className="lista lista--compacta">
        {elegidos.map((c) => (
          <div key={c.id} className="fila" style={{ flexWrap: 'wrap' }}>
            <span>
              {c.nombre} <span className="tenue">· {estadoCargo(c)}</span>
            </span>
            {modo === 'admin' && <BotonesRespuesta cargo={c} admin />}
          </div>
        ))}
      </div>
      {elegidos.length < puestos && (
        <span className="acceso__nota" style={{ display: 'block', marginTop: 'var(--e2)' }}>
          {puestos - elegidos.length === 1 ? 'Queda 1 puesto sin asignar' : `Quedan ${puestos - elegidos.length} puestos sin asignar`}
          : por empate o por falta de candidatos. Se define como diga el reglamento.
        </span>
      )}
    </div>
  )
}

export function MisCargosPorAceptar() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const mios = (bd.cargosElegidos ?? []).filter(
    (c) => c.personaId === sesion.personaId && c.copropiedadId === sesion.copropiedadId && cargoVigente(c) && !c.aceptacion,
  )
  if (mios.length === 0) return null
  return (
    <>
      {mios.map((c) => (
        <div key={c.id} className="tarjeta tarjeta--alerta">
          <strong>La asamblea te eligió para {CARGOS_ELECCION[c.cargo].nombre.toLowerCase()}</strong>
          <p className="subtitulo">Gracias por ofrecerte. Confirma si aceptas el cargo: queda en el acta.</p>
          <BotonesRespuesta cargo={c} admin={false} />
        </div>
      ))}
    </>
  )
}

export function CargosVigentes({ modo }: { modo: 'residente' | 'admin' }) {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const vigentes = cargosVigentesDe(bd.cargosElegidos, sesion.copropiedadId)
  if (vigentes.length === 0 && modo === 'residente') return null
  return (
    <div className="tarjeta">
      <strong>Quién está en los cargos del edificio</strong>
      {vigentes.length === 0 && <span className="tenue" style={{ display: 'block' }}>Todavía no hay cargos registrados.</span>}
      {(Object.keys(CARGOS_ELECCION) as CargoEleccion[]).map((cargo) => {
        const de = vigentes.filter((c) => c.cargo === cargo)
        if (de.length === 0) return null
        return (
          <div key={cargo} style={{ marginTop: 'var(--e2)' }}>
            <span className="subtitulo">{CARGOS_ELECCION[cargo].nombre}</span>
            <div className="lista lista--compacta">
              {de.map((c) => {
                const unidad = c.unidadId ? sel.unidad(bd, c.unidadId) : undefined
                return (
                  <div key={c.id} className="fila" style={{ flexWrap: 'wrap' }}>
                    <span>
                      {c.nombre}
                      {unidad && <span className="tenue"> · {unidad.torre}, {unidad.tipo} {unidad.numero}</span>}
                      {c.matricula && <span className="tenue"> · matrícula {c.matricula}</span>}
                      <span className="tenue"> · desde el {formatearFecha(c.desde)}</span>
                      {!c.aceptacion && <span className="tenue"> · falta que acepte</span>}
                    </span>
                    {modo === 'admin' && <BotonesRespuesta cargo={c} admin />}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
