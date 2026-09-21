/**
 * El marco de la puerta de BLOKY: la marca sobre el degradado y una tarjeta. Lo comparten
 * las tres pantallas del ingreso (CU-B-01).
 */
import type { ReactNode } from 'react'
import { Logotipo } from '../../componentes/Logotipo'

export function Puerta({ children, titulo }: { children: ReactNode; titulo?: string }) {
  return (
    <div className="puerta">
      <div className="puerta__marca">
        <Logotipo inverso tamano="var(--texto-3xl)" />
        <p className="puerta__lema">
          <strong>BLOKY</strong> · el sistema de tu copropiedad
        </p>
      </div>
      <div className="tarjeta puerta__tarjeta">
        {titulo && <h1 className="puerta__titulo">{titulo}</h1>}
        {children}
      </div>
      <p className="puerta__pie">Entorno de desarrollo. Los datos de acceso vienen de BOB.</p>
    </div>
  )
}
