import { whisperService } from './whisper';
import { scraperService } from './scraper';
import { debugLogger } from './debug-logger';
import fs from 'fs';
import path from 'path';

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

class VideoTranscriptionService {
  
  // Detect video URLs that can be transcribed
  isVideoUrl(url: string): boolean {
    const videoPatterns = [
      /youtube\.com\/watch/,
      /youtu\.be\//,
      /linkedin\.com\/.*\/video/,
      /instagram\.com\/(p|reel)\//,
      /tiktok\.com\/.*\/video/,
      /twitter\.com\/.*\/status/,
      /x\.com\/.*\/status/,
      /vimeo\.com\//
    ];
    
    return videoPatterns.some(pattern => pattern.test(url));
  }

  // Extract audio from video URL and transcribe
  async transcribeVideoFromUrl(url: string): Promise<VideoTranscriptionResult> {
    try {
      debugLogger.info('Starting video transcription', { url });
      
      // First, try to extract video metadata
      let videoMetadata = {};
      try {
        const extractedContent = await scraperService.extractContent(url);
        videoMetadata = {
          title: extractedContent.title,
          author: extractedContent.author,
          description: extractedContent.content?.slice(0, 500),
          platform: this.detectPlatform(url)
        };
      } catch (error) {
        debugLogger.warn('Could not extract video metadata', { url, error: error.message });
      }

      // Now with yt-dlp and ffmpeg installed, we can extract audio from videos
      debugLogger.info('Attempting video-to-audio extraction with yt-dlp');
      
      try {
        const audioBuffer = await this.extractAudioFromVideo(url);
        const transcription = await whisperService.transcribeAudio(
          audioBuffer,
          `video_${Date.now()}.mp3`,
          {
            language: undefined, // Auto-detect
            prompt: 'Video content transcription'
          }
        );
        
        debugLogger.info('Video transcription successful', { url, duration: transcription.duration });
        
        return {
          transcription: transcription.text,
          duration: transcription.duration,
          language: transcription.language,
          confidence: transcription.confidence,
          videoMetadata: videoMetadata as any
        };
        
      } catch (extractionError) {
        debugLogger.warn('Video extraction failed, using fallback', { url, error: extractionError.message });
        
        // Fallback response when video extraction fails
        return {
          transcription: `[Video Content Detected]\n\nVideo detected at ${url} but audio extraction failed: ${extractionError.message}\n\nThe video metadata has been extracted for analysis. For full transcription, you can:\n1. Download the video's audio manually\n2. Upload the audio file using the Audio Upload tab\n3. The system will transcribe and analyze the content`,
          duration: 0,
          language: 'en',
          confidence: 0,
          videoMetadata: videoMetadata as any
        };
      }

    } catch (error) {
      debugLogger.error('Video transcription failed', error);
      throw new Error(`Failed to transcribe video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Extract audio from video URL using yt-dlp and ffmpeg
  private async extractAudioFromVideo(url: string): Promise<Buffer> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempAudioPath = path.join(tempDir, `video_audio_${Date.now()}.mp3`);
    
    try {
      // Use yt-dlp to extract audio in mp3 format
      const command = `yt-dlp --extract-audio --audio-format mp3 --output "${tempAudioPath.replace('.mp3', '.%(ext)s')}" "${url}"`;
      
      debugLogger.info('Executing yt-dlp command', { command });
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 120000 // 2 minute timeout
      });
      
      debugLogger.info('yt-dlp extraction completed', { stdout: stdout.slice(0, 500) });
      
      // Read the extracted audio file
      if (fs.existsSync(tempAudioPath)) {
        const audioBuffer = fs.readFileSync(tempAudioPath);
        
        // Clean up temp file
        try {
          fs.unlinkSync(tempAudioPath);
        } catch (cleanupError) {
          debugLogger.warn('Failed to cleanup temp audio file', { path: tempAudioPath });
        }
        
        return audioBuffer;
      } else {
        throw new Error('Audio extraction failed - no output file created');
      }
      
    } catch (error) {
      debugLogger.error('Video audio extraction failed', { url, error });
      throw new Error(`Failed to extract audio from video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced URL content extraction that detects video content
  async extractContentWithVideoDetection(url: string): Promise<{
    content: string;
    title: string;
    author?: string;
    isVideo: boolean;
    videoTranscription?: VideoTranscriptionResult;
  }> {
    const isVideo = this.isVideoUrl(url);
    
    // Extract basic content first
    const extractedContent = await scraperService.extractContent(url);
    
    let result = {
      content: extractedContent.content,
      title: extractedContent.title,
      author: extractedContent.author,
      isVideo,
      videoTranscription: undefined as VideoTranscriptionResult | undefined
    };

    // If it's a video, attempt transcription
    if (isVideo) {
      try {
        const transcription = await this.transcribeVideoFromUrl(url);
        result.videoTranscription = transcription;
        
        // Combine extracted text content with transcription
        result.content = `${extractedContent.content}\n\n--- Video Transcription ---\n${transcription.transcription}`;
      } catch (error) {
        debugLogger.error('Video transcription failed, using text content only', error);
        // Continue with text-only content
      }
    }

    return result;
  }

  private detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('vimeo.com')) return 'Vimeo';
    return 'Unknown';
  }

  // Future implementation method for when yt-dlp/ffmpeg are available
  private async extractAudioFromVideo(url: string): Promise<Buffer> {
    // This would use yt-dlp or similar to extract audio
    // const audioPath = await ytDlp.extractAudio(url);
    // return fs.readFileSync(audioPath);
    throw new Error('Audio extraction not implemented - requires yt-dlp/ffmpeg setup');
  }
}

export const videoTranscriptionService = new VideoTranscriptionService();
export default videoTranscriptionService;