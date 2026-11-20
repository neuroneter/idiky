/**
 * CU-P-01 · PN-12 — Escanear el QR del visitante con la cámara.
 *
 * Usa el lector de códigos del propio navegador (`BarcodeDetector`, en Chrome y
 * Android), sin librerías. Donde no existe, el botón no aparece y portería
 * escribe el código, como siempre.
 */

import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../componentes/Icono'

interface Detector {
  detect: (fuente: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
}
type ConstructorDetector = new (opciones: { formats: string[] }) => Detector

function constructorDetector(): ConstructorDetector | undefined {
  return (window as unknown as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector
}

export function EscanearQr({ alLeer }: { alLeer: (texto: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  // En una referencia: si cambiara la función, no se reinicia la cámara.
  const leer = useRef(alLeer)
  leer.current = alLeer

  useEffect(() => {
    if (!abierto) return
    const Lector = constructorDetector()
    if (!Lector) return
    let corriendo = true
    let flujo: MediaStream | null = null
    const detector = new Lector({ formats: ['qr_code'] })
    void (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!video.current) return
        video.current.srcObject = flujo
        await video.current.play()
        while (corriendo) {
          const encontrados = await detector.detect(video.current).catch(() => [])
          if (encontrados[0]?.rawValue) {
            leer.current(encontrados[0].rawValue)
            setAbierto(false)
            break
          }
          await new Promise((r) => setTimeout(r, 250))
        }
      } catch {
        setError('No se pudo abrir la cámara. Escribe el código.')
        setAbierto(false)
      }
    })()
    return () => {
      corriendo = false
      flujo?.getTracks().forEach((t) => t.stop())
    }
  }, [abierto])

  if (!constructorDetector()) return null

  return (
    <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e3)' }}>
      {abierto ? (
        <>
          <video ref={video} muted playsInline style={{ width: '100%', borderRadius: 'var(--radio)', background: '#000' }} />
          <button type="button" className="boton boton--bloque" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
        </>
      ) : (
        <button type="button" className="boton boton--bloque" onClick={() => { setError(null); setAbierto(true) }}>
          <Icono nombre="camara" tamano={18} />
          Escanear el QR
        </button>
      )}
      {error && <p className="acceso__nota">{error}</p>}
    </div>
  )
}
