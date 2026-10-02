# ADR-0017 — Un repositorio por sistema, e `idiky` como el arnés de todos

- **Estado:** Aceptada
- **Fecha:** 2026-10-02
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** [ADR-0008](./0008-backend-de-bloky.md), [ADR-0011](./0011-entorno-de-desarrollo-en-contenedores.md),
  [ADR-0012](./0012-sistema-de-gestion-strapi.md), [ADR-0013](./0013-bloky-dev-separada-del-demo.md),
  [ADR-0016](./0016-jitsi-propio-para-las-asambleas-virtuales.md), T-79
- **El mapa vigente:** [`docs/16-mapa-de-repositorios.md`](../16-mapa-de-repositorios.md)

## Contexto

Hasta el 2026-10-02 todo vivía en `idiky`: la documentación, los dos demos (`apps/pwa`,
`apps/contable`), BOB (`apps/gestion`), BLOKY Dev (`apps/bloky`, `apps/bloky-api`) y la
infraestructura de cada uno, incluido Jitsi (`infra/jitsi`, ADR-0016).

Entre el 26 de septiembre y el 2 de octubre se crearon cinco repositorios, uno por sistema:

| Repositorio | Sistema |
|---|---|
| `App-Idiky` | **ALICE**, la app del propietario y residente, en Flutter |
| `SmartContrat-Idiky` | Los contratos inteligentes (login ERC-4337 sobre Polygon, Foundry) |
| `Jitsi-Streaming-Idiky` | Jitsi, el video de las asambleas virtuales |
| `Bloky-Idiky` | **BLOKY**, el sistema de las copropiedades (app + API) |
| `BOB-Idiky` | **BOB**, el *back office* de IDIKY en Strapi |

Dos ya tenían código propio que **no** estaba en `idiky` (ALICE en Flutter y los contratos), y
tres estaban vacíos mientras su código seguía aquí. Ningún documento de `idiky` los nombraba.

## Decisión

**Cada sistema vive en su repositorio. `idiky` es el arnés de todos**: la documentación de
producto (visión, glosario, actores, casos de uso, modelo de datos y reglas `RN-xx`), los ADR,
la bitácora y el tablero, los prototipos, los dos demos y la orquestación del entorno de
desarrollo. **Un repositorio de sistema no redefine reglas ni casos de uso**: los implementa y
enlaza aquí.

Lo que se mudó el 2026-10-02, **con las mismas rutas que tenía aquí**:

| Desde `idiky` | A | Historial |
|---|---|---|
| `apps/bloky/`, `apps/bloky-api/`, `infra/bloky/` | `Bloky-Idiky` | Conservado (`git filter-repo`, 18 commits) |
| `apps/gestion/`, `infra/gestion/` | `BOB-Idiky` | Conservado (`git filter-repo`, 13 commits) |
| `infra/jitsi/` | `Jitsi-Streaming-Idiky` | Un commit: nunca se publicó con historia propia |

Lo que se queda en `idiky`: `docs/`, `apps/pwa/` (demo de Mary), `apps/contable/` (Jeimy),
`infra/desplegar.sh`, `infra/servidor/`, `infra/pwa/`, `infra/contable/`, `infra/tunel/` y las
guías del entorno.

### Por qué las mismas rutas

El entorno se despliega armando **una carpeta** y corriendo `infra/servidor/levantar.sh` sobre
ella (ADR-0011). Si cada repositorio conserva las rutas que tenía, `desplegar.sh` solo tiene que
poner su código encima de la copia de `idiky` y `levantar.sh` no cambia. Se comprobó el
2026-10-02: lo que llega al servidor es idéntico, archivo por archivo, a lo que llegaba antes
(salvo los enlaces de los README, que ahora apuntan a `idiky` en GitHub).

### Cómo se despliega ahora

- `pwa`, `contable` y `tunel`: igual que antes, desde `idiky`.
- `bloky`, `gestion` y `jitsi`: `desplegar.sh` trae su repositorio de GitHub a una copia sin
  carpeta de trabajo (`~/.cache/idiky/repos/`) y publica **su `origin/main`**, o el commit que
  se pida con `IDIKY_REF_BLOKY`, `IDIKY_REF_GESTION` o `IDIKY_REF_JITSI`. El candado de BOB
  (solo desde `main`, porque Strapi borra lo que el código no tenga) se aplica al `main` de
  `BOB-Idiky`.
- La revisión publicada nombra los dos commits: `549fc7e.bloky-f33796e`.
- Desplegar `pwa` o `contable` **no toca** los repositorios externos: Mary y Jeimy no necesitan
  acceso a ellos.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Todo en `idiky`** (como estaba) | Un solo lugar; despliegue simple | Los repos de ALICE y de contratos ya existían fuera; mezcla permisos (Mary y Jeimy ven BOB y BLOKY) y ciclos de vida distintos | Descartada: ya no es la realidad |
| **Submódulos de git** | `idiky` fija la versión de cada sistema | Las personas no ingenieras se pierden con submódulos; cada cambio en un sistema exige un commit en `idiky` | Descartada |
| **Mudar con rutas nuevas** (p. ej. `app/` y `api/` en la raíz) | Repositorios más limpios | Obliga a reescribir `levantar.sh`, los Containerfile y las guías el mismo día | Descartada por ahora; se puede hacer después, repo por repo |
| **Mudar con las mismas rutas, y desplegar armando la carpeta** | `levantar.sh` intacto; historial conservado; probado idéntico | Repos con `apps/…` en la raíz, algo raro a primera vista | **Elegida** |

## Consecuencias

- **El código de BLOKY y BOB ya no se edita en `idiky`.** Cada cambio va en su repositorio, con
  su rama y su `main`. Los casos de uso, las reglas y los ADR **siguen aquí**.
- Cada repositorio de sistema tiene un `CLAUDE.md` que manda a leer `idiky` primero.
- Las rutas `apps/bloky…`, `apps/gestion…` e `infra/{bloky,gestion,jitsi}` que aparecen en la
  bitácora y en ADR anteriores son historia: hoy se leen como rutas **dentro de su repositorio**.
- Los secretos de BOB, BLOKY y Jitsi se crean con el `secretos.sh` de **su** repositorio.
- Quedan sin ADR dos decisiones que ya se tomaron fuera de `idiky`: **Flutter para ALICE**
  (contradice ADR-0001/0002, que dicen React + Capacitor) y **contratos inteligentes en
  Polygon** (T-80 y T-81).
