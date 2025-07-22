/**
 * YouTube Transcript Service with Bright Data Browser API Integration
 * Bypasses IP restrictions using residential proxy network
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { debugLogger } from './debug-logger';

interface TranscriptResult {
  transcript: string | null;
  duration?: number;
  language?: string;
  segments?: number;
  error?: string;
  method?: string;
}

export class YouTubeTranscriptService {
  private brightDataProxyEndpoint = 'http://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:22225';

  // Main extraction method with Bright Data proxy bypass
  async extractTranscript(url: string): Promise<TranscriptResult> {
    debugLogger.info('Starting YouTube transcript extraction', { url });

    try {
      // Try regular API first (fastest if not blocked)
      const regularResult = await this.extractWithRegularAPI(url);
      if (regularResult.transcript && !regularResult.error) {
        debugLogger.info('Regular transcript API successful', { url });
        return regularResult;
      }

      // If blocked, use Bright Data proxy
      debugLogger.info('Regular API blocked - trying Bright Data residential proxy', { 
        url, 
        error: regularResult.error 
      });
      
      const proxyResult = await this.extractWithBrightDataProxy(url);
      if (proxyResult.transcript && !proxyResult.error) {
        debugLogger.info('Bright Data transcript extraction successful', { url });
        return proxyResult;
      }

      // If both methods fail, return the error
      return {
        transcript: null,
        error: proxyResult.error || regularResult.error || 'All transcript extraction methods failed'
      };

    } catch (error) {
      debugLogger.error('YouTube transcript extraction failed', { url, error: (error as Error).message });
      return {
        transcript: null,
        error: (error as Error).message
      };
    }
  }

  // Regular transcript extraction (no proxy) - ultra-fast mode
  private async extractWithRegularAPI(url: string): Promise<TranscriptResult> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [
        join(process.cwd(), 'server/python/youtube_transcript_service.py'),
        url
      ], {
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
            resolve({
              ...result,
              method: 'regular_api'
            });
          } catch (parseError) {
            resolve({
              transcript: null,
              error: 'Failed to parse transcript result'
            });
          }
        } else {
          resolve({
            transcript: null,
            error: `Regular API failed: ${stderr}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          transcript: null,
          error: `Process error: ${error.message}`
        });
      });

      // Aggressive 3 second timeout for speed
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          transcript: null,
          error: 'Regular API timeout - prioritizing speed'
        });
      }, 3000);
    });
  }

  // Bright Data proxy-based extraction
  private async extractWithBrightDataProxy(url: string): Promise<TranscriptResult> {
    return new Promise((resolve) => {
      const command = this.buildBrightDataCommand(url);
      
      debugLogger.info('Executing Bright Data proxy transcript extraction', { 
        url,
        proxy: 'residential_ip_rotation'
      });

      const pythonProcess = spawn('python3', ['-c', command], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HTTP_PROXY: this.brightDataProxyEndpoint,
          HTTPS_PROXY: this.brightDataProxyEndpoint
        }
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
            resolve({
              ...result,
              method: 'bright_data_proxy'
            });
          } catch (parseError) {
            resolve({
              transcript: null,
              error: 'Failed to parse Bright Data result'
            });
          }
        } else {
          resolve({
            transcript: null,
            error: `Bright Data proxy failed: ${stderr}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          transcript: null,
          error: `Bright Data process error: ${error.message}`
        });
      });

      // Aggressive 5 second timeout for proxy extraction to prioritize speed
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          transcript: null,
          error: 'Bright Data proxy timeout - prioritizing speed'
        });
      }, 5000);
    });
  }

  private buildBrightDataCommand(url: string): string {
    return `
import sys
import json
import os
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs

# Configure Bright Data proxy
os.environ['HTTP_PROXY'] = '${this.brightDataProxyEndpoint}'
os.environ['HTTPS_PROXY'] = '${this.brightDataProxyEndpoint}'

def extract_video_id(url):
    if 'youtu.be' in url:
        return url.split('/')[-1].split('?')[0]
    elif 'youtube.com' in url:
        parsed = urlparse(url)
        return parse_qs(parsed.query).get('v', [None])[0]
    return None

try:
    video_id = extract_video_id('${url}')
    if not video_id:
        raise Exception('Could not extract video ID from URL')
    
    # Try to get transcript using Bright Data residential proxy
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
    
    if transcript_list:
        full_text = ' '.join([entry['text'] for entry in transcript_list])
        total_duration = max([entry['start'] + entry['duration'] for entry in transcript_list]) if transcript_list else 0
        
        result = {
            'transcript': full_text,
            'duration': total_duration,
            'language': 'en',
            'segments': len(transcript_list),
            'error': None
        }
    else:
        result = {'error': 'No transcript available', 'transcript': None}
    
    print(json.dumps(result))
    
except Exception as e:
    result = {'error': str(e), 'transcript': None}
    print(json.dumps(result))
`;
  }

  // Extract video ID from various YouTube URL formats
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

  // Check if URL is a YouTube video
  isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }
}

export const youTubeTranscriptService = new YouTubeTranscriptService();