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
  fact: string[];
  observation: string[];
  insight: string[];
  humanTruth: string[];
  culturalMoment: string[];
  attentionValue: 'high' | 'medium' | 'low';
  platform: string;
  cohortOpportunities: string[];
}

export interface EnhancedAnalysisResult extends AnalysisResult {
  truthAnalysis: TruthAnalysis;
  cohortSuggestions: string[];
  platformContext: string[];
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
      // Use function calling for strict JSON schema enforcement
      const functions = [{
        name: "analyzeContent",
        description: "Returns structured analysis with arrays enforcing sentence counts",
        parameters: {
          type: "object",
          properties: {
            summary: { 
              type: "string", 
              description: "EXACTLY 3-5 sentences summarizing the content strategically"
            },
            sentiment: { 
              type: "string", 
              enum: ["positive", "negative", "neutral"]
            },
            tone: { 
              type: "string", 
              enum: ["professional", "casual", "urgent", "analytical", "conversational", "authoritative"]
            },
            keywords: { 
              type: "array", 
              items: { type: "string" },
              description: "5-8 strategic keywords"
            },
            confidence: { 
              type: "string",
              description: "Confidence level as percentage (e.g., '85%')"
            },
            truthAnalysis: {
              type: "object",
              properties: {
                fact: { 
                  type: "array", 
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                  description: "3-5 sentences stating objective facts"
                },
                observation: { 
                  type: "array", 
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                  description: "3-5 sentences describing observed patterns"
                },
                insight: { 
                  type: "array", 
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                  description: "3-5 sentences providing strategic insights"
                },
                humanTruth: { 
                  type: "array", 
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                  description: "3-5 sentences explaining human motivations"
                },
                culturalMoment: { 
                  type: "array", 
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 5,
                  description: "3-5 sentences identifying cultural context"
                },
                attentionValue: { 
                  type: "string", 
                  enum: ["high", "medium", "low"]
                },
                platform: { 
                  type: "string",
                  description: "Most relevant platform for this content"
                },
                cohortOpportunities: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Specific audience segments"
                }
              },
              required: ["fact", "observation", "insight", "humanTruth", "culturalMoment", "attentionValue", "platform", "cohortOpportunities"]
            },
            cohortSuggestions: { 
              type: "array", 
              items: { type: "string" },
              description: "Suggested audience cohorts"
            },
            platformContext: { 
              type: "array", 
              items: { type: "string" },
              minItems: 3,
              maxItems: 5,
              description: "3-5 sentences explaining platform-specific context"
            },
            viralPotential: { 
              type: "string", 
              enum: ["high", "medium", "low"]
            },
            competitiveInsights: { 
              type: "array", 
              items: { type: "string" },
              description: "Competitive analysis points"
            },
            strategicInsights: { 
              type: "array", 
              items: { type: "string" },
              description: "Strategic recommendations"
            },
            strategicActions: { 
              type: "array", 
              items: { type: "string" },
              description: "Specific actionable steps"
            }
          },
          required: ["summary", "sentiment", "tone", "keywords", "confidence", "truthAnalysis", "cohortSuggestions", "platformContext", "viralPotential", "competitiveInsights", "strategicInsights", "strategicActions"]
        }
      }];
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are an expert content strategist. Always return exactly the requested number of sentences in each array field. Each sentence should be complete and strategic." 
          },
          { 
            role: "user", 
            content: `Analyze this content strategically:
            
Title: ${title}
Content: ${content}
URL: ${url}
Length Preference: ${lengthPreference}

Focus on strategic insights, human motivations, and cultural context. Return arrays with exactly 3-5 sentences per field as specified.` 
          }
        ],
        functions,
        function_call: { name: "analyzeContent" },
        temperature: 0.1
      });

      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('No function call response from OpenAI');
      }

      debugLogger.info(`OpenAI function call received, arguments length: ${functionCall.arguments.length}`);
      
      let analysis;
      try {
        analysis = JSON.parse(functionCall.arguments);
        debugLogger.info('Successfully parsed OpenAI function call', { 
          hasSummary: !!analysis.summary,
          hasTruthAnalysis: !!analysis.truthAnalysis,
          hasKeywords: !!analysis.keywords
        });
      } catch (parseError) {
        debugLogger.error('JSON parsing failed', { response: functionCall.arguments, error: parseError });
        throw new Error('Invalid JSON response from OpenAI function call');
      }
      
      debugLogger.info(`Analysis completed in ${Date.now() - startTime}ms`);

      // Convert arrays to strings for backward compatibility
      const processedTruthAnalysis = {
        fact: Array.isArray(analysis.truthAnalysis?.fact) ? analysis.truthAnalysis.fact.join(' ') : 'Analysis pending',
        observation: Array.isArray(analysis.truthAnalysis?.observation) ? analysis.truthAnalysis.observation.join(' ') : 'Patterns being analyzed',
        insight: Array.isArray(analysis.truthAnalysis?.insight) ? analysis.truthAnalysis.insight.join(' ') : 'Insights being generated',
        humanTruth: Array.isArray(analysis.truthAnalysis?.humanTruth) ? analysis.truthAnalysis.humanTruth.join(' ') : 'Motivations being explored',
        culturalMoment: Array.isArray(analysis.truthAnalysis?.culturalMoment) ? analysis.truthAnalysis.culturalMoment.join(' ') : 'Context being evaluated',
        attentionValue: analysis.truthAnalysis?.attentionValue || 'medium',
        platform: analysis.truthAnalysis?.platform || 'unknown',
        cohortOpportunities: analysis.truthAnalysis?.cohortOpportunities || []
      };

      const result = {
        summary: analysis.summary || 'Strategic analysis completed',
        sentiment: analysis.sentiment || 'neutral',
        tone: analysis.tone || 'professional',
        keywords: analysis.keywords || [],
        confidence: analysis.confidence || '85%',
        truthAnalysis: processedTruthAnalysis,
        cohortSuggestions: analysis.cohortSuggestions || [],
        platformContext: Array.isArray(analysis.platformContext) ? analysis.platformContext.join(' ') : 'Platform analysis pending',
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

CRITICAL LENGTH REQUIREMENT: You must write exactly ${lengthGuidance} for ALL descriptive text fields. This is mandatory.

Provide comprehensive strategic analysis in JSON format:
{
  "summary": "Strategic overview that contains exactly ${lengthGuidance}",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent/analytical",
  "keywords": ["strategic", "keywords", "here"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What factually happened - write exactly ${lengthGuidance}",
    "observation": "What patterns you observe - write exactly ${lengthGuidance}", 
    "insight": "Why this is happening - write exactly ${lengthGuidance}",
    "humanTruth": "Deep psychological driver - write exactly ${lengthGuidance}",
    "culturalMoment": "Larger cultural shift this represents - write exactly ${lengthGuidance}",
    "attentionValue": "high/medium/low",
    "platform": "Platform or context",
    "cohortOpportunities": ["behavioral audience segments"]
  },
  "cohortSuggestions": ["audience cohort suggestions"],
  "platformContext": "Platform relevance explanation - write exactly ${lengthGuidance}",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["competitive insights"],
  "strategicInsights": ["strategic business insights"],
  "strategicActions": ["actionable next steps"]
}

MANDATORY: Every descriptive text field must contain exactly ${lengthGuidance}. Count your sentences carefully. Return only valid JSON without markdown formatting.`;
  }
}

export const openaiService = new OpenAIService();
