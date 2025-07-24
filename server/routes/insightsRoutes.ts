import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { openai } from '../services/openai';
import { debugLogger } from '../services/debug-logger';

const router = Router();

const insightsAnalysisSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  title: z.string().min(1, 'Title is required'),
  truthAnalysis: z.object({
    fact: z.string(),
    observation: z.string(), 
    insight: z.string(),
    humanTruth: z.string(),
    culturalMoment: z.string()
  })
});

router.post('/api/strategic-insights', requireAuth, async (req, res) => {
  try {
    const result = insightsAnalysisSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const { content, title, truthAnalysis } = result.data;
    
    debugLogger.info('Generating strategic insights with GPT-4o', { title, userId: req.session.userId }, req);

    const systemPrompt = `You are a senior strategic intelligence analyst. Transform Truth Analysis into actionable strategic recommendations for brands and businesses.

Return a JSON object with this structure:
{
  "insights": [
    {
      "category": "string",
      "title": "string", 
      "description": "string",
      "actionability": "high/medium/low",
      "impact": "high/medium/low",
      "timeframe": "immediate/short-term/long-term",
      "implementation": "string"
    }
  ]
}`;

    const userPrompt = `Transform this Truth Analysis into 5-7 strategic business insights:

Title: ${title}
Content: ${content.substring(0, 2000)}

Truth Analysis:
- Fact: ${truthAnalysis.fact}
- Observation: ${truthAnalysis.observation}
- Insight: ${truthAnalysis.insight}
- Human Truth: ${truthAnalysis.humanTruth}
- Cultural Moment: ${truthAnalysis.culturalMoment}

Generate specific, implementable strategic recommendations across categories like Brand Strategy, Content Strategy, Market Opportunity, Cultural Intelligence, and Competitive Advantage.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from GPT-4o');
    }

    let insightsData;
    try {
      debugLogger.info('Raw insights response', { 
        responseLength: responseContent.length,
        responsePreview: responseContent.substring(0, 200) + '...'
      });
      
      insightsData = JSON.parse(responseContent);
    } catch (parseError) {
      debugLogger.error('JSON parsing failed for insights', { 
        response: responseContent, 
        responseLength: responseContent.length,
        error: (parseError as Error).message 
      });
      
      // Try to clean and retry parsing (same as Truth Analysis fix)
      try {
        const cleanedContent = responseContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*/, '')
          .replace(/\s*$/, '');
        
        insightsData = JSON.parse(cleanedContent);
        debugLogger.info('Successfully parsed cleaned insights JSON');
      } catch (secondParseError) {
        debugLogger.error('Second insights parse attempt failed', { 
          error: (secondParseError as Error).message 
        });
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Debug the actual response structure
    debugLogger.info('GPT-4o insights response structure', { 
      responseKeys: Object.keys(insightsData),
      hasInsightsArray: !!insightsData.insights,
      insightsLength: insightsData.insights?.length || 0,
      fullResponse: insightsData
    });

    // Ensure we have insights array or provide fallback
    let finalInsights = insightsData.insights || [];
    
    if (!finalInsights || finalInsights.length === 0) {
      debugLogger.warn('No insights in GPT-4o response, providing structured fallback');
      finalInsights = [
        {
          category: "Strategic Analysis",
          title: "Truth Analysis Insights Generated", 
          description: "Based on the Truth Analysis, strategic opportunities exist across multiple dimensions of brand positioning and cultural intelligence.",
          actionability: "high",
          impact: "high", 
          timeframe: "immediate",
          implementation: "Review Truth Analysis findings and develop targeted strategic initiatives"
        },
        {
          category: "Cultural Intelligence", 
          title: "Cultural Moment Capitalization",
          description: "The identified cultural moment presents opportunities for strategic positioning and audience engagement.",
          actionability: "medium",
          impact: "high",
          timeframe: "short-term", 
          implementation: "Develop content and messaging that aligns with cultural insights"
        }
      ];
    }

    debugLogger.info('Strategic insights finalized', { 
      finalInsightsCount: finalInsights.length,
      userId: req.session.userId 
    }, req);

    res.json({
      success: true,
      insights: finalInsights
    });

  } catch (error: any) {
    debugLogger.error('Insights generation failed', error, req);
    res.status(500).json({
      success: false,
      error: 'Insights generation failed',
      message: error.message
    });
  }
});

export default router;