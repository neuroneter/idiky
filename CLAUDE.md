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
| `apps/contable/` | Aplicación contable del administrador: cartera, pagos, recibos de caja | HTML + CSS + JS **sin compilar** | **Jeimy** |

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
| **En `apps/contable/`: nada de `import`/`export` ni `fetch` de archivos locales.** Scripts clásicos en el orden de `index.html`, datos dentro de un `.js`. | El navegador los bloquea al abrir el archivo desde el disco, y esa app **debe** abrirse con doble clic (ADR-0006). |
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

- Rama de trabajo asignada por sesión (p. ej. `claude/demo-copropiedad-app-*`).
- Commits: `tipo(ámbito): descripción (CU-X-NN)` — ver `docs/08-convenciones.md`.

## 6. Qué NO hacer

- No implementar autenticación real, pagos reales ni backend en la fase 1: ese alcance está
  en el roadmap (fases 2 y 4) y hacerlo antes rompe el propósito del demo.
- No introducir librerías de UI ni de estado global sin ADR.
- No meterle compilación, npm ni dependencias a `apps/contable/`: rompe la única condición
  que la hace utilizable por quien la desarrolla (ADR-0006).
- No borrar registros de datos: se cierran o anulan (trazabilidad).
