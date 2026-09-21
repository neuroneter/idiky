/**
 * CU-B-01 — Ingresar a BLOKY, paso 2: por donde entras.
 * Doc: docs/casos-de-uso/bloky.md#cu-b-01
 *
 * Un solo codigo por intento, por el canal que la persona elija (docs/13 §4). Las pistas no
 * revelan el dato: «••• 4567», «o•••@gmail.com».
 */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, ErrorApi, type Canal } from '../../datos/api'
import { useSesion } from '../../estado/SesionContext'
import { Puerta } from './Puerta'

const TEXTO: Record<Canal, { titulo: string; ayuda: (pista: string) => string }> = {
  sms: { titulo: 'Código por SMS', ayuda: (p) => `Al celular ${p}` },
  google: { titulo: 'Entrar con Google', ayuda: (p) => `Con la cuenta ${p}` },
  microsoft: { titulo: 'Entrar con Microsoft', ayuda: (p) => `Con la cuenta ${p}` },
}

export function CanalPage() {
  const navegar = useNavigate()
  const { enCurso } = useSesion()
  const [error, setError] = useState<string>()
  const [cargando, setCargando] = useState<Canal>()
  if (!enCurso) return <Navigate to="/ingreso" replace />
  const id = { tipoDocumento: enCurso.tipoDocumento, numeroDocumento: enCurso.numeroDocumento }

  async function elegir(canal: Canal) {
    setError(undefined)
    setCargando(canal)
    if (canal !== 'sms') {
      window.location.assign(api.urlProveedor(canal, id))
      return
    }
    try {
      const r = await api.enviarCodigo(id)
      navegar('/ingreso/codigo', { state: r })
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo enviar el código. Intenta de nuevo.')
      setCargando(undefined)
    }
  }

  return (
    <Puerta titulo={`Hola, ${enCurso.nombre.split(' ')[0]}`} paso={2}>
      <p className="subtitulo">
        {enCurso.copropiedades.length === 1
          ? <>Vas a entrar a <strong>{enCurso.copropiedades[0].nombre}</strong>.</>
          : <>Tienes {enCurso.copropiedades.length} copropiedades a tu cargo.</>}
        {' '}¿Cómo quieres confirmar que eres tú?
      </p>
      <div className="pila">
        {enCurso.canales.map((c) => (
          <button key={c.tipo} type="button" className="opcion" disabled={!!cargando} onClick={() => void elegir(c.tipo)}>
            <strong>{cargando === c.tipo ? 'Un momento…' : TEXTO[c.tipo].titulo}</strong>
            <span className="subtitulo">{TEXTO[c.tipo].ayuda(c.pista)}</span>
          </button>
        ))}
      </div>
      {error && <p className="aviso aviso--error" role="alert">{error}</p>}
      <button type="button" className="boton boton--fantasma boton--bloque" onClick={() => navegar('/ingreso')}>
        No soy yo
      </button>
    </Puerta>
  )
}
