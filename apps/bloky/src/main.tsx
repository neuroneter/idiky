import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { aplicarTamanoTexto, tamanoTexto } from './estado/preferencias'
import { SesionProvider } from './estado/SesionContext'
import './estilos/tokens.css'
import './estilos/base.css'

// La letra al tamano que la persona escogio en este aparato (CU-R-26), antes del primer pintado.
aplicarTamanoTexto(tamanoTexto())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>,
)
