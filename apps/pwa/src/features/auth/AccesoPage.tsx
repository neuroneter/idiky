/**
 * CU-R-01 — Ingresar a la app.
 * Doc: docs/casos-de-uso/residente.md#cu-r-01
 *
 * La puerta de la app. Hasta el 2026-08-28 aqui habia una lista de perfiles, que
 * es un atajo de demostracion y no una pantalla de producto: un residente real
 * nunca veria eso. Mary lo senalo —«lo que hemos trabajado son las pantallas
 * adentro»— y el equipo decidio como se entra:
 *
 *   - **con el documento**, que es lo que la administracion ya tiene de cada
 *     propietario y no cambia cuando cambia el correo o el celular;
 *   - **contrasena**, y en un telefono nuevo ademas un **codigo de un solo uso**
 *     (RN-54), porque desde aqui se paga plata;
 *   - **la cuenta nace vinculada**: si la administracion no vinculo a la persona
 *     a una unidad, no hay a quien dejar entrar (RN-53).
 *
 * Nada de esto autentica de verdad (ADR-0004): no se guarda ninguna contrasena y
 * el codigo se muestra en pantalla. La pantalla lo dice, para que nadie confunda
 * el demo con un sistema de acceso.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import {
  activarCuenta,
  cuentaActivada,
  dispositivoConocido,
  generarCodigo,
  MINIMO_CONTRASENA,
  normalizarDocumento,
  recordarDispositivo,
} from '../../estado/acceso'
import { Logotipo } from '../../componentes/Logotipo'
import { Icono } from '../../componentes/Icono'
import { perfilDe } from './perfil'

export function AccesoPage() {
  const { bd } = useDatos()
  const { iniciar } = useSesion()
  const navegar = useNavigate()

  const [documento, setDocumento] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [codigo, setCodigo] = useState('')
  const [esperado, setEsperado] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const copropiedad = bd.copropiedades[0]

  function entrar(id: string) {
    const perfil = perfilDe(bd, id)
    if (!perfil) {
      setError('Tu unidad todavía no está vinculada. Escríbele a la administración.')
      return
    }
    recordarDispositivo(id)
    iniciar(perfil)
    navegar(perfil.rol === 'admin' ? '/admin' : '/app', { replace: true })
  }

  function verificar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)

    const buscado = normalizarDocumento(documento)
    const persona = bd.personas.find((p) => normalizarDocumento(p.documento) === buscado)

    // RN-53: la cuenta existe porque la administracion vinculo a la persona. No se
    // dice «documento incorrecto»: se dice que hacer, que es lo util aqui.
    if (!persona) {
      setError(
        'No encontramos ese documento en la copropiedad. La administración es quien vincula tu unidad; escríbele para que te registre.',
      )
      return
    }
    if (!cuentaActivada(persona.id)) {
      setError('Todavía no has activado tu cuenta. Actívala aquí abajo y creas tu contraseña.')
      return
    }
    if (contrasena.length < MINIMO_CONTRASENA) {
      setError(`La contraseña tiene al menos ${MINIMO_CONTRASENA} caracteres.`)
      return
    }

    // RN-54: telefono nuevo, codigo ademas de la contrasena.
    if (dispositivoConocido(persona.id)) {
      entrar(persona.id)
      return
    }
    setPersonaId(persona.id)
    setEsperado(generarCodigo())
  }

  function confirmarCodigo(evento: React.FormEvent) {
    evento.preventDefault()
    if (codigo.trim() !== esperado) {
      setError('Ese código no coincide. Revísalo y vuelve a intentar.')
      return
    }
    if (personaId) entrar(personaId)
  }

  if (esperado && personaId) {
    const persona = sel.persona(bd, personaId)
    return (
      <div className="acceso-fondo">
        <div className="acceso">
          <div className="acceso__marca">
            <Logotipo inverso tamano="var(--texto-3xl)" />
          </div>

          <form className="tarjeta" onSubmit={confirmarCodigo}>
            <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e4)' }}>
              <strong>Confirma que eres tú</strong>
              <span className="subtitulo">
                Es la primera vez que entras desde este teléfono. Te enviamos un código a{' '}
                {persona?.telefono ?? 'tu celular'}.
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

            {/* En la version real esto llega por SMS. Aqui se muestra: un demo que
              pide un codigo que nunca llega no se le puede mostrar a nadie. */}
            <p className="acceso__nota" style={{ marginTop: 'var(--e4)' }}>
              <strong>Demo:</strong> tu código es <strong className="numerico">{esperado}</strong>.
              En la versión real llega por mensaje y no se ve aquí.
            </p>
          </form>

          <button
            className="boton boton--fantasma"
            onClick={() => {
              setEsperado(null)
              setPersonaId(null)
              setCodigo('')
              setError(null)
            }}
          >
            <Icono nombre="volver" tamano={15} />
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="acceso-fondo">
      <div className="acceso">
        <div className="acceso__marca">
          <Logotipo inverso tamano="var(--texto-3xl)" />
          <p className="acceso__lema">
            Gestión de copropiedad horizontal
            <br />
            <strong>{copropiedad?.nombre}</strong>
          </p>
        </div>

        <form className="tarjeta" onSubmit={verificar}>
          <div className="campo">
            <label htmlFor="documento">Documento de identidad</label>
            <input
              id="documento"
              className="numerico"
              inputMode="numeric"
              autoComplete="username"
              value={documento}
              onChange={(evento) => setDocumento(evento.target.value)}
              placeholder="Sin puntos ni espacios"
            />
          </div>

          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              placeholder="Tu contraseña"
            />
          </div>

          {error && <p className="acceso__error">{error}</p>}

          <button className="boton boton--primario boton--bloque" type="submit">
            Ingresar
          </button>

          <div className="acceso__enlaces">
            <Link to="/acceso/activar">Activar mi cuenta</Link>
            <Link to="/acceso/recuperar">Olvidé mi contraseña</Link>
          </div>
        </form>

        <AtajoDemo alSeleccionar={(id) => entrar(id)} />
      </div>
    </div>
  )
}

/**
 * El atajo de demostracion, ahora donde le corresponde: **debajo y aparte**.
 *
 * Sigue haciendo falta —hay que poder mostrar la consola del administrador sin
 * teclear cedulas—, pero ya no es la pantalla de acceso. Entra directo y de paso
 * marca el dispositivo como conocido, para no pedirle un codigo a quien solo esta
 * mirando el demo.
 */
function AtajoDemo({ alSeleccionar }: { alSeleccionar: (personaId: string) => void }) {
  const { bd, reiniciarDemo } = useDatos()

  return (
    <details className="acceso__demo">
      <summary>¿Estás viendo el demo?</summary>
      <p className="subtitulo" style={{ margin: 'var(--e3) 0' }}>
        Entra directo con uno de estos perfiles, sin documento ni contraseña.
      </p>
      <div className="lista">
        {bd.perfilesDemo.map((perfil) => (
          <button
            key={perfil.id}
            className="tarjeta tarjeta--plana tarjeta--accion"
            onClick={() => {
              // Entrar por el atajo cuenta como activar: si no, quien lo usa se
              // queda sin poder volver a entrar con su documento.
              activarCuenta(perfil.personaId)
              alSeleccionar(perfil.personaId)
            }}
          >
            <div className="fila">
              <div className="columna">
                <strong>{perfil.etiqueta}</strong>
                <span className="subtitulo">{perfil.descripcion}</span>
              </div>
              <Icono nombre="chevron" tamano={16} className="tenue" />
            </div>
          </button>
        ))}
      </div>
      <button
        className="boton boton--fantasma boton--bloque"
        style={{ marginTop: 'var(--e3)' }}
        onClick={reiniciarDemo}
      >
        <Icono nombre="reiniciar" tamano={15} />
        Reiniciar los datos del demo
      </button>
    </details>
  )
}
