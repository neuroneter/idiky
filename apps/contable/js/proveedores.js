/**
 * Proveedores y consulta de NIT.
 *
 * --------------------------------------------------------------------------
 * SOBRE LA CONSULTA A LA DIAN — LEER ANTES DE TOCAR ESTE ARCHIVO
 * --------------------------------------------------------------------------
 * La DIAN no expone una API publica y gratuita para consultar un NIT y traer
 * la razon social. El RUT se consulta en su portal con autenticacion, y los
 * servicios que lo automatizan son de terceros y de pago.
 *
 * Ademas, esta aplicacion abre desde un archivo local, sin servidor y sin
 * conexion garantizada (ADR-0006): no puede llamar a un servicio externo.
 *
 * Por eso `consultarNit` busca en el DIRECTORIO PROPIO de la copropiedad, que
 * es lo que de verdad se necesita en el dia a dia — al proveedor de vigilancia
 * se le paga todos los meses, no hace falta consultarlo cada vez.
 *
 * La funcion existe como una sola puerta a proposito: el dia que haya backend
 * (fase 2), conectar un servicio real de consulta es cambiar SOLO el cuerpo de
 * `consultarNit`. Ninguna pantalla se entera.
 *
 * --------------------------------------------------------------------------
 * LO QUE SI ES REAL AQUI
 * --------------------------------------------------------------------------
 * El digito de verificacion se calcula con el algoritmo de la DIAN, verificado
 * contra NITs de dominio publico. Sirve para atrapar un NIT mal digitado antes
 * de que entre a la contabilidad.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.proveedores = (function () {
  'use strict'

  /** Pesos del algoritmo del DV, aplicados de derecha a izquierda. */
  var PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]

  /** Digito de verificacion de un NIT, segun la DIAN. */
  function digitoDeVerificacion(nit) {
    var digitos = String(nit).replace(/\D/g, '').split('').reverse()
    if (digitos.length === 0 || digitos.length > PESOS.length) return null
    var suma = digitos.reduce(function (total, digito, i) {
      return total + Number(digito) * PESOS[i]
    }, 0)
    var resto = suma % 11
    return resto < 2 ? resto : 11 - resto
  }

  /** Deja el NIT en digitos, sin puntos ni guion ni DV. */
  function limpiarNit(texto) {
    return String(texto == null ? '' : texto).replace(/\D/g, '')
  }

  /** `901234567` -> `901.234.567-7`. */
  function formatearNit(nit, dv) {
    var limpio = limpiarNit(nit)
    if (!limpio) return ''
    var conPuntos = limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    var digito = dv != null ? dv : digitoDeVerificacion(limpio)
    return digito != null ? conPuntos + '-' + digito : conPuntos
  }

  /**
   * Valida un NIT escrito por el usuario.
   * Acepta con o sin DV; si lo trae, comprueba que sea el correcto.
   */
  function validarNit(texto) {
    var crudo = String(texto == null ? '' : texto).trim()
    var partes = crudo.split('-')
    var base = limpiarNit(partes[0])
    var dvEscrito = partes.length > 1 ? limpiarNit(partes[1]) : ''

    if (base.length < 5) {
      return { valido: false, motivo: 'El NIT es muy corto. Escribe al menos cinco digitos.' }
    }
    if (base.length > 15) {
      return { valido: false, motivo: 'El NIT tiene demasiados digitos.' }
    }

    var dv = digitoDeVerificacion(base)
    if (dvEscrito !== '' && Number(dvEscrito) !== dv) {
      return {
        valido: false,
        motivo: 'El digito de verificacion no corresponde: para ' + base + ' deberia ser ' + dv + '.',
      }
    }
    return { valido: true, nit: base, dv: dv }
  }

  /**
   * Directorio inicial de proveedores de una copropiedad.
   *
   * Son empresas de ejemplo, no reales: el demo no debe inventar datos sobre
   * companias que existen. Los NIT llevan su DV bien calculado, para que la
   * validacion se pueda probar de verdad.
   */
  var DIRECTORIO_BASE = [
    ['830112445', 'Seguridad Andina S.A.S.', 'Vigilancia Andina', 'juridica', true,
      'Calle 72 # 10-34', 'Bogota', '6015551020', 'facturacion@seguridadandina.com.co', '513510', 4, 0.966],
    ['900456789', 'Servilimpieza Ltda.', 'Servilimpieza', 'juridica', true,
      'Carrera 30 # 45-12', 'Bogota', '6015559080', 'cartera@servilimpieza.com.co', '513505', 4, 0.966],
    ['811023567', 'Ascensores del Norte S.A.S.', 'Ascensores del Norte', 'juridica', true,
      'Autopista Norte # 128-40', 'Bogota', '6015553311', 'servicio@ascensoresnorte.com.co', '514505', 4, 0.966],
    ['860512339', 'Seguros Cordillera S.A.', 'Seguros Cordillera', 'juridica', true,
      'Avenida El Dorado # 68-90', 'Bogota', '6015557700', 'polizas@segucordillera.com.co', '513005', 0, 0],
    ['901778234', 'Servicios Publicos Capital S.A. E.S.P.', 'SP Capital', 'juridica', true,
      'Diagonal 61 # 26-15', 'Bogota', '6015551111', 'grandes@spcapital.com.co', '513530', 0, 0],
    ['900312876', 'Construcciones Vertice S.A.S.', 'Vertice', 'juridica', true,
      'Calle 100 # 19-54', 'Bogota', '6015554455', 'contratos@vertice.com.co', '514510', 2, 0.966],
    ['52189347', 'Olga Lucia Henao Vargas', 'Administracion', 'natural', false,
      'Carrera 15 # 88-21', 'Bogota', '3105551234', 'olga.henao@correo.com', '511005', 10, 0],
  ]

  function directorioBase() {
    return DIRECTORIO_BASE.map(function (fila, i) {
      return {
        id: 'prv-' + String(i + 1).padStart(3, '0'),
        nit: fila[0],
        dv: digitoDeVerificacion(fila[0]),
        razonSocial: fila[1],
        nombreComercial: fila[2],
        tipoPersona: fila[3],
        responsableIva: fila[4],
        direccion: fila[5],
        ciudad: fila[6],
        telefono: fila[7],
        email: fila[8],
        /** Cuenta del PUC contra la que se causa lo que este proveedor factura. */
        cuentaGasto: fila[9],
        /** Tarifas de retencion, en porcentaje. */
        tarifaRetefuente: fila[10],
        tarifaReteIca: fila[11],
        activo: true,
      }
    })
  }

  /**
   * Busca un NIT en el directorio.
   *
   * ESTA ES LA UNICA PUERTA. Cuando exista el backend, aqui adentro se llama
   * al servicio de consulta y se devuelve lo mismo; las pantallas no cambian.
   *
   * Devuelve `{ encontrado, proveedor?, nit, dv }`.
   */
  function consultarNit(texto, directorio) {
    var validacion = validarNit(texto)
    if (!validacion.valido) return { encontrado: false, error: validacion.motivo }

    var encontrado = (directorio || []).filter(function (p) {
      return p.nit === validacion.nit
    })[0]

    return {
      encontrado: !!encontrado,
      proveedor: encontrado || null,
      nit: validacion.nit,
      dv: validacion.dv,
    }
  }

  /** Busca por nombre o por NIT, para el autocompletado. */
  function buscar(directorio, texto) {
    var termino = String(texto || '').trim().toLowerCase()
    if (!termino) return directorio.slice()
    var soloDigitos = limpiarNit(termino)
    return directorio.filter(function (p) {
      if (soloDigitos && p.nit.indexOf(soloDigitos) === 0) return true
      return (p.razonSocial + ' ' + p.nombreComercial).toLowerCase().indexOf(termino) !== -1
    })
  }

  return {
    digitoDeVerificacion: digitoDeVerificacion,
    limpiarNit: limpiarNit,
    formatearNit: formatearNit,
    validarNit: validarNit,
    directorioBase: directorioBase,
    consultarNit: consultarNit,
    buscar: buscar,
  }
})()
