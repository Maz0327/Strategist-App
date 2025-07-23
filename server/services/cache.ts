import { createHash } from 'crypto';
import { debugLogger } from './debug-logger';

// Simplified caching - memory only for current deployment scale

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache<T> {
  private memoryCache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  private hits = 0;
  private misses = 0;

  async set(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Cleanup expired entries periodically
    this.cleanup();
  }

  async get(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return entry.data;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  getStats(): { size: number; hitRate: number; hits: number; misses: number } {
    const total = this.hits + this.misses;
    return {
      size: this.memoryCache.size,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      hits: this.hits,
      misses: this.misses
    };
  }
}

export function createCacheKey(content: string, type: string = 'default'): string {
  // Use first 2000 chars to avoid huge keys while maintaining uniqueness
  const input = content.slice(0, 2000);
  return createHash('sha256').update(input + type).digest('hex');
}

// Global cache instances
export const analysisCache = new MemoryCache();
export const trendsCache = new MemoryCache();
export const apiCache = new MemoryCache();
export const cohortCache = new MemoryCache();
export const competitiveCache = new MemoryCache();

// Cache monitoring
export function getCacheStats() {
  return {
    analysis: analysisCache.getStats(),
    cohort: cohortCache.getStats(),
    competitive: competitiveCache.getStats()
  };
}