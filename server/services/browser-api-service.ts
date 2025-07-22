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
  private apiKey = '9bc3a6bc-ffdb-4625-a84b-3359ff4e25b9';

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

  // Social Media URL Scraping with Browser API
  async scrapeSocialMediaURL(url: string, options: any = {}): Promise<any> {
    try {
      debugLogger.info(`🌐 Scraping social media URL with Browser API`, { url, platform: options.platform });
      
      // Use curl with Browser API proxy for enhanced social media scraping
      const scrapingCommand = this.buildSocialScrapingCommand(url, options);
      
      const { stdout, stderr } = await execAsync(scrapingCommand, { 
        timeout: options.timeout || 20000 
      });

      if (!stderr.includes('error') && stdout) {
        // Parse the scraped content
        const scrapedData = this.parseScrapedSocialContent(stdout, options.platform);
        
        return {
          success: true,
          content: scrapedData,
          method: 'browser-api'
        };
      } else {
        throw new Error(`Browser API scraping failed: ${stderr}`);
      }
    } catch (error) {
      debugLogger.error(`Browser API social scraping failed for ${options.platform}:`, error.message);
      return {
        success: false,
        error: error.message,
        method: 'browser-api-failed'
      };
    }
  }

  private buildSocialScrapingCommand(url: string, options: any): string {
    const curlArgs = [
      'curl',
      '-s',
      '--max-time 15',
      '--retry 2',
      '--retry-delay 2',
      '--location',
      // Use Browser API as proxy
      `--proxy "${this.seleniumEndpoint}"`,
      // Browser-like headers
      '-H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"',
      '-H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"',
      '-H "Accept-Language: en-US,en;q=0.9"',
      '-H "Accept-Encoding: gzip, deflate, br"',
      '-H "DNT: 1"',
      '-H "Connection: keep-alive"',
      '-H "Upgrade-Insecure-Requests: 1"',
      `"${url}"`
    ];

    return curlArgs.join(' ');
  }

  private parseScrapedSocialContent(htmlContent: string, platform: string): any {
    // Basic content parsing - in production this would be more sophisticated
    const title = this.extractTitle(htmlContent);
    const text = this.extractText(htmlContent);
    const engagement = this.extractEngagement(htmlContent, platform);
    const profile = this.extractProfile(htmlContent, platform);

    return {
      title: title || `${platform} content`,
      text: text || `Content from ${platform}`,
      author: profile.username || 'Unknown',
      engagement: engagement,
      profile: profile,
      media: [] // Would extract media URLs in production
    };
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  private extractText(html: string): string {
    // Remove HTML tags and extract readable text
    const textContent = html.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textContent.substring(0, 500); // Limit to 500 chars
  }

  private extractEngagement(html: string, platform: string): any {
    // Platform-specific engagement extraction
    const engagementPatterns = {
      instagram: {
        likes: /(\d+(?:,\d+)*)\s*likes?/i,
        comments: /(\d+(?:,\d+)*)\s*comments?/i
      },
      twitter: {
        likes: /(\d+(?:,\d+)*)\s*likes?/i,
        retweets: /(\d+(?:,\d+)*)\s*retweets?/i
      },
      tiktok: {
        likes: /(\d+(?:,\d+)*)\s*likes?/i,
        views: /(\d+(?:,\d+)*)\s*views?/i
      }
    };

    const patterns = engagementPatterns[platform] || {};
    const engagement: any = {};

    Object.entries(patterns).forEach(([metric, pattern]) => {
      const match = html.match(pattern);
      if (match) {
        engagement[metric] = parseInt(match[1].replace(/,/g, ''));
      }
    });

    return engagement;
  }

  private extractProfile(html: string, platform: string): any {
    // Basic profile extraction
    const usernamePatterns = {
      instagram: /@([a-zA-Z0-9_.]+)/,
      twitter: /@([a-zA-Z0-9_]+)/,
      tiktok: /@([a-zA-Z0-9_.]+)/,
      linkedin: /\/in\/([a-zA-Z0-9-]+)/
    };

    const pattern = usernamePatterns[platform];
    const usernameMatch = pattern ? html.match(pattern) : null;

    return {
      username: usernameMatch ? usernameMatch[1] : 'unknown',
      verified: html.includes('verified') || html.includes('checkmark'),
      followers: 0 // Would extract in production
    };
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
        'Social media URL scraping',
        'Anti-detection technology',
        'JavaScript execution',
        'Engagement data extraction'
      ]
    };
  }
}

export const browserApiService = new BrowserAPIService();
        'Full JavaScript execution',
        'Cookie and session management'
      ]
    };
  }
}

export const browserAPIService = new BrowserAPIService();