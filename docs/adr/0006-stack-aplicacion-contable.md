# ADR-0006 — La aplicación contable se construye sin compilación: HTML, CSS y JavaScript

- **Estado:** Aceptada
- **Fecha:** 2026-08-27

## Contexto

La aplicación contable es un producto **distinto** de la PWA: la construye Jeimy, corre en el
computador del administrador y no comparte pantallas con la app de Mary.

La restricción que manda no es técnica sino práctica: **quien desarrolla esta aplicación no
puede instalar nada en su computador.** Sin Node, sin npm, sin línea de comandos. Solo el
navegador. Cualquier stack que exija un paso de compilación —React, TypeScript, Vite, incluso
un simple empaquetador— la deja sin poder trabajar.

Un stack que el equipo no puede ejecutar no es un stack, por bueno que sea.

## Decisión

`apps/contable/` se construye con **HTML, CSS y JavaScript planos, sin ningún paso de
compilación**. Se abre con doble clic sobre `index.html`, se edita con cualquier editor de
texto y se recarga el navegador para ver el cambio.

Dos restricciones concretas que impone abrir un archivo desde el disco (`file://`), medidas
en Chromium, no supuestas:

| | Al abrir el archivo desde el disco |
|---|---|
| CSS en archivo aparte (`<link>`) | ✅ funciona |
| JS en archivos aparte (`<script src>`) | ✅ funciona |
| JS con `import` / `export` (módulos ES) | ❌ **bloqueado por CORS** |
| Cargar un `.json` con `fetch` | ❌ **bloqueado por CORS** |
| `localStorage` | ✅ funciona |

Por eso el código se organiza en varios archivos con **scripts clásicos** y un espacio de
nombres global (`Idiky.dominio`, `Idiky.repo`, `Idiky.ui`…), y **los datos viven dentro de un
`.js`**, nunca en un `.json` aparte.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| HTML + CSS + JS sin compilar | Jeimy puede trabajar hoy, sin instalar nada. Cero dependencias. | Sin tipos ni componentes; hay que ser disciplinado a mano | **Elegida** |
| React + TypeScript, como la PWA | Consistencia con la app de Mary; tipos | Exige Node. **Bloquea al desarrollador.** | Descartada |
| React por CDN, sin compilar | Componentes sin build | Exige internet al abrir; JSX necesitaría Babel en el navegador (lento y frágil) | Descartada |
| Electron | Aplicación de escritorio de verdad | Exige Node y un empaquetado que Jeimy no puede correr | Descartada |
| Microsoft Access | Sin instalación adicional en algunos equipos | Encierra los datos, no se versiona en git, no se comparte con la PWA | Descartada |

## Consecuencias

- **Fácil:** trabajar sin permisos de administrador; mandar la aplicación por correo; que
  cualquiera del equipo la abra sin instalar nada.
- **Fácil:** entender el código. No hay magia de framework entre el archivo y la pantalla.
- **Difícil:** el compilador ya no atrapa errores de tipos. Se compensa con una sola puerta
  de datos (`repositorio.js`) y reglas puras en `dominio.js`, que son fáciles de revisar.
- **Obligación:** no introducir `import`/`export` ni `fetch` de archivos locales. Si algún día
  se necesitan, la aplicación deja de abrirse con doble clic y hay que revisar este ADR.
- **A futuro:** si más adelante se puede instalar Node, migrar es posible — el dominio y el
  repositorio ya están separados de las pantallas, igual que en la PWA.

## Relación con la PWA

Las dos aplicaciones **comparten las reglas del dominio, no el código**. `apps/contable/js/dominio.js`
y `apps/pwa/src/dominio/reglas.ts` implementan las mismas RN con los mismos números. Es
duplicación deliberada: son lenguajes distintos y no hay build que las una. **Si cambia una
regla en una, hay que cambiarla en la otra** — y esa es exactamente la conversación que las
dos personas tienen que tener antes de tocarla.
