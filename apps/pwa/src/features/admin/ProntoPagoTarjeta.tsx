/**
 * CU-A-31 — Configurar el descuento por pronto pago (PN-01).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-31
 *
 * Lo aprueba la asamblea: aquí se registra el porcentaje y hasta qué día del
 * mes aplica. Solo sobre la cuota ordinaria pagada completa y a tiempo.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { configurarProntoPago } from '../../datos/repositorio'
import { motivoProntoPagoInvalido } from '../../dominio/reglas'

export function ProntoPagoTarjeta() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const config = sesion ? sel.copropiedad(bd, sesion.copropiedadId)?.prontoPago : undefined
  const [porcentaje, setPorcentaje] = useState(String(config?.porcentaje ?? 5))
  const [dia, setDia] = useState(String(config?.diaLimite ?? 5))
  if (!sesion) return null
  const activo = !!config?.activo
  const numero = Number(porcentaje.replace(',', '.'))
  const motivo = motivoProntoPagoInvalido(numero, Number(dia))
  const concedidos = bd.pagos
    .filter((p) => p.estado === 'aplicado')
    .flatMap((p) => p.imputaciones)
    .reduce((suma, l) => suma + (l.descuento ?? 0), 0)

  function guardar(nuevoActivo: boolean) {
    void ejecutar(
      (base) =>
        configurarProntoPago(base, {
          copropiedadId: sesion!.copropiedadId,
          personaId: sesion!.personaId,
          activo: nuevoActivo,
          porcentaje: numero,
          diaLimite: Number(dia),
        }),
      nuevoActivo ? 'Descuento por pronto pago guardado.' : 'Descuento por pronto pago apagado.',
    )
  }

  return (
    <div className="tarjeta">
      <div className="fila">
        <strong>Descuento por pronto pago</strong>
        <span className={activo ? 'chip chip--exito' : 'chip'}>{activo ? 'Activo' : 'Apagado'}</span>
      </div>
      <p className="subtitulo">
        Lo aprueba la asamblea. Aplica a la cuota ordinaria pagada completa hasta el día límite de su mes, y
        anima a pagar sin regañar a nadie.
      </p>
      <div className="fila-campos" style={{ marginTop: 'var(--e2)' }}>
        <div className="campo">
          <label htmlFor="porcentaje-pronto">Descuento (%)</label>
          <input id="porcentaje-pronto" inputMode="decimal" value={porcentaje} onChange={(e) => setPorcentaje(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="dia-pronto">Hasta el día</label>
          <input id="dia-pronto" type="number" min={1} max={28} value={dia} onChange={(e) => setDia(e.target.value)} />
        </div>
      </div>
      {motivo && <p className="acceso__nota">{motivo}</p>}
      <div className="grupo-botones">
        <button className="boton boton--primario" disabled={cargando || !!motivo} onClick={() => guardar(true)}>
          {activo ? 'Guardar cambios' : 'Activar'}
        </button>
        {activo && (
          <button className="boton" disabled={cargando} onClick={() => guardar(false)}>
            Apagar
          </button>
        )}
      </div>
      {concedidos > 0 && (
        <p className="tenue" style={{ fontSize: 'var(--texto-xs)', marginTop: 'var(--e2)' }}>
          Descuentos concedidos hasta hoy: ${concedidos.toLocaleString('es-CO')}. La contable los registra como
          descuento, no como ingreso (T-51).
        </p>
      )}
    </div>
  )
}
