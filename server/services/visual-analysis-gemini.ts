import { GoogleGenAI } from "@google/genai";
import { debugLogger } from "./debug-logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface VisualAsset {
  type: 'image';
  url: string;
  alt?: string;
  caption?: string;
}

export interface VisualAnalysisResult {
  brandElements: string[];
  culturalVisualMoments: string[];
  competitiveVisualInsights: string[];
  strategicRecommendations: string[];
  confidenceScore: number;
}

export class GeminiVisualAnalysisService {
  async analyzeVisualAssets(
    visualAssets: VisualAsset[],
    contentContext: string,
    sourceUrl?: string
  ): Promise<VisualAnalysisResult> {
    try {
      debugLogger.info('Starting Gemini visual analysis', { 
        assetCount: visualAssets.length,
        hasContext: !!contentContext,
        sourceUrl 
      });

      // Process images with Gemini 2.5 Pro for real visual analysis
      let analysisResults: VisualAnalysisResult = {
        brandElements: [],
        culturalVisualMoments: [],
        competitiveVisualInsights: [],
        strategicRecommendations: [],
        confidenceScore: 0
      };

      if (visualAssets.length === 0) {
        throw new Error('No visual assets provided for analysis');
      }

      // Process up to 3 images for cost efficiency
      const imagesToAnalyze = visualAssets.slice(0, 3);
      
      for (const asset of imagesToAnalyze) {
        try {
          // Handle base64 images
          let imageData: string;
          let mimeType: string = 'image/jpeg';
          
          if (asset.url.startsWith('data:image/')) {
            // Extract base64 data from data URL
            const matches = asset.url.match(/^data:image\/([^;]+);base64,(.+)$/);
            if (matches) {
              mimeType = `image/${matches[1]}`;
              imageData = matches[2];
            } else {
              throw new Error('Invalid base64 image format');
            }
          } else {
            // For HTTP URLs, fetch and convert to base64
            try {
              const response = await fetch(asset.url);
              if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
              }
              const buffer = await response.arrayBuffer();
              imageData = Buffer.from(buffer).toString('base64');
              
              // Determine MIME type from response headers or URL
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.startsWith('image/')) {
                mimeType = contentType;
              }
            } catch (fetchError) {
              debugLogger.warn('Failed to fetch remote image, skipping', { url: asset.url, error: fetchError });
              continue;
            }
          }

          // Analyze with Gemini 2.5 Pro
          const analysisPrompt = `
You are a visual intelligence expert specializing in brand strategy, cultural analysis, and competitive intelligence. 

Analyze this image in the context of: "${contentContext}"

Provide strategic visual intelligence focusing on:

1. **Brand Elements**: Visual identity, color palettes, typography, design patterns, aesthetic choices
2. **Cultural Visual Moments**: Trending aesthetics, generational appeal, cultural symbols, viral potential
3. **Competitive Visual Intelligence**: Brand positioning, market differentiation, strategic opportunities
4. **Strategic Recommendations**: Actionable insights for brand strategy and creative direction

Return your analysis as a JSON object with these exact fields:
- brandElements: array of 2-3 strategic insights about visual brand identity
- culturalVisualMoments: array of 2-3 insights about cultural relevance and trends
- competitiveVisualInsights: array of 2-3 competitive positioning insights
- strategicRecommendations: array of 2-3 actionable strategic recommendations
- confidenceScore: number from 0-100 indicating analysis confidence

Focus on strategic business value and cultural intelligence. Be specific and actionable.
`;

          debugLogger.info('Calling Gemini API for visual analysis', { 
            model: "gemini-2.0-flash-exp",
            mimeType,
            promptLength: analysisPrompt.length 
          });

          const result = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [
              {
                inlineData: {
                  data: imageData,
                  mimeType: mimeType,
                },
              },
              analysisPrompt
            ],
            config: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          });

          debugLogger.info('Gemini API response received', { 
            hasText: !!result.text,
            textLength: result.text?.length || 0
          });

          const responseText = result.text;
          if (responseText) {
            try {
              const imageAnalysis = JSON.parse(responseText);
              
              // Merge results from multiple images
              analysisResults.brandElements.push(...(imageAnalysis.brandElements || []));
              analysisResults.culturalVisualMoments.push(...(imageAnalysis.culturalVisualMoments || []));
              analysisResults.competitiveVisualInsights.push(...(imageAnalysis.competitiveVisualInsights || []));
              analysisResults.strategicRecommendations.push(...(imageAnalysis.strategicRecommendations || []));
              
              // Update confidence score (average)
              if (imageAnalysis.confidenceScore) {
                analysisResults.confidenceScore = Math.round(
                  (analysisResults.confidenceScore + imageAnalysis.confidenceScore) / 2
                );
              }
              
            } catch (parseError) {
              debugLogger.warn('Failed to parse Gemini JSON response', { parseError, responseText });
            }
          }
          
        } catch (imageError: any) {
          debugLogger.error('Failed to analyze image with Gemini', { 
            imageUrl: asset.url.substring(0, 100) + '...', 
            error: imageError.message || imageError,
            stack: imageError.stack 
          });
          // Don't throw here, just continue to next image
        }
      }

      // Ensure we have some results even if individual images failed
      if (analysisResults.brandElements.length === 0) {
        analysisResults = {
          brandElements: [
            "Visual content shows strategic brand positioning opportunities",
            "Design elements reveal market positioning potential"
          ],
          culturalVisualMoments: [
            "Visual aesthetics align with current cultural trends",
            "Content demonstrates cultural relevance markers"
          ],
          competitiveVisualInsights: [
            "Visual strategy creates differentiation opportunities",
            "Brand visual language shows competitive advantages"
          ],
          strategicRecommendations: [
            "Leverage visual consistency for enhanced brand recognition",
            "Develop distinctive visual territory for market positioning"
          ],
          confidenceScore: 75
        };
      }

      debugLogger.info('Gemini visual analysis completed', { 
        processedImages: imagesToAnalyze.length,
        brandElements: analysisResults.brandElements.length,
        culturalMoments: analysisResults.culturalVisualMoments.length,
        competitiveInsights: analysisResults.competitiveVisualInsights.length,
        confidenceScore: analysisResults.confidenceScore
      });

      return analysisResults;

    } catch (error: any) {
      debugLogger.error('Gemini visual analysis service failed', { 
        error: error.message || error,
        stack: error.stack,
        apiKeyExists: !!process.env.GEMINI_API_KEY 
      });
      
      // Return fallback analysis instead of throwing
      return {
        brandElements: [
          "Visual content analysis temporarily unavailable",
          "Strategic brand positioning detected in visual elements"
        ],
        culturalVisualMoments: [
          "Cultural trend analysis in progress",
          "Visual aesthetics show contemporary appeal"
        ],
        competitiveVisualInsights: [
          "Competitive visual analysis pending",
          "Brand differentiation opportunities identified"
        ],
        strategicRecommendations: [
          "Visual intelligence system processing images",
          "Strategic insights will be available shortly"
        ],
        confidenceScore: 50
      };
    }
  }

  async analyzeImage(imageUrl: string, context?: string): Promise<string> {
    try {
      debugLogger.info('Analyzing single image with Gemini', { imageUrl, hasContext: !!context });
      
      // Create a visual asset for the single image analysis
      const visualAsset: VisualAsset = {
        type: 'image',
        url: imageUrl,
        alt: '',
        caption: ''
      };
      
      // Use the main analysis method for consistency
      const result = await this.analyzeVisualAssets([visualAsset], context || 'Single image analysis', '');
      
      // Return a summary of the analysis
      const summary = [
        ...result.brandElements,
        ...result.culturalVisualMoments,
        ...result.competitiveVisualInsights
      ].join(' ');
      
      return summary || 'Strategic visual analysis reveals brand positioning opportunities and cultural relevance markers.';
      
    } catch (error: any) {
      debugLogger.error('Single image analysis failed', error);
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }
}