/**
 * CU-R-24 — Consultar mi coeficiente de copropiedad.
 * Doc: docs/casos-de-uso/residente.md#cu-r-24
 *
 * El coeficiente es un dato de consulta para el copropietario y es lo que determina
 * el peso de su voto en asamblea (RN-27, confirmado por el equipo el 2026-08-26).
 * Aqui se muestra junto con lo que determina, para que el numero signifique algo.
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { etiquetaUnidad, pesoDelVoto, periodoActual, sumaCoeficientes } from '../../dominio/reglas'
import { capitalizar, formatearDinero, formatearPeriodo } from '../../utilidades/formato'
import { BotonVolver } from '../../componentes/BotonVolver'
import { EstadoVacio } from '../../componentes/EstadoVacio'

/** El coeficiente se expresa en porcentaje con cuatro decimales (docs/05, RN-19). */
function formatearCoeficiente(coeficiente: number): string {
  return `${coeficiente.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')} %`
}

export function MiUnidadPage() {
  const { bd } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  if (!unidad) {
    return (
      <EstadoVacio
        titulo="Sin unidad activa"
        detalle="Tu administrador aún no ha vinculado tu unidad a la copropiedad."
      />
    )
  }

  const unidades = sel.unidadesDe(bd, sesion.copropiedadId)
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const residencias = sel.residenciasDeUnidad(bd, unidad.id)
  const miRol = residencias.find((residencia) => residencia.personaId === sesion.personaId)?.rol

  // La cuota ordinaria del periodo actual es la prueba visible de que el coeficiente
  // determina el valor a pagar (RN-05). Si aun no se ha generado, no se inventa.
  const cuotaDelMes = sel
    .cuotasDeUnidad(bd, unidad.id)
    .find((cuota) => cuota.periodo === periodoActual() && cuota.tipo === 'ordinaria')

  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver />
      </div>

      <div className="tarjeta tarjeta--marca">
        <span className="subtitulo">Tu coeficiente de copropiedad</span>
        <div className="dato-grande numerico" style={{ margin: 'var(--e1) 0 var(--e2)' }}>
          {formatearCoeficiente(unidad.coeficiente)}
        </div>
        <span className="subtitulo">
          {etiquetaUnidad(unidad)} · {unidad.area} m² · {capitalizar(unidad.tipo)}
          {miRol ? ` · Como ${miRol}` : ''}
        </span>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Que determina tu coeficiente</span>

        <div className="tarjeta tarjeta--plana">
          <div className="fila fila-inicio">
            <div className="columna" style={{ flex: 1 }}>
              <strong>Cuanto pagas de administración</strong>
              <span className="subtitulo">
                Las cuotas ordinarias y las extraordinarias se reparten entre las unidades
                según su coeficiente, no en partes iguales.
              </span>
            </div>
          </div>
          {cuotaDelMes && (
            <>
              <div className="separador" />
              <div className="fila">
                <span className="subtitulo">Cuota de {formatearPeriodo(cuotaDelMes.periodo)}</span>
                <strong className="numerico">{formatearDinero(cuotaDelMes.valor)}</strong>
              </div>
            </>
          )}
        </div>

        <div className="tarjeta tarjeta--plana">
          <div className="fila fila-inicio">
            <div className="columna" style={{ flex: 1 }}>
              <strong>Cuanto pesa tu voto en la asamblea</strong>
              <span className="subtitulo">
                En la asamblea no se cuenta una unidad, un voto: cada unidad vota con el peso
                de su coeficiente.
              </span>
            </div>
          </div>
          <div className="separador" />
          <div className="fila">
            <span className="subtitulo">Peso de tu voto</span>
            <strong className="numerico">{formatearCoeficiente(pesoDelVoto(unidad))}</strong>
          </div>
        </div>
      </div>

      <div className="pila">
        <span className="titulo-seccion">En contexto</span>
        <div className="tarjeta tarjeta--plana">
          <div className="lista lista--compacta">
            <div className="fila">
              <span className="subtitulo">Unidades en la copropiedad</span>
              <strong className="numerico">{unidades.length}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Suma de todos los coeficientes</span>
              <strong className="numerico">
                {formatearCoeficiente(sumaCoeficientes(unidades))}
              </strong>
            </div>
            {copropiedad && (
              // En columna: el nombre de la copropiedad es largo y en fila desborda.
              <div className="columna">
                <span className="subtitulo">Copropiedad</span>
                <strong>{copropiedad.nombre}</strong>
              </div>
            )}
          </div>
          <div className="separador" />
          <p className="subtitulo">
            La suma de los coeficientes de todas las unidades siempre da 100 %. El tuyo es la
            parte de la copropiedad que le corresponde a tu unidad.
          </p>
        </div>
      </div>

      <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        El coeficiente lo fija el reglamento de propiedad horizontal. Si crees que el tuyo no
        corresponde, radica una solicitud a la administración.
      </p>
    </>
  )
}
