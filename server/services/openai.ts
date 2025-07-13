import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY 
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
    
    const prompt = `
You are a strategic content analyst specializing in cultural intelligence and attention arbitrage. 
Analyze this content using the GET → TO → BY framework and uncover deep human truths.

Content Details:
Title: ${data.title || 'N/A'}
Content: ${data.content}
URL: ${data.url || 'N/A'}

LENGTH PREFERENCE: ${getLengthInstructions(lengthPreference)}

Provide a comprehensive analysis following this structure:

1. TRUTH ANALYSIS (Separate facts from observations from insights) - FOLLOW LENGTH PREFERENCE STRICTLY:
   - Fact: What indisputable thing happened? (${lengthPreference === 'short' ? '1-2 sentences' : lengthPreference === 'medium' ? '3-5 sentences' : lengthPreference === 'long' ? '6-9 sentences' : '3-5 bullet points using • symbols'})
   - Observation: What pattern or trend do you see? (${lengthPreference === 'short' ? '1-2 sentences' : lengthPreference === 'medium' ? '3-5 sentences' : lengthPreference === 'long' ? '6-9 sentences' : '3-5 bullet points using • symbols'})
   - Insight: WHY is this happening? What human truth drives this? (${lengthPreference === 'short' ? '1-2 sentences' : lengthPreference === 'medium' ? '3-5 sentences' : lengthPreference === 'long' ? '6-9 sentences' : '3-5 bullet points using • symbols'})
   - Human Truth: What deeper psychological or cultural need does this address? (${lengthPreference === 'short' ? '1-2 sentences' : lengthPreference === 'medium' ? '3-5 sentences' : lengthPreference === 'long' ? '6-9 sentences' : '3-5 bullet points using • symbols'})
   - Cultural Moment: What larger cultural shift does this represent? (${lengthPreference === 'short' ? '1-2 sentences' : lengthPreference === 'medium' ? '3-5 sentences' : lengthPreference === 'long' ? '6-9 sentences' : '3-5 bullet points using • symbols'})

2. ATTENTION ANALYSIS:
   - Platform Context: Where did this content come from and why does that matter?
   - Attention Value: Is this an underpriced attention opportunity?
   - Viral Potential: Could this spread across platforms?

3. COHORT OPPORTUNITIES (7 Pillars Framework):
   - Suggest 3-5 specific behavioral cohorts who would resonate
   - Name them like "long-tail search queries"
   - Consider: 1P Data, Competitive, Regional, Lifestage, Category Behaviors, Platforms, Wildcard

4. STRATEGIC INTELLIGENCE:
   - Competitive Insights: Generate ${data.content.length < 500 ? '3' : data.content.length < 1500 ? '4' : '5'} specific points about what competitors are missing or gaps in the market
   - Strategic Insights: Generate ${data.content.length < 500 ? '3' : data.content.length < 1500 ? '4' : '5'} key insights that explain WHY there are business opportunities here
   - Strategic Actions: Based on the insights above, what specific actions should brands take?

IMPORTANT: Follow the LENGTH PREFERENCE strictly for all truthAnalysis fields. ${getLengthInstructions(lengthPreference)}

${lengthPreference === 'bulletpoints' ? `
BULLET POINT FORMAT EXAMPLE:
"fact": "• First key fact about what happened\n• Second important fact\n• Third fact that matters",
"observation": "• First pattern observed\n• Second trend noticed\n• Third behavioral insight",
` : ''}

Return in JSON format:
{
  "summary": "Brief executive summary",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent/etc",
  "keywords": ["strategic", "keywords"],
  "confidence": "high/medium/low with percentage",
  "truthAnalysis": {
    "fact": "What happened - ${lengthPreference === 'bulletpoints' ? 'Format as 3-5 bullet points using • symbols' : `Use ${lengthPreference} length`}",
    "observation": "What pattern you see - ${lengthPreference === 'bulletpoints' ? 'Format as 3-5 bullet points using • symbols' : `Use ${lengthPreference} length`}",
    "insight": "Why this is happening - ${lengthPreference === 'bulletpoints' ? 'Format as 3-5 bullet points using • symbols' : `Use ${lengthPreference} length`}",
    "humanTruth": "Deep psychological driver - ${lengthPreference === 'bulletpoints' ? 'Format as 3-5 bullet points using • symbols' : `Use ${lengthPreference} length`}",
    "culturalMoment": "Larger cultural shift - ${lengthPreference === 'bulletpoints' ? 'Format as 3-5 bullet points using • symbols' : `Use ${lengthPreference} length`}",
    "attentionValue": "high/medium/low",
    "platform": "Platform context",
    "cohortOpportunities": ["specific cohort names"]
  },
  "cohortSuggestions": ["cohort 1", "cohort 2", "cohort 3"],
  "platformContext": "Why this platform matters",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["gap 1", "gap 2", "gap 3", "gap 4", "gap 5"],
  "strategicInsights": ["why insight 1", "why insight 2", "why insight 3", "why insight 4", "why insight 5"],
  "strategicActions": ["what to do 1", "what to do 2", "what to do 3"]
}
`;

    try {
      const startTime = Date.now();
      debugLogger.info('Sending request to OpenAI API', { model: 'gpt-4o-mini', promptLength: prompt.length });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a strategic content analyst specializing in cultural intelligence, attention arbitrage, and human behavior. Focus on uncovering deep truths about why people behave as they do."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

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
    } catch (error: any) {
      debugLogger.error('OpenAI analysis failed', error);
      throw new Error(`Failed to analyze content: ${error.message}`);
    }
  }
}

export const openaiService = new OpenAIService();
