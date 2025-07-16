import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { googleNgramService } from "./google-ngram";
import { cacheService } from "./cache-service";
import { structuredLogger } from "./structured-logger";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
  timeout: 30 * 1000, // Reduce timeout to 30 seconds
  maxRetries: 1, // Reduce retries for faster response
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
  historicalContext?: {
    pattern: string;
    currentPhase: string;
    insight: string;
    peaks: number[];
    strategicTiming: string;
  };
}

export class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  // Optimized simple hash function for content caching
  private hashContent(content: string): string {
    if (content.length === 0) return '0';
    // Use first 100 chars + length for faster hashing
    const sample = content.substring(0, 100) + content.length;
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = ((hash << 5) - hash) + sample.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    // Optimized cache key
    const cacheKey = `${this.hashContent(data.content || '')}_${lengthPreference}`;
    
    // Quick cache check
    const cachedResult = cacheService.getAnalysis(cacheKey);
    if (cachedResult) {
      if (onProgress) onProgress('Cached', 100);
      return cachedResult;
    }
    
    // Direct analysis without chunking complexity
    const result = await this.analyzeSingleContent(data, lengthPreference, onProgress);
    
    // Cache result
    cacheService.setAnalysis(cacheKey, result);
    
    return result;
  }

  // Removed chunking for speed optimization







  private async analyzeSingleContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    // Simplified content processing
    const content = data.content || '';
    const contentLimit = lengthPreference === 'short' ? 1000 : (lengthPreference === 'medium' ? 1500 : 2000);
    const processedContent = content.slice(0, contentLimit);
    
    // Streamlined prompt
    const prompt = `Analyze: ${data.title || 'Content'}
Content: ${processedContent}

Return JSON with: summary, sentiment, tone, keywords, confidence, truthAnalysis{fact, observation, insight, humanTruth, culturalMoment, attentionValue, platform, cohortOpportunities}, cohortSuggestions, platformContext, viralPotential, competitiveInsights, strategicInsights, strategicActions`;

    try {
      const startTime = Date.now();
      
      // Optimized token limits for speed
      const tokenLimit = lengthPreference === 'short' ? 300 : (lengthPreference === 'medium' ? 500 : 700);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: tokenLimit,
        top_p: 0.5,
        presence_penalty: 0.3,
        frequency_penalty: 0.2
      });

      // Direct response processing
      const result = this.processOpenAIResponse(response, startTime, null);
      
      if (onProgress) onProgress('Complete', 100);
      
      return result;
    } catch (error: any) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  private processOpenAIResponse(response: any, startTime: number, historicalContext?: any): EnhancedAnalysisResult {
    try {
      const result = JSON.parse(response.choices[0].message.content);
      
      return {
        summary: result.summary || "No summary available",
        sentiment: result.sentiment || "neutral",
        tone: result.tone || "professional",
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        confidence: result.confidence || "85%",
        truthAnalysis: result.truthAnalysis || {
          fact: 'Not identified',
          observation: 'Not identified',
          insight: 'Not identified',
          humanTruth: 'Not identified',
          culturalMoment: 'Not identified',
          attentionValue: 'medium',
          platform: 'unknown',
          cohortOpportunities: []
        },
        cohortSuggestions: result.cohortSuggestions || [],
        platformContext: result.platformContext || 'Platform context not identified',
        viralPotential: result.viralPotential || 'medium',
        competitiveInsights: result.competitiveInsights || [],
        strategicInsights: result.strategicInsights || [],
        strategicActions: result.strategicActions || []
      };
    } catch (parseError) {
      throw new Error('Failed to parse AI response');
    }
  }

  async generateChatResponse(
    message: string,
    systemContext: string,
    conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<string> {
    try {
      // Track API call for monitoring
      await analyticsService.trackExternalApiCall('openai', 'chat', 'POST', 0, 'pending');
      
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        { role: 'system', content: systemContext },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-efficient model for chat responses
        messages,
        max_tokens: 500, // Limit response length for chat
        temperature: 0.7, // Slightly more conversational
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Track successful API call
      const tokensUsed = response.usage?.total_tokens || 0;
      const cost = tokensUsed * 0.00015; // Approximate cost per token
      await analyticsService.trackExternalApiCall('openai', 'chat', 'POST', cost, 'success', {
        tokensUsed,
        model: 'gpt-4o-mini',
        messageLength: message.length,
        responseLength: content.length
      });

      debugLogger.info('Chat response generated successfully', {
        messageLength: message.length,
        responseLength: content.length,
        tokensUsed,
        cost
      });

      return content;
    } catch (error: any) {
      // Track failed API call
      await analyticsService.trackExternalApiCall('openai', 'chat', 'POST', 0, 'error', {
        error: error.message,
        messageLength: message.length
      });

      debugLogger.error('Failed to generate chat response', error);
      throw new Error(`Chat response generation failed: ${error.message}`);
    }
  }

  /**
   * CRITICAL FIX: Missing generateInsights method for daily reports
   * This method generates strategic insights from provided content/prompt
   */
  async generateInsights(prompt: string): Promise<string> {
    const startTime = Date.now();
    
    // CRITICAL FIX: Check cache for insights generation
    const cachedInsights = cacheService.get(`insights:${prompt.substring(0, 100)}`);
    if (cachedInsights) {
      structuredLogger.info('Insights cache hit', { 
        promptLength: prompt.length,
        type: 'insights_cache_hit'
      });
      return cachedInsights;
    }
    
    try {
      debugLogger.info('Generating strategic insights', { promptLength: prompt.length });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Cost-efficient model as requested
        messages: [
          {
            role: "system",
            content: `You are a senior strategic analyst specializing in cultural intelligence and business insights. 
            Generate strategic insights based on the provided data. Focus on:
            1. Cultural patterns and human behavior trends
            2. Business opportunities and competitive advantages
            3. Actionable recommendations for decision-makers
            4. Cohort identification and targeting strategies
            5. Market timing and attention arbitrage opportunities
            
            Always respond in valid JSON format as requested in the prompt.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Track successful API call
      const tokensUsed = response.usage?.total_tokens || 0;
      const responseTime = Date.now() - startTime;
      
      await analyticsService.trackExternalApiCall({
        userId: 0, // System user for daily reports
        service: 'openai',
        endpoint: 'chat/completions',
        method: 'POST',
        statusCode: 200,
        responseTime,
        tokensUsed,
        cost: Math.round(tokensUsed * 0.00015 * 100), // Cost in cents
        metadata: {
          model: 'gpt-4o-mini',
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          purpose: 'daily_insights_generation'
        }
      });

      debugLogger.info('Strategic insights generated successfully', {
        responseTime,
        tokensUsed,
        contentLength: content.length
      });

      // Cache the insights
      cacheService.set(`insights:${prompt.substring(0, 100)}`, content, 2 * 60 * 60 * 1000); // 2 hours

      return content;
    } catch (error: any) {
      debugLogger.error('Strategic insights generation failed', error);
      
      // Track failed API call
      await analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'openai',
        endpoint: 'chat/completions',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message,
        metadata: {
          model: 'gpt-4o-mini',
          promptLength: prompt.length,
          purpose: 'daily_insights_generation'
        }
      });
      
      throw new Error(`Failed to generate strategic insights: ${error.message}`);
    }
  }
}

export const openaiService = new OpenAIService();
