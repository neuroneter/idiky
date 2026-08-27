# Registro de decisiones de arquitectura (ADR)

Un ADR documenta **una decisión técnica relevante y por qué se tomó**, para que nadie —
persona o IA — tenga que reconstruir el razonamiento más adelante.

| # | Decisión | Estado |
|---|---|---|
| [0001](./0001-stack-tecnologico.md) | Stack del demo: React + TypeScript + Vite, sin librería de UI | Aceptada |
| [0002](./0002-estrategia-multiplataforma.md) | Una sola base web envuelta con Capacitor para Android e iOS | Aceptada |
| [0003](./0003-capa-de-datos.md) | Capa de datos con adaptadores intercambiables | Aceptada |
| [0004](./0004-autenticacion-demo.md) | Sin autenticación real en el demo: selección de perfil | Aceptada |
| [0005](./0005-codigo-qr-sin-dependencias.md) | Generación del QR de visitantes sin dependencias externas | Aceptada |
| [0006](./0006-stack-aplicacion-contable.md) | La aplicación contable se construye sin compilación: HTML, CSS y JS | Aceptada |

**Plantilla:**

```markdown
# ADR-NNNN — Título

- **Estado:** Propuesta | Aceptada | Reemplazada por ADR-XXXX
- **Fecha:** AAAA-MM-DD

## Contexto
Qué problema o restricción obliga a decidir.

## Decisión
Qué se decidió, en una frase.

## Alternativas consideradas
| Opción | A favor | En contra | Veredicto |

## Consecuencias
Qué se vuelve fácil y qué se vuelve difícil a partir de ahora.
```
