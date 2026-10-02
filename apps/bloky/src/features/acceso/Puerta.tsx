/**
 * El marco de la puerta de BLOKY (CU-B-01). Lo comparten las tres pantallas del ingreso.
 *
 * Una sola puerta que cambia de forma con el aparato (2026-09-21, responsable de integración):
 *
 *   - **Celular:** la marca arriba, compacta, y el formulario como una hoja blanca pegada al
 *     borde de abajo. Respeta las zonas seguras del teléfono y sube con el teclado.
 *   - **Tableta:** la hoja se vuelve tarjeta centrada, con más aire.
 *   - **Computador:** dos paneles. A la izquierda la marca sobre el degradado, con una frase
 *     que dice qué es BLOKY y las siluetas de la copropiedad; a la derecha, el formulario
 *     sobre blanco, sin tarjeta.
 *
 * En los tres: los pasos del ingreso (Documento · Autenticación), el control del tamaño
 * de la letra (CU-R-26) y, discreto, el aviso de entorno. Todo con los tokens de ALICE: la
 * identidad es una. La forma la decide `base.css`, no este archivo.
 */
import type { ReactNode } from 'react'
import { ControlTamanoTexto } from '../../componentes/ControlTamanoTexto'
import { Logotipo } from '../../componentes/Logotipo'
import { SiluetaTorres } from '../../componentes/SiluetaTorres'

// Dos pasos, no tres: escribir el codigo del SMS es parte de la autenticacion, no un paso
// aparte (responsable de integracion, 2026-09-21).
const PASOS = ['Documento', 'Autenticación']
const MODULOS = ['Estructura y unidades', 'Propietarios', 'Cartera', 'Asambleas']

export function Puerta({ children, titulo, paso }: { children: ReactNode; titulo?: string; paso: 1 | 2 }) {
  return (
    <div className="puerta">
      <aside className="puerta__marca">
        <ControlTamanoTexto className="puerta__tamano" />
        <div className="puerta__marca-contenido">
          {/* BLOKY es la aplicacion y manda; idiky firma abajo, en pequeno. No es un h1: el
              unico h1 de la pantalla es el titulo del paso, en el formulario. */}
          <p className="puerta__producto">BLOKY</p>
          <p className="puerta__lema">El sistema de tu copropiedad</p>
          <p className="puerta__frase">
            Estructura y unidades, propietarios, cartera y asambleas de tu conjunto, en un solo lugar.
          </p>
          <ul className="puerta__modulos" aria-label="Lo que incluye">
            {MODULOS.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <p className="puerta__firma">
            Una aplicación de <Logotipo inverso tamano="1.15em" />
          </p>
        </div>
        <SiluetaTorres className="puerta__siluetas" />
      </aside>

      <main className="puerta__panel">
        <div className="puerta__formulario">
          <ol className="pasos" aria-label="Pasos del ingreso">
            {PASOS.map((nombre, i) => {
              const numero = (i + 1) as 1 | 2
              const clase = numero === paso ? 'activo' : numero < paso ? 'hecho' : ''
              return (
                <li key={nombre} className={clase} aria-current={numero === paso ? 'step' : undefined}>
                  {nombre}
                </li>
              )
            })}
          </ol>
          {titulo && <h1 className="puerta__titulo">{titulo}</h1>}
          {children}
        </div>
        <p className="puerta__pie">Entorno de desarrollo. Los datos de acceso vienen de BOB.</p>
      </main>
    </div>
  )
}
