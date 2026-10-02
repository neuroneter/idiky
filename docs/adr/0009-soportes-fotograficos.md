# ADR-0009 — Los soportes fotográficos del registro de personas

- **Fecha:** 2026-09-07
- **Estado:** aceptado para la fase 1 · **con una pregunta abierta que no es técnica**
- **Contexto:** CU-R-27, CU-R-28, CU-A-25 · RN-57, RN-58

## El problema

Registrar a una persona en una unidad exige dos fotos: su documento de identidad y ella misma
(RN-57). Eso obliga a decidir tres cosas que el demo no tenía resueltas: **cómo se toma** la
foto sin agregar dependencias, **dónde se guarda** sin backend, y —la que importa de
verdad— **qué se hace con una foto de cédula**.

## Decisión

### 1. Se capturan con `<input type="file" accept="image/*" capture>`

Es la etiqueta de HTML de siempre. En un teléfono abre la cámara; en un computador, el
explorador de archivos; dentro del WebView de Capacitor funciona igual (ADR-0002). **No hace
falta ninguna librería**, y por lo tanto no hace falta romper la regla de no agregar
dependencias.

Se descartó `getUserMedia` con vista previa en vivo: da más control sobre el encuadre, pero
obliga a manejar permisos, orientación y el ciclo de vida de la cámara a mano, y en la práctica
la gente prefiere la cámara del sistema, que ya sabe usar.

### 2. Se reducen antes de guardarse: 720 px de lado mayor, JPEG al 60 %

Una cámara de teléfono entrega 3 o 4 MB por disparo. El demo entero vive en `localStorage`,
que da unos 5 MB **para todo**: dos fotos sin reducir llenarían la cuota en el primer registro
y la app dejaría de guardar en silencio —`localStorage` no avisa, lanza y ya—.

Reducidas pesan unos 60 KB y siguen sirviendo para lo que son: **comparar una cara y leer un
número de documento**. Por debajo del 50 % de calidad el número empieza a costar, y ahí la foto
deja de ser un soporte.

### 3. Se guardan como `data:` URI dentro del mismo registro

En la fase 2 el campo pasa a ser la URL de un archivo en el servidor y **el tipo `Soporte` no
cambia de forma**: sigue siendo `{ imagen, adjuntadoEn }`. Es lo que permite que ninguna
pantalla se entere de la migración.

### 4. La semilla no trae fotos

Un registro de ejemplo con dos fotos es peso muerto en el archivo del demo para todo el que lo
abra. Los registros de la semilla son cero; las fotos aparecen cuando alguien usa el flujo.

## Lo que esto NO resuelve, y hay que decidir antes de la fase 2

Esta es la parte que no es técnica y no la puede decidir quien programa.

**Una foto de cédula es un dato personal, y en Colombia lo cubre la Ley 1581 de 2012
(habeas data).** Guardarla exige, como mínimo:

| Pregunta | Por qué no se puede dejar para después |
|---|---|
| **¿Con qué autorización se recoge?** | El titular tiene que autorizar el tratamiento, y saber para qué |
| **¿Cuánto se conserva?** | Una foto de la cédula de un visitante de un día no puede quedar para siempre |
| **¿Quién la ve?** | ¿La portería, para comparar en la entrada? ¿La administración? ¿El propietario que la autorizó? Cada respuesta es un permiso distinto |
| **¿Qué pasa al inhabilitar a la persona?** | RN-61 dice que nada se borra. Un dato personal sí puede tener que borrarse, y las dos reglas chocan |
| **¿Dónde se almacena?** | Un servidor con cédulas de todo un conjunto es un objetivo, no un archivo |

Mientras tanto, el demo hace lo único honesto que puede hacer: **las fotos no salen del
navegador de quien las sube**, y la pantalla de adjuntar lo dice en voz alta.

**Esta pregunta queda abierta en el levantamiento** (`docs/12-levantamiento-pendiente.md`).
No bloquea el demo; bloquea salir a producción.

## Consecuencias

- El registro de personas funciona de punta a punta sin backend y sin dependencias nuevas.
- El `localStorage` del demo ahora crece con el uso. Con fotos reducidas caben decenas de
  registros; si alguien registra cientos, el navegador dejará de guardar. Es un límite del
  demo, no del producto.
- El tipo `Soporte` es el punto exacto por donde entra el almacenamiento real en la fase 2.
- Queda escrito que el problema difícil de esta funcionalidad **no es la foto, es el dato**.
