# Plan de migración del entorno de desarrollo a AWS Lightsail

> **Estado: ejecutado el 2026-11-01.** El entorno corre en AWS Lightsail ([ADR-0029](../docs/adr/0029-entorno-de-desarrollo-en-aws-lightsail.md))
> y todo lo de IDIKY salió de Azure, con LangFlow intacto. Este documento queda como registro de
> cómo se hizo; lo vigente está en [`README.md`](./README.md).
>
> Las direcciones van en variables porque este repositorio es público y la del servidor no se
> escribe aquí ([`README.md`](./README.md) §4).

## 1. Qué hay hoy

| Servicio | Pod / contenedor | Puerto | Revisión publicada | Datos que persisten |
|---|---|---|---|---|
| PWA | `idiky-pwa` | 8080 | `d6e05f2` | Ninguno |
| Contable | `idiky-contable` | 8081 | `973061c` | Ninguno |
| BOB | pod `idiky-gestion` | 8082 | `4a4b4f3.gestion-4352d33` | `~/datos/gestion/postgres` (68 MB; base `gestion`, 13 MB, 55 tablas) · `uploads` (vacía, 4 KB) |
| BLOKY | pod `idiky-bloky` | 8083 | `609e326.bloky-44007e8` | `~/datos/bloky/postgres` (69 MB; base `bloky`, 14 MB, 80 tablas en 7 esquemas) |
| Jitsi | pod `idiky-jitsi` | 8085 y 10000/udp | `52c913f.jitsi-8d1a8c7` | `~/datos/jitsi/prosody` (184 KB: las cuentas) |
| Túnel | `idiky-tunel` | `/ready` en 127.0.0.1:8084 | | Ninguno |

- Los dos PostgreSQL van en la versión 17.11, solo con la extensión `plpgsql` y un único rol con
  login. Con eso, `pg_dump` lleva todo lo necesario.
- Imágenes: 4,2 GB. Se reconstruyen o se descargan, **no se migran**.
- Memoria real en uso: unos 0,8 GB. Suma de los topes: 5 GB. Construir Strapi pide 3 GB.
- Los documentos de BLOKY están en **Cloudflare R2** ([ADR-0019](../docs/adr/)): no se mudan.

### Lo que el inventario encontró y cambia el plan

| # | Hallazgo | Consecuencia |
|---|---|---|
| H1 | **BLOKY no tiene respaldo.** En el servidor solo hay respaldos de BOB | Antes de la migración, la única copia de BLOKY es la base en vivo. Se resuelve con el `pg_dump` de §2, y queda pendiente su respaldo diario (§8) |
| H2 | **BOB y BLOKY se hablan por la IP privada de Azure**, escrita en una línea de `bloky-api.env` y una de `gestion-strapi.env` | Sin cambiarla, BLOKY no lee BOB y BOB no llega al middleware (§3.5) |
| H3 | `jitsi.env` tiene la IP pública (`JVB_ADVERTISE_IPS`) | Sin cambiarla, la sala abre pero no hay audio ni video (§3.5) |
| H4 | `bloky-api.env` también menciona `10.0.2.2` en una línea | Revisado en el ensayo: es un comentario, no hay nada que cambiar |
| H5 | **Lo publicado de BLOKY sale de `develop` (`44007e8`), y `origin/main` es otro commit (`5766873`)** | Desplegar sin `IDIKY_REF_BLOKY` publicaría otro código sobre la base restaurada (§3.4) |
| H6 | Hay 8 copias viejas `bloky-api.env.antes-*` | No se migran (§2.3) |
| H7 | `authorized_keys` tiene una sola llave (`operador-idiky`) | Las llaves de Mary y Jeimy que describe la guía no están en el servidor: si van a desplegar, hay que autorizarlas en AWS (§3.2) |
| H8 | `infra/README.md` dice que Jitsi está apagado, pero está arriba hace 3 semanas | Se corrige al actualizar la documentación (§8) |

### Dos reglas que no se rompen

1. **Los secretos se copian, nunca se regeneran.** No se corre ningún `secretos.sh` en AWS: uno
   nuevo cambiaría, entre otros, `BLOKY_CLAVE_IDENTIDAD_CADENA`, que **no se cambia nunca**
   porque de ella depende la identidad de las personas en los contratos.
2. **Strapi nunca arranca sobre una base vacía ni con otro código.** Primero se restaura la base
   y después se despliega exactamente el commit que está publicado hoy.

### Variables para todos los comandos

En la terminal de quien migra (funciones, porque en zsh una variable con espacios no se separa,
`README.md` §10):

```bash
LLAVE=~/.ssh/id_rsa.pem
IP_AZURE=...            # la del servidor actual
IP_PRIVADA_AZURE=...    # hostname -I en Azure
IP_AWS=...              # la IP fija de Lightsail
IP_PRIVADA_AWS=...      # hostname -I en Lightsail
az() { ssh -i "$LLAVE" -o BatchMode=yes "idiky@$IP_AZURE" "$@"; }
aw() { ssh -i "$LLAVE" -o BatchMode=yes "idiky@$IP_AWS" "$@"; }
```

## 2. Qué se respalda y cómo

Se pasa dos veces: un **ensayo** sin parar nada, y el **pase final** con la ventana de §5. Todo
viaja por `ssh` a través de la máquina de quien migra, sin dejar copias en ella. La única
excepción es la copia de seguridad de §2.2.

Después de cualquier paso en Azure: `az 'sh -s' < infra/servidor/verificar-vecino.sh`, con su
`--base` antes del primero.

### 2.1 Las bases (`pg_dump`, formato `sql.gz`, sin dueños, igual que `respaldo.sh`)

```bash
az 'sh -s' <<'FIN'
set -eu
mkdir -m 700 -p ~/datos/migracion
cd ~/datos/migracion
for s in gestion bloky; do
  podman exec idiky-$s-postgres sh -c \
    'pg_dump -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}" --no-owner' > $s.sql.parcial
  gzip -c $s.sql.parcial > $s.sql.gz.parcial
  rm $s.sql.parcial
  mv $s.sql.gz.parcial $s.sql.gz
done
sha256sum *.sql.gz | tee sumas.txt
FIN
```

Primero el archivo y después `gzip`, para que un `pg_dump` fallido no deje un `.gz` que parece
bueno. Antes de seguir, se revisa si **dentro de los datos** quedó alguna de las dos IP de Azure
(por ejemplo, en el mapa de ubicaciones de ADR-0025 o en las configuraciones de BOB). Da cuentas,
no contenido, y debe dar 0; si no, se corrige en AWS después de restaurar:

```bash
az "for s in gestion bloky; do gunzip -c ~/datos/migracion/\$s.sql.gz | grep -cE '$IP_AZURE|$IP_PRIVADA_AZURE'; done"
```

### 2.2 Copia de seguridad fuera de los dos servidores

Por H1, se guarda una copia de `gestion.sql.gz` y `bloky.sql.gz` en la máquina de quien migra, en
una carpeta `chmod 700` fuera de cualquier repositorio. Lleva datos personales: se borra al
terminar §6.

### 2.3 Secretos, configuración y llaves

Pasan directo de un servidor al otro, sin mostrarse ni escribirse en el camino. Solo los 7
archivos vigentes; **no** van los `*.antes-*`:

```bash
az 'tar -c -C ~/.config/idiky entorno nginx secretos/bloky-api.env secretos/bloky-postgres.env \
    secretos/gestion-postgres.env secretos/gestion-strapi.env secretos/integraciones.env \
    secretos/jitsi.env secretos/tunel.env' \
  | aw 'mkdir -p -m 700 ~/.config/idiky && tar -x -p -C ~/.config/idiky'
aw 'chmod 700 ~/.config/idiky/secretos && chmod 600 ~/.config/idiky/secretos/*'
```

### 2.4 Jitsi y los archivos de BOB

`podman unshare` conserva los dueños del espacio de usuarios de los contenedores. Sin él, `tar`
no puede leer ni reponer esos archivos:

```bash
az 'podman unshare tar -c --numeric-owner -C ~/datos jitsi/prosody gestion/uploads' \
  | aw 'mkdir -p ~/datos && podman unshare tar -x -p --numeric-owner -C ~/datos'
```

## 3. Cómo se monta en Lightsail

### 3.1 La instancia (responsable de integración, en la consola de AWS)

| | |
|---|---|
| Plan | **Linux con IPv4, 24 USD al mes** (precio publicado el 2026-11-01): 4 GB de memoria, 2 vCPU, 80 GB de disco, 4 TB de transferencia. Región `us-east-1`. Daniel lo eligió sobre el de 8 GB (44 USD) para ahorrar 20 USD al mes |
| Sistema | **Ubuntu 22.04 LTS**, el mismo de hoy: trae Podman 3.4.4 y todo lo probado (`generate systemd`, slirp4netns). Si no está disponible, parar y decidir: 24.04 trae otro Podman |
| IP | Crear una **IP estática** y adjuntarla **antes** de configurar nada |
| Firewall | Abrir **TCP 8080-8085** y **UDP 10000**. Mantener **TCP 22**. Cerrar el 80 que Lightsail abre por defecto. El 8084 queda en el rango pero solo escucha en `127.0.0.1` |

**Por qué alcanza con 4 GB, y con qué condición.** El entorno usa unos 0,8 GB y necesita menos de
5 GB de disco, pero compilar Strapi llega a pedir 3 GB y en Azure se midió un pico de 4,6 GB para
todo `idiky`. Por eso el swap de §3.2 es **obligatorio**. **Si en el ensayo la compilación falla o
el servidor se atasca**, se saca una instantánea y se pasa al plan de 8 GB: es una instancia nueva a
la que se mueve la IP estática, y conviene verlo antes del corte.

Lightsail da CPU *por ráfagas*: con video en Jitsi hay que mirar el consumo de ráfaga en la primera
asamblea de prueba. Si no alcanza, la alternativa son los 42 USD optimizados para informática
(4 GB, 2 vCPU).

### 3.2 Preparar el servidor

`preparar-servidor.sh` sirve casi tal cual, con estos cambios **en una rama aparte, antes de
usarlo**:

| Cambio | Por qué |
|---|---|
| **Swap de 4 GB** en `/swapfile`, permanente en `/etc/fstab`, con parámetro para no crearlo en otros servidores | Sin él, compilar Strapi con todo arriba puede agotar los 4 GB de memoria |
| Techo del slice por parámetro, con `MemoryMax=5G` por omisión; en AWS, **3,5 G** | El techo existía para proteger a LangFlow; en AWS solo debe dejar memoria al sistema y a `sshd`, y lo que pase del techo va al swap. `CPUQuota` se quita allá: no hay vecino |
| Quitar del comentario lo de LangFlow si la versión queda solo para AWS | Que el archivo diga la verdad |
| Probar `podman pull k8s.gcr.io/pause:3.5` | Es la imagen de infraestructura que usa Podman 3.4.4 y ese registro ya está retirado. Si falla: `infra_image = "registry.k8s.io/pause:3.5"` en `~/.config/containers/containers.conf` |

En Lightsail el usuario con sudo es `ubuntu`, y `idiky` debería quedar con uid 1001, igual que hoy
(lo confirma el `id` final del script):

```bash
ssh-keygen -y -f "$LLAVE" > /tmp/idiky.pub   # la pública de la llave actual
ssh -i <llave-de-lightsail> ubuntu@"$IP_AWS" "sudo sh -s -- '$(cat /tmp/idiky.pub)'" < infra/servidor/preparar-servidor.sh
rm /tmp/idiky.pub
```

Luego se autorizan otras personas con `infra/servidor/autorizar-llave.sh` (H7).

### 3.3 Traer los datos (§2) y restaurar (§4)

Se hace **antes del primer despliegue**: así Strapi y la API encuentran su base lista.

### 3.4 Desplegar

`desplegar.sh` y `levantar.sh` **no cambian**: la dirección llega por `IDIKY_SERVIDOR` y el resto
es igual. Los commits van fijos, los mismos de hoy; **se revisan en `/revision.txt` el día de la
migración**.

```bash
export IDIKY_SERVIDOR=idiky@$IP_AWS IDIKY_LLAVE=$LLAVE
IDIKY_REF_GESTION=4352d33 infra/desplegar.sh origin/main gestion
IDIKY_REF_BLOKY=44007e8   infra/desplegar.sh origin/main bloky
IDIKY_REF_JITSI=8d1a8c7   infra/desplegar.sh origin/main jitsi
infra/desplegar.sh origin/main pwa contable
```

- **El túnel no se despliega aquí**: va en la ventana (§5). Con dos conectores vivos sobre el
  mismo túnel, Cloudflare repartiría el tráfico entre Azure y AWS.
- La PWA y la contable quedan en el `origin/main` de ese día, más nuevo que lo publicado hoy
  (`d6e05f2`, `973061c`): no se usan los commits viejos porque traerían su `levantar.sh` viejo.
- `verificar-vecino.sh` **no aplica en AWS**: allí no hay LangFlow.

### 3.5 Ajustar las direcciones (H2, H3)

**Antes de los despliegues de §3.4**, para que arranquen con la dirección correcta. Sin imprimir
los archivos:

```bash
aw "sed -i 's/$IP_PRIVADA_AZURE/$IP_PRIVADA_AWS/g' ~/.config/idiky/secretos/bloky-api.env ~/.config/idiky/secretos/gestion-strapi.env"
aw "sed -i 's/$IP_AZURE/$IP_AWS/g' ~/.config/idiky/secretos/jitsi.env"
aw "cd ~/.config/idiky/secretos && grep -c '$IP_PRIVADA_AZURE' bloky-api.env gestion-strapi.env; grep -c '$IP_AZURE' jitsi.env"   # todo en 0
```

Confirmar además que la IP privada de Lightsail no cambia al reiniciar la instancia. Si cambia, el
reinicio de §4.3 lo mostrará y habrá que dejar de depender de ella.

## 4. Cómo se restaura y se verifica

### 4.1 Restaurar con un PostgreSQL temporal

Un contenedor suelto, con el mismo secreto y la misma carpeta que usará el pod. PostgreSQL crea la
base y su usuario al iniciar, se carga el volcado y se quita. El pod lo encontrará ya lleno.

```bash
for f in gestion.sql.gz bloky.sql.gz; do
  az "cat ~/datos/migracion/$f" | aw "mkdir -m 700 -p ~/datos/migracion && cat > ~/datos/migracion/$f"
done
az 'cd ~/datos/migracion && sha256sum *.sql.gz'; aw 'cd ~/datos/migracion && sha256sum *.sql.gz'   # iguales

aw 'sh -s' <<'FIN'
set -eu
for s in gestion bloky; do
  mkdir -p ~/datos/$s/postgres
  podman run -d --name restaurar-$s --env-file ~/.config/idiky/secretos/$s-postgres.env \
    --volume ~/datos/$s/postgres:/var/lib/postgresql/data docker.io/library/postgres:17-alpine
  # El primer arranque reinicia PostgreSQL al inicializar: hay que esperar ese reinicio.
  until podman logs restaurar-$s 2>&1 | grep -q 'PostgreSQL init process complete'; do sleep 2; done
  sleep 4
  until podman exec restaurar-$s sh -c 'pg_isready -q -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}"'; do sleep 2; done
  gunzip -c ~/datos/migracion/$s.sql.gz | podman exec -i restaurar-$s sh -c \
    'psql -q -1 -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}"'
done
FIN
```

Si algo falla, `-1` deja la base vacía y el error a la vista. **Se dejan los dos temporales
arriba** para el conteo.

### 4.2 Conteo de filas por tabla

El mismo conteo exacto en los dos lados: en Azure sobre los contenedores del pod y en AWS sobre
los temporales, **sin que Strapi ni la API hayan arrancado**.

```bash
cat > /tmp/contar.sql <<'FIN'
SELECT format('SELECT %L, count(*) FROM %I.%I', schemaname||'.'||tablename, schemaname, tablename)
FROM pg_tables WHERE schemaname !~ '^(pg_|information_schema)' ORDER BY 1 \gexec
FIN
contar() { # contar <az|aw> <contenedor>
  "$1" "podman exec -i $2 sh -c 'psql -At -U \"\$POSTGRES_USER\" -d \"\${POSTGRES_DB:-\$POSTGRES_USER}\"'" < /tmp/contar.sql
}
for s in gestion bloky; do
  contar az idiky-$s-postgres > /tmp/az-$s.txt
  contar aw restaurar-$s      > /tmp/aw-$s.txt
  wc -l /tmp/az-$s.txt /tmp/aw-$s.txt   # hoy: 55 y 80 tablas
  diff /tmp/az-$s.txt /tmp/aw-$s.txt && echo "$s: igual"
done
rm /tmp/contar.sql /tmp/az-*.txt /tmp/aw-*.txt
```

- **En el pase final, `diff` tiene que salir vacío.** En el ensayo, con Azure en uso, solo se
  admiten diferencias en tablas de registros que se expliquen una por una.
- Si coincide, se quitan los temporales (`podman stop` y `podman rm`) y se sigue con §3.5 y §3.4.
- Después de desplegar, el conteo se repite contra `idiky-<s>-postgres` en AWS, para comprobar que
  ni Strapi ni las migraciones de la API borraron o cambiaron nada.

### 4.3 Verificación funcional

| Qué | Cómo | Debe dar |
|---|---|---|
| Revisiones | `curl http://$IP_AWS:808x/revision.txt` | Las de §3.4 |
| BOB | `:8082/_health` y entrar a `/admin` | 200 y con sus datos |
| BLOKY | `:8083/api/salud` | Ok y sus canales |
| BOB → middleware | Desde el servidor, `http://$IP_PRIVADA_AWS:8083/api/admin/…` sin token | 401 (llega y cierra) |
| Middleware → BOB | Las copropiedades se ven en BLOKY | Las mismas |
| Respaldos | `systemctl --user start idiky-gestion-respaldo` | Un `.sql.gz` nuevo |
| Reinicio | Reiniciar la instancia **(aquí sí se puede)** | Todo vuelve solo. Nunca se había probado |

Lo que exige el nombre público se comprueba en §5: ingreso por SMS y Google/Microsoft, un
documento en R2, y una sala de Jitsi con **dos personas con audio y video**.

## 5. Cambio del túnel: la ventana

El túnel `idiky-dev` lo maneja Cloudflare, y **sus rutas no cambian**: `bob-dev`, `bloky-dev` y
`jitsi-dev` apuntan a `http://10.0.2.2:8082`, `:8083` y `:8085`, que en AWS significa lo mismo
porque los puertos son iguales y el contenedor del túnel se crea igual. Tampoco cambian el DNS, los
certificados ni los retornos de Google y Microsoft. **Lo único que se muda es el conector**, con el
mismo token (`tunel.env`).

Duración estimada: 30 a 45 minutos. Con aviso previo al equipo, y fuera del respaldo diario (08:30
UTC).

| # | Paso | Cómo |
|---|---|---|
| 1 | Foto de LangFlow | `az 'sh -s -- --base' < infra/servidor/verificar-vecino.sh` |
| 2 | **Corte en Azure** | `az 'systemctl --user stop container-idiky-tunel'`. Los nombres públicos dejan de responder. BOB y BLOKY siguen vivos solo por IP, y el equipo avisado no los usa: `pg_dump` saca una foto coherente sin detener las bases |
| 3 | Respaldo final | §2.1 y §2.2, y §2.3 y §2.4 otra vez |
| 4 | Vaciar el ensayo en AWS | `systemctl --user stop pod-idiky-gestion pod-idiky-bloky`, y `podman unshare rm -rf ~/datos/gestion/postgres ~/datos/bloky/postgres` (**solo en AWS**) |
| 5 | Restaurar y contar | §4.1, §4.2 con `diff` vacío, y §3.4 de `gestion` y `bloky`. Revisar §3.5, porque el paso 3 vuelve a traer los secretos sin ajustar |
| 6 | **Conector en AWS** | `infra/desplegar.sh origin/main tunel`, con `IDIKY_SERVIDOR` en AWS |
| 7 | Comprobar | En el panel de Cloudflare, un solo conector con la IP de AWS. `bloky-dev`, `bob-dev` y `jitsi-dev` responden. §4.3 completo con el ingreso real y la sala de video |
| 8 | Sellar Azure | `az 'systemctl --user disable container-idiky-tunel'`, para que un reinicio de la VM no levante un segundo conector |
| 9 | Foto de LangFlow | `az 'sh -s' < infra/servidor/verificar-vecino.sh` debe decir que sigue igual |

**Si algo falla en los pasos 2 a 7:** `aw 'systemctl --user stop container-idiky-tunel'` si llegó a
arrancar, y `az 'systemctl --user start container-idiky-tunel'`. Azure sigue intacto y con sus datos,
y vuelve a publicar en segundos. Después del paso 7 ya se escribe en AWS: volver atrás perdería lo
nuevo.

Azure se deja **apagado de público pero íntegro** hasta la aprobación de §6. Mientras tanto, no se
despliega en Azure.

## 6. Limpieza final en Azure

> **Solo cuando AWS funcione y el responsable de integración lo apruebe**, en un mensaje aparte. Se
> sugiere una semana de uso real en AWS. No hay marcha atrás.

Todo como `idiky`, sin sudo. No se detiene ni reinicia la VM.

**El servidor sigue en uso con LangFlow y Daniel sigue trabajando en él** (2026-11-01): la limpieza
**no quita el acceso**. No se tocan el usuario `idiky`, `~/.ssh/authorized_keys`, el `linger` ni el
puerto 22, y el resto de la VM queda como está. Solo sale lo de IDIKY, y al final el responsable de
integración retira a mano las reglas del NSG, cuando se le indique.

```bash
az 'sh -s -- --base' < infra/servidor/verificar-vecino.sh
```

```bash
az 'sh -s' <<'FIN'
set -u
cd ~/.config/systemd/user
systemctl --user disable --now idiky-gestion-respaldo.timer idiky-gestion-configuracion.path \
  container-idiky-tunel container-idiky-pwa container-idiky-contable \
  pod-idiky-bloky pod-idiky-gestion pod-idiky-jitsi
podman pod rm --all --force
podman rm --all --force
podman volume prune --force
podman image prune --all --force
rm -f container-idiky-*.service pod-idiky-*.service idiky-gestion-*
rm -f default.target.wants/*idiky* timers.target.wants/*idiky*
systemctl --user daemon-reload
echo "--- debe quedar vacío:"
podman ps -a --format '{{.Names}}'; podman pod ps -q; podman images -q; podman volume ls -q
ls -1 ~/.config/systemd/user
ss -tlnH | grep -E ':808[0-5]\b'; ss -ulnH | grep -E ':10000\b'
FIN
```

```bash
az 'sh -s' < infra/servidor/verificar-vecino.sh    # debe decir «sigue igual»
```

**Por decidir en esa aprobación** (la lista pedida no los nombra y aquí no se asumen): `~/datos`
(bases y respaldos), `~/.config/idiky/secretos/` y `~/despliegues`. La VM es de otro proyecto, así
que la recomendación es no dejar en ella bases ni secretos:
`podman unshare rm -rf ~/datos ~/.config/idiky ~/despliegues`, antes del último
`verificar-vecino` (este script guarda su foto en `~/.config/idiky`, así que esa foto se aparta y
se repone, o se mira a mano).

### Reglas del NSG de Azure que borra a mano el responsable de integración

| Regla | Prioridad | Qué deja pasar |
|---|---|---|
| **`Dev`** | 340 | TCP 8080-8083 y 8085, y un 8090 que ya sobraba |
| **`Dev-Udp`** | 1010 | UDP 10000 |

Esto viene de la documentación: se confirma en el portal antes de borrar, y **no se toca ninguna
otra regla**, porque 22, 80, 443 y 8443 son de LangFlow. Se comprueba que esos puertos sigan
respondiendo desde fuera ([`README.md`](./README.md) §8).

### Lo que solo puede hacer un administrador de la VM (con sudo)

Queda fuera de este plan y de lo que hace `idiky`: `loginctl disable-linger idiky`, el techo en
`/etc/systemd/system.control/user-1001.slice.d/`, borrar el usuario y los paquetes de Podman
([`README.md`](./README.md) §11). Se le pasa la lista a quien administra la VM.

## 7. Riesgos

| Riesgo | Qué lo cubre |
|---|---|
| Strapi borra datos al arrancar con otro código | Restaurar antes de desplegar, con `IDIKY_REF_GESTION` fijo, y conteo después de desplegar |
| Dos conectores del túnel a la vez | El túnel se despliega solo en la ventana, y Azure se desactiva en el paso 8 |
| Pérdida de BLOKY antes de migrar (H1) | Volcado y copia externa (§2.1 y §2.2) |
| `k8s.gcr.io/pause` no descarga | Prueba en §3.2 |
| El volcado trae IP de Azure | Conteo en §2.1 |
| 4 GB se quedan cortos al compilar o con video | Swap obligatorio (§3.2) y ensayo antes del corte; si no alcanza, subir a 8 GB desde una instantánea |
| CPU por ráfagas con video | Mirar la métrica de ráfaga; si no alcanza, cambiar de plan desde una instantánea |
| La IP privada cambia en Lightsail | Reinicio de §4.3 |
| R2, Twilio, Google, Microsoft o Anthropic filtran por IP | No debería pasar: se revisa que ninguno tenga lista de IP. El ingreso real de §5 lo prueba |

## 8. Después de la migración

- **ADR nuevo** con el cambio de servidor, con un número del rango de integración
  ([`docs/11`](../docs/11-tablero-de-trabajo.md) §0). Actualiza [ADR-0011](../docs/adr/0011-entorno-de-desarrollo-en-contenedores.md),
  y las menciones de Azure en ADR-0014 y ADR-0016.
- **Respaldo diario de BLOKY**, en el repo `Bloky-Idiky`, como el de BOB (H1). Y sacar los respaldos
  del servidor: `respaldo.sh` lo advierte, y las instantáneas automáticas de Lightsail lo cubren en
  parte.
- **Documentos:** `CLAUDE.md` (§4 y §6, lo de LangFlow), `infra/README.md`, `guia-de-despliegue.md`,
  `guia-de-jitsi.md`, `nuevo-servicio.md`, y retirar `verificar-vecino.sh` de los pasos.
- **Dar acceso:** nueva dirección a Mary y Jeimy por canal privado, y sus llaves (H7).
- **`~/.ssh/idiky_despliegue`:** la guía la nombra, pero en esta máquina la llave es `id_rsa.pem`.
