/**
 * CU-R-25 — Activar mi cuenta (y recuperar la clave).
 * Doc: docs/casos-de-uso/residente.md#cu-r-25
 *
 * Los dos caminos son el mismo en tres pasos —documento, código, clave— y
 * por eso viven en una sola pantalla: cambia el texto, no el flujo. Separarlos en
 * dos componentes iguales sería tener que arreglar cada cosa dos veces.
 *
 * La cuenta **no se crea aquí**: se activa. Quien la crea es la administración
 * cuando vincula a la persona con su unidad (CU-A-02, RN-53). Si alguien escribe
 * un documento que la copropiedad no tiene, la respuesta no es «regístrate», es
 * «pídele a la administración que te vincule».
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import {
  activarCuenta,
  cuentaActivada,
  DIGITOS_CLAVE,
  generarCodigo,
  limpiarFallos,
  normalizarDocumento,
  recordarDispositivo,
  recordarUltimaPersona,
} from '../../estado/acceso'
import { biometria } from '../../servicios/plataforma'
import { Logotipo } from '../../componentes/Logotipo'
import { SiluetaTorres } from '../../componentes/SiluetaTorres'
import { Icono } from '../../componentes/Icono'
import { nombreCompleto } from '../../datos/selectores'
import { perfilDe } from './perfil'

type Paso = 'documento' | 'codigo' | 'clave'

export function ActivarPage({ modo }: { modo: 'activar' | 'recuperar' }) {
  const { bd } = useDatos()
  const { iniciar } = useSesion()
  const navegar = useNavigate()

  const [paso, setPaso] = useState<Paso>('documento')
  const [documento, setDocumento] = useState('')
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [esperado, setEsperado] = useState('')
  const [codigo, setCodigo] = useState('')
  const [clave, setClave] = useState('')
  const [repetida, setRepetida] = useState('')
  const [conHuella, setConHuella] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Solo se ofrece la huella si este aparato tiene lector (ADR-0002). */
  const [hayLector, setHayLector] = useState(false)

  useEffect(() => {
    let vigente = true
    biometria.disponible().then((hay) => {
      if (vigente) setHayLector(hay)
    })
    return () => {
      vigente = false
    }
  }, [])

  const persona = personaId ? bd.personas.find((p) => p.id === personaId) : undefined
  const activando = modo === 'activar'

  function buscar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    const buscado = normalizarDocumento(documento)
    const encontrada = bd.personas.find((p) => normalizarDocumento(p.documento) === buscado)

    if (!encontrada) {
      setError(
        'Ese documento no está vinculado a ninguna unidad. La administración es quien te registra: escríbele y vuelve a intentar.',
      )
      return
    }
    if (activando && cuentaActivada(encontrada.id)) {
      setError('Esta cuenta ya está activada. Entra con tu clave o recupérala.')
      return
    }
    if (!activando && !cuentaActivada(encontrada.id)) {
      setError('Esta cuenta todavía no se ha activado. Actívala en vez de recuperarla.')
      return
    }
    setPersonaId(encontrada.id)
    setEsperado(generarCodigo())
    setPaso('codigo')
  }

  function confirmar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    if (codigo.trim() !== esperado) {
      setError('Ese código no coincide. Revísalo y vuelve a intentar.')
      return
    }
    setPaso('clave')
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    if (clave.length !== DIGITOS_CLAVE || !/^\d+$/.test(clave)) {
      setError(`La clave son ${DIGITOS_CLAVE} números.`)
      return
    }
    if (clave !== repetida) {
      setError('Las dos claves no coinciden.')
      return
    }
    if (!personaId) return

    const perfil = perfilDe(bd, personaId)
    if (!perfil) {
      setError('Tu unidad todavía no está vinculada. Escríbele a la administración.')
      return
    }
    activarCuenta(personaId)
    // Quien acaba de probar su identidad con el codigo en este telefono no tiene
    // por que volver a hacerlo al entrar (RN-54).
    recordarDispositivo(personaId)
    recordarUltimaPersona(personaId)
    limpiarFallos(personaId)
    // Si acepto la huella, se registra ahora: el aparato pide el dedo una vez y
    // queda listo. Si la cancela, se entra igual — no es obligatoria.
    if (conHuella && hayLector) {
      await biometria.registrar(personaId, nombreCompleto(persona))
    }
    iniciar(perfil)
    navegar(perfil.rol === 'admin' ? '/admin' : '/app', { replace: true })
  }

  return (
    <div className="acceso-fondo">
      {/* Las mismas torres del fondo de la app: la puerta y el interior son el
          mismo edificio. */}
      <SiluetaTorres className="acceso-fondo__siluetas" />
      <div className="acceso">
        <div className="acceso__marca">
          <Logotipo inverso tamano="var(--texto-3xl)" />
          <p className="acceso__lema">
            {activando ? 'Activa tu cuenta' : 'Recupera tu clave'}
          </p>
        </div>

        {/* Los tres pasos a la vista: en un tramite de identidad, saber cuanto falta
          es la diferencia entre terminarlo y abandonarlo. */}
        <ol className="pasos" aria-label="Pasos">
          <li className={paso === 'documento' ? 'activo' : ''}>Documento</li>
          <li className={paso === 'codigo' ? 'activo' : ''}>Código</li>
          <li className={paso === 'clave' ? 'activo' : ''}>Clave</li>
        </ol>

        {paso === 'documento' && (
          <form className="tarjeta" onSubmit={buscar}>
            <div className="campo">
              <label htmlFor="documento">Tu documento de identidad</label>
              <input
                id="documento"
                className="campo-numeros"
                inputMode="numeric"
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
                placeholder="Sin puntos ni espacios"
              />
              <span className="ayuda-campo">
                El mismo que le diste a la administración cuando registró tu unidad.
              </span>
            </div>
            {error && <p className="acceso__error">{error}</p>}
            <button className="boton boton--primario boton--bloque" type="submit">
              Continuar
            </button>
          </form>
        )}

        {paso === 'codigo' && (
          <form className="tarjeta" onSubmit={confirmar}>
            <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e4)' }}>
              <strong>Te enviamos un código</strong>
              <span className="subtitulo">
                A {persona?.telefono ?? 'tu celular'}
                {persona?.email ? ` y a ${persona.email}` : ''}.
              </span>
            </div>
            <div className="campo">
              <label htmlFor="codigo">Código de {esperado.length} números</label>
              <input
                id="codigo"
                className="campo-numeros"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value)}
                placeholder="000000"
              />
            </div>
            {error && <p className="acceso__error">{error}</p>}
            <button className="boton boton--primario boton--bloque" type="submit">
              Confirmar
            </button>
            <p className="acceso__nota" style={{ marginTop: 'var(--e4)' }}>
              <strong>Demo:</strong> tu código es <strong className="numerico">{esperado}</strong>.
              En la versión real llega por mensaje y no se ve aquí.
            </p>
          </form>
        )}

        {paso === 'clave' && (
          <form className="tarjeta" onSubmit={(evento) => void guardar(evento)}>
            <div className="campo">
              <label htmlFor="nueva">
                {activando ? `Crea tu clave de ${DIGITOS_CLAVE} números` : 'Tu nueva clave'}
              </label>
              <input
                id="nueva"
                className="campo-numeros"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={DIGITOS_CLAVE}
                value={clave}
                onChange={(evento) => setClave(evento.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />
              {/* Se dice que NO sirve un cumpleanos: es el consejo que de verdad
                  cambia algo, y no «use mayusculas y simbolos», que aqui no
                  aplica. */}
              <span className="ayuda-campo">
                Elige {DIGITOS_CLAVE} números que recuerdes. Evita tu año de nacimiento o
                1234.
              </span>
            </div>
            <div className="campo">
              <label htmlFor="repetida">Escríbela otra vez</label>
              <input
                id="repetida"
                className="campo-numeros"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                maxLength={DIGITOS_CLAVE}
                value={repetida}
                onChange={(evento) => setRepetida(evento.target.value.replace(/\D/g, ''))}
                placeholder="••••"
              />
            </div>

            {/* La huella se ofrece **aqui**, cuando la persona acaba de probar
                quien es: es el unico momento en que registrarla no exige volver a
                pedirle nada (RN-55). */}
            {hayLector && (
              <label className="opcion-huella">
                <input
                  type="checkbox"
                  checked={conHuella}
                  onChange={(evento) => setConHuella(evento.target.checked)}
                />
                <span>
                  <strong>Entrar con huella en este teléfono</strong>
                  <span className="subtitulo">
                    Así no tienes que escribir la clave cada vez. Puedes quitarla luego desde
                    tu perfil.
                  </span>
                </span>
              </label>
            )}
            {error && <p className="acceso__error">{error}</p>}
            <button className="boton boton--primario boton--bloque" type="submit">
              {activando ? 'Activar y entrar' : 'Guardar y entrar'}
            </button>
            {/* Se dice que el demo no guarda contrasenas: es lo honesto y ademas
              evita que alguien escriba aqui una que use de verdad. */}
            <p className="acceso__nota" style={{ marginTop: 'var(--e4)' }}>
              <strong>Demo:</strong> no se guarda ninguna clave. Con la versión real esto lo
              hace un servidor.
            </p>
          </form>
        )}

        <Link to="/acceso" className="boton boton--fantasma">
          <Icono nombre="volver" tamano={15} />
          Volver al ingreso
        </Link>
      </div>
    </div>
  )
}
