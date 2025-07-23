import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { analysisCache, createCacheKey } from "./cache";
import { performanceMonitor } from "./monitoring";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
  timeout: 15 * 1000, // 15 second timeout for faster response
  maxRetries: 1, // Reduce retries for speed
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

  private getSystemPrompt(model: string, sentenceRange: string): string {
    if (model === 'gpt-4o-mini') {
      return `You are a brand strategist. Output valid JSON only. Each field must be ${sentenceRange} sentences. Use conversational but analytical tone. Prioritize usefulness over flair.`;
    } else if (model === 'gpt-4o') {
      return `You are a senior cultural strategist. Return valid JSON only. Each field must be ${sentenceRange} sentences. Be precise, insightful, and tie observations to cultural undercurrents.`;
    }
    // Fallback to current system
    return `You are an expert content strategist. Return only valid JSON matching the schema I'll provide. Every text field must be exactly ${sentenceRange} sentences long. Write in a natural, conversational tone.`;
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', analysisMode: 'speed' | 'quick' | 'deep' = 'quick'): Promise<EnhancedAnalysisResult> {
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

  private async progressiveAnalysis(content: string, title: string, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints', analysisMode: 'speed' | 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Create stable cache key base with version for prompt changes
    const cacheKeyBase = content.substring(0, 1000) + title + analysisMode + 'v18-model-specific-prompts';
    
    // Step 1: Check if we have the requested length preference cached
    const targetCacheKey = createCacheKey(cacheKeyBase + lengthPreference, 'analysis');
    let cachedAnalysis = await analysisCache.get(targetCacheKey) as EnhancedAnalysisResult | null;
    
    if (cachedAnalysis) {
      debugLogger.info('Returning cached analysis for ' + lengthPreference, { cacheKey: targetCacheKey });
      return cachedAnalysis;
    }
    
    // Step 2: Get or create medium analysis as baseline
    const mediumCacheKey = createCacheKey(cacheKeyBase + 'medium', 'analysis');
    let mediumAnalysis = await analysisCache.get(mediumCacheKey) as EnhancedAnalysisResult | null;
    
    if (!mediumAnalysis) {
      debugLogger.info('Creating new medium analysis baseline');
      mediumAnalysis = await this.createMediumAnalysis(content, title, analysisMode);
      await analysisCache.set(mediumCacheKey, mediumAnalysis, 300);
    } else {
      debugLogger.info('Using cached medium analysis');
    }
    
    // Step 3: If user wants medium, return it immediately
    if (lengthPreference === 'medium') {
      debugLogger.info('Returning medium analysis');
      return mediumAnalysis;
    }
    
    // Step 4: Adjust from medium baseline for other lengths
    debugLogger.info('Adjusting analysis from medium to ' + lengthPreference);
    const adjustedAnalysis = await this.adjustAnalysis(mediumAnalysis, lengthPreference, analysisMode);
    await analysisCache.set(targetCacheKey, adjustedAnalysis, 300);
    
    debugLogger.info('Returning adjusted analysis', { 
      lengthPreference,
      factLength: adjustedAnalysis.truthAnalysis.fact?.length || 0,
      observationLength: adjustedAnalysis.truthAnalysis.observation?.length || 0,
      insightLength: adjustedAnalysis.truthAnalysis.insight?.length || 0,
      factContent: adjustedAnalysis.truthAnalysis.fact?.substring(0, 100) + '...',
      observationContent: adjustedAnalysis.truthAnalysis.observation?.substring(0, 100) + '...'
    });
    return adjustedAnalysis;
  }

  private async createMediumAnalysis(content: string, title: string, analysisMode: 'speed' | 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Two-tier AI model selection (eliminating speed/GPT-3.5 as requested)
    let model: string;
    let sentenceRange: string;
    
    if (analysisMode === 'deep') {
      model = "gpt-4o"; // Deep mode: enterprise strategic intelligence
      sentenceRange = "4-7"; // Flexible range for natural depth
    } else {
      model = "gpt-4o-mini"; // Quick mode: balanced default (covers both 'speed' and 'quick')
      sentenceRange = "2-4"; // Flexible range for efficiency
    }
    
    const systemPrompt = this.getSystemPrompt(model, sentenceRange);
    
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

Analyze this content:
Title: ${title}
Content: ${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}`;

    debugLogger.info('Creating analysis with model-specific prompts', { model, mode: analysisMode, sentenceRange });

    const response = await openai.chat.completions.create({
      model: model,
      temperature: 0.7,
      max_tokens: model === 'gpt-4o' ? 4000 : 2500,
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

  private async adjustAnalysis(mediumAnalysis: EnhancedAnalysisResult, lengthPreference: 'short' | 'long' | 'bulletpoints', analysisMode: 'speed' | 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Use smart text manipulation for bullet points (instant)
    if (lengthPreference === 'bulletpoints') {
      debugLogger.info('Fast text adjustment to bulletpoints');
      
      const adjustToBulletPoints = (text: string): string => {
        if (!text) return text;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
      };

      const result: EnhancedAnalysisResult = {
        ...mediumAnalysis,
        truthAnalysis: {
          fact: adjustToBulletPoints(mediumAnalysis.truthAnalysis.fact),
          observation: adjustToBulletPoints(mediumAnalysis.truthAnalysis.observation),
          insight: adjustToBulletPoints(mediumAnalysis.truthAnalysis.insight),
          humanTruth: adjustToBulletPoints(mediumAnalysis.truthAnalysis.humanTruth),
          culturalMoment: adjustToBulletPoints(mediumAnalysis.truthAnalysis.culturalMoment),
          attentionValue: mediumAnalysis.truthAnalysis.attentionValue,
          platform: mediumAnalysis.truthAnalysis.platform,
          cohortOpportunities: mediumAnalysis.truthAnalysis.cohortOpportunities
        }
      };

      debugLogger.info('Fast bulletpoint adjustment complete');
      return result;
    }

    debugLogger.info('Adjusting to ' + lengthPreference);
    debugLogger.info('Current medium analysis field lengths:', {
      fact: mediumAnalysis.truthAnalysis.fact?.length || 0,
      observation: mediumAnalysis.truthAnalysis.observation?.length || 0,
      insight: mediumAnalysis.truthAnalysis.insight?.length || 0
    });
    
    const targetSentenceRange = lengthPreference === 'short' ? '1-2' : '5-7';
    const adjustmentPrompt = `Adjust each field to ${targetSentenceRange} sentences:

${JSON.stringify(mediumAnalysis.truthAnalysis, null, 2)}

Return JSON with each field adjusted to ${targetSentenceRange} sentences.`;
    
    debugLogger.info('Sending adjustment prompt:', adjustmentPrompt.substring(0, 500) + '...');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Always use GPT-3.5-turbo for adjustments
      messages: [
        { role: "system", content: `You are a content editor. Adjust text length while keeping the same insights. Each field must be ${targetSentenceRange} sentences.` },
        { role: "user", content: adjustmentPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: lengthPreference === 'short' ? 1200 : 3000
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      debugLogger.error('No response from OpenAI adjustment');
      return mediumAnalysis;
    }

    debugLogger.info('OpenAI adjustment response:', responseContent.substring(0, 800) + '...');

    let adjustedTruthAnalysis;
    try {
      adjustedTruthAnalysis = JSON.parse(responseContent);
      debugLogger.info('Parsed adjustment result field lengths:', {
        fact: adjustedTruthAnalysis.fact?.length || 0,
        observation: adjustedTruthAnalysis.observation?.length || 0,
        insight: adjustedTruthAnalysis.insight?.length || 0
      });
    } catch (parseError) {
      debugLogger.error('Failed to parse OpenAI adjustment response', { error: parseError, responseContent });
      return mediumAnalysis;
    }

    const result: EnhancedAnalysisResult = {
      ...mediumAnalysis,
      truthAnalysis: {
        fact: adjustedTruthAnalysis.fact || mediumAnalysis.truthAnalysis.fact,
        observation: adjustedTruthAnalysis.observation || mediumAnalysis.truthAnalysis.observation,
        insight: adjustedTruthAnalysis.insight || mediumAnalysis.truthAnalysis.insight,
        humanTruth: adjustedTruthAnalysis.humanTruth || mediumAnalysis.truthAnalysis.humanTruth,
        culturalMoment: adjustedTruthAnalysis.culturalMoment || mediumAnalysis.truthAnalysis.culturalMoment,
        attentionValue: mediumAnalysis.truthAnalysis.attentionValue,
        platform: mediumAnalysis.truthAnalysis.platform,
        cohortOpportunities: mediumAnalysis.truthAnalysis.cohortOpportunities
      }
    };

    debugLogger.info('OpenAI adjustment complete', { lengthPreference });
    return result;
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