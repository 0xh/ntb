import Redis from 'ioredis';

import settings from '@ntb/shared-settings';


export default new Redis(
  settings.SERVICES_ADMIN_REDIS_PORT || 6379,
  settings.SERVICES_ADMIN_REDIS_HOSTNAME || 'redis'
);
