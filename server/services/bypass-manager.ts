import axios, { AxiosRequestConfig } from 'axios';
import { debugLogger } from './debug-logger';

export interface BypassConfig {
  userAgents: string[];
  referers: string[];
  headers: Record<string, string>;
  delays: { min: number; max: number };
  maxRetries: number;
}

export class BypassManager {
  private config: BypassConfig = {
    userAgents: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
    ],
    referers: [
      'https://google.com/',
      'https://www.google.com/search?q=trending+topics',
      'https://twitter.com/',
      'https://www.reddit.com/',
      'https://news.ycombinator.com/'
    ],
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Cache-Control': 'max-age=0'
    },
    delays: { min: 1000, max: 3000 },
    maxRetries: 3
  };

  private getRandomUserAgent(): string {
    return this.config.userAgents[Math.floor(Math.random() * this.config.userAgents.length)];
  }

  private getRandomReferer(): string {
    return this.config.referers[Math.floor(Math.random() * this.config.referers.length)];
  }

  private getRandomDelay(): number {
    return Math.random() * (this.config.delays.max - this.config.delays.min) + this.config.delays.min;
  }

  private generateBypassHeaders(): Record<string, string> {
    return {
      ...this.config.headers,
      'User-Agent': this.getRandomUserAgent(),
      'Referer': this.getRandomReferer()
    };
  }

  async makeRequest(url: string, options: AxiosRequestConfig = {}): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Add random delay
        await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));

        const requestConfig: AxiosRequestConfig = {
          ...options,
          headers: {
            ...this.generateBypassHeaders(),
            ...options.headers
          },
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: (status) => status < 500
        };

        debugLogger.info(`Attempt ${attempt}/${this.config.maxRetries} for URL: ${url}`);
        const response = await axios.get(url, requestConfig);
        
        if (response.status === 200) {
          debugLogger.info(`Successfully fetched ${url} on attempt ${attempt}`);
          return response;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        lastError = error;
        debugLogger.warn(`Attempt ${attempt}/${this.config.maxRetries} failed for ${url}:`, error.message);
        
        if (attempt < this.config.maxRetries) {
          // Exponential backoff
          const backoffDelay = Math.min(5000, 1000 * Math.pow(2, attempt - 1));
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    debugLogger.error(`All ${this.config.maxRetries} attempts failed for ${url}`);
    throw lastError;
  }

  async testUrl(url: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(url);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Alternative endpoints for common platforms
  getAlternativeEndpoints(platform: string): string[] {
    const alternatives: Record<string, string[]> = {
      'reddit': [
        'https://www.reddit.com/r/popular/hot.json',
        'https://old.reddit.com/r/popular/hot.json',
        'https://api.reddit.com/r/popular/hot'
      ],
      'youtube': [
        'https://www.youtube.com/feed/trending',
        'https://m.youtube.com/feed/trending',
        'https://www.youtube.com/playlist?list=PLrAXtmRdnEQy4rR8CJG1rRSWk-h4bNgOj'
      ],
      'knowyourmeme': [
        'https://knowyourmeme.com/memes/trending',
        'https://knowyourmeme.com/memes/popular',
        'https://knowyourmeme.com/memes/recent'
      ],
      'urbandictionary': [
        'https://www.urbandictionary.com/trending',
        'https://www.urbandictionary.com/popular',
        'https://www.urbandictionary.com/recent'
      ]
    };

    return alternatives[platform] || [];
  }
}

export const bypassManager = new BypassManager();