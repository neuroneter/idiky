/**
 * CU-R-42 — Clasificados entre vecinos (PN-08).
 * Doc: docs/casos-de-uso/residente.md#cu-r-42
 *
 * Vendo, regalo, busco y servicios. El aviso dura 30 días; quien lo publicó lo
 * cierra cuando lo resuelve. Si deja ver su celular, le escriben por WhatsApp.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { cerrarAviso, publicarAviso } from '../../../datos/repositorio'
import { TEXTO_TIPO_AVISO, etiquetaUnidad, motivoAvisoInvalido } from '../../../dominio/reglas'
import type { TipoAviso } from '../../../dominio/tipos'
import { formatearDinero, formatearFecha } from '../../../utilidades/formato'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { EstadoVacio } from '../../../componentes/EstadoVacio'
import { Modal } from '../../../componentes/Modal'
import { CapturaFoto } from '../../../componentes/CapturaFoto'
import { Icono } from '../../../componentes/Icono'

export function ClasificadosPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [filtro, setFiltro] = useState<TipoAviso | 'todos'>('todos')
  const [creando, setCreando] = useState(false)
  if (!sesion) return null
  const avisos = sel.clasificadosVigentes(bd, sesion.copropiedadId).filter((a) => filtro === 'todos' || a.tipo === filtro)

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/edificio" texto="Tu edificio" />
        <h1 className="titulo">Clasificados</h1>
      </div>
      <button className="boton boton--primario boton--bloque" onClick={() => setCreando(true)}>
        <Icono nombre="mas" tamano={16} />
        Publicar un aviso
      </button>
      <div className="filtros">
        {(['todos', ...Object.keys(TEXTO_TIPO_AVISO)] as Array<TipoAviso | 'todos'>).map((t) => (
          <button key={t} className="filtro" aria-pressed={filtro === t} onClick={() => setFiltro(t)}>
            {t === 'todos' ? 'Todos' : TEXTO_TIPO_AVISO[t]}
          </button>
        ))}
      </div>
      {avisos.length === 0 && <EstadoVacio titulo="No hay avisos" detalle="Sé el primero en publicar." />}
      {avisos.map((aviso) => {
        const autor = sel.persona(bd, aviso.personaId)
        const unidad = sel.unidad(bd, aviso.unidadId)
        const mio = aviso.personaId === sesion.personaId
        const celular = autor?.telefono?.replace(/\D/g, '')
        return (
          <div key={aviso.id} className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila fila-inicio">
              <strong>{aviso.titulo}</strong>
              <span className="chip chip--marca">{TEXTO_TIPO_AVISO[aviso.tipo]}</span>
            </div>
            {aviso.foto && (
              <img src={aviso.foto.imagen} alt={aviso.titulo} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 'var(--radio-sm)' }} />
            )}
            <span className="subtitulo">{aviso.descripcion}</span>
            {aviso.precio ? <strong className="numerico">{formatearDinero(aviso.precio)}</strong> : null}
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              {autor?.nombres.split(' ')[0]} · {unidad ? etiquetaUnidad(unidad) : ''} · hasta el {formatearFecha(aviso.venceEl)}
            </span>
            {mio ? (
              <div className="grupo-botones">
                <button
                  className="boton boton--pequeno"
                  disabled={cargando}
                  onClick={() =>
                    void ejecutar((base) => cerrarAviso(base, { avisoId: aviso.id, personaId: sesion.personaId, motivo: 'resuelto' }), '¡Qué bien! Aviso cerrado.')
                  }
                >
                  Ya lo resolví
                </button>
                <button
                  className="boton boton--pequeno"
                  disabled={cargando}
                  onClick={() =>
                    void ejecutar((base) => cerrarAviso(base, { avisoId: aviso.id, personaId: sesion.personaId, motivo: 'retirado' }), 'Aviso retirado.')
                  }
                >
                  Retirarlo
                </button>
              </div>
            ) : aviso.mostrarCelular && celular ? (
              <a className="boton boton--pequeno" style={{ alignSelf: 'flex-start' }} href={`https://wa.me/${celular.length === 10 ? `57${celular}` : celular}`} target="_blank" rel="noreferrer">
                Escribirle por WhatsApp
              </a>
            ) : (
              <span className="subtitulo">Pregunta por {autor?.nombres.split(' ')[0]} en portería.</span>
            )}
          </div>
        )
      })}
      {creando && <NuevoAviso alCerrar={() => setCreando(false)} />}
    </div>
  )
}

function NuevoAviso({ alCerrar }: { alCerrar: () => void }) {
  const { ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [tipo, setTipo] = useState<TipoAviso>('vendo')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [mostrarCelular, setMostrarCelular] = useState(true)
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  const valor = precio.trim() ? Number(precio.replace(/[^\d]/g, '')) : undefined
  const motivo = motivoAvisoInvalido({ tipo, titulo, descripcion, precio: valor })

  return (
    <Modal titulo="Publicar un aviso" descripcion="Lo ven los vecinos del edificio durante 30 días." onCerrar={alCerrar}>
      <div className="segmentos">
        {(Object.keys(TEXTO_TIPO_AVISO) as TipoAviso[]).map((t) => (
          <button key={t} className="segmento" aria-current={tipo === t ? 'page' : undefined} onClick={() => setTipo(t)}>
            {TEXTO_TIPO_AVISO[t]}
          </button>
        ))}
      </div>
      <div className="campo">
        <label htmlFor="titulo-aviso">Título</label>
        <input id="titulo-aviso" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Bicicleta de niño, rin 16" />
      </div>
      <div className="campo">
        <label htmlFor="descripcion-aviso">Descripción</label>
        <textarea id="descripcion-aviso" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </div>
      {tipo !== 'regalo' && (
        <div className="campo">
          <label htmlFor="precio-aviso">Precio (opcional)</label>
          <input id="precio-aviso" inputMode="numeric" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="180000" />
        </div>
      )}
      <CapturaFoto etiqueta="Foto (opcional)" ayuda="Se guarda reducida." valor={foto} alCambiar={setFoto} />
      <label className="opcion-huella">
        <input type="checkbox" checked={mostrarCelular} onChange={(e) => setMostrarCelular(e.target.checked)} />
        <span>Que me escriban por WhatsApp a mi celular</span>
      </label>
      {motivo && (titulo || descripcion) && <p className="acceso__nota">{motivo}</p>}
      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando || !!motivo}
        onClick={async () => {
          const hecho = await ejecutar(
            (base) =>
              publicarAviso(base, {
                unidadId,
                personaId: sesion.personaId,
                tipo,
                titulo,
                descripcion,
                precio: tipo === 'regalo' ? undefined : valor,
                foto: foto ?? undefined,
                mostrarCelular,
              }),
            'Aviso publicado.',
          )
          if (hecho) alCerrar()
        }}
      >
        Publicar
      </button>
    </Modal>
  )
}
