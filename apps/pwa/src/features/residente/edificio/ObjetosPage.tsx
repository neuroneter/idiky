/**
 * CU-R-49 — Objetos perdidos (PN-17).
 * Doc: docs/casos-de-uso/residente.md#cu-r-49
 *
 * Lo que portería encontró en el edificio y espera a su dueño. «Es mío», con
 * alguna seña, y se recoge en portería con el documento.
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import { reclamarObjeto } from '../../../datos/repositorio'
import { objetoPendiente } from '../../../dominio/reglas'
import { formatearFechaHora } from '../../../utilidades/formato'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { EstadoVacio } from '../../../componentes/EstadoVacio'

export function ObjetosPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [reclamando, setReclamando] = useState<string | null>(null)
  const [senas, setSenas] = useState('')
  if (!sesion) return null
  const unidadId = sesion.unidadActivaId ?? ''
  const objetos = (bd.objetosEncontrados ?? []).filter((o) => o.copropiedadId === sesion.copropiedadId && objetoPendiente(o))
  const misEntregados = (bd.objetosEncontrados ?? []).filter((o) => o.entrega?.personaId === sesion.personaId).slice(0, 3)

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/edificio" texto="Tu edificio" />
        <h1 className="titulo">Objetos perdidos</h1>
      </div>
      <p className="subtitulo">Lo que se encontró en el edificio y espera a su dueño en portería.</p>
      {objetos.length === 0 && <EstadoVacio titulo="No hay objetos en portería" detalle="Si alguien encuentra algo, lo verás aquí." />}
      {objetos.map((o) => {
        const mio = o.reclamos.some((r) => r.personaId === sesion.personaId)
        return (
          <div key={o.id} className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
            <strong>{o.descripcion}</strong>
            {o.foto && <img src={o.foto.imagen} alt={o.descripcion} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 'var(--radio-sm)' }} />}
            <span className="subtitulo">
              Se encontró en {o.lugar.toLowerCase()} · {formatearFechaHora(o.encontradoEn)}
            </span>
            {mio ? (
              <span className="chip chip--exito" style={{ alignSelf: 'flex-start' }}>
                Pasa por portería con tu documento
              </span>
            ) : reclamando === o.id ? (
              <>
                <div className="campo">
                  <label htmlFor={`senas-${o.id}`}>¿Cómo sabemos que es tuyo?</label>
                  <input id={`senas-${o.id}`} value={senas} onChange={(e) => setSenas(e.target.value)} placeholder="Tiene tres llaves y una es de candado" />
                </div>
                <button
                  className="boton boton--primario"
                  disabled={cargando || senas.trim().length < 10}
                  onClick={async () => {
                    const hecho = await ejecutar(
                      (base) => reclamarObjeto(base, { objetoId: o.id, personaId: sesion.personaId, unidadId, senas }),
                      'Listo. Portería ya sabe que es tuyo: pasa por él con tu documento.',
                    )
                    if (hecho) {
                      setReclamando(null)
                      setSenas('')
                    }
                  }}
                >
                  Enviar
                </button>
              </>
            ) : (
              <button className="boton" style={{ alignSelf: 'flex-start' }} onClick={() => setReclamando(o.id)}>
                Es mío
              </button>
            )}
          </div>
        )
      })}
      {misEntregados.length > 0 && (
        <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
          Ya recogiste: {misEntregados.map((o) => o.descripcion).join(', ')}.
        </p>
      )}
    </div>
  )
}
