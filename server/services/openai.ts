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

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium'): Promise<EnhancedAnalysisResult> {
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference });
    
    const content = data.content || '';
    const title = data.title || '';
    const url = data.url || '';
    
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = createCacheKey(content + title + lengthPreference, 'analysis');
    const cached = await analysisCache.get(cacheKey);
    
    if (cached) {
      const cacheTime = Date.now() - startTime;
      debugLogger.info('Analysis cache hit', { cacheKey, duration: cacheTime });
      performanceMonitor.logRequest('/api/analyze', 'POST', cacheTime, true, true);
      return cached;
    }
    
    try {
      // Use standard chat completions with JSON mode for fast response
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are an expert content strategist. Analyze content for strategic insights, human motivations, and cultural context. Always respond with valid JSON in this exact format:

{
  "summary": "Strategic summary of the content",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["keyword1", "keyword2", "etc"],
  "confidence": "percentage like 85%",
  "truthAnalysis": {
    "fact": "3-5 sentences stating objective facts",
    "observation": "3-5 sentences describing observed patterns", 
    "insight": "3-5 sentences providing strategic insights",
    "humanTruth": "3-5 sentences explaining human motivations",
    "culturalMoment": "3-5 sentences identifying cultural context",
    "attentionValue": "high|medium|low",
    "platform": "most relevant platform",
    "cohortOpportunities": ["audience1", "audience2"]
  },
  "cohortSuggestions": ["cohort1", "cohort2"],
  "platformContext": "3-5 sentences explaining platform-specific context",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["insight1", "insight2"],
  "strategicInsights": ["recommendation1", "recommendation2"],
  "strategicActions": ["action1", "action2"]
}` 
          },
          { 
            role: "user", 
            content: `Analyze this content strategically:
            
Title: ${title}
Content: ${content}
URL: ${url}
Length Preference: ${lengthPreference}

Focus on strategic insights, human motivations, and cultural context. Return valid JSON only.` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content from OpenAI');
      }

      debugLogger.info(`OpenAI response received, content length: ${responseContent.length}`);
      
      let analysis;
      try {
        analysis = JSON.parse(responseContent);
        debugLogger.info('Successfully parsed OpenAI response', { 
          hasSummary: !!analysis.summary,
          hasTruthAnalysis: !!analysis.truthAnalysis,
          hasKeywords: !!analysis.keywords
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
          fact: analysis.truthAnalysis?.fact || 'Analysis pending',
          observation: analysis.truthAnalysis?.observation || 'Patterns being analyzed',
          insight: analysis.truthAnalysis?.insight || 'Insights being generated',
          humanTruth: analysis.truthAnalysis?.humanTruth || 'Motivations being explored',
          culturalMoment: analysis.truthAnalysis?.culturalMoment || 'Context being evaluated',
          attentionValue: analysis.truthAnalysis?.attentionValue || 'medium',
          platform: analysis.truthAnalysis?.platform || 'unknown',
          cohortOpportunities: analysis.truthAnalysis?.cohortOpportunities || []
        },
        cohortSuggestions: analysis.cohortSuggestions || [],
        platformContext: analysis.platformContext || 'Platform analysis pending',
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