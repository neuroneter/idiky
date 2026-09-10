# 13 — BOB: cómo entra una copropiedad a IDIKY

> **Refinamiento en curso** con el responsable de integración, empezado el 2026-09-10 (T-39).
> Recoge lo decidido para **BOB** y lo que **BLOKY** tendrá que respetar. Cuando esté cerrado se
> lleva a los tipos de contenido de Strapi (T-37) y a casos de uso del operador. Los nombres de
> las aplicaciones están en el [glosario](./02-glosario.md#las-aplicaciones-de-idiky).

## 1. La frontera entre BOB y BLOKY

| | **BOB** (el *back office* de IDIKY) | **BLOKY** (el sistema de las copropiedades) |
|---|---|---|
| **Es dueño de** | Lo comercial y contractual: cliente, plan, servicios, contrato. La **ficha** de la copropiedad y el **resumen** de sus bienes. Los dos **perfiles raíz** | El **árbol completo hasta la unidad**, los coeficientes, los **perfiles internos** y toda la operación |
| **Quién lo usa** | El equipo de IDIKY | El Administrador, el Delegado y los perfiles que ellos creen |

- **La identidad de la copropiedad nace en BOB.** Su `id` es el `copropiedadId` con el que BLOKY
  separa los datos de cada conjunto (RN-01).
- **BOB no guarda datos de residentes.** Sí guarda los de los dos perfiles raíz, porque con ellos
  hay una relación comercial.
- **Estados propuestos** (sin confirmar): prospecto, en implementación, activa, suspendida,
  retirada. Qué acceso queda en BLOKY cuando una copropiedad está suspendida sigue abierto.

## 2. Planes, servicios adicionales y contrato

| Entidad | Qué guarda |
|---|---|
| **Plan** | Nombre, condiciones, **modalidad** (`por unidad` o `valor fijo`), valor mensual y si **restringe las unidades** al rango del contrato |
| **Servicio adicional** | Nombre (asesoría financiera, asesoría legal…), descripción y valor mensual |
| **Contratación** | La copropiedad, el plan o servicio, **el precio y las condiciones copiados al contratar** (como RN-37 y RN-85: cambiar la tarifa no reescribe contratos firmados), la fecha de inicio, la de fin y, si aplica, **el rango de unidades** |

**Reglas decididas:**

1. **Todo plan dura 12 meses**, y los servicios adicionales también.
2. **El cobro por unidad usa las unidades del contrato**, no las que estén cargadas en BLOKY.
3. **Solo se cobran unidades facturables:** apartamento, casa, local, **oficina** y **consultorio**.
   **No se cobran** bodegas, depósitos, parqueaderos ni zonas comunes. Coincide con el criterio de
   la Ley 675 (art. 53), que cuenta los bienes privados sin parqueaderos ni depósitos. Cada tipo de
   bien del catálogo lleva un indicador **facturable**: es un dato, no una regla escrita en el
   código.
4. **El rango del contrato puede ser un bloqueo en BLOKY.** Si el contrato define un rango de
   unidades y **el plan tiene la restricción**, BLOKY **no deja cargar unidades facturables por
   encima del máximo**. Si el plan no la tiene, no hay bloqueo. Las unidades que no se cobran nunca
   cuentan para el tope.
5. **Prorrateo del primer mes.** Si el contrato empieza con el mes en curso, se cobran los días
   que faltan, **con meses de 30 días**: `valor mensual ÷ 30 × días`. Ejemplo: un plan de
   $300.000 que empieza el 21 → 10 días → $100.000.

## 3. Los perfiles raíz

1. **BOB crea solo dos perfiles por copropiedad: el Administrador y el Delegado.**
2. **Delegado.** La copropiedad lleva un check **«tiene consejo de administración»**. Con el check,
   el Delegado es el presidente del consejo; sin él, lo nombra la asamblea. Se llama «Delegado»
   porque la Ley 675 **no crea la figura de presidente del consejo**, y el consejo solo es
   obligatorio en comerciales y mixtas de más de 30 bienes privados (art. 53).
3. **Administrador.** Puede ser una persona o una empresa (arts. 50-51). **Una misma persona puede
   administrar varias copropiedades**, y en pocos casos ser además propietaria o residente: la
   persona existe una vez y tiene asignaciones por copropiedad, con su periodo y su soporte.
4. **En una misma copropiedad, el Administrador y el Delegado no son la misma persona.**
5. **Los dos entran a BLOKY y crean ahí los perfiles internos** de la copropiedad. **BOB no los crea.**
6. **El Delegado tiene lo mismo que el Administrador**, más una facultad propia: **solicitar desde
   BLOKY el bloqueo o el cambio del Administrador**. La solicitud debe cumplir la ley: al
   administrador lo remueve la asamblea, o el consejo si existe (art. 50), así que va con el acta.
   **El nuevo Administrador lo crea IDIKY en BOB.**
7. **El cambio del Delegado no se pide desde BLOKY:** el Delegado es el superusuario, así que
   solo se tramita **por solicitud directa a `operaciones@idiky.com`**, y IDIKY lo hace en BOB.
   Propuesta: BOB registra cada solicitud (quién la pidió, cuándo, por qué canal, con qué acta),
   para que el cambio tenga soporte.

**Pendiente de confirmar, porque choca con reglas que ya existen:**

- **¿«Lo mismo que el Administrador» incluye los actos que el repo reserva al administrador?**
  Parametrizar cuotas y multas (RN-49), llevar el debido proceso e imponer sanciones (CU-A-23), y
  la representación legal (Ley 675, art. 50). Propuesta: el Delegado **ve todo y crea perfiles**,
  pero esos actos siguen siendo del Administrador.
- **¿«Todos los perfiles internos» incluye a las personas de cada unidad?** Hoy **el propietario
  registra a los de su unidad** y la administración lo autoriza (CU-R-27, CU-R-28, RN-63), y así
  está construido en el demo de Mary. Si ahora los crea el Administrador, cambian esos casos de
  uso y RN-63.

## 4. Ingreso a BLOKY

- **Cuatro formas:** código por SMS, código por correo, Google (Gmail) o Microsoft (Hotmail), con
  el correo registrado.
- **Un solo código por intento**, por el canal que la persona elija: no se pagan dos envíos.
- **Twilio Verify** envía los códigos. Sus credenciales ya están en el servidor
  (`infra/servidor/cargar-integraciones.sh`); todavía no las usa ningún servicio. El correo
  requiere configurar en Twilio la integración con SendGrid.
- **BOB no usa nada de esto:** entra con el login de Strapi.

## 5. La ficha de la copropiedad (en BOB)

| Grupo | Campos |
|---|---|
| **Identidad** | Nombre, NIT con dígito de verificación, tipo (edificio o conjunto) y uso (residencial, comercial o mixto), check de consejo de administración |
| **Ubicación** | País (ISO 3166), **DIVIPOLA de 8 dígitos** (departamento 2 + municipio 3 + centro poblado 3; se guarda el código y el nombre), barrio, localidad o comuna (no son DIVIPOLA), dirección, latitud y longitud |
| **Características** | **Estrato** (1 a 6, solo uso residencial), fotos (una principal; opcionales por torre o unidad) |
| **Resumen de bienes** | Cuántos hay de cada tipo, y cuántos son facturables. Es lo que BOB necesita para cotizar y cobrar |
| **Soportes** | Certificado de existencia y representación legal (alcaldía, art. 8) y escritura del reglamento |

## 6. La estructura hasta la unidad (en BLOKY)

Propuesta, para cualquier tipo de copropiedad:

| Pieza | Qué es | Campos |
|---|---|---|
| **Agrupación** | Un nivel del árbol, de **cualquier profundidad** | Tipo (de un catálogo editable: etapa, sector, manzana, torre, bloque, interior, edificio, piso, nivel…), nombre, padre, orden, foto |
| **Bien** | La hoja | Tipo (apartamento, casa, local, oficina, consultorio, bodega, lote, parqueadero, depósito…), identificador, área, matrícula inmobiliaria, estrato si difiere, **naturaleza** |

- **La naturaleza es la clave legal.** Un parqueadero o depósito puede ser **bien privado** (con
  matrícula y coeficiente) o **bien común de uso exclusivo** asignado a una unidad, sin coeficiente
  (art. 22). Los de visitantes no se asignan. Los coeficientes suman 100 % **solo entre bienes
  privados**.
- **Un bien puede colgar de cualquier nivel**: un local en el primer piso no necesita torre.
- **Los tipos son datos, no código**: agregar «interior» o «nivel» no exige programar.

## 7. Lo que sigue abierto

1. Los dos choques del §3: los actos reservados al Administrador, y quién registra a las personas
   de cada unidad.
2. **¿Los precios incluyen IVA?**
3. **¿Plan y servicios se renuevan solos** al cumplir los 12 meses?
4. **Prorrateo:** ¿los 12 meses empiezan el día del contrato, o el primero del mes siguiente,
   después del mes prorrateado? Con meses de 30 días, ¿qué pasa si el contrato empieza un 31, o
   en febrero? ¿Los servicios adicionales se prorratean igual?
5. **El tope:** cuando BLOKY bloquea por el rango, ¿el Administrador pide ampliar el contrato a
   operaciones? ¿La ampliación a mitad de contrato también se prorratea?
6. **¿El rango tiene mínimo**, además de máximo? ¿Qué pasa si se cargan menos unidades?
7. **¿Un lote** (condominios campestres) se cobra?
8. **Una copropiedad suspendida:** ¿qué conserva en BLOKY y en ALICE?

## Fuentes

- [Ley 675 de 2001 — Régimen de Propiedad Horizontal (Alcaldía de Bogotá, Sisjur)](https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=4162)
- [DANE — DIVIPOLA](https://www.dane.gov.co/index.php/sistema-estadistico-nacional-sen/normas-y-estandares/nomenclaturas-y-clasificaciones/nomenclaturas/codificacion-de-la-division-politica-administrativa-de-colombia-divipola)
- [Twilio — Verify por correo con SendGrid](https://www.twilio.com/docs/verify/email)
- [Twilio — SMS en Colombia](https://www.twilio.com/en-us/guidelines/co/sms)
