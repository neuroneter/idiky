/**
 * Persistencia del demo en el navegador (ADR-0003).
 *
 * Guarda la base de datos completa en `localStorage` para que el usuario que
 * prueba el demo no pierda lo que hizo al recargar la pagina.
 *
 * Solo `repositorio.ts` debe usar este modulo.
 */

import type { BaseDatos } from '../dominio/tipos'
import { crearSemilla, VERSION_ESQUEMA } from './semilla'

const CLAVE = 'idiky.demo.bd'

function disponible(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

/** Lee la base de datos guardada; si no existe o cambio el esquema, siembra una nueva. */
export function leer(): BaseDatos {
  if (!disponible()) return crearSemilla()
  try {
    const bruto = window.localStorage.getItem(CLAVE)
    if (!bruto) return sembrar()
    const bd = JSON.parse(bruto) as BaseDatos
    if (bd.version !== VERSION_ESQUEMA) return sembrar()
    return bd
  } catch {
    return sembrar()
  }
}

/**
 * Cuanto del almacenamiento del demo ocupa esta base de datos.
 *
 * `localStorage` da unos 5 MiB por origen, contados en UTF-16: unos 2,6
 * millones de caracteres. Se mide sobre lo que se guardaria (el JSON), no
 * sobre `localStorage`, para que la cuenta sea la misma con o sin navegador.
 * Con fotos de 60 KB (ADR-0009) caben decenas; el aviso llega antes de que
 * `guardar` empiece a fallar en silencio.
 */
export const LIMITE_CARACTERES_DEMO = 2_600_000

export function ocupacion(bd: BaseDatos): { usado: number; limite: number; porcentaje: number } {
  const usado = JSON.stringify(bd).length
  return {
    usado,
    limite: LIMITE_CARACTERES_DEMO,
    porcentaje: Math.min(100, Math.round((usado / LIMITE_CARACTERES_DEMO) * 100)),
  }
}

export function guardar(bd: BaseDatos): void {
  if (!disponible()) return
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(bd))
  } catch {
    // Sin espacio o modo privado: el demo sigue funcionando solo en memoria.
  }
}

/** Regenera los datos iniciales, descartando lo que el usuario haya hecho. */
export function sembrar(): BaseDatos {
  const bd = crearSemilla()
  guardar(bd)
  return bd
}
