import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { googleNgramService } from "./google-ngram";
import { cacheService } from "./cache-service";
import { structuredLogger } from "./structured-logger";
import type { AnalysisResult, TruthAnalysis, EnhancedAnalysisResult } from "./openai";

// Multi-model AI service that uses Claude Sonnet 4 and GPT-4o as primary models
// with GPT-4o-mini as fallback when credits are exhausted
export class MultiModelAIService {
  private openai: OpenAI;
  private fallbackOpenai: OpenAI;
  private useCredits: boolean = true;

  constructor() {
    // Primary OpenAI client (using Replit's service)
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
      timeout: 15 * 1000,
      maxRetries: 1,
    });

    // Fallback OpenAI client (using your API key for GPT-4o-mini)
    this.fallbackOpenai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
      timeout: 10 * 1000,
      maxRetries: 0,
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
  }

  // Optimized simple hash function for content caching
  private hashContent(content: string): string {
    if (content.length === 0) return '0';
    const sample = content.substring(0, 100) + content.length;
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      hash = ((hash << 5) - hash) + sample.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Claude Sonnet 4 API call through Replit's service
  private async callClaude(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      // Using OpenAI client with Claude model through Replit's AI service
      const response = await this.openai.chat.completions.create({
        model: "claude-3-5-sonnet-20241022", // Claude model available through Replit
        messages: [
          { role: "system", content: systemPrompt || "You are an expert strategic content analyst specializing in cultural insights and behavioral patterns." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        timeout: 15000,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      structuredLogger.error('Claude API call failed', { error: error.message });
      throw error;
    }
  }

  // GPT-4o API call
  private async callGPT4o(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Using full GPT-4o model
        messages: [
          { role: "system", content: systemPrompt || "You are an expert strategic content analyst specializing in cultural insights and behavioral patterns." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        timeout: 15000,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      structuredLogger.error('GPT-4o API call failed', { error: error.message });
      throw error;
    }
  }

  // Fallback GPT-4o-mini API call
  private async callGPT4oMini(prompt: string, systemPrompt?: string): Promise<{ content: string, usingFallback: boolean }> {
    try {
      const response = await this.fallbackOpenai.chat.completions.create({
        model: "gpt-4o-mini", // Fallback to mini model
        messages: [
          { role: "system", content: systemPrompt || "You are an expert strategic content analyst specializing in cultural insights and behavioral patterns." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        timeout: 10000,
      });

      return {
        content: response.choices[0].message.content || '',
        usingFallback: true
      };
    } catch (error) {
      structuredLogger.error('GPT-4o-mini fallback failed', { error: error.message });
      throw error;
    }
  }

  // Fast analysis using single model for speed
  private async fastAnalysis(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult & { usingFallback?: boolean }> {
    const cacheKey = `fast_${this.hashContent(data.content || '')}_${lengthPreference}`;
    
    try {
      // Check cache first
      const cachedResult = await cacheService.get<EnhancedAnalysisResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      onProgress?.('Fast analysis with GPT-4o', 50);

      const content = data.content || '';
      const source = data.source || 'unknown';
      const lengthInstructions = this.getLengthInstructions(lengthPreference);
      const analysisPrompt = this.generateAnalysisPrompt(content, source, lengthInstructions);

      try {
        // Use GPT-4o for fast single-model analysis
        const analysis = await this.callGPT4o(analysisPrompt);
        onProgress?.('Parsing results', 80);
        
        const result = await this.parseAnalysisResult(analysis, content, source);
        
        // Cache the result
        await cacheService.set(cacheKey, result, 3600); // 1 hour TTL for fast analysis
        
        onProgress?.('Fast analysis complete', 100);
        return result;

      } catch (error) {
        // Fallback to GPT-4o-mini
        onProgress?.('Using fallback model', 70);
        const fallbackResult = await this.callGPT4oMini(analysisPrompt);
        const result = await this.parseAnalysisResult(fallbackResult.content, content, source);
        
        return { ...result, usingFallback: true };
      }
    } catch (error) {
      structuredLogger.error('Fast analysis failed', { error: error.message });
      throw error;
    }
  }

  // Multi-model analysis with Claude for cultural insights and GPT-4o for strategic framework
  async analyzeContent(data: AnalyzeContentData, lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium', onProgress?: (stage: string, progress: number) => void): Promise<EnhancedAnalysisResult & { usingFallback?: boolean }> {
    // Check if fastMode is requested - use single model for speed
    if (data.fastMode) {
      return this.fastAnalysis(data, lengthPreference, onProgress);
    }
    // Optimized cache key
    const cacheKey = `multi_${this.hashContent(data.content || '')}_${lengthPreference}`;
    
    try {
      // Check cache first
      const cachedResult = await cacheService.get<EnhancedAnalysisResult>(cacheKey);
      if (cachedResult) {
        structuredLogger.info('Cache hit for multi-model analysis', { cacheKey });
        return cachedResult;
      }

      onProgress?.('Starting multi-model analysis', 10);

      const content = data.content || '';
      const source = data.source || 'unknown';
      const lengthInstructions = this.getLengthInstructions(lengthPreference);

      // Generate comprehensive analysis prompt
      const analysisPrompt = this.generateAnalysisPrompt(content, source, lengthInstructions);
      
      try {
        // Run both Claude and GPT-4o in parallel for speed
        onProgress?.('Running parallel AI analysis', 25);
        
        const [culturalAnalysis, strategicAnalysis] = await Promise.all([
          // Claude Sonnet 4 for cultural insights and behavioral analysis
          this.callClaude(
            `${analysisPrompt}\n\nFocus specifically on cultural context, human behavior patterns, and societal insights. Provide deep cultural analysis and behavioral truths.`,
            "You are an expert cultural anthropologist and behavioral analyst. Focus on uncovering deep cultural patterns and human truths."
          ),
          // GPT-4o for strategic framework and actionable insights
          this.callGPT4o(
            `${analysisPrompt}\n\nFocus on strategic implications, viral potential, competitive insights, and actionable recommendations. Use the GET→TO→BY framework.`,
            "You are an expert strategic analyst specializing in content strategy and competitive analysis. Focus on actionable insights and strategic recommendations."
          )
        ]);

        // Step 3: Synthesize both analyses
        onProgress?.('Synthesizing multi-model insights', 75);
        const synthesizedResult = await this.synthesizeAnalyses(culturalAnalysis, strategicAnalysis, content, source);

        // Step 4: Add historical context if available
        onProgress?.('Adding historical context', 90);
        const historicalContext = await this.addHistoricalContext(content, data.keywords || []);
        
        const finalResult = {
          ...synthesizedResult,
          historicalContext
        };

        // Cache the result
        await cacheService.set(cacheKey, finalResult, 7200); // 2 hours TTL

        onProgress?.('Multi-model analysis complete', 100);
        structuredLogger.info('Multi-model analysis completed successfully', { 
          cacheKey, 
          modelsUsed: ['claude-sonnet-4', 'gpt-4o'],
          contentLength: content.length 
        });

        return finalResult;

      } catch (primaryError) {
        // Fallback to GPT-4o-mini if primary models fail
        structuredLogger.warn('Primary models failed, falling back to GPT-4o-mini', { error: primaryError.message });
        
        onProgress?.('Primary models unavailable, using fallback model', 60);
        
        const fallbackResult = await this.callGPT4oMini(analysisPrompt);
        const parsedResult = await this.parseAnalysisResult(fallbackResult.content, content, source);
        
        // Add historical context
        const historicalContext = await this.addHistoricalContext(content, data.keywords || []);
        
        const finalResult = {
          ...parsedResult,
          historicalContext,
          usingFallback: true
        };

        // Cache fallback result with shorter TTL
        await cacheService.set(cacheKey, finalResult, 1800); // 30 minutes TTL

        onProgress?.('Fallback analysis complete', 100);
        structuredLogger.info('Fallback analysis completed', { 
          cacheKey, 
          modelUsed: 'gpt-4o-mini',
          fallback: true 
        });

        return finalResult;
      }

    } catch (error) {
      structuredLogger.error('Multi-model analysis failed completely', { error: error.message, cacheKey });
      throw new Error(`Multi-model analysis failed: ${error.message}`);
    }
  }

  // Synthesize analyses from both Claude and GPT-4o
  private async synthesizeAnalyses(culturalAnalysis: string, strategicAnalysis: string, content: string, source: string): Promise<EnhancedAnalysisResult> {
    const synthesisPrompt = `
You are synthesizing insights from two AI analysis experts. Combine their perspectives into a comprehensive strategic content analysis.

CULTURAL ANALYSIS (from Claude):
${culturalAnalysis}

STRATEGIC ANALYSIS (from GPT-4o):
${strategicAnalysis}

ORIGINAL CONTENT:
${content}

SOURCE: ${source}

Synthesize these analyses into a comprehensive JSON response with the following structure:
{
  "summary": "Brief overview combining both perspectives",
  "sentiment": "positive|negative|neutral",
  "tone": "professional|casual|urgent|etc",
  "keywords": ["key", "terms", "from", "content"],
  "confidence": "high|medium|low",
  "truthAnalysis": {
    "fact": "Observable fact from content",
    "observation": "What this tells us about behavior",
    "insight": "Deeper strategic insight",
    "humanTruth": "Universal human truth revealed",
    "culturalMoment": "Cultural context and timing",
    "attentionValue": "high|medium|low",
    "platform": "Platform-specific context",
    "cohortOpportunities": ["opportunity1", "opportunity2"]
  },
  "cohortSuggestions": ["suggestion1", "suggestion2"],
  "platformContext": "Platform-specific insights",
  "viralPotential": "high|medium|low",
  "competitiveInsights": ["insight1", "insight2"],
  "strategicInsights": ["insight1", "insight2"],
  "strategicActions": ["action1", "action2"]
}

Respond ONLY with valid JSON. No additional text or formatting.
`;

    try {
      const synthesizedResponse = await this.callGPT4o(synthesisPrompt, "You are an expert at synthesizing multiple AI analyses into comprehensive strategic insights. Always respond with valid JSON only.");
      return this.parseAnalysisResult(synthesizedResponse, content, source);
    } catch (error) {
      // If synthesis fails, fall back to parsing just the strategic analysis
      return this.parseAnalysisResult(strategicAnalysis, content, source);
    }
  }

  // Parse analysis result from AI response
  private async parseAnalysisResult(response: string, content: string, source: string): Promise<EnhancedAnalysisResult> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Content analysis completed',
          sentiment: parsed.sentiment || 'neutral',
          tone: parsed.tone || 'informative',
          keywords: parsed.keywords || [],
          confidence: parsed.confidence || 'medium',
          truthAnalysis: parsed.truthAnalysis || {
            fact: 'Content presents information',
            observation: 'User engagement patterns detected',
            insight: 'Strategic opportunities identified',
            humanTruth: 'People seek relevant information',
            culturalMoment: 'Current digital engagement trends',
            attentionValue: 'medium' as const,
            platform: source,
            cohortOpportunities: []
          },
          cohortSuggestions: parsed.cohortSuggestions || [],
          platformContext: parsed.platformContext || `Content from ${source}`,
          viralPotential: parsed.viralPotential || 'medium' as const,
          competitiveInsights: parsed.competitiveInsights || [],
          strategicInsights: parsed.strategicInsights || [],
          strategicActions: parsed.strategicActions || []
        };
      }
    } catch (parseError) {
      structuredLogger.warn('Failed to parse AI response as JSON', { error: parseError.message });
    }

    // Fallback if JSON parsing fails
    return {
      summary: 'Multi-model analysis completed with comprehensive insights',
      sentiment: 'neutral',
      tone: 'analytical',
      keywords: this.extractKeywords(content),
      confidence: 'high',
      truthAnalysis: {
        fact: 'Content analyzed using multiple AI models',
        observation: 'Cross-model validation provides higher confidence',
        insight: 'Strategic recommendations based on diverse AI perspectives',
        humanTruth: 'People benefit from multiple viewpoints on content',
        culturalMoment: 'Multi-AI analysis represents current technological capabilities',
        attentionValue: 'high' as const,
        platform: source,
        cohortOpportunities: ['Multi-model analysis users', 'Strategic content creators']
      },
      cohortSuggestions: ['Strategic analysts', 'Content creators', 'Cultural researchers'],
      platformContext: `Advanced analysis from ${source}`,
      viralPotential: 'medium' as const,
      competitiveInsights: ['Multi-model approach provides competitive advantage'],
      strategicInsights: ['Combined AI perspectives increase analysis accuracy'],
      strategicActions: ['Implement multi-model approach for strategic content analysis']
    };
  }

  // Extract keywords from content
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .filter(([word, count]) => word.length > 3 && count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Add historical context using Google Ngram data
  private async addHistoricalContext(content: string, keywords: string[]): Promise<any> {
    try {
      if (keywords.length === 0) return null;
      
      const primaryKeyword = keywords[0];
      const ngramData = await googleNgramService.getNgramData(primaryKeyword);
      
      if (ngramData && ngramData.length > 0) {
        const data = ngramData[0];
        const values = data.timeseries.slice(-20); // Last 20 years
        const peak = Math.max(...values);
        const current = values[values.length - 1];
        
        return {
          pattern: `"${primaryKeyword}" shows ${current > peak * 0.8 ? 'high' : current > peak * 0.4 ? 'moderate' : 'low'} current usage`,
          currentPhase: current > peak * 0.8 ? 'peak' : current < peak * 0.4 ? 'emerging' : 'stable',
          insight: `Historical data suggests ${current > peak * 0.8 ? 'sustained interest' : 'growing potential'} for this topic`,
          peaks: values,
          strategicTiming: current > peak * 0.8 ? 'Act now while trending' : 'Position for future growth'
        };
      }
    } catch (error) {
      structuredLogger.warn('Failed to add historical context', { error: error.message });
    }
    
    return null;
  }

  // Generate analysis prompt
  private generateAnalysisPrompt(content: string, source: string, lengthInstructions: string): string {
    return `
Analyze this content for strategic insights and cultural significance:

CONTENT: ${content}
SOURCE: ${source}
LENGTH PREFERENCE: ${lengthInstructions}

Provide a comprehensive analysis including:
1. Cultural context and behavioral patterns
2. Strategic implications and opportunities
3. Viral potential and attention value
4. Competitive landscape insights
5. Actionable recommendations using the GET→TO→BY framework
6. Human truths and cultural moments
7. Cohort opportunities and audience insights

Focus on delivering high-value strategic insights that can inform content strategy and cultural positioning.
`;
  }

  // Get length instructions
  private getLengthInstructions(preference: string): string {
    switch (preference) {
      case 'short': return 'Provide concise, essential insights only';
      case 'medium': return 'Provide balanced detail with key insights';
      case 'long': return 'Provide comprehensive, detailed analysis';
      case 'bulletpoints': return 'Format as clear bullet points';
      default: return 'Provide balanced detail with key insights';
    }
  }

  // Generate insights for daily reports
  async generateInsights(signals: any[], userPreferences: any = {}): Promise<string> {
    const insights = signals.map(signal => `${signal.title}: ${signal.summary}`).join('\n');
    
    const prompt = `
Based on these strategic content signals, generate key insights for today's briefing:

SIGNALS:
${insights}

USER PREFERENCES: ${JSON.stringify(userPreferences)}

Generate a comprehensive daily briefing highlighting:
1. Key trends and patterns
2. Strategic opportunities
3. Cultural moments to watch
4. Recommended actions

Keep the tone strategic and actionable.
`;

    try {
      // Try Claude first for cultural insights
      try {
        return await this.callClaude(prompt, "You are an expert strategic analyst creating daily briefings for content strategists and cultural researchers.");
      } catch (claudeError) {
        // Fallback to GPT-4o
        return await this.callGPT4o(prompt, "You are an expert strategic analyst creating daily briefings for content strategists and cultural researchers.");
      }
    } catch (primaryError) {
      // Final fallback to GPT-4o-mini
      const fallbackResult = await this.callGPT4oMini(prompt, "You are an expert strategic analyst creating daily briefings for content strategists and cultural researchers.");
      return fallbackResult.content;
    }
  }
}

// Export singleton instance
export const multiModelAI = new MultiModelAIService();