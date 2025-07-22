// MVP SIMPLIFIED VERSION - Video transcription disabled for MVP
// Minimal service to maintain compatibility with existing routes
import { scraperService } from './scraper';
import { debugLogger } from './debug-logger';

export interface VideoTranscriptionResult {
  transcription: string;
  duration?: number;
  language?: string;
  confidence?: number;
  videoMetadata?: {
    title?: string;
    author?: string;
    description?: string;
    platform?: string;
  };
}

interface ExtractedContent {
  title: string;
  content: string;
  author?: string;
  images?: string[];
  videoTranscription?: VideoTranscriptionResult;
}

class VideoTranscriptionService {
  
  // Simplified video detection for MVP
  isVideoUrl(url: string): boolean {
    const videoPatterns = [
      /youtube\.com\/watch/,
      /youtu\.be\//,
    ];
    
    return videoPatterns.some(pattern => pattern.test(url));
  }

  // Simplified extraction with fallback to regular content
  async extractContentWithVideoDetection(url: string): Promise<ExtractedContent> {
    try {
      debugLogger.info('MVP: Using standard content extraction for video URLs', { url });
      
      // For MVP, treat video URLs as regular content pages
      const extractedContent = await scraperService.extractContent(url);
      
      return {
        title: extractedContent.title,
        content: extractedContent.content || '[Video content - transcription temporarily disabled in MVP]',
        author: extractedContent.author,
        images: extractedContent.images || [],
      };
    } catch (error) {
      debugLogger.error('Content extraction failed', { url, error: (error as Error).message });
      return {
        title: 'Video Content',
        content: '[Video content - could not extract text content]',
        author: undefined,
        images: []
      };
    }
  }
}

export const videoTranscriptionService = new VideoTranscriptionService();