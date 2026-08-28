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

import { useState } from 'react'
import { useDatos } from '../../estado/DatosContext'
import { useSesion } from '../../estado/SesionContext'
import * as sel from '../../datos/selectores'
import { nombreCompleto } from '../../datos/selectores'
import { emitirPazYSalvo } from '../../datos/repositorio'
import { calcularSaldo, calcularSaldoVencido, etiquetaUnidad } from '../../dominio/reglas'
import { formatearDinero, formatearFecha } from '../../utilidades/formato'
import { Icono } from '../../componentes/Icono'
import { HojaPazYSalvo } from '../../componentes/HojaPazYSalvo'
import { Link } from 'react-router-dom'

export function PazYSalvoPage() {
  const { bd, ejecutar, cargando, mostrarAviso } = useDatos()
  const { sesion } = useSesion()
  const [viendoHoja, setViendoHoja] = useState(false)
  if (!sesion) return null

  const unidad = sel.unidad(bd, sesion.unidadActivaId)
  const copropiedad = sel.copropiedad(bd, sesion.copropiedadId)
  const persona = sel.persona(bd, sesion.personaId)
  const cuotas = sel.cuotasDeUnidad(bd, sesion.unidadActivaId)
  // RN-26 cuenta el saldo completo, no solo lo vencido: la cuota del mes ya
  // facturada entra aunque falten dias para su vencimiento (Mary, 2026-08-27).
  const saldo = calcularSaldo(cuotas)
  const vencido = calcularSaldoVencido(cuotas)
  const vigente = sel.ultimoPazYSalvo(bd, sesion.unidadActivaId)
  // Un paz y salvo se expide a nombre de los propietarios, que pueden ser varios.
  const propietarios = sel
    .residenciasDeUnidad(bd, sesion.unidadActivaId ?? '')
    .filter((residencia) => residencia.rol === 'propietario')
    .map((residencia) => sel.persona(bd, residencia.personaId))
    .filter((p): p is NonNullable<typeof p> => !!p)
  const administrador = bd.perfilesDemo.find((perfil) => perfil.rol === 'admin')
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
          /* Lleva a pagar, no al estado de cuenta: quien entro aqui queria su
             certificado, y lo unico que lo separa de el es el saldo. Mandarlo a
             mirar la deuda le deja el ultimo paso por adivinar. */
          <Link to="/app/cuenta/pagar" className="boton boton--primario boton--bloque">
            Pagar para poder emitirlo
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
                <strong>
                  {propietarios.length > 0
                    ? propietarios.map(nombreCompleto).join(' y ')
                    : nombreCompleto(persona)}
                </strong>
              </div>
              <div className="fila">
                <span className="subtitulo">Expedido</span>
                <strong>{formatearFecha(vigente.emitidoEn)}</strong>
              </div>
              {/* Lo que el documento afirma no es cuanto vale el papel, sino hasta
                  que dia la unidad esta al dia (modelo de Mary, 2026-08-28). */}
              <div className="fila">
                <span className="subtitulo">A paz y salvo hasta</span>
                <strong>{formatearFecha(vigente.cubiertoHasta)}</strong>
              </div>
            </div>
            <div className="separador" />
            <p className="subtitulo">
              {copropiedad?.nombre} certifica que la unidad está a paz y salvo por concepto de
              cuotas de administración.
            </p>
            {/* El numero es consecutivo y adivinable; el codigo no. Hacen falta los
                dos para confirmar el documento con la administracion (ADR-0006). */}
            <div className="fila" style={{ marginTop: 'var(--e3)' }}>
              <span className="subtitulo">Código de verificación</span>
              <strong className="numerico">{vigente.codigoVerificacion}</strong>
            </div>
            <div className="separador" />
            {/* Ver primero, imprimir despues. Nadie manda a imprimir un documento
                que no ha visto, y en el demo publicado el marco del navegador
                bloquea el dialogo de impresion: sin la previa no habria forma de
                mostrar el certificado. */}
            <button
              className="boton boton--bloque"
              onClick={() => setViendoHoja((visible) => !visible)}
            >
              <Icono nombre={viendoHoja ? 'cerrar' : 'buscar'} tamano={18} />
              {viendoHoja ? 'Ocultar el paz y salvo' : 'Ver paz y salvo'}
            </button>
            {/* Imprimir es como se obtiene el PDF: el sistema operativo ofrece
                «Guardar como PDF», sin servidor, sin conexion y sin librerias
                (ADR-0006, revision del 2026-08-28). */}
            <button
              className="boton boton--primario boton--bloque"
              style={{ marginTop: 'var(--e2)' }}
              onClick={() => window.print()}
            >
              <Icono nombre="certificado" tamano={18} />
              Imprimir o guardar en PDF
            </button>
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
                  {/* Sin chip de «vencido»: el certificado no caduca solo. Dice
                      hasta cuando la unidad estaba al dia, y eso sigue siendo
                      cierto manana. */}
                  <span className="subtitulo">
                    Hasta {formatearFecha(documento.cubiertoHasta)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="tenue" style={{ fontSize: 'var(--texto-xs)' }}>
        Al imprimir, tu teléfono ofrece «Guardar como PDF»: el certificado queda como archivo
        para adjuntarlo a tu trámite. Con el número y el código, quien lo reciba puede
        confirmarlo con la administración.
      </p>
      {/* Fuera de la vista previa no se ve en pantalla: es la hoja que sale al
          imprimir. Va siempre en el arbol, este o no abierta la previa. */}
      {vigente && (
        <div className={viendoHoja ? 'previsualizacion-hoja' : undefined}>
            <HojaPazYSalvo
            documento={vigente}
            copropiedad={copropiedad}
            unidad={unidad}
            propietarios={propietarios}
            administrador={sel.persona(bd, administrador?.personaId)}
          />
        </div>
      )}
    </>
  )
}
