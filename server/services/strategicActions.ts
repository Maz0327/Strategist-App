import { openai } from './openai';
import { debugLogger } from './debug-logger';
import { analysisCache, createCacheKey } from './cache';

export interface StrategicAction {
  action: string;
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  resources: string[];
}

export class StrategicActionsService {
  async getStrategicActions(content: string, title: string = '', truthAnalysis?: any): Promise<StrategicAction[]> {
    debugLogger.info('Starting strategic actions analysis', { contentLength: content.length, title });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'strategic-actions');
    
    // Check cache first
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      debugLogger.info('Strategic actions cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildStrategicActionsPrompt(content, title, truthAnalysis);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert strategic action planner. Analyze content and derive actionable strategic actions from truth framework analysis. Return structured JSON with exactly 5 strategic actions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for strategic actions');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const actionsData = JSON.parse(cleanedResponse);
      
      const result = actionsData.actions || [];
      
      // Cache the result
      analysisCache.set(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Strategic actions completed in ${processingTime}ms`, { actionCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Strategic actions failed', error);
      // Return fallback actions
      return this.getFallbackActions();
    }
  }

  private buildStrategicActionsPrompt(content: string, title: string, truthAnalysis?: any): string {
    const basePrompt = `Analyze this content and generate strategic actions:

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

Based on this truth framework analysis, generate exactly 5 strategic actions that derive from these truths.

Provide strategic actions in JSON format:
{
  "actions": [
    {
      "action": "Specific actionable step derived from truth analysis",
      "category": "immediate",
      "priority": "high",
      "effort": "medium",
      "impact": "high",
      "resources": ["content team", "social media"]
    }
  ]
}

Return only valid JSON without markdown formatting.`;
    }
    
    return `${basePrompt}

Provide strategic actions in JSON format:
{
  "actions": [
    {
      "action": "Specific actionable step based on content analysis",
      "category": "immediate",
      "priority": "high",
      "effort": "medium",
      "impact": "high",
      "resources": ["content team", "social media"]
    }
  ]
}

Return only valid JSON without markdown formatting.`;
  }

  private getFallbackActions(): StrategicAction[] {
    return [
      {
        action: "Develop content strategy based on identified audience insights",
        category: "immediate",
        priority: "high",
        effort: "medium",
        impact: "high",
        resources: ["content team", "analytics"]
      },
      {
        action: "Create targeted campaigns for high-engagement segments",
        category: "short-term",
        priority: "high",
        effort: "medium",
        impact: "high",
        resources: ["marketing team", "creative team"]
      },
      {
        action: "Optimize content distribution channels for maximum reach",
        category: "immediate",
        priority: "medium",
        effort: "low",
        impact: "medium",
        resources: ["social media", "SEO tools"]
      },
      {
        action: "Build strategic partnerships to amplify content reach",
        category: "long-term",
        priority: "high",
        effort: "high",
        impact: "high",
        resources: ["business development", "partnerships"]
      },
      {
        action: "Establish measurement framework for strategic impact tracking",
        category: "short-term",
        priority: "medium",
        effort: "medium",
        impact: "medium",
        resources: ["analytics team", "reporting tools"]
      }
    ];
  }
}

export const strategicActionsService = new StrategicActionsService();