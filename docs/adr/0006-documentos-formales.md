# ADR-0006 — Cómo se generan los documentos formales

- **Estado:** Aceptada
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

## Alternativas consideradas

| Opción | A favor | En contra | Veredicto |
|---|---|---|---|
| **Generar en el servidor** | Nadie puede fabricar uno; admite firma electrónica; un solo lugar que mantener | Exige backend: no hay PDF hasta la fase 2 | **Elegida** |
| Generar en el cliente | Funciona ya, y sin costo de servidor | El documento lo produce el interesado; imposible firmar; una librería de PDF en el paquete de todos | Descartada |
| Servicio de terceros (API de PDF) | Nada que mantener | Los datos de la copropiedad salen hacia un tercero, y estos documentos llevan datos personales | Descartada |
| Solo mostrar en pantalla, sin archivo | Cero trabajo | La notaría no acepta una captura de pantalla | Descartada |

## Consecuencias

1. **CU-R-12, CU-R-18, CU-R-19, CU-R-20 y CU-A-21 quedan bloqueados por ADR-0008** (backend),
   no por esta decisión. Lo que sí se puede hacer antes: emitir y registrar el documento, que
   es lo que ya hace el paz y salvo.
2. El modelo gana tres campos en `Documento`: `codigoVerificacion` (deja de ser una pregunta
   abierta: **sí existe**), `huella` y la referencia al archivo guardado.
3. Hace falta **almacenamiento de objetos** para los archivos generados. El mismo servirá
   cuando se decida recibir archivos que suban los usuarios —el acta que respalda un cobro,
   RN-47—, que hoy está fuera de alcance porque Mary lo reemplazó por una justificación
   escrita. Cuando vuelva, hay que decidir aparte: tamaño máximo, tipos admitidos, quién puede
   descargarlos y cuánto se conservan. **Recibir un archivo no es lo mismo que generarlo.**
4. La página de verificación es **pública**: entra en el alcance de la fase 2 aunque no viva
   dentro de la app.
5. Las plantillas se prueban como se prueba la interfaz: generando el PDF y mirándolo. Un
   documento que se desborda en la segunda página no lo detecta ninguna prueba de datos.

## Lo que esta decisión NO responde

Son preguntas de producto, no de arquitectura, y siguen en §3 ter del levantamiento:

- **Quién firma** el paz y salvo: ¿el administrador con su nombre, la copropiedad, una firma
  electrónica certificada? Esto decide si hace falta un proveedor de firma.
- **Cuánto vale** un paz y salvo. Hoy el demo usa 30 días, y es un supuesto.
- Si el comprobante de pago debe cumplir **requisitos fiscales** o es un recibo interno.
- Si el paz y salvo lo emite el copropietario solo (CU-R-12) o requiere autorización previa del
  administrador (CU-A-13).
