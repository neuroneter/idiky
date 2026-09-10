# ADR-0006 — Cómo se generan los documentos formales

- **Estado:** Aceptada, **revisada el mismo día** (ver §Revisión)
- **Fecha:** 2026-08-28

## Contexto

Cinco casos de uso esperan un PDF y ninguno puede avanzar sin esta decisión: el **paz y
salvo** (CU-R-12), el **estado de cuenta** (CU-R-18), el **comprobante de pago** (CU-R-19), la
**convocatoria** a asamblea (CU-R-20) y el **acta** (CU-A-21).

No son la misma cosa que una pantalla. Un paz y salvo se lleva a una notaría, se le entrega a
un banco o a quien va a comprar el apartamento. **Es una afirmación de la copropiedad frente a
un tercero**, y ese tercero no tiene la app: recibe un archivo suelto y necesita poder creerle.

De ahí sale el criterio que ordena toda la decisión:

> Un documento formal no es un dibujo bonito de unos datos. Es una afirmación que alguien va a
> usar para tomar una decisión, y tiene que poder comprobarse **sin la app**.

## Decisión

### 1. Se generan en el servidor. Nunca en el cliente

El PDF lo produce el backend y la app solo lo descarga.

La razón que decide no es el rendimiento: es que **la app corre en el teléfono de quien tiene
interés en el resultado**. Un cliente modificado puede pintar «esta unidad está a paz y salvo»
sobre una unidad en mora, y saldría idéntico al legítimo. Además, el día que estos documentos
lleven **firma electrónica**, la llave privada tendría que estar en el servidor: no existe forma
de meterla en una app instalada en miles de teléfonos sin regalarla.

Como efecto secundario, evita meter un motor de PDF en el paquete que descarga cada usuario
(ADR-0001, ADR-0002).

**Consecuencia que hay que aceptar de frente:** los PDF **no existen hasta que exista el
backend** (ADR-0008). Mientras tanto el demo emite el registro del documento y lo muestra en
pantalla, sin fingir una descarga que no ocurre.

### 2. Se dibujan con HTML y CSS, no con un lenguaje de dibujo

El servidor arma el documento como una página HTML y la imprime a PDF.

La identidad visual ya está escrita en CSS —`estilos/tokens.css`: colores, tipografía,
espaciado— y el logotipo en SVG. Con un lenguaje de dibujo por coordenadas habría que **volver
a escribir la marca en otro idioma** y mantenerla sincronizada a mano. Un paz y salvo con un
azul distinto al de la app es un paz y salvo que parece falso.

El motor concreto se elige al decidir el backend (ADR-0008), y esa elección no cambia las
plantillas:

| Si el backend es | Motor | Nota |
|---|---|---|
| Node | Chromium headless (`page.pdf`) | El mismo navegador que ya usamos para revisar la interfaz |
| Python | WeasyPrint | No necesita navegador; menos fiel en CSS moderno |

### 3. El archivo se guarda; no se regenera

Cada emisión guarda **el archivo producido** y su **huella** (SHA-256), además del registro
`Documento` que ya existe en el modelo.

No se regenera a demanda, y esto no es una optimización: un paz y salvo dice que la unidad no
debía nada **el 15 de marzo**. Regenerarlo en junio con los datos de junio produciría otro
documento con el mismo número. El archivo es la afirmación; los datos siguen su curso.

### 4. Se verifica sin la app, y sin exponer a nadie

Todo documento lleva **número consecutivo por tipo** (RN-36) y un **código de verificación**
aleatorio, los dos impresos en el pie de todas sus páginas.

Con esos dos datos, cualquiera entra a una página pública —sin cuenta— y obtiene **solo**:

| Se responde | No se responde |
|---|---|
| Tipo de documento y si está vigente o anulado | Nombres, cédulas, teléfonos |
| Unidad a la que corresponde | Montos, saldos, historial |
| Fecha de expedición y vigencia | Cualquier otro documento de la unidad |

Quien verifica es un tercero —una notaría, un banco, quien va a arrendar—: necesita saber que
el papel es auténtico, no la vida financiera del propietario. El número por sí solo no sirve
para adivinar otros: **por eso hace falta el código**, que es aleatorio y no consecutivo.

Cuando exista el lector de portería (ADR-0005), el mismo par número + código va en un QR
dentro del documento.

### 5. Un documento no se borra: se anula

Coherente con O3 (trazabilidad). Un documento anulado sigue existiendo y la página de
verificación **dice que está anulado**, que es justo lo que un tercero necesita saber si le
presentan una copia vieja.

### 6. Una sola plantilla base para los cinco

Encabezado con el logotipo, el nombre de la copropiedad y su NIT; cuerpo propio de cada tipo;
pie con número, código de verificación y numeración de páginas. Tamaño carta (el estándar en
Colombia para trámites), no A4.

## Revisión — el documento del residente se imprime desde la app

**Mary, el mismo día, después de leer lo anterior:** *«no hay problema que aún no haya PDF; el
paz y salvo es un documento muy básico que le permite al propietario presentar un soporte para
su trámite, no es necesario estar conectado con nadie»*.

Eso cambia la premisa, y con ella la decisión 1 para una parte de los documentos. Yo había
razonado sobre un **instrumento que un tercero verifica en línea**; lo que la copropiedad emite
es un **soporte que el propietario adjunta a un trámite**. Con esa premisa, montar un servidor
para producirlo es desproporcionado: sería exigir conexión y backend para reemplazar una hoja
que hoy firma el administrador y entrega en la portería.

### Lo que queda

| Documento | Quién lo produce | Dónde |
|---|---|---|
| **Paz y salvo, estado de cuenta, comprobante** — los que el residente se lleva | El residente, desde su app | **En el teléfono**, con la hoja de impresión del navegador. Sin servidor y **sin conexión** |
| **Acta y convocatoria** — instrumentos de la copropiedad | La administración | Queda abierto hasta que exista backend. Si algún día exigen firma electrónica, van al servidor: la llave privada no puede vivir en la app |

**Cómo se imprime, sin agregar dependencias.** Las plantillas siguen siendo HTML y CSS
(decisión 2, que esta revisión refuerza): se marca un bloque `.hoja-documento` y una hoja
`@media print` oculta el resto de la app. El navegador —y el sistema operativo en Android y en
iOS— ofrece «Guardar como PDF». No entra ninguna librería al paquete, y funciona con el avión
encendido.

### Lo que se cae de la decisión original

- **No se guarda el archivo** (decisión 3). Se guarda el **registro** `Documento`, que ya
  congela lo que el certificado afirma —número, unidad, fecha de expedición y vigencia—, y el
  documento se vuelve a imprimir desde ahí. No se recalcula la deuda al reimprimir: se imprime
  lo que se certificó. Con eso desaparece la necesidad de almacenamiento de objetos.
- **La página pública de verificación queda diferida** (decisión 4). El **número y el código de
  verificación se conservan** y van impresos: hoy sirven para que quien reciba el documento lo
  confirme **llamando a la administración**, que es exactamente como se confirma hoy un paz y
  salvo en papel. Si alguna vez hace falta comprobarlo sin llamar a nadie, el código ya está y
  solo falta la página.
- **Lo que no se cae:** un documento no se borra, se anula (decisión 5), y la plantilla es una
  sola (decisión 6).

### El modelo real, y lo que corrigió

Mary aportó además **un paz y salvo de verdad** —el del Edificio Cocora— y leerlo corrigió dos
supuestos míos:

1. **El documento no dice «vale 30 días». Dice hasta qué día la unidad está al día:** «se
   encuentra a paz y salvo por conceptos de cuotas de administración **hasta el día 31 de
   agosto de 2024**». No es la caducidad del papel, es el alcance de lo que certifica. En el
   modelo el campo pasó de `vigenteHasta` a **`cubiertoHasta`**, y se calcula como el fin del
   último periodo facturado. Si la copropiedad además quiere darle un plazo de validez al
   documento, esa es otra decisión y sigue abierta.
2. **Nombra el parqueadero** junto al apartamento —«el apartamento dúplex 501 y el garaje
   número 1»— y puede ir **a nombre de varios propietarios**. Las dos cosas estaban en el
   modelo de datos sin usarse.

También responde una de las preguntas de §3 ter: **quién firma**. El administrador, con su
nombre, su cédula, su cargo y sus datos de contacto. No hace falta firma electrónica para lo
que hoy se firma a mano.

### El costo, dicho una vez

Un documento producido por el teléfono de quien tiene interés en el resultado **se puede
falsificar**: basta un cliente modificado. Se acepta porque el papel que reemplaza tiene
exactamente el mismo riesgo —hoy cualquiera imita una hoja con un logo— y porque quien dude
tiene a quién llamar. Si el día de mañana un banco exige un certificado que no dependa de la
buena fe, la salida ya está escrita arriba: las mismas plantillas, renderizadas en el servidor.

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Imprimir desde el cliente** (hoja `@media print`) | Funciona ya, sin servidor, sin conexión y sin dependencias | El documento lo produce el interesado; no admite firma electrónica | **Elegida para los documentos del residente** (ver §Revisión) |
| Generar en el servidor | Nadie puede fabricar uno; admite firma electrónica | Exige backend, y conexión para pedir un papel | **Reservada** para el acta y para el día que exijan firma |
| Librería de PDF en el cliente | Control total del trazado | Una dependencia grande en el paquete de todos, para algo que el navegador ya hace | Descartada |
| Servicio de terceros (API de PDF) | Nada que mantener | Los datos de la copropiedad salen hacia un tercero, y estos documentos llevan datos personales | Descartada |
| Solo mostrar en pantalla, sin archivo | Cero trabajo | La notaría no acepta una captura de pantalla | Descartada |

## Consecuencias

1. **CU-R-12, CU-R-18 y CU-R-19 dejan de estar bloqueados**: se pueden terminar sin backend.
   El acta (CU-A-21) y la convocatoria (CU-R-20) siguen esperando ADR-0008.
2. El modelo gana tres campos en `Documento`: `codigoVerificacion` (deja de ser una pregunta
   abierta: **sí existe**), `huella` y la referencia al archivo guardado.
3. **No hace falta almacenamiento de objetos** para los documentos del residente. Sí hará falta
   el día que se decida recibir archivos que suban los usuarios —el acta que respalda un cobro,
   RN-47—, que hoy está fuera de alcance porque Mary lo reemplazó por una justificación escrita.
   **Recibir un archivo no es lo mismo que generarlo**, y esa decisión es aparte.
4. La página de verificación queda **diferida**, no descartada. El código ya se emite.
5. Las plantillas tienen que **probarse impresas**, no solo en pantalla: los saltos de página y
   los márgenes no se ven en el navegador hasta que se imprime.
6. Un documento que se desborda a una segunda página no lo detecta ninguna prueba de datos:
   hay que mirarlo.

## Lo que esta decisión NO responde

Son preguntas de producto, no de arquitectura, y siguen en §3 ter del levantamiento:

- **Quién firma** el paz y salvo: ¿el administrador con su nombre, la copropiedad, una firma
  electrónica certificada? Esto decide si hace falta un proveedor de firma.
- **Cuánto vale** un paz y salvo. Hoy el demo usa 30 días, y es un supuesto.
- Si el comprobante de pago debe cumplir **requisitos fiscales** o es un recibo interno.
- Si el paz y salvo lo emite el copropietario solo (CU-R-12) o requiere autorización previa del
  administrador (CU-A-13).
