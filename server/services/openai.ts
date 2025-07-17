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
    
    // PERFORMANCE OPTIMIZATION: Skip chunking for speed - process all content in single call
    debugLogger.info('Processing content in single unified call', { contentLength: content.length });
    result = await this.analyzeSingleContent(data, lengthPreference, onProgress);
    
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
    
    const getLengthDesc = (preference: string) => {
      switch (preference) {
        case 'short': return '1-2 sentences';
        case 'medium': return '3-5 sentences';
        case 'long': return '6-9 sentences';
        case 'bulletpoints': return '3-5 bullet points using • symbols';
        default: return '3-5 sentences';
      }
    };

    const lengthDesc = getLengthDesc(lengthPreference);

    // SIMPLIFIED UNIFIED PROMPT
    const prompt = `Analyze this content for strategic insights. For each truthAnalysis field, use ${lengthDesc}.

Title: ${data.title || 'N/A'}
Content: ${processedContent}
URL: ${data.url || 'N/A'}

Return valid JSON with this structure:
{
  "summary": "Strategic overview",
  "sentiment": "positive",
  "tone": "professional", 
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What factually happened",
    "observation": "What patterns you observe",
    "insight": "Why this is happening",
    "humanTruth": "Deep psychological driver",
    "culturalMoment": "Larger cultural shift",
    "attentionValue": "high",
    "platform": "Platform context",
    "cohortOpportunities": ["cohort1", "cohort2"]
  },
  "cohortSuggestions": ["suggestion1", "suggestion2"],
  "platformContext": "Platform relevance",
  "viralPotential": "medium",
  "competitiveInsights": ["insight1", "insight2"],
  "strategicInsights": ["insight1", "insight2"],
  "strategicActions": ["action1", "action2"]
}`;

    try {
      if (onProgress) onProgress('Analyzing content with OpenAI', 10);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert content strategist. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      });
      
      if (onProgress) onProgress('Processing results', 80);
      
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No content received from OpenAI');

      const analysis = JSON.parse(content);
      
      if (onProgress) onProgress('Complete', 100);
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`OpenAI analysis completed in ${processingTime}ms`);

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
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }


}

export const openaiService = new OpenAIService();
