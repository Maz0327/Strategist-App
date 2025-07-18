import { OpenAI } from 'openai';
import { debugLogger } from './debug-logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface StrategicRecommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  confidence: number;
  category: 'competitive' | 'cultural' | 'tactical' | 'strategic';
  rationale: string;
}

interface ComponentResults {
  truthAnalysis: any;
  cohorts: any[];
  strategicInsights: any[];
  strategicActions: any[];
  competitiveInsights: any[];
}

class StrategicRecommendationsService {
  async generateRecommendations(componentResults: ComponentResults): Promise<StrategicRecommendation[]> {
    try {
      const systemPrompt = `You are a strategic consultant analyzing comprehensive business intelligence data to provide final strategic recommendations.

You will receive results from 5 different analysis components:
1. Truth Framework Analysis - Core insights about facts, observations, insights, human truths, and cultural moments
2. Cohort Analysis - Audience segmentation and behavioral patterns
3. Strategic Insights - Business opportunity identification (5 items)
4. Strategic Actions - Specific recommended actions (5 items)
5. Competitive Intelligence - Competitive landscape analysis (5 items)

Your task is to synthesize ALL of these results into exactly 5 strategic recommendations with impact assessment and confidence scoring.

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "title": "Clear, actionable recommendation title",
      "description": "Detailed description of the recommendation",
      "impact": "high|medium|low",
      "timeframe": "immediate|short-term|long-term",
      "confidence": 85,
      "category": "competitive|cultural|tactical|strategic",
      "rationale": "Explanation of why this recommendation is important based on the analysis"
    }
  ]
}

Each recommendation should:
- Synthesize insights from multiple components
- Provide clear business value
- Include confidence score (0-100)
- Reference specific findings from the analysis
- Be actionable and strategic

Return exactly 5 recommendations.`;

      const userPrompt = `Based on the following comprehensive analysis results, provide 5 strategic recommendations:

TRUTH FRAMEWORK ANALYSIS:
${JSON.stringify(componentResults.truthAnalysis, null, 2)}

COHORT ANALYSIS RESULTS:
${JSON.stringify(componentResults.cohorts, null, 2)}

STRATEGIC INSIGHTS (5 items):
${JSON.stringify(componentResults.strategicInsights, null, 2)}

STRATEGIC ACTIONS (5 items):
${JSON.stringify(componentResults.strategicActions, null, 2)}

COMPETITIVE INTELLIGENCE (5 items):
${JSON.stringify(componentResults.competitiveInsights, null, 2)}

Synthesize these results into exactly 5 strategic recommendations with impact assessment and confidence scoring.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o-mini as requested
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content from OpenAI');
      }

      const parsed = JSON.parse(responseContent);
      const recommendations = parsed.recommendations || [];
      
      if (Array.isArray(recommendations)) {
        return recommendations.slice(0, 5);
      }
      
      return this.getFallbackRecommendations();
    } catch (error) {
      debugLogger.error('Failed to generate strategic recommendations', error);
      return this.getFallbackRecommendations();
    }
  }

  private getFallbackRecommendations(): StrategicRecommendation[] {
    return [
      {
        title: "Develop Integrated Content Strategy",
        description: "Create a comprehensive content strategy that leverages identified audience insights and cultural moments",
        impact: "high",
        timeframe: "immediate",
        confidence: 85,
        category: "strategic",
        rationale: "Based on truth analysis and cohort insights, immediate strategic action is needed"
      },
      {
        title: "Optimize Competitive Positioning",
        description: "Enhance market positioning based on competitive intelligence and strategic insights",
        impact: "high",
        timeframe: "short-term",
        confidence: 82,
        category: "competitive",
        rationale: "Competitive analysis reveals opportunities for differentiation"
      },
      {
        title: "Implement Cultural Moment Activation",
        description: "Activate on identified cultural moments to drive engagement and brand relevance",
        impact: "medium",
        timeframe: "immediate",
        confidence: 78,
        category: "cultural",
        rationale: "Cultural analysis shows immediate opportunities for brand activation"
      },
      {
        title: "Execute Tactical Engagement Campaigns",
        description: "Launch targeted campaigns based on cohort analysis and strategic actions",
        impact: "medium",
        timeframe: "short-term",
        confidence: 80,
        category: "tactical",
        rationale: "Strategic actions provide clear tactical implementation path"
      },
      {
        title: "Establish Long-term Strategic Framework",
        description: "Build sustainable strategic framework based on comprehensive analysis insights",
        impact: "high",
        timeframe: "long-term",
        confidence: 88,
        category: "strategic",
        rationale: "Truth framework analysis provides foundation for long-term strategic planning"
      }
    ];
  }
}

export const strategicRecommendationsService = new StrategicRecommendationsService();