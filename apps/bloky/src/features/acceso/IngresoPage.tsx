/**
 * CU-B-01 — Ingresar a BLOKY, paso 1: quien eres.
 * Doc: docs/casos-de-uso/bloky.md#cu-b-01
 *
 * Solo el documento. La clave no existe: la identidad la prueba el celular o la cuenta de
 * correo registrados en BOB (RN-163, RN-164).
 */
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, ErrorApi, type TipoDocumento } from '../../datos/api'
import { useSesion } from '../../estado/SesionContext'
import { Puerta } from './Puerta'

const TIPOS: Array<{ id: TipoDocumento; texto: string }> = [
  { id: 'CC', texto: 'Cédula de ciudadanía' },
  { id: 'CE', texto: 'Cédula de extranjería' },
  { id: 'PA', texto: 'Pasaporte' },
  { id: 'PPT', texto: 'Permiso de protección temporal' },
  { id: 'TI', texto: 'Tarjeta de identidad' },
]

const ERRORES_DE_RETORNO: Record<string, string> = {
  correo_no_coincide: 'La cuenta con la que entraste no es el correo registrado en IDIKY.',
  estado_invalido: 'El ingreso caducó. Vuelve a empezar.',
  proveedor_fallo: 'No se pudo confirmar tu cuenta con el proveedor. Intenta de nuevo.',
  sin_acceso: 'Tu registro existe, pero hoy no tienes una copropiedad activa a tu cargo.',
}

export function IngresoPage() {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const { empezarIngreso } = useSesion()
  const [tipo, setTipo] = useState<TipoDocumento>('CC')
  const [numero, setNumero] = useState('')
  const [error, setError] = useState<string | undefined>(ERRORES_DE_RETORNO[parametros.get('error') ?? ''])
  const [cargando, setCargando] = useState(false)

  async function identificar(evento: FormEvent) {
    evento.preventDefault()
    setError(undefined)
    setCargando(true)
    try {
      const id = { tipoDocumento: tipo, numeroDocumento: numero.replace(/[\s.]/g, '') }
      const datos = await api.identificar(id)
      empezarIngreso(id, datos)
      navegar('/ingreso/como')
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo conectar. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <Puerta titulo="Ingresar" paso={1}>
      <form onSubmit={identificar} className="pila">
        <div className="campo">
          <label htmlFor="tipo">Tipo de documento</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoDocumento)}>
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.texto}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="documento">Número de documento</label>
          <input
            id="documento" className="campo-numeros" inputMode="numeric" autoComplete="username"
            value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Sin puntos ni espacios" autoFocus
          />
        </div>
        {error && <p className="aviso aviso--error" role="alert">{error}</p>}
        <button className="boton boton--primario boton--bloque" type="submit" disabled={cargando || numero.trim().length < 3}>
          {cargando ? 'Buscando…' : 'Continuar'}
        </button>
        <p className="subtitulo">
          No hay contraseña. Te confirmamos con el celular o el correo que IDIKY tiene registrados.
        </p>
      </form>
    </Puerta>
  )
}
