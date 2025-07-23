import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { analysisCache, createCacheKey } from "./cache";
import { performanceMonitor } from "./monitoring";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
  timeout: 45 * 1000, // 45 second timeout for comprehensive deep analysis
  maxRetries: 2, // Allow retries for deep analysis
});

export interface AnalysisResult {
  summary: string;
  sentiment: string;
  tone: string;
  keywords: string[];
  confidence: string;
}

export interface TruthAnalysis {
  fact: string;
  observation: string;
  insight: string;
  humanTruth: string;
  culturalMoment: string;
  attentionValue: 'high' | 'medium' | 'low';
  platform: string;
  cohortOpportunities: string[];
}

export interface EnhancedAnalysisResult extends AnalysisResult {
  truthAnalysis: TruthAnalysis;
  cohortSuggestions: string[];
  platformContext: string;
  viralPotential: 'high' | 'medium' | 'low';
  competitiveInsights: string[];
}

export class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  async getCachedAnalysis(cacheKey: string): Promise<EnhancedAnalysisResult | null> {
    try {
      return await analysisCache.get(cacheKey) as EnhancedAnalysisResult | null;
    } catch (error) {
      debugLogger.error('Cache retrieval error', { error: (error as Error).message, cacheKey });
      return null;
    }
  }

  private getSystemPrompt(model: string, sentenceRange: string, analysisMode: 'quick' | 'deep' = 'quick'): string {
    if (model === 'gpt-4o-mini') {
      return `You are a brand strategist who specializes in practical strategic insights. Return only valid JSON matching the schema provided. Write each field in a clear, conversational tone with useful depth — aim for around 3-4 sentences per field. Avoid bullet points, markdown, or explanation — just complete sentences that flow naturally.`;
    } else if (model === 'gpt-4o') {
      if (analysisMode === 'deep') {
        return `You are a senior brand strategist who specializes in uncovering deep truths in culture, behavior, and content. Return only valid JSON matching the schema provided. Write each field in a clear, natural tone with strategic depth — aim for around 7 sentences per field. 6 is okay. Up to 10 is acceptable. Avoid bullet points, markdown, or explanation — just complete sentences that flow insightfully.`;
      } else {
        return `You are a senior cultural strategist who specializes in strategic cultural insights. Return only valid JSON matching the schema provided. Write each field in a clear, natural tone with strategic depth — aim for around 4-5 sentences per field. Avoid bullet points, markdown, or explanation — just complete sentences that flow insightfully.`;
      }
    }
    // Fallback to current system
    return `You are an expert content strategist. Return only valid JSON matching the schema provided. Write each field in a natural, conversational tone — aim for around ${sentenceRange} sentences per field. Avoid bullet points or explanation — just complete sentences that flow naturally.`;
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', analysisMode: 'quick' | 'deep' = 'quick'): Promise<EnhancedAnalysisResult> {
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference, analysisMode });
    
    const content = data.content || '';
    const title = data.title || '';
    const url = data.url || '';
    
    const startTime = Date.now();
    
    // Progressive analysis: short first, then expand
    const result = await this.progressiveAnalysis(content, title, lengthPreference, analysisMode);
    
    const processingTime = Date.now() - startTime;
    debugLogger.info('Progressive analysis complete', { duration: processingTime, lengthPreference });
    performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, true, false);
    
    return result;
  }

  private async progressiveAnalysis(content: string, title: string, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints', analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Create stable cache key base with version for prompt changes
    const cacheKeyBase = content.substring(0, 1000) + title + 'v24-natural-flow-prompts';
    
    // Step 1: Check if we have the exact analysis mode cached
    const targetCacheKey = createCacheKey(cacheKeyBase + analysisMode, 'analysis');
    let cachedAnalysis = await analysisCache.get(targetCacheKey) as EnhancedAnalysisResult | null;
    
    if (cachedAnalysis) {
      debugLogger.info(`Returning cached ${analysisMode} analysis`, { cacheKey: targetCacheKey });
      return cachedAnalysis;
    }
    
    // Step 2: Check for opposite mode analysis to reuse (bidirectional caching)
    const oppositeMode = analysisMode === 'quick' ? 'deep' : 'quick';
    const oppositeCacheKey = createCacheKey(cacheKeyBase + oppositeMode, 'analysis');
    let oppositeAnalysis = await analysisCache.get(oppositeCacheKey) as EnhancedAnalysisResult | null;
    
    if (oppositeAnalysis) {
      debugLogger.info(`Found cached ${oppositeMode} analysis, converting to ${analysisMode}`);
      const convertedAnalysis = await this.convertAnalysisMode(oppositeAnalysis, analysisMode);
      await analysisCache.set(targetCacheKey, convertedAnalysis, 300);
      return convertedAnalysis;
    }
    
    // Step 3: No cached analysis found, create fresh analysis
    debugLogger.info(`Creating fresh ${analysisMode} analysis`);
    const freshAnalysis = await this.createAnalysis(content, title, analysisMode);
    await analysisCache.set(targetCacheKey, freshAnalysis, 300);
    
    return freshAnalysis;
  }

  private async createAnalysis(content: string, title: string, analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Two-tier AI model selection (eliminating speed/GPT-3.5 as requested)
    let model: string;
    let sentenceRange: string;
    
    if (analysisMode === 'deep') {
      model = "gpt-4o"; // Deep mode: enterprise strategic intelligence
      sentenceRange = "7"; // Exactly 7 sentences for comprehensive analysis
    } else {
      model = "gpt-4o-mini"; // Quick mode: brand strategist for practical analysis
      sentenceRange = "3-4"; // Minimum 3 sentences for adequate analysis
    }
    
    const systemPrompt = this.getSystemPrompt(model, sentenceRange, analysisMode);
    
    // Enhanced schema definition with specific field guidance
    const schema = {
      summary: "Strategic overview",
      sentiment: "positive|neutral|negative",
      tone: "professional|casual|urgent|analytical|conversational|authoritative",
      keywords: ["string"],         // 3–20 items
      confidence: "85%",
      truthAnalysis: {
        fact: "What happened exactly",
        observation: "Notable patterns/behavior", 
        insight: "Why it matters strategically",
        humanTruth: "Deeper human drive behind the pattern",
        culturalMoment: "What macro societal trend or event it fits into",
        attentionValue: "high|medium|low",
        platform: "string",
        cohortOpportunities: ["string"]
      },
      cohortSuggestions: ["string"],
      platformContext: "string",
      viralPotential: "high|medium|low",
      competitiveInsights: ["string"]
    };

    const userPrompt = `Schema:
${JSON.stringify(schema, null, 2)}

Analyze the following content for strategic depth and culture. Return only JSON:
Title: ${title}
Content: ${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}`;

    debugLogger.info('Creating analysis with model-specific prompts', { model, mode: analysisMode, sentenceRange });

    const response = await openai.chat.completions.create({
      model: model,
      temperature: 0.7, // Better for expressive, natural analysis
      top_p: 1,
      max_tokens: model === 'gpt-4o' ? 1400 : 800, // Optimized for natural 6-10 sentence range
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(responseContent);
      debugLogger.info('Successfully parsed JSON analysis', { 
        hasSummary: !!analysis.summary,
        hasTruthAnalysis: !!analysis.truthAnalysis,
        hasKeywords: !!analysis.keywords,
        summaryLength: analysis.summary?.length || 0,
        factLength: analysis.truthAnalysis?.fact?.length || 0,
        observationLength: analysis.truthAnalysis?.observation?.length || 0,
        insightLength: analysis.truthAnalysis?.insight?.length || 0,
        humanTruthLength: analysis.truthAnalysis?.humanTruth?.length || 0,
        culturalMomentLength: analysis.truthAnalysis?.culturalMoment?.length || 0
      });
    } catch (parseError) {
      debugLogger.error('JSON parsing failed', { content: responseContent, error: parseError });
      throw new Error('Invalid JSON response from OpenAI');
    }

    const result: EnhancedAnalysisResult = {
      summary: analysis.summary || 'Strategic analysis completed',
      sentiment: analysis.sentiment || 'neutral',
      tone: analysis.tone || 'professional',
      keywords: analysis.keywords || [],
      confidence: analysis.confidence || '85%',
      truthAnalysis: {
        fact: analysis.truthAnalysis?.fact || 'Key facts identified',
        observation: analysis.truthAnalysis?.observation || 'Patterns analyzed',
        insight: analysis.truthAnalysis?.insight || 'Strategic insights generated',
        humanTruth: analysis.truthAnalysis?.humanTruth || 'Human motivations explored',
        culturalMoment: analysis.truthAnalysis?.culturalMoment || 'Cultural context evaluated',
        attentionValue: analysis.truthAnalysis?.attentionValue || 'medium',
        platform: analysis.truthAnalysis?.platform || 'multi-platform',
        cohortOpportunities: analysis.truthAnalysis?.cohortOpportunities || []
      },
      cohortSuggestions: analysis.cohortSuggestions || [],
      platformContext: analysis.platformContext || 'Cross-platform analysis completed',
      viralPotential: analysis.viralPotential || 'medium',
      competitiveInsights: analysis.competitiveInsights || []
    };

    return result;
  }

  private async convertAnalysisMode(existingAnalysis: EnhancedAnalysisResult, targetMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    debugLogger.info(`Converting analysis to ${targetMode} mode`);
    
    if (targetMode === 'quick') {
      // Convert Deep → Quick: Condense to 3-4 sentences per field (MINIMUM 3)
      const conversionPrompt = `Convert this comprehensive analysis to a quick format with 3-4 sentences per field. CRITICAL: Each truthAnalysis field must contain MINIMUM 3 sentences. Maintain the key strategic insights but make it concise and actionable. Return only the JSON object with each field condensed to exactly 3-4 sentences.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use Quick mode model for consistency
        temperature: 0.1,
        max_tokens: 2500,
        messages: [
          { 
            role: "system", 
            content: "You are an expert brand strategist. Convert comprehensive analysis to concise, actionable insights. CRITICAL: Each truthAnalysis field must be MINIMUM 3 sentences. Return only valid JSON with 3-4 sentences per field." 
          },
          { 
            role: "user", 
            content: `${conversionPrompt}\n\nOriginal analysis:\n${JSON.stringify(existingAnalysis, null, 2)}` 
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content from Deep→Quick conversion');
      }

      let convertedAnalysis;
      try {
        convertedAnalysis = JSON.parse(responseContent);
        debugLogger.info('Successfully converted Deep→Quick', { 
          factLength: convertedAnalysis.truthAnalysis?.fact?.length || 0,
          observationLength: convertedAnalysis.truthAnalysis?.observation?.length || 0
        });
      } catch (parseError) {
        debugLogger.error('JSON parsing failed in Deep→Quick conversion', { response: responseContent, error: parseError });
        throw new Error('Invalid JSON response from Deep→Quick conversion');
      }

      return convertedAnalysis;
    } else {
      // Convert Quick → Deep: Expand with natural strategic depth
      const conversionPrompt = `Expand this analysis into comprehensive deep strategic intelligence with natural depth — aim for around 7 sentences per field (6-10 is fine). Write with strategic insight and cultural intelligence that flows naturally.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Use Deep mode model for consistency
        temperature: 0.7,
        top_p: 1,
        max_tokens: 1400,
        messages: [
          { 
            role: "system", 
            content: "You are a senior brand strategist who specializes in uncovering deep truths in culture and behavior. Return only valid JSON. Write with natural strategic depth that flows insightfully." 
          },
          { 
            role: "user", 
            content: `${conversionPrompt}\n\nOriginal analysis:\n${JSON.stringify(existingAnalysis, null, 2)}` 
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content from Quick→Deep conversion');
      }

      let convertedAnalysis;
      try {
        convertedAnalysis = JSON.parse(responseContent);
        debugLogger.info('Successfully converted Quick→Deep', { 
          factLength: convertedAnalysis.truthAnalysis?.fact?.length || 0,
          observationLength: convertedAnalysis.truthAnalysis?.observation?.length || 0
        });
      } catch (parseError) {
        debugLogger.error('JSON parsing failed in Quick→Deep conversion', { response: responseContent, error: parseError });  
        throw new Error('Invalid JSON response from Quick→Deep conversion');
      }

      return convertedAnalysis;
    }
  }



  async generateStrategicRecommendations(content: string, title: string, truthAnalysis: any): Promise<any[]> {
    debugLogger.info('Generating strategic recommendations based on truth analysis', { contentLength: content.length, title });
    
    const systemPrompt = `You are a strategic content analyst. Generate 5 specific, actionable strategic recommendations based on the provided Truth Framework Analysis.

Each recommendation should include:
- title: Brief, actionable title
- description: 2-3 sentence detailed explanation
- impact: "high", "medium", or "low"
- timeframe: "immediate", "short-term", or "long-term"
- confidence: Number between 0-100
- category: "competitive", "cultural", "tactical", or "strategic"

Base ALL recommendations on the Truth Framework Analysis provided, ensuring consistency with the identified facts, observations, insights, human truths, and cultural moments.

Return JSON array of exactly 5 recommendations.`;

    const userPrompt = `Based on this Truth Framework Analysis, provide 5 strategic recommendations:

Title: ${title}
Content: ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}

TRUTH FRAMEWORK ANALYSIS:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}
Attention Value: ${truthAnalysis.attentionValue}

Generate recommendations that are DIRECTLY derived from this truth analysis, ensuring consistency with the identified patterns and opportunities.

Return JSON array of exactly 5 recommendation objects.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05, // Lower temperature for more consistency
      max_tokens: 1500
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    try {
      const parsed = JSON.parse(responseContent);
      const recommendations = parsed.recommendations || parsed;
      
      if (Array.isArray(recommendations)) {
        return recommendations.slice(0, 5);
      }
      
      return [];
    } catch (error) {
      debugLogger.error('Failed to parse strategic recommendations', error);
      throw new Error('Failed to parse strategic recommendations');
    }
  }
}

export const openaiService = new OpenAIService();