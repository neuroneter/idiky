/**
 * Unico punto de contacto con la API de BLOKY (ADR-0003: ninguna pantalla hace fetch). Las
 * rutas estan en apps/bloky-api/README.md. La sesion viaja en una cookie httpOnly: aqui no
 * se guarda ningun token.
 */
export type TipoDocumento = 'CC' | 'CE' | 'PA' | 'PPT' | 'TI'
export type Canal = 'sms' | 'google' | 'microsoft' | 'yahoo'
export interface Identificacion { tipoDocumento: TipoDocumento; numeroDocumento: string }
export interface Identificado {
  nombre: string
  canales: Array<{ tipo: Canal; pista: string }>
  copropiedades: Array<{ copropiedadId: string; nombre: string; rol: 'administrador' | 'delegado' }>
}
export interface SesionPublica {
  nombre: string
  canal: Canal
  documento: string
  venceEn: string
  copropiedades: Identificado['copropiedades']
}

export class ErrorApi extends Error {
  constructor(public codigo: string, mensaje: string, public estado: number) { super(mensaje) }
}

async function llamar<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(ruta, {
    method: cuerpo === undefined ? 'GET' : 'POST',
    headers: cuerpo === undefined ? {} : { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    credentials: 'same-origin',
  })
  const datos = (await r.json().catch(() => ({}))) as { error?: string; mensaje?: string }
  if (!r.ok) throw new ErrorApi(datos.error ?? 'error', datos.mensaje ?? 'No se pudo completar. Intenta de nuevo.', r.status)
  return datos as T
}

export const api = {
  identificar: (id: Identificacion) => llamar<Identificado>('/api/acceso/identificar', id),
  enviarCodigo: (id: Identificacion) => llamar<{ pista: string; codigoSimulado?: string }>('/api/acceso/enviar-codigo', id),
  verificarCodigo: (id: Identificacion, codigo: string) => llamar<{ sesion: SesionPublica }>('/api/acceso/verificar-codigo', { ...id, codigo }),
  sesion: () => llamar<{ sesion: SesionPublica }>('/api/sesion'),
  salir: () => llamar<{ ok: true }>('/api/salir', {}),
  /** Google y Microsoft son una ida y vuelta del navegador entero: no es fetch. */
  urlProveedor: (proveedor: 'google' | 'microsoft' | 'yahoo', id: Identificacion) =>
    `/api/acceso/${proveedor}?tipo=${encodeURIComponent(id.tipoDocumento)}&documento=${encodeURIComponent(id.numeroDocumento)}`,
}
