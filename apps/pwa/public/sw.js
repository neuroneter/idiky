/**
 * Service worker del demo (PWA).
 *
 * Estrategia deliberadamente simple:
 *  - Precarga el cascaron de la aplicacion al instalarse.
 *  - Navegaciones: red primero, cache como respaldo (para funcionar sin conexion).
 *  - Recursos estaticos: cache primero, actualizando en segundo plano.
 *
 * No cachea datos: en el demo los datos viven en localStorage y en la fase 2
 * pasaran por la API, con su propia estrategia de sincronizacion.
 */

const VERSION = 'idiky-demo-v1'
const CASCARON = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icono.svg',
  './icono-192.png',
  './icono-512.png',
]

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CASCARON)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((clave) => clave !== VERSION).map((clave) => caches.delete(clave))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion).catch(() => caches.match('./index.html').then((r) => r || Response.error())),
    )
    return
  }

  evento.respondWith(
    caches.match(peticion).then((enCache) => {
      const desdeRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone()
            caches.open(VERSION).then((cache) => cache.put(peticion, copia))
          }
          return respuesta
        })
        .catch(() => enCache || Response.error())
      return enCache || desdeRed
    }),
  )
})
