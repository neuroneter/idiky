/**
 * Preferencias de la persona que usa el aparato, no de la copropiedad.
 *
 * Viven aqui —y no en `datos/repositorio.ts`— por la misma razon que
 * `estado/acceso.ts`: **no son datos del dominio**. El tamano de la letra no es
 * de la unidad ni del propietario, es de este telefono; no viaja al backend de
 * la fase 2 ni se le pregunta a un servidor. La regla de CLAUDE.md (todo dato
 * pasa por el repositorio) cuida los datos de la copropiedad, y esto no lo es.
 *
 * ## Por que existe
 *
 * «La contrasena debe ser algo muy sencillo porque tenemos adultos mayores»
 * (Mary, 2026-08-28) describe a un usuario que tambien tiene que **leer** la
 * pantalla. La letra base ya es de 16 px y la fuente es la del sistema, asi que
 * quien agrando la letra en los Ajustes de su telefono la ve agrandada aqui
 * tambien. Lo que faltaba es lo otro: **quien no sabe que su telefono puede
 * hacer eso**, o lo dejo como venia, no tiene como arreglarlo desde la app.
 *
 * Esto no reemplaza el ajuste del sistema: lo **multiplica**. Alguien que ya
 * puso la letra grande en su telefono y ademas escoge «Más grande» aqui, ve las
 * dos cosas sumadas, que es exactamente lo que pidio.
 */

const CLAVE_TAMANO = 'idiky.preferencias.tamano-texto'

/** Los tres tamanos, en orden. El identificador va sin tilde; la etiqueta no. */
export type TamanoTexto = 'normal' | 'grande' | 'mayor'

/**
 * Tres opciones, no un deslizador.
 *
 * Un control continuo obliga a decidir «cuanto» a alguien que solo sabe que no
 * alcanza a leer. Tres botones se resuelven mirandolos, que es el punto.
 *
 * **Los tres niveles son 100 %, 125 % y 150 %** (Mary, 2026-09-07): son los que
 * ya usan el zoom del navegador, la escala de pantalla de Windows y los ajustes
 * de accesibilidad del sistema. Quien alguna vez agrando la letra de su
 * computador reconoce estos numeros, y por eso el porcentaje se muestra en el
 * boton en vez de esconderse.
 *
 * El tope de 150 % tampoco es arbitrario: la WCAG (1.4.4) pide que el texto
 * llegue al 200 % sin que se pierda contenido, asi que este nivel esta dentro de
 * lo que la interfaz debe aguantar, no en el limite.
 */
export const TAMANOS: ReadonlyArray<{
  id: TamanoTexto
  etiqueta: string
  porcentaje: string
  escala: number
}> = [
  { id: 'normal', etiqueta: 'Normal', porcentaje: '100 %', escala: 1 },
  { id: 'grande', etiqueta: 'Grande', porcentaje: '125 %', escala: 1.25 },
  { id: 'mayor', etiqueta: 'Más grande', porcentaje: '150 %', escala: 1.5 },
]

function esTamano(valor: string | null): valor is TamanoTexto {
  return TAMANOS.some((tamano) => tamano.id === valor)
}

/** Lo que la persona escogio en este aparato. Sin nada guardado, «Normal». */
export function tamanoTexto(): TamanoTexto {
  try {
    const guardado = localStorage.getItem(CLAVE_TAMANO)
    return esTamano(guardado) ? guardado : 'normal'
  } catch {
    // Navegador con el almacenamiento bloqueado: se lee igual, solo no recuerda.
    return 'normal'
  }
}

/**
 * Escribe el tamano en el `<html>`, que es donde `tokens.css` lo espera.
 *
 * Va en el elemento raiz y no en un contexto de React a proposito: asi lo hereda
 * **todo** —la app del residente, las dos consolas y hasta la hoja del paz y
 * salvo— sin que ninguna pantalla tenga que enterarse.
 */
export function aplicarTamanoTexto(tamano: TamanoTexto): void {
  document.documentElement.dataset.texto = tamano
}

/** Guarda y aplica. Lo que llama el control de la puerta. */
export function guardarTamanoTexto(tamano: TamanoTexto): void {
  try {
    localStorage.setItem(CLAVE_TAMANO, tamano)
  } catch {
    // Si no se puede guardar, al menos vale para esta sesion.
  }
  aplicarTamanoTexto(tamano)
}
