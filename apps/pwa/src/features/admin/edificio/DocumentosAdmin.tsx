/**
 * CU-A-33 — Publicar los documentos del edificio (PN-04).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-33
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { publicarDocumentoEdificio, retirarDocumentoEdificio } from '../../../datos/repositorio'
import { MAXIMO_ARCHIVO_DOCUMENTO_KB, TEXTO_CATEGORIA_DOCUMENTO, hoyISO } from '../../../dominio/reglas'
import type { CategoriaDocumentoEdificio } from '../../../dominio/tipos'
import { formatearFecha } from '../../../utilidades/formato'

export function DocumentosAdmin() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumentoEdificio>('acta')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [archivo, setArchivo] = useState<{ nombre: string; tipo: string; datos: string } | undefined>()
  const [retirando, setRetirando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null
  const documentos = sel.documentosEdificioDe(bd, sesion.copropiedadId, true)

  return (
    <div className="rejilla-dos">
      <div className="tarjeta">
        <strong>Publicar un documento</strong>
        <div className="campo" style={{ marginTop: 'var(--e3)' }}>
          <label htmlFor="titulo-documento">Título</label>
          <input id="titulo-documento" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Acta de la asamblea ordinaria 2026" />
        </div>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="categoria-documento">Tipo</label>
            <select id="categoria-documento" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDocumentoEdificio)}>
              {(Object.keys(TEXTO_CATEGORIA_DOCUMENTO) as CategoriaDocumentoEdificio[]).map((c) => (
                <option key={c} value={c}>
                  {TEXTO_CATEGORIA_DOCUMENTO[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="fecha-documento">Fecha del documento</label>
            <input id="fecha-documento" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="descripcion-documento">Descripción (opcional)</label>
          <input id="descripcion-documento" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="archivo-documento">Archivo (PDF o imagen)</label>
          <input
            id="archivo-documento"
            type="file"
            accept="application/pdf,image/*,text/plain"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return setArchivo(undefined)
              if (f.size > MAXIMO_ARCHIVO_DOCUMENTO_KB * 1024) {
                mostrarAviso(`En el demo el archivo puede pesar hasta ${MAXIMO_ARCHIVO_DOCUMENTO_KB} KB.`, 'error')
                e.target.value = ''
                return
              }
              const lector = new FileReader()
              lector.onload = () => setArchivo({ nombre: f.name, tipo: f.type, datos: String(lector.result) })
              lector.readAsDataURL(f)
            }}
          />
          <span className="ayuda-campo">En el demo, hasta {MAXIMO_ARCHIVO_DOCUMENTO_KB} KB. En la versión real el archivo va al servidor.</span>
        </div>
        <button
          className="boton boton--primario boton--bloque"
          disabled={cargando || titulo.trim().length < 4}
          onClick={async () => {
            const hecho = await ejecutar(
              (base) =>
                publicarDocumentoEdificio(base, {
                  copropiedadId: sesion.copropiedadId,
                  personaId: sesion.personaId,
                  titulo,
                  categoria,
                  descripcion,
                  fecha,
                  archivo,
                }),
              'Documento publicado.',
            )
            if (hecho) {
              setTitulo('')
              setDescripcion('')
              setArchivo(undefined)
            }
          }}
        >
          Publicar
        </button>
      </div>
      <div className="tarjeta">
        <strong>Publicados</strong>
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
          {documentos.map((d) => (
            <div key={d.id} className="columna" style={{ gap: 'var(--e1)' }}>
              <div className="fila">
                <span style={d.retiro ? { textDecoration: 'line-through' } : undefined}>{d.titulo}</span>
                {d.retiro ? (
                  <span className="chip">Retirado</span>
                ) : (
                  <button className="boton boton--pequeno" onClick={() => setRetirando(d.id)}>
                    Retirar
                  </button>
                )}
              </div>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {TEXTO_CATEGORIA_DOCUMENTO[d.categoria]} · {formatearFecha(d.fecha)}
                {d.retiro ? ` · retirado: ${d.retiro.motivo}` : ''}
              </span>
              {retirando === d.id && (
                <div className="fila">
                  <input aria-label="Motivo del retiro" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Lo reemplaza la versión 2026" style={{ flex: 1 }} />
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando || motivo.trim().length < 5}
                    onClick={async () => {
                      const hecho = await ejecutar((base) => retirarDocumentoEdificio(base, { documentoId: d.id, personaId: sesion.personaId, motivo }), 'Documento retirado. Queda guardado.')
                      if (hecho) {
                        setRetirando(null)
                        setMotivo('')
                      }
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
