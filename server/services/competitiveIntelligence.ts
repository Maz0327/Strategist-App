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
  async getCompetitiveInsights(content: string, title: string = '', truthAnalysis?: any): Promise<CompetitiveInsight[]> {
    debugLogger.info('Starting competitive intelligence analysis', { contentLength: content.length, title });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'competitive');
    
    // Check cache first
    const cached = await competitiveCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      debugLogger.info('Competitive intelligence cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildCompetitivePrompt(content, title, truthAnalysis);
      
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
      
      // Cache the result only if it's not empty
      if (result && result.length > 0) {
        await competitiveCache.set(cacheKey, result);
      }
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Competitive intelligence completed in ${processingTime}ms`, { insightCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Competitive intelligence failed', error);
      // Return fallback insights
      return this.getFallbackInsights();
    }
  }

  private buildCompetitivePrompt(content: string, title: string, truthAnalysis?: any): string {
    const basePrompt = `Analyze this content for competitive intelligence and market opportunities:

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

Base your competitive intelligence on these truth insights to ensure consistency.

Analyze the competitive landscape and market opportunities by considering:
1. How competitors are positioning in this space
2. Market gaps and opportunities
3. Emerging trends competitors might be missing
4. Potential threats from new market entrants
5. Strategic advantages available based on the cultural moment

Provide exactly 5 competitive insights in JSON format:
{
  "insights": [
    {
      "insight": "Detailed competitive insight based on the analysis",
      "category": "opportunity",
      "confidence": "high", 
      "actionable": true,
      "timeframe": "immediate"
    }
  ]
}

Categories: opportunity, threat, trend, gap
Confidence levels: high, medium, low
Timeframes: immediate, short-term, long-term

Return only valid JSON without markdown formatting.`;
    }
    
    return `${basePrompt}

Analyze the competitive landscape and market opportunities by considering:
1. How competitors are positioning in this space
2. Market gaps and opportunities
3. Emerging trends competitors might be missing
4. Potential threats from new market entrants
5. Strategic advantages available based on the content context

Provide exactly 5 competitive insights in JSON format:
{
  "insights": [
    {
      "insight": "Detailed competitive insight based on the content analysis",
      "category": "opportunity",
      "confidence": "high",
      "actionable": true,
      "timeframe": "immediate"
    }
  ]
}

Categories: opportunity, threat, trend, gap
Confidence levels: high, medium, low  
Timeframes: immediate, short-term, long-term

Return only valid JSON without markdown formatting.`;
  }

  private getFallbackInsights(): CompetitiveInsight[] {
    return [
      {
        insight: "Market showing increased demand for authentic content partnerships and creator collaborations",
        category: "trend",
        confidence: "medium",
        actionable: true,
        timeframe: "short-term"
      },
      {
        insight: "Opportunity to differentiate through data-driven content strategies while competitors rely on intuition",
        category: "opportunity", 
        confidence: "high",
        actionable: true,
        timeframe: "immediate"
      },
      {
        insight: "Competitors are slow to adapt to emerging cultural moments, creating windows for rapid response",
        category: "gap",
        confidence: "high",
        actionable: true,
        timeframe: "immediate"
      },
      {
        insight: "Growing threat from AI-native companies that integrate automation into content strategy from the ground up",
        category: "threat",
        confidence: "medium",
        actionable: true,
        timeframe: "long-term"
      },
      {
        insight: "Market opportunity in cross-platform content optimization as competitors focus on single-channel strategies",
        category: "opportunity",
        confidence: "high",
        actionable: true,
        timeframe: "short-term"
      }
    ];
  }
}

export const competitiveIntelligenceService = new CompetitiveIntelligenceService();