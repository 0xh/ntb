import settings from '@ntb/settings';
import { Redis } from '@ntb/web-server-utils';


export default new Redis(
  settings.SERVICES_ADMIN_REDIS_PORT || 6379,
  settings.SERVICES_ADMIN_REDIS_HOSTNAME || 'redis'
);
