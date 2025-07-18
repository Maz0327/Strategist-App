import { createHash } from 'crypto';
import { debugLogger } from './debug-logger';
import Redis from 'ioredis';

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailure: 3000,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Fallback to memory cache if Redis is unavailable
  enableOfflineQueue: false
});

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DistributedCache<T> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private redisAvailable = false;

  constructor() {
    this.checkRedisConnection();
  }

  private async checkRedisConnection(): Promise<void> {
    try {
      await redis.ping();
      this.redisAvailable = true;
      debugLogger.info('Redis connection established');
    } catch (error) {
      this.redisAvailable = false;
      debugLogger.warn('Redis unavailable, falling back to memory cache', { error: error.message });
    }
  }

  async set(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    const ttlSeconds = Math.floor(ttl / 1000);
    
    if (this.redisAvailable) {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
        debugLogger.info('Data cached in Redis', { key, ttl: ttlSeconds });
        return;
      } catch (error) {
        debugLogger.warn('Redis set failed, falling back to memory', { key, error: error.message });
        this.redisAvailable = false;
      }
    }
    
    // Fallback to memory cache
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Cleanup expired entries periodically
    this.cleanup();
  }

  async get(key: string): Promise<T | null> {
    if (this.redisAvailable) {
      try {
        const cached = await redis.get(key);
        if (cached) {
          debugLogger.info('Cache hit in Redis', { key });
          return JSON.parse(cached);
        }
      } catch (error) {
        debugLogger.warn('Redis get failed, falling back to memory', { key, error: error.message });
        this.redisAvailable = false;
      }
    }
    
    // Fallback to memory cache
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    debugLogger.info('Cache hit in memory', { key });
    return entry.data;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async delete(key: string): Promise<void> {
    if (this.redisAvailable) {
      try {
        await redis.del(key);
      } catch (error) {
        debugLogger.warn('Redis delete failed', { key, error: error.message });
      }
    }
    
    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redisAvailable) {
      try {
        await redis.flushall();
      } catch (error) {
        debugLogger.warn('Redis clear failed', { error: error.message });
      }
    }
    
    this.memoryCache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number; redisAvailable: boolean } {
    return {
      size: this.memoryCache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
      redisAvailable: this.redisAvailable
    };
  }
}

export function createCacheKey(content: string, type: string = 'default'): string {
  // Use first 2000 chars to avoid huge keys while maintaining uniqueness
  const input = content.slice(0, 2000);
  return createHash('sha256').update(input + type).digest('hex');
}

// Global cache instances
export const analysisCache = new DistributedCache();
export const trendsCache = new DistributedCache();
export const apiCache = new DistributedCache();
export const cohortCache = new DistributedCache();
export const competitiveCache = new DistributedCache();

// Cache monitoring
export function getCacheStats() {
  return {
    analysis: analysisCache.getStats(),
    cohort: cohortCache.getStats(),
    competitive: competitiveCache.getStats()
  };
}