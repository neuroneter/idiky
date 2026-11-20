/**
 * Un generador de códigos QR **real y escaneable**, sin dependencias (ADR-0005,
 * actualizado el 2026-11-20). Modo byte (UTF-8), corrección de errores nivel M,
 * versiones 1 a 5: hasta 84 bytes, de sobra para el código de un visitante.
 *
 * Sigue la norma ISO/IEC 18004: patrones de posición, sincronía y alineación,
 * Reed-Solomon sobre GF(256), intercalado de bloques, las ocho máscaras con su
 * penalización y la información de formato. Devuelve la matriz: `true` es un
 * módulo oscuro.
 */

const BLOQUES_M = [0, 1, 1, 1, 2, 2]
const CORRECCION_M = [0, 10, 16, 26, 18, 24]

function multiplicar(x: number, y: number): number {
  let z = 0
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

function divisorReedSolomon(grado: number): number[] {
  const resultado = new Array<number>(grado).fill(0)
  resultado[grado - 1] = 1
  let raiz = 1
  for (let i = 0; i < grado; i += 1) {
    for (let j = 0; j < resultado.length; j += 1) {
      resultado[j] = multiplicar(resultado[j], raiz)
      if (j + 1 < resultado.length) resultado[j] ^= resultado[j + 1]
    }
    raiz = multiplicar(raiz, 0x02)
  }
  return resultado
}

function restoReedSolomon(datos: number[], divisor: number[]): number[] {
  const resultado = divisor.map(() => 0)
  for (const b of datos) {
    const factor = b ^ (resultado.shift() as number)
    resultado.push(0)
    divisor.forEach((coef, i) => {
      resultado[i] ^= multiplicar(coef, factor)
    })
  }
  return resultado
}

/** Módulos de datos (sin los de función) de una versión. */
function modulosDeDatos(version: number): number {
  let resultado = (16 * version + 128) * version + 64
  if (version >= 2) {
    const alineaciones = Math.floor(version / 7) + 2
    resultado -= (25 * alineaciones - 10) * alineaciones - 55
  }
  return resultado
}

function capacidadEnBytes(version: number): number {
  return Math.floor(modulosDeDatos(version) / 8) - CORRECCION_M[version] * BLOQUES_M[version]
}

function utf8(texto: string): number[] {
  return Array.from(new TextEncoder().encode(texto))
}

export function generarQr(texto: string): boolean[][] {
  const bytes = utf8(texto)
  let version = 1
  while (version <= 5 && capacidadEnBytes(version) < bytes.length + 2) version += 1
  if (version > 5) throw new Error('El texto es demasiado largo para el QR.')

  // 1. Los bits: modo byte, longitud, datos, terminador y relleno.
  const bits: number[] = []
  const agregar = (valor: number, largo: number) => {
    for (let i = largo - 1; i >= 0; i -= 1) bits.push((valor >>> i) & 1)
  }
  agregar(0b0100, 4)
  agregar(bytes.length, 8)
  bytes.forEach((b) => agregar(b, 8))
  const capacidad = capacidadEnBytes(version) * 8
  agregar(0, Math.min(4, capacidad - bits.length))
  agregar(0, (8 - (bits.length % 8)) % 8)
  for (let relleno = 0xec; bits.length < capacidad; relleno ^= 0xec ^ 0x11) agregar(relleno, 8)
  const datos: number[] = []
  for (let i = 0; i < bits.length; i += 8) datos.push(parseInt(bits.slice(i, i + 8).join(''), 2))

  // 2. Corrección de errores e intercalado de bloques.
  const bloques = BLOQUES_M[version]
  const correccion = CORRECCION_M[version]
  const total = Math.floor(modulosDeDatos(version) / 8)
  const cortos = bloques - (total % bloques)
  const largoCorto = Math.floor(total / bloques)
  const divisor = divisorReedSolomon(correccion)
  const partes: number[][] = []
  for (let i = 0, k = 0; i < bloques; i += 1) {
    const dat = datos.slice(k, k + largoCorto - correccion + (i < cortos ? 0 : 1))
    k += dat.length
    const ecc = restoReedSolomon(dat, divisor)
    if (i < cortos) dat.push(0)
    partes.push(dat.concat(ecc))
  }
  const palabras: number[] = []
  for (let i = 0; i < partes[0].length; i += 1) {
    partes.forEach((parte, j) => {
      if (i !== largoCorto - correccion || j >= cortos) palabras.push(parte[i])
    })
  }

  // 3. Los patrones de función.
  const tamano = version * 4 + 17
  const modulos = Array.from({ length: tamano }, () => new Array<boolean>(tamano).fill(false))
  const funcion = Array.from({ length: tamano }, () => new Array<boolean>(tamano).fill(false))
  const fijar = (x: number, y: number, oscuro: boolean) => {
    modulos[y][x] = oscuro
    funcion[y][x] = true
  }
  for (let i = 0; i < tamano; i += 1) {
    fijar(6, i, i % 2 === 0)
    fijar(i, 6, i % 2 === 0)
  }
  const posicion = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        const x = cx + dx
        const y = cy + dy
        if (x >= 0 && x < tamano && y >= 0 && y < tamano) fijar(x, y, d !== 2 && d !== 4)
      }
    }
  }
  posicion(3, 3)
  posicion(tamano - 4, 3)
  posicion(3, tamano - 4)
  if (version >= 2) {
    const c = version * 4 + 10
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) fijar(c + dx, c + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  }
  const formato = (mascara: number) => {
    const dato = (0 << 3) | mascara // nivel M = 00
    let resto = dato
    for (let i = 0; i < 10; i += 1) resto = (resto << 1) ^ ((resto >>> 9) * 0x537)
    const b = ((dato << 10) | resto) ^ 0x5412
    const bit = (i: number) => ((b >>> i) & 1) !== 0
    for (let i = 0; i <= 5; i += 1) fijar(8, i, bit(i))
    fijar(8, 7, bit(6))
    fijar(8, 8, bit(7))
    fijar(7, 8, bit(8))
    for (let i = 9; i < 15; i += 1) fijar(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i += 1) fijar(tamano - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i += 1) fijar(8, tamano - 15 + i, bit(i))
    fijar(8, tamano - 8, true)
  }
  formato(0)

  // 4. Los datos, en zigzag desde la esquina de abajo a la derecha.
  let i = 0
  for (let derecha = tamano - 1; derecha >= 1; derecha -= 2) {
    if (derecha === 6) derecha = 5
    for (let vertical = 0; vertical < tamano; vertical += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = derecha - j
        const subiendo = ((derecha + 1) & 2) === 0
        const y = subiendo ? tamano - 1 - vertical : vertical
        if (!funcion[y][x] && i < palabras.length * 8) {
          modulos[y][x] = ((palabras[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0
          i += 1
        }
      }
    }
  }

  // 5. La máscara con menos penalización.
  const invierte = (m: number, x: number, y: number): boolean => {
    switch (m) {
      case 0: return (x + y) % 2 === 0
      case 1: return y % 2 === 0
      case 2: return x % 3 === 0
      case 3: return (x + y) % 3 === 0
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0
      case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
      default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
    }
  }
  const aplicar = (m: number) => {
    for (let y = 0; y < tamano; y += 1) {
      for (let x = 0; x < tamano; x += 1) if (!funcion[y][x] && invierte(m, x, y)) modulos[y][x] = !modulos[y][x]
    }
  }
  let mejor = 0
  let menor = Infinity
  for (let m = 0; m < 8; m += 1) {
    aplicar(m)
    formato(m)
    const p = penalizacion(modulos)
    if (p < menor) {
      menor = p
      mejor = m
    }
    aplicar(m)
  }
  aplicar(mejor)
  formato(mejor)
  return modulos
}

function penalizacion(m: boolean[][]): number {
  const n = m.length
  let total = 0
  const lineas: boolean[][] = []
  for (let y = 0; y < n; y += 1) lineas.push(m[y])
  for (let x = 0; x < n; x += 1) lineas.push(m.map((fila) => fila[x]))
  for (const linea of lineas) {
    let corrida = 1
    for (let i = 1; i <= n; i += 1) {
      if (i < n && linea[i] === linea[i - 1]) corrida += 1
      else {
        if (corrida >= 5) total += corrida - 2
        corrida = 1
      }
    }
    const texto = linea.map((b) => (b ? '1' : '0')).join('')
    const conMargen = `0000${texto}0000`
    for (const patron of ['00001011101', '10111010000']) {
      for (let i = conMargen.indexOf(patron); i !== -1; i = conMargen.indexOf(patron, i + 1)) total += 40
    }
  }
  for (let y = 0; y < n - 1; y += 1) {
    for (let x = 0; x < n - 1; x += 1) {
      const c = m[y][x]
      if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) total += 3
    }
  }
  const oscuros = m.reduce((s, fila) => s + fila.filter(Boolean).length, 0)
  const k = Math.ceil(Math.abs(oscuros * 20 - n * n * 10) / (n * n)) - 1
  return total + Math.max(0, k) * 10
}
