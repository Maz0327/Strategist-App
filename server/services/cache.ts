import { createHash } from 'crypto';
import { debugLogger } from './debug-logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Cleanup expired entries periodically
    this.cleanup();
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
}

export function createCacheKey(content: string, type: string = 'default'): string {
  // Use first 2000 chars to avoid huge keys while maintaining uniqueness
  const input = content.slice(0, 2000);
  return createHash('sha256').update(input + type).digest('hex');
}

// Global cache instances
export const analysisCache = new InMemoryCache<any>();
export const cohortCache = new InMemoryCache<any>();
export const competitiveCache = new InMemoryCache<any>();

// Cache monitoring
export function getCacheStats() {
  return {
    analysis: analysisCache.getStats(),
    cohort: cohortCache.getStats(),
    competitive: competitiveCache.getStats()
  };
}