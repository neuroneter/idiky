/**
 * CU-R-26 — Escoger el tamaño de la letra.
 * Doc: docs/casos-de-uso/residente.md#cu-r-26
 *
 * **Va en la puerta, no en el perfil.** Es la decisión que ordena este
 * componente: alguien que no alcanza a leer la pantalla de ingreso tampoco puede
 * entrar a buscar el ajuste adentro. Un control de accesibilidad detrás del
 * acceso no le sirve justo a quien lo necesita.
 *
 * Cambia el tamaño **al instante y de toda la app**, porque escribe en el
 * `<html>` (ver `estado/preferencias.ts`). Quien lo toca ve la pantalla que está
 * mirando crecer debajo del dedo, que es la única forma de saber si escogió bien.
 */

import { useState } from 'react'
import { guardarTamanoTexto, TAMANOS, tamanoTexto, type TamanoTexto } from '../estado/preferencias'
import { Icono } from './Icono'

export function ControlTamanoTexto() {
  const [abierto, setAbierto] = useState(false)
  const [tamano, setTamano] = useState<TamanoTexto>(() => tamanoTexto())

  function escoger(id: TamanoTexto) {
    setTamano(id)
    guardarTamanoTexto(id)
  }

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
        <div className="tamano-letra__opciones" role="group" aria-label="Tamaño de la letra">
          {TAMANOS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className="tamano-letra__opcion"
              aria-pressed={tamano === opcion.id}
              onClick={() => escoger(opcion.id)}
            >
              {/* La muestra va en `rem` y **no** en `--texto-*`: así cada botón
                  enseña siempre su propio tamaño, sin importar cuál esté
                  escogido. Si la muestra creciera con la selección, los tres
                  botones se verían iguales y no habría nada que comparar. */}
              <span className="tamano-letra__muestra" style={{ fontSize: `${opcion.escala}rem` }}>
                Aa
              </span>
              <span className="tamano-letra__nombre">{opcion.etiqueta}</span>
              <span className="tamano-letra__porcentaje numerico">{opcion.porcentaje}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
