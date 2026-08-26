# ADR-0001 — Stack tecnológico del demo

- **Estado:** Aceptada
- **Fecha:** 2026-08-26

## Contexto

Necesitamos un demo navegable rápido de construir, que sea **el mismo código** que después
se convierta en la app Android/iOS, y que no dependa de un backend para poder mostrarse.

## Decisión

**React 18 + TypeScript + Vite**, sin librería de componentes de UI, con CSS propio basado
en design tokens.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| React + Vite | Ecosistema, Capacitor lo soporta directo, arranque instantáneo | — | **Elegida** |
| Flutter | Excelente en móvil | La PWA queda pesada y el backoffice web incómodo | Descartada |
| React Native | Nativo real | La consola web quedaría en otro código base | Descartada |
| HTML/JS sin framework | Cero dependencias | No escala al producto real | Descartada |
| Next.js | SSR, rutas por archivo | SSR no aporta a una app tras login; complica Capacitor | Descartada |

**Sin librería de UI (MUI, Chakra, Tailwind):** el demo debe verse propio desde el inicio y
sin peso extra; los tokens en `estilos/tokens.css` permiten cambiar la identidad visual en
un solo archivo. Si el equipo crece, reevaluar.

## Consecuencias

- Fácil: portar a Android/iOS con Capacitor sin reescribir (ADR-0002).
- Fácil: cambiar la identidad visual (un archivo de tokens).
- Difícil: componentes complejos (tablas con virtualización, date pickers avanzados) habrá
  que construirlos o adoptar una librería puntual más adelante.
