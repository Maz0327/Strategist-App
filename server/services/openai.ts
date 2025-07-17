import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
const openai = new OpenAI({ 
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
  private cache: Map<string, { result: EnhancedAnalysisResult; timestamp: number }> = new Map();
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  private getCacheKey(content: string, lengthPreference: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content + lengthPreference).digest('hex');
  }

  private getFromCache(key: string): EnhancedAnalysisResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCache(key: string, result: EnhancedAnalysisResult): void {
    this.cache.set(key, { result, timestamp: Date.now() });
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference });
    
    const content = data.content || '';
    const cacheKey = this.getCacheKey(content, lengthPreference);
    
    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      debugLogger.info('Returning cached analysis result', { cacheKey: cacheKey.substring(0, 8) });
      if (onProgress) {
        onProgress('Retrieved from cache', 100);
      }
      return cachedResult;
    }
    
    const maxChunkLength = 10000; // ~2500 tokens per chunk for safety
    
    let result: EnhancedAnalysisResult;
    
    // Check if content needs chunking
    if (content.length > maxChunkLength) {
      debugLogger.info('Content requires chunking', { originalLength: content.length, maxChunkLength });
      result = await this.analyzeContentInChunks(data, lengthPreference, onProgress);
    } else {
      // Process normally for shorter content
      result = await this.analyzeSingleContent(data, lengthPreference, onProgress);
    }
    
    // Cache the result
    this.setCache(cacheKey, result);
    
    return result;
  }

  private async analyzeContentInChunks(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    const content = data.content || '';
    const maxChunkLength = 10000;
    
    // Split content into chunks intelligently (by paragraphs when possible)
    const chunks = this.splitContentIntoChunks(content, maxChunkLength);
    debugLogger.info('Processing content in chunks', { totalChunks: chunks.length, originalLength: content.length });
    
    if (onProgress) {
      onProgress('Processing large content in segments', 10);
    }
    
    // Process each chunk
    const chunkResults: EnhancedAnalysisResult[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkData = { ...data, content: chunk };
      
      if (onProgress) {
        const progress = 10 + (i / chunks.length) * 70; // 10% to 80%
        onProgress(`Analyzing segment ${i + 1} of ${chunks.length}`, progress);
      }
      
      debugLogger.info(`Processing chunk ${i + 1}/${chunks.length}`, { chunkLength: chunk.length });
      
      try {
        const result = await this.analyzeSingleContent(chunkData, lengthPreference);
        chunkResults.push(result);
        
        // Small delay between chunks to prevent rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        debugLogger.error(`Failed to analyze chunk ${i + 1}`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    if (onProgress) {
      onProgress('Combining analysis results', 85);
    }
    
    // Combine all chunk results into unified analysis
    const combinedResult = this.combineChunkResults(chunkResults, data);
    
    if (onProgress) {
      onProgress('Analysis complete', 100);
    }
    
    return combinedResult;
  }

  private splitContentIntoChunks(content: string, maxLength: number): string[] {
    const chunks: string[] = [];
    
    // First, try to split by paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length + 2 <= maxLength) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
        
        // If single paragraph is too long, split by sentences
        if (paragraph.length > maxLength) {
          const sentences = paragraph.split(/[.!?]+\s+/);
          let sentenceChunk = '';
          
          for (const sentence of sentences) {
            if (sentenceChunk.length + sentence.length + 2 <= maxLength) {
              sentenceChunk += (sentenceChunk ? '. ' : '') + sentence;
            } else {
              if (sentenceChunk) {
                chunks.push(sentenceChunk + '.');
                sentenceChunk = '';
              }
              
              // If single sentence is still too long, force split
              if (sentence.length > maxLength) {
                const words = sentence.split(' ');
                let wordChunk = '';
                
                for (const word of words) {
                  if (wordChunk.length + word.length + 1 <= maxLength) {
                    wordChunk += (wordChunk ? ' ' : '') + word;
                  } else {
                    if (wordChunk) {
                      chunks.push(wordChunk);
                      wordChunk = '';
                    }
                    wordChunk = word;
                  }
                }
                
                if (wordChunk) {
                  sentenceChunk = wordChunk;
                }
              } else {
                sentenceChunk = sentence;
              }
            }
          }
          
          if (sentenceChunk) {
            currentChunk = sentenceChunk + '.';
          }
        } else {
          currentChunk = paragraph;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  private combineChunkResults(chunkResults: EnhancedAnalysisResult[], originalData: AnalyzeContentData): EnhancedAnalysisResult {
    if (chunkResults.length === 0) {
      throw new Error('No successful chunk analysis results to combine');
    }
    
    if (chunkResults.length === 1) {
      return chunkResults[0];
    }
    
    // Combine summaries
    const combinedSummary = `Comprehensive analysis of ${originalData.title || 'content'}: ${chunkResults.map(r => r.summary).join(' ')}`;
    
    // Aggregate sentiment (most common)
    const sentiments = chunkResults.map(r => r.sentiment);
    const sentimentCounts = sentiments.reduce((acc: Record<string, number>, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});
    const dominantSentiment = Object.entries(sentimentCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
    
    // Combine tone (most professional approach)
    const tones = chunkResults.map(r => r.tone);
    const toneCounts = tones.reduce((acc: Record<string, number>, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {});
    const dominantTone = Object.entries(toneCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
    
    // Merge and deduplicate keywords
    const allKeywords = chunkResults.flatMap(r => r.keywords);
    const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 7); // Top 7 unique keywords
    
    // Combine truth analysis (take most comprehensive)
    const truthAnalyses = chunkResults.map(r => r.truthAnalysis);
    const combinedTruthAnalysis = {
      fact: truthAnalyses.map(t => t.fact).join(' '),
      observation: truthAnalyses.map(t => t.observation).join(' '),
      insight: truthAnalyses.map(t => t.insight).join(' '),
      humanTruth: truthAnalyses.map(t => t.humanTruth).join(' '),
      culturalMoment: truthAnalyses.map(t => t.culturalMoment).join(' '),
      attentionValue: truthAnalyses.filter(t => t.attentionValue === 'high').length > 0 ? 'high' : 
                     truthAnalyses.filter(t => t.attentionValue === 'medium').length > 0 ? 'medium' : 'low',
      platform: truthAnalyses[0]?.platform || 'unknown',
      cohortOpportunities: Array.from(new Set(truthAnalyses.flatMap(t => t.cohortOpportunities))).slice(0, 5)
    };
    
    // Combine other arrays and deduplicate
    const combinedCohortSuggestions = Array.from(new Set(chunkResults.flatMap(r => r.cohortSuggestions))).slice(0, 5);
    const combinedCompetitiveInsights = Array.from(new Set(chunkResults.flatMap(r => r.competitiveInsights))).slice(0, 5);
    const combinedStrategicInsights = Array.from(new Set(chunkResults.flatMap(r => r.strategicInsights))).slice(0, 5);
    const combinedStrategicActions = Array.from(new Set(chunkResults.flatMap(r => r.strategicActions))).slice(0, 5);
    
    // Determine overall viral potential
    const viralPotentials = chunkResults.map(r => r.viralPotential);
    const viralPotential = viralPotentials.filter(v => v === 'high').length > 0 ? 'high' : 
                          viralPotentials.filter(v => v === 'medium').length > 0 ? 'medium' : 'low';
    
    return {
      summary: combinedSummary,
      sentiment: dominantSentiment,
      tone: dominantTone,
      keywords: uniqueKeywords,
      confidence: `${Math.round(chunkResults.reduce((acc, r) => acc + parseInt(r.confidence), 0) / chunkResults.length)}%`,
      truthAnalysis: combinedTruthAnalysis as TruthAnalysis,
      cohortSuggestions: combinedCohortSuggestions,
      platformContext: `Multi-segment analysis combining insights from ${chunkResults.length} content sections`,
      viralPotential: viralPotential as 'high' | 'medium' | 'low',
      competitiveInsights: combinedCompetitiveInsights,
      strategicInsights: combinedStrategicInsights,
      strategicActions: combinedStrategicActions
    };
  }

  private async analyzeSingleContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    const processedContent = data.content || '';
    const startTime = Date.now();
    
    const getLengthInstructions = (preference: string) => {
      switch (preference) {
        case 'short':
          return 'CRITICAL: Each truth analysis field (fact, observation, insight, humanTruth, culturalMoment) must be EXACTLY 1-2 sentences. No more, no less.';
        case 'medium':
          return 'CRITICAL: Each truth analysis field (fact, observation, insight, humanTruth, culturalMoment) must be EXACTLY 3-5 sentences. This is the default length.';
        case 'long':
          return 'CRITICAL: Each truth analysis field (fact, observation, insight, humanTruth, culturalMoment) must be EXACTLY 6-9 sentences with detailed explanations and context.';
        case 'bulletpoints':
          return 'CRITICAL: Each truth analysis field (fact, observation, insight, humanTruth, culturalMoment) must be formatted as bullet points using • symbols. Each field should have 3-5 bullet points with concise, impactful statements.';
        default:
          return 'CRITICAL: Each truth analysis field (fact, observation, insight, humanTruth, culturalMoment) must be EXACTLY 3-5 sentences. This is the default length.';
      }
    };
    
    // Build prompt with proper template literal interpolation
    const lengthInstructions = lengthPreference === 'bulletpoints' ? 
      'Use bullet points with • symbols for each field' : 
      `Use ${lengthPreference} length (${lengthPreference === 'short' ? '1-2 sentences' : 
        lengthPreference === 'medium' ? '3-5 sentences' : '6-9 sentences'}) for each field`;

    // Define function schema for structured output
    const functions = [{
      name: "analyzeContent",
      description: "Returns comprehensive strategic analysis of content",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Strategic overview of the content" },
          sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
          tone: { type: "string", enum: ["professional", "casual", "urgent", "analytical", "encouraging"] },
          keywords: { 
            type: "array", 
            items: { type: "string" },
            description: "5-7 key strategic keywords"
          },
          confidence: { type: "string", description: "Confidence percentage (e.g., '85%')" },
          truthAnalysis: {
            type: "object",
            properties: {
              fact: { type: "string", description: `What factually happened - ${lengthInstructions}` },
              observation: { type: "string", description: `What patterns you observe - ${lengthInstructions}` },
              insight: { type: "string", description: `Why this is happening - ${lengthInstructions}` },
              humanTruth: { type: "string", description: `Deep psychological driver - ${lengthInstructions}` },
              culturalMoment: { type: "string", description: `Larger cultural shift this represents - ${lengthInstructions}` },
              attentionValue: { type: "string", enum: ["high", "medium", "low"] },
              platform: { type: "string", description: "Platform or context" },
              cohortOpportunities: { 
                type: "array", 
                items: { type: "string" },
                description: "Specific behavioral audience segments"
              }
            },
            required: ["fact", "observation", "insight", "humanTruth", "culturalMoment", "attentionValue", "platform", "cohortOpportunities"]
          },
          cohortSuggestions: { 
            type: "array", 
            items: { type: "string" },
            description: "3-5 audience cohort suggestions"
          },
          platformContext: { type: "string", description: "Platform relevance explanation" },
          viralPotential: { type: "string", enum: ["high", "medium", "low"] },
          competitiveInsights: { 
            type: "array", 
            items: { type: "string" },
            description: "3-5 competitive insights"
          },
          strategicInsights: { 
            type: "array", 
            items: { type: "string" },
            description: "3-5 strategic business insights"
          },
          strategicActions: { 
            type: "array", 
            items: { type: "string" },
            description: "3-5 actionable next steps"
          }
        },
        required: ["summary", "sentiment", "tone", "keywords", "confidence", "truthAnalysis", "cohortSuggestions", "platformContext", "viralPotential", "competitiveInsights", "strategicInsights", "strategicActions"]
      }
    }];

    try {
      debugLogger.info('Sending request to OpenAI API', { model: 'gpt-4o-mini', contentLength: processedContent.length });
      
      // Progress tracking for better UX
      if (onProgress) {
        onProgress('Analyzing content with OpenAI', 10);
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Keeping cost-efficient model as requested
        messages: [
          {
            role: "system",
            content: `You are an expert content strategist assistant. Analyze content for strategic insights using the Truth Analysis framework: Fact → Observation → Insight → Human Truth → Cultural Moment. Use temperature 0.0 for deterministic output.`
          },
          {
            role: "user",
            content: `Analyze this content for strategic insights:

Title: ${data.title || 'N/A'}
Content: ${processedContent}
URL: ${data.url || 'N/A'}

Provide comprehensive analysis following the Truth Analysis framework.`
          }
        ],
        temperature: 0.0,
        max_tokens: 4000,
        functions,
        function_call: { name: "analyzeContent" }
      });
      
      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('No function call received from OpenAI');
      }

      if (onProgress) {
        onProgress('Processing analysis results', 80);
      }

      const analysis = JSON.parse(functionCall.arguments);
      
      if (onProgress) {
        onProgress('Analysis complete', 100);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[OpenAI] Analysis completed in ${processingTime}ms`);

      // Return structured result with validation
      return {
        summary: analysis.summary || 'Strategic analysis completed',
        sentiment: analysis.sentiment || 'neutral',
        tone: analysis.tone || 'professional',
        keywords: analysis.keywords || [],
        confidence: analysis.confidence || '85%',
        truthAnalysis: analysis.truthAnalysis || {
          fact: 'Analysis pending',
          observation: 'Patterns being analyzed',
          insight: 'Insights being generated',
          humanTruth: 'Human motivations being explored',
          culturalMoment: 'Cultural context being evaluated',
          attentionValue: 'medium',
          platform: 'unknown',
          cohortOpportunities: []
        },
        cohortSuggestions: analysis.cohortSuggestions || [],
        platformContext: analysis.platformContext || 'General analysis',
        viralPotential: analysis.viralPotential || 'medium',
        competitiveInsights: analysis.competitiveInsights || [],
        strategicInsights: analysis.strategicInsights || [],
        strategicActions: analysis.strategicActions || []
      };
    } catch (error: any) {
      debugLogger.error('OpenAI analysis failed', error);
      
      // Track failed API call - skip tracking if no valid user
      /* analyticsService.trackExternalApiCall({
        userId: 0, // System user for now, will be updated with actual user context
        service: 'openai',
        endpoint: 'chat/completions',
        method: 'POST',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message,
        metadata: {
          model: 'gpt-4o-mini',
          promptLength: prompt.length,
          contentLength: processedContent.length
        }
      }); */
      
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }

  private processOpenAIResponse(response: any, startTime: number): EnhancedAnalysisResult {
    const responseTime = Date.now() - startTime;
    const tokensUsed = response.usage?.total_tokens || 0;
    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;
    
    debugLogger.info('OpenAI API response received', { 
      responseTime, 
      tokensUsed,
      promptTokens,
      completionTokens
    });

    // Track successful API call - skip tracking if no valid user
    /* analyticsService.trackExternalApiCall({
      userId: 0, // System user for now, will be updated with actual user context
      service: 'openai',
      endpoint: 'chat/completions',
      method: 'POST',
      statusCode: 200,
      responseTime,
      tokensUsed,
      cost: Math.round(tokensUsed * 0.00015 * 100), // Cost in cents ($0.00015 per token for gpt-4o-mini)
      metadata: {
        model: 'gpt-4o-mini',
        promptTokens,
        completionTokens,
        finishReason: response.choices[0]?.finish_reason
      }
    }); */

    const result = JSON.parse(response.choices[0].message.content || "{}");
    debugLogger.info('OpenAI response parsed successfully', { 
      hasSummary: !!result.summary,
      sentiment: result.sentiment,
      keywordCount: result.keywords?.length || 0,
      confidence: result.confidence
    });
    
    return {
      summary: result.summary || "No summary available",
      sentiment: result.sentiment || "Neutral",
      tone: result.tone || "Professional",
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
  }
}

export const openaiService = new OpenAIService();
