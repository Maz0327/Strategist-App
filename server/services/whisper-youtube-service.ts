/**
 * Whisper-based YouTube Transcription Service
 * Uses yt-dlp + Whisper for reliable video transcription
 */

import { spawn } from 'child_process';
import { debugLogger } from './debug-logger';
import { join } from 'path';

interface WhisperTranscriptResult {
  transcript: string | null;
  duration?: number;
  language?: string;
  error?: string;
  method: string;
}

export class WhisperYouTubeService {
  
  // Main transcription method using Whisper
  async transcribeYouTubeVideo(url: string): Promise<WhisperTranscriptResult> {
    debugLogger.info('Starting Whisper YouTube transcription', { url });

    try {
      // First try fast transcript API
      const quickResult = await this.tryQuickTranscript(url);
      if (quickResult.transcript) {
        return quickResult;
      }

      // If transcript API fails, use Whisper audio transcription
      debugLogger.info('Transcript API failed, using Whisper audio transcription', { url });
      return await this.transcribeWithWhisper(url);

    } catch (error) {
      debugLogger.error('All transcription methods failed', { url, error: (error as Error).message });
      return {
        transcript: null,
        error: (error as Error).message,
        method: 'failed'
      };
    }
  }

  // Quick transcript API attempt (2 seconds max)
  private async tryQuickTranscript(url: string): Promise<WhisperTranscriptResult> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [
        join(process.cwd(), 'server/python/youtube_transcript_service.py'),
        url
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.transcript) {
              resolve({
                transcript: result.transcript,
                duration: result.duration,
                language: result.language,
                method: 'transcript_api'
              });
            } else {
              resolve({
                transcript: null,
                error: result.error || 'No transcript available',
                method: 'transcript_api_failed'
              });
            }
          } catch (parseError) {
            resolve({
              transcript: null,
              error: 'Failed to parse transcript result',
              method: 'transcript_api_failed'
            });
          }
        } else {
          resolve({
            transcript: null,
            error: 'Transcript API failed',
            method: 'transcript_api_failed'
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          transcript: null,
          error: error.message,
          method: 'transcript_api_failed'
        });
      });

      // Quick 2-second timeout for transcript API
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          transcript: null,
          error: 'Transcript API timeout',
          method: 'transcript_api_timeout'
        });
      }, 2000);
    });
  }

  // Whisper audio transcription method
  private async transcribeWithWhisper(url: string): Promise<WhisperTranscriptResult> {
    return new Promise((resolve) => {
      debugLogger.info('Executing Whisper transcription', { url });

      // Enhanced Python command for Whisper transcription
      const command = this.buildWhisperCommand(url);
      
      const pythonProcess = spawn('python3', ['-c', command], {
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            if (result.transcript) {
              debugLogger.info('Whisper transcription successful', { 
                url, 
                duration: result.duration,
                method: 'whisper_audio'
              });
              
              resolve({
                transcript: result.transcript,
                duration: result.duration,
                language: result.language || 'en',
                method: 'whisper_audio'
              });
            } else {
              resolve({
                transcript: null,
                error: result.error || 'Whisper transcription failed',
                method: 'whisper_failed'
              });
            }
          } catch (parseError) {
            resolve({
              transcript: null,
              error: 'Failed to parse Whisper result',
              method: 'whisper_parse_failed'
            });
          }
        } else {
          resolve({
            transcript: null,
            error: `Whisper process failed: ${stderr}`,
            method: 'whisper_process_failed'
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          transcript: null,
          error: `Whisper error: ${error.message}`,
          method: 'whisper_error'
        });
      });

      // 15-second timeout for Whisper transcription
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          transcript: null,
          error: 'Whisper timeout - video too long or processing failed',
          method: 'whisper_timeout'
        });
      }, 15000);
    });
  }

  private buildWhisperCommand(url: string): string {
    return `
import sys
import json
import subprocess
import tempfile
import os
import whisper

def transcribe_youtube_with_whisper(url):
    try:
        # Step 1: Download audio using yt-dlp
        with tempfile.TemporaryDirectory() as temp_dir:
            audio_file = os.path.join(temp_dir, 'audio.wav')
            
            # Use yt-dlp to extract audio
            cmd = [
                'yt-dlp',
                '--extract-audio',
                '--audio-format', 'wav',
                '--audio-quality', '0',
                '--output', audio_file,
                '--no-playlist',
                url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode != 0:
                return {'error': f'Audio extraction failed: {result.stderr}', 'transcript': None}
            
            # Step 2: Use Whisper to transcribe
            if os.path.exists(audio_file):
                model = whisper.load_model("base")
                transcription_result = model.transcribe(audio_file)
                
                return {
                    'transcript': transcription_result['text'].strip(),
                    'language': transcription_result.get('language', 'en'),
                    'duration': transcription_result.get('duration', 0),
                    'error': None
                }
            else:
                return {'error': 'Audio file not found after extraction', 'transcript': None}
                
    except subprocess.TimeoutExpired:
        return {'error': 'Audio extraction timeout', 'transcript': None}
    except Exception as e:
        return {'error': f'Whisper transcription error: {str(e)}', 'transcript': None}

# Execute transcription
result = transcribe_youtube_with_whisper('${url}')
print(json.dumps(result))
`;
  }

  // Extract video ID from YouTube URL
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Check if URL is YouTube
  isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }
}

export const whisperYouTubeService = new WhisperYouTubeService();