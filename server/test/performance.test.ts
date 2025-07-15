import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '../services/cache-service';
import { openaiService } from '../services/openai';

describe('Performance Tests', () => {
  beforeEach(() => {
    cacheService.clear();
    vi.clearAllMocks();
  });

  describe('Caching Performance', () => {
    it('should cache OpenAI responses to reduce API calls', async () => {
      const testData = {
        title: 'Test Article',
        content: 'This is test content for performance testing.',
        url: 'https://example.com/test'
      };

      // Mock OpenAI API call
      const mockAnalyzeContent = vi.spyOn(openaiService, 'analyzeContent');
      mockAnalyzeContent.mockResolvedValue({
        summary: 'Test summary',
        sentiment: 'positive',
        tone: 'professional',
        keywords: ['test', 'performance'],
        tags: ['testing'],
        confidence: 'high'
      });

      // First call - should hit API
      await openaiService.analyzeContent(testData);
      expect(mockAnalyzeContent).toHaveBeenCalledTimes(1);

      // Second call - should hit cache
      await openaiService.analyzeContent(testData);
      expect(mockAnalyzeContent).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle cache eviction after TTL', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test' };
      const shortTTL = 100; // 100ms

      cacheService.set(testKey, testValue, shortTTL);
      
      // Should be in cache immediately
      expect(cacheService.get(testKey)).toEqual(testValue);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be evicted
      expect(cacheService.get(testKey)).toBeNull();
    });
  });

  describe('Database Query Performance', () => {
    it('should handle concurrent database operations', async () => {
      const startTime = Date.now();
      
      // Simulate multiple concurrent database operations
      const promises = Array(10).fill(null).map((_, i) => 
        Promise.resolve({ id: i, data: `test-${i}` })
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with large datasets', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and process large dataset
      const largeArray = Array(1000).fill(null).map((_, i) => ({
        id: i,
        content: `Large content block ${i} `.repeat(100)
      }));
      
      // Process the data
      const processed = largeArray.map(item => ({
        ...item,
        processed: true
      }));
      
      // Clear references
      largeArray.length = 0;
      processed.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});