/**
 * Reglas puras de BOB (docs/13-bob-copropiedades-y-contratos.md).
 *
 * Sin Strapi ni base de datos: se pueden probar solas. Las usa src/bob/middlewares.ts.
 */

/** Todo plan y todo servicio adicional dura 12 meses (docs/13 §2). */
export const DURACION_CONTRATO_MESES = 12;

/** El prorrateo cuenta meses de 30 dias (docs/13 §2). */
export const DIAS_MES_COMERCIAL = 30;

const PESOS_DV_NIT = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Digito de verificacion de un NIT, con el algoritmo de modulo 11 de la DIAN. */
export function digitoVerificacionNit(nit: string): number {
  const digitos = nit.replace(/\D/g, '');
  if (!digitos || digitos.length > PESOS_DV_NIT.length) {
    throw new Error(`NIT invalido: ${nit}`);
  }
  const suma = [...digitos]
    .reverse()
    .reduce((acumulado, digito, posicion) => acumulado + Number(digito) * PESOS_DV_NIT[posicion], 0);
  const resto = suma % 11;
  return resto > 1 ? 11 - resto : resto;
}

/**
 * Celular en formato internacional (E.164), que es como lo necesita Twilio para enviar el codigo
 * de ingreso a BLOKY. Un celular colombiano de 10 digitos recibe el +57. Devuelve null si no es
 * un celular valido.
 */
export function normalizarCelular(valor: string): string | null {
  const limpio = valor.replace(/[\s\-().]/g, '');
  if (/^3\d{9}$/.test(limpio)) return `+57${limpio}`;
  if (/^573\d{9}$/.test(limpio)) return `+${limpio}`;
  if (/^\+[1-9]\d{7,14}$/.test(limpio)) return limpio;
  return null;
}

export type Modalidad = 'por_unidad' | 'valor_fijo';

/** Lo que se cobra al mes: por unidad multiplica por las unidades del contrato; valor fijo no. */
export function valorMensualTotal(modalidad: Modalidad, valorMensual: number, unidades?: number | null): number {
  return modalidad === 'por_unidad' ? valorMensual * (unidades ?? 0) : valorMensual;
}

/**
 * Prorrateo del primer mes con meses de 30 dias: se cobran los dias que faltan desde el de inicio,
 * incluido. Empezar el 1 es el mes completo; un 31 cuenta como 30. Ejemplo: $300.000 desde el 21
 * son 10 dias y $100.000.
 *
 * Pendiente de confirmar (docs/13 §7): febrero, el 31 y si los servicios adicionales se prorratean
 * igual.
 */
export function prorrateoPrimerMes(fechaInicio: string, valorMensual: number): { dias: number; valor: number } {
  const dia = Number(fechaInicio.slice(8, 10));
  const dias = DIAS_MES_COMERCIAL - Math.min(dia, DIAS_MES_COMERCIAL) + 1;
  return { dias, valor: Math.round((valorMensual / DIAS_MES_COMERCIAL) * dias) };
}

/**
 * Ultimo dia de un contrato: el dia anterior al mismo dia, N meses despues.
 *
 * Pendiente de confirmar (docs/13 §7): si los 12 meses empiezan el dia del contrato o despues del
 * mes prorrateado. Hoy cuentan desde el dia del contrato.
 */
export function fechaFinContrato(fechaInicio: string, meses = DURACION_CONTRATO_MESES): string {
  const [anio, mes, dia] = fechaInicio.slice(0, 10).split('-').map(Number);
  const fin = new Date(Date.UTC(anio, mes - 1 + meses, dia));
  // Un 29 de febrero que no existe al ano siguiente pasa al 1 de marzo: se vuelve al 28.
  if (fin.getUTCDate() !== dia) fin.setUTCDate(0);
  fin.setUTCDate(fin.getUTCDate() - 1);
  return fin.toISOString().slice(0, 10);
}
