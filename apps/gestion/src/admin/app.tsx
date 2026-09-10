/**
 * Marca de IDIKY en el panel de Strapi del sistema de gestion (T-37 · ADR-0012).
 *
 * Colores, logotipo e icono salen de la identidad que definio Mary para la PWA:
 * apps/pwa/src/estilos/tokens.css y apps/pwa/src/componentes/Logotipo.tsx. Los dos
 * productos no comparten codigo: si alla cambia la identidad, se cambia aqui tambien.
 *
 * Lo que Strapi deja configurar (logos, tema, textos) va en `config`. Lo que no deja —el
 * fondo del login y el titulo de la pestana— va en `bootstrap` y en extensions/marca.css, y
 * depende del marcado de Strapi 5.53: al subir de version hay que revisarlo
 * (apps/gestion/README.md).
 */
import type { StrapiApp } from '@strapi/strapi/admin';

import logotipo from './extensions/idiky-logotipo.svg';
import icono from './extensions/idiky-icono.svg';
import './extensions/marca.css';

const NOMBRE = 'IDIKY Gestión';

// Espanol por defecto. Strapi lee el idioma de localStorage al crear su estado, y este
// modulo se carga antes. Si la persona ya eligio otro idioma, se respeta.
try {
  if (!window.localStorage.getItem('strapi-admin-language')) {
    window.localStorage.setItem('strapi-admin-language', 'es');
  }
} catch {
  // Sin localStorage el panel arranca en ingles, con los mismos textos de marca.
}

// En tu, como la PWA.
const textosEs = {
  'Auth.form.welcome.title': 'Bienvenido a IDIKY',
  'Auth.form.welcome.subtitle': 'Sistema de gestión · ingresa con tu cuenta',
  'Auth.form.email.label': 'Correo electrónico',
  'Auth.form.email.placeholder': 'nombre@empresa.com',
  'Auth.form.rememberMe.label': 'Recordarme',
  'Auth.form.button.login': 'Ingresar',
  'Auth.link.forgot-password': '¿Olvidaste tu contraseña?',
  'app.components.LeftMenu.navbrand.title': 'IDIKY',
  'app.components.LeftMenu.navbrand.workplace': 'Sistema de gestión',
  'app.components.LeftMenu.logo.alt': 'Logo de IDIKY',
  'HomePage.header.subtitle': 'Bienvenido al sistema de gestión de IDIKY',
};

// El ingles es el idioma de respaldo de Strapi: aunque alguien lo escoja, la marca es IDIKY.
const textosEn = {
  'Auth.form.welcome.title': 'Welcome to IDIKY',
  'Auth.form.welcome.subtitle': 'Management system · log in to your account',
  'app.components.LeftMenu.navbrand.title': 'IDIKY',
  'app.components.LeftMenu.navbrand.workplace': 'Management system',
  'app.components.LeftMenu.logo.alt': 'IDIKY logo',
  'HomePage.header.subtitle': "Welcome to IDIKY's management system",
};

export default {
  config: {
    locales: ['es'],
    auth: { logo: logotipo },
    menu: { logo: icono },
    translations: { es: textosEs, en: textosEn },
    // Los mismos papeles que en la PWA: el azul es estructura (enlaces, foco, seleccion) y el
    // violeta es accion (el boton principal, que se oscurece al pasar el cursor).
    theme: {
      light: {
        colors: {
          primary100: '#e8ebf9', // --color-marca-suave
          primary200: '#c9cfee',
          primary500: '#4a5aa8',
          primary600: '#1d2e7a', // --color-marca
          primary700: '#15225c',
          buttonPrimary500: '#6b1e6f', // --color-acento-fuerte
          buttonPrimary600: '#812485', // --color-acento
          neutral100: '#eceef7', // --color-fondo
          neutral150: '#e4e5f1', // --color-borde
          neutral200: '#c9cbdf', // --color-borde-fuerte
          neutral600: '#515170', // --color-texto-suave
        },
      },
      dark: {
        colors: {
          primary100: '#1b1f3d',
          primary200: '#2f3a78',
          primary500: '#6f7ccf',
          primary600: '#9aa5ea',
          primary700: '#c3caf5',
          buttonPrimary500: '#6b1e6f',
          buttonPrimary600: '#812485',
        },
      },
    },
    // Sin recorridos ni avisos de funciones de pago de Strapi.
    tutorials: false,
    notifications: { releases: false },
  },

  bootstrap(_app: StrapiApp) {
    const actualizar = () => {
      marcarTitulo();
      marcarAcceso();
    };
    actualizar();
    // Strapi reescribe el titulo en cada pagina y cambia de ruta sin recargar: se observa el
    // documento y se corrige lo que haga falta. Cada revision es barata y no escribe nada si
    // no hay cambio, asi que no entra en bucle.
    new MutationObserver(actualizar).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  },
};

/** «Strapi Admin» y «Pagina | Strapi» pasan a decir IDIKY. */
function marcarTitulo() {
  const actual = document.title;
  const nuevo = actual === 'Strapi Admin' ? NOMBRE : actual.replace(/\| Strapi$/, `| ${NOMBRE}`);
  if (nuevo !== actual) {
    document.title = nuevo;
  }
}

/** Marca el <html> mientras se esta en las pantallas de acceso (/admin/auth/...). */
function marcarAcceso() {
  const enAcceso = window.location.pathname.includes('/auth/');
  if (document.documentElement.hasAttribute('data-idiky-acceso') !== enAcceso) {
    document.documentElement.toggleAttribute('data-idiky-acceso', enAcceso);
  }
}
