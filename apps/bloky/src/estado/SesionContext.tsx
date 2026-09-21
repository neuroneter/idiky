/**
 * La sesion de BLOKY en la app: se pregunta a la API al arrancar (la cookie la manda el
 * navegador) y se guarda aqui. Tambien lleva, mientras dura el ingreso, a quien se esta
 * identificando y por que canales puede entrar (CU-B-01).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type Identificacion, type Identificado, type SesionPublica } from '../datos/api'

interface EnCurso extends Identificacion, Identificado {}

interface ValorSesion {
  sesion: SesionPublica | undefined
  cargando: boolean
  enCurso: EnCurso | undefined
  empezarIngreso(id: Identificacion, datos: Identificado): void
  entrar(sesion: SesionPublica): void
  salir(): Promise<void>
}

const Contexto = createContext<ValorSesion | undefined>(undefined)
const CLAVE_EN_CURSO = 'bloky.ingreso-en-curso'

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionPublica>()
  const [cargando, setCargando] = useState(true)
  const [enCurso, setEnCurso] = useState<EnCurso | undefined>(() => {
    try { const v = sessionStorage.getItem(CLAVE_EN_CURSO); return v ? (JSON.parse(v) as EnCurso) : undefined } catch { return undefined }
  })

  useEffect(() => {
    api.sesion().then((r) => setSesion(r.sesion)).catch(() => setSesion(undefined)).finally(() => setCargando(false))
  }, [])

  const empezarIngreso = useCallback((id: Identificacion, datos: Identificado) => {
    const valor = { ...id, ...datos }
    setEnCurso(valor)
    try { sessionStorage.setItem(CLAVE_EN_CURSO, JSON.stringify(valor)) } catch { /* sin almacenamiento: sigue en memoria */ }
  }, [])

  const entrar = useCallback((s: SesionPublica) => {
    setSesion(s)
    setEnCurso(undefined)
    try { sessionStorage.removeItem(CLAVE_EN_CURSO) } catch { /* nada */ }
  }, [])

  const salir = useCallback(async () => {
    try { await api.salir() } finally { setSesion(undefined) }
  }, [])

  const valor = useMemo(() => ({ sesion, cargando, enCurso, empezarIngreso, entrar, salir }), [sesion, cargando, enCurso, empezarIngreso, entrar, salir])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSesion(): ValorSesion {
  const v = useContext(Contexto)
  if (!v) throw new Error('useSesion fuera de SesionProvider')
  return v
}
