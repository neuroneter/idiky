/**
 * Que version es esta app, y como se entera de que hay una nueva.
 *
 * Dos fuentes, a proposito distintas:
 *  - **Lo que sabe al compilarse**: version del paquete y dia del build
 *    (`vite.config.ts`). Existe siempre, tambien en el demo empaquetado.
 *  - **Lo que dice el servidor**: `revision.txt`, el commit que el despliegue
 *    dejo publicado (`infra/servidor/levantar.sh`). Se lee en tiempo de
 *    ejecucion, sin cache, y es lo que cambia cuando alguien despliega.
 *
 * Con las dos se resuelven las dos preguntas de Mary (2026-10-01): «¿que
 * version tiene esta persona?» (se muestra en la pantalla de ingreso) y
 * «¿como se entera de que salio una nueva?» (se compara la revision del
 * servidor con la que tenia al abrir, y si cambio, se avisa).
 *
 * Sin `revision.txt` —desarrollo, o el demo en un solo archivo— no pasa nada:
 * no hay servidor del que enterarse.
 */

export const VERSION_APP = __VERSION_APP__
export const FECHA_BUILD = __FECHA_BUILD__

/** Cada cuanto se le pregunta al servidor, con la app abierta. */
const CADA_MS = 10 * 60 * 1000

export async function leerRevisionDelServidor(): Promise<string | null> {
  try {
    const respuesta = await fetch(`${import.meta.env.BASE_URL}revision.txt`, { cache: 'no-store' })
    if (!respuesta.ok) return null
    const texto = (await respuesta.text()).trim()
    // nginx puede devolver index.html para lo que no existe: eso no es una revision.
    if (!texto || texto.length > 64 || texto.includes('<')) return null
    return texto
  } catch {
    return null
  }
}

/**
 * Vigila la revision del servidor mientras la app esta abierta. Llama a
 * `alCambiar` una sola vez, con la revision nueva, cuando deja de ser la que
 * habia al abrir. Pregunta cada diez minutos y cada vez que la persona vuelve
 * a la pestana, que es cuando de verdad importa.
 */
export function vigilarRevision(alCambiar: (nueva: string) => void): () => void {
  let inicial: string | null | undefined
  let avisado = false

  async function comprobar() {
    const actual = await leerRevisionDelServidor()
    if (inicial === undefined) {
      inicial = actual
      return
    }
    if (!avisado && actual && inicial && actual !== inicial) {
      avisado = true
      alCambiar(actual)
    }
  }

  void comprobar()
  const temporizador = window.setInterval(() => void comprobar(), CADA_MS)
  const alVolver = () => {
    if (document.visibilityState === 'visible') void comprobar()
  }
  document.addEventListener('visibilitychange', alVolver)
  return () => {
    window.clearInterval(temporizador)
    document.removeEventListener('visibilitychange', alVolver)
  }
}
