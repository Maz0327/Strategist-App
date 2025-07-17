import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { analysisCache, createCacheKey } from "./cache";
import { performanceMonitor } from "./monitoring";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
  timeout: 45 * 1000, // 45 second timeout
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
    const cached = analysisCache.get(cacheKey);
    
    if (cached) {
      const cacheTime = Date.now() - startTime;
      debugLogger.info('Analysis cache hit', { cacheKey, duration: cacheTime });
      performanceMonitor.logRequest('/api/analyze', 'POST', cacheTime, true, true);
      return cached;
    }
    
    try {
      const prompt = this.buildAnalysisPrompt(content, title, url, lengthPreference);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert content strategist. Analyze content and return structured JSON with strategic insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI');
      }

      debugLogger.info(`OpenAI response received, length: ${analysisText.length}`);
      debugLogger.info('Raw OpenAI response:', { response: analysisText.substring(0, 500) });
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      debugLogger.info('Cleaned response:', { response: cleanedResponse.substring(0, 500) });
      
      let analysis;
      try {
        analysis = JSON.parse(cleanedResponse);
        debugLogger.info('Successfully parsed OpenAI response', { 
          hasSummary: !!analysis.summary,
          hasTruthAnalysis: !!analysis.truthAnalysis,
          hasKeywords: !!analysis.keywords
        });
      } catch (parseError) {
        debugLogger.error('JSON parsing failed', { response: cleanedResponse, error: parseError });
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      debugLogger.info(`Analysis completed in ${Date.now() - startTime}ms`);

      const result = {
        summary: analysis.summary || 'Strategic analysis completed',
        sentiment: analysis.sentiment || 'neutral',
        tone: analysis.tone || 'professional',
        keywords: analysis.keywords || [],
        confidence: analysis.confidence || '85%',
        truthAnalysis: analysis.truthAnalysis || {
          fact: 'Analysis pending',
          observation: 'Patterns being analyzed',
          insight: 'Insights being generated',
          humanTruth: 'Motivations being explored',
          culturalMoment: 'Context being evaluated',
          attentionValue: 'medium',
          platform: 'unknown',
          cohortOpportunities: []
        },
        cohortSuggestions: analysis.cohortSuggestions || [],
        platformContext: analysis.platformContext || 'General context',
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
      analysisCache.set(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, true, false);
      
      return result;
    } catch (error: any) {
      debugLogger.error('OpenAI analysis failed', error);
      const processingTime = Date.now() - startTime;
      performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, false, false);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(content: string, title: string, url: string, lengthPreference: string): string {
    const lengthGuidance = {
      short: "2 sentences",
      medium: "3-5 sentences",
      long: "6-9 sentences",
      bulletpoints: "multiple important points"
    }[lengthPreference] || "3-5 sentences";

    return `Analyze this content for strategic insights:

Title: ${title}
Content: ${content}
URL: ${url}

Provide comprehensive strategic analysis in JSON format. For all text fields, use exactly ${lengthGuidance} as specified:
{
  "summary": "Brief strategic overview (${lengthGuidance})",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent/analytical",
  "keywords": ["strategic", "keywords", "here"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What factually happened (${lengthGuidance})",
    "observation": "What patterns you observe (${lengthGuidance})", 
    "insight": "Why this is happening (${lengthGuidance})",
    "humanTruth": "Deep psychological driver (${lengthGuidance})",
    "culturalMoment": "Larger cultural shift this represents (${lengthGuidance})",
    "attentionValue": "high/medium/low",
    "platform": "Platform or context",
    "cohortOpportunities": ["behavioral audience segments"]
  },
  "cohortSuggestions": ["audience cohort suggestions"],
  "platformContext": "Platform relevance explanation (${lengthGuidance})",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["competitive insights"],
  "strategicInsights": ["strategic business insights"],
  "strategicActions": ["actionable next steps"]
}

IMPORTANT: Ensure all descriptive text fields follow the length requirement of ${lengthGuidance}. Return only valid JSON without markdown formatting.`;
  }
}

export const openaiService = new OpenAIService();
