/**
 * Adaptador PostgreSQL. Aplica las migraciones de `migraciones/` al arrancar, en orden y una
 * sola vez cada una (tabla `migracion`), para que desplegar no exija pasos a mano.
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import type { EstadoOauth, TipoDocumento } from '../dominio/tipos.js'
import type { Repositorio } from './repositorio.js'

const CARPETA_MIGRACIONES = join(dirname(fileURLToPath(import.meta.url)), 'migraciones')

export async function crearRepositorioPostgres(url: string): Promise<Repositorio> {
  const pool = new pg.Pool({ connectionString: url, max: 5 })
  await migrar(pool)

  return {
    async guardarSesion(s) {
      await pool.query(
        `INSERT INTO sesion (id, persona_id, nombre, tipo_documento, numero_documento, canal, copropiedades, creada_en, vence_en, revocada_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [s.id, s.personaId, s.nombre, s.tipoDocumento, s.numeroDocumento, s.canal, JSON.stringify(s.copropiedades), s.creadaEn, s.venceEn, s.revocadaEn ?? null],
      )
    },
    async sesion(id) {
      const { rows } = await pool.query('SELECT * FROM sesion WHERE id = $1', [id])
      const f = rows[0]
      if (!f) return undefined
      return {
        id: f.id, personaId: f.persona_id, nombre: f.nombre, tipoDocumento: f.tipo_documento,
        numeroDocumento: f.numero_documento, canal: f.canal, copropiedades: f.copropiedades,
        creadaEn: new Date(f.creada_en).toISOString(), venceEn: new Date(f.vence_en).toISOString(),
        revocadaEn: f.revocada_en ? new Date(f.revocada_en).toISOString() : null,
      }
    },
    async revocarSesion(id, cuando) {
      await pool.query('UPDATE sesion SET revocada_en = $2 WHERE id = $1 AND revocada_en IS NULL', [id, cuando])
    },
    async registrarIntento(i) {
      await pool.query(
        'INSERT INTO intento_ingreso (tipo_documento, numero_documento, canal, resultado, ip, fecha) VALUES ($1,$2,$3,$4,$5,$6)',
        [i.tipoDocumento, i.numeroDocumento, i.canal, i.resultado, i.ip ?? null, i.fecha],
      )
    },
    async intentosFallidosDesde(tipoDocumento: TipoDocumento, numeroDocumento, desde) {
      const { rows } = await pool.query(
        `SELECT count(*)::int AS n FROM intento_ingreso
         WHERE tipo_documento = $1 AND numero_documento = $2 AND resultado = 'codigo_incorrecto' AND fecha >= $3`,
        [tipoDocumento, numeroDocumento, desde],
      )
      return rows[0].n as number
    },
    async guardarEstadoOauth(e) {
      await pool.query(
        'INSERT INTO estado_oauth (estado, proveedor, tipo_documento, numero_documento, nonce, creado_en) VALUES ($1,$2,$3,$4,$5,$6)',
        [e.estado, e.proveedor, e.tipoDocumento, e.numeroDocumento, e.nonce, e.creadoEn],
      )
    },
    async consumirEstadoOauth(estado) {
      const { rows } = await pool.query('DELETE FROM estado_oauth WHERE estado = $1 RETURNING *', [estado])
      const f = rows[0]
      if (!f) return undefined
      return { estado: f.estado, proveedor: f.proveedor, tipoDocumento: f.tipo_documento, numeroDocumento: f.numero_documento, nonce: f.nonce, creadoEn: new Date(f.creado_en).toISOString() } as EstadoOauth
    },
    async cerrar() { await pool.end() },
  }
}

async function migrar(pool: pg.Pool): Promise<void> {
  await pool.query('CREATE TABLE IF NOT EXISTS migracion (nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now())')
  const archivos = (await readdir(CARPETA_MIGRACIONES)).filter((a) => a.endsWith('.sql')).sort()
  for (const archivo of archivos) {
    const { rowCount } = await pool.query('SELECT 1 FROM migracion WHERE nombre = $1', [archivo])
    if (rowCount) continue
    const sql = await readFile(join(CARPETA_MIGRACIONES, archivo), 'utf8')
    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')
      await cliente.query(sql)
      await cliente.query('INSERT INTO migracion (nombre) VALUES ($1)', [archivo])
      await cliente.query('COMMIT')
      console.log(`migracion aplicada: ${archivo}`)
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }
}
