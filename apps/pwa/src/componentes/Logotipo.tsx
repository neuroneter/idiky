/**
 * Logotipo de Idiky: la casa de la marca seguida del nombre.
 *
 * Es la unica definicion del logotipo; ninguna pantalla vuelve a escribir la
 * palabra "idiky" a mano. Va **siempre limpio sobre la superficie**, sin bloque
 * de color detras: si la superficie ya es oscura (la lateral de la consola), se
 * usa `inverso`.
 *
 * El nombre se lee entero a proposito. Se probo esconder la casa dentro de una
 * de las ies y se descarto: a tamano de barra lateral la casita se vuelve una
 * mancha y obliga a descifrar que letra es, que es caro para un nombre que la
 * gente tiene que leer y decir en voz alta (docs/08-convenciones.md).
 *
 * La casa es la misma geometria de `public/icono.svg`. Si cambia el logo hay que
 * cambiar los dos, mas `herramientas/generar-iconos.py`.
 */

export function Logotipo({
  tamano = 'var(--texto-xl)',
  inverso = false,
  className,
}: {
  /** Tamano de la palabra; la casa se escala con ella. */
  tamano?: string
  /** Para superficies oscuras: la casa y el nombre en blanco. */
  inverso?: boolean
  className?: string
}) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: tamano,
        fontWeight: 720,
        letterSpacing: '-0.045em',
        whiteSpace: 'nowrap',
        color: inverso ? 'var(--color-texto-inverso)' : 'var(--color-marca)',
      }}
    >
      <svg
        viewBox="30 38 132 106"
        fill="none"
        aria-hidden="true"
        style={{ height: '0.86em', width: 'auto', verticalAlign: '-0.12em', overflow: 'visible' }}
      >
        {/* Techo y muros: toman el color del texto. */}
        <path
          d="M48 132V76l48-32 48 32v56"
          stroke="currentColor"
          strokeWidth="13"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* La puerta usa el fucsia de la marca —el extremo del degradado—, no el
            color de accion. El logotipo no es un control: su punto de color tiene
            que brillar contra el azul y no cambiar si manana cambia el color de
            los botones. */}
        <path
          d="M78 132V98h36v34"
          stroke="var(--color-marca-claro)"
          strokeWidth="13"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M36 138h120" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      </svg>
      <span style={{ marginLeft: '0.34em' }}>idiky</span>
    </span>
  )
}
