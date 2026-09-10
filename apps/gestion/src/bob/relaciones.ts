/**
 * A que documento queda apuntando una relacion "a uno" despues de guardar (BOB · T-37).
 *
 * El panel manda las relaciones como { connect: [...], disconnect: [...] }; la API puede mandar el
 * documentId, el id o { set: [...] }; y una edicion que no toca la relacion no la manda. Las reglas
 * necesitan saber el resultado final, sin importar por donde llego.
 */
import type { Core } from '@strapi/strapi';

type Referencia = string | number | { documentId?: string; id?: number } | null | undefined;

async function idADocumentId(strapi: Core.Strapi, uid: string, id: number): Promise<string | null> {
  const fila = await strapi.db.query(uid as any).findOne({ where: { id }, select: ['documentId'] });
  return fila?.documentId ?? null;
}

async function documentIdDe(strapi: Core.Strapi, uid: string, referencia: Referencia): Promise<string | null> {
  if (referencia === null || referencia === undefined) return null;
  if (typeof referencia === 'string') return referencia;
  if (typeof referencia === 'number') return idADocumentId(strapi, uid, referencia);
  if (referencia.documentId) return referencia.documentId;
  if (typeof referencia.id === 'number') return idADocumentId(strapi, uid, referencia.id);
  return null;
}

/**
 * @param valor Lo que llego en `data` para la relacion. `undefined` significa que no se toco.
 * @param actual La relacion como esta guardada (poblada), o null si es una creacion.
 */
export async function relacionFinal(
  strapi: Core.Strapi,
  uidDestino: string,
  valor: unknown,
  actual?: { documentId?: string } | null
): Promise<string | null> {
  const actualId = actual?.documentId ?? null;
  if (valor === undefined) return actualId;
  if (valor === null) return null;
  if (typeof valor === 'string' || typeof valor === 'number') return documentIdDe(strapi, uidDestino, valor);
  if (typeof valor !== 'object') return actualId;

  const cambios = valor as {
    set?: Referencia[];
    connect?: Referencia[];
    disconnect?: Referencia[];
    documentId?: string;
    id?: number;
  };
  if (Array.isArray(cambios.set)) {
    return cambios.set.length ? documentIdDe(strapi, uidDestino, cambios.set[0]) : null;
  }
  if (Array.isArray(cambios.connect) && cambios.connect.length) {
    return documentIdDe(strapi, uidDestino, cambios.connect[cambios.connect.length - 1]);
  }
  if (Array.isArray(cambios.disconnect) && cambios.disconnect.length) {
    const quitados = await Promise.all(cambios.disconnect.map((r) => documentIdDe(strapi, uidDestino, r)));
    if (actualId && quitados.includes(actualId)) return null;
  }
  if (cambios.documentId || typeof cambios.id === 'number') {
    return documentIdDe(strapi, uidDestino, cambios as Referencia);
  }
  return actualId;
}
