/**
 * Rutas de la aplicacion.
 * El mapa completo ruta -> caso de uso esta en docs/06-arquitectura.md (seccion 4).
 */

import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './estado/SesionContext'
import { rutaInicial } from './dominio/reglas'
import { LayoutResidente } from './componentes/LayoutResidente'
import { LayoutAdmin } from './componentes/LayoutAdmin'
import { LayoutPorteria } from './componentes/LayoutPorteria'
import { AccesoPage } from './features/auth/AccesoPage'
import { ActivarPage } from './features/auth/ActivarPage'
import { AdjuntarPage } from './features/auth/AdjuntarPage'
import { InicioPage } from './features/residente/InicioPage'
import { MiUnidadPage } from './features/residente/MiUnidadPage'
import { ProcesosPage } from './features/residente/ProcesosPage'
import { PersonasPage } from './features/residente/PersonasPage'
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
import { RegistrosPage } from './features/admin/RegistrosPage'
import { CarteraPage } from './features/admin/CarteraPage'
import { CatalogoMultasPage } from './features/admin/CatalogoMultasPage'
import { SancionesPage } from './features/admin/SancionesPage'
import { AsambleasAdminPage } from './features/admin/AsambleasAdminPage'
import { ReservasAdminPage } from './features/admin/ReservasAdminPage'
import { PqrsAdminPage } from './features/admin/PqrsAdminPage'
import { ComunicadosAdminPage } from './features/admin/ComunicadosAdminPage'
import { CorrespondenciaPage as CorrespondenciaGestionPage } from './features/porteria/CorrespondenciaPage'
import { TurnoPage } from './features/porteria/TurnoPage'
import { ValidarVisitantePage } from './features/porteria/ValidarVisitantePage'
import { ResidentesPage } from './features/porteria/ResidentesPage'

/** Deja pasar solo si hay sesion con el rol esperado (ADR-0004). */
function Protegida({
  rol,
  children,
}: {
  rol: 'residente' | 'admin' | 'porteria'
  children: React.ReactNode
}) {
  const { sesion } = useSesion()
  if (!sesion) return <Navigate to="/acceso" replace />
  if (sesion.rol !== rol) return <Navigate to={rutaInicial(sesion.rol)} replace />
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
      {/* Fuera de la sesion: quien adjunta todavia no tiene cuenta (CU-R-28). */}
      <Route path="/acceso/adjuntar" element={<AdjuntarPage />} />

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
        <Route path="procesos" element={<ProcesosPage />} />
        <Route path="unidad" element={<MiUnidadPage />} />
        <Route path="unidad/personas" element={<PersonasPage />} />
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
        <Route path="registros" element={<RegistrosPage />} />
        <Route path="cartera" element={<CarteraPage />} />
        <Route path="multas" element={<CatalogoMultasPage />} />
        <Route path="sanciones" element={<SancionesPage />} />
        <Route path="asambleas" element={<AsambleasAdminPage />} />
        <Route path="reservas" element={<ReservasAdminPage />} />
        <Route path="pqrs" element={<PqrsAdminPage />} />
        <Route path="comunicados" element={<ComunicadosAdminPage />} />
        <Route path="correspondencia" element={<CorrespondenciaGestionPage />} />
      </Route>

      {/* Puesto de porteria — CU-P-xx */}
      <Route
        path="/porteria"
        element={
          <Protegida rol="porteria">
            <LayoutPorteria />
          </Protegida>
        }
      >
        <Route index element={<TurnoPage />} />
        <Route path="visitantes" element={<ValidarVisitantePage />} />
        <Route path="residentes" element={<ResidentesPage />} />
        <Route path="correspondencia" element={<CorrespondenciaGestionPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={sesion ? rutaInicial(sesion.rol) : '/acceso'} replace />}
      />
    </Routes>
  )
}
