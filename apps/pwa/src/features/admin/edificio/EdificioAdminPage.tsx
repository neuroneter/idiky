/**
 * Información del edificio, en la consola — Mary, 2026-11-20.
 * CU-A-32 (cuentas claras), CU-A-33 (documentos), CU-A-34 (encuestas),
 * CU-A-35 (calendario), CU-A-36 (clasificados) y CU-R-43 (pedidos de ayuda).
 */

import { GestionObjetos } from '../../../componentes/GestionObjetos'
import { PermisosAdmin } from './PermisosAdmin'
import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import { alertasPendientes } from '../../../dominio/reglas'
import { CuentasClarasAdmin } from './CuentasClarasAdmin'
import { DocumentosAdmin } from './DocumentosAdmin'
import { EncuestasAdmin } from './EncuestasAdmin'
import { CalendarioAdmin } from './CalendarioAdmin'
import { ClasificadosAdmin } from './ClasificadosAdmin'
import { AlertasAyuda } from '../../../componentes/AlertasAyuda'

const SECCIONES = {
  cuentas: 'Cuentas claras',
  documentos: 'Documentos',
  encuestas: 'Encuestas',
  calendario: 'Calendario',
  clasificados: 'Clasificados',
  permisos: 'Trasteos y obras',
  objetos: 'Objetos perdidos',
  ayuda: 'Pedidos de ayuda',
} as const
type Seccion = keyof typeof SECCIONES

export function EdificioAdminPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  const [seccion, setSeccion] = useState<Seccion>('cuentas')
  if (!sesion) return null
  const pendientes = alertasPendientes(bd.alertasAyuda ?? [], sesion.copropiedadId).length
  const porAprobar = [...(bd.trasteos ?? []), ...(bd.permisosObra ?? [])].filter(
    (p) => p.copropiedadId === sesion.copropiedadId && p.estado === 'solicitado',
  ).length

  return (
    <div className="pila">
      <div className="filtros" role="tablist">
        {(Object.keys(SECCIONES) as Seccion[]).map((s) => (
          <button key={s} className="filtro" role="tab" aria-pressed={seccion === s} onClick={() => setSeccion(s)}>
            {SECCIONES[s]}
            {s === 'ayuda' && pendientes > 0 ? ` (${pendientes})` : ''}
            {s === 'permisos' && porAprobar > 0 ? ` (${porAprobar})` : ''}
          </button>
        ))}
      </div>
      {seccion === 'cuentas' && <CuentasClarasAdmin />}
      {seccion === 'documentos' && <DocumentosAdmin />}
      {seccion === 'encuestas' && <EncuestasAdmin />}
      {seccion === 'calendario' && <CalendarioAdmin />}
      {seccion === 'clasificados' && <ClasificadosAdmin />}
      {seccion === 'permisos' && <PermisosAdmin />}
      {seccion === 'objetos' && <GestionObjetos />}
      {seccion === 'ayuda' && <AlertasAyuda incluirAtendidas />}
    </div>
  )
}
