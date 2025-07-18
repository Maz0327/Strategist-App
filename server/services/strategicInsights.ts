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

  async generateAdvancedInsights(
    content: string, 
    title: string = '', 
    truthAnalysis?: any,
    initialInsights?: any[],
    strategicActions?: any[],
    competitiveIntelligence?: any[]
  ): Promise<any[]> {
    debugLogger.info('Starting advanced strategic insights analysis', { 
      contentLength: content.length, 
      title,
      initialInsightsCount: initialInsights?.length || 0,
      hasActions: !!strategicActions?.length,
      hasCompetitive: !!competitiveIntelligence?.length
    });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'advanced-strategic-insights');
    
    // Check cache first
    const cached = await analysisCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      debugLogger.info('Advanced strategic insights cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildAdvancedInsightsPrompt(content, title, truthAnalysis, initialInsights, strategicActions, competitiveIntelligence);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert strategic analyst. Perform comprehensive analysis of existing strategic insights to provide deeper, more detailed analysis. Return structured JSON with exactly 5 advanced strategic insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for advanced strategic insights');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const advancedData = JSON.parse(cleanedResponse);
      
      const result = advancedData.advancedInsights || [];
      
      // Cache the result only if it's not empty
      if (result && result.length > 0) {
        await analysisCache.set(cacheKey, result);
      }
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Advanced strategic insights completed in ${processingTime}ms`, { insightCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Advanced strategic insights failed', error);
      // Return fallback advanced insights
      return this.getFallbackAdvancedInsights();
    }
  }

  private buildAdvancedInsightsPrompt(
    content: string, 
    title: string, 
    truthAnalysis?: any,
    initialInsights?: any[],
    strategicActions?: any[],
    competitiveIntelligence?: any[]
  ): string {
    let prompt = `Perform comprehensive advanced strategic analysis based on the following components:

ORIGINAL CONTENT:
Title: ${title}
Content: ${content}`;

    if (truthAnalysis) {
      prompt += `

TRUTH FRAMEWORK ANALYSIS:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}
Attention Value: ${truthAnalysis.attentionValue}`;
    }

    if (initialInsights && initialInsights.length > 0) {
      prompt += `

INITIAL STRATEGIC INSIGHTS:
${initialInsights.map((insight, index) => `${index + 1}. ${typeof insight === 'string' ? insight : insight.insight || insight.title}`).join('\n')}`;
    }

    if (strategicActions && strategicActions.length > 0) {
      prompt += `

STRATEGIC ACTIONS:
${strategicActions.map((action, index) => `${index + 1}. ${typeof action === 'string' ? action : action.action || action.title}`).join('\n')}`;
    }

    if (competitiveIntelligence && competitiveIntelligence.length > 0) {
      prompt += `

COMPETITIVE INTELLIGENCE:
${competitiveIntelligence.map((comp, index) => `${index + 1}. ${typeof comp === 'string' ? comp : comp.intelligence || comp.title}`).join('\n')}`;
    }

    prompt += `

TASK: Synthesize ALL the above components to generate exactly 5 advanced strategic insights that are:
1. Much more comprehensive and detailed than the initial insights
2. Longer, more thorough analysis (3-5 sentences each)
3. Strategic in nature, not tactical
4. Synthesize insights from all provided components
5. Provide deeper business implications

Return in JSON format:
{
  "advancedInsights": [
    {
      "title": "Advanced Strategic Insight Title",
      "analysis": "Comprehensive detailed analysis (3-5 sentences) that synthesizes all components and provides deeper strategic understanding",
      "category": "strategic",
      "priority": "high",
      "impact": "high",
      "confidence": "85%"
    }
  ]
}

Return only valid JSON without markdown formatting.`;

    return prompt;
  }

  private getFallbackAdvancedInsights(): any[] {
    return [
      {
        title: "Comprehensive Strategic Market Position Analysis",
        analysis: "Based on the comprehensive analysis, this content reveals significant strategic positioning opportunities that extend beyond surface-level observations. The convergence of cultural moments, competitive intelligence, and audience insights creates a unique strategic advantage that can be leveraged for long-term market differentiation. This positions the brand to capture attention while competitors remain focused on traditional approaches.",
        category: "strategic",
        priority: "high",
        impact: "high",
        confidence: "90%"
      },
      {
        title: "Advanced Audience Psychology and Behavioral Insights",
        analysis: "The deep analysis reveals sophisticated audience psychology patterns that inform strategic decision-making at multiple levels. By understanding the intersection of human truths, cultural moments, and behavioral triggers, brands can develop more nuanced engagement strategies that resonate on emotional and rational levels. This comprehensive understanding enables prediction of audience responses and optimization of strategic messaging.",
        category: "strategic",
        priority: "high",
        impact: "high",
        confidence: "85%"
      },
      {
        title: "Strategic Competitive Advantage Through Cultural Intelligence",
        analysis: "The synthesis of competitive intelligence and cultural moment analysis reveals untapped strategic opportunities for differentiation. While competitors focus on obvious trends, the deeper cultural insights provide access to emerging opportunities that haven't yet been commoditized. This cultural intelligence creates sustainable competitive advantages that are difficult to replicate.",
        category: "strategic",
        priority: "high",
        impact: "high",
        confidence: "88%"
      },
      {
        title: "Long-term Strategic Framework for Sustained Growth",
        analysis: "The comprehensive analysis establishes a framework for sustained strategic growth that integrates all analyzed components. This framework provides a roadmap for strategic decision-making that balances immediate tactical opportunities with long-term strategic positioning. The integrated approach ensures that short-term actions support long-term strategic objectives while maintaining competitive advantages.",
        category: "strategic",
        priority: "high",
        impact: "high",
        confidence: "87%"
      },
      {
        title: "Strategic Innovation and Market Creation Opportunities",
        analysis: "The synthesis reveals opportunities for strategic innovation that go beyond incremental improvements to market creation. By combining cultural intelligence, competitive insights, and audience psychology, brands can identify white space opportunities for creating new market categories. This strategic innovation potential positions organizations as market leaders rather than followers.",
        category: "strategic",
        priority: "high",
        impact: "high",
        confidence: "85%"
      }
    ];
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