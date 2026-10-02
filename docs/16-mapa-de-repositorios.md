# 16 — Mapa de repositorios

> `idiky` es **el arnés**: aquí están las reglas, los casos de uso, las decisiones y los demos
> con los que se entiende lo que se construye. Cada sistema vive en su propio repositorio
> ([ADR-0018](./adr/0018-un-repositorio-por-sistema-e-idiky-como-arnes.md)).
>
> **Si vienes de otro repositorio:** lee primero este archivo, después
> [`09-estado-del-proyecto.md`](./09-estado-del-proyecto.md) y el caso de uso que vas a tocar.

Todos están en GitHub, en la cuenta `neuroneter`. En la máquina del responsable de integración
viven juntos en `~/Documents/WorkSapce/`.

## 1. Los seis repositorios

| Repositorio | Sistema | Qué contiene | Stack | Visibilidad | Estado (2026-10-02) |
|---|---|---|---|---|---|
| [`idiky`](https://github.com/neuroneter/idiky) | **El arnés** | Documentación de producto, casos de uso, reglas `RN-xx`, ADR, bitácora, tablero, prototipos · demo `apps/pwa` (Mary) · contable `apps/contable` (Jeimy) · orquestación del entorno (`infra/desplegar.sh`, `infra/servidor/`) | Markdown · React + Vite · HTML/JS sin compilar | Pública | Activo |
| [`Bloky-Idiky`](https://github.com/neuroneter/Bloky-Idiky) | **BLOKY**, el sistema de las copropiedades | `apps/bloky/` (la app), `apps/bloky-api/` (la API), `infra/bloky/` (su pod) | React + Vite · Node 22 + Fastify + PostgreSQL ([ADR-0008](./adr/0008-backend-de-bloky.md)) | Privada | Mudado desde `idiky` con su historial. Hecho: el ingreso (CU-B-01) |
| [`BOB-Idiky`](https://github.com/neuroneter/BOB-Idiky) | **BOB**, el *back office* de IDIKY | `apps/gestion/` (Strapi), `infra/gestion/` (su pod y su respaldo) | Strapi 5 + PostgreSQL 17 ([ADR-0012](./adr/0012-sistema-de-gestion-strapi.md)) | Privada | Mudado desde `idiky` con su historial. En el entorno en el 8082 |
| [`Jitsi-Streaming-Idiky`](https://github.com/neuroneter/Jitsi-Streaming-Idiky) | **Jitsi**, el video de las asambleas virtuales | `infra/jitsi/` (pod de cinco contenedores) | Imágenes oficiales de Jitsi + nginx ([ADR-0016](./adr/0016-jitsi-propio-para-las-asambleas-virtuales.md)) | Privada | Mudado desde `idiky`. **Sin desplegar**: falta `10000/udp` en Azure (T-78) |
| [`App-Idiky`](https://github.com/neuroneter/App-Idiky) | **ALICE**, la app del propietario y residente | Proyecto Flutter (`lib/`, `android/`, `ios/`…) | Flutter + Dart 3 | Privada | Plantilla recién creada: aún no hay pantallas. Su referencia de producto es el demo `apps/pwa` (rutas `/app/...`) y los CU-R |
| [`SmartContrat-Idiky`](https://github.com/neuroneter/SmartContrat-Idiky) | **Contratos inteligentes** | `contracts/login/` (cuentas ERC-4337, fábrica, *paymaster*), pruebas, `docs/SEGURIDAD.md` | Solidity 0.8 + Foundry · Polygon PoS / Amoy | Privada | Login con cuentas ERC-4337: Idiky paga el gas, salida a direcciones externas con doble firma. Pendientes KMS, multisig y auditoría |

## 2. Cómo se relacionan

```
                         ┌───────────────────────────────────────────┐
                         │  idiky — el arnés                         │
                         │  casos de uso · RN-xx · ADR · bitácora    │
                         │  demos: apps/pwa · apps/contable          │
                         │  entorno: infra/desplegar.sh · servidor/  │
                         └──────┬──────────┬──────────┬──────────────┘
             implementan CU-R   │  CU-B    │  BOB     │  ADR-0016
                ┌───────────────┘          │          │          └───────────────┐
                ▼                          ▼          ▼                          ▼
        App-Idiky (ALICE)  ──API──▶  Bloky-Idiky  ──lee──▶  BOB-Idiky     Jitsi-Streaming-Idiky
        Flutter                      app + API     token     Strapi        video de asambleas
                │                    PostgreSQL    solo                        ▲
                │                        │         lectura                     │
                └──── login ─────▶  SmartContrat-Idiky                BLOKY creará la sala
                      (ERC-4337)    Polygon                          (pendiente, otro CU)
```

- **BOB crea, BLOKY lee.** La copropiedad y sus perfiles raíz nacen en BOB; BLOKY los lee con
  un token de solo lectura ([ADR-0008](./adr/0008-backend-de-bloky.md), [`13`](./13-bob-copropiedades-y-contratos.md)).
- **ALICE hablará con la API de BLOKY.** Hoy no hay integración: la app es una plantilla.
- **Los contratos inteligentes** cubren el login invisible de ALICE. Qué otro caso de uso los
  pide (votos, actas) no está decidido: su principio es *on-chain solo lo necesario*.
- **Jitsi** se integrará con BLOKY al convocar asambleas virtuales; eso es otro caso de uso.

## 3. Qué va dónde

| Si vas a… | Va en |
|---|---|
| Escribir o cambiar un caso de uso, una regla `RN-xx`, el modelo de datos o el glosario | `idiky/docs/` — **siempre aquí, nunca en el repo del sistema** |
| Tomar una decisión de arquitectura (ADR) | `idiky/docs/adr/`, aunque afecte a un solo sistema |
| Anotar qué se hizo en la sesión | `idiky/docs/09-estado-del-proyecto.md` y el tablero (`11`) |
| Programar BLOKY (app o API) | `Bloky-Idiky` |
| Cambiar el modelo de Strapi o el panel de BOB | `BOB-Idiky` |
| Ajustar Jitsi | `Jitsi-Streaming-Idiky` |
| Programar ALICE | `App-Idiky` |
| Escribir un contrato | `SmartContrat-Idiky` |
| Probar una idea con datos simulados para conversarla | El demo (`idiky/apps/pwa`) o un prototipo (`idiky/docs/prototipos/`) |
| Cambiar cómo se despliega o qué hay en el servidor | `idiky/infra/` (orquestación) y el `infra/<servicio>/` del repo del sistema (su pod) |

**Las reglas se implementan en el repositorio de cada sistema, pero se definen aquí.** Si al
programar descubres que una regla está mal, se corrige primero en
[`05-modelo-de-datos.md`](./05-modelo-de-datos.md) y después en el código.

## 4. Identificadores

Los identificadores son **uno solo para todos los repositorios**: un `RN-xx`, un `CU-X-NN`, un
`T-xx` o un `ADR-NNNN` se toma del rango reservado en
[`11-tablero-de-trabajo.md` §0](./11-tablero-de-trabajo.md), lo use quien lo use. Los commits
de cada repositorio citan el CU o la tarea igual que aquí (`docs/08-convenciones.md`).

## 5. Desplegar

`infra/desplegar.sh` sigue siendo el único punto de entrada. Para `bloky`, `gestion` y `jitsi`
trae el `origin/main` de su repositorio y lo pone encima de la copia de `idiky`
([ADR-0018](./adr/0018-un-repositorio-por-sistema-e-idiky-como-arnes.md), [`infra/README.md`](../infra/README.md)).
ALICE y los contratos no se despliegan en el entorno de desarrollo.
