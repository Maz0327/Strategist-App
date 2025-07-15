import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIService } from '../services/openai';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'Test summary',
                  sentiment: 'positive',
                  tone: 'professional',
                  keywords: ['test', 'example'],
                  confidence: '85%',
                  truthAnalysis: {
                    fact: 'Test fact',
                    observation: 'Test observation',
                    insight: 'Test insight',
                    humanTruth: 'Test human truth',
                    culturalMoment: 'Test cultural moment',
                    attentionValue: 'high',
                    platform: 'test',
                    cohortOpportunities: []
                  }
                })
              }
            }
          ],
          usage: {
            total_tokens: 100,
            prompt_tokens: 50,
            completion_tokens: 50
          }
        })
      }
    }
  }))
}));

// Mock dependencies
vi.mock('../services/debug-logger', () => ({
  debugLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('../services/analytics', () => ({
  analyticsService: {
    trackExternalApiCall: vi.fn()
  }
}));

vi.mock('../services/google-ngram', () => ({
  googleNgramService: {
    getHistoricalData: vi.fn().mockResolvedValue(null)
  }
}));

vi.mock('../services/cache-service', () => ({
  cacheService: {
    getAnalysis: vi.fn().mockReturnValue(null),
    setAnalysis: vi.fn(),
    get: vi.fn().mockReturnValue(null),
    set: vi.fn()
  }
}));

vi.mock('../services/structured-logger', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('OpenAI Service', () => {
  let openaiService: OpenAIService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-key';
    openaiService = new OpenAIService();
  });

  describe('analyzeContent', () => {
    it('should analyze content successfully', async () => {
      const testData = {
        title: 'Test Title',
        content: 'This is test content for analysis',
        url: 'https://example.com'
      };

      const result = await openaiService.analyzeContent(testData);

      expect(result).toBeDefined();
      expect(result.summary).toBe('Test summary');
      expect(result.sentiment).toBe('positive');
      expect(result.keywords).toEqual(['test', 'example']);
    });

    it('should handle empty content', async () => {
      const testData = {
        title: 'Test Title',
        content: '',
        url: 'https://example.com'
      };

      const result = await openaiService.analyzeContent(testData);

      expect(result).toBeDefined();
      expect(result.summary).toBe('Test summary');
    });
  });

  describe('generateInsights', () => {
    it('should generate insights successfully', async () => {
      const testPrompt = 'Generate insights for this test data';
      
      const result = await openaiService.generateInsights(testPrompt);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('generateChatResponse', () => {
    it('should generate chat response successfully', async () => {
      const message = 'Test message';
      const systemContext = 'Test context';
      
      const result = await openaiService.generateChatResponse(message, systemContext);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });
});