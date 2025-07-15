import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from '../services/cache-service';

// Mock structured logger
vi.mock('../services/structured-logger', () => ({
  structuredLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../services/debug-logger', () => ({
  debugLogger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

describe('Cache Service', () => {
  beforeEach(() => {
    cacheService.clear();
    vi.clearAllMocks();
  });

  describe('basic cache operations', () => {
    it('should set and get values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      cacheService.set(key, value);
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle TTL expiration', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const shortTTL = 100; // 100ms
      
      cacheService.set(key, value, shortTTL);
      
      // Should exist immediately
      expect(cacheService.get(key)).toEqual(value);
      
      // Should expire after TTL
      setTimeout(() => {
        expect(cacheService.get(key)).toBeNull();
      }, shortTTL + 10);
    });
  });

  describe('analysis caching', () => {
    it('should cache and retrieve analysis results', () => {
      const content = 'Test content for analysis';
      const analysis = {
        summary: 'Test summary',
        sentiment: 'positive',
        keywords: ['test', 'content']
      };
      
      cacheService.setAnalysis(content, analysis);
      const retrieved = cacheService.getAnalysis(content);
      
      expect(retrieved).toEqual(analysis);
    });

    it('should return null for non-cached analysis', () => {
      const result = cacheService.getAnalysis('non-cached-content');
      expect(result).toBeNull();
    });
  });

  describe('daily insights caching', () => {
    it('should cache and retrieve daily insights', () => {
      const userId = 1;
      const date = '2024-01-01';
      const insights = {
        summary: 'Daily summary',
        actionItems: ['item1', 'item2']
      };
      
      cacheService.setDailyInsights(userId, date, insights);
      const retrieved = cacheService.getDailyInsights(userId, date);
      
      expect(retrieved).toEqual(insights);
    });
  });

  describe('external API caching', () => {
    it('should cache and retrieve external API responses', () => {
      const service = 'test-service';
      const endpoint = '/test-endpoint';
      const params = { query: 'test' };
      const response = { data: 'test-response' };
      
      cacheService.setExternalApi(service, endpoint, params, response);
      const retrieved = cacheService.getExternalApi(service, endpoint, params);
      
      expect(retrieved).toEqual(response);
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', () => {
      const stats = cacheService.getStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });
  });
});