/**
 * Estado global de datos.
 *
 * Mantiene en memoria la `BaseDatos` cargada desde el repositorio y expone:
 *  - `bd`: la foto actual de los datos (solo lectura para las pantallas).
 *  - `ejecutar`: forma unica de escribir. Recibe una operacion del repositorio,
 *    actualiza el estado con el resultado y muestra el error de negocio si lo hay.
 *  - `aviso` / `mostrarAviso`: mensajes efimeros para el usuario.
 *
 * Las pantallas NUNCA llaman al repositorio directamente para escribir sin pasar
 * por `ejecutar`, porque perderian la actualizacion del estado (ADR-0003).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { BaseDatos } from '../dominio/tipos'
import { Logotipo } from '../componentes/Logotipo'
import { cargar, ErrorDeNegocio, reiniciar, type Resultado } from '../datos/repositorio'

export type TipoAviso = 'exito' | 'error' | 'info'

export interface Aviso {
  texto: string
  tipo: TipoAviso
}

interface ContextoDatos {
  bd: BaseDatos
  cargando: boolean
  aviso: Aviso | null
  mostrarAviso: (texto: string, tipo?: TipoAviso) => void
  ocultarAviso: () => void
  ejecutar: <T>(
    operacion: (bd: BaseDatos) => Promise<Resultado<T>>,
    mensajeExito?: string,
  ) => Promise<T | null>
  reiniciarDemo: () => Promise<void>
}

const Contexto = createContext<ContextoDatos | null>(null)

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [bd, setBd] = useState<BaseDatos | null>(null)
  const [cargando, setCargando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)

  /**
   * Espejo de `bd` para leerla sin depender del cierre de `ejecutar`.
   *
   * Sin esto, dos operaciones seguidas parten las dos de la misma foto de la base y
   * la segunda pisa a la primera: en movil, un doble toque en "Pagar" perdia el
   * primer pago. Con la referencia, cada operacion parte del resultado de la anterior.
   */
  const bdRef = useRef<BaseDatos | null>(null)

  /** Candado: mientras una operacion este en vuelo no se admite otra. */
  const operacionEnCurso = useRef(false)

  const fijarBd = useCallback((datos: BaseDatos) => {
    bdRef.current = datos
    setBd(datos)
  }, [])

  useEffect(() => {
    let vigente = true
    cargar().then((datos) => {
      if (vigente) fijarBd(datos)
    })
    return () => {
      vigente = false
    }
  }, [fijarBd])

  const mostrarAviso = useCallback((texto: string, tipo: TipoAviso = 'info') => {
    setAviso({ texto, tipo })
  }, [])

  const ocultarAviso = useCallback(() => setAviso(null), [])

  // Los avisos desaparecen solos para no estorbar en el demo.
  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(temporizador)
  }, [aviso])

  const ejecutar = useCallback(
    async <T,>(
      operacion: (bd: BaseDatos) => Promise<Resultado<T>>,
      mensajeExito?: string,
    ): Promise<T | null> => {
      const actual = bdRef.current
      if (!actual) return null
      // El segundo toque de un doble toque se descarta en silencio: no es una accion
      // nueva del usuario, es la misma repetida.
      if (operacionEnCurso.current) return null

      operacionEnCurso.current = true
      setCargando(true)
      try {
        const { bd: nueva, datos } = await operacion(actual)
        fijarBd(nueva)
        if (mensajeExito) mostrarAviso(mensajeExito, 'exito')
        return datos
      } catch (error) {
        const texto =
          error instanceof ErrorDeNegocio
            ? error.message
            : 'Ocurrio un error inesperado. Intenta de nuevo.'
        mostrarAviso(texto, 'error')
        return null
      } finally {
        operacionEnCurso.current = false
        setCargando(false)
      }
    },
    [fijarBd, mostrarAviso],
  )

  const reiniciarDemo = useCallback(async () => {
    if (operacionEnCurso.current) return
    operacionEnCurso.current = true
    setCargando(true)
    try {
      fijarBd(await reiniciar())
      mostrarAviso('Datos del demo reiniciados.', 'exito')
    } finally {
      operacionEnCurso.current = false
      setCargando(false)
    }
  }, [fijarBd, mostrarAviso])

  const valor = useMemo(
    () =>
      bd
        ? { bd, cargando, aviso, mostrarAviso, ocultarAviso, ejecutar, reiniciarDemo }
        : null,
    [bd, cargando, aviso, mostrarAviso, ocultarAviso, ejecutar, reiniciarDemo],
  )

  if (!valor) {
    return (
      <div className="pantalla-carga">
        <Logotipo tamano="var(--texto-2xl)" />
        <p>Cargando la copropiedad…</p>
      </div>
    )
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useDatos(): ContextoDatos {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useDatos debe usarse dentro de <ProveedorDatos>')
  return contexto
}
