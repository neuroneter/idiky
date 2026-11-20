/**
 * CU-A-39 — Acuerdos de pago, del lado de la administración (PN-19).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-39
 *
 * Mary, 2026-11-20: «hay que crear en la parametrización si en el edificio es
 * viable que el administrador haga acuerdos de pago». Primero la opción Sí/No
 * (y hasta cuántas cuotas); con Sí, los acuerdos propuestos y cómo van.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { cancelarAcuerdoPago, configurarAcuerdosPago, decidirAcuerdoPago } from '../../datos/repositorio'
import { CUOTAS_ACUERDO, acuerdoEnCurso, avanceAcuerdo, etiquetaUnidad, hoyISO, motivoConfigAcuerdosInvalida } from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'

export function AcuerdosPagoAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const config = sesion ? sel.copropiedad(bd, sesion.copropiedadId)?.acuerdosPago : undefined
  const [maximo, setMaximo] = useState(String(config?.cuotasMaximas ?? 6))
  const [noAprobando, setNoAprobando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  if (!sesion) return null
  const activo = !!config?.activo
  const invalido = motivoConfigAcuerdosInvalida(Number(maximo))
  const hoy = hoyISO()
  const acuerdos = (bd.acuerdosPago ?? []).filter((a) => a.copropiedadId === sesion.copropiedadId && acuerdoEnCurso(a))

  const guardar = (nuevo: boolean) =>
    void ejecutar(
      (base) =>
        configurarAcuerdosPago(base, { copropiedadId: sesion.copropiedadId, personaId: sesion.personaId, activo: nuevo, cuotasMaximas: Number(maximo) }),
      nuevo ? 'Acuerdos de pago habilitados.' : 'Acuerdos de pago deshabilitados.',
    )

  return (
    <div className="tarjeta">
      <div className="fila">
        <strong>Acuerdos de pago</strong>
        <span className={activo ? 'chip chip--exito' : 'chip'}>{activo ? 'Sí se permiten' : 'No se permiten'}</span>
      </div>
      <p className="subtitulo">
        ¿El edificio permite que quien esté atrasado se ponga al día en cuotas? Si sí, lo propone desde la app y tú lo
        apruebas. La deuda no cambia: es un calendario pactado.
      </p>
      <label className="fila" style={{ gap: 'var(--e1)', justifyContent: 'flex-start', marginTop: 'var(--e2)' }}>
        <span className="subtitulo">Hasta</span>
        <input
          type="number"
          min={CUOTAS_ACUERDO.minimo}
          max={CUOTAS_ACUERDO.maximo}
          aria-label="Máximo de cuotas"
          value={maximo}
          onChange={(e) => setMaximo(e.target.value)}
          style={{ width: '5rem' }}
        />
        <span className="subtitulo">cuotas mensuales</span>
      </label>
      {invalido && <p className="acceso__nota">{invalido}</p>}
      <div className="grupo-botones" style={{ marginTop: 'var(--e2)' }}>
        <button className="boton boton--primario" disabled={cargando || !!invalido} onClick={() => guardar(true)}>
          {activo ? 'Guardar cambios' : 'Sí, permitir acuerdos'}
        </button>
        {activo && (
          <button className="boton" disabled={cargando} onClick={() => guardar(false)}>
            No permitir
          </button>
        )}
      </div>

      {activo && (
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e3)' }}>
          {acuerdos.length === 0 && <p className="subtitulo">No hay acuerdos en curso.</p>}
          {acuerdos.map((a) => {
            const unidad = sel.unidad(bd, a.unidadId)
            const avance = avanceAcuerdo(a, bd.pagos, hoy)
            return (
              <div key={a.id} className="columna" style={{ gap: 'var(--e1)' }}>
                <div className="fila">
                  <span>
                    <strong>{unidad ? etiquetaUnidad(unidad) : ''}</strong> · {formatearDinero(a.deudaAcordada)} en {a.cuotas.length} cuotas de{' '}
                    {formatearDinero(a.cuotas[0].valor)}, desde el {formatearFecha(a.cuotas[0].fecha)}
                  </span>
                  <span className={a.estado === 'propuesto' ? 'chip chip--info' : avance.alDia ? 'chip chip--exito' : 'chip chip--alerta'}>
                    {a.estado === 'propuesto' ? 'Por aprobar' : avance.cumplido ? 'Cumplido' : avance.alDia ? 'Al día' : 'Atrasado'}
                  </span>
                </div>
                <span className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
                  {sel.nombreCompleto(sel.persona(bd, a.personaId))}
                  {a.nota ? ` · «${a.nota}»` : ''}
                  {a.estado === 'aprobado' ? ` · pagado ${formatearDinero(avance.pagado)} de ${formatearDinero(a.deudaAcordada)}` : ''}
                </span>
                {a.estado === 'propuesto' ? (
                  <>
                    <div className="grupo-botones">
                      <button
                        className="boton boton--primario boton--pequeno"
                        disabled={cargando}
                        onClick={() =>
                          void ejecutar(
                            (base) => decidirAcuerdoPago(base, { acuerdoId: a.id, personaId: sesion.personaId, aprobar: true }),
                            'Acuerdo aprobado. Le avisamos.',
                          )
                        }
                      >
                        Aprobar
                      </button>
                      <button className="boton boton--pequeno" onClick={() => setNoAprobando(a.id)}>
                        No aprobar
                      </button>
                    </div>
                    {noAprobando === a.id && (
                      <div className="fila">
                        <input aria-label="Por qué no se aprueba" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Podemos aprobarlo en 4 cuotas en vez de 6" style={{ flex: 1 }} />
                        <button
                          className="boton boton--pequeno"
                          disabled={cargando || motivo.trim().length < 10}
                          onClick={async () => {
                            const hecho = await ejecutar(
                              (base) => decidirAcuerdoPago(base, { acuerdoId: a.id, personaId: sesion.personaId, aprobar: false, motivo }),
                              'Le explicamos por qué no se aprobó.',
                            )
                            if (hecho) {
                              setNoAprobando(null)
                              setMotivo('')
                            }
                          }}
                        >
                          Confirmar
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    className="boton boton--pequeno"
                    style={{ alignSelf: 'flex-start' }}
                    disabled={cargando}
                    onClick={() => void ejecutar((base) => cancelarAcuerdoPago(base, { acuerdoId: a.id, personaId: sesion.personaId }), 'Acuerdo cancelado.')}
                  >
                    Cancelar el acuerdo
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
