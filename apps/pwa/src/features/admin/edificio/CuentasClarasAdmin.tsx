/**
 * CU-A-32 — Publicar las cuentas claras del mes (PN-03).
 * Doc: docs/casos-de-uso/administrador.md#cu-a-32
 *
 * Hoy se escriben a mano; con backend saldrán de la contable de Jeimy (T-52).
 */

import { useState } from 'react'
import { useDatos } from '../../../estado/DatosContext'
import { useSesion } from '../../../estado/SesionContext'
import { publicarInformeMensual } from '../../../datos/repositorio'
import { informesVigentes, motivoInformeInvalido, periodoActual, totalGastos } from '../../../dominio/reglas'
import { formatearDinero, formatearPeriodo } from '../../../utilidades/formato'

const numero = (t: string) => (t.trim() ? Number(t.replace(/[^\d]/g, '')) : NaN)

export function CuentasClarasAdmin() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [periodo, setPeriodo] = useState(periodoActual())
  const [ingresos, setIngresos] = useState('')
  const [fondo, setFondo] = useState('')
  const [nota, setNota] = useState('')
  const [gastos, setGastos] = useState([{ rubro: '', valor: '' }])
  if (!sesion) return null
  const informes = informesVigentes(bd.informesMensuales ?? [], sesion.copropiedadId)
  const borrador = {
    ingresos: numero(ingresos),
    saldoFondo: numero(fondo),
    gastos: gastos.filter((g) => g.rubro || g.valor).map((g) => ({ rubro: g.rubro, valor: numero(g.valor) })),
  }
  const motivo = motivoInformeInvalido(borrador)
  const yaHay = informes.some((i) => i.periodo === periodo)

  return (
    <div className="rejilla-dos">
      <div className="tarjeta">
        <strong>Publicar el mes</strong>
        <p className="subtitulo">En palabras de propietario: cuánto entró, en qué se gastó y cuánto hay en el fondo. Sale un comunicado en la cartelera.</p>
        <div className="fila-campos" style={{ marginTop: 'var(--e3)' }}>
          <div className="campo">
            <label htmlFor="periodo-informe">Mes</label>
            <input id="periodo-informe" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="ingresos-informe">Entró (pesos)</label>
            <input id="ingresos-informe" inputMode="numeric" value={ingresos} onChange={(e) => setIngresos(e.target.value)} />
          </div>
        </div>
        <span className="titulo-seccion">Gastos</span>
        {gastos.map((g, i) => (
          <div key={i} className="fila-campos">
            <div className="campo">
              <label htmlFor={`rubro-${i}`}>Rubro</label>
              <input id={`rubro-${i}`} value={g.rubro} onChange={(e) => setGastos(gastos.map((x, j) => (j === i ? { ...x, rubro: e.target.value } : x)))} placeholder="Vigilancia" />
            </div>
            <div className="campo">
              <label htmlFor={`valor-${i}`}>Valor</label>
              <input id={`valor-${i}`} inputMode="numeric" value={g.valor} onChange={(e) => setGastos(gastos.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))} />
            </div>
          </div>
        ))}
        <button className="boton boton--pequeno" onClick={() => setGastos([...gastos, { rubro: '', valor: '' }])}>
          Agregar gasto
        </button>
        <div className="campo" style={{ marginTop: 'var(--e3)' }}>
          <label htmlFor="fondo-informe">Saldo del fondo de imprevistos</label>
          <input id="fondo-informe" inputMode="numeric" value={fondo} onChange={(e) => setFondo(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="nota-informe">Nota para los propietarios (opcional)</label>
          <textarea id="nota-informe" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
        {yaHay && <p className="acceso__nota">Ya hay cuentas de {formatearPeriodo(periodo)}: las nuevas las reemplazan y las anteriores quedan guardadas.</p>}
        {motivo && ingresos && <p className="acceso__nota">{motivo}</p>}
        <button
          className="boton boton--primario boton--bloque"
          disabled={cargando || !!motivo}
          onClick={async () => {
            const hecho = await ejecutar(
              (base) =>
                publicarInformeMensual(base, {
                  copropiedadId: sesion.copropiedadId,
                  personaId: sesion.personaId,
                  periodo,
                  ...borrador,
                  nota,
                }),
              'Cuentas publicadas. Los propietarios ya las ven en la app.',
            )
            if (hecho) {
              setIngresos('')
              setFondo('')
              setNota('')
              setGastos([{ rubro: '', valor: '' }])
            }
          }}
        >
          Publicar las cuentas
        </button>
      </div>
      <div className="tarjeta">
        <strong>Publicadas</strong>
        <div className="lista lista--compacta" style={{ marginTop: 'var(--e2)' }}>
          {informes.length === 0 && <p className="subtitulo">Todavía no hay.</p>}
          {informes.map((i) => (
            <div key={i.id} className="fila">
              <span>{formatearPeriodo(i.periodo)}</span>
              <span className="numerico subtitulo">
                Entró {formatearDinero(i.ingresos)} · gastos {formatearDinero(totalGastos(i))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
