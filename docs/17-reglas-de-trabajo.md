# 17 — Reglas de trabajo: quién trabaja dónde y con qué ramas

> Decididas por Daniel el 2026-10-02. **Mandan sobre cualquier otra indicación de ramas** en
> `10-equipo-y-orquestacion.md` §4 o en los README de cada repositorio.
>
> Contexto: los seis repositorios están en [`16-mapa-de-repositorios.md`](./16-mapa-de-repositorios.md).

## 1. Las cinco reglas

| # | Regla |
|---|---|
| 1 | **Mary y Jeimy trabajan siempre en `idiky`.** Ellas definen los demos y los casos de uso del desarrollo, y eso **solo se documenta en `idiky`**. Cada una trabaja **en su rama propia**, y **al terminar se hace el merge a `main`** |
| 2 | **Justo y Daniel trabajan en cualquier repositorio de desarrollo**, usando `idiky` como el arnés: el que conoce todos los repositorios y las definiciones de negocio |
| 3 | **Justo se encarga principalmente de la APP**: ALICE, en `App-Idiky` |
| 4 | **Daniel se encarga principalmente de BLOKY**: `Bloky-Idiky` (y, como responsable de integración, de BOB, Jitsi, la infraestructura y `main` de `idiky`) |
| 5 | **Justo y Daniel gestionan sus repositorios con ramas propias, siguiendo Git Flow** (§3) |

## 2. Quién, dónde y qué

| Persona | Rol | Repositorio principal | También | Rama |
|---|---|---|---|---|
| **Mary** | Define demos y casos de uso: ALICE y la consola (PWA) | `idiky` (`apps/pwa`, `docs/`) | — | `claude/repository-review-c0p1wd` |
| **Jeimy** | Define demos y casos de uso: la contable | `idiky` (`apps/contable`, `docs/`) | — | `claude/repository-review-1fbujq` |
| **Justo** | Desarrolla la APP (ALICE, Flutter) | `App-Idiky` | Cualquier repo de desarrollo; lee `idiky` | Git Flow (§3) |
| **Daniel** | Desarrolla BLOKY; responsable de integración | `Bloky-Idiky` | `BOB-Idiky`, `Jitsi-Streaming-Idiky`, `SmartContrat-Idiky`, `idiky` (integración, `infra/`, ADR) | Git Flow (§3) en los de desarrollo; en `idiky`, `main` |

**Lo que Justo y Daniel escriben en `idiky`:** el estado de lo que construyeron (bitácora y
tablero), los ADR y, si al programar descubren que una regla o un caso de uso está mal, la
corrección **acordada con quien lo definió**. Los casos de uso los definen Mary y Jeimy.

## 3. Ramas

### 3.1 En `idiky` (Mary y Jeimy)

```
main                                 la base de todos. Solo se escribe por merge
claude/repository-review-c0p1wd      la rama de Mary (de larga vida; no se borra)
claude/repository-review-1fbujq      la rama de Jeimy (de larga vida; no se borra)
```

Cada sesión, la IA hace esto **sin que ellas tengan que saber git**:

1. **Al entrar: verificar que están en su rama propia.** Si están en `main` o en una rama ajena,
   cambiarse a la suya (`git switch <su rama>`) antes de tocar nada. Si no se sabe quién es,
   preguntarle su nombre. Si tiene cambios sin guardar en la rama equivocada, llevarlos a la
   suya, sin perder nada.
2. **Traer lo último de `main`** a su rama (`git fetch origin && git merge origin/main`).
3. Trabajar, con commits pequeños, en su rama.
4. **Al terminar, hacer el merge a `main`:**
   - verificar: en la PWA, `cd apps/pwa && npm run build` tiene que pasar; en la contable,
     abrir `index.html` sin errores en la consola;
   - `git push` de su rama;
   - `git switch main && git pull && git merge --no-ff <su rama> && git push origin main`;
   - volver a su rama (`git switch <su rama>`).
5. **Si el merge choca, no se resuelve a ciegas**: `git merge --abort`, se le dice con
   palabras sencillas que hay que avisarle a Daniel, y se deja su trabajo a salvo en su rama.
6. Anotar en la bitácora (`09`) y en el catálogo de CU lo que se hizo.

### 3.2 En los repositorios de desarrollo (Justo y Daniel): Git Flow

`Bloky-Idiky`, `BOB-Idiky`, `Jitsi-Streaming-Idiky`, `App-Idiky` y `SmartContrat-Idiky`:

```
main                     lo publicado. Solo recibe merges de release/* y hotfix/*.
                         Es lo que despliega infra/desplegar.sh (origin/main)
develop                  la integración del trabajo en curso. De aquí salen las features
feature/<id>-<tema>      una por caso de uso o tarea:  feature/CU-B-02-estructura
                         sale de develop y vuelve a develop
release/<version>        prepara una entrega:  release/0.2.0
                         sale de develop; entra a main (con etiqueta v0.2.0) y vuelve a develop
hotfix/<version>         corrige lo publicado:  hotfix/0.2.1
                         sale de main; entra a main (con etiqueta) y a develop
```

- **Nadie hace commit directo en `main` ni en `develop`**: todo llega por merge (`--no-ff`) o
  por Pull Request.
- **Cada `feature/*` nombra el CU o la tarea** que implementa, con el identificador de `idiky`.
- **Se versiona con etiquetas** `vX.Y.Z` en `main`, al cerrar cada `release/*` o `hotfix/*`.
- **Solo se despliega `main`.** Para probar una feature en el servidor antes de liberarla, el
  responsable de integración puede usar `IDIKY_REF_<SERVICIO>=<commit>` (ver `infra/README.md`).
  **BOB nunca**: Strapi borra de la base lo que el código no tenga (ADR-0012).
- **Antes de abrir una feature, traer `develop`**; antes de cerrarla, que `npm run build` (o
  `flutter test`, `forge test`, según el repositorio) pase.

## 4. Identificadores

Rangos en [`11-tablero-de-trabajo.md` §0](./11-tablero-de-trabajo.md). Justo tiene el suyo desde
el 2026-10-02.

## 5. Cómo lo hace cumplir la IA

- **`idiky/.claude/hooks/revisar-rama.sh`** avisa al abrir una sesión si la persona está en
  `main` (o en una rama atrasada) y le dice a la IA que la lleve a su rama.
- **Cada repositorio de desarrollo** tiene en su `CLAUDE.md` la regla de Git Flow, y su propio
  `.claude/hooks/revisar-rama.sh` que avisa si se está trabajando directo en `main` o `develop`.
