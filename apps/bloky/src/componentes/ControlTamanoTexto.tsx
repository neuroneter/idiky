/**
 * CU-R-26 — Escoger el tamaño de la letra, en la puerta de BLOKY.
 * Doc: docs/casos-de-uso/residente.md#cu-r-26
 *
 * Adaptado de `apps/pwa/src/componentes/ControlTamanoTexto.tsx` (ADR-0013). Va en la puerta
 * por la misma razón que en ALICE: quien no alcanza a leer la pantalla de ingreso tampoco
 * puede entrar a buscar el ajuste adentro. Un administrador de sesenta años lo necesita
 * igual que un residente.
 *
 * Cambia el tamaño **al instante y de toda la app**, porque escribe en el `<html>`
 * (`estado/preferencias.ts`): la persona ve crecer la pantalla que está mirando.
 */
import { useState } from 'react'
import { guardarTamanoTexto, TAMANOS, tamanoTexto, type TamanoTexto } from '../estado/preferencias'

/** Las tres opciones, sin envoltura. Para una hoja de ajustes ya abierta. */
export function OpcionesTamanoTexto() {
  const [tamano, setTamano] = useState<TamanoTexto>(() => tamanoTexto())

  function escoger(id: TamanoTexto) {
    setTamano(id)
    guardarTamanoTexto(id)
  }

  return (
    <div className="opciones-tamano" role="group" aria-label="Tamaño de la letra">
      {TAMANOS.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className="opcion-tamano"
          aria-pressed={tamano === opcion.id}
          onClick={() => escoger(opcion.id)}
        >
          {/* La muestra va en `rem` y no en `--texto-*`: cada botón enseña siempre su propio
              tamaño, sin importar cuál esté escogido. */}
          <span className="opcion-tamano__muestra" style={{ fontSize: `${opcion.escala}rem` }}>
            Aa
          </span>
          <span className="opcion-tamano__nombre">{opcion.etiqueta}</span>
          <span className="opcion-tamano__porcentaje numerico">{opcion.porcentaje}</span>
        </button>
      ))}
    </div>
  )
}

/** El botón de la puerta: plegado, y despliega las opciones sobre el degradado. */
export function ControlTamanoTexto({ className }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className={['tamano-letra', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="tamano-letra__boton"
        aria-expanded={abierto}
        onClick={() => setAbierto((estaba) => !estaba)}
      >
        {/* Una A grande y una chica: el símbolo de «tamaño de la letra». Mismo trazo que
            `Icono` del demo. */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 19 7.5 6l5 13M4.3 15h6.4M15 19l3.2-8.5L21.5 19M16.2 16.5h4.6" />
        </svg>
        Tamaño de la letra
      </button>

      {abierto && (
        <div className="tamano-letra__panel">
          <OpcionesTamanoTexto />
        </div>
      )}
    </div>
  )
}
