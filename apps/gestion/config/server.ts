import type { Core } from '@strapi/strapi';

// Sistema de gestion de IDIKY (T-37 · ADR-0012).
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  // En el entorno Strapi va detras del nginx del pod (infra/gestion/nginx.conf). Sin confiar en
  // X-Forwarded-For, todas las peticiones parecerian venir de nginx y el limite de intentos de
  // login bloquearia a todos a la vez. En local, sin nginx, IS_PROXIED=false.
  proxy: {
    koa: env.bool('IS_PROXIED', false),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
