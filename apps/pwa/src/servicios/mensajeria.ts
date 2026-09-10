/**
 * Mensajes de texto, detrás de una interfaz propia.
 *
 * Mismo patrón que `plataforma.ts`: las pantallas y el repositorio piden
 * «mándale esto a este celular» y no saben —ni tienen que saber— quién lo manda.
 * En la fase 2 esto llama a un proveedor de SMS o de WhatsApp (T-18, sin
 * decidir); hoy **redacta el mensaje de verdad y lo deja escrito, pero no lo
 * envía**.
 *
 * ## Por qué el texto se redacta aquí y no en la pantalla
 *
 * Un SMS no tiene dónde volver a preguntar. Quien lo recibe está en la calle,
 * con 160 caracteres y sin contexto, así que el mensaje tiene que traer **las
 * tres cosas que le permiten actuar**: de qué copropiedad le hablan, qué pasó, y
 * qué hace ahora. Si eso se escribe suelto en cada pantalla, en dos meses hay
 * cuatro versiones y una de ellas se olvida de decir el código.
 *
 * ## Lo que el demo no hace, y lo dice
 *
 * No se manda nada. No se simula un «enviado ✓» que no ocurrió: la app muestra
 * el texto exacto que saldría, que es lo que permite revisarlo antes de que
 * exista el proveedor. Es la misma honestidad del código de un solo uso
 * (ADR-0004) y de la huella (`plataforma.ts`).
 */

import type { Mensaje, MotivoMensaje, RegistroPersona, Visitante } from '../dominio/tipos'
import { formatearFecha } from '../utilidades/formato'

/** Lo que hace falta para redactar; lo arma quien tiene los datos a la mano. */
export interface DatosMensaje {
  registro: RegistroPersona
  copropiedad: string
  unidad: string
  /** Solo cuando la autorización creó un visitante: su código de entrada. */
  visitante?: Visitante
}

/**
 * El aviso de que el registro quedó autorizado.
 *
 * Cambia según la categoría porque **lo que la persona tiene que hacer después
 * es distinto**: el visitante necesita su código para la portería, y el
 * residente necesita saber que ya puede activar su cuenta (CU-R-25). Mandarle a
 * los dos «tu registro fue aprobado» y nada más es dejarlos igual de perdidos.
 */
export function textoAutorizacion({
  registro,
  copropiedad,
  unidad,
  visitante,
}: DatosMensaje): string {
  const saludo = `Hola ${registro.nombres},`

  if (visitante) {
    return (
      `${saludo} ya estás autorizado para entrar a ${copropiedad} (${unidad}) ` +
      `el ${formatearFecha(visitante.vigenciaDesde)}. ` +
      `Preséntale este código en portería: ${visitante.codigo}. ` +
      `Lleva tu documento.`
    )
  }

  return (
    `${saludo} tu registro en ${copropiedad} (${unidad}) quedó autorizado. ` +
    `Ya puedes activar tu cuenta en la app de Idiky con tu documento.`
  )
}

/** El aviso de que no quedó, con el motivo: sin él la persona no sabe qué corregir. */
export function textoRechazo({ registro, copropiedad }: DatosMensaje): string {
  const motivo = registro.motivo ? ` Motivo: ${registro.motivo}` : ''
  return (
    `Hola ${registro.nombres}, tu registro en ${copropiedad} no fue autorizado.${motivo} ` +
    `Habla con quien te registró.`
  )
}

/**
 * Deja el mensaje listo para enviar.
 *
 * Devuelve `null` cuando **no hay a dónde mandarlo**: sin celular no hay mensaje,
 * y guardar uno con destino vacío sería registrar un envío que nunca pudo pasar.
 * Quien llama decide qué hacer con eso; la pantalla lo dice.
 */
export function redactar(parametros: {
  copropiedadId: string
  destino: string
  texto: string
  motivo: MotivoMensaje
  registroId: string
  id: string
  ahora: string
}): Mensaje | null {
  const destino = parametros.destino.trim()
  if (!destino) return null
  return {
    id: parametros.id,
    copropiedadId: parametros.copropiedadId,
    destino,
    texto: parametros.texto,
    motivo: parametros.motivo,
    registroId: parametros.registroId,
    enviadoEn: parametros.ahora,
  }
}
