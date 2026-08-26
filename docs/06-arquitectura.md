# 06 — Arquitectura

## 1. Visión general

```
┌──────────────────────────────────────────────────────────────┐
│                      apps/pwa  (React + TS)                  │
│                                                              │
│  features/residente/*        features/admin/*                │
│  (app móvil)                 (consola web)                   │
│         │                            │                       │
│         └───────────┬────────────────┘                       │
│                     ▼                                        │
│              estado/  (contextos React: sesión, datos)       │
│                     ▼                                        │
│              datos/repositorio.ts   ← ÚNICA puerta a datos   │
│                     ▼                                        │
│        ┌────────────┴─────────────┐                          │
│        ▼                          ▼                          │
│  datos/adaptadorLocal.ts     datos/adaptadorApi.ts (futuro)  │
│  (semilla + localStorage)    (fetch al backend real)         │
└──────────────────────────────────────────────────────────────┘
                                     │
                                     ▼  (fase 2)
                        ┌────────────────────────┐
                        │  API REST / backend    │
                        └────────────────────────┘
```

**La regla más importante del repositorio:** ninguna pantalla accede a los datos
directamente. Todo pasa por `datos/repositorio.ts`. Así, cuando llegue el backend real solo
se cambia el adaptador y la interfaz no se toca (ver [ADR-0003](./adr/0003-capa-de-datos.md)).

## 2. Estructura de carpetas

```
apps/pwa/
├── public/
│   ├── manifest.webmanifest      Manifiesto PWA (nombre, iconos, colores)
│   ├── sw.js                     Service worker (caché offline)
│   └── icono-*.svg               Iconos de la app
├── src/
│   ├── main.tsx                  Punto de entrada; registra el service worker
│   ├── App.tsx                   Rutas y layouts
│   ├── estilos/
│   │   ├── tokens.css            Colores, tipografía, espacios (design tokens)
│   │   └── base.css              Reset + componentes base (.tarjeta, .boton, …)
│   ├── dominio/
│   │   ├── tipos.ts              Tipos del modelo de datos (doc 05)
│   │   └── reglas.ts             Reglas de negocio puras (RN-xx). Sin React.
│   ├── datos/
│   │   ├── semilla.ts            Datos demo iniciales de la copropiedad
│   │   ├── almacen.ts            Persistencia en localStorage
│   │   └── repositorio.ts        API interna de datos (la única puerta)
│   ├── estado/
│   │   ├── SesionContext.tsx     Usuario, rol, copropiedad y unidad activa
│   │   └── DatosContext.tsx      Estado global de datos + acciones
│   ├── componentes/              UI reutilizable, sin lógica de negocio
│   └── features/
│       ├── auth/                 CU-R-01
│       ├── residente/            CU-R-02 … CU-R-11
│       └── admin/                CU-A-01 … CU-A-09
```

## 3. Reglas de código

| Regla | Por qué |
|---|---|
| Las **reglas de negocio** viven en `dominio/reglas.ts` como funciones puras. | Se pueden probar y reutilizar en el backend. |
| Las **pantallas** (`features/`) no calculan negocio; consumen `reglas.ts`. | Evita que la misma regla se implemente distinto en dos sitios. |
| Los **componentes** (`componentes/`) no conocen el dominio. | Reutilizables entre residente y admin. |
| Todo acceso a datos pasa por `useDatos()` (que usa el repositorio). | Un solo punto de cambio hacia el backend. |
| Cada pantalla declara en un comentario el/los `CU-` que implementa. | Trazabilidad documentación ↔ código. |

## 4. Rutas de la aplicación

| Ruta | Pantalla | CU |
|---|---|---|
| `/acceso` | Selección de perfil demo | CU-R-01 |
| `/app` | Inicio residente | CU-R-02 |
| `/app/cuenta` | Estado de cuenta | CU-R-03 |
| `/app/cuenta/pagar` | Pago | CU-R-04 |
| `/app/reservas` | Zonas comunes y reservas | CU-R-05, CU-R-06 |
| `/app/pqrs` | PQRS | CU-R-07, CU-R-08 |
| `/app/comunicados` | Cartelera | CU-R-09 |
| `/app/visitantes` | Visitantes y códigos | CU-R-10 |
| `/app/correspondencia` | Correspondencia | CU-R-11 |
| `/admin` | Tablero | CU-A-01 |
| `/admin/unidades` | Unidades y residentes | CU-A-02 |
| `/admin/cartera` | Cartera, pagos y generación | CU-A-03, CU-A-04, CU-A-05 |
| `/admin/reservas` | Aprobación de reservas | CU-A-06 |
| `/admin/pqrs` | Bandeja de PQRS | CU-A-07 |
| `/admin/comunicados` | Publicación de comunicados | CU-A-08 |
| `/admin/correspondencia` | Registro de correspondencia | CU-A-09 |

## 5. Estrategia multiplataforma

| Plataforma | Cómo | Fase |
|---|---|---|
| **PWA** | La app tal cual, instalable desde el navegador, con service worker. | 1 (hoy) |
| **Android** | [Capacitor](https://capacitorjs.com) envuelve el mismo build web. | 3 |
| **iOS** | Capacitor, mismo build. | 3 |

Consecuencia práctica: **no se usan APIs exclusivas del navegador sin alternativa nativa**.
Cuando se necesite cámara, notificaciones push o biometría, se hará detrás de una interfaz
propia (`servicios/plataforma.ts`) con dos implementaciones. Ver
[ADR-0002](./adr/0002-estrategia-multiplataforma.md).

## 6. Backend (fase 2, aún no existe)

Diseño previsto para no bloquear decisiones hoy:

- API REST `/{copropiedadId}/...` con autenticación por token.
- Multi-tenant por `copropiedadId` en todas las consultas (RN-01).
- Los tipos de `dominio/tipos.ts` se comparten como paquete `packages/dominio`.
- El adaptador `datos/adaptadorApi.ts` implementa la misma interfaz que el local.

La elección concreta de tecnología del backend se documentará en un ADR cuando se tome.
**No está decidida.**
