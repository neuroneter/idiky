# infra — entorno de desarrollo de Idiky

La PWA y la contable publicadas en contenedores, en un servidor compartido con otro servicio
que **no puede verse afectado**. La decisión y sus porqués están en
[ADR-0011](../docs/adr/0011-entorno-de-desarrollo-en-contenedores.md).

| Producto | Contenedor | Puerto |
|---|---|---|
| `apps/pwa/` | `idiky-pwa` | `8080` |
| `apps/contable/` | `idiky-contable` | `8081` |

Los dos corren con **Podman sin root**, bajo el usuario `idiky`, como servicios de systemd de
ese usuario, habilitados con *linger* para arrancar con el servidor. **Eso no se ha probado
con un reinicio real**, porque reiniciar el servidor afecta al otro servicio: la primera vez
que pase, hay que comprobar que volvieron.

## Regla del servidor

**Todo lo de Idiky vive dentro del usuario `idiky`.** No se toca el nginx del servidor, ni el
firewall, ni los puertos 80, 443, 8443 y 7860, ni nada fuera de `/home/idiky`. Si algo de
Idiky parece necesitarlo, primero se discute: hay servicios de otro proyecto que dependen de
ese servidor.

## Archivos

| Archivo | Dónde corre | Para qué |
|---|---|---|
| `pwa/Containerfile`, `pwa/nginx.conf` | Construcción | Compila la PWA (`npm run build`) y la sirve con nginx |
| `contable/Containerfile`, `contable/nginx.conf` | Construcción | Copia la contable **tal cual** (ADR-0010) y la sirve |
| `servidor/preparar-servidor.sh` | Servidor, con sudo, **una vez** | Instala Podman, crea el usuario `idiky` y le autoriza una llave |
| `servidor/levantar.sh` | Servidor, como `idiky` | Construye las imágenes y (re)crea los contenedores |
| `servidor/clave-acceso.sh` | Servidor, como `idiky` | Pone o cambia la clave de acceso al entorno |
| `desplegar.sh` | Tu máquina | Sube un commit al servidor y llama a `levantar.sh` |

## Desplegar

```bash
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave>.pem infra/desplegar.sh              # HEAD
IDIKY_SERVIDOR=idiky@<ip> IDIKY_LLAVE=~/.ssh/<llave>.pem infra/desplegar.sh origin/main  # otra rama
```

**Se publica lo que está en git, no la carpeta de trabajo**: los cambios sin commit no suben,
y el script avisa si los hay. Para saber qué está publicado, `/revision.txt`.

Si la construcción falla, lo que estaba publicado sigue en pie: se construye todo antes de
detener nada.

## Verlo

Desde el 2026-09-10 el entorno está **abierto a internet, con clave**: `http://<ip>:8080` para
la PWA y `http://<ip>:8081` para la contable. La regla de red de Azure (`Dev`, prioridad 340)
admite cualquier origen, porque el equipo no tiene IP fija; **lo que cierra la puerta es la
clave**.

- **Sin clave solo responden** `/salud`, `/revision.txt` y el manifest de la PWA.
- **Es HTTP, no HTTPS.** La clave viaja sin cifrar, y el navegador apaga el *service worker* y
  la huella, que exigen contexto seguro. Para probar esas dos cosas se entra por túnel, porque
  `localhost` sí cuenta como seguro:

  ```bash
  ssh -i ~/.ssh/<llave>.pem -N -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 idiky@<ip>
  ```

  y se abren <http://localhost:8080> y <http://localhost:8081>.
- **Para cerrarlo otra vez:** se borra `~idiky/.config/idiky/entorno` y se vuelve a desplegar.
  Queda escuchando solo en `127.0.0.1`.

### La clave

`infra/servidor/clave-acceso.sh`, corrido como `idiky`, genera una clave al azar y la muestra
una sola vez. Cambiarla toma efecto de inmediato. **No se guarda en claro en ningún sitio ni
va al repositorio**: se comparte por un canal privado.

```bash
ssh idiky@<ip> 'sh -s' < infra/servidor/clave-acceso.sh
```

### El techo de recursos

Todo lo del usuario `idiky` —contenedores, construcciones y la red de usuario que recibe el
tráfico— tiene un techo de **un núcleo de CPU y 3 GB de memoria** en su slice de systemd. Si
el entorno se satura, sea por una construcción o por tráfico desde internet, choca contra ese
techo y no contra el otro servicio del servidor.

## Operar (como `idiky`)

```bash
podman ps                                            # qué corre
systemctl --user status container-idiky-pwa          # estado del servicio
podman logs --tail 50 idiky-contable                 # registros de nginx
systemctl --user restart container-idiky-contable    # reiniciar uno
podman system df                                     # cuánto disco usan las imágenes
```

**Dar acceso a otra persona:** quien tenga sudo agrega su llave pública a
`/home/idiky/.ssh/authorized_keys`, o vuelve a correr `preparar-servidor.sh` pasándole la llave.

## Deshacer todo

Deja el servidor como estaba antes de Idiky. Se corre con un usuario con sudo:

```bash
sudo -u idiky XDG_RUNTIME_DIR=/run/user/$(id -u idiky) \
  systemctl --user disable --now container-idiky-pwa container-idiky-contable
sudo loginctl disable-linger idiky
sudo rm -rf /etc/systemd/system.control/user-$(id -u idiky).slice.d && sudo systemctl daemon-reload
sudo pkill -u idiky; sudo userdel -r idiky
sudo sed -i '/^idiky:/d' /etc/subuid /etc/subgid
sudo apt-get purge podman uidmap slirp4netns fuse-overlayfs conmon crun \
  golang-github-containers-common golang-github-containers-image \
  containernetworking-plugins libslirp0 libyajl2
```

Los paquetes se nombran uno por uno a propósito: `apt autoremove` podría llevarse cosas que no
son de Idiky. Y en Azure se borra la regla `Dev` (prioridad 340) del grupo de seguridad de red.
