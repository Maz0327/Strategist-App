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
      return `You're an expert Post Creative Strategist analyzing content for strategic intelligence. Think like a seasoned strategist who spots cultural moments and attention arbitrage opportunities. ${lengthInstruction}. Return valid JSON:
{
  "summary": "Write a strategic summary that captures the core value and implications of this content. Think about what a strategist would want to know immediately.",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative", 
  "keywords": ["strategic-keyword1", "strategic-keyword2", "strategic-keyword3", "strategic-keyword4", "strategic-keyword5"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "Start with the key facts - what's actually happening here? Focus on concrete, verifiable information that forms the foundation of your analysis.",
    "observation": "What patterns do you notice? Look for connections, trends, and behavioral insights that might not be immediately obvious.",
    "insight": "Here's where your strategic thinking shines - what does this really mean? What opportunities or risks does this present?",
    "humanTruth": "Get to the heart of human motivation - why do people actually care about this? What psychological drivers are at play?",
    "culturalMoment": "Is this tapping into something bigger culturally? Could this be an attention arbitrage opportunity or signal a cultural shift?",
    "attentionValue": "high|medium|low",
    "platform": "relevant platform with cross-platform considerations",
    "cohortOpportunities": ["specific-audience-segment1", "specific-audience-segment2", "specific-audience-segment3"]
  },
  "cohortSuggestions": ["cohort1", "cohort2", "cohort3", "cohort4"],
  "platformContext": "Analyze the platform dynamics and cross-platform potential with tactical recommendations",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["competitive-insight1", "competitive-insight2", "competitive-insight3"],
  "strategicInsights": ["strategic-recommendation1", "strategic-recommendation2", "strategic-recommendation3"],
  "strategicActions": ["actionable-next-step1", "actionable-next-step2", "actionable-next-step3", "actionable-next-step4"]
}`;
    } else {
      return `You're a strategic content analyst with an eye for cultural trends and attention opportunities. Analyze this content like you're briefing a client on what matters. ${lengthInstruction}. Return valid JSON:
{
  "summary": "Give me the strategic story - what's happening here and why it matters from a business perspective",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|analytical|conversational|authoritative",
  "keywords": ["strategic-keyword1", "strategic-keyword2"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What are the key facts? Give me the concrete information that forms the foundation of this analysis.",
    "observation": "What patterns or connections do you see? Look for insights that might not be immediately obvious.",
    "insight": "What's the strategic takeaway? What opportunities or implications should we be thinking about?",
    "humanTruth": "Why do people actually care about this? What human motivations are driving engagement?",
    "culturalMoment": "Is this part of a bigger cultural trend? Could this be an attention arbitrage opportunity?",
    "attentionValue": "high|medium|low",
    "platform": "relevant platform",
    "cohortOpportunities": ["audience-segment1", "audience-segment2"]
  },
  "cohortSuggestions": ["cohort1", "cohort2"],
  "platformContext": "Platform analysis with tactical recommendations",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["competitive-insight1", "competitive-insight2"],
  "strategicInsights": ["strategic-recommendation1", "strategic-recommendation2"],
  "strategicActions": ["actionable-step1", "actionable-step2"]
}`;
    }
  }

  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', analysisMode: 'quick' | 'deep' = 'quick'): Promise<EnhancedAnalysisResult> {
    debugLogger.info('Starting OpenAI content analysis', { title: data.title, hasUrl: !!data.url, contentLength: data.content?.length, lengthPreference, analysisMode });
    
    const content = data.content || '';
    const title = data.title || '';
    const url = data.url || '';
    
    const startTime = Date.now();
    
    // Progressive analysis: short first, then expand
    const result = await this.progressiveAnalysis(content, title, lengthPreference, analysisMode);
    
    const processingTime = Date.now() - startTime;
    debugLogger.info('Progressive analysis complete', { duration: processingTime, lengthPreference });
    performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, true, false);
    
    return result;
  }

  private async progressiveAnalysis(content: string, title: string, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints', analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Create stable cache key base
    const cacheKeyBase = content.substring(0, 1000) + title + analysisMode + 'v4';
    
    // Step 1: Check if we have the requested length preference cached
    const targetCacheKey = createCacheKey(cacheKeyBase + lengthPreference, 'analysis');
    let cachedAnalysis = await analysisCache.get(targetCacheKey);
    
    if (cachedAnalysis) {
      debugLogger.info('Returning cached analysis for ' + lengthPreference);
      return cachedAnalysis;
    }
    
    // Step 2: Get or create medium analysis as baseline
    const mediumCacheKey = createCacheKey(cacheKeyBase + 'medium', 'analysis');
    let mediumAnalysis = await analysisCache.get(mediumCacheKey);
    
    if (!mediumAnalysis) {
      debugLogger.info('Creating new medium analysis baseline');
      mediumAnalysis = await this.createMediumAnalysis(content, title, analysisMode);
      await analysisCache.set(mediumCacheKey, mediumAnalysis, 300);
    } else {
      debugLogger.info('Using cached medium analysis');
    }
    
    // Step 3: If user wants medium, return it immediately
    if (lengthPreference === 'medium') {
      debugLogger.info('Returning medium analysis');
      return mediumAnalysis;
    }
    
    // Step 4: Adjust from medium baseline for other lengths
    debugLogger.info('Adjusting analysis from medium to ' + lengthPreference);
    const adjustedAnalysis = await this.adjustAnalysis(mediumAnalysis, lengthPreference, analysisMode);
    await analysisCache.set(targetCacheKey, adjustedAnalysis, 300);
    
    debugLogger.info('Returning adjusted analysis');
    return adjustedAnalysis;
  }

  private async createMediumAnalysis(content: string, title: string, analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    const isDeepAnalysis = analysisMode === 'deep';
    const systemPrompt = this.getSystemPrompt('medium', isDeepAnalysis);
    
    const userPrompt = isDeepAnalysis ? 
      `I need a strategic analysis of this content. Think like you're briefing a client on what this means for their business and cultural landscape:

Title: ${title}
Content: ${content.substring(0, 4000)}${content.length > 4000 ? '...' : ''}

Give me medium-length analysis (3-5 sentences per field). I'm looking for strategic intelligence I can act on - cultural moments, attention arbitrage opportunities, human motivations, and competitive implications.

Return JSON only.` :
      `Analyze this content from a strategic perspective. What would a Post Creative Strategist want to know about this?

Title: ${title}
Content: ${content.substring(0, 1500)}${content.length > 1500 ? '...' : ''}

Give me medium-length analysis (3-5 sentences per field). Focus on strategic insights and cultural intelligence.

Return JSON only.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.05,
      max_tokens: isDeepAnalysis ? 2500 : 1500
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response content from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(responseContent);
      debugLogger.info('Successfully parsed medium analysis', { 
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

    return result;
  }

  private async adjustAnalysis(mediumAnalysis: EnhancedAnalysisResult, lengthPreference: 'short' | 'long' | 'bulletpoints', analysisMode: 'quick' | 'deep'): Promise<EnhancedAnalysisResult> {
    // Use smart text manipulation for bullet points (instant)
    if (lengthPreference === 'bulletpoints') {
      debugLogger.info('Fast text adjustment to bulletpoints');
      
      const adjustToBulletPoints = (text: string): string => {
        if (!text) return text;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
      };

      const result: EnhancedAnalysisResult = {
        ...mediumAnalysis,
        truthAnalysis: {
          fact: adjustToBulletPoints(mediumAnalysis.truthAnalysis.fact),
          observation: adjustToBulletPoints(mediumAnalysis.truthAnalysis.observation),
          insight: adjustToBulletPoints(mediumAnalysis.truthAnalysis.insight),
          humanTruth: adjustToBulletPoints(mediumAnalysis.truthAnalysis.humanTruth),
          culturalMoment: adjustToBulletPoints(mediumAnalysis.truthAnalysis.culturalMoment),
          attentionValue: mediumAnalysis.truthAnalysis.attentionValue,
          platform: mediumAnalysis.truthAnalysis.platform,
          cohortOpportunities: mediumAnalysis.truthAnalysis.cohortOpportunities
        }
      };

      debugLogger.info('Fast bulletpoint adjustment complete');
      return result;
    }

    // Use OpenAI for short/long analysis (for quality depth)
    debugLogger.info('OpenAI adjustment to ' + lengthPreference);
    
    const adjustmentPrompt = `I need you to adjust this strategic analysis to ${lengthPreference} format while keeping the strategic depth:

HERE'S THE CURRENT ANALYSIS:
${JSON.stringify(mediumAnalysis.truthAnalysis, null, 2)}

WHAT I NEED:
- ${lengthPreference === 'short' ? 'Make it concise - 2-3 sentences per field but keep the key insights' : 'Give me more depth - 5-7 sentences per field with comprehensive detail'}
- Keep all the strategic intelligence and cultural insights
- Maintain the same professional strategic quality
- Focus on actionable intelligence and attention opportunities
- Only adjust the truthAnalysis fields: fact, observation, insight, humanTruth, culturalMoment

Return just the truthAnalysis JSON object with the adjusted fields.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You're a strategic content analyst helping adjust analysis length while keeping the strategic intelligence intact. Think like you're refining a brief for a client." },
        { role: "user", content: adjustmentPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: lengthPreference === 'short' ? 800 : 1500
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      debugLogger.error('No response from OpenAI adjustment');
      return mediumAnalysis;
    }

    let adjustedTruthAnalysis;
    try {
      adjustedTruthAnalysis = JSON.parse(responseContent);
    } catch (parseError) {
      debugLogger.error('Failed to parse OpenAI adjustment response', { error: parseError });
      return mediumAnalysis;
    }

    const result: EnhancedAnalysisResult = {
      ...mediumAnalysis,
      truthAnalysis: {
        fact: adjustedTruthAnalysis.fact || mediumAnalysis.truthAnalysis.fact,
        observation: adjustedTruthAnalysis.observation || mediumAnalysis.truthAnalysis.observation,
        insight: adjustedTruthAnalysis.insight || mediumAnalysis.truthAnalysis.insight,
        humanTruth: adjustedTruthAnalysis.humanTruth || mediumAnalysis.truthAnalysis.humanTruth,
        culturalMoment: adjustedTruthAnalysis.culturalMoment || mediumAnalysis.truthAnalysis.culturalMoment,
        attentionValue: mediumAnalysis.truthAnalysis.attentionValue,
        platform: mediumAnalysis.truthAnalysis.platform,
        cohortOpportunities: mediumAnalysis.truthAnalysis.cohortOpportunities
      }
    };

    debugLogger.info('OpenAI adjustment complete', { lengthPreference });
    return result;
  }
}

export const openaiService = new OpenAIService();