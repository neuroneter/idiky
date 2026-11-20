/**
 * CU-R-38 — Consultar los documentos del edificio (PN-04).
 * Doc: docs/casos-de-uso/residente.md#cu-r-38
 */

import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { TEXTO_CATEGORIA_DOCUMENTO } from '../../../dominio/reglas'
import type { CategoriaDocumentoEdificio } from '../../../dominio/tipos'
import { formatearFecha } from '../../../utilidades/formato'
import { descargarArchivo } from '../../../utilidades/descarga'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { EstadoVacio } from '../../../componentes/EstadoVacio'

export function DocumentosPage() {
  const { bd, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const documentos = sel.documentosEdificioDe(bd, sesion.copropiedadId)
  const categorias = (Object.keys(TEXTO_CATEGORIA_DOCUMENTO) as CategoriaDocumentoEdificio[]).filter((c) =>
    documentos.some((d) => d.categoria === c),
  )

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver a="/app/edificio" texto="Tu edificio" />
        <h1 className="titulo">Documentos</h1>
      </div>
      {documentos.length === 0 && (
        <EstadoVacio titulo="Todavía no hay documentos" detalle="La administración los publicará aquí." />
      )}
      {categorias.map((categoria) => (
        <div key={categoria} className="pila">
          <span className="titulo-seccion">{TEXTO_CATEGORIA_DOCUMENTO[categoria]}</span>
          {documentos
            .filter((d) => d.categoria === categoria)
            .map((d) => (
              <div key={d.id} className="tarjeta tarjeta--plana columna" style={{ gap: 'var(--e1)' }}>
                <strong>{d.titulo}</strong>
                {d.descripcion && <span className="subtitulo">{d.descripcion}</span>}
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  Fecha del documento: {formatearFecha(d.fecha)}
                </span>
                {d.archivo ? (
                  <button
                    className="boton boton--pequeno"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={async () => {
                      const r = await descargarArchivo(d.archivo!.nombre, d.archivo!.datos)
                      if (r === 'no_disponible') mostrarAviso('Este archivo no se puede descargar desde aquí. Pídelo a la administración.', 'error')
                    }}
                  >
                    Descargar
                  </button>
                ) : (
                  <span className="subtitulo">Pídelo a la administración.</span>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
