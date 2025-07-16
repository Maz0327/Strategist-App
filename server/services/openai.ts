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

  // Simple hash function for content caching
  private hashContent(content: string): string {
    let hash = 0;
    if (content.length === 0) return hash.toString();
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    // Enhanced cache key with content hash for better performance
    const contentHash = this.hashContent(data.content || '');
    const cacheKey = `${contentHash}_${lengthPreference}`;
    
    // Check cache first - instant response if available
    const cachedResult = cacheService.getAnalysis(cacheKey);
    if (cachedResult) {
      structuredLogger.info('Analysis cache hit', { 
        title: data.title,
        contentLength: data.content?.length,
        lengthPreference,
        type: 'analysis_cache_hit'
      });
      // Simulate instant progress for cached results
      if (onProgress) {
        onProgress('Loading cached analysis...', 100);
      }
      return cachedResult;
    }
    
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference });
    
    const maxChunkLength = 10000; // ~2500 tokens per chunk for safety
    const content = data.content || '';
    
    let result: EnhancedAnalysisResult;
    
    // Check if content needs chunking
    if (content.length > maxChunkLength) {
      debugLogger.info('Content requires chunking', { originalLength: content.length, maxChunkLength });
      result = await this.analyzeContentInChunks(data, lengthPreference, onProgress);
    } else {
      // Process normally for shorter content
      result = await this.analyzeSingleContent(data, lengthPreference, onProgress);
    }
    
    // Cache the result with enhanced key
    cacheService.setAnalysis(cacheKey, result);
    
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
        
        // Reduced delay between chunks for faster processing
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
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
    const sentimentCounts = sentiments.reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});
    const dominantSentiment = Object.entries(sentimentCounts).sort(([,a], [,b]) => b - a)[0][0];
    
    // Combine tone (most professional approach)
    const tones = chunkResults.map(r => r.tone);
    const toneCounts = tones.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {});
    const dominantTone = Object.entries(toneCounts).sort(([,a], [,b]) => b - a)[0][0];
    
    // Merge and deduplicate keywords
    const allKeywords = chunkResults.flatMap(r => r.keywords);
    const uniqueKeywords = [...new Set(allKeywords)].slice(0, 7); // Top 7 unique keywords
    
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
      platform: truthAnalyses[0].platform,
      cohortOpportunities: [...new Set(truthAnalyses.flatMap(t => t.cohortOpportunities))].slice(0, 5)
    };
    
    // Combine other arrays and deduplicate
    const combinedCohortSuggestions = [...new Set(chunkResults.flatMap(r => r.cohortSuggestions))].slice(0, 5);
    const combinedCompetitiveInsights = [...new Set(chunkResults.flatMap(r => r.competitiveInsights))].slice(0, 5);
    const combinedStrategicInsights = [...new Set(chunkResults.flatMap(r => r.strategicInsights))].slice(0, 5);
    const combinedStrategicActions = [...new Set(chunkResults.flatMap(r => r.strategicActions))].slice(0, 5);
    
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

  private async getHistoricalContext(title: string, content: string): Promise<any> {
    try {
      // Extract key terms from title and content for historical analysis
      const textToAnalyze = `${title} ${content}`.toLowerCase();
      const businessTerms = [
        'artificial intelligence', 'ai', 'machine learning', 'sustainability', 'remote work', 
        'digital transformation', 'influencer marketing', 'blockchain', 'cryptocurrency',
        'social media', 'content marketing', 'ecommerce', 'automation', 'cloud computing'
      ];
      
      // Find relevant terms
      const relevantTerm = businessTerms.find(term => textToAnalyze.includes(term));
      
      if (relevantTerm) {
        const historicalData = await googleNgramService.getHistoricalContext(relevantTerm);
        if (historicalData && historicalData.historical_analysis) {
          return {
            pattern: historicalData.historical_analysis.pattern,
            currentPhase: historicalData.historical_analysis.current_phase,
            insight: historicalData.historical_analysis.insight,
            peaks: historicalData.historical_analysis.peaks,
            strategicTiming: `Based on historical patterns: ${historicalData.historical_analysis.insight}`
          };
        }
      }
    } catch (error) {
      debugLogger.error('Historical context extraction failed', error);
    }
    
    return null;
  }

  private async analyzeSingleContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    // Skip historical context for faster processing in beta
    const historicalContext = null;
    
    if (onProgress) {
      onProgress('Analyzing content', 20);
    }
    const processedContent = data.content || '';
    
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
    
    // Dynamic prompt optimization based on length preference
    const getPromptStructure = (preference: string) => {
      const contentLimit = preference === 'short' ? 1000 : (preference === 'medium' ? 1500 : 2000);
      const lengthInstruction = {
        short: '1 sentence',
        medium: '2-3 sentences', 
        long: '3-4 sentences',
        bulletpoints: 'Use • format'
      }[preference] || '2-3 sentences';
      
      return {
        contentLimit,
        lengthInstruction,
        prompt: `Analyze: ${data.title || 'Untitled'}
Content: ${processedContent.slice(0, contentLimit)}${processedContent.length > contentLimit ? '...' : ''}

JSON:
{
  "summary": "${lengthInstruction}",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent",
  "keywords": ["5 terms"],
  "confidence": "XX%",
  "truthAnalysis": {
    "fact": "${lengthInstruction}",
    "observation": "${lengthInstruction}",
    "insight": "${lengthInstruction}",
    "humanTruth": "${lengthInstruction}",
    "culturalMoment": "${lengthInstruction}",
    "attentionValue": "high/medium/low",
    "platform": "context",
    "cohortOpportunities": ["3 cohorts"]
  },
  "cohortSuggestions": ["3 items"],
  "platformContext": "context",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["3 items"],
  "strategicInsights": ["3 items"],
  "strategicActions": ["3 items"]
}`
      };
    };

    const promptConfig = getPromptStructure(lengthPreference);
    const prompt = promptConfig.prompt;

    try {
      const startTime = Date.now();
      debugLogger.info('Sending request to OpenAI API', { model: 'gpt-4o-mini', promptLength: prompt.length });
      
      // Minimal progress tracking for speed
      if (onProgress) {
        onProgress('Processing...', 30);
      }
      
      // OpenAI API call with timeout prevention strategies
      debugLogger.info('Sending OpenAI API request', { 
        contentLength: processedContent.length,
        promptLength: prompt.length 
      });
      
      // Dynamic token allocation based on length preference for faster responses
      const getTokenLimit = (preference: string) => {
        switch (preference) {
          case 'short': return 400; // Much faster for short responses
          case 'medium': return 800; // Balanced speed and detail
          case 'long': return 1200; // More comprehensive but slower
          case 'bulletpoints': return 600; // Concise structured format
          default: return 800;
        }
      };

      // Minimal progress tracking for speed
      if (onProgress) {
        onProgress('Analyzing...', 60);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Keeping cost-efficient model as requested
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Minimal for fastest responses
        max_tokens: getTokenLimit(lengthPreference), // Dynamic based on user preference
        top_p: 0.7, // Further reduced for faster generation
        presence_penalty: 0.1, // Encourage conciseness
        stream: false
      });

      // Process response
      const result = this.processOpenAIResponse(response, startTime, historicalContext);
      
      if (onProgress) {
        onProgress('Finalizing...', 90);
      }
      
      return result;
    } catch (error: any) {
      debugLogger.error('OpenAI analysis failed', error);
      
      // Track failed API call
      analyticsService.trackExternalApiCall({
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
      });
      
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }

  private processOpenAIResponse(response: any, startTime: number, historicalContext?: any): EnhancedAnalysisResult {
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

    // Track successful API call
    analyticsService.trackExternalApiCall({
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
    });

    const rawContent = response.choices[0].message.content || "{}";
    debugLogger.info('Raw OpenAI response content', { 
      contentLength: rawContent.length,
      contentPreview: rawContent.substring(0, 200),
      finishReason: response.choices[0]?.finish_reason
    });

    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      debugLogger.error('JSON parse error', { 
        error: parseError, 
        rawContent: rawContent.substring(0, 500) 
      });
      // Return a minimal valid response instead of failing
      result = {
        summary: "Analysis parsing failed",
        sentiment: "neutral",
        tone: "professional",
        keywords: [],
        confidence: "0%",
        truthAnalysis: {
          fact: 'JSON parsing failed',
          observation: 'Response format error',
          insight: 'OpenAI returned invalid JSON',
          humanTruth: 'Technical issue occurred',
          culturalMoment: 'System needs debugging',
          attentionValue: 'low',
          platform: 'system',
          cohortOpportunities: []
        },
        cohortSuggestions: [],
        platformContext: 'Parsing error occurred',
        viralPotential: 'low',
        competitiveInsights: [],
        strategicInsights: [],
        strategicActions: []
      };
    }
    
    debugLogger.info('OpenAI response parsed', { 
      hasSummary: !!result.summary,
      sentiment: result.sentiment,
      keywordCount: result.keywords?.length || 0,
      confidence: result.confidence,
      hasTruthAnalysis: !!result.truthAnalysis
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
      strategicActions: result.strategicActions || [],
      historicalContext: historicalContext || undefined
    };
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
