import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
})

export const CACHE_TTL = {
  SESSION: 60 * 60 * 24 * 30, // 30 días
  DASHBOARD: 60 * 5, // 5 minutos
  FARMER_LIST: 60 * 2, // 2 minutos
  RULES: 60 * 60, // 1 hora
}

export async function getCache(key: string): Promise<string | null> {
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

export async function setCache(key: string, value: string, ttl?: number): Promise<void> {
  try {
    if (ttl) {
      await redis.setex(key, ttl, value)
    } else {
      await redis.set(key, value)
    }
  } catch {
    // Silenciar errores de cache
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key)
  } catch {
    // Silenciar errores de cache
  }
}
