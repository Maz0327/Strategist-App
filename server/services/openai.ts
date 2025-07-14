import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";

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
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult> {
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference });
    
    // Prevent timeouts by limiting content length
    const maxContentLength = 12000; // ~3000 tokens to stay well under limits
    let processedContent = data.content || '';
    
    if (processedContent.length > maxContentLength) {
      debugLogger.info('Content too long, truncating', { originalLength: processedContent.length, maxLength: maxContentLength });
      processedContent = processedContent.substring(0, maxContentLength) + '... [Content truncated for analysis]';
    }
    
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
    
    // Streamlined prompt for faster processing and timeout prevention
    const prompt = `
Analyze this content for strategic insights. ${getLengthInstructions(lengthPreference)}

Title: ${data.title || 'N/A'}
Content: ${processedContent}
URL: ${data.url || 'N/A'}

Provide JSON with these fields:
{
  "summary": "Strategic overview",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What happened - ${lengthPreference === 'bulletpoints' ? 'Use bullet points with • symbols' : `Use ${lengthPreference} length`}",
    "observation": "What pattern you see - ${lengthPreference === 'bulletpoints' ? 'Use bullet points with • symbols' : `Use ${lengthPreference} length`}",
    "insight": "Why this is happening - ${lengthPreference === 'bulletpoints' ? 'Use bullet points with • symbols' : `Use ${lengthPreference} length`}",
    "humanTruth": "Deep psychological driver - ${lengthPreference === 'bulletpoints' ? 'Use bullet points with • symbols' : `Use ${lengthPreference} length`}",
    "culturalMoment": "Larger cultural shift - ${lengthPreference === 'bulletpoints' ? 'Use bullet points with • symbols' : `Use ${lengthPreference} length`}",
    "attentionValue": "high/medium/low",
    "platform": "Platform context",
    "cohortOpportunities": ["specific cohort names"]
  },
  "cohortSuggestions": ["cohort 1", "cohort 2", "cohort 3"],
  "platformContext": "Platform relevance",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["insight 1", "insight 2", "insight 3"],
  "strategicInsights": ["strategic insight 1", "strategic insight 2", "strategic insight 3"],
  "strategicActions": ["action 1", "action 2", "action 3"]
}
`;

    try {
      const startTime = Date.now();
      debugLogger.info('Sending request to OpenAI API', { model: 'gpt-4o-mini', promptLength: prompt.length });
      
      // Progress tracking for better UX
      if (onProgress) {
        onProgress('Initializing analysis', 10);
        setTimeout(() => onProgress('Processing content', 30), 500);
        setTimeout(() => onProgress('Analyzing cultural context', 50), 2000);
        setTimeout(() => onProgress('Generating insights', 70), 4000);
        setTimeout(() => onProgress('Finalizing results', 90), 6000);
      }
      
      // OpenAI API call with timeout prevention strategies
      debugLogger.info('Sending OpenAI API request', { 
        contentLength: processedContent.length,
        promptLength: prompt.length 
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Keeping cost-efficient model as requested
        messages: [
          {
            role: "system",
            content: "You are a strategic content analyst. Provide concise, actionable insights focusing on cultural intelligence and human behavior patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000, // Limit response length to prevent timeouts
      });
      
      return this.processOpenAIResponse(response, startTime);
    } catch (error: any) {
      debugLogger.error('OpenAI analysis failed', error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }

  private processOpenAIResponse(response: any, startTime: number): EnhancedAnalysisResult {
    const responseTime = Date.now() - startTime;
    debugLogger.info('OpenAI API response received', { 
      responseTime, 
      tokensUsed: response.usage?.total_tokens,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens
    });

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
