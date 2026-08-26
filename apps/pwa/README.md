# Demo PWA — Idiky

App web (PWA) que contiene **las dos caras del producto**: la app móvil del residente y la
consola de administración.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verifica tipos y compila a `dist/` |
| `npm run preview` | Sirve `dist/` (aquí sí se activa el service worker) |
| `npm run typecheck` | Solo verificación de tipos |

## Perfiles del demo

No hay contraseñas ([ADR-0004](../../docs/adr/0004-autenticacion-demo.md)). En la pantalla de
acceso eliges:

| Perfil | Para probar |
|---|---|
| **María Camila Restrepo** — Torre 1, 402 | Residente al día: pagar, reservar, PQRS, visitantes |
| **Andrés Felipe Gómez** — Torre 2, 901 | Residente en mora: reservas bloqueadas (RN-08) |
| **Olga Lucía Henao** | Consola de administración completa |

Los datos se guardan en `localStorage`. El botón **"Reiniciar demo"** (en la pantalla de
acceso y en la consola) devuelve todo a su estado inicial.

## Estructura

```
src/
├── dominio/       tipos.ts (modelo) · reglas.ts (reglas de negocio RN-xx, funciones puras)
├── datos/         semilla · almacen (localStorage) · repositorio (ÚNICA puerta) · selectores
├── estado/        SesionContext (usuario y unidad activa) · DatosContext (datos + acciones)
├── componentes/   UI reutilizable sin lógica de negocio
├── estilos/       tokens.css (identidad visual) · base.css · layout.css
└── features/
    ├── auth/       CU-R-01
    ├── residente/  CU-R-02 … CU-R-11
    └── admin/      CU-A-01 … CU-A-09
```

Detalle y reglas de arquitectura: [`docs/06-arquitectura.md`](../../docs/06-arquitectura.md).

## Reglas al modificar este código

1. **Ninguna pantalla accede a los datos directamente.** Todo pasa por
   `datos/repositorio.ts`, y las escrituras por `useDatos().ejecutar(...)`.
2. **Las reglas de negocio van en `dominio/reglas.ts`**, numeradas `RN-xx` y sin React.
3. **Cada pantalla declara en su encabezado el caso de uso que implementa.**
4. **`npm run build` debe pasar** antes de subir cualquier cambio.

## Camino a Android e iOS

El mismo build web se empaquetará con Capacitor en la fase 3
([ADR-0002](../../docs/adr/0002-estrategia-multiplataforma.md)). Por eso hoy:

- No se usan APIs exclusivas del navegador sin alternativa nativa.
- La navegación usa `HashRouter`, compatible con el WebView y con cualquier subruta.
- `base: './'` en `vite.config.ts` permite servir la app desde cualquier ruta.
