/**
 * CU-R-17 — La lista del directorio, por grupos y con «Llamar» (RN-232).
 * La usan la app del residente y la consola: es la misma lista.
 */

import type { Contacto } from '../dominio/tipos'
import { GRUPOS_CONTACTO } from '../dominio/reglas'

export function ListaDirectorio({
  contactos,
  acciones,
}: {
  contactos: Contacto[]
  /** En la consola: los botones de cada contacto (cambiar, desactivar). */
  acciones?: (contacto: Contacto) => React.ReactNode
}) {
  return (
    <>
      {GRUPOS_CONTACTO.map((grupo) => {
        const delGrupo = contactos.filter((c) => c.grupo === grupo.id)
        if (delGrupo.length === 0) return null
        const emergencia = grupo.id === 'emergencias'
        return (
          <div key={grupo.id} className="pila">
            <span className="titulo-seccion">{grupo.texto}</span>
            {delGrupo.map((c) => (
              <div key={c.id} className={emergencia ? 'tarjeta tarjeta--alerta' : 'tarjeta tarjeta--plana'}>
                <div className="fila">
                  <div className="columna" style={{ flex: 1 }}>
                    <strong>{c.nombre}</strong>
                    <span className="subtitulo">
                      {c.descripcion ? `${c.descripcion} · ` : ''}
                      {c.telefono}
                      {c.desactivadoEn ? ' · desactivado' : ''}
                    </span>
                  </div>
                  {acciones ? (
                    acciones(c)
                  ) : (
                    <a className={emergencia ? 'boton boton--primario' : 'boton'} href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`}>
                      Llamar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}
