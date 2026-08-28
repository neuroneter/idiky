/**
 * CU-R-01 — Ingresar a la app.
 * Doc: docs/casos-de-uso/residente.md#cu-r-01
 *
 * La puerta de la app. Hasta el 2026-08-28 aqui habia una lista de perfiles, que
 * es un atajo de demostracion y no una pantalla de producto.
 *
 * **La pantalla tiene dos caras**, y esa es la decision que la ordena:
 *
 *   - **El telefono ya te conoce** → tu nombre y **solo la clave** (Mary,
 *     2026-08-28), o la huella si la dejaste registrada (RN-55). Volver a pedir
 *     diez digitos de cedula a quien ya entro aqui es trabajo por nada.
 *   - **Nadie ha entrado en este telefono** → documento, clave y un **codigo de
 *     un solo uso** (RN-54), porque desde aqui se paga plata.
 *
 * Y la cuenta **nace vinculada**: si la administracion no vinculo a la persona a
 * una unidad, no hay a quien dejar entrar (RN-53).
 *
 * ## Por que una clave de cuatro digitos y no una contrasena
 *
 * «La contrasena debe ser algo muy sencillo porque tenemos adultos mayores»
 * (Mary). Una contrasena con mayusculas y simbolos, tecleada en un telefono, es
 * la barrera que hace que la persona deje de entrar y vuelva a llamar a la
 * administracion — es decir, la que hace que la app no sirva.
 *
 * La seguridad no baja, **cambia de sitio**: la clave solo sirve en un
 * dispositivo ya probado con un codigo (RN-54), los intentos se acaban, y quien
 * quiera entra con huella sin teclear nada. Es el razonamiento de la clave del
 * cajero.
 *
 * Nada de esto autentica de verdad (ADR-0004): no se guarda ninguna clave y el
 * codigo se muestra en pantalla. La huella si es real —la lee el aparato—; lo que
 * no existe todavia es el servidor que la comprobaria.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  activarCuenta,
  cuentaActivada,
  DIGITOS_CLAVE,
  dispositivoConocido,
  generarCodigo,
  INTENTOS_MAXIMOS,
  intentosFallidos,
  limpiarFallos,
  normalizarDocumento,
  olvidarUltimaPersona,
  recordarDispositivo,
  recordarUltimaPersona,
  registrarFallo,
  ultimaPersona,
} from '../../estado/acceso'
import { rutaInicial } from '../../dominio/reglas'
import { biometria } from '../../servicios/plataforma'
import { Logotipo } from '../../componentes/Logotipo'
import { SiluetaTorres } from '../../componentes/SiluetaTorres'
import { Icono } from '../../componentes/Icono'
import { iniciales } from '../../utilidades/formato'
import { perfilDe } from './perfil'

export function AccesoPage() {
  const { bd } = useDatos()
  const { iniciar } = useSesion()
  const navegar = useNavigate()

  const [documento, setDocumento] = useState('')
  const [clave, setClave] = useState('')
  const [codigo, setCodigo] = useState('')
  const [esperado, setEsperado] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Quien entro aqui la ultima vez, si sigue vinculado y con la cuenta activa. */
  const recordada = ultimaPersona()
  const conocida = recordada && cuentaActivada(recordada) ? sel.persona(bd, recordada) : undefined
  /** Deja entrar con otro documento sin borrar a quien el telefono recuerda. */
  const [usarDocumento, setUsarDocumento] = useState(false)
  const modoConocida = !!conocida && !usarDocumento

  /**
   * Si se puede entrar con huella.
   *
   * Se resuelve al abrir porque preguntar si hay lector es asincrono: hasta que
   * responde, el boton no existe. Vale mas que aparezca medio segundo tarde que
   * ofrecer una huella donde no hay lector.
   */
  const [hayHuella, setHayHuella] = useState(false)

  useEffect(() => {
    let vigente = true
    biometria.disponible().then((hay) => {
      if (vigente && hay && conocida) setHayHuella(biometria.registrada(conocida.id))
    })
    return () => {
      vigente = false
    }
  }, [conocida])

  const copropiedad = bd.copropiedades[0]

  function entrar(id: string) {
    const perfil = perfilDe(bd, id)
    if (!perfil) {
      setError('Tu unidad todavía no está vinculada. Escríbele a la administración.')
      return
    }
    limpiarFallos(id)
    recordarDispositivo(id)
    recordarUltimaPersona(id)
    iniciar(perfil)
    navegar(rutaInicial(perfil.rol), { replace: true })
  }

  /** RN-55 — la huella entra en el dispositivo donde se registró. */
  async function entrarConHuella(id: string) {
    setError(null)
    const confirmado = await biometria.verificar(id)
    if (!confirmado) {
      setError('No pudimos confirmar tu huella. Entra con tu clave.')
      return
    }
    entrar(id)
  }

  function verificar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)

    // A quien el telefono ya conoce no se le vuelve a pedir el documento.
    const persona = modoConocida
      ? conocida
      : bd.personas.find(
          (p) => normalizarDocumento(p.documento) === normalizarDocumento(documento),
        )

    // RN-53: la cuenta existe porque la administración vinculó a la persona. No se
    // dice «documento incorrecto»: se dice qué hacer, que es lo útil aquí.
    if (!persona) {
      setError(
        'No encontramos ese documento en la copropiedad. La administración es quien vincula tu unidad; escríbele para que te registre.',
      )
      return
    }
    if (!cuentaActivada(persona.id)) {
      setError('Todavía no has activado tu cuenta. Actívala aquí abajo y creas tu clave.')
      return
    }

    // El limite de intentos es lo que sostiene que la clave sea de cuatro digitos.
    if (intentosFallidos(persona.id) >= INTENTOS_MAXIMOS) {
      setError(
        'Por seguridad bloqueamos la clave después de varios intentos. Toca «Olvidé mi clave» y te enviamos un código.',
      )
      return
    }
    if (clave.length !== DIGITOS_CLAVE || !/^\d+$/.test(clave)) {
      const fallos = registrarFallo(persona.id)
      const quedan = INTENTOS_MAXIMOS - fallos
      setError(
        quedan > 0
          ? `La clave son ${DIGITOS_CLAVE} números. Te quedan ${quedan} ${quedan === 1 ? 'intento' : 'intentos'}.`
          : 'Se acabaron los intentos. Toca «Olvidé mi clave» y te enviamos un código.',
      )
      return
    }

    // RN-54: teléfono nuevo, código además de la clave.
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
        <SiluetaTorres className="acceso-fondo__siluetas" />
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

            {/* En la versión real esto llega por SMS. Aquí se muestra: un demo que
                pide un código que nunca llega no se le puede mostrar a nadie. */}
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
      {/* Las mismas torres del fondo de la app: la puerta y el interior son el
          mismo edificio. */}
      <SiluetaTorres className="acceso-fondo__siluetas" />
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
          {modoConocida && conocida ? (
            /* El teléfono ya sabe quién eres: solo falta la clave. */
            <div className="tarjeta__cuerpo" style={{ marginBottom: 'var(--e4)' }}>
              <span className="avatar avatar--perfil">
                {iniciales(conocida.nombres, conocida.apellidos)}
              </span>
              <div className="columna">
                <strong>{nombreCompleto(conocida)}</strong>
                <span className="subtitulo">Escribe tu clave para entrar</span>
              </div>
            </div>
          ) : (
            <div className="campo">
              <label htmlFor="documento">Documento de identidad</label>
              <input
                id="documento"
                className="campo-numeros"
                inputMode="numeric"
                autoComplete="username"
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
                placeholder="Sin puntos ni espacios"
              />
            </div>
          )}

          <div className="campo">
            <label htmlFor="clave">Tu clave de {DIGITOS_CLAVE} números</label>
            <input
              id="clave"
              className="campo-numeros"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={DIGITOS_CLAVE}
              value={clave}
              onChange={(evento) => setClave(evento.target.value.replace(/\D/g, ''))}
              placeholder="••••"
            />
          </div>

          {error && <p className="acceso__error">{error}</p>}

          <button className="boton boton--primario boton--bloque" type="submit">
            Ingresar
          </button>

          {/* La huella va debajo de la clave, no encima: es un atajo de este
              teléfono, y quien lo cambió o lo perdió necesita ver primero el
              camino que siempre funciona. */}
          {modoConocida && conocida && hayHuella && (
            <button
              type="button"
              className="boton boton--salida boton--bloque"
              style={{ marginTop: 'var(--e2)' }}
              onClick={() => void entrarConHuella(conocida.id)}
            >
              <Icono nombre="huella" tamano={20} />
              Entrar con huella
            </button>
          )}

          <div className="acceso__enlaces">
            {modoConocida ? (
              <button
                type="button"
                className="enlace"
                onClick={() => {
                  olvidarUltimaPersona()
                  setUsarDocumento(true)
                  setError(null)
                }}
              >
                No soy yo
              </button>
            ) : (
              <Link to="/acceso/activar">Activar mi cuenta</Link>
            )}
            <Link to="/acceso/recuperar">Olvidé mi clave</Link>
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
        Entra directo con uno de estos perfiles, sin documento ni clave.
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
