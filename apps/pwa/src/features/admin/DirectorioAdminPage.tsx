/**
 * CU-R-17 — El directorio desde la consola: la administración lo arma, y marca
 * quiénes son del consejo (RN-232, RN-233).
 * Doc: docs/casos-de-uso/residente.md#cu-r-17
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cambiarActivoContacto, configurarConsejo, guardarContacto } from '../../datos/repositorio'
import { GRUPOS_CONTACTO, etiquetaUnidad } from '../../dominio/reglas'
import type { Contacto, GrupoContacto } from '../../dominio/tipos'
import { ListaDirectorio } from '../../componentes/ListaDirectorio'

export function DirectorioAdminPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [editando, setEditando] = useState<Contacto | 'nuevo' | null>(null)
  const [grupo, setGrupo] = useState<GrupoContacto>('edificio')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [telefono, setTelefono] = useState('')
  if (!sesion) return null

  const todos = (bd.contactos ?? []).filter((c) => c.copropiedadId === sesion.copropiedadId)
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const consejo = new Set(copropiedad?.consejo ?? [])
  const propietarios = sel
    .unidadesDe(bd, sesion.copropiedadId)
    .flatMap((u) =>
      sel.residenciasDeUnidad(bd, u.id).filter((r) => r.rol === 'propietario').map((r) => ({ persona: sel.persona(bd, r.personaId), unidad: u })),
    )
    .filter((x) => x.persona)

  function abrir(c: Contacto | 'nuevo') {
    setEditando(c)
    const actual = c === 'nuevo' ? undefined : c
    setGrupo(actual?.grupo ?? 'edificio')
    setNombre(actual?.nombre ?? '')
    setDescripcion(actual?.descripcion ?? '')
    setTelefono(actual?.telefono ?? '')
  }

  return (
    <div className="pila">
      <div className="fila">
        <span className="subtitulo">
          Los teléfonos que ven los residentes en su app. Los <strong>proveedores</strong> solo los ven la
          administración y el consejo.
        </span>
        <button className="boton boton--primario" onClick={() => abrir('nuevo')}>
          Agregar contacto
        </button>
      </div>

      {editando && (
        <div className="tarjeta">
          <strong>{editando === 'nuevo' ? 'Nuevo contacto' : 'Cambiar contacto'}</strong>
          <span className="segmentos" style={{ display: 'inline-flex', margin: 'var(--e2) 0' }}>
            {GRUPOS_CONTACTO.map((g) => (
              <button key={g.id} type="button" className="segmento" aria-current={grupo === g.id ? 'page' : undefined} onClick={() => setGrupo(g.id)}>
                {g.texto}
              </button>
            ))}
          </span>
          <div className="campo">
            <label htmlFor="con-nombre">Nombre</label>
            <input id="con-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="con-descripcion">Para qué (opcional)</label>
            <input id="con-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="con-telefono">Teléfono</label>
            <input id="con-telefono" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div className="grupo-botones">
            <button
              className="boton boton--primario"
              disabled={cargando}
              onClick={async () => {
                const hecho = await ejecutar(
                  (base) =>
                    guardarContacto(base, {
                      copropiedadId: sesion.copropiedadId,
                      personaId: sesion.personaId,
                      id: editando === 'nuevo' ? undefined : editando.id,
                      grupo,
                      nombre,
                      descripcion,
                      telefono,
                    }),
                  'Contacto guardado.',
                )
                if (hecho) setEditando(null)
              }}
            >
              Guardar
            </button>
            <button className="boton" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ListaDirectorio
        contactos={todos}
        acciones={(c) => (
          <div className="grupo-botones">
            <button className="boton boton--pequeno" onClick={() => abrir(c)}>
              Cambiar
            </button>
            <button
              className="boton boton--pequeno"
              disabled={cargando}
              onClick={() =>
                void ejecutar(
                  (base) => cambiarActivoContacto(base, { contactoId: c.id, personaId: sesion.personaId, activo: !!c.desactivadoEn }),
                  c.desactivadoEn ? 'Contacto activado.' : 'Contacto desactivado: ya no lo ven los residentes.',
                )
              }
            >
              {c.desactivadoEn ? 'Activar' : 'Desactivar'}
            </button>
          </div>
        )}
      />

      {/* RN-233 — Quiénes son del consejo: ven a los proveedores. */}
      <div className="tarjeta">
        <strong>Consejo de administración</strong>
        <p className="subtitulo">Marca a los propietarios que son del consejo: ellos también ven a los proveedores.</p>
        <div className="columna" style={{ gap: 'var(--e1)', marginTop: 'var(--e2)' }}>
          {propietarios.map(({ persona, unidad }) => (
            <label key={`${persona!.id}-${unidad.id}`} className="fila" style={{ gap: 'var(--e2)', justifyContent: 'flex-start' }}>
              <input
                type="checkbox"
                checked={consejo.has(persona!.id)}
                disabled={cargando}
                onChange={(e) => {
                  const nuevos = new Set(consejo)
                  if (e.target.checked) nuevos.add(persona!.id)
                  else nuevos.delete(persona!.id)
                  void ejecutar(
                    (base) => configurarConsejo(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, miembros: [...nuevos] }),
                    'Consejo actualizado.',
                  )
                }}
              />
              <span className="subtitulo">
                {sel.nombreCompleto(persona)} · {etiquetaUnidad(unidad)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
