/**
 * CU-R-48 — Elegir por dónde y de qué me avisan (PN-16).
 * Doc: docs/casos-de-uso/residente.md#cu-r-48
 *
 * WhatsApp, mensaje de texto, correo o solo la app; y qué temas quiere. Lo que
 * responde a algo que la persona pidió no se puede apagar, y se dice cuál es.
 * Abajo, lo último que le enviamos: así sabe que funciona.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { configurarAvisos } from '../../datos/repositorio'
import { TEXTO_CANAL_AVISO, TEXTO_TEMA_AVISO } from '../../dominio/reglas'
import type { CanalAviso, TemaAviso } from '../../dominio/tipos'
import { formatearFechaHora } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'

export function AvisosPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const persona = sesion ? sel.persona(bd, sesion.personaId) : undefined
  const [canal, setCanal] = useState<CanalAviso>(persona?.preferenciasAvisos?.canal ?? 'whatsapp')
  const [temas, setTemas] = useState<Partial<Record<TemaAviso, boolean>>>(persona?.preferenciasAvisos?.temas ?? {})
  if (!sesion || !persona) return null

  const dato = (c: CanalAviso) =>
    c === 'correo' ? persona.email || 'No tenemos tu correo' : c === 'app' ? 'Los ves al entrar a la app' : persona.telefono || 'No tenemos tu celular'
  const disponible = (c: CanalAviso) => (c === 'correo' ? !!persona.email?.trim() : c === 'app' ? true : !!persona.telefono?.trim())
  const recientes = bd.mensajes.filter((m) => m.personaId === persona.id).slice(0, 5)

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver />
        <h1 className="titulo">Mis avisos</h1>
      </div>

      <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
        <strong>¿Por dónde te avisamos?</strong>
        <div className="lista lista--compacta" role="radiogroup" aria-label="Canal de los avisos">
          {(Object.keys(TEXTO_CANAL_AVISO) as CanalAviso[]).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={canal === c}
              className="opcion-categoria"
              aria-pressed={canal === c}
              disabled={!disponible(c)}
              onClick={() => setCanal(c)}
            >
              <span className="columna">
                <strong>{TEXTO_CANAL_AVISO[c]}</strong>
                <span className="subtitulo">{dato(c)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
        <strong>¿De qué te avisamos?</strong>
        {(Object.keys(TEXTO_TEMA_AVISO) as TemaAviso[]).map((t) => (
          <label key={t} className="opcion-huella" style={{ margin: 0 }}>
            <input type="checkbox" checked={temas[t] !== false} onChange={(e) => setTemas({ ...temas, [t]: e.target.checked })} />
            <span>
              <strong>{TEXTO_TEMA_AVISO[t].titulo}</strong>
              <span className="subtitulo">{TEXTO_TEMA_AVISO[t].detalle}</span>
            </span>
          </label>
        ))}
        <p className="subtitulo">
          Siempre te avisamos lo que responde a algo que pediste (registros, reservas, permisos, tus preguntas)
          y los pagos que se hagan a tu nombre. En la app ves todo, elijas lo que elijas.
        </p>
      </div>

      <button
        className="boton boton--primario boton--bloque"
        disabled={cargando}
        onClick={() =>
          void ejecutar((base) => configurarAvisos(base, { personaId: persona.id, canal, temas }), 'Listo. Así te avisaremos.')
        }
      >
        Guardar
      </button>

      {recientes.length > 0 && (
        <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
          <strong>Lo último que te enviamos</strong>
          {recientes.map((m) => (
            <div key={m.id} className="columna" style={{ gap: 2 }}>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {m.canal ? TEXTO_CANAL_AVISO[m.canal] : 'Mensaje'} · {formatearFechaHora(m.enviadoEn)}
              </span>
              <span className="subtitulo">{m.texto}</span>
            </div>
          ))}
          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            Demo: los mensajes se escriben pero no se envían todavía.
          </span>
        </div>
      )}
    </div>
  )
}
