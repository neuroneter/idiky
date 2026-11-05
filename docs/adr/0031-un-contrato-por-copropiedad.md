# ADR-0031 — Un contrato on-chain por cada copropiedad

- **Estado:** Aceptada (2026-10-25)
- **Fecha:** 2026-10-25
- **Decide:** Justo (contratos) con diseño de producto en `SmartContrat-Idiky`
- **Relacionados:** ADR-0025, RN-298, RN-299, CU-B-17, T-81, T-119
- **Repo:** `SmartContrat-Idiky` · [`docs/PLAN-COPROPIEDAD.md`](../../../SmartContrat-Idiky/docs/PLAN-COPROPIEDAD.md)

## Contexto

Las billeteras ERC-4337 son globales por persona (`hashIdentidad`). Los derechos de un
edificio (quién administra, quién vota, quién invita, pases, votaciones con fondos) no
pueden vivir en esas fábricas: una misma billetera es propietario en un conjunto y
habitante en otro.

## Decisión

1. **Un proxy `Copropiedad` por cliente** (edificio), clonado desde `FactoryCopropiedad`.
2. **Tokens de rol** (ERC-1155 no transferibles) con políticas de vigencia distintas:
   propietario/habitante estables; junta con refrendo; administrador con mandato;
   portero laboral.
3. **Votaciones** vía factory global; si el tipo exige fondos, tras aprobar se abre un
   `EscrowVotacion` en la stablecoin contable de Idiky; libera el administrador vigente.
4. Sin PII on-chain (RN-298). El middleware guarda la address del proxy en el mapa / ficha.

## Consecuencias

- Hay que aprovisionar el proxy al crear el esquema `cp_<id>` (flujo BOB → middleware).
- El peso de voto es local a cada `Copropiedad`.
- T-81 (ADR de cuentas) sigue pendiente para la capa de billeteras; este ADR cubre la capa
  de conjunto.

## Alternativas

| Opción | Veredicto |
|---|---|
| Un solo contrato global de roles | Descartada: mezcla edificios y complica permisos |
| Solo grants en storage, sin token | Descartada para v1: el token facilita rotación visible y UX |
