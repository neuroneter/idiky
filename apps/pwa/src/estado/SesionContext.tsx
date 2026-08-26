/**
 * CU-R-01 — Ingresar y seleccionar unidad activa.
 *
 * En el demo no hay autenticacion real: se elige un perfil de una lista
 * (ADR-0004). La forma de la sesion (`personaId`, `rol`, `copropiedadId`,
 * `unidadActivaId`) es la misma que tendra con backend, de modo que en la fase 2
 * solo cambia como se obtiene, no como se usa.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PerfilDemo, Sesion } from '../dominio/tipos'

const CLAVE_SESION = 'idiky.demo.sesion'

interface ContextoSesion {
  sesion: Sesion | null
  iniciar: (perfil: PerfilDemo) => void
  cerrar: () => void
  cambiarUnidadActiva: (unidadId: string) => void
}

const Contexto = createContext<ContextoSesion | null>(null)

function leerSesion(): Sesion | null {
  try {
    const bruto = window.localStorage.getItem(CLAVE_SESION)
    return bruto ? (JSON.parse(bruto) as Sesion) : null
  } catch {
    return null
  }
}

function guardarSesion(sesion: Sesion | null) {
  try {
    if (sesion) window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
    else window.localStorage.removeItem(CLAVE_SESION)
  } catch {
    // Modo privado: la sesion vive solo en memoria.
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => leerSesion())

  const iniciar = useCallback((perfil: PerfilDemo) => {
    const nueva: Sesion = {
      perfilId: perfil.id,
      personaId: perfil.personaId,
      rol: perfil.rol,
      copropiedadId: perfil.copropiedadId,
      unidadActivaId: perfil.unidadId,
    }
    guardarSesion(nueva)
    setSesion(nueva)
  }, [])

  const cerrar = useCallback(() => {
    guardarSesion(null)
    setSesion(null)
  }, [])

  const cambiarUnidadActiva = useCallback((unidadId: string) => {
    setSesion((actual) => {
      if (!actual) return actual
      const nueva = { ...actual, unidadActivaId: unidadId }
      guardarSesion(nueva)
      return nueva
    })
  }, [])

  const valor = useMemo(
    () => ({ sesion, iniciar, cerrar, cambiarUnidadActiva }),
    [sesion, iniciar, cerrar, cambiarUnidadActiva],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>')
  return contexto
}
