/**
 * Punto de entrada. Monta la aplicacion y registra el service worker de la PWA.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { ProveedorDatos } from './estado/DatosContext'
import { ProveedorSesion } from './estado/SesionContext'
import './estilos/tokens.css'
import './estilos/base.css'
import './estilos/layout.css'

// HashRouter: el demo debe funcionar servido desde cualquier subruta (GitHub Pages,
// un subdirectorio o el WebView de Capacitor) sin configurar el servidor.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorSesion>
      <ProveedorDatos>
        <HashRouter>
          <App />
        </HashRouter>
      </ProveedorDatos>
    </ProveedorSesion>
  </StrictMode>,
)

// El service worker solo se registra en produccion para no interferir con el
// recargado en caliente durante el desarrollo.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Sin service worker la app sigue funcionando, solo pierde el modo offline.
    })
  })
}
