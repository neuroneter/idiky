# ADR-0002 — Estrategia multiplataforma (PWA → Android → iOS)

- **Estado:** Aceptada
- **Fecha:** 2026-08-26

## Contexto

El producto debe existir como PWA, app Android y app iOS. Mantener tres bases de código con
un equipo pequeño no es viable.

## Decisión

**Una sola base de código web.** La PWA es el producto base; Android e iOS se generan
envolviendo el mismo build con **Capacitor** en la fase 3.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| Capacitor sobre el build web | Un solo código, acceso a APIs nativas por plugins | Rendimiento inferior a nativo en animaciones pesadas | **Elegida** |
| Apps nativas separadas | Máximo rendimiento | Triplica el costo | Descartada |
| Solo PWA | Más simple | iOS limita push e instalación; no hay presencia en tiendas | Descartada |

## Consecuencias

Restricciones que asumimos **desde ahora**, aunque las apps nativas lleguen en la fase 3:

1. Ninguna funcionalidad depende de una API exclusiva del navegador sin alternativa nativa.
2. Las capacidades del dispositivo (cámara, push, biometría, compartir) se consumirán a
   través de una interfaz propia `servicios/plataforma.ts` con dos implementaciones (web y
   nativa). Hoy no existe porque ninguna funcionalidad la necesita todavía.
3. El diseño es móvil primero; la consola de administración es el único módulo pensado para
   escritorio y **no se empaqueta** en las apps nativas.
4. Las rutas usan historial de navegador estándar, compatible con el WebView de Capacitor.
