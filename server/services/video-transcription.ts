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
      // YouTube patterns
      /youtube\.com\/watch/,
      /youtube\.com\/shorts/,
      /youtu\.be\//,
      
      // LinkedIn video patterns - Enhanced detection
      /linkedin\.com\/.*\/video/,
      /linkedin\.com\/posts\/.*activity/,
      /linkedin\.com\/feed\/update\/urn:li:activity/,
      /linkedin\.com\/embed\/feed\/update\/urn:li:ugcPost/,
      
      // Instagram video patterns - Enhanced detection  
      /instagram\.com\/(p|reel|tv)\//,
      /instagram\.com\/stories\//,
      /instagr\.am\/(p|reel|tv)\//,
      
      // TikTok video patterns - Enhanced detection
      /tiktok\.com\/.*\/video/,
      /tiktok\.com\/@.*\/video/,
      /vm\.tiktok\.com\//,
      /tiktok\.com\/t\//,
      /m\.tiktok\.com\//,
      
      // Twitter/X video patterns
      /twitter\.com\/.*\/status/,
      /x\.com\/.*\/status/,
      /t\.co\//,
      
      // Other video platforms
      /vimeo\.com\//,
      /dailymotion\.com\//,
      /twitch\.tv\//
    ];
    
    const isVideo = videoPatterns.some(pattern => pattern.test(url));
    debugLogger.info('Enhanced video URL detection', { 
      url, 
      isVideo, 
      platform: this.detectPlatform(url),
      matchedPattern: videoPatterns.find(pattern => pattern.test(url))?.toString()
    });
    
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

      // STRATEGY 1: Try Enhanced Video Processor (combines transcript + audio extraction)
      try {
        const enhancedResult = await this.processVideoWithEnhancedMethod(url);
        if (enhancedResult.transcript) {
          debugLogger.info('Enhanced video processing successful', { url, method: enhancedResult.method });
          return {
            transcription: enhancedResult.transcript,
            duration: enhancedResult.duration || 0,
            language: enhancedResult.language || 'en',
            confidence: enhancedResult.method?.includes('transcript') ? 0.95 : 0.85,
            videoMetadata: videoMetadata as any
          };
        } else if (enhancedResult.audio_extracted) {
          // If audio was extracted successfully, transcribe it with Whisper
          debugLogger.info('Audio extracted, transcribing with Whisper', { url, audioPath: enhancedResult.audio_path });
          
          try {
            const audioBuffer = fs.readFileSync(enhancedResult.audio_path);
            const transcription = await whisperService.transcribeAudio(
              audioBuffer,
              `video_${Date.now()}.mp3`,
              {
                language: undefined, // Auto-detect
                prompt: 'Video content transcription'
              }
            );
            
            // Clean up temp file
            try {
              fs.unlinkSync(enhancedResult.audio_path);
            } catch (cleanupError) {
              debugLogger.warn('Failed to cleanup temp audio file', { path: enhancedResult.audio_path });
            }
            
            return {
              transcription: transcription.text,
              duration: transcription.duration,
              language: transcription.language,
              confidence: transcription.confidence,
              videoMetadata: videoMetadata as any
            };
          } catch (whisperError) {
            debugLogger.error('Whisper transcription failed', { error: whisperError.message });
          }
        }
      } catch (error) {
        debugLogger.warn('Enhanced video processing failed, trying fallback methods', { url, error: error.message });
      }

      // STRATEGY 2: Try Bright Data Browser API for advanced bypass
      debugLogger.info('Attempting video extraction with Bright Data Browser API');
      
      try {
        // Create temp directory
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempAudioPath = path.join(tempDir, `video_audio_${Date.now()}.mp3`);
        
        // Use Bright Data Browser API for advanced bot detection bypass
        const outputTemplate = tempAudioPath.replace('.mp3', '.%(ext)s');
        
        const { browserAPIService } = await import('./browser-api-service');
        const result = await browserAPIService.extractVideoWithBrowserAPI(url, outputTemplate);
        
        if (result.success) {
          debugLogger.info('Video extraction successful with Browser API', { 
            outputFile: outputTemplate,
            browserAPI: 'Bright Data'
          });
          
          // Find the extracted audio file
          const extractedFiles = fs.readdirSync(tempDir).filter(file => 
            file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav')
          );
          
          if (extractedFiles.length > 0) {
            const audioFilePath = path.join(tempDir, extractedFiles[0]);
            const audioBuffer = fs.readFileSync(audioFilePath);
            
            // Transcribe with Whisper
            const transcription = await whisperService.transcribeAudio(
              audioBuffer,
              `video_${Date.now()}.mp3`,
              {
                language: undefined, // Auto-detect
                prompt: 'Video content transcription'
              }
            );
            
            // Clean up temp file
            try {
              fs.unlinkSync(audioFilePath);
            } catch (cleanupError) {
              debugLogger.warn('Failed to cleanup temp audio file', { path: audioFilePath });
            }
            
            debugLogger.info('Video transcription successful with Browser API', { 
              url, 
              duration: transcription.duration,
              method: 'Bright Data Browser API'
            });
            
            return {
              transcription: transcription.text,
              duration: transcription.duration,
              language: transcription.language,
              confidence: transcription.confidence,
              videoMetadata: videoMetadata as any
            };
          } else {
            throw new Error('No audio file extracted despite successful yt-dlp execution');
          }
        } else {
          // Fallback to proxy rotation if Browser API fails
          debugLogger.warn('Browser API failed, falling back to proxy rotation', { error: result.error });
          
          const { executeYtDlpWithRotation } = await import('./proxy-rotation-service');
          const fallbackResult = await executeYtDlpWithRotation(url, outputTemplate, 2);
          
          if (fallbackResult.success) {
            debugLogger.info('Fallback proxy rotation successful');
            // Process fallback result same as Browser API success
            const extractedFiles = fs.readdirSync(tempDir).filter(file => 
              file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav')
            );
            
            if (extractedFiles.length > 0) {
              const audioFilePath = path.join(tempDir, extractedFiles[0]);
              const audioBuffer = fs.readFileSync(audioFilePath);
              
              const transcription = await whisperService.transcribeAudio(
                audioBuffer,
                `video_${Date.now()}.mp3`,
                { language: undefined, prompt: 'Video content transcription' }
              );
              
              try { fs.unlinkSync(audioFilePath); } catch {}
              
              return {
                transcription: transcription.text,
                duration: transcription.duration,
                language: transcription.language,
                confidence: transcription.confidence,
                videoMetadata: videoMetadata as any
              };
            }
          }
          
          throw new Error(`Both Browser API and proxy rotation failed: ${result.error}`);
        }
        
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
        timeout: 10000 // Reduced to 10 seconds for much faster performance
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

    // If it's a video, attempt transcription with aggressive timeout
    if (isVideo) {
      try {
        // Set very aggressive timeout of 8 seconds for video transcription to prioritize speed
        const transcriptionPromise = this.transcribeVideoFromUrl(url);
        const transcription = await Promise.race([
          transcriptionPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Video transcription timeout - prioritizing fast content extraction')), 8000)
          )
        ]) as VideoTranscriptionResult;
        
        result.videoTranscription = transcription;
        
        // If transcription was successful, combine it with the text content
        if (transcription.transcription && !transcription.transcription.includes("[Video Content Detected but Audio Extraction Limited]")) {
          result.content = `${transcription.transcription}\n\n--- Original Page Content ---\n${result.content}`;
          result.title = `[VIDEO] ${result.title}`;
        }
        debugLogger.info('Video transcription completed within timeout', { url, duration: 'under 8s' });
      } catch (error) {
        debugLogger.info('Video transcription skipped due to timeout - prioritizing user experience', { url, error: error.message });
        
        // Add platform-specific video handling with faster fallback
        if (url.includes('linkedin.com')) {
          result.title = `[LINKEDIN VIDEO] ${result.title}`;
          result.content = `[Video Content Detected - Fast Extraction Mode]\n\nLinkedIn video detected. Transcription skipped to prioritize speed.\n\n--- Post Content ---\n${result.content}`;
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
          result.title = `[YOUTUBE VIDEO] ${result.title}`;
          result.content = `[Video Content Detected - Fast Extraction Mode]\n\nYouTube video detected. Transcription skipped to prioritize speed.\n\n--- Page Content ---\n${result.content}`;
        } else {
          result.title = `[VIDEO] ${result.title}`;
          result.content = `[Video Content Detected - Fast Extraction Mode]\n\nVideo detected. Transcription skipped to prioritize speed.\n\n--- Page Content ---\n${result.content}`;
        }
        
        // Don't throw error, just proceed without video transcription for better UX
      }
    }

    return result;
  }

  // Enhanced video processing with multiple automated methods
  private async processVideoWithEnhancedMethod(url: string): Promise<any> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const pythonScript = path.join(process.cwd(), 'server/python/enhanced_video_processor.py');
      const command = `python3 "${pythonScript}" "${url}"`;
      
      debugLogger.info('Executing enhanced video processing', { command });
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 15000 // Reduced to 15 seconds for faster performance
      });
      
      if (stderr) {
        debugLogger.info('Enhanced video processing info', { stderr });
      }
      
      const result = JSON.parse(stdout);
      
      if (result.error && !result.audio_extracted) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      debugLogger.error('Enhanced video processing failed', { url, error });
      throw error;
    }
  }

  // Build enhanced yt-dlp command with IP rotation and bypass methods
  private async buildEnhancedYtDlpCommand(url: string, outputTemplate: string): Promise<string> {
    const { proxyManager } = await import('./proxy-manager');
    
    const baseOptions = [
      '--extract-audio',
      '--audio-format mp3',
      '--no-playlist',
      '--ignore-errors',
      '--no-check-certificate',
      '--sleep-interval 2',
      '--max-sleep-interval 4',
      '--retries 2'
    ];

    // Add proxy for IP rotation
    const proxy = await proxyManager.getActiveProxy();
    if (proxy) {
      const proxyString = proxyManager.getProxyString();
      if (proxyString) {
        baseOptions.push(`--proxy "${proxyString}"`);
        debugLogger.info('Using proxy for video extraction', { proxy: `${proxy.host}:${proxy.port}` });
      }
    }

    // Enhanced user agent rotation
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    ];
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    baseOptions.push(`--user-agent "${randomUserAgent}"`);

    // Platform-specific optimizations
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const clients = ['android', 'ios', 'web'];
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      baseOptions.push(`--extractor-args "youtube:player_client=${randomClient}"`);
    } else if (url.includes('linkedin.com')) {
      // LinkedIn-specific options for better video extraction
      baseOptions.push('--add-header "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"');
      baseOptions.push('--add-header "Accept-Language: en-US,en;q=0.5"');
      baseOptions.push('--add-header "DNT: 1"');
      baseOptions.push('--extractor-args "linkedin:bypass_consent=true"');
    } else if (url.includes('tiktok.com')) {
      // TikTok-specific optimizations
      baseOptions.push('--add-header "Accept: */*"');
      baseOptions.push('--add-header "Referer: https://www.tiktok.com/"');
    } else if (url.includes('instagram.com')) {
      // Instagram-specific optimizations
      baseOptions.push('--add-header "Accept: */*"');
      baseOptions.push('--add-header "Referer: https://www.instagram.com/"');
    }

    return `yt-dlp ${baseOptions.join(' ')} --output "${outputTemplate}" "${url}"`;
  }

  private detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'Instagram';
    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'TikTok';
    if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co')) return 'Twitter/X';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.includes('dailymotion.com')) return 'Dailymotion';
    if (url.includes('twitch.tv')) return 'Twitch';
    return 'Unknown';
  }


}

export const videoTranscriptionService = new VideoTranscriptionService();
export default videoTranscriptionService;