/**
 * CU-R-01 — Ingresar a la app.
 * Doc: docs/casos-de-uso/residente.md#cu-r-01
 *
 * La puerta de la app, **sin clave** desde el 2026-10-01 (Mary: «necesitamos
 * que el ingreso sea con su correo autenticado o con SMS, como funciona ahora
 * la mayoría de ingresos»). Tres pasos:
 *
 *   1. **Quién eres**: documento, celular o correo, un solo campo.
 *   2. **Por dónde recibes el código**: SMS al celular registrado o correo
 *      registrado; solo los canales que la persona tiene.
 *   3. **El código** de seis números. Con él entra; la primera vez, eso mismo
 *      activa la cuenta. No hay «activar» ni «olvidé mi clave».
 *
 * Si el teléfono ya conoce a alguien, muestra su nombre y ofrece la **huella**
 * (RN-56) o un código nuevo. La cuenta **nace vinculada**: si nadie registró a
 * la persona, no hay a quién dejar entrar (RN-53).
 *
 * Nada de esto autentica de verdad (ADR-0004): el código se muestra en
 * pantalla. La huella sí es real —la lee el aparato—; lo que no existe todavía
 * es el servidor que enviaría el código y comprobaría la credencial (T-18).
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import {
  type CanalCodigo,
  canalesDe,
  codigoVigente,
  DIGITOS_CODIGO,
  generarCodigo,
  identificarPersona,
  INTENTOS_CODIGO,
  olvidarUltimaPersona,
  recordarUltimaPersona,
  ultimaPersona,
  VIGENCIA_CODIGO_MINUTOS,
} from '../../estado/acceso'
import { rutaInicial } from '../../dominio/reglas'
import { biometria } from '../../servicios/plataforma'
import { Logotipo } from '../../componentes/Logotipo'
import { SiluetaTorres } from '../../componentes/SiluetaTorres'
import { ControlTamanoTexto } from '../../componentes/ControlTamanoTexto'
import { Icono } from '../../componentes/Icono'
import { iniciales } from '../../utilidades/formato'
import { perfilDe } from './perfil'
import { FECHA_BUILD, VERSION_APP, leerRevisionDelServidor } from '../../servicios/version'

type Paso = 'quien' | 'canal' | 'codigo'

export function AccesoPage() {
  const { bd } = useDatos()
  const { iniciar } = useSesion()
  const navegar = useNavigate()

  const [paso, setPaso] = useState<Paso>('quien')
  const [identificador, setIdentificador] = useState('')
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [canal, setCanal] = useState<CanalCodigo | null>(null)
  const [esperado, setEsperado] = useState<string | null>(null)
  const [emitidoEn, setEmitidoEn] = useState(0)
  const [intentos, setIntentos] = useState(0)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  /** Registrar la huella al entrar, si el aparato tiene lector y aún no está. */
  const [conHuella, setConHuella] = useState(true)
  const [hayLector, setHayLector] = useState(false)

  /** Quien entró aquí la última vez, si sigue vinculado. */
  const recordada = ultimaPersona()
  const conocida = recordada ? sel.persona(bd, recordada) : undefined
  const [usarOtra, setUsarOtra] = useState(false)
  const modoConocida = !!conocida && !usarOtra && paso === 'quien'
  const huellaRegistrada = !!conocida && hayLector && biometria.registrada(conocida.id)

  useEffect(() => {
    let vigente = true
    biometria.disponible().then((hay) => {
      if (vigente) setHayLector(hay)
    })
    return () => {
      vigente = false
    }
  }, [])

  const copropiedad = bd.copropiedades[0]
  const persona = personaId ? sel.persona(bd, personaId) : undefined
  const canales = persona ? canalesDe(persona) : []

  function entrar(id: string) {
    const perfil = perfilDe(bd, id)
    if (!perfil) {
      setError('Tu unidad todavía no está vinculada. Escríbele a la administración.')
      return
    }
    recordarUltimaPersona(id)
    iniciar(perfil)
    navegar(rutaInicial(perfil.rol), { replace: true })
  }

  /** RN-56 — la huella entra en el dispositivo donde se registró. */
  async function entrarConHuella(id: string) {
    setError(null)
    const confirmado = await biometria.verificar(id)
    if (!confirmado) {
      setError('No pudimos confirmar tu huella. Pide un código y entra con él.')
      return
    }
    entrar(id)
  }

  /** Paso 1 → 2: quién es, y por dónde puede recibir el código. */
  function identificar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    const encontrada = identificarPersona(bd.personas, identificador)
    // RN-53: la cuenta existe porque alguien registró a la persona. No se dice
    // «dato incorrecto»: se dice qué hacer, que es lo útil aquí.
    if (!encontrada) {
      setError(
        'No encontramos ese dato en la copropiedad. La administración o el propietario de tu unidad son quienes te registran; escríbeles y vuelve a intentar.',
      )
      return
    }
    if (canalesDe(encontrada).length === 0) {
      setError(
        `Hola, ${encontrada.nombres}. No tienes celular ni correo registrados, y sin eso no hay a dónde enviarte el código. Pide a quien te registró que los agregue.`,
      )
      return
    }
    prepararCanal(encontrada.id)
  }

  function prepararCanal(id: string) {
    setPersonaId(id)
    setUsarOtra(false)
    setCanal(null)
    setEsperado(null)
    setCodigo('')
    setIntentos(0)
    setError(null)
    setPaso('canal')
  }

  /** Paso 2 → 3: se «envía» el código por el canal elegido. */
  function enviarCodigo(elegido: CanalCodigo) {
    setCanal(elegido)
    setEsperado(generarCodigo())
    setEmitidoEn(Date.now())
    setIntentos(0)
    setCodigo('')
    setError(null)
    setPaso('codigo')
  }

  /** Paso 3: el código, con vigencia y con intentos. */
  async function confirmarCodigo(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    if (!esperado || !personaId) return
    if (!codigoVigente(emitidoEn)) {
      setError(`Ese código ya venció: valía ${VIGENCIA_CODIGO_MINUTOS} minutos. Pide uno nuevo.`)
      setPaso('canal')
      return
    }
    if (codigo.trim() !== esperado) {
      const hechos = intentos + 1
      setIntentos(hechos)
      if (hechos >= INTENTOS_CODIGO) {
        setError('Se acabaron los intentos con ese código. Pide uno nuevo.')
        setPaso('canal')
        return
      }
      const quedan = INTENTOS_CODIGO - hechos
      setError(`Ese código no coincide. Te ${quedan === 1 ? 'queda un intento' : `quedan ${quedan} intentos`}.`)
      return
    }
    // RN-56 — La huella se registra ya adentro de la puerta, con la identidad
    // recién confirmada por el código. Si el aparato no la registra, se entra
    // igual: la huella es un atajo, no la puerta.
    if (conHuella && hayLector && persona && !biometria.registrada(persona.id)) {
      await biometria.registrar(persona.id, nombreCompleto(persona))
    }
    entrar(personaId)
  }

  const volverAlInicio = () => {
    setPaso('quien')
    setPersonaId(null)
    setCanal(null)
    setEsperado(null)
    setCodigo('')
    setError(null)
  }

  return (
    <div className="acceso-fondo">
      {/* Las mismas torres del fondo de la app: la puerta y el interior son el
          mismo edificio. */}
      <SiluetaTorres className="acceso-fondo__siluetas" />
      <div className="acceso">
        {/* Antes que el logo y que el formulario: quien no puede leer la pantalla
            necesita esto primero, no después de fallar al escribir. */}
        <ControlTamanoTexto />

        <div className="acceso__marca">
          <Logotipo inverso tamano="var(--texto-3xl)" />
          <p className="acceso__lema">
            Gestión de copropiedad horizontal
            <br />
            <strong>{copropiedad?.nombre}</strong>
          </p>
        </div>

        {paso === 'quien' && (
          <form className="tarjeta" onSubmit={identificar}>
            {modoConocida && conocida ? (
              /* El teléfono ya sabe quién eres: huella, o un código nuevo. */
              <>
                <div className="tarjeta__cuerpo" style={{ marginBottom: 'var(--e4)' }}>
                  <span className="avatar avatar--perfil">
                    {iniciales(conocida.nombres, conocida.apellidos)}
                  </span>
                  <div className="columna">
                    <strong>{nombreCompleto(conocida)}</strong>
                    <span className="subtitulo">
                      {huellaRegistrada ? 'Entra con tu huella o pide un código' : 'Te enviamos un código para entrar'}
                    </span>
                  </div>
                </div>
                {error && <p className="acceso__error">{error}</p>}
                {huellaRegistrada && (
                  <button
                    type="button"
                    className="boton boton--primario boton--bloque"
                    onClick={() => void entrarConHuella(conocida.id)}
                  >
                    <Icono nombre="huella" tamano={20} />
                    Entrar con huella
                  </button>
                )}
                <button
                  type="button"
                  className={`boton boton--bloque${huellaRegistrada ? '' : ' boton--primario'}`}
                  style={{ marginTop: huellaRegistrada ? 'var(--e2)' : undefined }}
                  onClick={() => prepararCanal(conocida.id)}
                >
                  Enviarme un código
                </button>
                <div className="acceso__enlaces">
                  <button
                    type="button"
                    className="enlace"
                    onClick={() => {
                      olvidarUltimaPersona()
                      setUsarOtra(true)
                      setError(null)
                    }}
                  >
                    No soy yo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="campo">
                  <label htmlFor="identificador">Tu documento, celular o correo</label>
                  <input
                    id="identificador"
                    autoComplete="username"
                    value={identificador}
                    onChange={(evento) => setIdentificador(evento.target.value)}
                    placeholder="Con el que te registraron"
                  />
                  <span className="ayuda-campo">
                    Te enviamos un código por SMS o por correo, y con él entras. Sin clave.
                  </span>
                </div>
                {error && <p className="acceso__error">{error}</p>}
                <button className="boton boton--primario boton--bloque" type="submit">
                  Continuar
                </button>
              </>
            )}

            {/* Quien tiene que adjuntar sus documentos todavía no tiene cuenta:
                si esto estuviera detrás del ingreso, no podría llegar (CU-R-28). */}
            <div className="separador" />
            <Link to="/acceso/adjuntar" className="boton boton--bloque">
              <Icono nombre="camara" tamano={16} />
              Adjuntar mis documentos
            </Link>
          </form>
        )}

        {paso === 'canal' && persona && (
          <div className="tarjeta">
            <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e4)' }}>
              <strong>Hola, {persona.nombres}. ¿Por dónde te enviamos el código?</strong>
              <span className="subtitulo">
                Solo a los datos que la copropiedad tiene registrados de ti.
              </span>
            </div>
            {error && <p className="acceso__error">{error}</p>}
            <div className="lista lista--compacta">
              {canales.map(({ canal: opcion, destino }) => (
                <button
                  key={opcion}
                  type="button"
                  className="opcion-categoria"
                  onClick={() => enviarCodigo(opcion)}
                >
                  <strong>{opcion === 'sms' ? 'Por SMS' : 'Por correo'}</strong>
                  <span className="subtitulo">
                    {opcion === 'sms' ? `Al celular ${destino}` : `A ${destino}`}
                  </span>
                </button>
              ))}
            </div>
            <div className="acceso__enlaces">
              <button type="button" className="enlace" onClick={volverAlInicio}>
                No soy yo
              </button>
            </div>
          </div>
        )}

        {paso === 'codigo' && persona && esperado && (
          <form className="tarjeta" onSubmit={(evento) => void confirmarCodigo(evento)}>
            <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e4)' }}>
              <strong>Escribe el código que te llegó</strong>
              <span className="subtitulo">
                {canal === 'sms'
                  ? `Lo enviamos por SMS al celular ${canalesDe(persona).find((c) => c.canal === 'sms')?.destino}.`
                  : `Lo enviamos al correo ${canalesDe(persona).find((c) => c.canal === 'correo')?.destino}.`}{' '}
                Vale {VIGENCIA_CODIGO_MINUTOS} minutos.
              </span>
            </div>
            <div className="campo">
              <label htmlFor="codigo">Código de {DIGITOS_CODIGO} números</label>
              <input
                id="codigo"
                className="campo-numeros"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>

            {/* RN-56 — La huella, como atajo para la próxima vez. Solo donde hay lector. */}
            {hayLector && !biometria.registrada(persona.id) && (
              <label className="opcion-huella">
                <input type="checkbox" checked={conHuella} onChange={(e) => setConHuella(e.target.checked)} />
                <span>
                  <strong>Entrar con huella la próxima vez</strong>
                  <span className="subtitulo">En este teléfono, sin esperar ningún código.</span>
                </span>
              </label>
            )}

            {error && <p className="acceso__error">{error}</p>}

            <button className="boton boton--primario boton--bloque" type="submit">
              Entrar
            </button>

            {/* En la versión real esto llega por SMS o correo. Aquí se muestra: un
                demo que pide un código que nunca llega no se le puede mostrar a nadie. */}
            <p className="acceso__nota" style={{ marginTop: 'var(--e4)' }}>
              <strong>Demo:</strong> tu código es <strong className="numerico">{esperado}</strong>.
              En la versión real llega por {canal === 'sms' ? 'SMS' : 'correo'} y no se ve aquí.
            </p>

            <div className="acceso__enlaces">
              <button type="button" className="enlace" onClick={() => setPaso('canal')}>
                Enviar otro código
              </button>
              <button type="button" className="enlace" onClick={volverAlInicio}>
                No soy yo
              </button>
            </div>
          </form>
        )}

        <AtajoDemo alSeleccionar={(id) => entrar(id)} />

        {/* Qué versión tiene esta persona: es lo primero que hay que saber
            cuando alguien dice «a mí no me sale» (Mary, 2026-10-01). */}
        <VersionAlPie />
      </div>
    </div>
  )
}

function VersionAlPie() {
  const [revision, setRevision] = useState<string | null>(null)
  useEffect(() => {
    void leerRevisionDelServidor().then(setRevision)
  }, [])
  return (
    <p className="acceso__version">
      Idiky {VERSION_APP} · compilada el {FECHA_BUILD}
      {revision ? (
        <>
          {' '}· servidor <span className="numerico">{revision}</span>
        </>
      ) : (
        ' · demo en este dispositivo'
      )}
    </p>
  )
}

/**
 * El atajo de demostración, **debajo y aparte**. Sigue haciendo falta —hay que
 * poder mostrar la consola del administrador sin teclear cédulas—, pero no es
 * la pantalla de acceso.
 */
function AtajoDemo({ alSeleccionar }: { alSeleccionar: (personaId: string) => void }) {
  const { bd, reiniciarDemo } = useDatos()

  return (
    <details className="acceso__demo">
      <summary>¿Estás viendo el demo?</summary>
      <p className="subtitulo" style={{ margin: 'var(--e3) 0' }}>
        Entra directo con uno de estos perfiles, sin código.
      </p>
      <div className="lista">
        {bd.perfilesDemo.map((perfil) => (
          <button
            key={perfil.id}
            className="tarjeta tarjeta--plana tarjeta--accion"
            onClick={() => alSeleccionar(perfil.personaId)}
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
