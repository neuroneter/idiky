# 09 — Estado del proyecto (bitácora)

**Este es el documento que hay que leer primero al retomar el trabajo**, sea una persona
nueva o una sesión de IA distinta.

---

## Estado actual

| | |
|---|---|
| **Versión** | v0.1 — demo PWA navegable |
| **Fase** | 1 de 5 ([roadmap](./07-roadmap.md)) |
| **Backend** | No existe. Datos simulados en el navegador. |
| **Autenticación** | Simulada (selección de perfil, [ADR-0004](./adr/0004-autenticacion-demo.md)) |
| **Casos de uso implementados** | 21 de **45** documentados (12 de residente, 9 de administrador) |
| **Compila** | Sí — `cd apps/pwa && npm run build` |

### Lo que funciona hoy

**App del residente:** ingreso y unidad activa · inicio con resumen · estado de cuenta ·
pago simulado con comprobante · reserva y cancelación de zonas comunes con validación de
reglas · radicar y seguir PQRS · cartelera de comunicados · autorización de visitantes con
código · consulta de correspondencia · consulta del coeficiente de copropiedad.

**Consola del administrador:** tablero de indicadores · unidades y residentes con búsqueda,
ficha y vinculación · cartera con morosidad · registro de pagos manuales · generación de
cuotas con previsualización · aprobación y rechazo de reservas · bandeja de PQRS con SLA ·
publicación de comunicados · registro y entrega de correspondencia.

### Lo que NO existe

Backend, autenticación real, pagos reales, notificaciones push, apps nativas, portería,
presupuesto, informes exportables, modo oscuro.

Y —**esto es lo importante desde el 2026-08-26**— no existe nada del núcleo que el equipo
declaró como alcance: **asambleas** (citación, transmisión, votación, poderes, acta) ni
**documentos descargables** (paz y salvo, estado de cuenta, comprobante). Los **coeficientes
visibles al copropietario** sí — se implementaron el 2026-08-26 (CU-R-24).

### ⚠️ El demo v0.1 no es el producto

El demo se construyó sobre **supuestos de un conjunto residencial típico**, antes de tener
el levantamiento de requisitos. El 2026-08-26 el equipo declaró el alcance real
([`12-levantamiento-pendiente.md` §0](./12-levantamiento-pendiente.md)) y quedó claro que
**el demo cubre la mitad fácil del producto y no cubre el núcleo**:

| | |
|---|---|
| **Lo que el demo ya resuelve** | Cuota del mes, solicitudes al administrador (PQRS), zonas comunes |
| **Lo que el demo no resuelve y es el corazón del producto** | Asambleas completas (citación, transmisión, votación, poderes, acta) y documentos descargables |

Lo que hace difícil el producto no es la cartera: es que **una asamblea produzca decisiones
jurídicamente válidas**. Eso exige quórum verificable, poderes con tope legal, votación
ponderada por coeficiente y un acta que resista revisión. Nada de eso está construido y
buena parte **ni siquiera está definida** (ver §3 bis del levantamiento).

---

## Bitácora

> Formato: fecha · quién · qué se hizo · qué sigue. **Las entradas nuevas van arriba.**

### 2026-08-26 · Mary + IA (Claude) · Revisión del repositorio y alcance declarado

**Qué se hizo**

*Revisión del código existente.* Se verificó que el demo compila (`npm run build` pasa) y
que las reglas del [`CLAUDE.md`](../CLAUDE.md) se están cumpliendo: ninguna pantalla importa
`semilla.ts` ni `almacen.ts`, y las 16 pantallas declaran su caso de uso. Se encontraron
**cuatro bugs y tres deudas de arquitectura** (T-15 del tablero):

| Hallazgo | Dónde | Estado |
|---|---|---|
| **Fechas y horas en UTC**: `formatearFechaHora()` cortaba la cadena sin convertir. Un pago a las 8:30 p.m. del 26 se mostraba como «27 ago, 01:30» | `utilidades/formato.ts` | ✅ Corregido |
| **La PWA no tenía íconos instalables**: `index.html` apuntaba a un PNG inexistente y el manifest solo declaraba SVG | `public/`, `manifest.webmanifest` | ✅ Corregido |
| **Visitante autorizado a futuro aparecía activo hoy**: no se validaba `vigenciaDesde` | `dominio/reglas.ts` | ✅ Corregido (nuevo estado `programado`) |
| **Doble toque perdía escrituras**: `ejecutar()` clonaba la `bd` del closure | `estado/DatosContext.tsx` | ✅ Corregido (referencia + candado) |
| *Deuda:* las reglas se validan **solo en la UI** — `crearReserva()` no llama a `validarReserva()`. Al pasar a backend, la validación queda del lado equivocado | `datos/repositorio.ts:205` | ⬜ Abierta |
| *Deuda:* `imputarPago()` (RN-06) es código muerto; `PagoPage` reimplementa la imputación | `dominio/reglas.ts:113` | ⬜ Abierta |
| *Deuda:* RN-22 no filtra por copropiedad, viola RN-01 | `datos/repositorio.ts:175` | ⬜ Abierta |

No hay pruebas, ni linter, ni CI.

*Alcance declarado.* Mary describió el producto que se quiere construir: cuota del mes,
informe de estado de cuenta, paz y salvo descargable, comprobante de pago, solicitudes al
administrador, zonas comunes, citaciones de asamblea, transmisión en vivo, votaciones,
poderes entre copropietarios, acta y coeficientes.

**Decisiones que esto obligó**

1. **La asamblea pasa a ser el núcleo del producto.** Seis de los doce puntos pedidos son
   asamblea. Estaba en la fase 4 del roadmap; **se movió a la fase 2**.
2. **Se agregaron 12 casos de uso** al catálogo (CU-R-18…24, CU-A-17…21) y 3 de sistema
   (CU-S-07…09). El catálogo pasó de 33 a 45 casos de uso.
3. **Se agregaron 12 reglas de negocio** (RN-26 a RN-37) para poderes, quórum, votación,
   acta y documentos. Todas marcadas *pendiente*: ninguna está implementada.
4. **Se modeló el módulo de asambleas y documentos** en `05-modelo-de-datos.md`: Asamblea,
   PuntoOrdenDelDia, Asistencia, Poder, Votacion, Voto, ResultadoVotacion, Acta y Documento.
5. **Dos ADR quedan bloqueando trabajo**: ADR-0006 (generación de PDF) y ADR-0007
   (transmisión en vivo). Sin ellos no se puede empezar ni el paz y salvo ni la asamblea
   transmitida.

**Lo que se construyó**

- **CU-R-24 — Consultar mi coeficiente** (`MiUnidadPage.tsx`, ruta `/app/unidad`, con acceso
  desde el inicio). Muestra el coeficiente y, sobre todo, **qué determina**: la cuota del mes
  y el peso del voto en asamblea. El peso del voto sale de `pesoDelVoto()`, que es la única
  definición de RN-27 — cuando se construya la votación debe llamar ahí, no volver a leer
  `unidad.coeficiente`.
- **Los cuatro bugs corregidos** (tabla de arriba). Los íconos PNG de la PWA se generan con
  `apps/pwa/herramientas/generar-iconos.py`, un rasterizador de librería estándar: no había
  ImageMagick en el entorno y agregar una dependencia de imagen rompía la regla del
  `CLAUDE.md`. Si cambia el logo, hay que volver a correrlo.

Verificado en Chromium a 390×844 con zona horaria de Bogotá: el comprobante de un pago hecho
a las 18:35 ahora dice «26 ago, 18:35» y no la hora UTC. Sin errores de consola.

**Lo que quedó marcado como supuesto, no como decisión**

El quórum en coeficientes y el tope de poderes se escribieron como supuestos con **(?)**, no
como reglas cerradas. (El **voto ponderado por coeficiente** sí quedó confirmado por Mary ese
mismo día: RN-27 pasó de supuesto a regla implementada.) En particular, **el tope
legal de poderes de la Ley 675 de 2001 no se escribió con una cifra concreta porque no se
verificó el artículo** — implementar RN-30 con un número inventado sería un error con
consecuencias jurídicas. Es la tarea T-11.

**Qué sigue**

1. Responder §3 bis (asambleas) y §3 ter (documentos) del levantamiento — **bloquean el
   diseño del núcleo**.
2. Decidir si visitantes, correspondencia y cartelera siguen en el producto: están
   implementados pero nadie los mencionó (T-12).
3. Escribir ADR-0006 y ADR-0007 (T-13, T-14).
4. Confirmar la asignación de zonas: Mary indicó que trabajará en la app móvil, hoy
   asignada a Jeimy en `10-equipo-y-orquestacion.md` (T-03).

---

### 2026-08-26 · Sesión de IA (Claude) · Arranque del repositorio

**Qué se hizo**

- Estructura del repositorio: `docs/` (documentación) y `apps/pwa/` (demo).
- Documentación base: visión y alcance, glosario del dominio de propiedad horizontal,
  actores y matriz de permisos, catálogo de 33 casos de uso con su detalle, modelo de datos
  con 25 reglas de negocio numeradas, arquitectura, convenciones, roadmap de 5 fases.
- Cinco ADR: stack, estrategia multiplataforma, capa de datos con adaptadores,
  autenticación simulada, código visual de visitantes.
- Demo PWA funcional (React + TypeScript + Vite) con 20 casos de uso implementados,
  datos simulados persistentes e instalable como PWA.
- Documentación de trabajo en equipo para Jeimy, Mary y Daniel: zonas de propiedad de
  código, protocolo para archivos compartidos, flujo de git y tablero de tareas.
- Documento de levantamiento pendiente con las preguntas abiertas del producto.

**Decisiones tomadas** — ADR-0001 a ADR-0005 (ver [`adr/`](./adr/)).

**Qué sigue**

1. El equipo responde [`12-levantamiento-pendiente.md`](./12-levantamiento-pendiente.md).
2. Recorrer el demo y anotar observaciones aquí mismo.
3. Ajustar el catálogo de casos de uso al alcance real antes de construir más.

**Advertencia para quien retome:** no des el alcance del demo por definitivo. Léelo como
"esto es lo que se puede hacer con esta arquitectura", no como "esto es lo que el producto
va a ser".
