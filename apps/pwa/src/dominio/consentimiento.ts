/**
 * La autorización de tratamiento de datos personales (RN-66).
 *
 * Colombia · **Ley 1581 de 2012** y su decreto reglamentario. Para poder guardar
 * la foto de una cédula hacen falta tres cosas, y las tres están aquí:
 *
 *  1. **Informada** — el titular tiene que saber *quién* responde por sus datos,
 *     *cuáles* se recogen, *para qué*, *cuánto* se guardan y *qué derechos* tiene.
 *  2. **Expresa** — una casilla que la persona marca. Nunca premarcada, nunca
 *     «al continuar aceptas»: eso no es autorización, es una trampa con letra
 *     pequeña.
 *  3. **Registrada** — queda constancia de qué versión se aceptó y cuándo. Sin
 *     eso, el día que alguien reclame no hay cómo probar que autorizó, que es
 *     justamente lo que la ley le exige probar a quien trata los datos.
 *
 * ## Por qué la versión importa
 *
 * Una política cambia: se agrega una finalidad, cambia el plazo de conservación.
 * Guardar solo «aceptó» deja sin saber **qué** aceptó. Con la versión, el día que
 * cambie el texto se sabe a quién hay que volver a preguntarle.
 *
 * ## Advertencia
 *
 * **Este texto es un borrador de trabajo, no un documento revisado por un
 * abogado.** Sirve para que el demo muestre el flujo completo y para que el
 * equipo discuta sobre algo concreto en vez de sobre una idea. Antes de
 * producción tiene que revisarlo alguien que sepa de derecho — sobre todo por un
 * punto: **la foto del rostro puede considerarse dato biométrico**, y los datos
 * sensibles tienen requisitos adicionales (el titular no está obligado a
 * autorizarlos, y hay que decírselo). Ver `docs/12-levantamiento-pendiente.md`
 * §3 sexies.
 */

/** Versión del texto. **Subirla cada vez que el texto cambie**, sin excepción. */
export const VERSION_POLITICA = '2026-09-07'

export interface Consentimiento {
  version: string
  aceptadoEn: string
}

/** Un punto de la política: el titular lo lee, no lo estudia. */
export interface PuntoPolitica {
  titulo: string
  texto: string
}

/**
 * El contenido, armado con el nombre de la copropiedad que responde.
 *
 * Se pasa la copropiedad porque **el responsable del tratamiento es ella**, no
 * Idiky: la app es el medio. Un texto genérico que no nombra a nadie no informa
 * a quién reclamarle.
 */
export function politicaDatos(copropiedad: string, nit?: string): PuntoPolitica[] {
  return [
    {
      titulo: '¿Quién responde por tus datos?',
      texto: `${copropiedad}${nit ? `, NIT ${nit}` : ''}, a través de su administración. Idiky es solo la herramienta con la que se guardan.`,
    },
    {
      titulo: '¿Qué datos recogemos?',
      texto:
        'Tu nombre, tu número de documento, tu celular y tu correo; y las dos fotos que subes: la de tu documento de identidad y una tuya.',
    },
    {
      titulo: '¿Para qué los usamos?',
      texto:
        'Para confirmar que eres quien dices ser antes de autorizarte a vivir en la unidad, y para que la portería pueda reconocerte en la entrada. Para nada más: no se usan con fines comerciales ni se comparten con terceros.',
    },
    {
      titulo: '¿Cuánto los guardamos?',
      texto:
        'El registro de tu vinculación se conserva como constancia de que existió. Tus fotos, en cambio, se guardan solo el tiempo que la normatividad permita, y después se eliminan. Si más adelante vuelves a vincularte y ya no las tenemos, te las pedimos otra vez.',
    },
    {
      titulo: '¿Qué puedes hacer con ellos?',
      texto:
        'Conocerlos, actualizarlos, corregirlos, pedir que se eliminen y revocar esta autorización cuando quieras. Se solicita a la administración de la copropiedad.',
    },
  ]
}

/** La frase que acompaña la casilla. Corta a propósito: es lo que se marca. */
export const FRASE_ACEPTACION =
  'Autorizo el tratamiento de mis datos personales y de las fotos que voy a subir, en los términos de arriba.'
