/**
 * PN-24 — Antes de la asamblea: los documentos para leer y las preguntas de los
 * propietarios (CU-A-12, CU-R-20; Mary, 2026-11-23).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-12 · docs/casos-de-uso/residente.md#cu-r-20
 *
 * El propietario llega a la reunión habiendo leído el presupuesto y con sus dudas
 * respondidas: la asamblea dura menos y se discute mejor. La respuesta la ven
 * todos, **sin el nombre de quien preguntó**.
 */

import { useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import { preguntarAntesDeAsamblea, publicarDocumentoEdificio, responderPreguntaAsamblea } from '../datos/repositorio'
import { MAXIMO_ARCHIVO_DOCUMENTO_KB, TEXTO_CATEGORIA_DOCUMENTO, hoyISO, motivoPreguntaAsambleaInvalida } from '../dominio/reglas'
import type { Asamblea, CategoriaDocumentoEdificio, RolResidencia } from '../dominio/tipos'
import { descargarArchivo } from '../utilidades/descarga'
import { formatearFecha } from '../utilidades/formato'

type Archivo = { nombre: string; tipo: string; datos: string }

export function AntesDeLaAsamblea({ asamblea, modo, rol }: { asamblea: Asamblea; modo: 'residente' | 'admin'; rol?: RolResidencia }) {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumentoEdificio>('presupuesto')
  const [archivo, setArchivo] = useState<Archivo | undefined>()
  const [texto, setTexto] = useState('')
  const [puntoId, setPuntoId] = useState('')
  const [respuestas, setRespuestas] = useState<Record<string, string>>({})
  if (!sesion) return null

  const admin = modo === 'admin'
  const terminada = asamblea.estado === 'cerrada' || asamblea.estado === 'cancelada'
  const documentos = (bd.documentosEdificio ?? []).filter((d) => d.asambleaId === asamblea.id && !d.retiro)
  const preguntas = asamblea.preguntas ?? []
  // El propietario ve las respondidas (de todos) y las suyas que esperan.
  const visibles = admin ? preguntas : preguntas.filter((p) => p.respuesta || p.personaId === sesion.personaId)
  const puedePreguntar = !admin && !motivoPreguntaAsambleaInvalida(asamblea, rol, 'x'.repeat(20))
  const tituloPunto = (id?: string) => asamblea.ordenDelDia.find((p) => p.id === id)?.titulo

  if (!admin && documentos.length === 0 && visibles.length === 0 && !puedePreguntar) return null

  return (
    <div className="tarjeta">
      <span className="titulo-seccion">Antes de la asamblea</span>

      <strong style={{ display: 'block', marginTop: 'var(--e2)' }}>Documentos para leer</strong>
      {documentos.length === 0 ? (
        <span className="tenue">{admin ? 'Aún no has publicado documentos para esta asamblea.' : 'La administración todavía no publica documentos.'}</span>
      ) : (
        <div className="lista lista--compacta">
          {documentos.map((d) => (
            <div key={d.id} className="fila">
              <span>
                {d.titulo} <span className="tenue">· {TEXTO_CATEGORIA_DOCUMENTO[d.categoria]}</span>
              </span>
              {d.archivo && (
                <button
                  className="boton boton--pequeno"
                  onClick={async () => {
                    const r = await descargarArchivo(d.archivo!.nombre, d.archivo!.datos)
                    if (r === 'no_disponible') mostrarAviso('Este archivo no se puede descargar desde aquí. Pídelo a la administración.', 'error')
                  }}
                >
                  Descargar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {admin && !terminada && (
        <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e2)' }}>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor={`doc-asamblea-${asamblea.id}`}>Título del documento</label>
              <input id={`doc-asamblea-${asamblea.id}`} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Presupuesto 2027" />
            </div>
            <div className="campo">
              <label htmlFor={`cat-asamblea-${asamblea.id}`}>Tipo</label>
              <select id={`cat-asamblea-${asamblea.id}`} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaDocumentoEdificio)}>
                {(Object.keys(TEXTO_CATEGORIA_DOCUMENTO) as CategoriaDocumentoEdificio[]).map((c) => (
                  <option key={c} value={c}>
                    {TEXTO_CATEGORIA_DOCUMENTO[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="campo">
            <label htmlFor={`arch-asamblea-${asamblea.id}`}>Archivo (PDF o imagen)</label>
            <input
              id={`arch-asamblea-${asamblea.id}`}
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
          </div>
          <button
            className="boton boton--pequeno boton--primario"
            disabled={cargando || titulo.trim().length < 4}
            onClick={async () => {
              const hecho = await ejecutar(
                (base) =>
                  publicarDocumentoEdificio(base, {
                    copropiedadId: asamblea.copropiedadId,
                    personaId: sesion.personaId,
                    titulo,
                    categoria,
                    fecha: hoyISO(),
                    archivo,
                    asambleaId: asamblea.id,
                  }),
                'Documento publicado: los propietarios ya lo pueden leer.',
              )
              if (hecho) {
                setTitulo('')
                setArchivo(undefined)
              }
            }}
          >
            Publicar para la asamblea
          </button>
        </div>
      )}

      <div className="separador" />
      <strong>Preguntas de los propietarios</strong>
      {!admin && (
        <span className="subtitulo" style={{ display: 'block' }}>
          La respuesta la ven todos los propietarios, sin tu nombre.
        </span>
      )}
      {visibles.length === 0 && <span className="tenue" style={{ display: 'block' }}>Todavía no hay preguntas.</span>}
      <div className="lista lista--compacta">
        {visibles.map((p) => (
          <div key={p.id} className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e1)' }}>
            {tituloPunto(p.puntoId) && <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>Sobre: {tituloPunto(p.puntoId)}</span>}
            <span>{p.texto}</span>
            {p.respuesta ? (
              <span className="subtitulo">
                <strong>Respuesta:</strong> {p.respuesta.texto}
              </span>
            ) : admin && !terminada ? (
              <>
                <textarea
                  aria-label="Respuesta"
                  rows={2}
                  value={respuestas[p.id] ?? ''}
                  onChange={(e) => setRespuestas({ ...respuestas, [p.id]: e.target.value })}
                />
                <button
                  className="boton boton--pequeno boton--primario"
                  style={{ alignSelf: 'flex-start' }}
                  disabled={cargando}
                  onClick={() =>
                    void ejecutar(
                      (base) =>
                        responderPreguntaAsamblea(base, {
                          asambleaId: asamblea.id,
                          preguntaId: p.id,
                          personaId: sesion.personaId,
                          texto: respuestas[p.id] ?? '',
                        }),
                      'Respuesta publicada. Le avisamos a quien preguntó.',
                    )
                  }
                >
                  Responder
                </button>
              </>
            ) : (
              <span className="tenue">Esperando respuesta de la administración.</span>
            )}
            {admin && <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>Preguntó el {formatearFecha(p.fecha.slice(0, 10))}</span>}
          </div>
        ))}
      </div>

      {puedePreguntar && (
        <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e2)' }}>
          <div className="campo">
            <label htmlFor={`preg-asamblea-${asamblea.id}`}>Tu pregunta</label>
            <textarea id={`preg-asamblea-${asamblea.id}`} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor={`preg-punto-${asamblea.id}`}>Sobre qué punto (opcional)</label>
            <select id={`preg-punto-${asamblea.id}`} value={puntoId} onChange={(e) => setPuntoId(e.target.value)}>
              <option value="">En general</option>
              {asamblea.ordenDelDia.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.orden}. {p.titulo}
                </option>
              ))}
            </select>
          </div>
          <button
            className="boton boton--pequeno boton--primario"
            disabled={cargando}
            onClick={async () => {
              const hecho = await ejecutar(
                (base) =>
                  preguntarAntesDeAsamblea(base, {
                    asambleaId: asamblea.id,
                    personaId: sesion.personaId,
                    unidadId: sesion.unidadActivaId ?? '',
                    texto,
                    puntoId: puntoId || undefined,
                  }),
                'Pregunta enviada. Te avisamos cuando la administración responda.',
              )
              if (hecho) {
                setTexto('')
                setPuntoId('')
              }
            }}
          >
            Enviar pregunta
          </button>
        </div>
      )}
    </div>
  )
}
