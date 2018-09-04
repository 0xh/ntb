import settings from '@ntb/shared-settings';
import { Redis } from '@ntb/shared-web-server-utils';


export default new Redis(
  settings.SERVICES_ADMIN_REDIS_PORT || 6379,
  settings.SERVICES_ADMIN_REDIS_HOSTNAME || 'redis'
);
