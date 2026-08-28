/**
 * CU-R-25 — Activar mi cuenta (y recuperar la contraseña).
 * Doc: docs/casos-de-uso/residente.md#cu-r-25
 *
 * Los dos caminos son el mismo en tres pasos —documento, código, contraseña— y
 * por eso viven en una sola pantalla: cambia el texto, no el flujo. Separarlos en
 * dos componentes iguales sería tener que arreglar cada cosa dos veces.
 *
 * La cuenta **no se crea aquí**: se activa. Quien la crea es la administración
 * cuando vincula a la persona con su unidad (CU-A-02, RN-53). Si alguien escribe
 * un documento que la copropiedad no tiene, la respuesta no es «regístrate», es
 * «pídele a la administración que te vincule».
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import {
  activarCuenta,
  cuentaActivada,
  generarCodigo,
  MINIMO_CONTRASENA,
  normalizarDocumento,
  recordarDispositivo,
} from '../../estado/acceso'
import { Logotipo } from '../../componentes/Logotipo'
import { Icono } from '../../componentes/Icono'
import { perfilDe } from './perfil'

type Paso = 'documento' | 'codigo' | 'contrasena'

export function ActivarPage({ modo }: { modo: 'activar' | 'recuperar' }) {
  const { bd } = useDatos()
  const { iniciar } = useSesion()
  const navegar = useNavigate()

  const [paso, setPaso] = useState<Paso>('documento')
  const [documento, setDocumento] = useState('')
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [esperado, setEsperado] = useState('')
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [repetida, setRepetida] = useState('')
  const [error, setError] = useState<string | null>(null)

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
      setError('Esta cuenta ya está activada. Entra con tu contraseña o recupérala.')
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
    setPaso('contrasena')
  }

  function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    if (contrasena.length < MINIMO_CONTRASENA) {
      setError(`La contraseña tiene al menos ${MINIMO_CONTRASENA} caracteres.`)
      return
    }
    if (contrasena !== repetida) {
      setError('Las dos contraseñas no coinciden.')
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
    iniciar(perfil)
    navegar(perfil.rol === 'admin' ? '/admin' : '/app', { replace: true })
  }

  return (
    <div className="acceso-fondo">
      <div className="acceso">
        <div className="acceso__marca">
          <Logotipo inverso tamano="var(--texto-3xl)" />
          <p className="acceso__lema">
            {activando ? 'Activa tu cuenta' : 'Recupera tu contraseña'}
          </p>
        </div>

        {/* Los tres pasos a la vista: en un tramite de identidad, saber cuanto falta
          es la diferencia entre terminarlo y abandonarlo. */}
        <ol className="pasos" aria-label="Pasos">
          <li className={paso === 'documento' ? 'activo' : ''}>Documento</li>
          <li className={paso === 'codigo' ? 'activo' : ''}>Código</li>
          <li className={paso === 'contrasena' ? 'activo' : ''}>Contraseña</li>
        </ol>

        {paso === 'documento' && (
          <form className="tarjeta" onSubmit={buscar}>
            <div className="campo">
              <label htmlFor="documento">Tu documento de identidad</label>
              <input
                id="documento"
                className="numerico"
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
              <label htmlFor="codigo">Código de {esperado.length} dígitos</label>
              <input
                id="codigo"
                className="numerico"
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

        {paso === 'contrasena' && (
          <form className="tarjeta" onSubmit={guardar}>
            <div className="campo">
              <label htmlFor="nueva">
                {activando ? 'Crea tu contraseña' : 'Tu nueva contraseña'}
              </label>
              <input
                id="nueva"
                type="password"
                autoComplete="new-password"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
              />
              <span className="ayuda-campo">Mínimo {MINIMO_CONTRASENA} caracteres.</span>
            </div>
            <div className="campo">
              <label htmlFor="repetida">Escríbela otra vez</label>
              <input
                id="repetida"
                type="password"
                autoComplete="new-password"
                value={repetida}
                onChange={(evento) => setRepetida(evento.target.value)}
              />
            </div>
            {error && <p className="acceso__error">{error}</p>}
            <button className="boton boton--primario boton--bloque" type="submit">
              {activando ? 'Activar y entrar' : 'Guardar y entrar'}
            </button>
            {/* Se dice que el demo no guarda contrasenas: es lo honesto y ademas
              evita que alguien escriba aqui una que use de verdad. */}
            <p className="acceso__nota" style={{ marginTop: 'var(--e4)' }}>
              <strong>Demo:</strong> no se guarda ninguna contraseña. Con la versión real esto lo
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
