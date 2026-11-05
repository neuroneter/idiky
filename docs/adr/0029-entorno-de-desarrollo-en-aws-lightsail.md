# ADR-0029 — El entorno de desarrollo se muda a AWS Lightsail

- **Estado:** Aceptada (2026-11-01, responsable de integración). Reemplaza la parte de
  [ADR-0011](./0011-entorno-de-desarrollo-en-contenedores.md) que hablaba del servidor compartido.
- **Plan y bitácora de la mudanza:** [`infra/migracion-a-aws.md`](../../infra/migracion-a-aws.md).

## Contexto

Desde el 2026-09 el entorno de desarrollo vivía como usuario `idiky` en una VM de Azure prestada
por otro proyecto, compartida con LangFlow. Eso obligaba a trabajar sin root, con techo de memoria
pensado para no afectar al vecino, con la foto de `verificar-vecino.sh` antes y después de todo, y
con cada puerto pidiéndose a mano en el grupo de seguridad de red de una suscripción que el equipo no
administra. Nunca se pudo probar un reinicio real.

## Decisión

El entorno pasa a **una instancia propia de AWS Lightsail**:

| | |
|---|---|
| Instancia | `idiky-dev`, Virginia (`us-east-1a`): la región más rápida medida desde Colombia (~103 ms) |
| Plan | Linux con IPv4, **4 GB · 2 vCPU · 80 GB · 4 TB**, 24 USD al mes. Se eligió sobre el de 8 GB por ahorro |
| Sistema | Ubuntu 22.04, igual que antes: Podman 3.4.4 y todo lo ya probado |
| Memoria | **Swap de 4 GB obligatorio**; techo de `idiky` en 3,5 GB y sin techo de CPU (`preparar-servidor.sh` con `IDIKY_TECHO_MEMORIA`, `IDIKY_TECHO_CPU`, `IDIKY_SWAP_GB`) |
| Red | IP estática. Firewall de Lightsail: **TCP 22, TCP 8080-8085 y UDP 10000**; el 80 cerrado |
| Respaldos | Instantáneas automáticas diarias (1:00, hora de Colombia), se guardan 7 |

**Lo que no cambia:** el usuario `idiky` sin root, Podman, `desplegar.sh`, `levantar.sh`, los puertos
de cada servicio y los nombres públicos (`bloky-dev`, `bob-dev`, `jitsi-dev`), que siguen por el túnel
de Cloudflare: solo se mudó su conector. **La IP no se escribe en el repositorio**, que es público:
se comparte por canal privado.

## Consecuencias

- **Ya no hay vecino:** `verificar-vecino.sh` deja de ser un paso del despliegue. Se conserva solo
  como historia del servidor de Azure.
- **Se puede reiniciar:** el 2026-11-01 se reinició la instancia y volvió todo solo.
- **Los puertos nuevos** (8086-8099) se abren en el firewall de Lightsail, no en Azure.
- **Si 4 GB no alcanzan**, se pasa al plan de 8 GB desde una instantánea: es otra instancia, y la IP
  estática se mueve a ella.
- **Pendientes:** respaldo diario de BLOKY y corregir `respaldo.sh` de BOB (volcar con
  `pg_dump -f` y `podman cp`: por la salida de `podman exec` el volcado se corta sin error).
