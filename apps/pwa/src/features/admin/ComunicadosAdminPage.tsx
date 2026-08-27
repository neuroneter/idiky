/**
 * CU-A-08 — Publicar un comunicado.
 * Doc: docs/casos-de-uso/administrador.md#cu-a-08
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { publicarComunicado } from '../../datos/repositorio'
import { formatearFecha } from '../../utilidades/formato'
import type { CategoriaComunicado } from '../../dominio/tipos'
import { Modal } from '../../componentes/Modal'
import { Icono } from '../../componentes/Icono'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { ChipComunicado } from '../../componentes/Etiquetas'

export function ComunicadosAdminPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [creando, setCreando] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaComunicado>('general')
  const [fijado, setFijado] = useState(false)
  const [vigenteHasta, setVigenteHasta] = useState('')

  if (!sesion) return null

  const comunicados = sel.comunicadosVigentes(bd, sesion.copropiedadId)
  const unidades = sel.unidadesDe(bd, sesion.copropiedadId).length

  async function publicar() {
    if (titulo.trim().length < 5 || cuerpo.trim().length < 15) {
      mostrarAviso('El comunicado necesita un titulo y un cuerpo con contenido.', 'error')
      return
    }
    const creado = await ejecutar(
      (base) =>
        publicarComunicado(base, {
          copropiedadId: sesion!.copropiedadId,
          titulo: titulo.trim(),
          cuerpo: cuerpo.trim(),
          categoria,
          fijado,
          vigenteHasta: vigenteHasta || undefined,
          autor: 'Administración',
        }),
      'Comunicado publicado.',
    )
    if (creado) {
      setCreando(false)
      setTitulo('')
      setCuerpo('')
      setFijado(false)
      setVigenteHasta('')
      setCategoria('general')
    }
  }

  return (
    <>
      <div className="fila">
        <span className="subtitulo">
          Los comunicados se ven de inmediato en la cartelera de las {unidades} unidades.
        </span>
        <button className="boton boton--primario" onClick={() => setCreando(true)}>
          <Icono nombre="mas" tamano={15} />
          Nuevo comunicado
        </button>
      </div>

      {comunicados.length === 0 ? (
        <EstadoVacio titulo="Sin comunicados vigentes" detalle="Publica el primero." />
      ) : (
        <div className="lista">
          {comunicados.map((comunicado) => (
            <div key={comunicado.id} className="tarjeta">
              <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
                <div className="grupo-botones">
                  <ChipComunicado categoria={comunicado.categoria} />
                  {comunicado.fijado && <span className="chip">Fijado</span>}
                </div>
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  {formatearFecha(comunicado.fechaPublicacion)} · {comunicado.leidoPor.length}{' '}
                  lecturas
                </span>
              </div>
              <strong>{comunicado.titulo}</strong>
              <p className="subtitulo" style={{ marginTop: 'var(--e1)' }}>
                {comunicado.cuerpo}
              </p>
            </div>
          ))}
        </div>
      )}

      {creando && (
        <Modal
          titulo="Nuevo comunicado"
          descripcion="Se publica de inmediato en la app de todos los residentes."
          onCerrar={() => setCreando(false)}
        >
          <div className="campo">
            <label htmlFor="titulo-comunicado">Titulo</label>
            <input
              id="titulo-comunicado"
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="Ej: corte programado de agua"
            />
          </div>
          <div className="campo">
            <label htmlFor="cuerpo-comunicado">Contenido</label>
            <textarea
              id="cuerpo-comunicado"
              value={cuerpo}
              onChange={(evento) => setCuerpo(evento.target.value)}
              placeholder="Detalle del comunicado…"
            />
          </div>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="categoria-comunicado">Categoria</label>
              <select
                id="categoria-comunicado"
                value={categoria}
                onChange={(evento) => setCategoria(evento.target.value as CategoriaComunicado)}
              >
                <option value="general">General</option>
                <option value="urgente">Urgente</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="asamblea">Asamblea</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="vigencia-comunicado">Vigente hasta (opcional)</label>
              <input
                id="vigencia-comunicado"
                type="date"
                value={vigenteHasta}
                onChange={(evento) => setVigenteHasta(evento.target.value)}
              />
            </div>
          </div>
          <label className="fila" style={{ justifyContent: 'flex-start', gap: 'var(--e2)', marginBottom: 'var(--e4)' }}>
            <input
              type="checkbox"
              checked={fijado}
              style={{ width: 'auto' }}
              onChange={(evento) => setFijado(evento.target.checked)}
            />
            <span className="subtitulo">Fijar al inicio de la cartelera</span>
          </label>
          <button className="boton boton--primario boton--bloque" disabled={cargando} onClick={publicar}>
            Publicar comunicado
          </button>
        </Modal>
      )}
    </>
  )
}
