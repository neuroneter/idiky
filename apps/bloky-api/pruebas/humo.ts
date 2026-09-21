/**
 * Prueba de humo de CU-B-01 sin red externa: levanta la API con el repositorio en memoria,
 * el enviador de codigos simulado y un BOB de mentira (un servidor HTTP que responde como
 * Strapi 5). Recorre el flujo completo por SMS y las reglas de rechazo.
 *
 *   npm run probar        sale con 0 si todo pasa y con 1 si algo falla
 */
import { createServer } from 'node:http'
import { construirApp } from '../src/servidor.js'
import { cargarConfig } from '../src/config.js'

const HOY = new Date().toISOString().slice(0, 10)
const personas: Record<string, unknown> = {
  '1001': persona('1001', 'Olga Lucia Henao', '3001234567', 'olga@ejemplo.com', [
    asig('administrador', 'vigente', 'activa', 'Altos del Bosque', 'cop-1'),
    asig('delegado', 'vigente', 'en_implementacion', 'Torres del Parque', 'cop-2'),
  ]),
  '1002': persona('1002', 'Pedro Sin Copropiedad', '3009876543', 'pedro@ejemplo.com', [
    asig('administrador', 'finalizada', 'activa', 'Altos del Bosque', 'cop-1'),
    asig('administrador', 'vigente', 'prospecto', 'Prospecto SA', 'cop-3'),
  ]),
  '1003': persona('1003', 'Sin Celular', '', 'sin@ejemplo.com', [asig('administrador', 'vigente', 'activa', 'Altos', 'cop-1')]),
}
function persona(doc: string, nombre: string, celular: string, correo: string, asignaciones: unknown[]) {
  return { documentId: `per-${doc}`, nombre, tipoDocumento: 'CC', numeroDocumento: doc, celular, correo, asignaciones }
}
function asig(rol: string, estado: string, estadoCop: string, nombre: string, id: string) {
  return { rol, estado, desde: '2026-01-01', hasta: null, copropiedad: { documentId: id, nombre, estado: estadoCop } }
}

// BOB de mentira: filtra por numeroDocumento y responde como Strapi 5.
const bob = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  if (req.headers.authorization !== 'Bearer token-de-prueba') { res.writeHead(401); return res.end() }
  const doc = url.searchParams.get('filters[numeroDocumento][$eq]') ?? ''
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ data: personas[doc] ? [personas[doc]] : [] }))
})
await new Promise<void>((r) => bob.listen(0, '127.0.0.1', r))
const puertoBob = (bob.address() as { port: number }).port

const cfg = cargarConfig({
  BLOKY_ENTORNO: 'desarrollo', BOB_URL: `http://127.0.0.1:${puertoBob}`, BOB_API_TOKEN: 'token-de-prueba',
  BLOKY_URL_PUBLICA: 'http://localhost:5173', BLOKY_JWT_SECRET: 'prueba',
})
const app = await construirApp(cfg)
const resultados: Array<[string, string, string?]> = []
async function paso(nombre: string, fn: () => Promise<boolean | string>) {
  try {
    const r = await fn()
    resultados.push([r === true ? 'ok' : 'FALLA', nombre, typeof r === 'string' ? r : undefined])
  } catch (e) { resultados.push(['FALLA', nombre, String((e as Error).message)]) }
}
const post = (url: string, cuerpo: unknown, cookies?: string) =>
  app.inject({ method: 'POST', url, payload: cuerpo, headers: cookies ? { cookie: cookies } : {} })

await paso('salud responde', async () => (await app.inject({ method: 'GET', url: '/api/salud' })).statusCode === 200)
await paso('documento no registrado → 404', async () =>
  (await post('/api/acceso/identificar', { tipoDocumento: 'CC', numeroDocumento: '9999' })).statusCode === 404)
await paso('sin asignacion vigente en copropiedad activa → 403', async () =>
  (await post('/api/acceso/identificar', { tipoDocumento: 'CC', numeroDocumento: '1002' })).statusCode === 403)
await paso('sin celular ni proveedores → 409', async () =>
  (await post('/api/acceso/identificar', { tipoDocumento: 'CC', numeroDocumento: '1003' })).statusCode === 409)
await paso('identificar: dos copropiedades y canal sms con pista', async () => {
  const r = await post('/api/acceso/identificar', { tipoDocumento: 'cc', numeroDocumento: '1.001' })
  const c = r.json()
  return r.statusCode === 200 && c.copropiedades.length === 2 && c.canales[0].tipo === 'sms' && c.canales[0].pista === '••• 4567' && c.nombre.startsWith('Olga') || JSON.stringify(c)
})
let codigo = ''
await paso('enviar codigo: simulado en desarrollo', async () => {
  const r = await post('/api/acceso/enviar-codigo', { numeroDocumento: '1001' })
  codigo = r.json().codigoSimulado
  return r.statusCode === 200 && /^\d{6}$/.test(codigo) || r.body
})
await paso('codigo incorrecto → 401', async () =>
  (await post('/api/acceso/verificar-codigo', { numeroDocumento: '1001', codigo: '000000' })).statusCode === 401)
let cookie = ''
await paso('codigo correcto → sesion y cookie httpOnly', async () => {
  const r = await post('/api/acceso/verificar-codigo', { numeroDocumento: '1001', codigo })
  cookie = (r.headers['set-cookie'] as string) ?? ''
  const s = r.json().sesion
  return r.statusCode === 200 && cookie.includes('bloky_sesion=') && cookie.includes('HttpOnly') && s.copropiedades[0].rol === 'administrador' && s.documento === '••• 001' || r.body
})
await paso('GET /api/sesion con cookie → 200', async () =>
  (await app.inject({ method: 'GET', url: '/api/sesion', headers: { cookie: cookie.split(';')[0] } })).statusCode === 200)
await paso('salir → la sesion queda revocada', async () => {
  await post('/api/salir', {}, cookie.split(';')[0])
  return (await app.inject({ method: 'GET', url: '/api/sesion', headers: { cookie: cookie.split(';')[0] } })).statusCode === 401
})
await paso('RN-166: cinco codigos malos bloquean el documento', async () => {
  await post('/api/acceso/enviar-codigo', { numeroDocumento: '1001' })
  let ultimo = 0
  for (let i = 0; i < 6; i++) ultimo = (await post('/api/acceso/verificar-codigo', { numeroDocumento: '1001', codigo: '111111' })).statusCode
  return ultimo === 429 || `ultimo estado ${ultimo}`
})
await paso('google sin configurar → 409', async () =>
  (await app.inject({ method: 'GET', url: '/api/acceso/google?tipo=CC&documento=1001' })).statusCode === 409)

await app.close()
bob.close()
for (const [estado, nombre, detalle] of resultados) console.log(`${estado.padEnd(5)} ${nombre}${detalle ? ` — ${detalle}` : ''}`)
const fallas = resultados.filter(([e]) => e !== 'ok').length
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\nTodo paso')
process.exit(fallas ? 1 : 0)
