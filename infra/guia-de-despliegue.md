# Guía de despliegue — para cada persona del equipo (y para su IA)

Cómo publicar en el entorno de desarrollo lo que ya está en `main`, sin pisar el trabajo de los
demás ni el servidor que compartimos. Si vas a **crear** un servicio nuevo, la guía es otra:
[`nuevo-servicio.md`](./nuevo-servicio.md). Cómo está armado todo: [`README.md`](./README.md).

## 1. Qué se despliega y quién

| Servicio | Qué es hoy | Quién lo despliega | Desde | Puerto |
|---|---|---|---|---|
| `pwa` | **La maqueta de Mary**: la PWA (app del propietario y consola del administrador) | Mary | `origin/main` | 8080 |
| `contable` | **La maqueta de Jeimy**: la aplicación contable | Jeimy | `origin/main` | 8081 |
| `gestion` | **BOB**, el *back office* de IDIKY (Strapi + PostgreSQL) | **Solo el responsable de integración** | `origin/main`, **y nada más** | 8082 |

> **Las maquetas no son los espacios de desarrollo.** BLOKY (el sistema de las copropiedades)
> y ALICE (la app del propietario y residente) **todavía no tienen espacio**. Cuando se creen,
> tendrán su propio servicio, puerto y responsable, y se agregan a esta tabla.

**Por qué BOB es distinto.** Strapi ajusta la base de datos al código con el que arranca: con un
código que no tiene sus tipos de contenido, **borra las tablas y columnas que falten, y con ellas
los datos**. Por eso `desplegar.sh` se niega a publicar `gestion` desde algo que no esté en
`main`, y respalda la base antes de recrear su pod.

## 2. La primera vez (una sola vez por persona)

1. **Crea tu llave SSH de despliegue:**

   ```bash
   ssh-keygen -t ed25519 -C "mary@idiky" -f ~/.ssh/idiky_despliegue
   ```

   Se crean dos archivos. **`~/.ssh/idiky_despliegue.pub` es el público**: ese es el único que
   envías. El otro, sin `.pub`, es privado y **no sale de tu computador**.

2. **Envía el `.pub` al responsable de integración**, que lo autoriza en el servidor:

   ```bash
   IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<su llave> infra/servidor/autorizar-llave.sh mary.pub "Mary"
   ```

3. **Recibe por un canal privado** la dirección del servidor y la clave del entorno. **Nunca van
   en el repositorio ni en un chat de grupo.**

4. **Déjalas en tu terminal** (o en el perfil de tu shell) y prueba el acceso:

   ```bash
   export IDIKY_SERVIDOR=idiky@<ip>
   export IDIKY_LLAVE=~/.ssh/idiky_despliegue
   ssh -i "$IDIKY_LLAVE" "$IDIKY_SERVIDOR" 'echo acceso ok'
   ```

> **Hace falta `git`, `ssh` y una terminal POSIX** (macOS, Linux, o Git Bash en Windows). Si tu
> computador no permite instalar nada —el caso descrito en ADR-0010—, **pide el despliegue al
> responsable de integración**, diciendo servicio y commit, hasta que exista el despliegue
> automático (T-35).

## 3. Cada vez que despliegas

Desde la raíz del repositorio:

```bash
# 1. Lo que vas a publicar ya está integrado en main
git fetch origin
git log --oneline -3 origin/main

# 2. Foto de LangFlow, el otro servicio del servidor (obligatoria)
ssh -i "$IDIKY_LLAVE" "$IDIKY_SERVIDOR" 'sh -s -- --base' < infra/servidor/verificar-vecino.sh

# 3. Publica SOLO tu servicio
infra/desplegar.sh origin/main pwa          # Mary
infra/desplegar.sh origin/main contable     # Jeimy

# 4. LangFlow tiene que decir «sigue igual»
ssh -i "$IDIKY_LLAVE" "$IDIKY_SERVIDOR" 'sh -s' < infra/servidor/verificar-vecino.sh
```

**Qué hace `desplegar.sh`:** sube ese commit al servidor, construye solo tu servicio, lo levanta
y espera a que responda. **Los demás servicios no se tocan.** Al final muestra la revisión con la
que queda cada uno. Tarda uno o dos minutos.

**Cómo compruebas que quedó:** `http://<ip>:8080/revision.txt` (o `:8081`) dice el commit que
publicaste, y la app abre con la clave del entorno. Si tenías la app abierta, recarga con
`Cmd + Shift + R`.

**Si la construcción falla** —por ejemplo, `npm run build` no pasa—, lo que estaba publicado
**sigue en pie**. Arregla en tu rama, integra a `main` y vuelve a desplegar.

## 4. Si algo sale mal

| Mensaje | Qué pasa | Qué hacer |
|---|---|---|
| *Otro despliegue está en curso en el servidor* | Alguien está desplegando. **No se tocó nada** | Espera unos minutos y repite |
| *No se despliega gestion (BOB) desde …* | Pediste `gestion` desde algo que no está en `main` | No es tuyo: BOB lo despliega el responsable de integración |
| *Quedan N MB libres y el mínimo es 3000* | El disco del servidor está justo | No se construyó nada. Avisa al responsable de integración |
| *idiky-pwa no respondió …* | El servicio no arrancó | Mira los registros: `ssh -i "$IDIKY_LLAVE" "$IDIKY_SERVIDOR" 'podman logs --tail 50 idiky-pwa'` |
| *Permission denied (publickey)* | Tu llave no está autorizada, o no es la que usas | Revisa `IDIKY_LLAVE`, o pide que la autoricen (§2) |
| *This screen couldn't be loaded* (en BOB) | Tenías BOB abierto durante un despliegue | Recarga la página |
| `verificar-vecino.sh` dice que algo cambió | Podría estar afectado LangFlow | **Avisa de inmediato al responsable de integración**, con la salida |

## 5. Lo que no se hace

- **No se despliega `gestion` (BOB) ni `todo`**, salvo el responsable de integración.
- **No se despliegan ramas sin integrar**: lo publicado es lo que está en `main`.
- **Nada fuera del usuario `idiky`**: sin `sudo`, sin tocar nginx, el firewall ni los puertos de
  LangFlow (22, 80, 443, 8443, 7860), y nada fuera de `/home/idiky`.
- **No se borra `~/datos`**: ahí está la base de BOB y sus respaldos.
- **No se comparten** la llave privada ni la clave del entorno en chats, tickets ni commits.

## 6. Pedírselo a tu IA (Claude Code)

Con `IDIKY_SERVIDOR` e `IDIKY_LLAVE` ya definidos en tu terminal, basta con decirle:

> Despliega mi maqueta al entorno de desarrollo: servicio `pwa`, desde `origin/main`, siguiendo
> `infra/guia-de-despliegue.md`. Toma la foto de LangFlow antes y compárala después, y dime la
> revisión que quedó publicada.

La IA tiene que seguir esta guía al pie de la letra: solo tu servicio, solo desde `main`, con
la verificación de LangFlow antes y después. `CLAUDE.md` se lo recuerda.

## 7. Quién desplegó qué

Cada despliegue queda en un registro del servidor: fecha, persona (tu `git config user.name`),
rama, commit, servicios y resultado.

```bash
ssh -i "$IDIKY_LLAVE" "$IDIKY_SERVIDOR" 'column -t -s "$(printf "\t")" ~/despliegues/registro.tsv | tail -10'
```
