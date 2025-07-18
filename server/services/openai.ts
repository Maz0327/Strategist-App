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
    
    // Check cache first - include timestamp to force new requests after prompt changes
    const cacheKey = createCacheKey(content + title + lengthPreference + analysisMode + 'v2', 'analysis');
    const cached = await analysisCache.get(cacheKey);
    
    if (cached) {
      const cacheTime = Date.now() - startTime;
      debugLogger.info('Analysis cache hit', { cacheKey, duration: cacheTime });
      performanceMonitor.logRequest('/api/analyze', 'POST', cacheTime, true, true);
      return cached;
    }
    
    try {
      // Choose analysis approach based on mode
      const isDeepAnalysis = analysisMode === 'deep';
      
      // Log the actual prompt being sent
      const systemPrompt = this.getSystemPrompt(lengthPreference, isDeepAnalysis);
      const userPrompt = isDeepAnalysis ? 
        `Provide comprehensive strategic analysis of this content with ${lengthPreference} length responses:

Title: ${title}
Content: ${content.substring(0, 4000)}${content.length > 4000 ? '...' : ''}
Length Preference: ${lengthPreference} (${lengthPreference === 'short' ? '2-3 sentences per field' : lengthPreference === 'medium' ? '3-4 sentences per field' : lengthPreference === 'long' ? '4-6 sentences per field' : 'bullet points where applicable'})

CRITICAL: Every field in truthAnalysis (fact, observation, insight, humanTruth, culturalMoment) must contain exactly the number of sentences specified above. Do not use single sentences or incomplete responses.

Focus on deep strategic insights, complex human motivations, cultural context, competitive landscape, and actionable recommendations. Return JSON only.` :
        `Analyze this content with ${lengthPreference} length responses:

Title: ${title}
Content: ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}
Length Preference: ${lengthPreference} (${lengthPreference === 'short' ? '2-3 sentences per field' : lengthPreference === 'medium' ? '3-4 sentences per field' : lengthPreference === 'long' ? '4-6 sentences per field' : 'bullet points where applicable'})

CRITICAL: Every field in truthAnalysis (fact, observation, insight, humanTruth, culturalMoment) must contain exactly the number of sentences specified above. Do not use single sentences or incomplete responses.

Return JSON only.`;
      
      debugLogger.info('OpenAI Prompt Details', {
        lengthPreference,
        analysisMode,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        systemPromptStart: systemPrompt.substring(0, 200)
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          { 
            role: "user", 
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.05,
        max_tokens: isDeepAnalysis ? 2500 : 800
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content from OpenAI');
      }

      debugLogger.info(`OpenAI response received, content length: ${responseContent.length}`);
      debugLogger.info('Raw OpenAI Response:', { 
        response: responseContent.substring(0, 500) + '...',
        lengthPreference: lengthPreference,
        analysisMode: analysisMode
      });
      
      let analysis;
      try {
        analysis = JSON.parse(responseContent);
        debugLogger.info('Successfully parsed OpenAI response', { 
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
      
      debugLogger.info(`Analysis completed in ${Date.now() - startTime}ms`);

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
      
      debugLogger.info('Final analysis result:', { 
        summary: result.summary.substring(0, 100),
        sentiment: result.sentiment,
        keywordCount: result.keywords.length,
        truthAnalysisKeys: Object.keys(result.truthAnalysis)
      });
      
      // Cache the result
      await analysisCache.set(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, true, false);
      
      // Track API usage
      try {
        await analyticsService.trackExternalAPICall('openai', 'analyze', processingTime, null, processingTime / 1000);
      } catch (trackingError) {
        debugLogger.warn('Failed to track API call', { error: trackingError });
      }
      
      return result;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      debugLogger.error('OpenAI analysis failed', { 
        error: error.message,
        duration: errorTime,
        contentLength: content.length,
        hasTitle: !!title,
        hasUrl: !!url
      });
      
      performanceMonitor.logRequest('/api/analyze', 'POST', errorTime, false, false);
      
      // Track error
      try {
        await analyticsService.trackExternalAPICall('openai', 'analyze', errorTime, error.message, 0);
      } catch (trackingError) {
        debugLogger.warn('Failed to track API error', { error: trackingError });
      }
      
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();