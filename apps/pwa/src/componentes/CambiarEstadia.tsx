/**
 * Cambiar la condición o la fecha de salida de alguien ya vinculado — RN-68,
 * CU-R-27 A7 (Mary, 2026-10-02).
 *
 * «Cambiar» no repite el trámite: no pide fotos otra vez, pero deja rastro de
 * quién cambió qué (`Residencia.cambios`). Si un arrendatario deja a su
 * visitante más de 7 días, el cambio espera al propietario (RN-60).
 */

import { useState } from 'react'
import type { CondicionRegistro, Residencia } from '../dominio/tipos'
import {
  DIAS_SIN_APROBACION_DEL_PROPIETARIO,
  categoriaDeResidencia,
  condicionDeResidencia,
  condicionesParaCambiar,
  hoyISO,
  requiereAprobacionPropietario,
  sumarDias,
} from '../dominio/reglas'
import { textoCondicion } from './Registro'
import { Modal } from './Modal'

export function CambiarEstadia({
  residencia,
  nombre,
  registraArrendatario = false,
  aprobacionActiva = true,
  alGuardar,
  alCerrar,
}: {
  residencia: Residencia
  nombre: string
  /** Quien cambia es arrendatario: más de 7 días espera al propietario. */
  registraArrendatario?: boolean
  /** RN-210 — Si el edificio pide la aprobación del propietario. */
  aprobacionActiva?: boolean
  alGuardar: (condicion: CondicionRegistro, hasta?: string) => Promise<void>
  alCerrar: () => void
}) {
  const categoria = categoriaDeResidencia(residencia)
  const posibles = condicionesParaCambiar(residencia)
  const [condicion, setCondicion] = useState<CondicionRegistro>(condicionDeResidencia(residencia))
  const [hasta, setHasta] = useState(residencia.hasta ?? sumarDias(hoyISO(), 30))
  const temporal = condicion === 'temporal'
  const esperaAlPropietario = requiereAprobacionPropietario(
    registraArrendatario ? 'arrendatario' : undefined,
    { categoria, condicion, vigenciaDesde: residencia.desde, vigenciaHasta: temporal ? hasta : undefined },
    aprobacionActiva,
  )

  return (
    <Modal titulo={`Cambiar a ${nombre}`} descripcion="Sin repetir el registro: queda anotado quién lo cambió." onCerrar={alCerrar}>
      {posibles.length > 1 && (
        <div className="campo">
          <label>¿Cómo se queda?</label>
          <div className="segmentos">
            {posibles.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="segmento"
                aria-current={condicion === opcion ? 'page' : undefined}
                onClick={() => setCondicion(opcion)}
              >
                {textoCondicion(categoria, opcion)}
              </button>
            ))}
          </div>
        </div>
      )}
      {temporal && (
        <div className="campo">
          <label htmlFor="cambio-hasta">Fecha de salida</label>
          <input id="cambio-hasta" type="date" min={hoyISO()} value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      )}
      {esperaAlPropietario && (
        <p className="ayuda-campo" style={{ color: 'var(--color-alerta)' }}>
          Son más de {DIAS_SIN_APROBACION_DEL_PROPIETARIO} días: el cambio queda esperando que el propietario lo apruebe
          (RN-60). Le llega un aviso.
        </p>
      )}
      <button
        className="boton boton--primario boton--bloque"
        disabled={temporal && !hasta}
        onClick={() => void alGuardar(condicion, temporal ? hasta : undefined)}
      >
        {esperaAlPropietario ? 'Pedir la aprobación' : 'Guardar el cambio'}
      </button>
    </Modal>
  )
}
