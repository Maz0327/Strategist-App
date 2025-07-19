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
      /youtube\.com\/shorts/,  // Added YouTube Shorts support
      /youtu\.be\//,
      /linkedin\.com\/.*\/video/,
      /linkedin\.com\/posts\/.*activity/, // Added LinkedIn post support (may contain video)
      /instagram\.com\/(p|reel)\//,
      /tiktok\.com\/.*\/video/,
      /twitter\.com\/.*\/status/,
      /x\.com\/.*\/status/,
      /vimeo\.com\//
    ];
    
    const isVideo = videoPatterns.some(pattern => pattern.test(url));
    debugLogger.info('Video URL detection', { url, isVideo, patterns: videoPatterns.map(p => p.toString()) });
    
    return isVideo;
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
        // Create temp directory
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempAudioPath = path.join(tempDir, `video_audio_${Date.now()}.mp3`);
        
        // Use yt-dlp to extract audio in mp3 format with better error handling and user agent
        const outputTemplate = tempAudioPath.replace('.mp3', '.%(ext)s');
        const command = `yt-dlp --extract-audio --audio-format mp3 --no-playlist --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --output "${outputTemplate}" "${url}"`;
        
        debugLogger.info('Executing yt-dlp command', { command, outputTemplate });
        
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        const { stdout, stderr } = await execAsync(command, {
          timeout: 180000 // 3 minute timeout for longer videos
        });
        
        debugLogger.info('yt-dlp extraction completed', { stdout: stdout.slice(0, 500) });
        
        // Read the extracted audio file
        let audioBuffer: Buffer;
        if (fs.existsSync(tempAudioPath)) {
          audioBuffer = fs.readFileSync(tempAudioPath);
          
          // Clean up temp file
          try {
            fs.unlinkSync(tempAudioPath);
          } catch (cleanupError) {
            debugLogger.warn('Failed to cleanup temp audio file', { path: tempAudioPath });
          }
        } else {
          throw new Error('Audio extraction failed - no output file created');
        }
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
        
        // Enhanced fallback response with better guidance
        const errorMessage = extractionError.message;
        let specificGuidance = "";
        
        if (errorMessage.includes("Sign in to confirm")) {
          specificGuidance = "\n\nThis video requires authentication due to YouTube's bot protection. ";
        } else if (errorMessage.includes("Private video") || errorMessage.includes("not available")) {
          specificGuidance = "\n\nThis video may be private or restricted. ";
        }
        
        return {
          transcription: `[Video Content Detected but Audio Extraction Limited]

Video URL: ${url}
Platform: ${this.detectPlatform(url)}
Status: Audio extraction blocked (${errorMessage})${specificGuidance}

ALTERNATIVE METHODS:
1. Manual Download: Use a browser extension or online tool to download the audio
2. Audio Upload: Upload the audio file using the "Audio Upload" tab above
3. Public Video: Try with a different, publicly accessible video URL

The system detected this as a video and attempted automatic transcription, but encountered platform restrictions.`,
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
      // Use yt-dlp to extract audio in mp3 format with better error handling and user agent
      const outputTemplate = tempAudioPath.replace('.mp3', '.%(ext)s');
      const command = `yt-dlp --extract-audio --audio-format mp3 --no-playlist --ignore-errors --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" --output "${outputTemplate}" "${url}"`;
      
      debugLogger.info('Executing yt-dlp command', { command, outputTemplate });
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 180000 // 3 minute timeout for longer videos
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
        
        // If transcription was successful, combine it with the text content
        if (transcription.transcription && !transcription.transcription.includes("[Video Content Detected but Audio Extraction Limited]")) {
          result.content = `${transcription.transcription}\n\n--- Original Page Content ---\n${result.content}`;
          result.title = `[VIDEO] ${result.title}`;
        }
      } catch (error) {
        debugLogger.warn('Video transcription failed for detected video URL', { url, error });
        // Don't throw error, just proceed without video transcription
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


}

export const videoTranscriptionService = new VideoTranscriptionService();
export default videoTranscriptionService;