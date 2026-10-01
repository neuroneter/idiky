/**
 * CU-R-18 — Descargar el informe de estado de cuenta.
 * Doc: docs/casos-de-uso/residente.md#cu-r-18
 *
 * Se escoge el rango —por defecto el año en curso—, se ve el resumen antes de
 * emitir (RN-127), y el documento se emite con consecutivo y código (RN-36) y se
 * imprime o se guarda en PDF desde el teléfono, sin servidor (ADR-0006). Los
 * emitidos antes se pueden volver a imprimir: dicen lo que dijeron.
 */

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { emitirEstadoCuenta } from '../../datos/repositorio'
import { estadoDeCuenta, hoyISO, motivoEstadoCuentaInvalido } from '../../dominio/reglas'
import type { Documento } from '../../dominio/tipos'
import { formatearDinero, formatearFecha, formatearPeriodo } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { BotonVolver } from '../../componentes/BotonVolver'
import { HojaEstadoCuenta } from '../../componentes/HojaEstadoCuenta'

export function EstadoCuentaPage() {
  const { bd, ejecutar, cargando } = useDatos()
  const { sesion } = useSesion()
  const hoy = hoyISO()
  // Por defecto, el año en curso hasta el último mes facturado: si ya se facturó
  // una cuota del mes siguiente, el valor adeudado la incluye (RN-26), y el
  // estado de cuenta debe decir lo mismo.
  const periodosFacturados = sel.cuotasDeUnidad(bd, sesion?.unidadActivaId).map((c) => c.periodo).sort()
  const ultimoFacturado = periodosFacturados[periodosFacturados.length - 1] ?? hoy.slice(0, 7)
  const [desde, setDesde] = useState(`${hoy.slice(0, 4)}-01`)
  const [hasta, setHasta] = useState(ultimoFacturado > hoy.slice(0, 7) ? ultimoFacturado : hoy.slice(0, 7))
  /** El documento que se está mirando para imprimir. */
  const [abierto, setAbierto] = useState<Documento | null>(null)
  if (!sesion) return null

  const unidadId = sesion.unidadActivaId
  const unidad = sel.unidad(bd, unidadId)
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const vista = estadoDeCuenta(sel.cuotasDeUnidad(bd, unidadId), sel.pagosDeUnidad(bd, unidadId), desde, hasta)
  const invalido = motivoEstadoCuentaInvalido(desde, hasta, vista)
  const emitidos = sel.documentosDeUnidad(bd, unidadId).filter((d) => d.tipo === 'estado_cuenta')
  const propietarios = sel
    .residenciasDeUnidad(bd, unidadId ?? '')
    .filter((r) => r.rol === 'propietario')
    .map((r) => sel.persona(bd, r.personaId))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const administrador = sel.persona(bd, bd.perfilesDemo.find((perfil) => perfil.rol === 'admin')?.personaId)

  async function emitir() {
    if (!unidad) return
    const documento = await ejecutar(
      (base) =>
        emitirEstadoCuenta(base, {
          copropiedadId: sesion!.copropiedadId,
          unidadId: unidad.id,
          desde,
          hasta,
          solicitadoPor: nombreCompleto(sel.persona(bd, sesion!.personaId)),
        }),
      'Estado de cuenta emitido.',
    )
    if (documento) setAbierto(documento)
  }

  return (
    <>
      <div className="encabezado-pagina">
        <BotonVolver a="/app/cuenta" texto="Estado de cuenta" />
      </div>

      <div className="tarjeta">
        <span className="titulo-seccion">Descargar estado de cuenta</span>
        <p className="subtitulo" style={{ margin: 'var(--e2) 0 var(--e3)' }}>
          Un soporte de tus cobros y pagos para un trámite o tu contabilidad.
        </p>
        <div className="fila-campos">
          <div className="campo">
            <label htmlFor="estado-desde">Desde</label>
            <input id="estado-desde" type="month" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="estado-hasta">Hasta</label>
            <input id="estado-hasta" type="month" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>

        {/* RN-127 — Lo que va a decir, antes de emitirlo. */}
        {invalido ? (
          <p className="ayuda-campo" style={{ color: 'var(--color-error)' }}>{invalido}</p>
        ) : (
          <ul className="especificaciones" style={{ marginBottom: 'var(--e3)' }}>
            <li>Saldo anterior: {formatearDinero(vista.saldoInicial)}</li>
            <li>
              Cobros: {formatearDinero(vista.totalCargos)} · pagos aplicados: {formatearDinero(vista.totalAbonos)}
            </li>
            <li>
              <strong>
                {vista.saldoFinal < 0
                  ? `Saldo a favor: ${formatearDinero(-vista.saldoFinal)}`
                  : `Valor adeudado al cierre: ${formatearDinero(vista.saldoFinal)}`}
              </strong>
            </li>
            <li className="tenue">{vista.movimientos.length} movimientos. No incluye abonos que la administración no ha aplicado.</li>
          </ul>
        )}
        <button className="boton boton--primario boton--bloque" disabled={cargando || !!invalido} onClick={() => void emitir()}>
          <Icono nombre="certificado" tamano={18} />
          Emitir estado de cuenta
        </button>
      </div>

      <div className="pila">
        <span className="titulo-seccion">Emitidos antes</span>
        {emitidos.length === 0 ? (
          <p className="subtitulo">Todavía no has emitido ningún estado de cuenta.</p>
        ) : (
          <div className="lista lista--compacta">
            {emitidos.map((documento) => (
              <div key={documento.id} className="tarjeta tarjeta--plana">
                <div className="fila">
                  <div className="columna">
                    <strong className="numerico">{documento.numero}</strong>
                    <span className="subtitulo">
                      {documento.estadoCuenta
                        ? `${formatearPeriodo(documento.estadoCuenta.desde)} a ${formatearPeriodo(documento.estadoCuenta.hasta)}`
                        : ''}{' '}
                      · expedido el {formatearFecha(documento.emitidoEn)}
                    </span>
                  </div>
                  <button
                    className="boton boton--pequeno"
                    onClick={() => setAbierto(abierto?.id === documento.id ? null : documento)}
                  >
                    {abierto?.id === documento.id ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {abierto && (
        <div className="tarjeta">
          <div className="fila" style={{ marginBottom: 'var(--e2)' }}>
            <div className="columna">
              <strong className="numerico">{abierto.numero}</strong>
              <span className="subtitulo">Código de verificación {abierto.codigoVerificacion}</span>
            </div>
          </div>
          {/* Imprimir es como se obtiene el PDF: el sistema ofrece «Guardar como PDF» (ADR-0006). */}
          <button className="boton boton--primario boton--bloque" onClick={() => window.print()}>
            <Icono nombre="certificado" tamano={18} />
            Imprimir o guardar en PDF
          </button>
        </div>
      )}

      <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        Al imprimir, tu teléfono ofrece «Guardar como PDF». Con el número y el código, quien lo
        reciba puede confirmarlo con la administración.
      </p>

      {/* La hoja: se ve en la vista previa y es lo único que sale al imprimir. */}
      {abierto && (
        <div className="previsualizacion-hoja">
          <HojaEstadoCuenta
            documento={abierto}
            copropiedad={copropiedad}
            unidad={unidad}
            propietarios={propietarios}
            administrador={administrador}
          />
        </div>
      )}
    </>
  )
}
