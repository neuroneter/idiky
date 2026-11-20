/**
 * Tu edificio — la entrada a lo que es de todos: cuentas claras (CU-R-37),
 * documentos (CU-R-38), encuestas (CU-R-39), calendario (CU-R-41),
 * clasificados (CU-R-42) y teléfonos útiles (CU-R-17).
 * Mary, 2026-11-20: «la idea es salir siendo competitivos».
 */

import { Link } from 'react-router-dom'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import * as sel from '../../../datos/selectores'
import { encuestaAbierta, hoyISO, respuestaDeUnidad } from '../../../dominio/reglas'
import { BotonVolver } from '../../../componentes/BotonVolver'
import { Icono, type NombreIcono } from '../../../componentes/Icono'

export function EdificioPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null
  const hoy = hoyISO()
  const encuestasPorResponder = sel
    .encuestasDe(bd, sesion.copropiedadId)
    .filter((e) => encuestaAbierta(e, hoy) && !respuestaDeUnidad(e, sesion.unidadActivaId ?? '')).length
  const proximos = sel.calendarioDelEdificio(bd, sesion.copropiedadId, sesion.unidadActivaId).length

  const opciones: Array<{ a: string; titulo: string; detalle: string; icono: NombreIcono; contador?: number }> = [
    { a: '/app/edificio/cuentas', titulo: 'Cuentas claras', detalle: 'Cuánto entró, en qué se gastó y el fondo', icono: 'cartera' },
    { a: '/app/edificio/calendario', titulo: 'Calendario', detalle: 'Mantenimientos, cortes, asambleas y tus fechas', icono: 'reservas', contador: proximos },
    { a: '/app/edificio/encuestas', titulo: 'Encuestas', detalle: 'Opina sobre lo que se decide en el edificio', icono: 'voto', contador: encuestasPorResponder },
    { a: '/app/edificio/documentos', titulo: 'Documentos', detalle: 'Reglamento, manual, actas y pólizas', icono: 'certificado' },
    { a: '/app/edificio/clasificados', titulo: 'Clasificados', detalle: 'Vendo, regalo, busco y servicios entre vecinos', icono: 'comunicados' },
    { a: '/app/directorio', titulo: 'Teléfonos útiles', detalle: 'Portería, administración y emergencias', icono: 'personas' },
  ]

  return (
    <div className="pila">
      <div className="encabezado-pagina">
        <BotonVolver />
        <h1 className="titulo">Tu edificio</h1>
      </div>
      <div className="lista lista--compacta">
        {opciones.map((o) => (
          <Link key={o.a} to={o.a} className="tarjeta tarjeta--accion tarjeta--plana">
            <div className="tarjeta__cuerpo">
              <span className="marca-tarjeta">
                <Icono nombre={o.icono} tamano={20} />
              </span>
              <div className="columna" style={{ flex: 1 }}>
                <strong>{o.titulo}</strong>
                <span className="subtitulo">{o.detalle}</span>
              </div>
              {!!o.contador && <span className="chip chip--marca">{o.contador}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
