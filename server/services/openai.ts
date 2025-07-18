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

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', analysisMode: 'quick' | 'deep' = 'quick'): Promise<EnhancedAnalysisResult> {
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference, analysisMode });
    
    const content = data.content || '';
    const title = data.title || '';
    const url = data.url || '';
    
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = createCacheKey(content + title + lengthPreference + analysisMode, 'analysis');
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
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: isDeepAnalysis ? `Expert content strategist. Provide comprehensive strategic analysis with deep insights. Return valid JSON:
{
  "summary": "Detailed strategic summary with multiple perspectives",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "Comprehensive facts with context and implications",
    "observation": "Detailed patterns with cross-references and connections",
    "insight": "Deep strategic insights with actionable implications",
    "humanTruth": "Complex human motivations and psychological drivers",
    "culturalMoment": "Rich cultural context with historical and future implications",
    "attentionValue": "high|medium|low",
    "platform": "relevant platform with cross-platform considerations",
    "cohortOpportunities": ["detailed audience1", "detailed audience2", "detailed audience3"]
  },
  "cohortSuggestions": ["cohort1", "cohort2", "cohort3", "cohort4"],
  "platformContext": "Comprehensive platform analysis with specific tactical recommendations",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["detailed insight1", "detailed insight2", "detailed insight3"],
  "strategicInsights": ["comprehensive recommendation1", "comprehensive recommendation2", "comprehensive recommendation3"],
  "strategicActions": ["detailed action1", "detailed action2", "detailed action3", "detailed action4"]
}` : `Expert content strategist. Analyze content for strategic insights. Return valid JSON:
{
  "summary": "Brief strategic summary",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["keyword1", "keyword2"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "Key facts",
    "observation": "Key patterns",
    "insight": "Strategic insight",
    "humanTruth": "Human motivation",
    "culturalMoment": "Cultural context",
    "attentionValue": "high|medium|low",
    "platform": "relevant platform",
    "cohortOpportunities": ["audience1", "audience2"]
  },
  "cohortSuggestions": ["cohort1", "cohort2"],
  "platformContext": "Platform context",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["insight1", "insight2"],
  "strategicInsights": ["recommendation1", "recommendation2"],
  "strategicActions": ["action1", "action2"]
}` 
          },
          { 
            role: "user", 
            content: isDeepAnalysis ? 
              `Provide comprehensive strategic analysis of this content:

Title: ${title}
Content: ${content.substring(0, 4000)}${content.length > 4000 ? '...' : ''}
Length Preference: ${lengthPreference}

Focus on deep strategic insights, complex human motivations, cultural context, competitive landscape, and actionable recommendations. Return JSON only.` :
              `Analyze: ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}\n\nTitle: ${title}\nReturn JSON only.` 
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