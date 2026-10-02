-- Base de BLOKY, primera migracion (CU-B-01 · ADR-0008).
-- Solo lo que BLOKY guarda por su cuenta para el ingreso. La identidad vive en BOB.
CREATE TABLE IF NOT EXISTS sesion (
  id               text PRIMARY KEY,
  persona_id       text NOT NULL,
  nombre           text NOT NULL,
  tipo_documento   text NOT NULL,
  numero_documento text NOT NULL,
  canal            text NOT NULL,
  copropiedades    jsonb NOT NULL,
  creada_en        timestamptz NOT NULL,
  vence_en         timestamptz NOT NULL,
  revocada_en      timestamptz
);
CREATE INDEX IF NOT EXISTS sesion_persona ON sesion (persona_id);

CREATE TABLE IF NOT EXISTS intento_ingreso (
  id               bigserial PRIMARY KEY,
  tipo_documento   text NOT NULL,
  numero_documento text NOT NULL,
  canal            text NOT NULL,
  resultado        text NOT NULL,
  ip               text,
  fecha            timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS intento_documento_fecha ON intento_ingreso (tipo_documento, numero_documento, fecha);

CREATE TABLE IF NOT EXISTS estado_oauth (
  estado           text PRIMARY KEY,
  proveedor        text NOT NULL,
  tipo_documento   text NOT NULL,
  numero_documento text NOT NULL,
  nonce            text NOT NULL,
  creado_en        timestamptz NOT NULL
);
