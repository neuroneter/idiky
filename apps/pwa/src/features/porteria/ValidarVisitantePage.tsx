/**
 * CU-P-02 — Validar el código de un visitante en la entrada.
 * Doc: docs/casos-de-uso/porteria.md#cu-p-02
 *
 * Cierra el hueco que la app tenía a la vista: el residente genera el código
 * (CU-R-10, que figuraba como terminado) y en la entrada **no había a quién
 * presentárselo**.
 *
 * **Lo que hace: decir si el código sirve ahora** (RN-16). **Lo que no hace:
 * registrar el ingreso.** Hora de entrada, salida y vehículo son la minuta del
 * turno, que el equipo todavía no ha definido — y un ingreso a medias registrado
 * es peor que ninguno.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { estadoRealVisitante, etiquetaUnidad, hoyISO } from '../../dominio/reglas'
import { formatearFecha, formatearFechaHora } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { ChipVisitante } from '../../componentes/Etiquetas'
import type { FormaIngreso, Visitante } from '../../dominio/tipos'
import { useSesion } from '../../estado/SesionContext'
import { registrarEntrada } from '../../datos/repositorio'

/**
 * El veredicto, en una palabra y con lo que hay que hacer.
 *
 * «Todavía no es válido» y «ya venció» son cosas distintas: la primera se
 * resuelve llamando al residente, la segunda pidiéndole un código nuevo. Decir
 * «código inválido» a las dos deja al portero sin saber qué sigue.
 */
const VEREDICTO: Record<Visitante['estado'], { pasa: boolean; titulo: string; razon: string }> = {
  activo: {
    pasa: true,
    titulo: 'Código válido',
    razon: 'Está dentro de su vigencia. Puedes autorizar el ingreso.',
  },
  programado: {
    pasa: false,
    titulo: 'Todavía no es válido',
    razon: 'La autorización empieza después. Confirma la fecha con el residente.',
  },
  vencido: {
    pasa: false,
    titulo: 'Código vencido',
    razon: 'La autorización ya terminó. El residente puede generar una nueva.',
  },
  revocado: {
    pasa: false,
    titulo: 'Autorización revocada',
    razon: 'El residente la anuló. No autorices el ingreso.',
  },
}

export function ValidarVisitantePage() {
  const { bd } = useDatos()
  const [codigo, setCodigo] = useState('')
  const [buscado, setBuscado] = useState<string | null>(null)

  const visitante = buscado ? sel.visitantePorCodigo(bd, buscado) : undefined
  const estado = visitante ? estadoRealVisitante(visitante, hoyISO()) : undefined
  const veredicto = estado ? VEREDICTO[estado] : undefined
  const unidad = visitante ? sel.unidad(bd, visitante.unidadId) : undefined
  const autorizo = visitante ? sel.persona(bd, visitante.personaId) : undefined

  return (
    <div className="pila">
      <form
        className="tarjeta"
        onSubmit={(evento) => {
          evento.preventDefault()
          setBuscado(codigo)
        }}
      >
        <div className="campo">
          <label htmlFor="codigo">Código del visitante</label>
          <input
            id="codigo"
            className="campo-numeros"
            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            placeholder="VIS-0000"
            autoComplete="off"
          />
          <span className="ayuda-campo">
            Escríbelo como lo trae en el teléfono. No importan mayúsculas ni espacios.
          </span>
        </div>
        <button className="boton boton--primario boton--bloque" type="submit">
          <Icono nombre="buscar" tamano={18} />
          Validar
        </button>
      </form>

      {buscado && !visitante && (
        <div className="tarjeta tarjeta--alerta">
          <div className="tarjeta__cuerpo" style={{ alignItems: 'flex-start' }}>
            <Icono nombre="alerta" tamano={22} />
            <div className="columna">
              <strong>Ese código no existe</strong>
              <span className="subtitulo">
                Revisa que esté completo. Si el visitante insiste, llama al residente antes de
                autorizar: la app no conoce esa autorización.
              </span>
            </div>
          </div>
        </div>
      )}

      {visitante && veredicto && (
        <div className={`tarjeta ${veredicto.pasa ? 'tarjeta--exito' : 'tarjeta--alerta'}`}>
          <div className="tarjeta__cuerpo" style={{ alignItems: 'flex-start' }}>
            <Icono nombre={veredicto.pasa ? 'check' : 'alerta'} tamano={22} />
            <div className="columna" style={{ flex: 1 }}>
              <div className="fila">
                <strong>{veredicto.titulo}</strong>
                {estado && <ChipVisitante estado={estado} />}
              </div>
              <span className="subtitulo">{veredicto.razon}</span>
            </div>
          </div>

          <div className="separador" />

          <div className="lista lista--compacta">
            <div className="fila">
              <span className="subtitulo">Visitante</span>
              <strong>{visitante.nombre}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Documento</span>
              <strong className="numerico">{visitante.documento}</strong>
            </div>
            {visitante.placa && (
              <div className="fila">
                <span className="subtitulo">Placa</span>
                <strong className="numerico">{visitante.placa}</strong>
              </div>
            )}
            <div className="fila">
              <span className="subtitulo">Va a</span>
              <strong>{unidad ? etiquetaUnidad(unidad) : 'Unidad no encontrada'}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Lo autorizó</span>
              <strong>{nombreCompleto(autorizo)}</strong>
            </div>
            <div className="fila">
              <span className="subtitulo">Vigencia</span>
              <strong>
                {formatearFecha(visitante.vigenciaDesde)} a{' '}
                {formatearFecha(visitante.vigenciaHasta)}
              </strong>
            </div>
          </div>

          {/* RN-235 — Con el código válido, se registra la entrada: queda en la minuta. */}
          {veredicto.pasa && <RegistrarEntrada visitante={visitante} />}
        </div>
      )}

      <div className="pila">
        <span className="titulo-seccion">Autorizados para hoy</span>
        <VigentesHoy />
      </div>
    </div>
  )
}

/** Lo autorizado para hoy, para no depender de que el visitante traiga el código. */
function VigentesHoy() {
  const { bd } = useDatos()
  const hoy = hoyISO()
  const vigentes = bd.visitantes.filter((v) => estadoRealVisitante(v, hoy) === 'activo')

  if (vigentes.length === 0) {
    return <p className="subtitulo">Hoy no hay visitantes autorizados.</p>
  }

  return (
    <div className="tarjeta" style={{ padding: 0 }}>
      <div className="contenedor-tabla">
        <table className="tabla">
          <thead>
            <tr>
              <th>Visitante</th>
              <th>Documento</th>
              <th>Unidad</th>
              <th>Código</th>
            </tr>
          </thead>
          <tbody>
            {vigentes.map((visitante) => {
              const unidad = sel.unidad(bd, visitante.unidadId)
              return (
                <tr key={visitante.id}>
                  <td>
                    <strong>{visitante.nombre}</strong>
                    {visitante.placa && <div className="subtitulo">{visitante.placa}</div>}
                  </td>
                  <td className="suave numerico">{visitante.documento}</td>
                  <td className="suave">{unidad ? etiquetaUnidad(unidad) : '—'}</td>
                  <td className="numerico">{visitante.codigo}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** RN-235 — Marcar «Entró»: a pie o en vehículo, con placa. Solo con el turno abierto. */
function RegistrarEntrada({ visitante }: { visitante: Visitante }) {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const [forma, setForma] = useState<FormaIngreso>(visitante.placa ? 'vehicular' : 'peatonal')
  const [placa, setPlaca] = useState(visitante.placa ?? '')
  if (!sesion) return null
  const turno = sel.turnoAbierto(bd, sesion.copropiedadId)
  const adentro = sel.visitantesAdentro(bd, sesion.copropiedadId).find((i) => i.visitanteId === visitante.id)

  return (
    <>
      <div className="separador" />
      {!turno ? (
        <p className="subtitulo">Abre tu turno en el inicio para registrar la entrada en la minuta.</p>
      ) : adentro ? (
        <p className="subtitulo">Ya está adentro desde {formatearFechaHora(adentro.entradaEn)}. Su salida se marca en el inicio.</p>
      ) : (
        <div className="columna" style={{ gap: 'var(--e2)' }}>
          <span className="segmentos" style={{ display: 'inline-flex' }}>
            {(
              [
                ['peatonal', 'A pie'],
                ['vehicular', 'En vehículo'],
              ] as const
            ).map(([f, texto]) => (
              <button key={f} type="button" className="segmento" aria-current={forma === f ? 'page' : undefined} onClick={() => setForma(f)}>
                {texto}
              </button>
            ))}
          </span>
          {forma === 'vehicular' && (
            <div className="campo" style={{ marginBottom: 0 }}>
              <label htmlFor="placa-ingreso">Placa</label>
              <input id="placa-ingreso" value={placa} onChange={(e) => setPlaca(e.target.value)} style={{ textTransform: 'uppercase' }} />
            </div>
          )}
          <button
            className="boton boton--primario boton--bloque"
            disabled={cargando}
            onClick={() =>
              void ejecutar(
                (b) =>
                  registrarEntrada(b, {
                    copropiedadId: sesion.copropiedadId,
                    personaId: sesion.personaId,
                    visitanteId: visitante.id,
                    forma,
                    placa,
                  }),
                `Entrada de ${visitante.nombre} registrada.`,
              )
            }
          >
            Entró
          </button>
        </div>
      )}
    </>
  )
}
