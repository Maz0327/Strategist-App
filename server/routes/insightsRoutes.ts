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

    const systemPrompt = `You are a senior strategic consultant writing a strategic intelligence report. Each insight should be a focused, standalone strategic recommendation. Write with strategic depth and natural flow, but keep each insight distinct and actionable. Only return valid JSON.`;

    const userPrompt = `Based on this Truth Analysis, create 6-8 strategic business insights. Each insight should be a distinct strategic recommendation that a business could implement.

Content: "${title}"
${content.substring(0, 1500)}

Truth Analysis:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}  
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}

Generate 6-8 strategic insights covering different business opportunities. For each insight:
- Title should be specific and compelling
- Description should be 4-6 sentences explaining the strategic rationale and expected impact
- Implementation should be 2-3 sentences with concrete first steps

Focus on diverse strategic opportunities like positioning moves, content strategies, audience engagement tactics, competitive advantages, cultural timing, and business development.

Return this JSON structure:
{
  "insights": [
    {
      "category": "strategic category name",
      "title": "specific strategic recommendation title",
      "description": "4-6 sentences explaining why this strategy works, the market opportunity, and expected business impact",
      "actionability": "high/medium/low",
      "impact": "high/medium/low",
      "timeframe": "immediate/short-term/long-term",
      "implementation": "2-3 sentences with specific next steps and tactics to execute this strategy"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 4000,
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

// Competitive Intelligence endpoint
router.post('/api/competitive-intelligence', requireAuth, async (req, res) => {
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
    
    debugLogger.info('Generating competitive intelligence with GPT-4o', { title, userId: req.session.userId }, req);

    const systemPrompt = `You are a senior competitive intelligence analyst who identifies market opportunities and competitive threats. Write strategic competitive analysis with natural flow and depth. Each intelligence item should be a focused competitive insight. Only return valid JSON.`;

    const userPrompt = `Based on this Truth Analysis, create 5-7 competitive intelligence insights. Each insight should identify competitive opportunities, threats, or strategic positioning moves.

Content: "${title}"
${content.substring(0, 1500)}

Truth Analysis:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}  
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}

Generate 5-7 competitive intelligence insights covering different competitive opportunities. For each insight:
- Title should identify the specific competitive angle
- Description should be 4-6 sentences explaining the competitive landscape, opportunity or threat, and strategic implications
- Implementation should be 2-3 sentences with competitive moves to make

Focus on competitive positioning, market gaps, competitor weaknesses, differentiation opportunities, and strategic competitive advantages.

Return this JSON structure:
{
  "competitive": [
    {
      "category": "competitive category name",
      "title": "specific competitive insight title",
      "description": "4-6 sentences explaining the competitive opportunity, market dynamics, and strategic advantage potential",
      "actionability": "high/medium/low",
      "impact": "high/medium/low",
      "timeframe": "immediate/short-term/long-term",
      "implementation": "2-3 sentences with specific competitive moves and positioning tactics"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 4000,
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

    let competitiveData;
    try {
      competitiveData = JSON.parse(responseContent);
    } catch (parseError) {
      debugLogger.error('JSON parsing failed for competitive intelligence', { 
        response: responseContent, 
        error: (parseError as Error).message 
      });
      
      try {
        const cleanedContent = responseContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*/, '')
          .replace(/\s*$/, '');
        
        competitiveData = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        throw new Error('Invalid JSON response from AI');
      }
    }

    let finalCompetitive = competitiveData.competitive || [];
    
    if (!finalCompetitive || finalCompetitive.length === 0) {
      finalCompetitive = [
        {
          category: "Competitive Positioning",
          title: "Market Position Analysis", 
          description: "Based on the Truth Analysis, opportunities exist for strategic competitive positioning and market differentiation.",
          actionability: "high",
          impact: "high", 
          timeframe: "short-term",
          implementation: "Analyze competitive landscape and develop positioning strategy"
        }
      ];
    }

    res.json({
      success: true,
      competitive: finalCompetitive
    });

  } catch (error: any) {
    debugLogger.error('Competitive intelligence generation failed', error, req);
    res.status(500).json({
      success: false,
      error: 'Competitive intelligence generation failed',
      message: error.message
    });
  }
});

// Strategic Actions endpoint
router.post('/api/strategic-actions', requireAuth, async (req, res) => {
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
    
    debugLogger.info('Generating strategic actions with GPT-4o', { title, userId: req.session.userId }, req);

    const systemPrompt = `You are a strategic implementation specialist who creates actionable next steps from strategic analysis. Each action should be specific, measurable, and immediately implementable. Write with strategic depth and tactical precision. Only return valid JSON.`;

    const userPrompt = `Based on this Truth Analysis, create 6-8 strategic actions. Each action should be a specific, implementable next step that can be executed within the given timeframe.

Content: "${title}"
${content.substring(0, 1500)}

Truth Analysis:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}  
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}

Generate 6-8 strategic actions covering different implementation areas. For each action:
- Title should be specific and action-oriented  
- Description should be 3-5 sentences explaining what to do, why it matters, and expected results
- Implementation should be 2-3 sentences with specific first steps and timeline

Focus on immediate actions, content creation, audience engagement, brand positioning, and tactical implementation steps.

Return this JSON structure:
{
  "actions": [
    {
      "category": "action category name",
      "title": "specific actionable task title",
      "description": "3-5 sentences explaining the action, strategic rationale, and expected impact",
      "actionability": "high/medium/low",
      "impact": "high/medium/low",
      "timeframe": "immediate/short-term/long-term",
      "implementation": "2-3 sentences with specific steps, resources needed, and timeline"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 4000,
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

    let actionsData;
    try {
      actionsData = JSON.parse(responseContent);
    } catch (parseError) {
      debugLogger.error('JSON parsing failed for strategic actions', { 
        response: responseContent, 
        error: (parseError as Error).message 
      });
      
      try {
        const cleanedContent = responseContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^\s*/, '')
          .replace(/\s*$/, '');
        
        actionsData = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        throw new Error('Invalid JSON response from AI');
      }
    }

    let finalActions = actionsData.actions || [];
    
    if (!finalActions || finalActions.length === 0) {
      finalActions = [
        {
          category: "Strategic Implementation",
          title: "Truth Analysis Action Plan", 
          description: "Based on the Truth Analysis, specific actionable steps can be implemented to capitalize on identified opportunities.",
          actionability: "high",
          impact: "medium", 
          timeframe: "immediate",
          implementation: "Develop action plan based on Truth Analysis insights and begin implementation"
        }
      ];
    }

    res.json({
      success: true,
      actions: finalActions
    });

  } catch (error: any) {
    debugLogger.error('Strategic actions generation failed', error, req);
    res.status(500).json({
      success: false,
      error: 'Strategic actions generation failed',
      message: error.message
    });
  }
});

export default router;