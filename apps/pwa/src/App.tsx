/**
 * Rutas de la aplicacion.
 * El mapa completo ruta -> caso de uso esta en docs/06-arquitectura.md (seccion 4).
 */

import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './estado/SesionContext'
import { LayoutResidente } from './componentes/LayoutResidente'
import { LayoutAdmin } from './componentes/LayoutAdmin'
import { AccesoPage } from './features/auth/AccesoPage'
import { ActivarPage } from './features/auth/ActivarPage'
import { InicioPage } from './features/residente/InicioPage'
import { MiUnidadPage } from './features/residente/MiUnidadPage'
import { CuentaPage } from './features/residente/CuentaPage'
import { PagoPage } from './features/residente/PagoPage'
import { ReservasPage } from './features/residente/ReservasPage'
import { PqrsPage } from './features/residente/PqrsPage'
import { ComunicadosPage } from './features/residente/ComunicadosPage'
import { SolicitudesPage } from './features/residente/SolicitudesPage'
import { PazYSalvoPage } from './features/residente/PazYSalvoPage'
import { AsambleasPage } from './features/residente/AsambleasPage'
import { AsambleaDetallePage } from './features/residente/AsambleaDetallePage'
import { VisitantesPage } from './features/residente/VisitantesPage'
import { CorrespondenciaPage } from './features/residente/CorrespondenciaPage'
import { TableroPage } from './features/admin/TableroPage'
import { UnidadesPage } from './features/admin/UnidadesPage'
import { CarteraPage } from './features/admin/CarteraPage'
import { ReservasAdminPage } from './features/admin/ReservasAdminPage'
import { PqrsAdminPage } from './features/admin/PqrsAdminPage'
import { ComunicadosAdminPage } from './features/admin/ComunicadosAdminPage'
import { CorrespondenciaAdminPage } from './features/admin/CorrespondenciaAdminPage'

/** Deja pasar solo si hay sesion con el rol esperado (ADR-0004). */
function Protegida({
  rol,
  children,
}: {
  rol: 'residente' | 'admin'
  children: React.ReactNode
}) {
  const { sesion } = useSesion()
  if (!sesion) return <Navigate to="/acceso" replace />
  if (sesion.rol !== rol) return <Navigate to={sesion.rol === 'admin' ? '/admin' : '/app'} replace />
  return <>{children}</>
}

export function App() {
  const { sesion } = useSesion()

  return (
    <Routes>
      <Route path="/acceso" element={<AccesoPage />} />
      {/* Activar y recuperar son el mismo tramite en tres pasos; cambia el texto,
          no el flujo (CU-R-25). */}
      <Route path="/acceso/activar" element={<ActivarPage modo="activar" />} />
      <Route path="/acceso/recuperar" element={<ActivarPage modo="recuperar" />} />

      {/* App movil del residente — CU-R-xx */}
      <Route
        path="/app"
        element={
          <Protegida rol="residente">
            <LayoutResidente />
          </Protegida>
        }
      >
        <Route index element={<InicioPage />} />
        <Route path="cuenta" element={<CuentaPage />} />
        <Route path="cuenta/pagar" element={<PagoPage />} />
        {/* Solicitudes: reservar, radicar una PQRS y pedir el paz y salvo viven
            bajo un mismo icono (Mary, 2026-08-27). Cada una conserva su ruta
            propia para poder enlazarla desde el inicio y para que "atras"
            funcione. */}
        <Route path="solicitudes" element={<SolicitudesPage />}>
          <Route index element={<Navigate to="reservas" replace />} />
          <Route path="reservas" element={<ReservasPage />} />
          <Route path="pqrs" element={<PqrsPage />} />
          <Route path="paz-y-salvo" element={<PazYSalvoPage />} />
        </Route>
        {/* Las rutas viejas siguen respondiendo: alguien pudo dejarlas guardadas
            en la pantalla de inicio del telefono. */}
        <Route path="reservas" element={<Navigate to="/app/solicitudes/reservas" replace />} />
        <Route path="pqrs" element={<Navigate to="/app/solicitudes/pqrs" replace />} />
        <Route path="asambleas" element={<AsambleasPage />} />
        <Route path="asambleas/:asambleaId" element={<AsambleaDetallePage />} />
        <Route path="comunicados" element={<ComunicadosPage />} />
        <Route path="visitantes" element={<VisitantesPage />} />
        <Route path="correspondencia" element={<CorrespondenciaPage />} />
        <Route path="unidad" element={<MiUnidadPage />} />
      </Route>

      {/* Consola de administracion — CU-A-xx */}
      <Route
        path="/admin"
        element={
          <Protegida rol="admin">
            <LayoutAdmin />
          </Protegida>
        }
      >
        <Route index element={<TableroPage />} />
        <Route path="unidades" element={<UnidadesPage />} />
        <Route path="cartera" element={<CarteraPage />} />
        <Route path="reservas" element={<ReservasAdminPage />} />
        <Route path="pqrs" element={<PqrsAdminPage />} />
        <Route path="comunicados" element={<ComunicadosAdminPage />} />
        <Route path="correspondencia" element={<CorrespondenciaAdminPage />} />
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={sesion ? (sesion.rol === 'admin' ? '/admin' : '/app') : '/acceso'} replace />
        }
      />
    </Routes>
  )
}
