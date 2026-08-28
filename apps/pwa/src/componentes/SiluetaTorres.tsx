/**
 * La silueta de torres del fondo de marca.
 *
 * Es la copropiedad misma, dibujada con el mismo trazo del logotipo. Vive en un
 * componente porque aparece en dos sitios —el cascaron del residente y la
 * pantalla de acceso— y **un dibujo repetido a mano se desincroniza el dia que
 * alguien cambia uno de los dos**.
 *
 * Va siempre detras del contenido y sin eventos: es fondo, no adorno con el que
 * se pueda interactuar.
 */

export function SiluetaTorres({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 150" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 150V54l30-20 30 20v96M42 150v-30h18v30" />
        <path d="M96 150V78l26-17 26 17v72M122 150v-24h14v24" />
        <path d="M172 150V42l34-22 34 22v108M206 150v-34h20v34" />
        <path d="M260 150V88l24-16 24 16v62" />
        <path d="M0 150h320" />
      </g>
    </svg>
  )
}
