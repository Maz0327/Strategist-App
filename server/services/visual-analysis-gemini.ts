import { GoogleGenAI } from "@google/genai";
import { debugLogger } from "./debug-logger";
import type { VisualAsset } from "./scraper";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface VisualAnalysisResult {
  brandElements: string;
  culturalVisualMoments: string;
  competitiveVisualInsights: string;
  strategicRecommendations: string[];
  confidenceScore: number;
}

export class GeminiVisualAnalysisService {
  async analyzeVisualAssets(
    visualAssets: VisualAsset[],
    contentContext: string,
    url?: string
  ): Promise<VisualAnalysisResult> {
    if (!visualAssets || visualAssets.length === 0) {
      throw new Error('No visual assets provided for analysis');
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Filter only valid HTTP image URLs
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
        .slice(0, 3); // Limit to 3 images for efficiency

      debugLogger.info('Gemini visual analysis asset filtering', {
        totalAssets: visualAssets.length,
        validImages: imagesToAnalyze.length,
        imageUrls: imagesToAnalyze.map(a => a.url)
      });

      if (imagesToAnalyze.length === 0) {
        throw new Error('No valid HTTP image URLs found for visual analysis');
      }

      const analysisPrompt = this.buildAnalysisPrompt(contentContext, url);

      // Download and convert images to base64 for Gemini
      const imageData = await Promise.all(
        imagesToAnalyze.map(async (asset) => {
          try {
            const response = await fetch(asset.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const buffer = await response.arrayBuffer();
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            return {
              inlineData: {
                data: Buffer.from(buffer).toString("base64"),
                mimeType: contentType,
              },
            };
          } catch (error) {
            debugLogger.warn('Failed to fetch image for Gemini analysis', { url: asset.url, error });
            return null;
          }
        })
      );

      const validImages = imageData.filter(img => img !== null);
      
      if (validImages.length === 0) {
        throw new Error('Could not fetch any images for analysis');
      }

      // Process images through Gemini
      const geminiResponse = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: [
            ...validImages,
            analysisPrompt
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                brandElements: { type: "string" },
                culturalVisualMoments: { type: "string" },
                competitiveVisualInsights: { type: "string" },
                strategicRecommendations: { 
                  type: "array",
                  items: { type: "string" }
                },
                confidenceScore: { type: "number" }
              },
              required: ["brandElements", "culturalVisualMoments", "competitiveVisualInsights", "strategicRecommendations", "confidenceScore"]
            }
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini visual analysis timeout')), 20000)
        )
      ]);

      const analysis = JSON.parse((geminiResponse as any).text || '{}');
      
      return this.processAnalysisResult(analysis);

    } catch (error: any) {
      debugLogger.error('Gemini visual analysis failed:', error);
      throw new Error(`Visual analysis failed: ${error?.message || 'Unknown error'}`);
    }
  }

  private buildAnalysisPrompt(contentContext: string, url?: string): string {
    return `You are a visual intelligence expert specializing in brand strategy, cultural analysis, and competitive intelligence. Analyze the provided images and provide comprehensive visual intelligence insights.

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
   - Generational aesthetics and authenticity markers
   - Cultural symbols and their meanings
   - Visual storytelling techniques

3. **Competitive Visual Intelligence:**
   - Industry visual benchmarks and positioning
   - Differentiation opportunities in visual strategy
   - Emerging visual trends in competitive landscape
   - Brand visual evolution opportunities

4. **Strategic Recommendations:**
   - Actionable visual strategy recommendations
   - Cultural moment activation opportunities
   - Brand differentiation through visual elements
   - Visual content optimization suggestions

Provide detailed strategic analysis with actionable insights. Return JSON with the specified fields.`;
  }

  private processAnalysisResult(analysis: any): VisualAnalysisResult {
    return {
      brandElements: analysis.brandElements || "No brand elements detected in the visual content.",
      culturalVisualMoments: analysis.culturalVisualMoments || "No significant cultural moments identified in the visuals.",
      competitiveVisualInsights: analysis.competitiveVisualInsights || "No competitive insights derived from visual analysis.",
      strategicRecommendations: Array.isArray(analysis.strategicRecommendations) 
        ? analysis.strategicRecommendations.slice(0, 5)
        : ["Continue monitoring visual trends for strategic opportunities"],
      confidenceScore: typeof analysis.confidenceScore === 'number' 
        ? Math.min(100, Math.max(0, analysis.confidenceScore))
        : 75
    };
  }
}

export const geminiVisualAnalysisService = new GeminiVisualAnalysisService();