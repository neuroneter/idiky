/**
 * CU-A-12 — La citación de la asamblea y su constancia de envío (RN-219).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-12
 *
 * La citación va a **cada propietario**: en la app siempre, al correo si lo
 * tiene y, si no, impresa para entregarla en mano (Ley 675, art. 39). Lo que
 * se ve aquí es la constancia: a quién, cuándo y por dónde. Una asamblea mal
 * convocada se puede anular, y esta es la prueba de que no lo estuvo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { emitirCitacion, marcarCitacionEntregada } from '../../datos/repositorio'
import { citacionesPorEntregar, etiquetaUnidad } from '../../dominio/reglas'
import type { Asamblea } from '../../dominio/tipos'
import { HojaCitacion } from '../../componentes/HojaCitacion'
import { formatearFechaHora } from '../../utilidades/formato'

export function CitacionAsamblea({ asamblea }: { asamblea: Asamblea }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [viendo, setViendo] = useState(false)
  if (!sesion) return null

  const documento = asamblea.citacionDocumentoId
    ? bd.documentos.find((d) => d.id === asamblea.citacionDocumentoId)
    : undefined

  if (!documento) {
    if (asamblea.estado !== 'convocada') return null
    return (
      <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e3)' }}>
        <strong>Citación</strong>
        <p className="subtitulo">
          Esta asamblea todavía no tiene su citación. Al emitirla se envía a cada propietario y se
          publica en la cartelera.
        </p>
        <button
          className="boton boton--primario"
          disabled={cargando}
          onClick={() =>
            void ejecutar(
              (base) => emitirCitacion(base, { asambleaId: asamblea.id, personaId: sesion.personaId }),
              'Citación emitida y enviada a cada propietario.',
            )
          }
        >
          Emitir la citación
        </button>
      </div>
    )
  }

  const envios = asamblea.envioCitacion ?? []
  const porCorreo = envios.filter((e) => e.canales.includes('correo')).length
  const impresas = envios.filter((e) => e.canales.includes('impresa'))
  const porEntregar = citacionesPorEntregar(envios)

  return (
    <div className="tarjeta tarjeta--plana" style={{ marginTop: 'var(--e3)' }}>
      <div className="fila">
        <strong>Citación {documento.numero}</strong>
        <span className="chip chip--exito">Enviada</span>
      </div>
      <p className="subtitulo">
        A <strong>{envios.length}</strong> propietarios: todos en la app, {porCorreo} también al
        correo
        {impresas.length > 0 ? ` y ${impresas.length} impresa${impresas.length === 1 ? '' : 's'} porque no tienen correo` : ''}
        . Enviada el {envios[0] ? formatearFechaHora(envios[0].enviadoEn) : '—'}.
      </p>

      {porEntregar.length > 0 && (
        <div className="columna" style={{ gap: 'var(--e2)', marginBottom: 'var(--e2)' }}>
          <p className="acceso__nota">
            <strong>
              {porEntregar.length === 1
                ? 'Falta entregar una citación impresa'
                : `Faltan entregar ${porEntregar.length} citaciones impresas`}
            </strong>
            : imprímelas con «Ver la citación» y márcalas al entregarlas.
          </p>
          {porEntregar.map((envio) => {
            const unidad = sel.unidad(bd, envio.unidadId)
            const persona = sel.persona(bd, envio.personaId)
            return (
              <div key={`${envio.unidadId}-${envio.personaId}`} className="fila">
                <span>
                  {unidad ? etiquetaUnidad(unidad) : '—'} · {sel.nombreCompleto(persona)}
                </span>
                <button
                  className="boton boton--pequeno"
                  disabled={cargando}
                  onClick={() =>
                    void ejecutar(
                      (base) =>
                        marcarCitacionEntregada(base, {
                          asambleaId: asamblea.id,
                          personaId: sesion.personaId,
                          unidadId: envio.unidadId,
                          destinatarioId: envio.personaId,
                        }),
                      'Entrega registrada.',
                    )
                  }
                >
                  Entregada
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="grupo-botones">
        <button className="boton" onClick={() => setViendo(!viendo)}>
          {viendo ? 'Ocultar la citación' : 'Ver la citación'}
        </button>
        {viendo && (
          <button className="boton boton--primario" onClick={() => window.print()}>
            Imprimir o guardar en PDF
          </button>
        )}
      </div>

      {viendo && (
        <div className="previsualizacion-hoja" style={{ marginTop: 'var(--e3)' }}>
          <HojaCitacion
            asamblea={asamblea}
            documento={documento}
            copropiedad={sel.copropiedad(bd, asamblea.copropiedadId)}
            administrador={sel.persona(bd, documento.emitidoPor) ?? sel.administradorDe(bd)}
          />
        </div>
      )}
    </div>
  )
}
