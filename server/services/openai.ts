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
      return `Expert content strategist. Provide comprehensive strategic analysis with deep insights. ${lengthInstruction}. 

CRITICAL: Write your responses in a conversational, human tone - like you're discussing insights with your strategy team. Avoid robotic language. Be professional but natural and engaging.

KEYWORDS REQUIREMENT: Extract 3-20 strategically and culturally relevant keywords only. Include trending terms, industry-specific language, cultural references, and strategic concepts. ONLY include keywords that have genuine strategic or cultural relevance - no generic filler words. Minimum 3, maximum 20, but only if they are truly strategic/cultural.

Return valid JSON:
{
  "summary": "Multi-sentence strategic summary providing comprehensive analysis of the content's strategic value and implications. Each response field must follow the exact sentence count requirements specified.",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["strategic keyword1", "cultural keyword2", "relevant keyword3", "strategic keyword4", "cultural keyword5"],
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
  "competitiveInsights": ["detailed insight1", "detailed insight2", "detailed insight3"]
}`;
    } else {
      return `Expert content strategist. Analyze content for strategic insights. ${lengthInstruction}. 

CRITICAL: Write your responses in a conversational, human tone - like you're discussing insights with your strategy team. Avoid robotic language. Be professional but natural and engaging.

KEYWORDS REQUIREMENT: Extract 3-20 strategically and culturally relevant keywords only. Include trending terms, industry-specific language, cultural references, and strategic concepts. ONLY include keywords that have genuine strategic or cultural relevance - no generic filler words. Minimum 3, maximum 20, but only if they are truly strategic/cultural.

Return valid JSON:
{
  "summary": "Multi-sentence strategic summary following the exact sentence count requirements specified in the length preference",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["strategic keyword1", "cultural keyword2", "relevant keyword3", "strategic keyword4", "cultural keyword5"],
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
  "competitiveInsights": ["insight1", "insight2", "insight3", "insight4", "insight5"]
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
      debugLogger.info('Returning cached analysis for ' + lengthPreference, { cacheKey: targetCacheKey });
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
    
    debugLogger.info('Returning adjusted analysis', { cached: true, lengthPreference });
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
MANDATORY: strategicInsights, strategicActions, and competitiveInsights arrays must contain exactly 5 items each.

Focus on deep strategic insights, complex human motivations, cultural context, competitive landscape, and actionable recommendations. Return JSON only.` :
      `Analyze this content with MEDIUM length responses (3-5 sentences per field):

Title: ${title}
Content: ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}

MANDATORY: Every field in truthAnalysis must contain exactly 3-5 sentences. This is CRITICAL for proper analysis.
MANDATORY: strategicInsights, strategicActions, and competitiveInsights arrays must contain exactly 5 items each.

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

    // Use OpenAI for short/long analysis (for quality depth)
    debugLogger.info('OpenAI adjustment to ' + lengthPreference);
    
    const adjustmentPrompt = `Adjust the following analysis to ${lengthPreference} format. Keep the same strategic insights and JSON structure.

CURRENT ANALYSIS (Medium length):
${JSON.stringify(mediumAnalysis.truthAnalysis, null, 2)}

REQUIREMENTS:
- ${lengthPreference === 'short' ? 'Exactly 2-3 sentences per field' : 'Exactly 5-7 sentences per field'}
- Keep the same strategic insights and conclusions
- Maintain professional strategic analysis quality
- Focus on actionable intelligence and cultural context
- Only adjust truthAnalysis fields: fact, observation, insight, humanTruth, culturalMoment

Return ONLY the truthAnalysis JSON object with adjusted fields.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are adjusting strategic analysis length while preserving quality and insights. Write in a conversational, human tone - like discussing insights with your strategy team. Return only the truthAnalysis JSON object." },
        { role: "user", content: adjustmentPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: lengthPreference === 'short' ? 800 : 1500
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      debugLogger.error('No response from OpenAI adjustment');
      return mediumAnalysis;
    }

    let adjustedTruthAnalysis;
    try {
      adjustedTruthAnalysis = JSON.parse(responseContent);
    } catch (parseError) {
      debugLogger.error('Failed to parse OpenAI adjustment response', { error: parseError });
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