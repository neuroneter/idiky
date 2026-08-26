# Contexto para agentes de IA — Idiky

> Este archivo lo lee Claude Code (u otro agente) al empezar una sesión. Su objetivo es que
> **cualquier IA pueda retomar el proyecto sin contexto previo**.

## 1. Qué es este proyecto

Plataforma de gestión de **propiedad horizontal** (conjuntos residenciales) con dos caras:

- **App móvil del residente** — hoy PWA, después Android/iOS con Capacitor.
- **Consola web del administrador** — backoffice de la copropiedad.

Estado: **demo v0.1**, sin backend, con datos simulados.

## 2. Lo primero que debes hacer en una sesión nueva

1. Leer [`docs/09-estado-del-proyecto.md`](./docs/09-estado-del-proyecto.md) — la bitácora dice dónde quedó todo.
2. Leer el caso de uso a implementar en [`docs/04-casos-de-uso.md`](./docs/04-casos-de-uso.md).
3. Leer [`docs/06-arquitectura.md`](./docs/06-arquitectura.md) — dónde va cada cosa.

## 3. Reglas que no se negocian

| Regla | Motivo |
|---|---|
| **Todo acceso a datos pasa por `apps/pwa/src/datos/repositorio.ts`.** Ninguna pantalla importa `semilla.ts` ni `almacen.ts`. | Permite cambiar a backend real sin tocar la interfaz (ADR-0003). |
| **Las reglas de negocio viven en `apps/pwa/src/dominio/reglas.ts`** como funciones puras, numeradas `RN-xx`. | Una regla, una definición; reutilizable en el backend. |
| **Cada pantalla declara en su encabezado el caso de uso que implementa.** | Trazabilidad código ↔ documentación. |
| **Documentación en español**, nombres de dominio en español, sin tildes en identificadores. | Consistencia (ver `docs/08-convenciones.md`). |
| **Al terminar, actualizar `docs/09-estado-del-proyecto.md`** y el estado del CU en el catálogo. | Es lo que evita perder contexto entre sesiones/IAs. |
| **No agregar dependencias** sin registrar un ADR en `docs/adr/`. | El demo debe seguir siendo ligero y portable a Capacitor. |

## 4. Comandos

```bash
cd apps/pwa
npm install       # una sola vez
npm run dev       # desarrollo en http://localhost:5173
npm run build     # typecheck + build de producción
npm run typecheck # solo verificación de tipos
```

Antes de dar por terminado un cambio: **`npm run build` debe pasar**.

## 5. Git

- Rama de trabajo asignada por sesión (p. ej. `claude/demo-copropiedad-app-*`).
- Commits: `tipo(ámbito): descripción (CU-X-NN)` — ver `docs/08-convenciones.md`.

## 6. Qué NO hacer

- No implementar autenticación real, pagos reales ni backend en la fase 1: ese alcance está
  en el roadmap (fases 2 y 4) y hacerlo antes rompe el propósito del demo.
- No introducir librerías de UI ni de estado global sin ADR.
- No borrar registros de datos: se cierran o anulan (trazabilidad).
