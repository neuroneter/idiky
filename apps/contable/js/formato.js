/**
 * Formateo para mostrar en pantalla.
 *
 * Nunca se usa para guardar: los datos siempre viajan en ISO y en pesos
 * enteros. El formato se aplica solo al momento de pintar.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.formato = (function () {
  'use strict'

  var MONEDA = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })

  var MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]

  function dinero(valor) {
    return MONEDA.format(valor || 0)
  }

  /** `2026-08-26` -> `26 de agosto de 2026`. Sin depender de la zona horaria. */
  function fecha(iso) {
    if (!iso) return ''
    var partes = iso.slice(0, 10).split('-')
    var mes = MESES[Number(partes[1]) - 1]
    if (!mes) return iso
    return Number(partes[2]) + ' de ' + mes + ' de ' + partes[0]
  }

  /** `2026-08-26` -> `26 ago`. Para tablas. */
  function fechaCorta(iso) {
    if (!iso) return ''
    var partes = iso.slice(0, 10).split('-')
    var mes = MESES[Number(partes[1]) - 1]
    if (!mes) return iso
    return Number(partes[2]) + ' ' + mes.slice(0, 3)
  }

  function fechaHora(iso) {
    if (!iso) return ''
    var hora = iso.slice(11, 16)
    return hora ? fechaCorta(iso) + ', ' + hora : fechaCorta(iso)
  }

  /** `2026-08` -> `agosto 2026`. */
  function periodo(valor) {
    if (!valor) return ''
    var partes = valor.split('-')
    var mes = MESES[Number(partes[1]) - 1]
    return mes ? mes + ' ' + partes[0] : valor
  }

  /** Convierte lo que el usuario escribe en un campo de dinero a un entero. */
  function aNumero(texto) {
    var limpio = String(texto == null ? '' : texto).replace(/[^\d-]/g, '')
    var valor = parseInt(limpio, 10)
    return isNaN(valor) ? 0 : valor
  }

  return {
    dinero: dinero,
    fecha: fecha,
    fechaCorta: fechaCorta,
    fechaHora: fechaHora,
    periodo: periodo,
    aNumero: aNumero,
  }
})()
