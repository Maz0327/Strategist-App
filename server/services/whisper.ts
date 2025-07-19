import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { apiCache } from './cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = apiCache;

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
  confidence?: number;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

class WhisperService {
  private async generateCacheKey(audioBuffer: Buffer, options: TranscriptionOptions = {}): Promise<string> {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(audioBuffer);
    hash.update(JSON.stringify(options));
    return `whisper:${hash.digest('hex')}`;
  }

  async transcribeAudio(
    audioFile: Buffer | string,
    filename: string,
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      const startTime = Date.now();
      
      // Handle both file path and buffer
      const audioBuffer = typeof audioFile === 'string' 
        ? fs.readFileSync(audioFile)
        : audioFile;

      // Check cache first
      const cacheKey = await this.generateCacheKey(audioBuffer, options);
      const cached = await cache.get(cacheKey);
      if (cached) {
        console.log(`[Whisper] Cache hit for ${filename}`);
        return cached as TranscriptionResult;
      }

      // Create temporary file for OpenAI API
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${filename}`);
      fs.writeFileSync(tempFilePath, audioBuffer);

      try {
        // Transcribe using OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath) as any,
          model: "whisper-1",
          language: options.language,
          prompt: options.prompt,
          temperature: options.temperature || 0,
          response_format: options.response_format || 'verbose_json'
        });

        const result: TranscriptionResult = {
          text: typeof transcription === 'string' ? transcription : transcription.text,
          duration: typeof transcription === 'object' && 'duration' in transcription 
            ? transcription.duration 
            : undefined,
          language: typeof transcription === 'object' && 'language' in transcription 
            ? transcription.language 
            : undefined
        };

        // Cache the result (5 minute TTL)
        await cache.set(cacheKey, result, 300);

        const duration = Date.now() - startTime;
        console.log(`[Whisper] Transcription completed in ${duration}ms for ${filename}`);

        return result;
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('[Whisper] Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeFromUrl(audioUrl: string, options: TranscriptionOptions = {}): Promise<TranscriptionResult> {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      const filename = path.basename(new URL(audioUrl).pathname) || 'audio.mp3';

      return await this.transcribeAudio(audioBuffer, filename, options);
    } catch (error) {
      console.error('[Whisper] URL transcription error:', error);
      throw new Error(`Failed to transcribe audio from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Supported audio formats
  isSupportedFormat(filename: string): boolean {
    const supportedExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    const ext = path.extname(filename).toLowerCase();
    return supportedExtensions.includes(ext);
  }

  // Calculate estimated cost (Whisper API is $0.006 per minute)
  calculateEstimatedCost(durationSeconds: number): number {
    const minutes = Math.ceil(durationSeconds / 60);
    return minutes * 0.006;
  }
}

export const whisperService = new WhisperService();
export default whisperService;