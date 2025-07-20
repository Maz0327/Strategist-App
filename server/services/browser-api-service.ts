/**
 * Bright Data Browser API Service
 * Advanced browser-based scraping with embedded credentials
 */

import { debugLogger } from './debug-logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class BrowserAPIService {
  private puppeteerEndpoint = 'wss://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9222';
  private seleniumEndpoint = 'https://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9515';
  private apiKey = 'cbef860294f3e8ae5dd9000444672f4ce35c5eaf6a921e7b71fa304ae0f5a538';

  constructor() {
    debugLogger.info('Browser API Service initialized with Bright Data endpoints');
  }

  // Enhanced yt-dlp with Browser API (using selenium-based approach)
  async extractVideoWithBrowserAPI(url: string, outputTemplate: string): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      debugLogger.info('Starting Browser API video extraction', { url, outputTemplate });

      // Build yt-dlp command with Browser API configuration
      const command = this.buildBrowserAPICommand(url, outputTemplate);
      
      debugLogger.info('Executing yt-dlp with Browser API', { command: command.substring(0, 200) + '...' });

      const { stdout, stderr } = await execAsync(command, { 
        timeout: 300000 // 5 minutes for Browser API
      });

      // Check for success
      if (!stderr.includes('ERROR') && !stderr.includes('Failed')) {
        debugLogger.info('Browser API extraction successful', { 
          url,
          stdout: stdout.substring(0, 200) + '...'
        });
        
        return { 
          success: true, 
          output: stdout 
        };
      } else {
        debugLogger.warn('Browser API extraction failed', { 
          url, 
          error: stderr.substring(0, 500) 
        });
        
        return { 
          success: false, 
          error: stderr 
        };
      }

    } catch (error) {
      debugLogger.error('Browser API execution failed', { 
        url, 
        error: error.message 
      });
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private buildBrowserAPICommand(url: string, outputTemplate: string): string {
    const baseArgs = [
      'yt-dlp',
      '--extract-audio',
      '--audio-format mp3', 
      '--no-playlist',
      '--ignore-errors',
      '--no-check-certificate'
    ];

    // Browser API specific configurations
    baseArgs.push(
      // Use Browser API endpoint as proxy
      '--proxy', `"${this.seleniumEndpoint}"`,
      
      // Enhanced headers for browser-like behavior
      '--user-agent', '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
      
      // Add browser-like headers
      '--add-header', '"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"',
      '--add-header', '"Accept-Language: en-US,en;q=0.5"',
      '--add-header', '"Accept-Encoding: gzip, deflate"',
      '--add-header', '"DNT: 1"',
      '--add-header', '"Connection: keep-alive"',
      
      // YouTube specific optimizations
      '--extractor-args', '"youtube:player_client=web"',
      
      // Slow down requests to appear more human-like
      '--sleep-interval', '3',
      '--max-sleep-interval', '6',
      
      // Retries and error handling
      '--retries', '2',
      '--retry-sleep', '5'
    );

    // Add output template and URL
    baseArgs.push('--output', `"${outputTemplate}"`);
    baseArgs.push(`"${url}"`);

    return baseArgs.join(' ');
  }

  // Alternative method using Puppeteer endpoint for more complex scenarios
  async extractWithPuppeteerAPI(url: string): Promise<{ success: boolean; pageContent?: string; error?: string }> {
    try {
      debugLogger.info('Using Puppeteer Browser API for enhanced extraction', { url });

      // This would require puppeteer package installation
      // For now, return preparation info
      return {
        success: false,
        error: 'Puppeteer Browser API requires additional setup - using Selenium endpoint instead'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test Browser API connectivity
  async testBrowserAPI(): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      debugLogger.info('Testing Browser API connectivity');

      // Simple connectivity test using curl
      const testCommand = `curl -s --connect-timeout 10 "${this.seleniumEndpoint}/status"`;
      
      const { stdout, stderr } = await execAsync(testCommand);
      
      if (stdout && !stderr.includes('error')) {
        return { 
          success: true, 
          response: stdout 
        };
      } else {
        return { 
          success: false, 
          error: stderr || 'No response' 
        };
      }

    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get Browser API status and configuration
  getBrowserAPIInfo() {
    return {
      puppeteerEndpoint: this.puppeteerEndpoint,
      seleniumEndpoint: this.seleniumEndpoint,
      status: 'configured',
      provider: 'Bright Data Browser API',
      authentication: 'embedded credentials',
      capabilities: [
        'Real browser instances',
        'Residential IP rotation', 
        'Advanced bot detection bypass',
        'Full JavaScript execution',
        'Cookie and session management'
      ]
    };
  }
}

export const browserAPIService = new BrowserAPIService();