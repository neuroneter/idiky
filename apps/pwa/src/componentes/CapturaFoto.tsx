/**
 * Captura de una foto de soporte (RN-57), sin dependencias nuevas.
 * Decisión: [ADR-0009](../../../../docs/adr/0009-soportes-fotograficos.md).
 *
 * Usa `<input type="file" accept="image/*" capture>`: en un teléfono abre la
 * cámara, en un computador abre el explorador de archivos. Es la misma etiqueta
 * que existe desde siempre y funciona igual dentro del WebView de Capacitor
 * (ADR-0002), así que no hace falta ninguna librería.
 *
 * **La foto se reduce antes de guardarse.** Una cámara de teléfono entrega 3 o
 * 4 MB por disparo y el demo entero vive en `localStorage`, que da unos 5 MB
 * para todo: dos fotos sin reducir llenarían la cuota en el primer registro y
 * la app dejaría de guardar sin decir por qué. Reducidas a 720 px de lado mayor
 * pesan unos 60 KB y siguen sirviendo para lo que son: comparar una cara y leer
 * un documento.
 */

import { useRef, useState } from 'react'
import { Icono } from './Icono'

/** Lado mayor de la imagen guardada. Suficiente para leer una cédula. */
const LADO_MAXIMO = 720
/** Calidad JPEG. Por debajo de 0.5 el número del documento empieza a costar. */
const CALIDAD = 0.6

/**
 * Reduce la imagen y la devuelve como data URI.
 *
 * Si algo falla —un archivo que no es imagen, un navegador sin canvas— se
 * devuelve `null` y la pantalla lo dice. Guardar el original de 4 MB «por si
 * acaso» es lo que rompe el almacenamiento del demo.
 */
async function reducir(archivo: File): Promise<string | null> {
  const url = URL.createObjectURL(archivo)
  try {
    const imagen = await new Promise<HTMLImageElement | null>((resolver) => {
      const elemento = new Image()
      elemento.onload = () => resolver(elemento)
      elemento.onerror = () => resolver(null)
      elemento.src = url
    })
    if (!imagen) return null

    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(imagen.width * escala)
    lienzo.height = Math.round(imagen.height * escala)
    const contexto = lienzo.getContext('2d')
    if (!contexto) return null
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
    return lienzo.toDataURL('image/jpeg', CALIDAD)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function CapturaFoto({
  etiqueta,
  ayuda,
  valor,
  alCambiar,
  /** `user` es la cámara frontal (la cara); `environment`, la de atrás (el documento). */
  camara = 'environment',
}: {
  etiqueta: string
  ayuda: string
  valor: string | null
  alCambiar: (imagen: string | null) => void
  camara?: 'user' | 'environment'
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function recibir(archivo: File | undefined) {
    if (!archivo) return
    setError(null)
    setCargando(true)
    const reducida = await reducir(archivo)
    setCargando(false)
    if (!reducida) {
      setError('No pudimos leer esa imagen. Intenta con otra foto.')
      return
    }
    alCambiar(reducida)
  }

  return (
    <div className="captura">
      <div className="columna" style={{ gap: 'var(--e1)' }}>
        <strong>{etiqueta}</strong>
        <span className="subtitulo">{ayuda}</span>
      </div>

      {valor ? (
        <div className="captura__hecha">
          {/* Se muestra lo que se va a guardar, no un «listo» verde: quien
              adjunta tiene que poder ver que la foto salió legible antes de
              mandarla, o el rechazo llega dos días después. */}
          <img src={valor} alt={etiqueta} className="captura__vista" />
          <div className="grupo-botones">
            <button
              type="button"
              className="boton boton--pequeno"
              onClick={() => entrada.current?.click()}
            >
              <Icono nombre="camara" tamano={14} />
              Repetir
            </button>
            <button
              type="button"
              className="boton boton--pequeno boton--peligro"
              onClick={() => alCambiar(null)}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="captura__zona"
          onClick={() => entrada.current?.click()}
          disabled={cargando}
        >
          <Icono nombre="camara" tamano={26} />
          <span>{cargando ? 'Preparando la foto…' : 'Tomar o escoger la foto'}</span>
        </button>
      )}

      {error && <p className="acceso__error">{error}</p>}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture={camara}
        hidden
        onChange={(evento) => {
          void recibir(evento.target.files?.[0])
          // Se limpia para que volver a escoger el mismo archivo dispare el evento.
          evento.target.value = ''
        }}
      />
    </div>
  )
}
