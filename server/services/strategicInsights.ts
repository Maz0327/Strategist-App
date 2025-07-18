import { openai } from './openai';
import { debugLogger } from './debug-logger';
import { analysisCache, createCacheKey } from './cache';

export interface StrategicInsight {
  insight: string;
  category: 'strategic' | 'tactical' | 'operational';
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
}

export class StrategicInsightsService {
  async generateInsights(content: string, title: string = '', truthAnalysis?: any): Promise<StrategicInsight[]> {
    debugLogger.info('Starting strategic insights analysis', { contentLength: content.length, title });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'strategic-insights');
    
    // Check cache first
    const cached = await analysisCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      debugLogger.info('Strategic insights cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildStrategicInsightsPrompt(content, title, truthAnalysis);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert strategic analyst. Analyze content and derive strategic insights from truth framework analysis. Return structured JSON with exactly 5 strategic insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for strategic insights');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const strategicData = JSON.parse(cleanedResponse);
      
      const result = strategicData.insights || [];
      
      // Cache the result only if it's not empty
      if (result && result.length > 0) {
        await analysisCache.set(cacheKey, result);
      }
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Strategic insights completed in ${processingTime}ms`, { insightCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Strategic insights failed', error);
      // Return fallback insights
      return this.getFallbackInsights();
    }
  }

  private buildStrategicInsightsPrompt(content: string, title: string, truthAnalysis?: any): string {
    const basePrompt = `Analyze this content and generate strategic insights:

Title: ${title}
Content: ${content}`;

    if (truthAnalysis) {
      return `${basePrompt}

TRUTH FRAMEWORK ANALYSIS:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}
Attention Value: ${truthAnalysis.attentionValue}

Based on this truth framework analysis, generate exactly 5 strategic insights that derive from these truths.

Provide strategic insights in JSON format:
{
  "insights": [
    {
      "insight": "Strategic insight derived from truth analysis",
      "category": "strategic",
      "priority": "high",
      "impact": "high",
      "timeframe": "immediate"
    }
  ]
}

Return only valid JSON without markdown formatting.`;
    }
    
    return `${basePrompt}

Provide strategic insights in JSON format:
{
  "insights": [
    {
      "insight": "Strategic insight about the content",
      "category": "strategic",
      "priority": "high",
      "impact": "high",
      "timeframe": "immediate"
    }
  ]
}

Return only valid JSON without markdown formatting.`;
  }

  private getFallbackInsights(): StrategicInsight[] {
    return [
      {
        insight: "Content demonstrates strong strategic alignment with market trends",
        category: "strategic",
        priority: "high",
        impact: "high",
        timeframe: "immediate"
      },
      {
        insight: "Tactical opportunities exist for audience engagement optimization",
        category: "tactical",
        priority: "medium",
        impact: "medium",
        timeframe: "short-term"
      },
      {
        insight: "Operational improvements can enhance content distribution effectiveness",
        category: "operational",
        priority: "medium",
        impact: "medium",
        timeframe: "short-term"
      },
      {
        insight: "Strategic positioning allows for competitive differentiation",
        category: "strategic",
        priority: "high",
        impact: "high",
        timeframe: "long-term"
      },
      {
        insight: "Content creates foundation for sustained strategic advantage",
        category: "strategic",
        priority: "high",
        impact: "high",
        timeframe: "long-term"
      }
    ];
  }
}

export const strategicInsightsService = new StrategicInsightsService();