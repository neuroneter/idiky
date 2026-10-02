# ADR-0013 — BLOKY Dev se construye aparte del demo, módulo por módulo

- **Estado:** Aceptada
- **Fecha:** 2026-09-21
- **Tarea:** T-75

## Contexto

El demo (`apps/pwa/`, v0.1) tiene 70 casos de uso documentados y 38 en pantalla, todo sobre
datos simulados en el navegador. Es la maqueta con la que Mary y Jeimy validan el producto, y
tiene que seguir siéndolo: **no puede romperse ni frenarse** porque empiece el producto real.

Al mismo tiempo, BLOKY (el sistema de las copropiedades) empieza hoy con backend real,
identidad en BOB y una base de datos. Convertir el demo en BLOKY «en el sitio» obligaría a
mezclar lo simulado con lo real en la misma app, y a que cada cambio de BLOKY pasara por la
maqueta de Mary.

## Decisión

**BLOKY Dev es una aplicación nueva, `apps/bloky/`, con su API `apps/bloky-api/`
(ADR-0008). Se construye de cero, sobre los casos de uso ya documentados, y solo entra lo
que se va desarrollando.** El demo no se toca.

Qué se trae del demo y cómo:

| Se trae | Cómo |
|---|---|
| Los **casos de uso** y las **reglas** (`docs/04`, `docs/05`) | Son el contrato. BLOKY los implementa contra datos reales; la maqueta sigue mostrándolos con datos simulados |
| La **identidad visual** (`tokens.css`) y el **logotipo** | Copiados tal cual a `apps/bloky/src/`. Un solo diseño para BOB, BLOKY y ALICE |
| **Componentes** puntuales, cuando hagan falta | Se copian a `apps/bloky/src/componentes/` y se adaptan. **Nunca se importa desde `apps/pwa`** |

Qué **no** se trae: las pantallas del demo, la semilla, `localStorage`, la selección de perfiles
del demo (ADR-0004). BLOKY tiene puerta real desde el primer día.

Nomenclatura: los casos de uso propios de BLOKY llevan el ámbito **`B`** (`CU-B-NN`), del rango
de la integración. Cuando un caso de uso del demo (`CU-A-NN`) se implemente en BLOKY, conserva
su identificador y el catálogo anota en qué producto está.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Evolucionar el demo hasta que sea BLOKY** (cambiar el adaptador local por el de API, ADR-0003) | Era el plan de `docs/06 §6`; no se reescribe nada | Mezcla lo simulado con lo real; cada cambio de BLOKY toca la maqueta de Mary; el demo dejaría de servir para validar | Descartada para ahora. Sigue siendo posible pantalla por pantalla, copiando |
| **Copiar el demo entero y empezar a conectarlo** | Arranque con todas las pantallas | Se heredan 38 pantallas sobre datos que no existen y una puerta simulada; lo que no funcione parece roto | Descartada |
| **App nueva, módulo por módulo** | Lo que hay funciona de verdad; el demo sigue intacto; cada módulo llega con su backend | Durante meses BLOKY va a tener menos pantallas que el demo | **Elegida** |

## Consecuencias

- **Dos apps con la misma identidad visual**: `tokens.css` está copiado. Si Mary cambia un
  color en el demo, hay que copiarlo a BLOKY (o al revés). Es el costo aceptado hasta que
  exista un paquete compartido.
- **La maqueta y BLOKY se despliegan por separado**: `pwa` (8080) y `bloky` (8083). Mary sigue
  publicando su maqueta como hasta hoy.
- **El primer módulo es el ingreso** (CU-B-01), porque obliga a definir de una vez cómo se
  relacionan BOB y BLOKY. El interior está vacío a propósito.
