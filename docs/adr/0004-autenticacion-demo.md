# ADR-0004 — Sin autenticación real en el demo

- **Estado:** Aceptada
- **Fecha:** 2026-08-26

## Contexto

El objetivo del demo es validar flujos, no seguridad. Implementar autenticación real
requiere backend, lo que contradice el alcance de la fase 1.

## Decisión

**Actualizada el 2026-08-28.** Antes la pantalla de acceso *era* la lista de perfiles demo.
Mary señaló el hueco: «lo que hemos trabajado son las pantallas adentro de la app», y la puerta
no existía — un residente real nunca vería esa lista.

Ahora el demo **muestra el flujo de acceso completo sin autenticar nada**:

| Se muestra | Se simula así |
|---|---|
| Ingreso con **documento y clave de 4 números** | Se busca el documento en `bd.personas`. **No se guarda ninguna clave**: se comprueba que sean 4 números y nada más |
| **Solo la clave** cuando el teléfono ya conoce a alguien | El último que entró se recuerda en `localStorage` |
| **Huella** (RN-56) | **Esto sí es real:** WebAuthn, el estándar del navegador. El lector es de verdad y el dedo también. Lo que falta es el servidor que comprobaría la credencial, así que el demo se queda con que *el dispositivo confirmó la identidad de su dueño*. Donde no hay lector, la opción **no se ofrece**: no se simula una huella |
| **Código de un solo uso** en un dispositivo nuevo (RN-54) | Se genera en el navegador y **se muestra en pantalla**: un demo que pide un código que nunca llega no se le puede mostrar a nadie |
| **Activar la cuenta** y **recuperar la contraseña** (CU-R-25) | Marca la persona como activada en `localStorage` |

Guardar credenciales de mentira —aunque fueran cifradas de mentira— enseñaría la forma
equivocada, así que **no se guarda ninguna**. Cada pantalla lo dice en voz alta para que nadie
confunda el demo con un sistema de acceso.

**Por qué una clave de 4 números y no una contraseña** (Mary, 2026-08-28): «la contraseña debe
ser algo muy sencillo porque tenemos adultos mayores». Una contraseña con mayúsculas y símbolos
tecleada en un teléfono es la barrera que hace que la persona deje de entrar y vuelva a llamar a
la administración — es decir, la que hace que la app no sirva. La seguridad no baja: **cambia de
sitio**. La clave solo sirve en un dispositivo ya probado con un código (RN-54), los intentos se
acaban (RN-55) y quien quiera entra con huella sin teclear nada (RN-56). Es el razonamiento de
la clave del cajero: cuatro dígitos bastan cuando hacen falta la tarjeta y un número limitado de
intentos.

El **atajo de perfiles sigue existiendo**, plegado debajo del formulario: hace falta para
mostrar la consola del administrador sin teclear cédulas. Ya no es la pantalla de acceso.

## Consecuencias

- El demo **no debe exponerse públicamente con datos reales de una copropiedad.** Los datos
  de la semilla son ficticios.
- La sesión se guarda en `localStorage` solo para no repetir la selección al recargar.
- En la fase 2, `estado/SesionContext.tsx` es el único punto a modificar: la forma de la
  sesión (`persona`, `rol`, `copropiedadId`, `unidadActivaId`) se mantiene igual.
- `estado/acceso.ts` **desaparece completo** en la fase 2: activación, contraseñas y códigos
  los maneja el servidor. Lo que no desaparece es el flujo que ya quedó decidido y dibujado —
  documento, contraseña, código en dispositivo nuevo, activación en tres pasos—, que es
  precisamente lo que este demo sirve para acordar antes de construirlo.
- Los permisos de la matriz del documento 03 hoy se aplican solo en la interfaz. **En la
  fase 2 deben aplicarse en el servidor**, porque la interfaz nunca es una frontera de
  seguridad.
