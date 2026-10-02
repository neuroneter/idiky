/**
 * BLOKY Dev — rutas (ADR-0013). Hoy solo existe la puerta (CU-B-01) y el interior vacio.
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './estado/SesionContext'
import { CanalPage } from './features/acceso/CanalPage'
import { CodigoPage } from './features/acceso/CodigoPage'
import { IngresoPage } from './features/acceso/IngresoPage'
import { InicioPage } from './features/inicio/InicioPage'

export function App() {
  const { sesion, cargando } = useSesion()
  if (cargando) return <div className="pantalla-centrada"><p className="subtitulo">Un momento…</p></div>
  return (
    <Routes>
      <Route path="/ingreso" element={sesion ? <Navigate to="/" replace /> : <IngresoPage />} />
      <Route path="/ingreso/como" element={sesion ? <Navigate to="/" replace /> : <CanalPage />} />
      <Route path="/ingreso/codigo" element={sesion ? <Navigate to="/" replace /> : <CodigoPage />} />
      <Route path="/" element={sesion ? <InicioPage /> : <Navigate to="/ingreso" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
