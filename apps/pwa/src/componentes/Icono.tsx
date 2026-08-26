/**
 * Iconos en linea (SVG), sin dependencias externas.
 * Trazo de 1.6 px sobre una caja de 24, para que combinen entre si.
 */

export type NombreIcono =
  | 'inicio'
  | 'cuenta'
  | 'reservas'
  | 'pqrs'
  | 'comunicados'
  | 'visitantes'
  | 'correspondencia'
  | 'tablero'
  | 'unidades'
  | 'cartera'
  | 'salir'
  | 'mas'
  | 'volver'
  | 'check'
  | 'cerrar'
  | 'buscar'
  | 'alerta'
  | 'reloj'
  | 'chevron'
  | 'reiniciar'

const TRAZOS: Record<NombreIcono, string> = {
  inicio: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  cuenta: 'M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5zM16 12.5h2.5',
  reservas: 'M4 6.5h16v14H4zM4 10.5h16M8.5 3.5v4M15.5 3.5v4',
  pqrs: 'M4 5.5h16v11H9l-5 4z',
  comunicados: 'M4 10v4h3l7 4V6l-7 4H4zM17.5 9.5a4 4 0 0 1 0 5',
  visitantes: 'M4 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M16.5 12l2 2 3.5-3.5',
  correspondencia: 'M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16zM3.5 8l8.5 4.5L20.5 8M12 12.5v8',
  tablero: 'M4 4h7v7H4zM13 4h7v4.5h-7zM13 10.5h7V20h-7zM4 13h7v7H4z',
  unidades: 'M4 21V4.5h9V21M13 21V10h7v11M7 8h3M7 12h3M7 16h3M16 14h1M16 17.5h1M2.5 21h19',
  cartera: 'M3.5 7.5c0-1.7 3.8-3 8.5-3s8.5 1.3 8.5 3-3.8 3-8.5 3-8.5-1.3-8.5-3zM3.5 7.5v9c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3v-9M3.5 12c0 1.7 3.8 3 8.5 3s8.5-1.3 8.5-3',
  salir: 'M15 4.5H19a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4M11 16l-4-4 4-4M7 12h10',
  mas: 'M12 5v14M5 12h14',
  volver: 'M15 5l-7 7 7 7',
  check: 'M4.5 12.5l5 5 10-11',
  cerrar: 'M6 6l12 12M18 6 6 18',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16.5 16.5 21 21',
  alerta: 'M12 4 2.5 20.5h19zM12 10v5M12 17.6v.4',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.5l3.5 2',
  chevron: 'M9 5l7 7-7 7',
  reiniciar: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4',
}

export function Icono({
  nombre,
  tamano = 20,
  className,
}: {
  nombre: NombreIcono
  tamano?: number
  className?: string
}) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}
