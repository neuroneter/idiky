/**
 * Arranque de la aplicacion: navegacion entre modulos y repintado.
 *
 * No hay enrutador ni framework. Hay tres pantallas, una funcion que las
 * pinta, y una variable que dice cual esta activa. Para una aplicacion de
 * escritorio de este tamano, eso es suficiente y se lee de corrido.
 */
var Idiky = window.Idiky || (window.Idiky = {})

Idiky.app = (function () {
  'use strict'

  var el = Idiky.ui.el
  var ui = Idiky.ui

  var MODULOS = [
    { id: 'cartera', texto: 'Cartera', titulo: 'Cartera',
      subtitulo: 'Quien debe, cuanto y desde cuando' },
    { id: 'pagos', texto: 'Pagos', titulo: 'Pagos',
      subtitulo: 'Abonos por conciliar y registro de lo que entra' },
    { id: 'recibos', texto: 'Recibos de caja', titulo: 'Recibos de caja',
      subtitulo: 'El libro completo, con los anulados' },
    { id: 'gastos', texto: 'Gastos', titulo: 'Gastos',
      subtitulo: 'Lo que la copropiedad debe y lo que ya pago' },
    { id: 'ajustes', texto: 'Ajustes', titulo: 'Comprobantes de ajuste',
      subtitulo: 'Mover la contabilidad sin que entre ni salga plata' },
    { id: 'reportes', texto: 'Reportes', titulo: 'Reportes',
      subtitulo: 'Movimientos por cliente y estados financieros' },
  ]

  var moduloActivo = 'cartera'

  function moduloPorId(id) {
    return MODULOS.filter(function (m) { return m.id === id })[0]
  }

  function irA(id) {
    moduloActivo = id
    pintar()
  }

  /**
   * Repinta la pantalla completa.
   *
   * `opciones.mantenerFoco` recibe la clase de un campo que debe recuperar el
   * foco y el cursor despues de repintar — lo usa el buscador, que si no
   * perderia el foco en cada tecla.
   */
  function pintar(opciones) {
    opciones = opciones || {}

    var activo = document.activeElement
    var seleccion = activo && activo.selectionStart

    pintarNavegacion()
    pintarCabecera()

    var contenedor = ui.vaciar(document.getElementById('contenido'))
    var modulo = moduloActivo

    if (modulo === 'cartera') Idiky.vistaCartera.pintar(contenedor, pintar)
    else if (modulo === 'pagos') Idiky.vistaPagos.pintar(contenedor, pintar)
    else if (modulo === 'recibos') Idiky.vistaRecibos.pintar(contenedor, pintar)
    else if (modulo === 'gastos') Idiky.vistaGastos.pintar(contenedor, pintar)
    else if (modulo === 'ajustes') Idiky.vistaAjustes.pintar(contenedor, pintar)
    else Idiky.vistaReportes.pintar(contenedor, pintar)

    if (opciones.mantenerFoco) {
      var campo = document.querySelector('.' + opciones.mantenerFoco)
      if (campo) {
        campo.focus()
        if (seleccion != null && campo.setSelectionRange) {
          try { campo.setSelectionRange(seleccion, seleccion) } catch (e) { /* type=search */ }
        }
      }
    }
  }

  function pintarNavegacion() {
    var nav = ui.vaciar(document.getElementById('navegacion'))
    MODULOS.forEach(function (modulo) {
      nav.appendChild(el('button', {
        clase: 'nav__enlace' + (moduloActivo === modulo.id ? ' activo' : ''),
        'aria-current': moduloActivo === modulo.id ? 'page' : null,
        onClick: function () { irA(modulo.id) },
      }, modulo.texto))
    })
  }

  function pintarCabecera() {
    var modulo = moduloPorId(moduloActivo)
    var cabecera = ui.vaciar(document.getElementById('cabecera'))
    ui.agregar(cabecera, [
      el('div', null, [
        el('h1', 'cabecera__titulo', modulo.titulo),
        el('p', 'cabecera__subtitulo', modulo.subtitulo),
      ]),
      el('div', 'cabecera__acciones', [
        el('button', {
          clase: 'boton boton--pequeno',
          title: 'Devuelve los datos del demo a su estado inicial',
          onClick: function () {
            Idiky.repo.reiniciar()
            pintar()
            ui.aviso('Datos del demo reiniciados.', 'exito')
          },
        }, 'Reiniciar demo'),
      ]),
    ])
  }

  function iniciar() {
    var copropiedad = Idiky.repo.copropiedad()
    document.getElementById('nombre-copropiedad').textContent = copropiedad.nombre
    document.getElementById('nit-copropiedad').textContent = 'NIT ' + copropiedad.nit
    document.getElementById('usuario').textContent = Idiky.repo.usuario()
    pintar()
  }

  return { iniciar: iniciar, irA: irA, pintar: pintar }
})()

document.addEventListener('DOMContentLoaded', function () {
  Idiky.app.iniciar()
})
