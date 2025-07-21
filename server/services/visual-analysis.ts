import { openai } from "./openai";
import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";
import type { VisualAsset } from "./scraper";

export interface VisualAnalysisResult {
  brandElements: BrandElements;
  culturalVisualMoments: CulturalVisualMoments;
  competitiveVisualInsights: CompetitiveVisualInsights;
  socialMediaIntelligence: SocialMediaIntelligence;
  strategicRecommendations: string[];
  confidenceScore: number;
}

export interface BrandElements {
  colorPalette: {
    dominant: string[];
    secondary: string[];
    trend: 'gen-z-pastels' | 'y2k-metallics' | 'minimalist-mono' | 'bold-contrasts' | 'earth-tones' | 'neon-cyber' | 'other';
  };
  typography: {
    primaryFont: string;
    style: 'serif' | 'sans-serif' | 'display' | 'script' | 'monospace';
    weight: 'light' | 'regular' | 'medium' | 'bold' | 'extra-bold';
    trend: 'brutalist' | 'minimalist' | 'vintage' | 'futuristic' | 'handwritten' | 'geometric' | 'other';
  };
  layoutComposition: {
    style: 'single-image' | 'carousel' | 'grid' | 'story' | 'video-first' | 'text-overlay' | 'mixed-media';
    textPlacement: 'top' | 'bottom' | 'center' | 'overlay' | 'side' | 'scattered';
    balance: 'symmetrical' | 'asymmetrical' | 'rule-of-thirds' | 'centered' | 'dynamic';
  };
  visualFilter: {
    aesthetic: 'natural' | 'high-contrast' | 'vintage' | 'bright' | 'moody' | 'minimalist' | 'saturated';
    lighting: 'natural' | 'studio' | 'dramatic' | 'soft' | 'harsh' | 'backlighting' | 'golden-hour';
    processing: 'unfiltered' | 'instagram' | 'vsco' | 'film' | 'digital' | 'artistic' | 'professional';
  };
}

export interface CulturalVisualMoments {
  memeElements: {
    present: boolean;
    type: 'image-macro' | 'reaction-gif' | 'video-meme' | 'text-overlay' | 'visual-pun' | 'trend-participation' | 'none';
    viralPotential: 'high' | 'medium' | 'low';
    lifecycle: 'emerging' | 'peak' | 'declining' | 'evergreen';
  };
  generationalAesthetics: {
    primary: 'gen-z' | 'millennial' | 'gen-x' | 'boomer' | 'gen-alpha' | 'cross-generational';
    indicators: string[];
    authenticity: 'authentic' | 'trying-too-hard' | 'corporate' | 'influencer' | 'user-generated';
  };
  culturalSymbols: {
    symbols: string[];
    meaning: string[];
    relevance: 'high' | 'medium' | 'low';
    controversy: 'none' | 'potential' | 'active' | 'resolved';
  };
  viralPatterns: {
    elements: string[];
    shareability: 'high' | 'medium' | 'low';
    platformOptimization: string[];
    timingRelevance: 'urgent' | 'trending' | 'evergreen' | 'seasonal';
  };
}

export interface CompetitiveVisualInsights {
  brandStrategy: {
    approach: 'premium' | 'accessible' | 'edgy' | 'conservative' | 'innovative' | 'traditional' | 'disruptive';
    positioning: 'leader' | 'challenger' | 'follower' | 'niche' | 'luxury' | 'mass-market' | 'boutique';
    consistency: 'highly-consistent' | 'consistent' | 'somewhat-consistent' | 'inconsistent' | 'experimental';
  };
  visualDifferentiation: {
    uniqueness: 'highly-unique' | 'moderately-unique' | 'somewhat-unique' | 'generic' | 'copycat';
    standoutElements: string[];
    competitorGaps: string[];
    opportunities: string[];
  };
  campaignEvolution: {
    direction: 'evolving' | 'static' | 'declining' | 'revolutionary' | 'following-trends' | 'setting-trends';
    recentChanges: string[];
    predictedDirection: string;
  };
}

export interface SocialMediaIntelligence {
  platformOptimization: {
    bestPlatforms: string[];
    currentPlatform: string;
    adaptationNeeded: string[];
    crossPlatformPotential: 'high' | 'medium' | 'low';
  };
  engagementPrediction: {
    likeability: 'high' | 'medium' | 'low';
    shareability: 'high' | 'medium' | 'low';
    commentability: 'high' | 'medium' | 'low';
    factors: string[];
  };
  trendAlignment: {
    currentTrends: string[];
    alignment: 'perfectly-aligned' | 'well-aligned' | 'somewhat-aligned' | 'misaligned' | 'counter-trend';
    trendLifecycle: 'emerging' | 'growing' | 'peak' | 'declining' | 'dead';
  };
}

export class VisualAnalysisService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key required for visual analysis');
    }
  }

  async analyzeVisualAssets(
    visualAssets: VisualAsset[],
    contentContext: string,
    url?: string
  ): Promise<VisualAnalysisResult> {
    if (!visualAssets || visualAssets.length === 0) {
      throw new Error('No visual assets provided for analysis');
    }

    try {
      // Filter only valid HTTP image URLs (exclude base64 and invalid URLs)
      const imagesToAnalyze = visualAssets
        .filter(asset => 
          asset && 
          asset.type === 'image' && 
          asset.url && 
          typeof asset.url === 'string' && 
          asset.url.trim().length > 0 &&
          !asset.url.includes('data:') && // Exclude base64 images
          (asset.url.startsWith('http://') || asset.url.startsWith('https://'))
        )
        .slice(0, 5); // Limit to 5 images for cost efficiency

      debugLogger.info('Visual analysis asset filtering', {
        totalAssets: visualAssets.length,
        validImages: imagesToAnalyze.length,
        imageUrls: imagesToAnalyze.map(a => a.url)
      });

      if (imagesToAnalyze.length === 0) {
        throw new Error('No valid HTTP image URLs found for visual analysis. Base64 images are not currently supported.');
      }

      const analysisPrompt = this.buildAnalysisPrompt(contentContext, url);
      
      // Process images through OpenAI Vision API
      const visionResponse: any = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o-mini", // Use faster, cheaper model for visual analysis
          messages: [
            {
              role: "system",
              content: analysisPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze these visual assets in the context of: ${contentContext}. Provide comprehensive visual intelligence analysis following the JSON schema provided.`
                },
                ...imagesToAnalyze.map(asset => ({
                  type: "image_url" as const,
                  image_url: {
                    url: asset.url,
                    detail: "low" as const // Changed from high to low for faster processing
                  }
                }))
              ]
            }
          ],
          max_tokens: 800, // Further reduced for speed
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Visual analysis timeout')), 10000)
        )
      ]);

      const analysis = JSON.parse(visionResponse.choices[0].message.content || '{}');
      
      // Track analytics
      // Skip analytics tracking to avoid database errors
      // await analyticsService.trackFeatureUsage(...)

      return this.processAnalysisResult(analysis);

    } catch (error: any) {
      debugLogger.error('Visual analysis failed:', error);
      
      // Skip analytics tracking to avoid database errors
      // await analyticsService.trackFeatureUsage(...)

      throw new Error(`Visual analysis failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private buildAnalysisPrompt(contentContext: string, url?: string): string {
    return `You are a visual intelligence expert specializing in brand strategy, cultural analysis, and competitive intelligence. Analyze the provided images and provide comprehensive visual intelligence insights.

CRITICAL: Respond with valid JSON only. Write your analysis in a professional, strategic tone - like you're briefing a creative strategist team.

Context: ${contentContext}
${url ? `Source URL: ${url}` : ''}

Analyze the visual assets for:

1. **Brand Elements Analysis:**
   - Color palettes and trends (Gen Z pastels, Y2K metallics, minimalist mono, etc.)
   - Typography patterns and emerging font choices
   - Layout compositions and design principles
   - Visual filters and aesthetic trends

2. **Cultural Visual Moments:**
   - Meme elements and viral potential
   - Generational aesthetics and authenticity
   - Cultural symbols and their meanings
   - Viral patterns and shareability factors

3. **Competitive Visual Intelligence:**
   - Brand strategy and positioning
   - Visual differentiation and uniqueness
   - Campaign evolution and direction
   - Competitor gaps and opportunities

4. **Social Media Intelligence:**
   - Platform optimization potential
   - Engagement prediction factors
   - Trend alignment analysis
   - Cross-platform adaptability

Return this exact JSON structure:
{
  "brandElements": {
    "colorPalette": {
      "dominant": ["color1", "color2", "color3"],
      "secondary": ["color4", "color5"],
      "trend": "gen-z-pastels|y2k-metallics|minimalist-mono|bold-contrasts|earth-tones|neon-cyber|other"
    },
    "typography": {
      "primaryFont": "font description",
      "style": "serif|sans-serif|display|script|monospace",
      "weight": "light|regular|medium|bold|extra-bold",
      "trend": "brutalist|minimalist|vintage|futuristic|handwritten|geometric|other"
    },
    "layoutComposition": {
      "style": "single-image|carousel|grid|story|video-first|text-overlay|mixed-media",
      "textPlacement": "top|bottom|center|overlay|side|scattered",
      "balance": "symmetrical|asymmetrical|rule-of-thirds|centered|dynamic"
    },
    "visualFilter": {
      "aesthetic": "natural|high-contrast|vintage|bright|moody|minimalist|saturated",
      "lighting": "natural|studio|dramatic|soft|harsh|backlighting|golden-hour",
      "processing": "unfiltered|instagram|vsco|film|digital|artistic|professional"
    }
  },
  "culturalVisualMoments": {
    "memeElements": {
      "present": true/false,
      "type": "image-macro|reaction-gif|video-meme|text-overlay|visual-pun|trend-participation|none",
      "viralPotential": "high|medium|low",
      "lifecycle": "emerging|peak|declining|evergreen"
    },
    "generationalAesthetics": {
      "primary": "gen-z|millennial|gen-x|boomer|gen-alpha|cross-generational",
      "indicators": ["indicator1", "indicator2", "indicator3"],
      "authenticity": "authentic|trying-too-hard|corporate|influencer|user-generated"
    },
    "culturalSymbols": {
      "symbols": ["symbol1", "symbol2"],
      "meaning": ["meaning1", "meaning2"],
      "relevance": "high|medium|low",
      "controversy": "none|potential|active|resolved"
    },
    "viralPatterns": {
      "elements": ["element1", "element2", "element3"],
      "shareability": "high|medium|low",
      "platformOptimization": ["platform1", "platform2"],
      "timingRelevance": "urgent|trending|evergreen|seasonal"
    }
  },
  "competitiveVisualInsights": {
    "brandStrategy": {
      "approach": "premium|accessible|edgy|conservative|innovative|traditional|disruptive",
      "positioning": "leader|challenger|follower|niche|luxury|mass-market|boutique",
      "consistency": "highly-consistent|consistent|somewhat-consistent|inconsistent|experimental"
    },
    "visualDifferentiation": {
      "uniqueness": "highly-unique|moderately-unique|somewhat-unique|generic|copycat",
      "standoutElements": ["element1", "element2", "element3"],
      "competitorGaps": ["gap1", "gap2"],
      "opportunities": ["opportunity1", "opportunity2", "opportunity3"]
    },
    "campaignEvolution": {
      "direction": "evolving|static|declining|revolutionary|following-trends|setting-trends",
      "recentChanges": ["change1", "change2"],
      "predictedDirection": "prediction of future direction"
    }
  },
  "socialMediaIntelligence": {
    "platformOptimization": {
      "bestPlatforms": ["platform1", "platform2", "platform3"],
      "currentPlatform": "detected platform",
      "adaptationNeeded": ["adaptation1", "adaptation2"],
      "crossPlatformPotential": "high|medium|low"
    },
    "engagementPrediction": {
      "likeability": "high|medium|low",
      "shareability": "high|medium|low",
      "commentability": "high|medium|low",
      "factors": ["factor1", "factor2", "factor3"]
    },
    "trendAlignment": {
      "currentTrends": ["trend1", "trend2", "trend3"],
      "alignment": "perfectly-aligned|well-aligned|somewhat-aligned|misaligned|counter-trend",
      "trendLifecycle": "emerging|growing|peak|declining|dead"
    }
  },
  "strategicRecommendations": [
    "Strategic recommendation 1 based on visual analysis",
    "Strategic recommendation 2 for competitive advantage",
    "Strategic recommendation 3 for cultural relevance",
    "Strategic recommendation 4 for platform optimization",
    "Strategic recommendation 5 for brand evolution"
  ],
  "confidenceScore": 85
}

Focus on providing actionable strategic insights that give competitive advantages through visual intelligence.`;
  }

  private processAnalysisResult(analysis: any): VisualAnalysisResult {
    // Validate and sanitize the analysis result
    const defaultResult: VisualAnalysisResult = {
      brandElements: {
        colorPalette: { dominant: [], secondary: [], trend: 'other' },
        typography: { primaryFont: 'Unknown', style: 'sans-serif', weight: 'regular', trend: 'other' },
        layoutComposition: { style: 'single-image', textPlacement: 'center', balance: 'centered' },
        visualFilter: { aesthetic: 'natural', lighting: 'natural', processing: 'unfiltered' }
      },
      culturalVisualMoments: {
        memeElements: { present: false, type: 'none', viralPotential: 'low', lifecycle: 'emerging' },
        generationalAesthetics: { primary: 'cross-generational', indicators: [], authenticity: 'corporate' },
        culturalSymbols: { symbols: [], meaning: [], relevance: 'low', controversy: 'none' },
        viralPatterns: { elements: [], shareability: 'low', platformOptimization: [], timingRelevance: 'trending' }
      },
      competitiveVisualInsights: {
        brandStrategy: { approach: 'accessible', positioning: 'follower', consistency: 'consistent' },
        visualDifferentiation: { uniqueness: 'somewhat-unique', standoutElements: [], competitorGaps: [], opportunities: [] },
        campaignEvolution: { direction: 'static', recentChanges: [], predictedDirection: 'Maintaining current approach' }
      },
      socialMediaIntelligence: {
        platformOptimization: { bestPlatforms: [], currentPlatform: 'unknown', adaptationNeeded: [], crossPlatformPotential: 'medium' },
        engagementPrediction: { likeability: 'medium', shareability: 'medium', commentability: 'medium', factors: [] },
        trendAlignment: { currentTrends: [], alignment: 'somewhat-aligned', trendLifecycle: 'emerging' }
      },
      strategicRecommendations: ['Analysis completed with limited visual data'],
      confidenceScore: 50
    };

    // Merge with actual analysis results
    return {
      ...defaultResult,
      ...analysis,
      confidenceScore: Math.max(0, Math.min(100, analysis.confidenceScore || 50))
    };
  }
}

export const visualAnalysisService = new VisualAnalysisService();