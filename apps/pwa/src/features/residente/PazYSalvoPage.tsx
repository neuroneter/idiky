/**
 * CU-R-12 — Obtener el paz y salvo de mi unidad.
 * Doc: docs/casos-de-uso/residente.md#cu-r-12
 *
 * Lo que si esta decidido se implementa: **cuando se puede emitir** (RN-26, saldo
 * cero) y el **consecutivo unico** del certificado (RN-36). Lo que falta es el
 * PDF —generarlo es ADR-0006, todavia sin escribir—, asi que el certificado se
 * emite, queda guardado y se muestra en pantalla; lo unico en deuda es la
 * descarga, y la pantalla lo dice en vez de simularla.
 */

import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { emitirPazYSalvo } from '../../datos/repositorio'
import { calcularSaldo, calcularSaldoVencido, etiquetaUnidad, hoyISO } from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { Link } from 'react-router-dom'

export function PazYSalvoPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  if (!sesion) return null

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const persona = sel.persona(bd, sesion.personaId)
  const cuotas = sel.cuotasDeUnidad(bd, sesion.unidadActivaId)
  // RN-26 cuenta el saldo completo, no solo lo vencido: la cuota del mes ya
  // facturada entra aunque falten dias para su vencimiento (Mary, 2026-08-27).
  const saldo = calcularSaldo(cuotas)
  const vencido = calcularSaldoVencido(cuotas)
  const vigente = sel.pazYSalvoVigente(bd, sesion.unidadActivaId)
  const alDia = saldo === 0

  async function emitir() {
    if (!unidad) return
    await ejecutar(
      (base) => emitirPazYSalvo(base, { copropiedadId: sesion!.copropiedadId, unidadId: unidad.id }),
      'Paz y salvo emitido.',
    )
  }

  return (
    /* Fragmento y no un `.pila` envolvente: la nota final tiene que ser hija
       directa del contenido para que se pinte en blanco sobre el degradado. Dentro
       de un contenedor sale gris oscuro y se pierde contra el fondo. */
    <>
      {/* El estado de la unidad va primero: es la condicion de todo lo demas
          (RN-26) y evita que alguien pulse un boton que no le va a funcionar. */}
      <div className={`tarjeta ${alDia ? 'tarjeta--exito' : 'tarjeta--alerta'}`}>
        {/* El icono arriba y no centrado: con tres lineas de texto, un icono a
            media altura se lee como si senalara la linea del medio. */}
        <div className="tarjeta__cuerpo" style={{ alignItems: 'flex-start' }}>
          <Icono nombre={alDia ? 'check' : 'alerta'} tamano={22} />
          <div className="columna">
            <strong>{alDia ? 'Tu unidad está al día' : 'Tu unidad tiene saldo pendiente'}</strong>
            <span className="subtitulo">
              {alDia
                ? 'Puedes emitir el certificado de paz y salvo cuando lo necesites.'
                : `El paz y salvo certifica que no debes nada, así que solo se emite con saldo en cero. Hoy debes ${formatearDinero(saldo)}.`}
            </span>
            {/* Sin mora pero con saldo es el caso que desconcierta: la persona no
                se ha atrasado y aun asi no puede emitir. Se explica en vez de
                dejarla adivinando (RN-26). */}
            {!alDia && vencido === 0 && (
              <span className="subtitulo">
                No estás en mora: es la cuota del periodo, que ya está facturada aunque todavía
                no venza. El certificado dice que no debes nada, y esa también cuenta.
              </span>
            )}
          </div>
        </div>
        <div className="separador" />
        {/* La accion va DENTRO de la tarjeta blanca, no suelta sobre el degradado:
            el violeta del boton sale del propio degradado y a media pantalla se
            disuelve en el fondo (docs/08-convenciones.md). */}
        {alDia ? (
          <button
            className="boton boton--primario boton--bloque"
            disabled={cargando}
            onClick={() => {
              if (vigente) {
                mostrarAviso('Ya tienes un paz y salvo vigente. Se emitirá uno nuevo.', 'info')
              }
              void emitir()
            }}
          >
            <Icono nombre="certificado" tamano={18} />
            {vigente ? 'Emitir uno nuevo' : 'Emitir mi paz y salvo'}
          </button>
        ) : (
          <Link to="/app/cuenta" className="boton boton--primario boton--bloque">
            Ver mi estado de cuenta
          </Link>
        )}
      </div>

      {vigente && (
        <div className="pila">
          <span className="titulo-seccion">Tu certificado vigente</span>
          {/* Blanco, no el degradado de la marca: un certificado se lee como
              papel, y una tarjeta con el mismo degradado del fondo se disuelve
              justo en la mitad de la pantalla, que es donde cae esta. */}
          <div className="tarjeta">
            <span className="subtitulo">Paz y salvo</span>
            <div className="dato-grande numerico" style={{ margin: 'var(--e1) 0 var(--e2)' }}>
              {vigente.numero}
            </div>
            <div className="lista lista--compacta">
              <div className="fila">
                <span className="subtitulo">Unidad</span>
                <strong>{unidad ? etiquetaUnidad(unidad) : '—'}</strong>
              </div>
              <div className="fila">
                <span className="subtitulo">A nombre de</span>
                <strong>{nombreCompleto(persona)}</strong>
              </div>
              <div className="fila">
                <span className="subtitulo">Expedido</span>
                <strong>{formatearFecha(vigente.emitidoEn)}</strong>
              </div>
              <div className="fila">
                <span className="subtitulo">Vigente hasta</span>
                <strong>{formatearFecha(vigente.vigenteHasta)}</strong>
              </div>
            </div>
            <div className="separador" />
            <p className="subtitulo">
              {copropiedad?.nombre} certifica que la unidad no registra obligaciones pendientes a
              la fecha de expedición.
            </p>
            {/* El numero es consecutivo y adivinable; el codigo no. Hacen falta los
                dos para verificar el documento desde fuera de la app (ADR-0006). */}
            <div className="fila" style={{ marginTop: 'var(--e3)' }}>
              <span className="subtitulo">Código de verificación</span>
              <strong className="numerico">{vigente.codigoVerificacion}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="pila">
        <span className="titulo-seccion">Emitidos antes</span>
        {sel.documentosDeUnidad(bd, sesion.unidadActivaId).length === 0 ? (
          <p className="subtitulo">Todavía no has emitido ningún certificado.</p>
        ) : (
          <div className="lista">
            {sel.documentosDeUnidad(bd, sesion.unidadActivaId).map((documento) => (
              <div key={documento.id} className="tarjeta tarjeta--plana">
                <div className="fila">
                  <div className="columna">
                    <strong className="numerico">{documento.numero}</strong>
                    <span className="subtitulo">
                      Expedido el {formatearFecha(documento.emitidoEn)}
                    </span>
                  </div>
                  {/* `hoyISO()` y no `new Date()`: comparar contra una fecha UTC
                      adelantaba un dia el vencimiento en Colombia. */}
                  <span className={documento.vigenteHasta >= hoyISO() ? 'chip chip--exito' : 'chip'}>
                    {documento.vigenteHasta >= hoyISO() ? 'Vigente' : 'Vencido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Se dice que falta, no se simula un botón que no descarga nada. */}
      <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        La descarga en PDF llega con el servidor: el certificado lo genera y lo firma la
        copropiedad, no el teléfono de quien lo pide (ADR-0006). Con el número y el código,
        quien lo reciba —una notaría, un banco— podrá comprobarlo sin instalar la app.
      </p>
    </>
  )
}
