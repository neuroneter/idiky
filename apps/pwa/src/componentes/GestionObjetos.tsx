/**
 * CU-R-49 · PN-17 — Los objetos encontrados, del lado de portería y de la
 * administración: registrar lo que llega, ver quién dice que es suyo con sus
 * señas, entregarlo y —pasado el plazo, sin reclamos— darlo de baja.
 */

import { useState } from 'react'
import { useDatos } from '../estado/DatosContext'
import { useSesion } from '../estado/SesionContext'
import * as sel from '../datos/selectores'
import { darDeBajaObjeto, entregarObjeto, registrarObjetoEncontrado } from '../datos/repositorio'
import {
  DIAS_OBJETO_EN_PORTERIA,
  TEXTO_ESTADO_OBJETO,
  estadoObjeto,
  etiquetaUnidad,
  fechaLocalDe,
  hoyISO,
  motivoBajaObjetoInvalida,
  motivoObjetoInvalido,
  objetoPendiente,
  sumarDias,
} from '../dominio/reglas'
import { formatearFecha, formatearFechaHora } from '../utilidades/formato'
import { CapturaFoto } from './CapturaFoto'

export function GestionObjetos() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [descripcion, setDescripcion] = useState('')
  const [lugar, setLugar] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [dandoDeBaja, setDandoDeBaja] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null
  const hoy = hoyISO()
  const objetos = (bd.objetosEncontrados ?? []).filter((o) => o.copropiedadId === sesion.copropiedadId)
  const pendientes = objetos.filter(objetoPendiente)
  const cerrados = objetos.filter((o) => !objetoPendiente(o)).slice(0, 8)
  const invalido = motivoObjetoInvalido({ descripcion, lugar })

  return (
    <div className="pila">
      <div className="tarjeta">
        <strong>Registrar un objeto encontrado</strong>
        <div className="fila-campos" style={{ marginTop: 'var(--e3)' }}>
          <div className="campo">
            <label htmlFor="descripcion-objeto">Qué es</label>
            <input id="descripcion-objeto" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Llaves con llavero rojo" />
          </div>
          <div className="campo">
            <label htmlFor="lugar-objeto">Dónde se encontró</label>
            <input id="lugar-objeto" value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Salón social" />
          </div>
        </div>
        <CapturaFoto etiqueta="Foto (opcional)" ayuda="Ayuda a que el dueño lo reconozca." valor={foto} alCambiar={setFoto} />
        <button
          className="boton boton--primario boton--bloque"
          disabled={cargando || !!invalido}
          onClick={async () => {
            const hecho = await ejecutar(
              (base) => registrarObjetoEncontrado(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, descripcion, lugar, foto: foto ?? undefined }),
              'Objeto registrado. Los vecinos ya lo ven en la app.',
            )
            if (hecho) {
              setDescripcion('')
              setLugar('')
              setFoto(null)
            }
          }}
        >
          Registrar
        </button>
      </div>

      <span className="titulo-seccion">En portería ({pendientes.length})</span>
      {pendientes.length === 0 && <p className="subtitulo">No hay objetos esperando a su dueño.</p>}
      {pendientes.map((o) => {
        const plazo = sumarDias(fechaLocalDe(o.encontradoEn), DIAS_OBJETO_EN_PORTERIA)
        const puedeBaja = !motivoBajaObjetoInvalida(o, 'motivo válido', hoy)
        return (
          <div key={o.id} className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e2)' }}>
            <div className="fila fila-inicio">
              <strong>{o.descripcion}</strong>
              <span className={o.reclamos.length ? 'chip chip--info' : 'chip'}>{TEXTO_ESTADO_OBJETO[estadoObjeto(o)]}</span>
            </div>
            {o.foto && <img src={o.foto.imagen} alt={o.descripcion} style={{ maxWidth: 220, borderRadius: 'var(--radio-sm)' }} />}
            <span className="subtitulo">
              {o.lugar} · {formatearFechaHora(o.encontradoEn)} · espera hasta el {formatearFecha(plazo)}
            </span>
            {o.reclamos.map((r) => {
              const unidad = sel.unidad(bd, r.unidadId)
              return (
                <div key={r.personaId} className="fila fila-inicio">
                  <span className="subtitulo">
                    <strong>{sel.nombreCompleto(sel.persona(bd, r.personaId))}</strong>
                    {unidad ? ` · ${etiquetaUnidad(unidad)}` : ''}: «{r.senas}»
                  </span>
                  <button
                    className="boton boton--pequeno"
                    disabled={cargando}
                    onClick={() =>
                      void ejecutar(
                        (base) => entregarObjeto(base, { objetoId: o.id, personaId: sesion.personaId, entregadoA: r.personaId }),
                        'Objeto entregado.',
                      )
                    }
                  >
                    Entregar
                  </button>
                </div>
              )
            })}
            {puedeBaja && dandoDeBaja !== o.id && (
              <button className="boton boton--pequeno" style={{ alignSelf: 'flex-start' }} onClick={() => setDandoDeBaja(o.id)}>
                Dar de baja
              </button>
            )}
            {dandoDeBaja === o.id && (
              <div className="fila">
                <input aria-label="Qué se hizo con el objeto" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Donado a la fundación del barrio" style={{ flex: 1 }} />
                <button
                  className="boton boton--pequeno"
                  disabled={cargando || motivo.trim().length < 5}
                  onClick={async () => {
                    const hecho = await ejecutar((base) => darDeBajaObjeto(base, { objetoId: o.id, personaId: sesion.personaId, motivo }), 'Objeto dado de baja.')
                    if (hecho) {
                      setDandoDeBaja(null)
                      setMotivo('')
                    }
                  }}
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )
      })}

      {cerrados.length > 0 && (
        <div className="tarjeta">
          <strong>Cerrados</strong>
          {cerrados.map((o) => (
            <p key={o.id} className="subtitulo">
              {o.descripcion} ·{' '}
              {o.entrega
                ? `Entregado a ${sel.nombreCompleto(sel.persona(bd, o.entrega.personaId))}`
                : `${TEXTO_ESTADO_OBJETO[estadoObjeto(o)]}${o.baja ? `: ${o.baja.motivo}` : ''}`}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
