# Contexto para agentes de IA — Idiky

> Este archivo lo lee Claude Code (u otro agente) al empezar una sesión. Su objetivo es que
> **cualquier IA pueda retomar el proyecto sin contexto previo**.

## 1. Qué es este proyecto

Plataforma de gestión de **propiedad horizontal** (conjuntos residenciales).

**Este repositorio es el arnés de todo el desarrollo** ([ADR-0018](./docs/adr/0018-un-repositorio-por-sistema-e-idiky-como-arnes.md)):
aquí viven las reglas, los casos de uso, las decisiones (ADR), la bitácora, los prototipos y los
demos con los que se entiende lo que se construye. **Cada sistema vive en su propio
repositorio**, y todos vienen aquí a leer qué construir:

| Repositorio | Sistema | Stack |
|---|---|---|
| **`idiky`** (este) | El arnés: `docs/`, el demo `apps/pwa/` (Mary), la contable `apps/contable/` (Jeimy) y la orquestación del entorno (`infra/`) | Markdown · React + Vite · HTML/JS sin compilar |
| `Bloky-Idiky` | **BLOKY**: `apps/bloky/` + `apps/bloky-api/` + `infra/bloky/` | React + Vite · Node 22 + Fastify + PostgreSQL |
| `BOB-Idiky` | **BOB**: `apps/gestion/` + `infra/gestion/` | Strapi 5 + PostgreSQL 17 |
| `Jitsi-Streaming-Idiky` | **Jitsi** para las asambleas virtuales: `infra/jitsi/` | Imágenes de Jitsi + nginx |
| `App-Idiky` | **ALICE**, la app del propietario y residente | Flutter + Dart |
| `SmartContrat-Idiky` | Contratos inteligentes (login ERC-4337) | Solidity + Foundry · Polygon |

El detalle, cómo se relacionan y qué va dónde: [`docs/16-mapa-de-repositorios.md`](./docs/16-mapa-de-repositorios.md).
En la máquina del responsable de integración están todos juntos en `~/Documents/WorkSapce/`.
**El código de BLOKY, BOB y Jitsi ya no se edita aquí** (se mudó el 2026-10-02); sus casos de
uso, reglas y ADR sí.

Dentro de este repositorio quedan **dos productos distintos**, y confundirlos es el error más
caro que puedes cometer aquí:

| Producto | Qué es | Stack | Responsable |
|---|---|---|---|
| `apps/pwa/` | App móvil del residente + consola web del administrador | React + TS + Vite | **Mary** |
| `apps/contable/` | Aplicación contable: Cartera · Contabilidad (recaudos, pagos, ajustes, PUC) · Reportes | HTML + CSS + JS **sin compilar** | **Jeimy** |

**Las aplicaciones de IDIKY tienen nombre** (2026-09-10). Úsalos al hablar y al escribir, para no
confundir sistemas que se parecen:

| Nombre | Qué es | Quién entra y cómo | Dónde está |
|---|---|---|---|
| **BOB** | El *back office* de IDIKY | El equipo de IDIKY, con el login de Strapi. **No usa Twilio** | Repo `BOB-Idiky` (`apps/gestion/`) |
| **BLOKY** | El sistema de las copropiedades: estructura y unidades, propietarios, cartera, asambleas | Administrador, Delegado y los perfiles que ellos creen: **código por SMS al celular de BOB, o Google/Microsoft con el correo de BOB** | **En construcción en el repo `Bloky-Idiky`** (`apps/bloky/` + `apps/bloky-api/`; ADR-0008, ADR-0013). Su precursor es la consola del administrador del demo, en `apps/pwa/`, que sigue siendo la maqueta |
| **ALICE** | La app del propietario y residente | Propietarios y residentes | El producto, en el repo `App-Idiky` (Flutter, recién empezado). Su maqueta es el demo de `apps/pwa/` |

La contable de Jeimy conserva su nombre. La página web pública será **IDIKY**, y todo se presenta
como aplicaciones de IDIKY.

La PWA y la contable no comparten código. Comparten **las reglas del dominio**, traducidas a los
dos lenguajes.

Estado de los dos demos: **v0.1**, sin backend, con datos simulados. El producto real
(BLOKY, BOB, ALICE) se construye en sus repositorios.

## 2. Lo primero que debes hacer en una sesión nueva

0. **Mirar el aviso de inicio de sesión sobre la rama** (lo genera `.claude/hooks/revisar-rama.sh`).
   Si dice que la rama está atrasada, **antes de cualquier otra cosa** dile a la persona, con
   palabras sencillas y sin jerga, que hay que traer los cambios nuevos, y ofrécete a ejecutar
   `git pull` (o `git merge origin/main`, según el aviso). Mary y Jeimy no son ingenieras: no
   les expliques git, resuélvelo con ellas. Si aparecen conflictos, no los resuelvas a ciegas:
   detente y pídeles que le avisen al responsable de integración (Daniel).
1. Leer [`docs/09-estado-del-proyecto.md`](./docs/09-estado-del-proyecto.md) — la bitácora dice dónde quedó todo.
2. Leer el caso de uso a implementar en [`docs/04-casos-de-uso.md`](./docs/04-casos-de-uso.md).
3. Leer [`docs/06-arquitectura.md`](./docs/06-arquitectura.md) — dónde va cada cosa — y, si la
   tarea toca BLOKY, BOB, Jitsi, ALICE o los contratos,
   [`docs/16-mapa-de-repositorios.md`](./docs/16-mapa-de-repositorios.md): el código va en su repositorio.

## 3. Reglas que no se negocian

| Regla | Motivo |
|---|---|
| **Antes de escribir código, ubica en cuál de los dos productos estás.** Si la tarea es de cartera/contabilidad, casi seguro va en `apps/contable/`. | Ya pasó una vez: se construyó el módulo de Jeimy dentro del producto de Mary. |
| **Todo acceso a datos pasa por el repositorio** — `apps/pwa/src/datos/repositorio.ts` o `apps/contable/js/repositorio.js`. Ninguna pantalla toca la semilla ni `localStorage`. | Permite cambiar a backend real sin tocar la interfaz (ADR-0003). |
| **Las reglas de negocio viven en `dominio/`** como funciones puras, numeradas `RN-xx`. Están **duplicadas a propósito** en los dos productos. | Una regla cambia en los dos el mismo día. La definición que manda es `docs/05-modelo-de-datos.md`. |
| **En `apps/contable/`, la plata que ENTRA (Recaudos, recibo de caja) y la que SALE (Pagos, comprobante de egreso) son secciones y documentos distintos.** Causar un gasto no es pagarlo. | Tratarlos igual fue un error real que ya se corrigió una vez. |
| **El menú tiene tres entradas: Cartera · Contabilidad · Reportes.** Las pantallas de registro son *secciones* dentro de Contabilidad (`vista-contabilidad.js`), no entradas del menú. | Se agrupan por la tarea, no por el tipo de documento. No vuelvas a abrirle una entrada propia a cada pantalla. |
| **RN-80 a RN-86 son solo de la contable** (causación, estados financieros, comprobantes de ajuste y PUC): viven en `apps/contable/js/{contabilidad,puc,repositorio}.js` y no se duplican en la PWA. | La PWA no tiene gastos, ni estados financieros, ni partida doble. |
| **En `apps/contable/`, todo documento guarda la cuenta del PUC con la que se registró** (RN-85). Nunca la deduzcas del parámetro vigente al calcular. | Cambiar un parámetro no debe reescribir la contabilidad de un mes cerrado. |
| **En `apps/contable/`: nada de `import`/`export` ni `fetch` de archivos locales.** Scripts clásicos en el orden de `index.html`, datos dentro de un `.js`. | El navegador los bloquea al abrir el archivo desde el disco, y esa app **debe** abrirse con doble clic (ADR-0010). |
| **Cada pantalla declara en su encabezado el caso de uso que implementa.** | Trazabilidad código ↔ documentación. |
| **Documentación en español**, nombres de dominio en español, sin tildes en identificadores. | Consistencia (ver `docs/08-convenciones.md`). |
| **Al terminar, actualizar `docs/09-estado-del-proyecto.md`** y el estado del CU en el catálogo. | Es lo que evita perder contexto entre sesiones/IAs. |
| **No agregar dependencias** sin registrar un ADR en `docs/adr/`. | El demo debe seguir siendo ligero y portable a Capacitor. |

## 4. Comandos

**`apps/contable/`** no tiene comandos: se abre `index.html` con doble clic y se recarga el
navegador. No le agregues un paso de compilación — eso dejaría a Jeimy sin poder trabajar.

**`apps/pwa/`:**

```bash
cd apps/pwa
npm install       # una sola vez
npm run dev       # desarrollo en http://localhost:5173
npm run build     # typecheck + build de producción
npm run typecheck # solo verificación de tipos
npm run empaquetar # deja dist/idiky-demo.html: el demo en un solo archivo
```

Antes de dar por terminado un cambio en la PWA: **`npm run build` debe pasar**.

**BLOKY, BOB, Jitsi, ALICE y los contratos** tienen sus comandos en el README y el `CLAUDE.md`
de su repositorio ([`docs/16`](./docs/16-mapa-de-repositorios.md)). Si la tarea es de uno de
ellos, el código se cambia **allá**; aquí se actualizan el caso de uso, las reglas, el ADR y la
bitácora. Las reglas nuevas de BLOKY se definen en `docs/05-modelo-de-datos.md` y se implementan
en `Bloky-Idiky/apps/bloky-api/src/dominio/reglas.ts`, numeradas desde RN-160.

**`infra/`** — entorno de desarrollo en contenedores ([ADR-0011](./docs/adr/0011-entorno-de-desarrollo-en-contenedores.md),
[`infra/README.md`](./infra/README.md)):

```bash
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave> infra/desplegar.sh origin/main pwa   # solo el servicio que se nombra
```

**Si te piden desplegar**, sigue [`infra/guia-de-despliegue.md`](./infra/guia-de-despliegue.md) al
pie de la letra: **solo el servicio de quien lo pide** (`pwa` Mary, `contable` Jeimy, `bloky` y
`gestion` el responsable de integración), **solo desde `origin/main`**, y
`infra/servidor/verificar-vecino.sh` antes y después. Lo que Mary y Jeimy despliegan hoy son
**maquetas**; BLOKY Dev es el producto real y vive en el 8083. Para `bloky`, `gestion` y `jitsi`,
`desplegar.sh` trae el `origin/main` de **su** repositorio (ADR-0018).

**BOB** (Strapi, repo `BOB-Idiky`): **el modelo de datos se diseña en local con `npm run develop`
y va a git**; en el servidor Strapi corre en modo producción y lo creado ahí se pierde.

**Si la tarea es crear o cambiar un servicio del entorno**, lee primero
[`infra/README.md`](./infra/README.md) (cómo está armado, incluido lo que no está en git) y
sigue [`infra/nuevo-servicio.md`](./infra/nuevo-servicio.md) (el contrato y la receta).
Antes y después de tocar el servidor, `infra/servidor/verificar-vecino.sh` tiene que decir que
LangFlow sigue igual.

## 5. Git

- **`main` es la base de todo.** Se creó el 2026-09-10 a partir de la rama de integración
  `claude/idiky-work-review-ugp3xj`, donde se juntaron las ramas de Mary y de Jeimy. Nadie
  escribe directo en ella: la actualiza el responsable de integración.
- **Mary y Jeimy trabajan cada una en su rama de larga vida** (`claude/repository-review-c0p1wd`
  Mary, `claude/repository-review-1fbujq` Jeimy). Esas ramas **no se borran ni se reemplazan**.
  El ciclo es: **al empezar cada sesión, traer `main` a la rama** (`git fetch origin && git merge
  origin/main`, resolver lo que choque, `npm run build`); al terminar, `push` a la misma rama; el
  responsable de integración lleva la rama a `main` cuando corresponde.
- Rama de trabajo asignada por sesión (p. ej. `claude/demo-copropiedad-app-*`).
- Commits: `tipo(ámbito): descripción (CU-X-NN)` — ver `docs/08-convenciones.md`.
- **Nunca trabajes sobre una rama que no tenga el último `main` adentro.** Las dos
  renumeraciones (2026-09-10 y 2026-09-21) pasaron porque una rama siguió avanzando sin traer
  `main`: lo que allí se numeró ya existía con otro significado.
- **Los identificadores nuevos** (`RN-xx`, `CU-X-NN`, `T-xx`, `ADR-NNNN`) se toman **del rango
  reservado a cada persona** en `docs/11-tablero-de-trabajo.md` §0, nunca del "siguiente
  número que veo". Si el rango se agota, se pide otro al responsable de integración.

## 6. Qué NO hacer

- No implementar autenticación real, pagos reales ni backend en la fase 1: ese alcance está
  en el roadmap (fases 2 y 4) y hacerlo antes rompe el propósito del demo.
- No introducir librerías de UI ni de estado global sin ADR.
- No tocar nada del servidor de desarrollo fuera del usuario `idiky`: lo comparte otro
  servicio (LangFlow) cuyos consumidores dependen de sus puertos 80, 443, 8443 y 7860 y de
  sus rutas. Nada de nginx, firewall ni `sudo` para Idiky sin discutirlo antes (ADR-0011).
- No desplegar `gestion` (BOB) ni `todo` salvo que lo pida el responsable de integración, y
  nunca desde algo que no esté en `main`: Strapi borra de la base las tablas y columnas que el
  código con el que arranca no tenga.
- No meterle compilación, npm ni dependencias a `apps/contable/`: rompe la única condición
  que la hace utilizable por quien la desarrolla (ADR-0010).
- No borrar registros de datos: se cierran o anulan (trazabilidad).
