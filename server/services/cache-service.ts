import { debugLogger } from './debug-logger';
import { structuredLogger } from './structured-logger';

/**
 * CRITICAL FIX: In-memory cache implementation for OpenAI responses
 * Reduces API costs and improves response times for similar content
 */
class CacheService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private maxSize: number;
  private defaultTTL: number; // Time to live in milliseconds

  constructor(maxSize = 2000, defaultTTL = 4 * 60 * 60 * 1000) { // 4 hours default for better performance
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every 30 minutes to reduce overhead
    setInterval(() => this.cleanup(), 30 * 60 * 1000);
    
    structuredLogger.info('Cache service initialized', {
      maxSize,
      defaultTTL,
      type: 'cache_init'
    });
  }

  /**
   * Generate cache key from content
   */
  private generateKey(content: string, prefix: string = ''): string {
    // Use a simple hash function for ESM compatibility
    return `${prefix}:${this.simpleHash(content)}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Set cache entry
   */
  set(key: string, data: any, ttl?: number): void {
    const actualTTL = ttl || this.defaultTTL;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTTL
    });
    
    structuredLogger.debug('Cache entry set', {
      key: key.substring(0, 20) + '...',
      ttl: actualTTL,
      cacheSize: this.cache.size,
      type: 'cache_set'
    });
  }

  /**
   * Get cache entry
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      structuredLogger.debug('Cache miss', {
        key: key.substring(0, 20) + '...',
        type: 'cache_miss'
      });
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      structuredLogger.debug('Cache entry expired', {
        key: key.substring(0, 20) + '...',
        age: Date.now() - entry.timestamp,
        type: 'cache_expired'
      });
      return null;
    }
    
    structuredLogger.debug('Cache hit', {
      key: key.substring(0, 20) + '...',
      age: Date.now() - entry.timestamp,
      type: 'cache_hit'
    });
    
    return entry.data;
  }

  /**
   * Cache OpenAI analysis results
   */
  setAnalysis(content: string, result: any, ttl?: number): void {
    const key = this.generateKey(content, 'analysis');
    this.set(key, result, ttl || 2 * 60 * 60 * 1000); // 2 hours for analysis
  }

  /**
   * Get cached OpenAI analysis
   */
  getAnalysis(content: string): any | null {
    const key = this.generateKey(content, 'analysis');
    return this.get(key);
  }

  /**
   * Cache daily insights
   */
  setDailyInsights(userId: number, date: string, insights: any): void {
    const key = `daily_insights:${userId}:${date}`;
    this.set(key, insights, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Get cached daily insights
   */
  getDailyInsights(userId: number, date: string): any | null {
    const key = `daily_insights:${userId}:${date}`;
    return this.get(key);
  }

  /**
   * Cache external API responses
   */
  setExternalApi(service: string, endpoint: string, params: any, result: any, ttl?: number): void {
    const key = this.generateKey(JSON.stringify({ service, endpoint, params }), 'external_api');
    this.set(key, result, ttl || 30 * 60 * 1000); // 30 minutes for external APIs
  }

  /**
   * Get cached external API response
   */
  getExternalApi(service: string, endpoint: string, params: any): any | null {
    const key = this.generateKey(JSON.stringify({ service, endpoint, params }), 'external_api');
    return this.get(key);
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      structuredLogger.info('Cache cleanup completed', {
        removedCount,
        remainingSize: this.cache.size,
        type: 'cache_cleanup'
      });
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      structuredLogger.debug('Evicted oldest cache entry', {
        key: oldestKey.substring(0, 20) + '...',
        age: Date.now() - oldestTime,
        type: 'cache_evict'
      });
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    structuredLogger.info('Cache cleared', {
      clearedEntries: size,
      type: 'cache_clear'
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const cacheService = new CacheService();