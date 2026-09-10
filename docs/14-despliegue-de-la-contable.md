# 14 — Desplegar la aplicación contable

Cómo publicar `apps/contable/` en el **servidor de desarrollo** para que el equipo pueda
abrirla desde un navegador, en vez de recibir la carpeta por correo.

> Este documento es de **operación**: qué se publica, qué necesita el servidor, qué revisar
> después y qué esperar de los datos. Qué hace la aplicación por dentro está en
> [`apps/contable/README.md`](../apps/contable/README.md).

---

## 1. Qué se publica

**La carpeta `apps/contable/` tal cual.** No hay paso de construcción, ni `npm`, ni
dependencias que bajar: son archivos estáticos ([ADR-0006](./adr/0006-stack-aplicacion-contable.md)).
Lo que se copia al servidor es exactamente lo que Jeimy edita.

```
apps/contable/
├── index.html          la única página; carga los demás archivos en orden
├── estilos/app.css     toda la hoja de estilos
└── js/                 19 archivos, cargados como scripts clásicos
```

Publicar es **copiar esa carpeta detrás de un servidor de archivos**. Nada más.

> **Lo que NO se debe hacer:** agregarle un empaquetador, un `npm run build` o un paso de
> minificación "ya que estamos publicando". Eso rompe la única condición que hace que la
> aplicación sea utilizable por quien la desarrolla — que se abra con doble clic — y está
> registrado como decisión, no como preferencia.

---

## 2. Qué necesita el servidor

| Requisito | Por qué |
|---|---|
| Servir archivos estáticos | No hay proceso de servidor: no hay Node, ni PHP, ni base de datos |
| Tipo MIME correcto para `.js` y `.css` | Un `.js` servido como `text/plain` no lo ejecuta el navegador |
| **`Cache-Control: no-cache`** | Ver §4. Es el único ajuste que de verdad importa |
| Nada más | No necesita HTTPS para funcionar, ni reescritura de rutas, ni CORS |

**No hace falta reescribir todas las rutas a `index.html`.** La navegación entre módulos pasa
dentro de la misma página y no toca la URL, así que el servidor solo tiene que responder los
archivos que existen. Un `try_files $uri $uri/ =404` normal es correcto.

**Funciona en una subcarpeta.** Todas las rutas de `index.html` son relativas, así que
`https://servidor/idiky/contable/` funciona igual que la raíz del dominio. *Comprobado en
Chromium: la aplicación carga, concilia un abono, emite el recibo y los estados siguen
cuadrando, servida bajo `/idiky/contable/`.*

---

## 3. Las tres formas de publicarla

### a) Contenedor (es la del servidor de desarrollo)

Es la forma prevista para el servidor compartido: nginx dentro de un contenedor que copia la
carpeta tal cual y la publica en un puerto. La receta —`Containerfile`, `nginx.conf` y el
script que despliega desde un commit— vive en `infra/` y se despliega con una sola orden
desde la máquina de quien publica:

```sh
IDIKY_SERVIDOR=idiky@<ip> infra/desplegar.sh <rama-o-commit>
```

Sube el commit indicado, construye la imagen en el servidor y levanta el contenedor. **Se
publica lo que está en git, no la carpeta de trabajo:** lo que no esté commiteado no sube.

> `infra/` todavía no está en `main` — llega desde la rama de infraestructura
> (`claude/infra-podman-1wkn5z`). Ver §7.

### b) Copiar la carpeta a un servidor web que ya exista

Si hay un nginx o un Apache andando, no hace falta nada más:

```sh
rsync -a --delete apps/contable/ usuario@servidor:/var/www/idiky/contable/
```

Y en la configuración del sitio, lo de §4 (no-cache).

### c) Un solo archivo HTML, para enviarlo

Para mostrarle el demo a alguien que no tiene acceso al servidor, se puede pegar el CSS y los
19 archivos JS dentro del `index.html` —**en el mismo orden en que aparecen ahí**— y queda un
único `.html` que funciona con doble clic y se manda por correo.

Es una copia de conveniencia, no la entrega: **el original sigue siendo la carpeta.** No hay
script que lo genere a propósito, para que nadie confunda "empaquetar para mostrar" con
"construir para publicar".

---

## 4. La caché: el problema que sí va a pasar

Los archivos **no llevan hash en el nombre** — son `app.css` y `repositorio.js`, siempre. Un
servidor con la caché por defecto le entrega al navegador **el JavaScript de ayer** después de
desplegar, y el síntoma es peor que un error: la aplicación abre, se ve bien y se comporta
como la versión anterior.

Por eso la configuración de nginx del contenedor manda `Cache-Control: no-cache` en todo. Si
publicas de otra forma, **cópialo**:

```nginx
location / {
    add_header Cache-Control "no-cache";
    try_files $uri $uri/ =404;
}
```

Si alguien reporta que "no le llegó el cambio": recarga forzada (Ctrl+Shift+R) mientras se
arregla la configuración.

---

## 5. Los datos, al desplegar

La contable guarda todo en `localStorage`, bajo la clave `idiky.contable.bd`. De ahí salen
cuatro consecuencias que hay que tener presentes en un servidor compartido:

1. **Cada quien tiene sus propios datos.** No es una base compartida: dos personas en el mismo
   servidor ven cada una lo suyo. Es un demo, no un sistema multiusuario.
2. **Desplegar no toca los datos de nadie.** Se reemplazan los archivos; lo guardado en cada
   navegador sigue ahí.
3. **Los datos no viajan.** Lo que alguien hizo abriendo la carpeta con doble clic
   (`file://`) no aparece al entrar por `http://servidor:puerto` — para el navegador son dos
   orígenes distintos. Y al revés.
4. **Si la semilla cambia de forma, hay que subir `VERSION_ESQUEMA`** en `js/datos.js`. El
   número que hay guardado se compara con el del código y, si no coinciden, la aplicación
   siembra de nuevo sola. Sin subirlo, quien ya tenía datos se queda con la estructura vieja
   y aparecen errores raros en pantallas nuevas. **Va en el mismo commit que el cambio.**

El botón **"Reiniciar demo"** siempre devuelve todo al estado inicial. Es la primera respuesta
ante cualquier cosa rara después de un despliegue.

---

## 6. Qué revisar después de desplegar

Cinco minutos, en el navegador, sobre la URL publicada:

| | Qué | Qué tiene que pasar |
|---|---|---|
| 1 | Abrir la URL | Carga con el menú de tres entradas: Cartera · Contabilidad · Reportes |
| 2 | `revision.txt` *(solo en contenedor)* | Devuelve el commit que se publicó, no el anterior |
| 3 | Consola del navegador (F12) | **Ni un error rojo.** Un archivo que no cargó se ve aquí, no en la pantalla |
| 4 | Contabilidad → Recaudos → *Conciliar y aplicar* | Emite el recibo de caja |
| 5 | Reportes → Estado de situación financiera | **Descuadre: 0** |
| 6 | Imprimir un reporte | Sale la vista de impresión con los colores de marca |

El punto 5 es el que de verdad importa: si el descuadre no es cero, algún archivo de `js/` no
llegó o llegó viejo — y el 3 dice cuál.

Para verificarlo sin recorrer la pantalla, en la consola:

```js
Idiky.contabilidad.situacionFinanciera(Idiky.repo.datosContables(), Idiky.dominio.hoyISO()).descuadre
// 0
```

---

## 7. De qué rama se despliega

La contable **ya está integrada en `main`**. La rama de trabajo de Jeimy
(`claude/repository-review-1fbujq`) va por delante con el menú de tres entradas y con este
documento, y `infra/` —lo que hace posible el despliegue— vive todavía en la rama de
infraestructura.

**Para publicar hay que desplegar un commit que tenga las dos cosas:** la contable al día y
`infra/`. Mientras no estén las dos en `main`, el orden sano es:

1. Integrar la rama de Jeimy en `main` (trae el menú de tres entradas y este documento).
2. Integrar la rama de infraestructura en `main` (trae `infra/`, ADR-0011 y ADR-0012).
3. Desplegar `main`.

Publicar la rama de Jeimy sola no funciona: no tiene `infra/`. Publicar `main` hoy funciona,
pero publica el menú de ocho entradas, que es el anterior.

---

## 8. Lo que hay que decir de este despliegue

Para que nadie se confunda al recibir la URL:

- **Es un demo.** Los datos son inventados y viven en el navegador de cada quien.
- **No tiene autenticación.** Quien alcance la URL entra. Si el servidor está expuesto, la
  puerta la pone el servidor, no la aplicación.
- **No hay respaldo.** Nadie hace copia de seguridad de un `localStorage`. Lo que se registre
  ahí es para probar, no para contabilizar de verdad.
- **Lo que sí es real es el comportamiento contable:** la partida doble, el PUC, los estados
  financieros y las reglas RN-26 a RN-42 se comportan como se comportarían con backend.

---

## 9. Límites conocidos

| Límite | Nota |
|---|---|
| La descarga de CSV no funciona dentro de un `<iframe>` | El navegador la bloquea. La aplicación lo detecta y deshabilita el botón con una explicación. Servida directamente, funciona |
| No hay `revision.txt` fuera del contenedor | Lo escribe la construcción de la imagen. Copiando la carpeta a mano, no hay forma de saber qué versión está publicada |
| Sin conexión no hay nada especial | La contable no tiene *service worker*: no se instala ni funciona sin red. La que sí lo hace es la PWA de Mary |
