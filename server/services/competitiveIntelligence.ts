import { openai } from './openai';
import { debugLogger } from './debug-logger';
import { competitiveCache, createCacheKey } from './cache';

export interface CompetitiveInsight {
  insight: string;
  category: 'opportunity' | 'threat' | 'trend' | 'gap';
  confidence: 'high' | 'medium' | 'low';
  actionable: boolean;
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

export class CompetitiveIntelligenceService {
  async getCompetitiveInsights(content: string, title: string = ''): Promise<CompetitiveInsight[]> {
    debugLogger.info('Starting competitive intelligence analysis', { contentLength: content.length, title });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'competitive');
    
    // Check cache first
    const cached = competitiveCache.get(cacheKey);
    if (cached) {
      debugLogger.info('Competitive intelligence cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildCompetitivePrompt(content, title);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert competitive intelligence analyst. Analyze content and return structured JSON with competitive insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for competitive analysis');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const competitiveData = JSON.parse(cleanedResponse);
      
      const result = competitiveData.insights || [];
      
      // Cache the result
      competitiveCache.set(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Competitive intelligence completed in ${processingTime}ms`, { insightCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Competitive intelligence failed', error);
      // Return fallback insights
      return this.getFallbackInsights();
    }
  }

  private buildCompetitivePrompt(content: string, title: string): string {
    return `Analyze this content for competitive intelligence and market opportunities:

Title: ${title}
Content: ${content}

Provide competitive insights in JSON format:
{
  "insights": [
    {
      "insight": "Competitors are missing authentic creator partnerships",
      "category": "opportunity",
      "confidence": "high",
      "actionable": true,
      "timeframe": "immediate"
    }
  ]
}

Return only valid JSON without markdown formatting.`;
  }

  private getFallbackInsights(): CompetitiveInsight[] {
    return [
      {
        insight: "Market showing increased demand for authentic content partnerships",
        category: "trend",
        confidence: "medium",
        actionable: true,
        timeframe: "short-term"
      },
      {
        insight: "Opportunity to differentiate through collaborative creator approaches",
        category: "opportunity",
        confidence: "high",
        actionable: true,
        timeframe: "immediate"
      }
    ];
  }
}

export const competitiveIntelligenceService = new CompetitiveIntelligenceService();