import Redis from 'ioredis';


export default new Redis(
  process.env.REDIS_PORT || 6379,
  process.env.REDIS_HOSTNAME || 'redis'
);
