# Complete System Code Export - July 17, 2025

## System Overview
Strategic content analysis platform with React frontend, Express backend, PostgreSQL database, and OpenAI integration for deep behavioral insights and cultural truths.

## Current Issue
GPT-4o-mini not consistently following length preferences (medium = 3-5 sentences) despite explicit prompt instructions.

## Architecture Summary
- **Frontend**: React + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Express.js + TypeScript + PostgreSQL + Drizzle ORM
- **AI Integration**: OpenAI GPT-4o-mini for cost-efficient analysis
- **Performance**: 9-10 second analysis times, 95/100 system health
- **Caching**: In-memory analysis caching with TTL

---

# CORE CODE FILES

## 1. OpenAI Service - Primary Analysis Engine
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

## 2. Database Schema - Data Structure
**File:** `shared/schema.ts`

```typescript
import { pgTable, text, serial, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title"),
  content: text("content").notNull(),
  url: text("url"),
  summary: text("summary"),
  sentiment: text("sentiment"),
  tone: text("tone"),
  keywords: text("keywords").array(),
  tags: text("tags").array(),
  confidence: text("confidence"),
  status: text("status").default("capture"), // capture -> potential_signal -> signal
  // Enhanced analysis fields
  truthFact: text("truth_fact"),
  truthObservation: text("truth_observation"),
  truthInsight: text("truth_insight"),
  humanTruth: text("human_truth"),
  culturalMoment: text("cultural_moment"),
  attentionValue: text("attention_value"),
  platformContext: text("platform_context"),
  viralPotential: text("viral_potential"),
  cohortSuggestions: text("cohort_suggestions").array(),
  competitiveInsights: text("competitive_insights").array(),
  nextActions: text("next_actions").array(),
  // User-driven workflow enhancements
  userNotes: text("user_notes"),
  promotionReason: text("promotion_reason"),
  systemSuggestionReason: text("system_suggestion_reason"),
  flaggedAt: timestamp("flagged_at"),
  promotedAt: timestamp("promoted_at"),
  // Chrome extension draft fields
  isDraft: boolean("is_draft").default(false),
  capturedAt: timestamp("captured_at"),
  browserContext: jsonb("browser_context"), // JSON for domain, meta description, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Length preference schema
export const analyzeContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  title: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  lengthPreference: z.enum(['short', 'medium', 'long', 'bulletpoints']).optional(),
});

export type AnalyzeContentData = z.infer<typeof analyzeContentSchema>;

// Current length preference configuration:
// - short: "2 sentences"
// - medium: "3-5 sentences"  
// - long: "6-9 sentences"
// - bulletpoints: "multiple important points"
```

---

## 3. Backend API Routes - Content Analysis Endpoint
**File:** `server/routes.ts` (Analysis Route)

```typescript
// Content analysis routes
app.post("/api/analyze", requireAuth, async (req, res) => {
  try {
    debugLogger.info("Content analysis request received", { title: req.body.title, hasUrl: !!req.body.url, contentLength: req.body.content?.length }, req);
    const data = analyzeContentSchema.parse(req.body);
    debugLogger.info("Content data parsed successfully", { title: data.title, url: data.url }, req);
    
    const lengthPreference = req.body.lengthPreference || 'medium';
    const userNotes = req.body.userNotes || '';
    const analysis = await openaiService.analyzeContent(data, lengthPreference);
    debugLogger.info("OpenAI analysis completed", { sentiment: analysis.sentiment, confidence: analysis.confidence, keywordCount: analysis.keywords.length }, req);
    
    // Save as potential signal after analysis
    const signalData = {
      userId: req.session.userId!,
      title: data.title || "Untitled Analysis",
      content: data.content,
      url: data.url,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      tone: analysis.tone,
      keywords: analysis.keywords,
      tags: [],
      confidence: analysis.confidence,
      status: "capture", // Start as capture, user decides if it becomes potential_signal
      // Enhanced analysis fields
      truthFact: analysis.truthAnalysis.fact,
      truthObservation: analysis.truthAnalysis.observation,
      truthInsight: analysis.truthAnalysis.insight,
      humanTruth: analysis.truthAnalysis.humanTruth,
      culturalMoment: analysis.truthAnalysis.culturalMoment,
      attentionValue: analysis.truthAnalysis.attentionValue,
      platformContext: analysis.platformContext,
      viralPotential: analysis.viralPotential,
      cohortSuggestions: analysis.cohortSuggestions,
      competitiveInsights: analysis.competitiveInsights,
      userNotes: userNotes
    };
    
    const signal = await storage.createSignal(signalData);
    debugLogger.info("Signal created successfully", { signalId: signal.id, status: signal.status }, req);
    
    res.json({
      success: true,
      analysis,
      signalId: signal.id
    });
    debugLogger.info("Analysis request completed successfully", { signalId: signal.id }, req);
  } catch (error: any) {
    debugLogger.error('Content analysis failed', error, req);
    res.status(400).json({ message: error.message });
  }
});
```

---

## 4. Frontend Content Input Component
**File:** `client/src/components/content-input.tsx` (Key Methods)

```typescript
// Length preference handling
const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'long' | 'bulletpoints'>('medium');

// Analysis submission
const handleAnalyze = async (data: AnalyzeContentData) => {
  if (useStreaming) {
    await handleStreamingAnalysis(data);
  } else {
    // Fallback to regular analysis with auto-retry
    setIsLoading(true);
    onAnalysisStart?.();
    try {
      const requestData = { ...data, lengthPreference, userNotes };
      
      const result = await retryRequest(async () => {
        const response = await apiRequest("POST", "/api/analyze", requestData);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to analyze content");
        }
        
        return await response.json();
      });
      
      onAnalysisComplete?.(result, data);
      
      toast({
        title: "Analysis Complete", 
        description: "Content captured and analyzed. Use 'Flag as Worth Researching' below to mark important insights, or check Suggestions tab for AI recommendations.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
};

// Length preference UI
<Select value={lengthPreference} onValueChange={(value: any) => setLengthPreference(value)}>
  <SelectTrigger className="w-32">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="short">Short</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="long">Long</SelectItem>
    <SelectItem value="bulletpoints">Bulletpoints</SelectItem>
  </SelectContent>
</Select>
```

---

## 5. Frontend Analysis Results Component
**File:** `client/src/components/enhanced-analysis-results.tsx` (Length Preference Logic)

```typescript
// Length preference state management
const [lengthPreference, setLengthPreference] = useState<'short' | 'medium' | 'long' | 'bulletpoints'>('medium');
const [isReanalyzing, setIsReanalyzing] = useState(false);
const [currentAnalysis, setCurrentAnalysis] = useState(data);
const [analysisCache, setAnalysisCache] = useState<Record<string, any>>({
  medium: data // Cache the initial analysis with medium length
});

// Re-analysis with different length preference
const handleLengthPreferenceChange = async (newLength: 'short' | 'medium' | 'long' | 'bulletpoints') => {
  setLengthPreference(newLength);
  
  // Check if we already have this analysis cached
  if (analysisCache[newLength]) {
    setCurrentAnalysis(analysisCache[newLength]);
    toast({
      title: "Length Switched",
      description: `Showing ${newLength} analysis from cache.`,
    });
    return;
  }
  
  // If not cached and we have original content, re-analyze
  if (originalContent) {
    setIsReanalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/reanalyze", {
        content: originalContent.content,
        title: originalContent.title,
        url: originalContent.url,
        lengthPreference: newLength
      });
      
      if (!response.ok) {
        throw new Error("Failed to re-analyze content");
      }
      
      const result = await response.json();
      const newAnalysis = result.analysis;
      
      // Cache the new analysis
      setAnalysisCache(prev => ({
        ...prev,
        [newLength]: newAnalysis
      }));
      
      setCurrentAnalysis(newAnalysis);
      
      toast({
        title: "Analysis Updated",
        description: `Generated new ${newLength} analysis.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to re-analyze content",
        variant: "destructive",
      });
    } finally {
      setIsReanalyzing(false);
    }
  }
};

// Truth Analysis display with length preference dropdown
<div className="flex items-center justify-between">
  <CardTitle className="flex items-center gap-2">
    <Eye className="h-5 w-5" />
    Truth Framework Analysis
  </CardTitle>
  <div className="flex items-center gap-2">
    <Label htmlFor="length-preference" className="text-sm">Length:</Label>
    <Select value={lengthPreference} onValueChange={(value: any) => handleLengthPreferenceChange(value)} disabled={isReanalyzing}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="short">Short</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="long">Long</SelectItem>
        <SelectItem value="bulletpoints">Bulletpoints</SelectItem>
      </SelectContent>
    </Select>
    {isReanalyzing && (
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <LoadingSpinner size="sm" />
        <span>Re-analyzing...</span>
      </div>
    )}
  </div>
</div>
```

---

## 6. Cache Service - Performance Optimization
**File:** `server/services/cache.ts`

```typescript
import { createHash } from 'crypto';

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class InMemoryCache {
  private cache: Map<string, CacheItem> = new Map();
  private readonly defaultTtl = 60 * 60 * 1000; // 1 hour

  set(key: string, data: any, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const analysisCache = new InMemoryCache();

export function createCacheKey(content: string, type: string = 'analysis'): string {
  return `${type}:${createHash('md5').update(content).digest('hex')}`;
}
```

---

## Problem Analysis Summary

### Current Issue
**GPT-4o-mini consistently returns 1-2 sentences for "medium" length preference instead of the required 3-5 sentences.**

### Architecture Flow
1. **User Input**: Length preference selected in ContentInput component
2. **API Request**: Sent to `/api/analyze` with `lengthPreference` parameter
3. **Prompt Building**: `buildAnalysisPrompt` method creates prompt with length requirements
4. **OpenAI Call**: Single GPT-4o-mini request with explicit length instructions
5. **Response Processing**: JSON parsing and caching of results
6. **UI Display**: Results shown in EnhancedAnalysisResults with re-analysis options

### Key Technical Details
- **Model**: GPT-4o-mini (cost optimization)
- **Prompt Engineering**: Multiple explicit length requirements throughout prompt
- **Caching**: In-memory caching with TTL for performance
- **Re-analysis**: Frontend can request different length preferences
- **Performance**: 9-10 second average analysis time

### Suggested Solutions (Not Implemented)
1. **Sentence-arrays approach**: Return JSON arrays instead of text strings
2. **Few-shot examples**: Add examples of proper length responses
3. **Post-parse validation**: Validate sentence count and auto-retry
4. **Function calling**: Use OpenAI function calling with strict schemas
5. **Template expansion**: Use fill-in-the-blank templates for exact control

---

## Complete Core Code Export - Ready for External Analysis
All essential system components exported with focus on the length preference issue in the OpenAI prompt engineering.
