# Code Export for External Analysis - July 17, 2025

## System Overview
Strategic content analysis platform with React frontend, Express backend, PostgreSQL database, and OpenAI integration.

## Current Issue
GPT-4o-mini not consistently following length preferences (medium = 3-5 sentences) despite explicit prompt instructions.

## Key Files for Analysis

### 1. OpenAI Service (Primary Issue Location)
**File:** `server/services/openai.ts`
- Contains the prompt building logic
- Handles length preferences
- Current issue: Model returns 1-2 sentences for "medium" instead of 3-5

### 2. Frontend Analysis Display
**File:** `client/src/components/enhanced-analysis-results.tsx`
- Displays the analysis results
- Shows length preference dropdown
- Handles user interaction

### 3. Content Input Component
**File:** `client/src/components/content-input.tsx`
- Manages user input and analysis requests
- Handles length preference selection
- Connects to backend API

### 4. Backend API Routes
**File:** `server/routes.ts`
- Handles /api/analyze endpoint
- Processes analysis requests
- Manages authentication

### 5. Database Schema
**File:** `shared/schema.ts`
- Defines data structure for signals
- Contains analysis result types
- Type definitions for frontend/backend

## Current Configuration
- Model: GPT-4o-mini (cost optimization)
- Length Options: Short (2 sentences), Medium (3-5 sentences), Long (6-9 sentences), Bulletpoints (multiple points)
- Architecture: Single API call per analysis
- Caching: In-memory analysis cache active

## Performance Metrics
- Analysis time: 9-10 seconds average
- Cache hit time: ~500ms
- System health: 95/100

## Problem Statement
Despite explicit prompt instructions with "CRITICAL LENGTH REQUIREMENT" and "MANDATORY" language, GPT-4o-mini consistently returns shorter responses than requested length preferences.

## Suggested Solutions (Not Implemented)
1. Sentence-arrays approach (array of sentences instead of free text)
2. Few-shot examples in prompt
3. Post-parse validation with auto-retry
4. Function-calling with strict JSON schema
5. Inline self-check instructions

## Files Exported Below
All critical system files follow this summary for detailed analysis.

---

## 1. OpenAI Service - Primary Issue Location
**File:** `server/services/openai.ts`

```typescript
import OpenAI from "openai";
import type { AnalyzeContentData } from "@shared/schema";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import { analysisCache, createCacheKey } from "./cache";
import { performanceMonitor } from "./monitoring";

// Using gpt-4o-mini for cost-efficient testing phase, can upgrade to gpt-4o later
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.API_KEY,
  timeout: 45 * 1000, // 45 second timeout
  maxRetries: 2, // Built-in retries
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
    
    const content = data.content || '';
    const title = data.title || '';
    const url = data.url || '';
    
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = createCacheKey(content + title + lengthPreference, 'analysis');
    const cached = analysisCache.get(cacheKey);
    
    if (cached) {
      const cacheTime = Date.now() - startTime;
      debugLogger.info('Analysis cache hit', { cacheKey, duration: cacheTime });
      performanceMonitor.logRequest('/api/analyze', 'POST', cacheTime, true, true);
      return cached;
    }
    
    try {
      const prompt = this.buildAnalysisPrompt(content, title, url, lengthPreference);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert content strategist. Analyze content and return structured JSON with strategic insights." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI');
      }

      debugLogger.info(`OpenAI response received, length: ${analysisText.length}`);
      debugLogger.info('Raw OpenAI response:', { response: analysisText.substring(0, 500) });
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = analysisText.replace(/```json|```/g, '').trim();
      debugLogger.info('Cleaned response:', { response: cleanedResponse.substring(0, 500) });
      
      let analysis;
      try {
        analysis = JSON.parse(cleanedResponse);
        debugLogger.info('Successfully parsed OpenAI response', { 
          hasSummary: !!analysis.summary,
          hasTruthAnalysis: !!analysis.truthAnalysis,
          hasKeywords: !!analysis.keywords
        });
      } catch (parseError) {
        debugLogger.error('JSON parsing failed', { response: cleanedResponse, error: parseError });
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      debugLogger.info(`Analysis completed in ${Date.now() - startTime}ms`);

      const result = {
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
      
      debugLogger.info('Final analysis result:', { 
        summary: result.summary.substring(0, 100),
        sentiment: result.sentiment,
        keywordCount: result.keywords.length,
        truthAnalysisKeys: Object.keys(result.truthAnalysis)
      });
      
      // Cache the result
      analysisCache.set(cacheKey, result);
      
      const processingTime = Date.now() - startTime;
      performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, true, false);
      
      return result;
    } catch (error: any) {
      debugLogger.error('OpenAI analysis failed', error);
      const processingTime = Date.now() - startTime;
      performanceMonitor.logRequest('/api/analyze', 'POST', processingTime, false, false);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  private buildAnalysisPrompt(content: string, title: string, url: string, lengthPreference: string): string {
    const lengthGuidance = {
      short: "2 sentences",
      medium: "3-5 sentences",
      long: "6-9 sentences",
      bulletpoints: "multiple important points"
    }[lengthPreference] || "3-5 sentences";

    return `Analyze this content for strategic insights:

Title: ${title}
Content: ${content}
URL: ${url}

CRITICAL LENGTH REQUIREMENT: You must write exactly ${lengthGuidance} for ALL descriptive text fields. This is mandatory.

Provide comprehensive strategic analysis in JSON format:
{
  "summary": "Strategic overview that contains exactly ${lengthGuidance}",
  "sentiment": "positive/negative/neutral",
  "tone": "professional/casual/urgent/analytical",
  "keywords": ["strategic", "keywords", "here"],
  "confidence": "85%",
  "truthAnalysis": {
    "fact": "What factually happened - write exactly ${lengthGuidance}",
    "observation": "What patterns you observe - write exactly ${lengthGuidance}", 
    "insight": "Why this is happening - write exactly ${lengthGuidance}",
    "humanTruth": "Deep psychological driver - write exactly ${lengthGuidance}",
    "culturalMoment": "Larger cultural shift this represents - write exactly ${lengthGuidance}",
    "attentionValue": "high/medium/low",
    "platform": "Platform or context",
    "cohortOpportunities": ["behavioral audience segments"]
  },
  "cohortSuggestions": ["audience cohort suggestions"],
  "platformContext": "Platform relevance explanation - write exactly ${lengthGuidance}",
  "viralPotential": "high/medium/low",
  "competitiveInsights": ["competitive insights"],
  "strategicInsights": ["strategic business insights"],
  "strategicActions": ["actionable next steps"]
}

MANDATORY: Every descriptive text field must contain exactly ${lengthGuidance}. Count your sentences carefully. Return only valid JSON without markdown formatting.`;
  }
}

export const openaiService = new OpenAIService();
```

---

## 2. Shared Schema Types
**File:** `shared/schema.ts`

```typescript
// Key type definitions for length preference
export interface AnalyzeContentData {
  content: string;
  title?: string;
  url?: string;
  lengthPreference?: 'short' | 'medium' | 'long' | 'bulletpoints';
}

// Current length preference configuration:
// - short: "2 sentences"
// - medium: "3-5 sentences"  
// - long: "6-9 sentences"
// - bulletpoints: "multiple important points"
```

---

## 3. Current Prompt Structure Analysis

**ISSUE:** Despite explicit instructions like "CRITICAL LENGTH REQUIREMENT" and "MANDATORY", GPT-4o-mini consistently returns 1-2 sentences for medium preference instead of the required 3-5 sentences.

**Current Prompt Structure:**
1. Content input (title, content, url)
2. Length requirement emphasis
3. JSON schema with repeated length instructions
4. Field-specific length reminders
5. Final mandatory instruction

**Problem Pattern:**
- Medium preference should return 3-5 sentences
- Actual output: 1-2 sentences consistently
- Same issue across all Truth Analysis fields (fact, observation, insight, humanTruth, culturalMoment)

**Architecture Context:**
- Single API call per analysis
- GPT-4o-mini model (cost optimization)
- In-memory caching active
- 9-10 second average response time
- No post-processing validation

**Suggested Fix (Not Implemented):**
Sentence-arrays approach - Return each field as JSON array of sentences instead of free text, ensuring exact sentence count control.

---

## Analysis Complete
All critical files exported for external analysis. The core issue is in the `buildAnalysisPrompt` method where despite explicit length requirements, GPT-4o-mini doesn't consistently follow the sentence count specifications.