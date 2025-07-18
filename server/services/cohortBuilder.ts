import { openai } from './openai';
import { debugLogger } from './debug-logger';
import { cohortCache, createCacheKey } from './cache';

export interface CohortSuggestion {
  name: string;
  description: string;
  behaviorPatterns: string[];
  platforms: string[];
  size: 'small' | 'medium' | 'large';
  engagement: 'high' | 'medium' | 'low';
}

export class CohortBuilderService {
  async generateCohorts(content: string, title: string = '', truthAnalysis?: any): Promise<CohortSuggestion[]> {
    debugLogger.info('Starting cohort analysis', { contentLength: content.length, title });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'cohort');
    
    // Check cache first
    const cached = cohortCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      debugLogger.info('Cohort analysis cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildCohortPrompt(content, title, truthAnalysis);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert audience segmentation strategist. Analyze content and return structured JSON with cohort suggestions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for cohort analysis');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const cohortData = JSON.parse(cleanedResponse);
      
      const result = cohortData.cohorts || [];
      
      // Cache the result
      cohortCache.set(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Cohort analysis completed in ${processingTime}ms`, { cohortCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Cohort analysis failed', error);
      // Return fallback cohorts
      return this.getFallbackCohorts();
    }
  }

  private buildCohortPrompt(content: string, title: string, truthAnalysis?: any): string {
    const basePrompt = `Analyze this content and suggest 3-5 specific behavioral audience cohorts:

Title: ${title}
Content: ${content}`;

    if (truthAnalysis) {
      return `${basePrompt}

TRUTH FRAMEWORK ANALYSIS:
Fact: ${truthAnalysis.fact}
Observation: ${truthAnalysis.observation}
Insight: ${truthAnalysis.insight}
Human Truth: ${truthAnalysis.humanTruth}
Cultural Moment: ${truthAnalysis.culturalMoment}
Attention Value: ${truthAnalysis.attentionValue}

Base your cohort suggestions on these truth insights to ensure consistency.

Provide cohort suggestions in JSON format:
{
  "cohorts": [
    {
      "name": "Early Tech Adopters",
      "description": "Tech-savvy professionals who embrace new tools early",
      "behaviorPatterns": ["Early adoption", "Tech evangelism", "Community building"],
      "platforms": ["Twitter", "LinkedIn", "Product Hunt"],
      "size": "medium",
      "engagement": "high"
    }
  ]
}

Return only valid JSON without markdown formatting.`;
    }
    
    return `${basePrompt}

Provide cohort suggestions in JSON format:
{
  "cohorts": [
    {
      "name": "Early Tech Adopters",
      "description": "Tech-savvy professionals who embrace new tools early",
      "behaviorPatterns": ["Early adoption", "Tech evangelism", "Community building"],
      "platforms": ["Twitter", "LinkedIn", "Product Hunt"],
      "size": "medium",
      "engagement": "high"
    }
  ]
}

Return only valid JSON without markdown formatting.`;
  }

  private getFallbackCohorts(): CohortSuggestion[] {
    return [
      {
        name: "AI-Curious Content Creators",
        description: "Content creators exploring AI tools for efficiency while maintaining authenticity",
        behaviorPatterns: ["Early adopters of AI tools", "Experimentation-focused approach", "Efficiency-seeking behavior"],
        platforms: ["YouTube", "LinkedIn", "Twitter"],
        size: "medium",
        engagement: "high"
      },
      {
        name: "Authentic Brand Advocates",
        description: "Consumers who prioritize genuine human connection in brand messaging",
        behaviorPatterns: ["Values-driven purchasing", "Brand authenticity verification", "Community-focused engagement"],
        platforms: ["Instagram", "TikTok", "Facebook"],
        size: "large",
        engagement: "medium"
      },
      {
        name: "Tech-Savvy Marketing Strategists",
        description: "Marketing professionals leveraging AI for strategic advantage",
        behaviorPatterns: ["Data-driven decision making", "Strategic AI implementation", "Innovation-focused campaigns"],
        platforms: ["LinkedIn", "Twitter", "Industry forums"],
        size: "small",
        engagement: "high"
      },
      {
        name: "Cultural Moment Seekers",
        description: "Audiences who engage with timely, culturally relevant content",
        behaviorPatterns: ["Trend-conscious behavior", "Real-time engagement", "Cultural awareness"],
        platforms: ["TikTok", "Twitter", "Instagram"],
        size: "medium",
        engagement: "high"
      }
    ];
  }
}

export const cohortBuilderService = new CohortBuilderService();