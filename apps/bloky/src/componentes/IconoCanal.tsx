/**
 * El icono de cada canal de ingreso (CU-B-01): SMS, Google, Microsoft y Yahoo.
 *
 * Van dibujados aquí, como SVG, y no como imágenes descargadas: así los cuatro tienen el mismo
 * tamaño y peso visual, no dependen de la red ni de una librería (ADR-0002, sin dependencias
 * sin ADR) y se escalan con la letra. Las marcas de Google, Microsoft y Yahoo son las que cada
 * proveedor permite usar en su botón de ingreso, sin alterar sus colores; el SMS toma el azul
 * de la marca de IDIKY. La persona reconoce el logo antes de leer el texto: es lo que hace que
 * la decisión sea visual (responsable de integración, 2026-09-21).
 */
import type { Canal } from '../datos/api'

export function IconoCanal({ canal, tamano = 28 }: { canal: Canal; tamano?: number }) {
  const comun = { width: tamano, height: tamano, 'aria-hidden': true as const, focusable: false }
  switch (canal) {
    case 'sms':
      return (
        <svg {...comun} viewBox="0 0 24 24" fill="none" stroke="var(--color-marca)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4.5 3.5V16.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5Z" />
          <path d="M7.5 11h.01M12 11h.01M16.5 11h.01" strokeWidth="2.6" />
        </svg>
      )
    case 'google':
      return (
        <svg {...comun} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.66Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3a7.2 7.2 0 0 1-10.72-3.78H1.34v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.34 14.32a7.2 7.2 0 0 1 0-4.64v-3.1H1.34a12 12 0 0 0 0 10.84l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44A12 12 0 0 0 1.34 6.58l4 3.1A7.17 7.17 0 0 1 12 4.76Z" />
        </svg>
      )
    case 'microsoft':
      return (
        <svg {...comun} viewBox="0 0 24 24">
          <rect x="1.5" y="1.5" width="10" height="10" fill="#F25022" />
          <rect x="12.5" y="1.5" width="10" height="10" fill="#7FBA00" />
          <rect x="1.5" y="12.5" width="10" height="10" fill="#00A4EF" />
          <rect x="12.5" y="12.5" width="10" height="10" fill="#FFB900" />
        </svg>
      )
    case 'yahoo':
      return (
        <svg {...comun} viewBox="0 0 24 24">
          <rect x="1" y="1" width="22" height="22" rx="5" fill="#6001D2" />
          <path fill="#fff" d="M5.2 7.3h2.9l2.2 4.6 2.2-4.6h2.8l-3.7 7.1v3.7H9V14.4L5.2 7.3Z" />
          <circle cx="17.4" cy="16.7" r="1.5" fill="#fff" />
          <path fill="#fff" d="M16.3 7.3h2.3l-.5 6.6h-1.4l-.4-6.6Z" />
        </svg>
      )
  }
}
