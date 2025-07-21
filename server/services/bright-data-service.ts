import axios, { AxiosRequestConfig } from 'axios';
import { debugLogger } from './debug-logger';

interface BrightDataConfig {
  username: string;
  password: string;
  proxyEndpoint: string;
  apiKey: string;
}

interface ScrapingRequest {
  url: string;
  selectors?: string[];
  waitForElement?: string;
  timeout?: number;
  screenshot?: boolean;
}

interface ScrapingResult {
  url: string;
  content: any;
  screenshot?: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

export class BrightDataService {
  private config: BrightDataConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      username: process.env.BRIGHT_DATA_USERNAME || 'brd-customer-hl_d2c6dd0f-zone-scraping_browser1',
      password: process.env.BRIGHT_DATA_PASSWORD || 'wl58vcxlx0ph',
      proxyEndpoint: process.env.BRIGHT_DATA_PROXY_ENDPOINT || 'brd.superproxy.io:33335',
      apiKey: process.env.BRIGHT_DATA_API_KEY || ''
    };

    this.isConfigured = !!(
      this.config.username && 
      this.config.password && 
      this.config.proxyEndpoint && 
      this.config.apiKey
    );

    if (this.isConfigured) {
      debugLogger.info('✅ Bright Data service initialized with credentials');
    } else {
      debugLogger.warn('⚠️ Bright Data credentials missing - service unavailable');
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // Test connection with a simple request
      const response = await this.makeProxyRequest('https://httpbin.org/ip', {
        timeout: 10000
      });
      debugLogger.info('✅ Bright Data proxy test successful');
      return response.status === 200;
    } catch (error) {
      debugLogger.error('❌ Bright Data proxy test failed:', error.message);
      return false;
    }
  }

  async makeProxyRequest(url: string, options: AxiosRequestConfig = {}): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Bright Data credentials not configured');
    }

    const proxyConfig = {
      proxy: {
        protocol: 'http',
        host: this.config.proxyEndpoint.split(':')[0],
        port: parseInt(this.config.proxyEndpoint.split(':')[1]),
        auth: {
          username: this.config.username,
          password: this.config.password
        }
      },
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        ...options.headers
      },
      ...options
    };

    debugLogger.info(`🔄 Making Bright Data proxy request to: ${url}`);
    return await axios.get(url, proxyConfig);
  }

  async scrapeSocialMedia(platform: string, urls: string[]): Promise<ScrapingResult[]> {
    if (!this.isConfigured) {
      throw new Error('Bright Data credentials not configured');
    }

    const results: ScrapingResult[] = [];

    for (const url of urls.slice(0, 5)) { // Limit to 5 URLs to control costs
      try {
        debugLogger.info(`🕷️ Scraping ${platform} URL: ${url}`);
        
        const response = await this.makeProxyRequest(url, {
          timeout: 20000
        });

        if (response.status === 200) {
          results.push({
            url,
            content: this.extractSocialContent(response.data, platform),
            success: true,
            timestamp: new Date().toISOString()
          });
          debugLogger.info(`✅ Successfully scraped ${platform}: ${url}`);
        } else {
          results.push({
            url,
            content: null,
            success: false,
            error: `HTTP ${response.status}`,
            timestamp: new Date().toISOString()
          });
        }

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        debugLogger.error(`❌ Failed to scrape ${url}:`, error.message);
        results.push({
          url,
          content: null,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  private extractSocialContent(html: string, platform: string): any {
    // Basic content extraction - could be enhanced with cheerio
    const content: any = {
      platform,
      rawLength: html.length,
      timestamp: new Date().toISOString()
    };

    try {
      // Extract basic text content
      const textMatch = html.match(/<title>(.*?)<\/title>/i);
      if (textMatch) {
        content.title = textMatch[1];
      }

      // Platform-specific extraction
      switch (platform.toLowerCase()) {
        case 'twitter':
        case 'x':
          content.tweets = this.extractTweets(html);
          break;
        case 'instagram':
          content.posts = this.extractInstagramPosts(html);
          break;
        case 'tiktok':
          content.videos = this.extractTikTokVideos(html);
          break;
        case 'linkedin':
          content.posts = this.extractLinkedInPosts(html);
          break;
        default:
          content.text = html.substring(0, 1000); // First 1000 chars
      }

    } catch (error) {
      debugLogger.warn(`Content extraction failed for ${platform}:`, error.message);
      content.extractionError = error.message;
    }

    return content;
  }

  private extractTweets(html: string): any[] {
    // Basic tweet extraction logic
    const tweets: any[] = [];
    
    // Look for tweet-like patterns in the HTML
    const tweetPattern = /data-testid="tweet"/g;
    const matches = html.match(tweetPattern);
    
    if (matches) {
      tweets.push({
        count: matches.length,
        extracted: true,
        timestamp: new Date().toISOString()
      });
    }

    return tweets;
  }

  private extractInstagramPosts(html: string): any[] {
    // Basic Instagram post extraction
    const posts: any[] = [];
    
    if (html.includes('instagram.com')) {
      posts.push({
        detected: true,
        platform: 'instagram',
        timestamp: new Date().toISOString()
      });
    }

    return posts;
  }

  private extractTikTokVideos(html: string): any[] {
    // Basic TikTok video extraction
    const videos: any[] = [];
    
    if (html.includes('tiktok.com')) {
      videos.push({
        detected: true,
        platform: 'tiktok',
        timestamp: new Date().toISOString()
      });
    }

    return videos;
  }

  private extractLinkedInPosts(html: string): any[] {
    // Basic LinkedIn post extraction
    const posts: any[] = [];
    
    if (html.includes('linkedin.com')) {
      posts.push({
        detected: true,
        platform: 'linkedin',
        timestamp: new Date().toISOString()
      });
    }

    return posts;
  }

  async getUsageStats(): Promise<any> {
    if (!this.isConfigured) {
      return { error: 'Bright Data not configured' };
    }

    try {
      // This would typically call Bright Data's API to get usage statistics
      debugLogger.info('📊 Fetching Bright Data usage statistics');
      
      return {
        configured: true,
        available: await this.isAvailable(),
        lastChecked: new Date().toISOString(),
        message: 'Bright Data service is operational'
      };
    } catch (error) {
      debugLogger.error('Failed to get Bright Data usage stats:', error.message);
      return {
        configured: true,
        available: false,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }
}

export const brightDataService = new BrightDataService();