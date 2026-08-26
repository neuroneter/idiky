# Idiky — Gestión de Copropiedad Horizontal

> Plataforma para la administración de propiedad horizontal (conjuntos residenciales,
> edificios y unidades comerciales) compuesta por una **app móvil para copropietarios y
> residentes** y una **consola web para administradores**.

Estado actual: **Demo funcional v0.1 (PWA)** — datos simulados, sin backend real.

---

## 1. ¿Qué hay en este repositorio?

| Ruta | Contenido |
|---|---|
| [`docs/`](./docs/README.md) | **Toda la documentación del proyecto.** Empieza siempre aquí. |
| [`apps/pwa/`](./apps/pwa/README.md) | Demo PWA (React + TypeScript + Vite). Contiene la app de Residente y la Consola de Administración. |
| [`CLAUDE.md`](./CLAUDE.md) | Instrucciones de contexto para agentes de IA que trabajen en el repo. |

## 2. Arranque rápido del demo

```bash
cd apps/pwa
npm install
npm run dev
```

Abre `http://localhost:5173`. En la pantalla de acceso puedes entrar con **cualquiera de
los perfiles demo** (no hay contraseñas reales, es un demo):

| Perfil | Descripción |
|---|---|
| Residente — Torre 1 Apto 402 | Vista móvil del copropietario |
| Residente — Torre 2 Apto 901 | Copropietario con cartera en mora |
| Administrador | Consola de administración (backoffice) |

Para generar la versión instalable:

```bash
npm run build && npm run preview
```

## 3. Documentación esencial

Antes de escribir código, lee en este orden:

1. [Visión y alcance](./docs/01-vision-y-alcance.md) — qué estamos construyendo y por qué.
2. [Actores y roles](./docs/03-actores-y-roles.md) — quién usa qué.
3. [Catálogo de casos de uso](./docs/04-casos-de-uso.md) — la fuente de verdad funcional.
4. [Arquitectura](./docs/06-arquitectura.md) — cómo está organizado el código.
5. [Estado del proyecto](./docs/09-estado-del-proyecto.md) — **qué está hecho y qué sigue.**

Si vas a trabajar en equipo:

6. [Equipo y orquestación](./docs/10-equipo-y-orquestacion.md) — zonas de propiedad, flujo de git y protocolo para archivos compartidos.
7. [Tablero de trabajo](./docs/11-tablero-de-trabajo.md) — quién tiene qué tarea.
8. [Levantamiento pendiente](./docs/12-levantamiento-pendiente.md) — **lo que falta definir del producto.**

> ⚠️ El demo v0.1 se construyó sobre supuestos de un conjunto residencial típico, para tener
> algo tangible con qué conversar. **No es la definición del producto.** Antes de agregar
> funcionalidad nueva hay que responder el levantamiento pendiente.

## 4. Hoja de ruta en una línea

`Demo PWA (v0.1)` → `Backend real + Auth (v0.2)` → `Android/iOS con Capacitor (v0.3)` → `Pagos y facturación (v0.4)`

Detalle completo en [`docs/07-roadmap.md`](./docs/07-roadmap.md).

## 5. Convenciones

Commits, ramas, nomenclatura y estilo de código: [`docs/08-convenciones.md`](./docs/08-convenciones.md).
