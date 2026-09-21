# Casos de uso de BLOKY — el sistema de las copropiedades

Ámbito **`B`** (2026-09-21, [ADR-0013](../adr/0013-bloky-dev-separada-del-demo.md)). Son los
casos de uso propios de BLOKY que no existen en el demo. Cuando un caso de uso del demo
(`CU-A-NN`) se implemente en BLOKY conserva su identificador; aquí solo van los nuevos.

Quién entra a BLOKY lo define BOB ([`13-bob-copropiedades-y-contratos.md` §3](../13-bob-copropiedades-y-contratos.md)):
el **Administrador** y el **Delegado** de cada copropiedad, y después los perfiles que ellos
creen. BLOKY no crea a nadie por su cuenta.

---

### CU-B-01
## CU-B-01 — Ingresar a BLOKY

- **Actor principal:** Administrador o Delegado de una copropiedad
- **Precondiciones:** La copropiedad existe en BOB, está **activa** o **en implementación**, y la
  persona tiene en BOB una asignación **vigente** como Administrador o Delegado (basta uno de los
  dos perfiles para que la copropiedad pueda entrar).
- **Disparador:** Abre BLOKY.
- **Resultado esperado:** Queda dentro, con su nombre, la o las copropiedades a su cargo y el rol
  con el que entra a cada una. La sesión dura doce horas o hasta que la cierre.

**Flujo principal**
1. Escribe su **tipo y número de documento**. No hay contraseña: la identidad la prueban el celular
   o la cuenta de correo que IDIKY registró en BOB (RN-160).
2. BLOKY busca a la persona en BOB y comprueba que hoy tenga al menos una copropiedad a la que
   pueda entrar (RN-161, RN-162). Le muestra su nombre y **por dónde puede confirmar que es ella**:
   - **Código por SMS** al celular registrado, con la pista «••• 4567» (RN-163).
   - **Google** o **Microsoft**, con la cuenta registrada, pista «o•••@gmail.com» (RN-164).
   Un solo código por intento, por el canal que elija ([docs/13 §4](../13-bob-copropiedades-y-contratos.md)).
3. **Por SMS:** recibe un código de seis números, válido diez minutos, y lo escribe.
   **Por Google o Microsoft:** el navegador va al proveedor, la persona elige su cuenta y vuelve.
   BLOKY compara el correo que el proveedor verificó con el de BOB: tiene que ser el mismo.
4. Queda dentro. Si tiene varias copropiedades, las ve todas con su rol en cada una.

**Flujos alternativos**
- A1. El documento no está en BOB → «Quien te registra es IDIKY, al crear tu copropiedad».
- A2. Está en BOB pero sin asignación vigente, o su copropiedad es prospecto, suspendida o
  retirada → «Hoy no tienes una copropiedad activa a tu cargo. Escribe a operaciones@idiky.com».
- A3. Código incorrecto o vencido → puede pedir otro. Al **quinto** error en quince minutos el
  documento queda bloqueado quince minutos (RN-166).
- A4. Entró con una cuenta de Google o Microsoft cuyo correo **no es** el de BOB → se rechaza y
  vuelve a la puerta con el motivo. No se le dice cuál es el correo correcto.
- A5. El registro de BOB no tiene celular utilizable ni correo → no hay canal; se le manda a
  operaciones.
- A6. Cierra la sesión → la sesión queda revocada (RN-165); la cookie ya no sirve.

**Reglas de negocio**
- RN-160 a RN-166, en [`05-modelo-de-datos.md`](../05-modelo-de-datos.md).

**Lo que queda abierto**
- El perfil de portería y los perfiles internos que crean el Administrador y el Delegado entran
  por la misma puerta cuando existan (docs/13 §3.5); hoy BOB solo tiene los dos perfiles raíz.
- La clave de cuatro números y la huella del demo (ADR-0004) son de ALICE, la app del
  propietario; BLOKY no las usa.

**Estado en BLOKY Dev:** ✅ — `apps/bloky/src/features/acceso/` y `apps/bloky-api/src/acceso/`.
Probado el flujo por SMS contra un BOB simulado (`apps/bloky-api/pruebas/humo.ts`). Google y
Microsoft están construidos y sin credenciales: se activan al registrar las aplicaciones y
solo funcionan con HTTPS (ADR-0008).
