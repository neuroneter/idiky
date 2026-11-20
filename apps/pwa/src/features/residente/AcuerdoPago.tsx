/**
 * CU-A-39 (lado del propietario) — Proponer un acuerdo de pago y seguirlo (PN-19).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-39
 *
 * Solo aparece si el edificio permite acuerdos y hay algo vencido. Se ofrece en
 * positivo, sin juzgar: «¿Te queda difícil pagar todo de una vez?»
 * (docs/08-convenciones.md §6 bis).
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cancelarAcuerdoPago, proponerAcuerdoPago } from '../../datos/repositorio'
import {
  CUOTAS_ACUERDO,
  acuerdoEnCurso,
  avanceAcuerdo,
  calcularSaldoVencido,
  calendarioAcuerdo,
  decideEnLaUnidad,
  hoyISO,
  motivoAcuerdoInvalido,
  sumarDias,
} from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'

export function AcuerdoPago() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const hoy = hoyISO()
  const [abierto, setAbierto] = useState(false)
  const [cuotas, setCuotas] = useState('3')
  const [primera, setPrimera] = useState(sumarDias(hoy, 7))
  const [nota, setNota] = useState('')
  if (!sesion?.unidadActivaId) return null
  const unidadId = sesion.unidadActivaId
  // PN-20 — Solo para el propietario o el arrendatario.
  if (!decideEnLaUnidad(sel.rolEnUnidad(bd, sesion.personaId, unidadId))) return null
  const config = sel.copropiedad(bd, sesion.copropiedadId)?.acuerdosPago
  const enCurso = (bd.acuerdosPago ?? []).find((a) => a.unidadId === unidadId && acuerdoEnCurso(a))
  const ultimoRechazado = (bd.acuerdosPago ?? []).filter((a) => a.unidadId === unidadId && a.estado === 'rechazado').slice(-1)[0]

  if (enCurso) {
    const avance = avanceAcuerdo(enCurso, bd.pagos, hoy)
    const siguiente = enCurso.cuotas.find((c) => c.fecha >= hoy)
    return (
      <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
        <div className="fila">
          <strong>Tu acuerdo de pago</strong>
          <span className={enCurso.estado === 'propuesto' ? 'chip chip--info' : avance.alDia ? 'chip chip--exito' : 'chip chip--alerta'}>
            {enCurso.estado === 'propuesto' ? 'Esperando aprobación' : avance.cumplido ? '¡Cumplido!' : avance.alDia ? 'Vas al día' : 'Te falta ponerte al día'}
          </span>
        </div>
        <span className="subtitulo">
          {formatearDinero(enCurso.deudaAcordada)} en {enCurso.cuotas.length} cuotas de {formatearDinero(enCurso.cuotas[0].valor)}.
          {enCurso.estado === 'aprobado' ? ` Llevas ${formatearDinero(avance.pagado)}.` : ''}
        </span>
        {enCurso.estado === 'aprobado' && !avance.alDia && (
          <span className="subtitulo">Para ir al día con el acuerdo te faltan {formatearDinero(avance.debido - avance.pagado)}.</span>
        )}
        {siguiente && (
          <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
            Próxima cuota: {formatearDinero(siguiente.valor)} el {formatearFecha(siguiente.fecha)}
          </span>
        )}
        {enCurso.estado === 'propuesto' && (
          <button
            className="boton boton--pequeno"
            style={{ alignSelf: 'flex-start' }}
            disabled={cargando}
            onClick={() => void ejecutar((base) => cancelarAcuerdoPago(base, { acuerdoId: enCurso.id, personaId: sesion.personaId }), 'Propuesta retirada.')}
          >
            Retirar la propuesta
          </button>
        )}
      </div>
    )
  }

  const deuda = calcularSaldoVencido(sel.cuotasDeUnidad(bd, unidadId))
  if (!config?.activo || deuda <= 0) return null
  const motivo = motivoAcuerdoInvalido({ cuotas: Number(cuotas), primera, deuda }, config, false, hoy)
  const calendario = motivo ? [] : calendarioAcuerdo(deuda, Number(cuotas), primera)

  return (
    <div className="tarjeta columna" style={{ gap: 'var(--e2)' }}>
      <strong>¿Te queda difícil pagar todo de una vez?</strong>
      <span className="subtitulo">
        Propón un acuerdo para ponerte al día con {formatearDinero(deuda)} en cuotas. La administración lo revisa y te
        avisa.
      </span>
      {ultimoRechazado?.decision?.motivo && (
        <span className="subtitulo">Sobre tu propuesta anterior, la administración dijo: «{ultimoRechazado.decision.motivo}».</span>
      )}
      {!abierto ? (
        <button className="boton" style={{ alignSelf: 'flex-start' }} onClick={() => setAbierto(true)}>
          Proponer un acuerdo
        </button>
      ) : (
        <>
          <div className="fila-campos">
            <div className="campo">
              <label htmlFor="cuotas-acuerdo">Cuántas cuotas</label>
              <input id="cuotas-acuerdo" type="number" min={CUOTAS_ACUERDO.minimo} max={config.cuotasMaximas} value={cuotas} onChange={(e) => setCuotas(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="primera-acuerdo">Primera cuota</label>
              <input id="primera-acuerdo" type="date" min={hoy} max={sumarDias(hoy, 30)} value={primera} onChange={(e) => setPrimera(e.target.value)} />
            </div>
          </div>
          {calendario.length > 0 && (
            <span className="subtitulo">
              {calendario.length} cuotas de {formatearDinero(calendario[0].valor)}: del {formatearFecha(calendario[0].fecha)} al{' '}
              {formatearFecha(calendario[calendario.length - 1].fecha)}. Además, sigues pagando la cuota de cada mes.
            </span>
          )}
          <div className="campo">
            <label htmlFor="nota-acuerdo">¿Algo que quieras contarle a la administración? (opcional)</label>
            <input id="nota-acuerdo" value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
          {motivo && <p className="acceso__nota">{motivo}</p>}
          <button
            className="boton boton--primario"
            disabled={cargando || !!motivo}
            onClick={async () => {
              const hecho = await ejecutar(
                (base) => proponerAcuerdoPago(base, { unidadId, personaId: sesion.personaId, cuotas: Number(cuotas), primera, nota }),
                'Listo. Te avisamos cuando la administración lo revise.',
              )
              if (hecho) setAbierto(false)
            }}
          >
            Enviar la propuesta
          </button>
        </>
      )}
    </div>
  )
}
