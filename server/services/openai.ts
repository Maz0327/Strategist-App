import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { analysisCache, createCacheKey } from "./cache";
import { performanceMonitor } from "./monitoring";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
  timeout: 30 * 1000, // 30 second timeout
  maxRetries: 2, // Built-in retries
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
  strategicInsights: string[];
  strategicActions: string[];
}

export class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  private getSystemPrompt(lengthPreference: string, isDeepAnalysis: boolean): string {
    const lengthInstructions = {
      'short': 'MANDATORY: Each field must contain exactly 2-3 complete sentences. Do not use single sentences or bullet points.',
      'medium': 'MANDATORY: Each field must contain exactly 3-4 complete sentences. Provide substantive analysis in each field.', 
      'long': 'MANDATORY: Each field must contain exactly 4-6 complete sentences. Provide comprehensive detailed analysis.',
      'bulletpoints': 'MANDATORY: Use bullet points for key information where applicable, with 2-3 bullet points per field.'
    };

    const lengthInstruction = lengthInstructions[lengthPreference] || lengthInstructions['medium'];

    if (isDeepAnalysis) {
      return `Expert content strategist. Provide comprehensive strategic analysis with deep insights. ${lengthInstruction}. Return valid JSON:
{
  "summary": "Multi-sentence strategic summary providing comprehensive analysis of the content's strategic value and implications. Each response field must follow the exact sentence count requirements specified.",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "Multiple sentences providing comprehensive factual analysis with context and implications. Must contain the exact number of sentences specified in the length preference.",
    "observation": "Multiple sentences detailing patterns, connections, and cross-references. Must contain the exact number of sentences specified in the length preference.",
    "insight": "Multiple sentences providing deep strategic insights with actionable implications. Must contain the exact number of sentences specified in the length preference.",
    "humanTruth": "Multiple sentences explaining complex human motivations and psychological drivers. Must contain the exact number of sentences specified in the length preference.",
    "culturalMoment": "Multiple sentences providing rich cultural context with historical and future implications. Must contain the exact number of sentences specified in the length preference.",
    "attentionValue": "high|medium|low",
    "platform": "relevant platform with cross-platform considerations",
    "cohortOpportunities": ["detailed audience1", "detailed audience2", "detailed audience3"]
  },
  "cohortSuggestions": ["cohort1", "cohort2", "cohort3", "cohort4"],
  "platformContext": "Multi-sentence platform analysis with specific tactical recommendations following length requirements",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["detailed insight1", "detailed insight2", "detailed insight3"],
  "strategicInsights": ["comprehensive recommendation1", "comprehensive recommendation2", "comprehensive recommendation3"],
  "strategicActions": ["detailed action1", "detailed action2", "detailed action3", "detailed action4"]
}`;
    } else {
      return `Expert content strategist. Analyze content for strategic insights. ${lengthInstruction}. Return valid JSON:
{
  "summary": "Multi-sentence strategic summary following the exact sentence count requirements specified in the length preference",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["keyword1", "keyword2"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "Multiple sentences providing key factual analysis. Must contain the exact number of sentences specified in the length preference.",
    "observation": "Multiple sentences detailing key patterns and connections. Must contain the exact number of sentences specified in the length preference.",
    "insight": "Multiple sentences providing strategic insights. Must contain the exact number of sentences specified in the length preference.",
    "humanTruth": "Multiple sentences explaining human motivations. Must contain the exact number of sentences specified in the length preference.",
    "culturalMoment": "Multiple sentences providing cultural context. Must contain the exact number of sentences specified in the length preference.",
    "attentionValue": "high|medium|low",
    "platform": "relevant platform",
    "cohortOpportunities": ["audience1", "audience2"]
  },
  "cohortSuggestions": ["cohort1", "cohort2"],
  "platformContext": "Multi-sentence platform context following length requirements",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["insight1", "insight2"],
  "strategicInsights": ["recommendation1", "recommendation2"],
  "strategicActions": ["action1", "action2"]
}`;
    }
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
    // Create stable cache key base
    const cacheKeyBase = content.substring(0, 1000) + title + analysisMode + 'v4';
    
    // Step 1: Check if we have the requested length preference cached
    const targetCacheKey = createCacheKey(cacheKeyBase + lengthPreference, 'analysis');
    let cachedAnalysis = await analysisCache.get(targetCacheKey);
    
    if (cachedAnalysis) {
      debugLogger.info('Returning cached analysis for ' + lengthPreference);
      return cachedAnalysis;
    }
    
    // Step 2: Get or create medium analysis as baseline
    const mediumCacheKey = createCacheKey(cacheKeyBase + 'medium', 'analysis');
    let mediumAnalysis = await analysisCache.get(mediumCacheKey);
    
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
    
    debugLogger.info('Returning adjusted analysis');
    return adjustedAnalysis;
  }

  private async createMediumAnalysis(content: string, title: string, analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    const isDeepAnalysis = analysisMode === 'deep';
    const systemPrompt = this.getSystemPrompt('medium', isDeepAnalysis);
    
    const userPrompt = isDeepAnalysis ? 
      `Provide comprehensive strategic analysis of this content with MEDIUM length responses (3-5 sentences per field):

Title: ${title}
Content: ${content.substring(0, 4000)}${content.length > 4000 ? '...' : ''}

MANDATORY: Every field in truthAnalysis must contain exactly 3-5 sentences. This is CRITICAL for proper analysis.

Focus on deep strategic insights, complex human motivations, cultural context, competitive landscape, and actionable recommendations. Return JSON only.` :
      `Analyze this content with MEDIUM length responses (3-5 sentences per field):

Title: ${title}
Content: ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}

MANDATORY: Every field in truthAnalysis must contain exactly 3-5 sentences. This is CRITICAL for proper analysis.

Return JSON only.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05,
      max_tokens: isDeepAnalysis ? 2500 : 1500
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(responseContent);
      debugLogger.info('Successfully parsed medium analysis', { 
        hasSummary: !!analysis.summary,
        hasTruthAnalysis: !!analysis.truthAnalysis,
        hasKeywords: !!analysis.keywords,
        summaryLength: analysis.summary?.length || 0,
        factLength: analysis.truthAnalysis?.fact?.length || 0,
        observationLength: analysis.truthAnalysis?.observation?.length || 0
      });
    } catch (parseError) {
      debugLogger.error('JSON parsing failed', { response: responseContent, error: parseError });
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
      competitiveInsights: analysis.competitiveInsights || [],
      strategicInsights: analysis.strategicInsights || [],
      strategicActions: analysis.strategicActions || []
    };

    return result;
  }

  private async adjustAnalysis(mediumAnalysis: EnhancedAnalysisResult, lengthPreference: 'short' | 'long' | 'bulletpoints', analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    const adjustmentPrompt = `You are adjusting an existing strategic analysis from MEDIUM format to ${lengthPreference} format. 

EXISTING MEDIUM ANALYSIS:
${JSON.stringify(mediumAnalysis, null, 2)}

ADJUSTMENT REQUIREMENTS:
- ${lengthPreference === 'short' ? 'Condense each truthAnalysis field to exactly 2 sentences (no more, no less)' : lengthPreference === 'long' ? 'Expand each truthAnalysis field to exactly 5-7 sentences' : 'Convert each truthAnalysis field to exactly 5-12 bullet points'}
- Keep the same core insights and strategic direction
- ${lengthPreference === 'short' ? 'Preserve the most critical insights while condensing' : lengthPreference === 'long' ? 'Add more depth, context, and specific details' : 'Structure information as clear, actionable bullet points'}
- Maintain the same JSON structure exactly
- MANDATORY: Follow the exact sentence/bullet point counts specified
- Do not change the sentiment, tone, or keywords
- Only adjust the truthAnalysis fields (fact, observation, insight, humanTruth, culturalMoment)

Return the adjusted analysis in the exact same JSON format with ${lengthPreference} length responses.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a strategic analyst adjusting existing analysis format. Maintain the same JSON structure and only adjust the truthAnalysis fields according to the specified requirements." },
        { role: "user", content: adjustmentPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05,
      max_tokens: lengthPreference === 'long' ? 2800 : lengthPreference === 'bulletpoints' ? 2500 : 1200
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI adjustment');
    }

    let adjustedAnalysis;
    try {
      adjustedAnalysis = JSON.parse(responseContent);
      debugLogger.info('Successfully adjusted analysis', { 
        lengthPreference,
        factLength: adjustedAnalysis.truthAnalysis?.fact?.length || 0,
        observationLength: adjustedAnalysis.truthAnalysis?.observation?.length || 0
      });
    } catch (parseError) {
      debugLogger.error('JSON parsing failed for adjustment', { response: responseContent, error: parseError });
      // Return original analysis if adjustment fails
      return mediumAnalysis;
    }

    const result: EnhancedAnalysisResult = {
      summary: adjustedAnalysis.summary || mediumAnalysis.summary,
      sentiment: adjustedAnalysis.sentiment || mediumAnalysis.sentiment,
      tone: adjustedAnalysis.tone || mediumAnalysis.tone,
      keywords: adjustedAnalysis.keywords || mediumAnalysis.keywords,
      confidence: adjustedAnalysis.confidence || mediumAnalysis.confidence,
      truthAnalysis: {
        fact: adjustedAnalysis.truthAnalysis?.fact || mediumAnalysis.truthAnalysis.fact,
        observation: adjustedAnalysis.truthAnalysis?.observation || mediumAnalysis.truthAnalysis.observation,
        insight: adjustedAnalysis.truthAnalysis?.insight || mediumAnalysis.truthAnalysis.insight,
        humanTruth: adjustedAnalysis.truthAnalysis?.humanTruth || mediumAnalysis.truthAnalysis.humanTruth,
        culturalMoment: adjustedAnalysis.truthAnalysis?.culturalMoment || mediumAnalysis.truthAnalysis.culturalMoment,
        attentionValue: adjustedAnalysis.truthAnalysis?.attentionValue || mediumAnalysis.truthAnalysis.attentionValue,
        platform: adjustedAnalysis.truthAnalysis?.platform || mediumAnalysis.truthAnalysis.platform,
        cohortOpportunities: adjustedAnalysis.truthAnalysis?.cohortOpportunities || mediumAnalysis.truthAnalysis.cohortOpportunities
      },
      cohortSuggestions: adjustedAnalysis.cohortSuggestions || mediumAnalysis.cohortSuggestions,
      platformContext: adjustedAnalysis.platformContext || mediumAnalysis.platformContext,
      viralPotential: adjustedAnalysis.viralPotential || mediumAnalysis.viralPotential,
      competitiveInsights: adjustedAnalysis.competitiveInsights || mediumAnalysis.competitiveInsights,
      strategicInsights: adjustedAnalysis.strategicInsights || mediumAnalysis.strategicInsights,
      strategicActions: adjustedAnalysis.strategicActions || mediumAnalysis.strategicActions
    };

    return result;
  }
}

export const openaiService = new OpenAIService();