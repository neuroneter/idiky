# ADR-0021 — Los flujos de uso de los espacios se guardan como datos y los recorre un intérprete puro

- **Estado:** Aceptada (2026-10-03)
- **Fecha:** 2026-10-03
- **Decide:** Responsable de integración (Daniel)
- **Relacionados:** CU-B-04, CU-B-05, RN-174 a RN-183, [ADR-0015](./0015-capa-de-datos-de-bloky-un-esquema-por-copropiedad.md)
  (un esquema por copropiedad), prototipo [«Arma tu copropiedad»](../prototipos/arma-tu-copropiedad/README.md)

## Contexto

Cada espacio común tiene sus reglas: quién entra, a qué hora, desde qué edad, si se reserva, qué
se cobra y cómo se paga, quién aprueba, a quién se avisa, qué pasa si nadie llega. El demo de Mary
las modela con **campos fijos** (CU-A-10, RN-104 a RN-129) y funciona para un conjunto; pero con
más de 500 copropiedades distintas las combinaciones no se acaban («menores de 18 no entran a la
piscina entre las 19 y las 21 entre semana», «los invitados pagan y portería se entera»), y cada
combinación nueva sería un campo nuevo, una pantalla nueva y una migración.

Daniel pidió (2026-10-03) que el administrador **arme** esas reglas «como un workflow», desde un
catálogo, de forma sencilla, y que se sienta como un juego. El prototipo lo resolvió con
**bloques**: preguntas que abren caminos Sí/No, autorizaciones, pagos, alertas, acceso, límites y
finales, que se encajan y se prueban con una persona simulada.

## Decisión

1. **El flujo de uso es un dato**: un árbol de bloques en JSON, guardado por espacio (y por
   agrupación) en el esquema de la copropiedad (ADR-0015), con **versión**. Cada bloque tiene un
   `tipo` y sus parámetros; las preguntas tienen `si` y `no`, que son listas de bloques.
2. **Un solo intérprete, puro**, en `apps/bloky-api/src/dominio/flujo.ts`: recibe los flujos (los
   heredados primero, RN-175), la persona y el momento, y devuelve el recorrido y su resultado
   —veredicto, autorizaciones pendientes, cobros con su forma de pago, alertas con su hora, código
   de acceso, multas—, **sin efectos**. Es el mismo que usa «Probar» en la pantalla y el que usa
   el módulo de reservas al reservar; así lo que el administrador probó es lo que pasa.
3. **Los efectos los ejecuta quien llama**, no el intérprete: crear la reserva, cargar el cobro,
   programar la alerta, generar el código. Un efecto nuevo (p. ej., una cerradura) es un conector
   nuevo, no un cambio del intérprete.
4. **Cada reserva guarda la versión del flujo con que se hizo** (RN-183): cambiar el flujo no
   cambia lo ya reservado.
5. **Un tipo de bloque nuevo** se agrega al catálogo y al intérprete, con su regla `RN-xx`; los
   flujos guardados no se tocan. Un bloque que el intérprete no conoce **detiene** el recorrido con
   «no se puede evaluar», nunca se salta.

## Alternativas descartadas

- **Campos fijos, como el demo.** Simple para un conjunto; con cientos de copropiedades, cada
  combinación nueva es código. Las reglas del demo no se pierden: cada una es un bloque (tabla en
  CU-B-04).
- **Un motor de reglas o de workflows externo** (BPMN, Camunda, n8n). Potentes, pero pesados,
  con su propio lenguaje y servidor, y lejos de lo que un administrador entiende. Un árbol de
  bloques con un intérprete de pocos cientos de líneas cubre lo que el prototipo mostró.
- **Reglas como texto libre interpretado por IA.** Atractivo para escribir, pero no es
  determinista: una reserva o una multa tienen que dar siempre el mismo resultado.

## Consecuencias

- El administrador puede combinar casi cualquier regla sin que haya que programar.
- La pantalla del flujo es la parte más compleja de BLOKY: arrastrar bloques con eventos de
  puntero en computador, tableta y teléfono.
- Las alertas piden un **programador de tareas** y proveedores de correo, SMS y llamada (con
  costo); el código de acceso pide guardarse cifrado y registrar su uso; el pago en línea y los
  dispositivos de acceso llegan con sus propios ADR.
- El intérprete es el corazón de las reservas: necesita pruebas por cada tipo de bloque y por la
  herencia, con reloj fijo.
