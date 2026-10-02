/**
 * El expediente de un proceso sancionatorio, compartido por las dos vistas.
 * CU-A-23, CU-R-29 · docs/casos-de-uso/administrador.md#cu-a-23
 *
 * **Los dos lados leen lo mismo.** El administrador y el copropietario ven el
 * mismo expediente, con las mismas actuaciones y en el mismo orden: si cada uno
 * viera su propia versión, el día que discutan no habría un documento común
 * sobre el cual discutir. Lo que cambia entre las dos pantallas es **qué se
 * puede hacer**, no **qué se ve**.
 *
 * Y esa es también la razón de que la línea de tiempo sea el centro y no un
 * detalle escondido: si alguien impugna la multa, lo que se revisa es
 * exactamente esto — si se le notificó, si tuvo plazo, si lo oyeron y si pudo
 * impugnar.
 */

import { ETAPAS_SANCION, diasDePlazo } from '../dominio/reglas'
import { formatearDinero, formatearFecha, formatearFechaHora } from '../utilidades/formato'
import type { Sancion } from '../dominio/tipos'

/** El estado y de quién es el turno, que es lo primero que hay que saber. */
export function EstadoSancionChip({ sancion }: { sancion: Sancion }) {
  const etapa = ETAPAS_SANCION[sancion.estado]
  return <span className={etapa.chip}>{etapa.texto}</span>
}

/**
 * El plazo que corre, dicho en días.
 *
 * «Hasta el 19 de septiembre» obliga a hacer la cuenta; «te quedan 7 días» no.
 * Y cuando ya se venció **se dice**, en vez de mostrar una fecha pasada que hay
 * que interpretar.
 */
export function PlazoSancion({ sancion }: { sancion: Sancion }) {
  const dias = diasDePlazo(sancion)
  if (dias === null) return null

  const limite =
    sancion.estado === 'notificada' ? sancion.limiteDescargos : sancion.limiteImpugnacion
  const que = sancion.estado === 'notificada' ? 'presentar descargos' : 'impugnar'

  if (dias < 0) {
    return (
      <span className="subtitulo">
        El plazo para {que} venció el {formatearFecha(limite!)}.
      </span>
    )
  }
  return (
    <span className="subtitulo">
      {dias === 0 ? `Hoy vence el plazo para ${que}` : `Quedan ${dias} días para ${que}`} · hasta el{' '}
      {formatearFecha(limite!)}
    </span>
  )
}

/**
 * La cabecera: qué se sanciona, con qué norma, por cuánto y con qué radicado.
 *
 * **La norma va aquí, no escondida en la línea de tiempo.** El administrador no
 * decide las multas: las aprobó la asamblea o ya están en el reglamento o el
 * manual de convivencia, y él las aplica (Mary, 2026-09-09). Una multa se
 * comprueba por dos mitades —qué norma y qué hechos—, así que las dos tienen que
 * estar a la vista de quien la recibe. Sin la cita, «te multaron por ruido» es
 * la palabra del administrador contra la del copropietario.
 */
export function CabeceraSancion({ sancion }: { sancion: Sancion }) {
  return (
    <div className="lista lista--compacta">
      <div className="fila">
        <span className="subtitulo">Radicado</span>
        <strong className="numerico">{sancion.radicado}</strong>
      </div>
      <div className="fila">
        <span className="subtitulo">Conducta</span>
        <strong>{sancion.concepto}</strong>
      </div>
      <div className="fila fila-inicio">
        <span className="subtitulo">Norma</span>
        <strong style={{ textAlign: 'right' }}>{sancion.respaldo}</strong>
      </div>
      {/* Que se impuso como reincidencia va dicho, no deducido del valor: quien
          recibe una multa mas cara tiene derecho a saber por que lo es, y esa
          es una de las cosas que puede controvertir (RN-72). */}
      {sancion.reincidencia && (
        <div className="fila">
          <span className="subtitulo">Reincidencia</span>
          <span className="chip chip--alerta">Valor agravado</span>
        </div>
      )}
      <div className="fila">
        <span className="subtitulo">Valor</span>
        <strong>{formatearDinero(sancion.valor)}</strong>
      </div>
      <div className="fila">
        <span className="subtitulo">Estado</span>
        <EstadoSancionChip sancion={sancion} />
      </div>
    </div>
  )
}

/** Los hechos, que son lo que se controvierte. */
export function HechosSancion({ sancion }: { sancion: Sancion }) {
  return (
    <div className="columna" style={{ gap: 'var(--e1)' }}>
      <span className="titulo-seccion">Los hechos</span>
      <p className="mensaje">{sancion.hechos}</p>
    </div>
  )
}

/**
 * La línea de tiempo del expediente.
 *
 * Las actuaciones van **de la más vieja a la más nueva**, al revés que casi todo
 * lo demás en la app: aquí no se viene a ver la novedad, se viene a seguir un
 * proceso, y un proceso se lee en el orden en que pasó.
 */
export function LineaDeTiempo({ sancion }: { sancion: Sancion }) {
  return (
    <div className="columna" style={{ gap: 'var(--e2)' }}>
      <span className="titulo-seccion">Qué ha pasado</span>
      <ol className="actuaciones">
        {sancion.actuaciones.map((actuacion) => (
          <li key={actuacion.id} className={`actuacion actuacion--${actuacion.autor}`}>
            <div className="fila">
              <strong>{actuacion.titulo}</strong>
              <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                {formatearFechaHora(actuacion.fecha)}
              </span>
            </div>
            {/* Quién actuó, siempre: un expediente donde no se sabe quién hizo
                qué no prueba nada. */}
            <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
              {actuacion.autor === 'administracion' ? 'La administración' : 'El copropietario'}
            </span>
            {actuacion.texto && <p className="subtitulo">{actuacion.texto}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
