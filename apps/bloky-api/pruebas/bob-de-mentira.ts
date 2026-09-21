/**
 * Un BOB de mentira para desarrollar sin Strapi: responde a /api/personas como Strapi 5 con
 * tres personas de prueba. Solo desarrollo.
 *
 *   npx tsx pruebas/bob-de-mentira.ts          # escucha en http://127.0.0.1:1337
 *   BOB_URL=http://127.0.0.1:1337 BOB_API_TOKEN=token-de-prueba npm run dev
 *
 * Documentos: 1001 (Olga, administradora de dos copropiedades), 1002 (sin acceso vigente),
 * 1003 (sin celular). Token: token-de-prueba.
 */
import { createServer } from 'node:http'

const asig = (rol: string, estado: string, estadoCop: string, nombre: string, id: string) =>
  ({ rol, estado, desde: '2026-01-01', hasta: null, copropiedad: { documentId: id, nombre, estado: estadoCop } })
const persona = (doc: string, nombre: string, celular: string, correo: string, asignaciones: unknown[]) =>
  ({ documentId: `per-${doc}`, nombre, tipoDocumento: 'CC', numeroDocumento: doc, celular, correo, asignaciones })

export const PERSONAS: Record<string, unknown> = {
  '1001': persona('1001', 'Olga Lucia Henao', '3001234567', 'olga@ejemplo.com', [
    asig('administrador', 'vigente', 'activa', 'Conjunto Residencial Altos del Bosque', 'cop-1'),
    asig('delegado', 'vigente', 'en_implementacion', 'Torres del Parque', 'cop-2'),
  ]),
  '1002': persona('1002', 'Pedro Sin Copropiedad', '3009876543', 'pedro@ejemplo.com', [
    asig('administrador', 'finalizada', 'activa', 'Altos del Bosque', 'cop-1'),
  ]),
  '1003': persona('1003', 'Sin Celular', '', 'sin@ejemplo.com', [asig('administrador', 'vigente', 'activa', 'Altos', 'cop-1')]),
}

export function crearBobDeMentira(token = 'token-de-prueba') {
  return createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    if (req.headers.authorization !== `Bearer ${token}`) { res.writeHead(401); return res.end() }
    const doc = url.searchParams.get('filters[numeroDocumento][$eq]') ?? ''
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ data: PERSONAS[doc] ? [PERSONAS[doc]] : [] }))
  })
}

if (process.argv[1]?.endsWith('bob-de-mentira.ts')) {
  const puerto = Number(process.env.PORT ?? 1337)
  crearBobDeMentira().listen(puerto, '127.0.0.1', () => console.log(`BOB de mentira en http://127.0.0.1:${puerto} (token: token-de-prueba)`))
}
