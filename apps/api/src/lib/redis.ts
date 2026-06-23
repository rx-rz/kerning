import { Redis, type RedisOptions } from 'ioredis'

import { env } from './env.js'

const baseRedisOptions = {
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
} satisfies RedisOptions

export const redisClient = env.REDIS_URL
  ? new Redis(env.REDIS_URL, baseRedisOptions)
  : new Redis({
      ...baseRedisOptions,
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
    })

redisClient.on('error', (err: Error) => {
  console.error('Redis connection error:', err.message)
})

export async function ensureRedisConnected() {
  if ((redisClient.status as string) === 'ready') return true

  await redisClient.connect()
  return (redisClient.status as string) === 'ready'
}
