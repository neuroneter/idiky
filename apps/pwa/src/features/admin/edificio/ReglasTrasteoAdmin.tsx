/**
 * CU-A-37 · PN-10 — Parametrizar los trasteos del edificio.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-37
 *
 * Mary, 2026-11-20: «los horarios de trasteos y los ascensores habilitados
 * para los trasteos los parametriza el administrador» y «también los días de
 * anticipación». Un ascensor se deshabilita, no se borra.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { configurarReglasTrasteo } from '../../../datos/repositorio'
import { motivoReglasTrasteoInvalidas, reglasTrasteoDe } from '../../../dominio/reglas'
import type { AscensorTrasteo } from '../../../dominio/tipos'

export function ReglasTrasteoAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const copropiedad = sesion ? sel.copropiedad(bd, sesion.copropiedadId) : undefined
  // Sin ascensores en el edificio, la pregunta de los ascensores no aparece.
  const tieneAscensores = copropiedad?.tieneAscensores !== false
  const actuales = reglasTrasteoDe(copropiedad)
  const [horaDesde, setHoraDesde] = useState(actuales.horaDesde)
  const [horaHasta, setHoraHasta] = useState(actuales.horaHasta)
  const [dias, setDias] = useState(String(actuales.diasAnticipacion))
  const [sabados, setSabados] = useState(actuales.sabados)
  const [deposito, setDeposito] = useState(actuales.deposito ? String(actuales.deposito) : '')
  const [ascensores, setAscensores] = useState<AscensorTrasteo[]>(actuales.ascensores ?? [])
  if (!sesion) return null
  const reglas = {
    horaDesde,
    horaHasta,
    diasAnticipacion: Number(dias),
    sabados,
    deposito: deposito.trim() ? Number(deposito.replace(/[^\d]/g, '')) : undefined,
    ascensores,
  }
  const motivo = motivoReglasTrasteoInvalidas(reglas)
  const cambiar = (i: number, cambio: Partial<AscensorTrasteo>) =>
    setAscensores(ascensores.map((a, j) => (j === i ? { ...a, ...cambio } : a)))

  return (
    <div className="tarjeta">
      <strong>Parametrización de trasteos</strong>
      <p className="subtitulo">Lo que ven los residentes al pedir un trasteo. Lo ya aprobado no cambia.</p>
      <div className="fila-campos" style={{ marginTop: 'var(--e3)' }}>
        <div className="campo">
          <label htmlFor="trasteo-desde">Desde</label>
          <input id="trasteo-desde" type="time" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="trasteo-hasta">Hasta</label>
          <input id="trasteo-hasta" type="time" value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)} />
        </div>
      </div>
      <div className="fila-campos">
        <div className="campo">
          <label htmlFor="trasteo-anticipacion">Días de anticipación</label>
          <input id="trasteo-anticipacion" type="number" min={0} max={15} value={dias} onChange={(e) => setDias(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="trasteo-deposito">Depósito (opcional)</label>
          <input id="trasteo-deposito" inputMode="numeric" value={deposito} onChange={(e) => setDeposito(e.target.value)} placeholder="200000" />
        </div>
      </div>
      <label className="opcion-huella" style={{ margin: 0 }}>
        <input type="checkbox" checked={sabados} onChange={(e) => setSabados(e.target.checked)} />
        <span>Se puede trastear los sábados (domingos y festivos, nunca)</span>
      </label>

      {tieneAscensores ? (
        <>
      <span className="titulo-seccion" style={{ display: 'block', marginTop: 'var(--e3)' }}>
        Ascensores para trasteos
      </span>
      {ascensores.length === 0 && (
        <p className="subtitulo">Sin ascensores habilitados: los trasteos van uno a la vez.</p>
      )}
      {ascensores.map((a, i) => (
        <div key={a.id || i} className="fila" style={{ marginTop: 'var(--e2)' }}>
          <input aria-label={`Nombre del ascensor ${i + 1}`} value={a.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value })} style={{ flex: 1 }} />
          <label className="fila" style={{ gap: 'var(--e1)' }}>
            <input type="checkbox" checked={a.habilitado} onChange={(e) => cambiar(i, { habilitado: e.target.checked })} />
            <span className="subtitulo">Habilitado</span>
          </label>
        </div>
      ))}
      <button
        className="boton boton--pequeno"
        style={{ marginTop: 'var(--e2)' }}
        onClick={() => setAscensores([...ascensores, { id: '', nombre: '', habilitado: true }])}
      >
        Agregar ascensor
      </button>
        </>
      ) : (
        <p className="subtitulo" style={{ marginTop: 'var(--e3)' }}>
          Este edificio no tiene ascensores (se definió al crearlo): los trasteos van uno a la vez.
        </p>
      )}

      {motivo && <p className="acceso__nota" style={{ marginTop: 'var(--e2)' }}>{motivo}</p>}
      <button
        className="boton boton--primario boton--bloque"
        style={{ marginTop: 'var(--e3)' }}
        disabled={cargando || !!motivo}
        onClick={() =>
          void ejecutar(
            (base) => configurarReglasTrasteo(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, reglas }),
            'Parametrización de trasteos guardada.',
          )
        }
      >
        Guardar la parametrización
      </button>
    </div>
  )
}
