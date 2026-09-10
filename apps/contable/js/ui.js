/**
 * Ayudas para construir la pantalla.
 *
 * Todo se arma con `document.createElement`, nunca con `innerHTML`, para que
 * un nombre o un concepto escrito por un propietario no pueda inyectar
 * codigo en la pagina.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.ui = (function () {
  'use strict'

  var f = Idiky.formato

  /**
   * Crea un elemento.
   *   el('div', 'tarjeta', 'texto')
   *   el('button', { clase: 'boton', onClick: fn }, ['Guardar'])
   */
  function el(etiqueta, opciones, hijos) {
    var nodo = document.createElement(etiqueta)

    if (typeof opciones === 'string') {
      nodo.className = opciones
    } else if (opciones) {
      Object.keys(opciones).forEach(function (clave) {
        var valor = opciones[clave]
        if (valor == null || valor === false) return
        if (clave === 'clase') nodo.className = valor
        else if (clave === 'texto') nodo.textContent = valor
        else if (clave === 'html') nodo.innerHTML = valor
        else if (clave === 'onClick') nodo.addEventListener('click', valor)
        else if (clave === 'onInput') nodo.addEventListener('input', valor)
        else if (clave === 'onChange') nodo.addEventListener('change', valor)
        else if (clave === 'estilo') nodo.setAttribute('style', valor)
        else if (clave in nodo) nodo[clave] = valor
        else nodo.setAttribute(clave, valor)
      })
    }

    if (hijos != null) agregar(nodo, hijos)
    return nodo
  }

  function agregar(padre, hijos) {
    if (hijos == null || hijos === false) return padre
    if (Array.isArray(hijos)) {
      hijos.forEach(function (hijo) { agregar(padre, hijo) })
    } else if (typeof hijos === 'string' || typeof hijos === 'number') {
      padre.appendChild(document.createTextNode(String(hijos)))
    } else {
      padre.appendChild(hijos)
    }
    return padre
  }

  function vaciar(nodo) {
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild)
    return nodo
  }

  // -------------------------------------------------------------------------
  // Piezas reutilizables
  // -------------------------------------------------------------------------

  var ESTADO_CUOTA = {
    pendiente: ['Pendiente', 'alerta'],
    abonada: ['Abonada', 'info'],
    pagada: ['Pagada', 'exito'],
    vencida: ['Vencida', 'error'],
  }

  var ESTADO_PAGO = {
    reportado: ['Por conciliar', 'alerta'],
    aplicado: ['Aplicado', 'exito'],
    anulado: ['Anulado', 'error'],
  }

  function chip(texto, variante) {
    return el('span', 'chip' + (variante ? ' chip--' + variante : ''), texto)
  }

  function chipCuota(estado) {
    var def = ESTADO_CUOTA[estado] || [estado, '']
    return chip(def[0], def[1])
  }

  function chipPago(estado) {
    var def = ESTADO_PAGO[estado] || [estado, '']
    return chip(def[0], def[1])
  }

  /** Celda de dinero: alineada a la derecha y con cifras de ancho fijo. */
  function celdaDinero(valor, opciones) {
    opciones = opciones || {}
    var clases = 'cifra'
    if (opciones.rojoSiHay && valor > 0) clases += ' cifra--deuda'
    if (opciones.tenueSiCero && !valor) clases += ' cifra--cero'
    return el('td', clases, f.dinero(valor))
  }

  function indicador(etiqueta, valor, variante) {
    return el('div', 'indicador', [
      el('span', 'indicador__etiqueta', etiqueta),
      el('span', 'indicador__valor' + (variante ? ' indicador__valor--' + variante : ''), valor),
    ])
  }

  function vacio(titulo, detalle) {
    return el('div', 'vacio', [
      el('p', 'vacio__titulo', titulo),
      detalle ? el('p', null, detalle) : null,
    ])
  }

  function campo(etiqueta, control, ayuda) {
    var id = control.id || ('campo-' + Math.random().toString(36).slice(2, 7))
    control.id = id
    return el('label', 'campo', [
      el('span', 'campo__etiqueta', etiqueta),
      control,
      ayuda ? el('span', 'campo__ayuda', ayuda) : null,
    ])
  }

  /** Cita literal de lo que escribio el propietario. Se muestra tal cual. */
  function citaDelPropietario(texto) {
    return el('blockquote', 'cita', [
      el('span', 'cita__etiqueta', 'El propietario informa'),
      el('p', null, texto),
    ])
  }

  // -------------------------------------------------------------------------
  // Dialogo modal
  // -------------------------------------------------------------------------

  var modalAbierto = null

  function cerrarModal() {
    if (!modalAbierto) return
    document.body.removeChild(modalAbierto.fondo)
    document.removeEventListener('keydown', modalAbierto.alTeclear)
    modalAbierto = null
  }

  /**
   * Abre un dialogo. `opciones`: { titulo, descripcion, contenido, acciones }.
   * Se cierra con Escape o pulsando fuera.
   */
  function abrirModal(opciones) {
    cerrarModal()

    var caja = el('div', { clase: 'modal', role: 'dialog', 'aria-modal': 'true' }, [
      el('header', 'modal__cabecera', [
        el('div', null, [
          el('h2', 'modal__titulo', opciones.titulo),
          opciones.descripcion ? el('p', 'modal__descripcion', opciones.descripcion) : null,
        ]),
        el('button', { clase: 'boton boton--icono', onClick: cerrarModal, 'aria-label': 'Cerrar', texto: '✕' }),
      ]),
      el('div', 'modal__cuerpo', opciones.contenido),
      opciones.acciones ? el('footer', 'modal__pie', opciones.acciones) : null,
    ])

    var fondo = el('div', {
      clase: 'fondo-modal',
      onClick: function (evento) {
        if (evento.target === fondo) cerrarModal()
      },
    }, caja)

    function alTeclear(evento) {
      if (evento.key === 'Escape') cerrarModal()
    }

    document.body.appendChild(fondo)
    document.addEventListener('keydown', alTeclear)
    modalAbierto = { fondo: fondo, alTeclear: alTeclear }

    var primero = caja.querySelector('input, select, textarea, button')
    if (primero) primero.focus()
    return caja
  }

  // -------------------------------------------------------------------------
  // Avisos
  // -------------------------------------------------------------------------

  var temporizadorAviso = null

  function aviso(texto, tipo) {
    var contenedor = document.getElementById('avisos')
    if (!contenedor) return
    vaciar(contenedor)
    contenedor.appendChild(el('div', 'aviso aviso--' + (tipo || 'info'), texto))
    if (temporizadorAviso) clearTimeout(temporizadorAviso)
    temporizadorAviso = setTimeout(function () { vaciar(contenedor) }, 5000)
  }

  return {
    el: el,
    agregar: agregar,
    vaciar: vaciar,
    chip: chip,
    chipCuota: chipCuota,
    chipPago: chipPago,
    celdaDinero: celdaDinero,
    indicador: indicador,
    vacio: vacio,
    campo: campo,
    citaDelPropietario: citaDelPropietario,
    abrirModal: abrirModal,
    cerrarModal: cerrarModal,
    aviso: aviso,
  }
})()
