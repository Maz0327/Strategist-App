import OpenAI from 'openai';
import { debugLogger } from './debug-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export interface SimpleAnalysisResult {
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tone: string;
  keywords: string[];
  confidence: string;
  truthAnalysis: TruthAnalysis;
  cohortSuggestions: string[];
  platformContext: string;
  viralPotential: 'high' | 'medium' | 'low';
  competitiveInsights: string[];
  strategicInsights: string[];
  strategicActions: string[];
}

export async function analyzeContentSimple(
  content: string,
  title: string = '',
  url: string = '',
  lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium'
): Promise<SimpleAnalysisResult> {
  const startTime = Date.now();
  
  const lengthDesc = lengthPreference === 'short' ? '1-2 sentences' : 
                     lengthPreference === 'medium' ? '3-5 sentences' : 
                     lengthPreference === 'long' ? '6-9 sentences' : 
                     '3-5 bullet points using • symbols';

  const prompt = `Analyze this content for strategic insights. For truthAnalysis fields, use ${lengthDesc}.

Title: ${title}
Content: ${content}
URL: ${url}

Return valid JSON:
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
    debugLogger.info(`Starting OpenAI analysis for content length: ${content.length}`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert content strategist. Analyze content and return structured JSON with strategic insights. Focus on facts, observations, insights, and human truths." 
        },
        { 
          role: "user", 
          content: `Analyze this content for strategic insights:

Title: ${title}
Content: ${content}
URL: ${url}

Provide comprehensive strategic analysis in JSON format:
{
  "summary": "Brief strategic overview",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent/analytical",
  "keywords": ["strategic", "keywords", "here"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What factually happened",
    "observation": "What patterns you observe", 
    "insight": "Why this is happening",
    "humanTruth": "Deep psychological driver",
    "culturalMoment": "Larger cultural shift this represents",
    "attentionValue": "high/medium/low",
    "platform": "Platform or context",
    "cohortOpportunities": ["behavioral audience segments"]
  },
  "cohortSuggestions": ["audience cohort suggestions"],
  "platformContext": "Platform relevance explanation",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["competitive insights"],
  "strategicInsights": ["strategic business insights"],
  "strategicActions": ["actionable next steps"]
}

Return only valid JSON without markdown formatting.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    debugLogger.info(`OpenAI response received, length: ${analysisText.length}`);
    
    // Clean the response to ensure it's valid JSON
    const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      debugLogger.error('JSON parsing failed', { response: cleanedResponse, error: parseError });
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    const processingTime = Date.now() - startTime;
    debugLogger.info(`Analysis completed in ${processingTime}ms`);

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
  } catch (error: any) {
    debugLogger.error('OpenAI analysis failed', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}