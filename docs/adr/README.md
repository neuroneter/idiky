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
| [0006](./0006-documentos-formales.md) | **Documentos formales:** se generan en el servidor, con HTML y CSS; se guardan con su huella y se verifican sin la app | Aceptada |
| [0007](./0007-transmision-en-vivo.md) | **La transmisión la pone un tercero, no Idiky**: se enlaza la reunión que la copropiedad ya hace por Zoom o Meet. Lo insustituible es la asistencia ponderada, no el video | Aceptada |
| [0008](./0008-backend-de-bloky.md) | **El backend de BLOKY**: una API propia (Node 22 + TypeScript + Fastify) con PostgreSQL, que lee BOB con un token de solo lectura y nunca lo escribe | Aceptada |
| [0009](./0009-soportes-fotograficos.md) | **Soportes fotográficos** del registro de personas: se capturan con HTML de siempre, se reducen y se guardan en el navegador. Lo difícil no es la foto, es el dato | Aceptada |
| [0010](./0010-stack-aplicacion-contable.md) | **La aplicación contable se construye sin compilación**: HTML, CSS y JS que se abren con doble clic, porque quien la desarrolla no puede instalar nada | Aceptada |
| [0011](./0011-entorno-de-desarrollo-en-contenedores.md) | **Entorno de desarrollo en contenedores**: Podman sin root, un contenedor por producto y un usuario propio, en un servidor compartido cuyo otro servicio no puede verse afectado | Aceptada |
| [0012](./0012-sistema-de-gestion-strapi.md) | **BOB, el back office de IDIKY**: Strapi 5 (MIT) con PostgreSQL 17. Se prefirió a Directus por la licencia; la auditoría, que Strapi Community no trae, se construye como módulo propio | Aceptada |
| [0013](./0013-bloky-dev-separada-del-demo.md) | **BLOKY Dev se construye aparte del demo**, módulo por módulo: app nueva con backend real; del demo se traen los casos de uso, las reglas y la identidad visual, no las pantallas | Aceptada |
| [0014](./0014-https-para-bloky-dev-con-tunel-de-cloudflare.md) | **HTTPS y dominio para BLOKY Dev con un túnel de Cloudflare** (`https://bloky-dev.idiky.com`): sin abrir puertos ni tocar Azure; el DNS de `idiky.com` pasa a Cloudflare. Es lo que enciende el ingreso con Google y Microsoft | Aceptada |
| [0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md) | **La capa de datos de BLOKY: un esquema de PostgreSQL por copropiedad**, estructuralmente idéntico, aprovisionado desde BOB con un botón; retirar es lo normal y eliminar la excepción con código al superadministrador | Aceptada |

El ADR-0008 (backend) se escribió el 2026-09-21, con el ingreso a BLOKY. Recuerden la regla
del [`CLAUDE.md`](../../CLAUDE.md): no se agregan dependencias sin ADR.

> **Nota de integración (2026-09-10).** El ADR de la aplicación contable nació como 0006 en la
> rama de Jeimy, al mismo tiempo que el 0006 de documentos formales en la rama de Mary. Al
> integrar se le asignó el 0010; el 0008 sigue reservado para el backend.

Vale la pena notar que **ADR-0007 terminó decidiendo que no hace falta ninguna dependencia**:
enlazar una reunión de Zoom o Meet es un enlace, no un SDK. La decisión que parecía la más cara
resultó la más barata.

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
