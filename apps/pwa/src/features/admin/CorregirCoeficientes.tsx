/**
 * CU-A-21 — Corregir los coeficientes mal cargados (RN-222, RN-19).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-21
 *
 * Los coeficientes no se cambian: los fija el reglamento. Esto es para el
 * **error de digitación** del administrador (Mary, 2026-10-13). Por eso pide el
 * motivo, no deja guardar si la suma no da 100 % y deja el historial en cada
 * unidad. Lo ya votado no cambia: el voto guarda el coeficiente del momento.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { corregirCoeficientes } from '../../datos/repositorio'
import { diferenciaCoeficientes, etiquetaUnidad, motivoNoCorrigeCoeficientes } from '../../dominio/reglas'
import { Modal } from '../../componentes/Modal'

export function CorregirCoeficientes({ alCerrar }: { alCerrar: () => void }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const unidades = sesion ? sel.unidadesDe(bd, sesion.copropiedadId) : []
  const [valores, setValores] = useState<Record<string, string>>(
    Object.fromEntries(unidades.map((u) => [u.id, String(u.coeficiente)])),
  )
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null

  const bloqueo = motivoNoCorrigeCoeficientes(bd.asambleas, sesion.copropiedadId)
  const numeros = unidades.map((u) => Number(valores[u.id]?.replace(',', '.')))
  const todosValidos = numeros.every((n) => Number.isFinite(n) && n > 0)
  const diferencia = todosValidos ? diferenciaCoeficientes(numeros) : NaN
  const cambios = unidades
    .map((u, i) => ({ unidadId: u.id, coeficiente: numeros[i], antes: u.coeficiente }))
    .filter((c) => Number.isFinite(c.coeficiente) && c.coeficiente !== c.antes)
  const listo = !bloqueo && todosValidos && diferencia === 0 && cambios.length > 0 && motivo.trim().length >= 10

  return (
    <Modal
      titulo="Corregir coeficientes"
      descripcion="Solo para corregir un error al cargarlos: el coeficiente lo fija el reglamento y no se cambia."
      onCerrar={alCerrar}
    >
      {bloqueo && <p className="acceso__nota">{bloqueo}</p>}

      <div className="contenedor-tabla" style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Unidad</th>
              <th className="numerico">Coeficiente (%)</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((unidad) => (
              <tr key={unidad.id}>
                <td>{etiquetaUnidad(unidad)}</td>
                <td className="numerico">
                  <input
                    aria-label={`Coeficiente de ${etiquetaUnidad(unidad)}`}
                    inputMode="decimal"
                    value={valores[unidad.id] ?? ''}
                    onChange={(e) => setValores({ ...valores, [unidad.id]: e.target.value })}
                    style={{ width: '7rem', textAlign: 'right' }}
                    disabled={!!bloqueo}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RN-19 — La suma, siempre a la vista: es lo que decide si se puede guardar. */}
      <p className={diferencia === 0 ? 'subtitulo' : 'acceso__nota'} role="status" style={{ margin: 'var(--e3) 0' }}>
        {!todosValidos
          ? 'Hay un coeficiente vacío o en cero.'
          : diferencia === 0
            ? `Suman 100 %. ${cambios.length === 0 ? 'No has cambiado ninguno.' : `Cambias ${cambios.length}.`}`
            : `Suman ${Number((100 + diferencia).toFixed(4))} %: ${diferencia > 0 ? 'sobra' : 'falta'} ${Math.abs(diferencia)} %.`}
      </p>

      <div className="campo">
        <label htmlFor="motivo-coeficientes">¿Qué error se corrige?</label>
        <textarea
          id="motivo-coeficientes"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Por ejemplo: se digitó 4,51 en vez de 5,41, según el reglamento"
          disabled={!!bloqueo}
        />
        <span className="ayuda-campo">Queda en el historial de cada unidad corregida.</span>
      </div>

      <div className="grupo-botones">
        <button
          className="boton boton--primario"
          disabled={cargando || !listo}
          onClick={async () => {
            const hecho = await ejecutar(
              (base) =>
                corregirCoeficientes(base, {
                  copropiedadId: sesion.copropiedadId,
                  personaId: sesion.personaId,
                  cambios: cambios.map(({ unidadId, coeficiente }) => ({ unidadId, coeficiente })),
                  motivo,
                }),
              'Coeficientes corregidos. Queda el historial en cada unidad.',
            )
            if (hecho) alCerrar()
          }}
        >
          Guardar la corrección
        </button>
        <button className="boton" onClick={alCerrar}>
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
