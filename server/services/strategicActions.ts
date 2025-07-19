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
  async generateActions(content: string, title: string = '', truthAnalysis?: any): Promise<StrategicAction[]> {
    debugLogger.info('Starting strategic actions analysis', { contentLength: content.length, title });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'strategic-actions');
    
    // Check cache first
    const cached = await analysisCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
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
      
      // Cache the result only if it's not empty
      if (result && result.length > 0) {
        await analysisCache.set(cacheKey, result);
      }
      
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

  async generateAdvancedActions(
    content: string,
    title: string = '',
    truthAnalysis?: any,
    initialActions?: any[]
  ): Promise<any[]> {
    debugLogger.info('Starting advanced strategic actions analysis', { 
      contentLength: content.length, 
      title,
      initialActionsCount: initialActions?.length || 0
    });
    
    const startTime = Date.now();
    const cacheKey = createCacheKey(content, 'advanced-actions');
    
    // Check cache first
    const cached = await analysisCache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      debugLogger.info('Advanced strategic actions cache hit', { cacheKey, duration: Date.now() - startTime });
      return cached;
    }
    
    try {
      const prompt = this.buildAdvancedActionsPrompt(content, title, truthAnalysis, initialActions);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert advanced strategic action planner. Perform deep strategic action planning building on existing strategic actions to provide comprehensive action plans. Return structured JSON with exactly 5 advanced strategic actions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI for advanced strategic actions');
      }

      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      const advancedData = JSON.parse(cleanedResponse);
      
      const result = advancedData.advancedActions || [];
      
      // Cache the result only if it's not empty
      if (result && result.length > 0) {
        await analysisCache.set(cacheKey, result);
      }
      
      const processingTime = Date.now() - startTime;
      debugLogger.info(`Advanced strategic actions completed in ${processingTime}ms`, { actionCount: result.length });
      
      return result;
    } catch (error: any) {
      debugLogger.error('Advanced strategic actions failed', error);
      return this.getFallbackAdvancedActions();
    }
  }

  private buildAdvancedActionsPrompt(
    content: string,
    title: string,
    truthAnalysis?: any,
    initialActions?: any[]
  ): string {
    let prompt = `Perform advanced strategic action planning based on the following components:

ORIGINAL CONTENT:
Title: ${title}
Content: ${content}`;

    if (truthAnalysis) {
      prompt += `

TRUTH FRAMEWORK ANALYSIS:
- Fact: ${truthAnalysis.fact}
- Observation: ${truthAnalysis.observation} 
- Insight: ${truthAnalysis.insight}
- Human Truth: ${truthAnalysis.humanTruth}
- Cultural Moment: ${truthAnalysis.culturalMoment}
- Platform: ${truthAnalysis.platform}
- Attention Value: ${truthAnalysis.attentionValue}`;
    }

    if (initialActions && initialActions.length > 0) {
      prompt += `

INITIAL STRATEGIC ACTIONS:
${initialActions.map((action, index) => 
  `${index + 1}. ${typeof action === 'string' ? action : action.action || action.title || JSON.stringify(action)}`
).join('\n')}`;
    }

    prompt += `

Generate 5 advanced strategic actions that:
1. Build upon the initial strategic actions with more detailed implementation plans
2. Provide specific, executable strategic initiatives
3. Include resource requirements and success metrics
4. Suggest timeline and priority frameworks
5. Address potential implementation challenges

Return a JSON response with this structure:
{
  "advancedActions": [
    {
      "action": "string",
      "category": "immediate|short-term|long-term",
      "priority": "high|medium|low",
      "effort": "high|medium|low",
      "impact": "high|medium|low",
      "resources": ["required resource 1", "required resource 2"],
      "successMetrics": ["metric 1", "metric 2"],
      "implementationSteps": ["step 1", "step 2", "step 3"]
    }
  ]
}`;

    return prompt;
  }

  private getFallbackAdvancedActions(): any[] {
    return [
      {
        action: "Implement comprehensive content strategy with cultural moment integration",
        category: "short-term",
        priority: "high",
        effort: "high",
        impact: "high",
        resources: ["content team", "cultural intelligence tools", "social listening"],
        successMetrics: ["engagement rate increase", "cultural relevance score", "share velocity"],
        implementationSteps: ["Audit current content", "Implement cultural monitoring", "Create response framework"]
      },
      {
        action: "Develop advanced audience segmentation with behavioral triggers",
        category: "immediate",
        priority: "high",
        effort: "medium",
        impact: "high",
        resources: ["data analytics", "customer insights", "segmentation tools"],
        successMetrics: ["conversion rate improvement", "engagement per segment", "retention rates"],
        implementationSteps: ["Analyze audience data", "Create behavioral profiles", "Deploy targeted campaigns"]
      },
      {
        action: "Build competitive intelligence monitoring system",
        category: "short-term",
        priority: "medium",
        effort: "high", 
        impact: "high",
        resources: ["competitive intelligence tools", "market research", "analysis team"],
        successMetrics: ["competitive insights generated", "market opportunity identification", "strategic advantage"],
        implementationSteps: ["Select monitoring tools", "Define competitive metrics", "Establish reporting cadence"]
      },
      {
        action: "Create cross-platform content optimization engine",
        category: "long-term",
        priority: "medium",
        effort: "high",
        impact: "high",
        resources: ["AI optimization tools", "platform APIs", "content optimization team"],
        successMetrics: ["platform-specific engagement", "content performance", "distribution efficiency"],
        implementationSteps: ["Platform analysis", "Optimization algorithm development", "Performance testing"]
      },
      {
        action: "Establish strategic partnership network for content amplification",
        category: "long-term", 
        priority: "medium",
        effort: "high",
        impact: "high",
        resources: ["business development", "partnership team", "legal support"],
        successMetrics: ["partnership agreements", "amplification reach", "collaborative content performance"],
        implementationSteps: ["Identify strategic partners", "Develop partnership framework", "Execute pilot programs"]
      }
    ];
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