/**
 * CU-R-28 — Adjuntar mis documentos a un registro.
 * Doc: docs/casos-de-uso/residente.md#cu-r-28
 *
 * **Está en la puerta a propósito, fuera de la sesión.** Quien tiene que
 * adjuntar todavía no es nadie para la copropiedad: lo acaban de registrar y
 * puede no tener cuenta. Pedirle que active una cuenta para poder adjuntar los
 * soportes que hacen falta para autorizarle la cuenta es un círculo, y es donde
 * el trámite se muere.
 *
 * Se identifica con lo que sí tiene: **su documento y el código** que le pasó
 * quien lo registró (RN-58). Es la misma pareja que usa el paz y salvo para
 * verificarse: un dato que la persona sabe y un código que solo pudo darle quien
 * hizo el trámite.
 *
 * Lo que hace esta pantalla y nada más: **subir dos fotos**. No crea la cuenta,
 * no vincula, no autoriza. Autorizar es de quien registró (RN-59), y separarlo
 * es lo que hace que el soporte signifique algo.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDatos } from '../../estado/DatosContext'
import { adjuntarSoportes, registroPorCodigo } from '../../datos/repositorio'
import { Logotipo } from '../../componentes/Logotipo'
import { SiluetaTorres } from '../../componentes/SiluetaTorres'
import { ControlTamanoTexto } from '../../componentes/ControlTamanoTexto'
import { CapturaFoto } from '../../componentes/CapturaFoto'
import { Icono } from '../../componentes/Icono'
import type { RegistroPersona } from '../../dominio/tipos'
import {
  FRASE_ACEPTACION,
  politicaDatos,
  VERSION_POLITICA,
} from '../../dominio/consentimiento'
import * as sel from '../../datos/selectores'

export function AdjuntarPage() {
  const { bd, ejecutar, cargando } = useDatos()


  const [documento, setDocumento] = useState('')
  const [codigo, setCodigo] = useState('')
  const [registro, setRegistro] = useState<RegistroPersona | null>(null)
  const [fotoDocumento, setFotoDocumento] = useState<string | null>(null)
  const [fotoPersona, setFotoPersona] = useState<string | null>(null)
  const [listo, setListo] = useState(false)
  /** RN-66: la casilla nace sin marcar. Premarcarla no es autorizar. */
  const [autoriza, setAutoriza] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function buscar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)
    const encontrado = registroPorCodigo(bd, documento, codigo)
    if (!encontrado) {
      setError(
        'No encontramos ese registro. Revisa el documento y el código con quien te registró.',
      )
      return
    }
    if (encontrado.estado === 'esperando_autorizacion') {
      setError('Ya adjuntaste tus documentos. Falta que quien te registró los autorice.')
      return
    }
    if (encontrado.estado !== 'esperando_soportes') {
      setError('Ese registro ya está cerrado. Habla con quien te registró.')
      return
    }
    setRegistro(encontrado)
  }

  async function enviar() {
    if (!registro || !fotoDocumento || !fotoPersona || !autoriza) return
    const hecho = await ejecutar(
      (base) =>
        adjuntarSoportes(base, {
          registroId: registro.id,
          fotoDocumento,
          fotoPersona,
          consentimiento: VERSION_POLITICA,
        }),
      'Listo. Quien te registró ya puede autorizar.',
    )
    if (hecho) setListo(true)
  }

  // El responsable del tratamiento es la copropiedad, no Idiky: hay que nombrarla.
  const copropiedad = sel.copropiedad(bd, registro?.copropiedadId ?? '') ?? bd.copropiedades[0]

  return (
    <div className="acceso-fondo">
      <SiluetaTorres className="acceso-fondo__siluetas" />
      <div className="acceso">
        <ControlTamanoTexto />

        <div className="acceso__marca">
          <Logotipo inverso tamano="var(--texto-3xl)" />
          <p className="acceso__lema">Adjunta tus documentos</p>
        </div>

        {listo ? (
          <div className="tarjeta tarjeta--exito">
            <div className="tarjeta__cuerpo" style={{ alignItems: 'flex-start' }}>
              <Icono nombre="check" tamano={22} />
              <div className="columna">
                <strong>Tus documentos quedaron enviados</strong>
                <span className="subtitulo">
                  Ahora {registro?.nombres ? 'quien te registró' : 'el responsable de la unidad'}{' '}
                  los revisa y autoriza tu registro. Te avisamos cuando esté.
                </span>
              </div>
            </div>
          </div>
        ) : !registro ? (
          <form className="tarjeta" onSubmit={buscar}>
            <div className="campo">
              <label htmlFor="documento">Tu documento de identidad</label>
              <input
                id="documento"
                className="campo-numeros"
                inputMode="numeric"
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
                placeholder="Sin puntos"
              />
            </div>
            <div className="campo">
              <label htmlFor="codigo">El código que te pasaron</label>
              <input
                id="codigo"
                className="campo-numeros"
                style={{ textTransform: 'uppercase' }}
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value)}
                placeholder="REG-00000"
                autoComplete="off"
              />
              <span className="ayuda-campo">Te lo dio quien te registró en la copropiedad.</span>
            </div>
            {error && <p className="acceso__error">{error}</p>}
            <button className="boton boton--primario boton--bloque" type="submit">
              Continuar
            </button>
          </form>
        ) : (
          <div className="tarjeta">
            <div className="columna" style={{ gap: 'var(--e1)', marginBottom: 'var(--e4)' }}>
              <strong>
                Hola, {registro.nombres} {registro.apellidos}
              </strong>
              <span className="subtitulo">
                Necesitamos dos fotos para completar tu registro. Nadie puede subirlas por ti.
              </span>
            </div>

            {/* La autorización va **antes** de las cámaras, no debajo del botón:
                quien ya tomó las dos fotos no vuelve a leer nada, y una casilla
                al final de un formulario largo se marca sin mirar. Aquí se lee
                primero y se decide antes de sacar la cédula. */}
            <PoliticaDeDatos
              copropiedad={copropiedad?.nombre ?? 'La copropiedad'}
              nit={copropiedad?.nit}
              autoriza={autoriza}
              alCambiar={setAutoriza}
            />

            <div className="separador" />

            <CapturaFoto
              etiqueta="Foto de tu documento"
              ayuda="La cara donde se ve tu número y tu nombre. Que se lea."
              valor={fotoDocumento}
              alCambiar={setFotoDocumento}
              camara="environment"
            />

            <div className="separador" />

            <CapturaFoto
              etiqueta="Foto tuya"
              ayuda="De frente y con buena luz. Es la que la portería compara al verte."
              valor={fotoPersona}
              alCambiar={setFotoPersona}
              camara="user"
            />

            <div className="separador" />

            <button
              className="boton boton--primario boton--bloque"
              disabled={!fotoDocumento || !fotoPersona || !autoriza || cargando}
              onClick={() => void enviar()}
            >
              Enviar mis documentos
            </button>
            {(!fotoDocumento || !fotoPersona || !autoriza) && (
              <span className="ayuda-campo" style={{ display: 'block', marginTop: 'var(--e2)' }}>
                {!autoriza
                  ? 'Para enviar tienes que autorizar el tratamiento de tus datos.'
                  : 'Faltan las dos fotos para poder enviar.'}
              </span>
            )}

            {/* Se dice dónde quedan las fotos. Es un documento de identidad: quien
                lo sube tiene derecho a saber a dónde va (ADR-0009). */}
            <p className="acceso__nota" style={{ marginTop: 'var(--e4)' }}>
              <strong>Demo:</strong> las fotos se quedan en este navegador y no salen a ningún
              servidor. En la versión real habrá que decir cuánto se conservan y quién las ve.
            </p>
          </div>
        )}

        <Link to="/acceso" className="boton boton--fantasma">
          <Icono nombre="volver" tamano={15} />
          Volver al ingreso
        </Link>
      </div>
    </div>
  )
}


/**
 * La política, plegada pero completa.
 *
 * **Plegada y no resumida**: el resumen de una política de datos es la política
 * que nadie puede leer entera. Va cerrada para no tapar la pantalla, pero lo que
 * hay adentro es el texto, no un extracto.
 *
 * La casilla vive fuera del plegado, porque marcarla es la acción y tiene que
 * verse sin abrir nada.
 */
function PoliticaDeDatos({
  copropiedad,
  nit,
  autoriza,
  alCambiar,
}: {
  copropiedad: string
  nit?: string
  autoriza: boolean
  alCambiar: (valor: boolean) => void
}) {
  const puntos = politicaDatos(copropiedad, nit)

  return (
    <div className="politica">
      <details className="politica__detalle">
        <summary>Cómo se tratan tus datos personales</summary>
        <div className="politica__cuerpo">
          {puntos.map((punto) => (
            <div key={punto.titulo} className="columna" style={{ gap: 'var(--e1)' }}>
              <strong>{punto.titulo}</strong>
              <span className="subtitulo">{punto.texto}</span>
            </div>
          ))}
          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            Ley 1581 de 2012 · Versión {VERSION_POLITICA}
          </span>
        </div>
      </details>

      <label className="opcion-huella">
        <input
          type="checkbox"
          checked={autoriza}
          onChange={(evento) => alCambiar(evento.target.checked)}
        />
        <span>
          <strong>{FRASE_ACEPTACION}</strong>
          <span className="subtitulo">
            Puedes revocarla después pidiéndoselo a la administración.
          </span>
        </span>
      </label>
    </div>
  )
}
