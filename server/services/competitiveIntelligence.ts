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

  // Alias method for compatibility with strategic recommendations
  async generateInsights(content: string, title: string = '', truthAnalysis?: any): Promise<CompetitiveInsight[]> {
    return this.getCompetitiveInsights(content, title, truthAnalysis);
  }

  async generateAdvancedCompetitive(
    content: string,
    title: string = '',
    truthAnalysis?: any,
    initialCompetitive?: any[]
  ): Promise<any[]> {
    debugLogger.info('Starting advanced competitive intelligence analysis', { 
      contentLength: content.length, 
      title,
      initialCompetitiveCount: initialCompetitive?.length || 0
    });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'advanced-competitive');
    
    // Check cache first
    const cached = await competitiveCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      debugLogger.info('Advanced competitive intelligence cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildAdvancedCompetitivePrompt(content, title, truthAnalysis, initialCompetitive);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert advanced competitive intelligence analyst. Perform deep competitive analysis building on existing competitive insights to provide strategic recommendations. Return structured JSON with exactly 5 advanced competitive intelligence items." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for advanced competitive intelligence');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const advancedData = JSON.parse(cleanedResponse);
      
      const result = advancedData.advancedCompetitive || [];
      
      // Cache the result only if it's not empty
      if (result && result.length > 0) {
        await competitiveCache.set(cacheKey, result);
      }
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Advanced competitive intelligence completed in ${processingTime}ms`, { insightCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Advanced competitive intelligence failed', error);
      return this.getFallbackAdvancedCompetitive();
    }
  }

  private buildAdvancedCompetitivePrompt(
    content: string,
    title: string,
    truthAnalysis?: any,
    initialCompetitive?: any[]
  ): string {
    let prompt = `Perform advanced competitive intelligence analysis based on the following components:

ORIGINAL CONTENT:
Title: ${title}
Content: ${content}`;

    if (truthAnalysis) {
      prompt += `

TRUTH FRAMEWORK ANALYSIS:
- Fact: ${truthAnalysis.fact}
- Observation: ${truthAnalysis.observation} 
- Insight: ${truthAnalysis.insight}
- Human Truth: ${truthAnalysis.humanTruth}
- Cultural Moment: ${truthAnalysis.culturalMoment}
- Platform: ${truthAnalysis.platform}
- Attention Value: ${truthAnalysis.attentionValue}`;
    }

    if (initialCompetitive && initialCompetitive.length > 0) {
      prompt += `

INITIAL COMPETITIVE INTELLIGENCE:
${initialCompetitive.map((comp, index) => 
  `${index + 1}. ${typeof comp === 'string' ? comp : comp.insight || comp.intelligence || JSON.stringify(comp)}`
).join('\n')}`;
    }

    prompt += `

Generate 5 advanced competitive intelligence recommendations that:
1. Build upon the initial competitive insights with deeper strategic analysis
2. Provide specific, actionable competitive strategies
3. Include market positioning recommendations
4. Identify competitive opportunities and threats in detail
5. Suggest specific competitive advantages to pursue

Return a JSON response with this structure:
{
  "advancedCompetitive": [
    {
      "intelligence": "string",
      "category": "market-positioning|competitive-advantage|threat-analysis|opportunity-gap|strategic-move",
      "confidence": "high|medium|low",
      "timeframe": "immediate|short-term|long-term",
      "competitiveImpact": "high|medium|low",
      "resources": ["required resource 1", "required resource 2"]
    }
  ]
}`;

    return prompt;
  }

  private getFallbackAdvancedCompetitive(): any[] {
    return [
      {
        intelligence: "Conduct deeper competitive positioning analysis to identify strategic market gaps",
        category: "market-positioning",
        confidence: "high",
        timeframe: "short-term",
        competitiveImpact: "high",
        resources: ["market research", "competitive analysis tools"]
      },
      {
        intelligence: "Develop competitive content strategy based on competitor engagement patterns",
        category: "competitive-advantage", 
        confidence: "medium",
        timeframe: "immediate",
        competitiveImpact: "medium",
        resources: ["content team", "analytics tools"]
      },
      {
        intelligence: "Monitor competitor pricing strategies and value proposition evolution",
        category: "threat-analysis",
        confidence: "high", 
        timeframe: "immediate",
        competitiveImpact: "high",
        resources: ["pricing intelligence", "market monitoring"]
      },
      {
        intelligence: "Identify underserved market segments competitors are missing",
        category: "opportunity-gap",
        confidence: "medium",
        timeframe: "long-term", 
        competitiveImpact: "high",
        resources: ["customer research", "segmentation analysis"]
      },
      {
        intelligence: "Execute strategic partnerships to outflank key competitors",
        category: "strategic-move",
        confidence: "medium",
        timeframe: "long-term",
        competitiveImpact: "high", 
        resources: ["business development", "partnership team"]
      }
    ];
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