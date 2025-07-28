import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface OCRResult {
  extractedText: string;
  isTextHeavy: boolean;
  isCommentScreenshot: boolean;
  contentType: 'comment' | 'article' | 'social-media' | 'interface' | 'text-heavy' | 'image-only';
  summary: string;
  confidence: number;
}

export async function analyzeScreenshotWithGemini(imagePath: string): Promise<OCRResult> {
  try {
    const imageBytes = fs.readFileSync(imagePath);

    const systemPrompt = `You are an expert at analyzing screenshots and extracting text. 
Analyze this screenshot and provide:
1. ALL visible text (OCR extraction)
2. Whether it's text-heavy (>50% of image contains readable text)
3. Whether it's a comment/discussion screenshot
4. Content type classification
5. Brief summary of the content
6. Confidence level (0-1)

Respond with JSON in this exact format:
{
  "extractedText": "all visible text here",
  "isTextHeavy": boolean,
  "isCommentScreenshot": boolean,
  "contentType": "comment|article|social-media|interface|text-heavy|image-only",
  "summary": "brief content summary",
  "confidence": 0.95
}`;

    const contents = [
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      systemPrompt
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            extractedText: { type: "string" },
            isTextHeavy: { type: "boolean" },
            isCommentScreenshot: { type: "boolean" },
            contentType: { 
              type: "string",
              enum: ["comment", "article", "social-media", "interface", "text-heavy", "image-only"]
            },
            summary: { type: "string" },
            confidence: { type: "number" }
          },
          required: ["extractedText", "isTextHeavy", "isCommentScreenshot", "contentType", "summary", "confidence"]
        }
      },
      contents: contents,
    });

    const rawJson = response.text;
    console.log('🔍 Gemini OCR Response:', rawJson);

    if (rawJson) {
      const result: OCRResult = JSON.parse(rawJson);
      return result;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('❌ Gemini OCR Error:', error);
    // Fallback result
    return {
      extractedText: "Unable to extract text",
      isTextHeavy: false,
      isCommentScreenshot: false,
      contentType: 'image-only',
      summary: "Screenshot analysis failed",
      confidence: 0.0
    };
  }
}

export async function analyzeMultipleScreenshots(imagePaths: string[]): Promise<OCRResult[]> {
  const results = [];
  
  for (const imagePath of imagePaths) {
    console.log(`📸 Processing screenshot: ${imagePath}`);
    const result = await analyzeScreenshotWithGemini(imagePath);
    results.push(result);
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}