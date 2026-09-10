import type { Core } from '@strapi/strapi';

// Sistema de gestion de IDIKY (T-37 · ADR-0012).
export default {
  /**
   * Antes de que la aplicacion arranque. Aqui ira el middleware de auditoria (T-38).
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Antes de empezar a atender peticiones.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await cerrarRegistroPublico(strapi);
  },
};

/**
 * Strapi trae encendido el registro abierto de usuarios finales (`/api/auth/local/register`).
 * Este sistema no tiene usuarios finales: lo usa el equipo de IDIKY, que entra por el panel.
 * Se apaga en cada arranque, por si alguien lo encendio desde el panel. El nginx del pod lo
 * bloquea tambien (infra/gestion/nginx.conf).
 */
async function cerrarRegistroPublico(strapi: Core.Strapi) {
  const almacen = strapi.store({ type: 'plugin', name: 'users-permissions', key: 'advanced' });
  const avanzado = (await almacen.get()) as Record<string, unknown> | null;
  if (avanzado && avanzado.allow_register !== false) {
    await almacen.set({ value: { ...avanzado, allow_register: false } });
    strapi.log.info('Registro publico de usuarios finales: apagado.');
  }
}
