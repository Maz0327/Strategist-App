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

  private getSystemPrompt(lengthPreference: string, isDeepAnalysis: boolean): string {
    return `You are an expert content and creative strategist and analyst. You specialize in finding culturally relevant creative and strategic insights. Analyze the provided content and return strategic insights in JSON format.

Focus on:
- Strategic business implications
- Cultural and social context
- Human behavior and motivations
- Competitive landscape insights
- Attention and engagement potential

Analyze this content for strategic insights. Focus on actionable intelligence and cultural context.`;
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
    const cacheKeyBase = content.substring(0, 1000) + title + analysisMode + 'v16-sentence-count-prompts';
    
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
    // Three-tier AI model selection
    let model: string;
    if (analysisMode === 'speed') {
      model = "gpt-3.5-turbo"; // Speed mode: fast content triage
    } else if (analysisMode === 'deep') {
      model = "gpt-4o"; // Deep mode: enterprise strategic intelligence
    } else {
      model = "gpt-4o-mini"; // Quick mode: balanced default
    }
    
    const isDeepAnalysis = analysisMode === 'deep';
    const isSpeedAnalysis = analysisMode === 'speed';
    
    const systemPrompt = this.getSystemPrompt('medium', isDeepAnalysis);
    
    const userPrompt = `Analyze this content for strategic insights. 

Provide strategic analysis with 3-5 sentences in each truthAnalysis field.

Title: ${title}
Content: ${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Return JSON with this structure:
{
  "summary": "Strategic overview",
  "sentiment": "positive/negative/neutral", 
  "tone": "professional/casual/urgent/analytical/conversational/authoritative",
  "keywords": ["relevant", "strategic", "keywords"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "3-5 sentences stating what actually happened, who was involved, specific numbers/data mentioned, concrete examples given, and verifiable information",
    "observation": "3-5 sentences analyzing patterns, connections, strategic observations, underlying dynamics, and what this reveals about the situation", 
    "insight": "3-5 sentences on strategic implications, business intelligence, deeper strategic meaning, and actionable intelligence",
    "humanTruth": "3-5 sentences analyzing human motivations, psychological drivers, emotional triggers, behavioral patterns, and what drives people",
    "culturalMoment": "3-5 sentences on cultural context, societal trends, generational dynamics, broader cultural relevance, and cultural significance",
    "attentionValue": "high/medium/low",
    "platform": "relevant platform",
    "cohortOpportunities": ["target audience segments"]
  },
  "cohortSuggestions": ["audience", "segments"], 
  "platformContext": "Social media and platform insights",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["competitive implications"]
}`;

    debugLogger.info('Creating medium analysis', { model, mode: analysisMode });

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      functions: [
        {
          name: "analyze_content",
          description: "Analyze content with specific length requirements for each field",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Strategic overview" },
              sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
              tone: { type: "string", enum: ["professional", "casual", "urgent", "analytical", "conversational", "authoritative"] },
              keywords: { type: "array", items: { type: "string" }, description: "Relevant strategic keywords" },
              confidence: { type: "string", description: "Confidence percentage" },
              truthAnalysis: {
                type: "object",
                properties: {
                  fact: { type: "string", description: isSpeedAnalysis ? "2 sentences stating what happened and key facts" : isDeepAnalysis ? "7-9 sentences with comprehensive details, data, examples, and context" : "4-6 sentences stating what actually happened, who was involved, specific data/examples, verifiable information" },
                  observation: { type: "string", description: isSpeedAnalysis ? "2 sentences analyzing main patterns and connections" : isDeepAnalysis ? "7-9 sentences with deep pattern analysis, strategic observations, and underlying dynamics" : "4-6 sentences analyzing patterns, connections, strategic observations, and underlying dynamics" },
                  insight: { type: "string", description: isSpeedAnalysis ? "2 sentences on key strategic implications" : isDeepAnalysis ? "7-9 sentences on comprehensive strategic implications, business intelligence, and detailed actionable intelligence" : "4-6 sentences on strategic implications, business intelligence, and actionable intelligence" },
                  humanTruth: { type: "string", description: isSpeedAnalysis ? "2 sentences on human motivations and behavior" : isDeepAnalysis ? "7-9 sentences with deep psychological analysis, motivations, and behavioral patterns" : "4-6 sentences analyzing human motivations, psychological drivers, and behavioral patterns" },
                  culturalMoment: { type: "string", description: isSpeedAnalysis ? "2 sentences on cultural context and trends" : isDeepAnalysis ? "7-9 sentences with comprehensive cultural analysis, societal trends, and broader significance" : "4-6 sentences on cultural context, societal trends, and broader cultural significance" },
                  attentionValue: { type: "string", enum: ["high", "medium", "low"] },
                  platform: { type: "string" },
                  cohortOpportunities: { type: "array", items: { type: "string" } }
                },
                required: ["fact", "observation", "insight", "humanTruth", "culturalMoment", "attentionValue", "platform", "cohortOpportunities"]
              },
              cohortSuggestions: { type: "array", items: { type: "string" } },
              platformContext: { type: "string" },
              viralPotential: { type: "string", enum: ["high", "medium", "low"] },
              competitiveInsights: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "sentiment", "tone", "keywords", "confidence", "truthAnalysis", "cohortSuggestions", "platformContext", "viralPotential", "competitiveInsights"]
          }
        }
      ],
      function_call: { name: "analyze_content" },
      temperature: 0.1,
      max_tokens: isSpeedAnalysis ? 1500 : isDeepAnalysis ? 4000 : 2500
    });

    const functionCall = response.choices[0]?.message?.function_call;
    if (!functionCall || !functionCall.arguments) {
      throw new Error('No function call response from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(functionCall.arguments);
      debugLogger.info('Successfully parsed function call analysis', { 
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
      debugLogger.error('Function call JSON parsing failed', { arguments: functionCall.arguments, error: parseError });
      throw new Error('Invalid JSON response from OpenAI function call');
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
    
    const adjustmentPrompt = lengthPreference === 'short' 
      ? `Summarize this analysis down to 2 sentences while communicating the same context:

${JSON.stringify(mediumAnalysis.truthAnalysis, null, 2)}

Return only the JSON object with each field condensed to exactly 2 sentences.`
      : `Elaborate on this analysis with more detail and context and give me between 6 and 7 sentences for each field you expand on:

${JSON.stringify(mediumAnalysis.truthAnalysis, null, 2)}

Return only the JSON object with each field expanded to 6-7 sentences with rich detail.`;
    
    debugLogger.info('Sending adjustment prompt:', adjustmentPrompt.substring(0, 500) + '...');

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Always use GPT-3.5-turbo for adjustments
      messages: [
        { role: "system", content: "You are a strategic content analyst. Adjust the analysis length while maintaining the same insights and quality." },
        { role: "user", content: adjustmentPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: lengthPreference === 'short' ? 1200 : lengthPreference === 'long' ? 3000 : 1800
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