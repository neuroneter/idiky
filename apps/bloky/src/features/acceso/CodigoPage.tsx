/**
 * CU-B-01 — Ingresar a BLOKY, paso 3 (SMS): el codigo.
 * Doc: docs/casos-de-uso/bloky.md#cu-b-01
 */
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, ErrorApi } from '../../datos/api'
import { useSesion } from '../../estado/SesionContext'
import { Puerta } from './Puerta'

export function CodigoPage() {
  const navegar = useNavigate()
  const { state } = useLocation() as { state?: { pista?: string; codigoSimulado?: string } }
  const { enCurso, entrar } = useSesion()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string>()
  const [cargando, setCargando] = useState(false)
  if (!enCurso) return <Navigate to="/ingreso" replace />
  const id = { tipoDocumento: enCurso.tipoDocumento, numeroDocumento: enCurso.numeroDocumento }

  async function verificar(evento: FormEvent) {
    evento.preventDefault()
    setError(undefined)
    setCargando(true)
    try {
      const r = await api.verificarCodigo(id, codigo)
      entrar(r.sesion)
      navegar('/', { replace: true })
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo verificar. Intenta de nuevo.')
      setCargando(false)
    }
  }

  return (
    <Puerta titulo="Escribe el código">
      <p className="subtitulo">Te lo enviamos por SMS al celular {state?.pista ?? 'registrado'}. Vale diez minutos.</p>
      {state?.codigoSimulado && (
        <p className="aviso aviso--info">
          Entorno de desarrollo sin Twilio: el código es <strong className="numerico">{state.codigoSimulado}</strong>.
        </p>
      )}
      <form onSubmit={verificar} className="pila">
        <div className="campo">
          <label htmlFor="codigo">Código de 6 números</label>
          <input
            id="codigo" className="campo-numeros" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} placeholder="••••••" autoFocus
          />
        </div>
        {error && <p className="aviso aviso--error" role="alert">{error}</p>}
        <button className="boton boton--primario boton--bloque" type="submit" disabled={cargando || codigo.length < 4}>
          {cargando ? 'Verificando…' : 'Entrar'}
        </button>
        <button type="button" className="boton boton--fantasma boton--bloque" onClick={() => navegar('/ingreso/como')}>
          No me llegó, volver
        </button>
      </form>
    </Puerta>
  )
}
