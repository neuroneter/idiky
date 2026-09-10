/**
 * CU-R-26 — Escoger el tamaño de la letra.
 * Doc: docs/casos-de-uso/residente.md#cu-r-26
 *
 * **Dos sitios, y cada uno por una razón distinta** (Mary, 2026-09-07):
 *
 *  - **En la puerta** —ingresar y activar la cuenta—, porque quien no alcanza a
 *    leer la pantalla de ingreso tampoco puede entrar a buscar el ajuste adentro.
 *    Y porque *«la mayoría de las personas seleccionan el tamaño de letra apenas
 *    ingresan»*: es lo primero que hace quien tiene dificultad para leer, no algo
 *    que vaya a buscar después.
 *  - **En la configuración del perfil**, para corregirlo sin cerrar sesión. Ahí
 *    va junto a la huella: las dos son preferencias **de este teléfono**, no de
 *    la copropiedad.
 *
 * De ahí que el archivo exporte dos cosas: las tres opciones sueltas, que es lo
 * que va dentro de una hoja de ajustes que ya está abierta, y el botón que las
 * despliega, que es lo que va en la puerta —donde no se puede ocupar media
 * pantalla con algo que la mayoría toca una sola vez—.
 */

import { useState } from 'react'
import { guardarTamanoTexto, TAMANOS, tamanoTexto, type TamanoTexto } from '../estado/preferencias'
import { Icono } from './Icono'

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
          {/* La muestra va en `rem` y **no** en `--texto-*`: así cada botón enseña
              siempre su propio tamaño, sin importar cuál esté escogido. Si la
              muestra creciera con la selección, los tres botones se verían iguales
              y no habría nada que comparar. */}
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

/**
 * El botón de la puerta: plegado, y despliega las opciones sobre el degradado.
 *
 * Cambia el tamaño **al instante y de toda la app**, porque escribe en el `<html>`
 * (ver `estado/preferencias.ts`). Quien lo toca ve la pantalla que está mirando
 * crecer debajo del dedo, que es la única forma de saber si escogió bien.
 */
export function ControlTamanoTexto() {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="tamano-letra">
      <button
        type="button"
        className="tamano-letra__boton"
        aria-expanded={abierto}
        onClick={() => setAbierto((estaba) => !estaba)}
      >
        <Icono nombre="letra" tamano={20} />
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
