# Contexto para agentes de IA — Idiky

> Este archivo lo lee Claude Code (u otro agente) al empezar una sesión. Su objetivo es que
> **cualquier IA pueda retomar el proyecto sin contexto previo**.

## 1. Qué es este proyecto

Plataforma de gestión de **propiedad horizontal** (conjuntos residenciales).

Son **dos productos distintos, en el mismo repositorio**, y confundirlos es el error más
caro que puedes cometer aquí:

| Producto | Qué es | Stack | Responsable |
|---|---|---|---|
| `apps/pwa/` | App móvil del residente + consola web del administrador | React + TS + Vite | **Mary** |
| `apps/contable/` | Aplicación contable: Cartera · Contabilidad (recaudos, pagos, ajustes, PUC) · Reportes | HTML + CSS + JS **sin compilar** | **Jeimy** |

No comparten código. Comparten **las reglas del dominio**, traducidas a los dos lenguajes.

Estado: **demo v0.1**, sin backend, con datos simulados en los dos.

## 2. Lo primero que debes hacer en una sesión nueva

1. Leer [`docs/09-estado-del-proyecto.md`](./docs/09-estado-del-proyecto.md) — la bitácora dice dónde quedó todo.
2. Leer el caso de uso a implementar en [`docs/04-casos-de-uso.md`](./docs/04-casos-de-uso.md).
3. Leer [`docs/06-arquitectura.md`](./docs/06-arquitectura.md) — dónde va cada cosa.

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

## 5. Git

- **`main` es la base de todo.** Se creó el 2026-09-10 a partir de la rama de integración
  `claude/idiky-work-review-ugp3xj`, donde se juntaron las ramas de Mary y de Jeimy. Cada rama
  nueva sale de `main`; nadie escribe directo en ella. No se sigue trabajando sobre las ramas
  viejas.
- Rama de trabajo asignada por sesión (p. ej. `claude/demo-copropiedad-app-*`).
- Commits: `tipo(ámbito): descripción (CU-X-NN)` — ver `docs/08-convenciones.md`.
- **Antes de crear un identificador nuevo** (`RN-xx`, `CU-X-NN`, `T-xx`, `ADR-NNNN`) busca el
  máximo en la rama integrada y sigue desde ahí. Si dos personas trabajan en paralelo, cada
  una reserva un rango y lo anota en `docs/11-tablero-de-trabajo.md`. Numerar por separado
  ya costó una renumeración completa (ver la bitácora del 2026-09-10).

## 6. Qué NO hacer

- No implementar autenticación real, pagos reales ni backend en la fase 1: ese alcance está
  en el roadmap (fases 2 y 4) y hacerlo antes rompe el propósito del demo.
- No introducir librerías de UI ni de estado global sin ADR.
- No meterle compilación, npm ni dependencias a `apps/contable/`: rompe la única condición
  que la hace utilizable por quien la desarrolla (ADR-0010).
- No borrar registros de datos: se cierran o anulan (trazabilidad).
