/**
 * Empaqueta el demo compilado en UN SOLO archivo HTML.
 *
 * Para que alguien vea el demo no deberia necesitar Node, ni npm, ni levantar
 * un servidor: abre el archivo con doble clic y listo. Este script toma lo que
 * dejo `vite build` en `dist/` y mete el CSS y el JS dentro del HTML.
 *
 *   npm run empaquetar   ->   dist/idiky-demo.html
 *
 * No usa ninguna dependencia: solo modulos de Node.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(raiz, 'dist')
const assets = join(dist, 'assets')

function unico(extension) {
  const encontrados = readdirSync(assets).filter((n) => n.endsWith(extension))
  if (encontrados.length !== 1) {
    throw new Error(
      `Se esperaba un unico archivo ${extension} en dist/assets y hay ${encontrados.length}. ` +
        'Si el build empezo a partir el bundle, este script hay que actualizarlo.',
    )
  }
  return readFileSync(join(assets, encontrados[0]), 'utf8')
}

const css = unico('.css')
let js = unico('.js')

// El archivo suelto no sirve `sw.js`, asi que el registro del service worker
// solo lograria un 404 en la consola. Se quita: lo unico que se pierde es el
// modo offline, que en un archivo local no aplica.
const registroSW =
  'serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(()=>{})})'
if (js.includes(registroSW)) {
  js = js.replace(registroSW, 'serviceWorker"in navigator&&!1')
} else {
  console.warn(
    'Aviso: no se encontro el registro del service worker para quitarlo.\n' +
      'El demo funciona igual, pero puede aparecer un 404 en la consola del navegador.',
  )
}

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0f3d3e" />
    <title>Idiky — Copropiedad</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
${js}
    </script>
  </body>
</html>
`

const destino = join(dist, 'idiky-demo.html')
writeFileSync(destino, html)
const kb = Math.round(statSync(destino).size / 1024)
console.log(`Listo: dist/idiky-demo.html (${kb} kB)`)
console.log('Se abre con doble clic. No necesita Node, ni npm, ni servidor.')
