import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { openai } from '../services/openai';
import { debugLogger } from '../services/debug-logger';

const router = Router();

const cohortAnalysisSchema = z.object({
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

router.post('/api/cohorts', requireAuth, async (req, res) => {
  try {
    const result = cohortAnalysisSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors
      });
    }

    const { content, title, truthAnalysis } = result.data;
    
    debugLogger.info('Generating cohorts with GPT-4o', { title, userId: req.session.userId }, req);

    const systemPrompt = `You are an expert audience strategist specializing in behavioral cohort analysis. Based on Truth Analysis insights, generate strategic audience cohorts that brands can target effectively.

Return a JSON object with this structure:
{
  "cohorts": [
    {
      "name": "string", 
      "description": "string",
      "size": "string", 
      "engagement": "high/medium/low",
      "characteristics": ["string"],
      "platform": "string",
      "strategy": "string"
    }
  ]
}`;

    const userPrompt = `Analyze this content and truth analysis to generate 4-6 strategic audience cohorts:

Title: ${title}
Content: ${content.substring(0, 2000)}

Truth Analysis:
- Fact: ${truthAnalysis.fact}
- Observation: ${truthAnalysis.observation}
- Insight: ${truthAnalysis.insight}
- Human Truth: ${truthAnalysis.humanTruth}
- Cultural Moment: ${truthAnalysis.culturalMoment}

Generate specific, actionable audience cohorts with targeting strategies.`;

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

    let cohortData;
    try {
      cohortData = JSON.parse(responseContent);
    } catch (parseError) {
      debugLogger.error('JSON parsing failed for cohorts', { response: responseContent, error: parseError }, req);
      throw new Error('Invalid JSON response from AI');
    }

    debugLogger.info('Cohort analysis completed', { 
      cohortsGenerated: cohortData.cohorts?.length || 0,
      userId: req.session.userId 
    }, req);

    res.json({
      success: true,
      cohorts: cohortData.cohorts || []
    });

  } catch (error: any) {
    debugLogger.error('Cohort analysis failed', error, req);
    res.status(500).json({
      success: false,
      error: 'Cohort analysis failed',
      message: error.message
    });
  }
});

export default router;