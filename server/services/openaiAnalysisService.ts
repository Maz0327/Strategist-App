import { openaiService } from './openai';
import type { EnhancedAnalysisResult } from './openai';

export async function analyzeWithOpenAI(
  content: string, 
  lengthPreference: 'short' | 'medium' | 'long' | 'bulletpoints' = 'medium',
  analysisMode: 'quick' | 'deep' = 'quick'
): Promise<EnhancedAnalysisResult> {
  return await openaiService.analyzeContent(
    { content, title: '', url: '' },
    lengthPreference,
    analysisMode
  );
}

export { openaiService } from './openai';