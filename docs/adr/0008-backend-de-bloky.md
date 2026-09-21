# ADR-0008 — El backend de BLOKY: una API propia en Node y TypeScript, con PostgreSQL

- **Estado:** Aceptada
- **Fecha:** 2026-09-21
- **Tarea:** T-75

## Contexto

Este ADR llevaba pendiente desde el 2026-08-26. Lo destrabó una decisión previa: **BOB existe**
(ADR-0012, Strapi 5 + PostgreSQL 17) y es el dueño de la identidad de cada copropiedad y de sus
dos perfiles raíz (docs/13 §1). Con eso, el primer módulo de BLOKY —el ingreso— ya tiene de dónde
leer quién puede entrar, y el entorno de desarrollo (ADR-0011) tiene dónde correr.

Lo que el backend tiene que cumplir:

- **Leer BOB sin escribirlo.** La copropiedad, la persona y su asignación (Administrador o
  Delegado) nacen en BOB. BLOKY los consulta; nunca los crea ni los cambia.
- **Compartir las reglas del dominio en TypeScript.** El demo las tiene en `dominio/reglas.ts`
  como funciones puras (RN-01…RN-97). El backend real debe poder reutilizar esa forma, no
  reescribirla en la configuración de una herramienta.
- **Crecer aparte de BOB.** Cartera, asambleas, residentes y sanciones son de las copropiedades,
  no del back office de la empresa. Mezclarlos en el mismo proceso confunde dos productos que la
  documentación separa con cuidado.
- **Entrar en el contrato del entorno** (`infra/nuevo-servicio.md`): un pod, nginx al frente,
  `/salud` y `/revision.txt`, sin root, sin secretos en la imagen.

## Decisión

**Una API propia para BLOKY en `apps/bloky-api/`: Node 22 + TypeScript + Fastify, con su
propia base PostgreSQL 17 (`bloky`) en su propio pod.** Lee BOB por la API REST de Strapi con
un **token de solo lectura**. Las reglas de negocio viven en `src/dominio/reglas.ts` como
funciones puras numeradas (RN-160 en adelante, rango de la integración). Los datos propios
pasan por un repositorio con dos adaptadores (memoria y PostgreSQL, ADR-0003). Las
migraciones son SQL y se aplican al arrancar.

**Dependencias** (las cuatro de producción): `fastify` (HTTP), `@fastify/cookie` (la cookie de
sesión), `pg` (PostgreSQL) y `jose` (JWT y verificación de los tokens de Google y Microsoft).
Twilio se llama por su API REST con `fetch`: no hace falta el SDK para dos peticiones.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Rutas personalizadas dentro de Strapi (BOB)** | Sin servicio nuevo, sin base nueva; lo más rápido para el ingreso | BLOKY entero (cartera, asambleas, residentes) terminaría viviendo dentro del back office de la empresa; las reglas quedan atadas al ciclo de vida de Strapi; «BOB no guarda datos de residentes» dejaría de ser cierto | Descartada |
| **Una segunda instancia de Strapi para BLOKY** | Separa los productos; el equipo ya conoce Strapi | Las reglas de negocio quedan en la configuración de Strapi y no en TypeScript compartido con el demo; el modelo de cartera y asambleas es demasiado específico para un CMS | Descartada |
| **API propia (Node + TypeScript + Fastify) con PostgreSQL** | Reglas puras en TypeScript, como el demo; BLOKY crece solo; entra tal cual en el contrato del entorno; cuatro dependencias | Más trabajo inicial: sesiones, migraciones y despliegue propios | **Elegida** |
| **Un framework grande (NestJS)** | Estructura impuesta | Muchas dependencias y una curva que el equipo no necesita para una API pequeña | Descartada |

## Consecuencias

**Lo que se vuelve fácil:** agregar un módulo es agregar rutas, reglas y una migración.
Probar sin red: el repositorio en memoria y un BOB de mentira (`pruebas/humo.ts`). Cambiar de
motor a BOB mañana: solo `src/bob/cliente.ts`.

**Lo que hay que cuidar:**

- **BOB es la fuente de identidad.** Si un dato de persona está mal en BOB, está mal en BLOKY.
  BLOKY no ofrece corregirlo: manda a `operaciones@idiky.com`.
- **El token de BOB es de solo lectura** y se crea a mano en el panel de BOB. Se guarda en
  `~/.config/idiky/secretos/bloky-api.env`, nunca en el repositorio.
- **Google y Microsoft exigen HTTPS** para el retorno del ingreso. Mientras BLOKY Dev viva en
  `http://<ip>:8083`, esos dos canales solo funcionan en local (`http://localhost`); en el
  servidor se ofrece el código por SMS. Darle dominio y certificado a BLOKY es un tema del
  entorno (ADR-0011 §6, lo no resuelto) y no de este ADR.
- **Las reglas se duplican a propósito** entre el demo (`apps/pwa/src/dominio`) y esta API
  cuando un módulo del demo pase a BLOKY. La definición que manda sigue siendo
  `docs/05-modelo-de-datos.md`. El paquete compartido `packages/dominio` que preveía
  `docs/06 §6` se creará cuando haya dos consumidores reales del mismo código.
