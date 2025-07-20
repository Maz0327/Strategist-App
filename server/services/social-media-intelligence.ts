/**
 * Social Media Intelligence Service
 * Cost-efficient social media scraping with data usage controls
 */

import { debugLogger } from './debug-logger';
import { browserAPIService } from './browser-api-service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface SocialMediaConfig {
  maxDataPerRequest: number; // KB limit
  enableImageSkipping: boolean;
  textOnlyMode: boolean;
  sampleSize: number; // Number of posts to analyze
}

class SocialMediaIntelligence {
  private config: SocialMediaConfig = {
    maxDataPerRequest: 2000, // Increased to 2MB for richer data
    enableImageSkipping: true,
    textOnlyMode: true,
    sampleSize: 50 // Increased to top 50 posts for better intelligence
  };

  constructor() {
    debugLogger.info('Social Media Intelligence initialized for beta testing with enhanced data collection');
  }

  // Enhanced Twitter Intelligence with Multiple Data Points
  async scrapeTwitterEnhanced(): Promise<any> {
    debugLogger.info('Enhanced Twitter intelligence gathering');
    
    const twitterSources = [
      'https://twitter.com/explore/tabs/trending',
      'https://twitter.com/search?q=%23startup&src=trend_click',
      'https://twitter.com/search?q=%23ai&src=trend_click',
      'https://twitter.com/search?q=%23business&src=trend_click'
    ];

    const results = [];
    for (const url of twitterSources) {
      try {
        const result = await this.executeSocialScraping('twitter_enhanced', url, {
          selectors: [
            '[data-testid="trend"]',
            '[data-testid="tweet"]',
            '[data-testid="tweetText"]',
            '[aria-label*="like"]',
            '[aria-label*="retweet"]'
          ],
          dataType: 'enhanced_twitter_intel',
          platform: 'Twitter'
        });
        results.push(result);
      } catch (error) {
        continue;
      }
    }
    
    return results;
  }

  // LinkedIn Enhanced Company Intelligence
  async scrapeLinkedInEnhanced(): Promise<any> {
    debugLogger.info('Enhanced LinkedIn intelligence gathering');
    
    // High-value tech companies for comprehensive intelligence
    const techCompanies = [
      'microsoft', 'google', 'openai', 'meta', 'apple', 'tesla', 
      'nvidia', 'amazon', 'salesforce', 'adobe', 'netflix', 'uber'
    ];

    const results = [];
    for (const company of techCompanies.slice(0, 6)) { // 6 companies for rich data
      try {
        const result = await this.scrapeLinkedInCompany(company);
        if (result.success) {
          results.push(result);
        }
      } catch (error) {
        continue;
      }
      
      // Minimal delay for efficiency
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    return results;
  }

  // LinkedIn Company Intelligence (Text-Only, High Value)
  async scrapeLinkedInCompany(companySlug: string): Promise<any> {
    debugLogger.info('Scraping LinkedIn company intelligence', { 
      company: companySlug,
      mode: 'text-only',
      sampleSize: this.config.sampleSize
    });

    const linkedinUrl = `https://www.linkedin.com/company/${companySlug}/posts/`;
    
    return this.executeSocialScraping('linkedin_company', linkedinUrl, {
      selectors: [
        '.feed-shared-update-v2__description-wrapper',
        '.feed-shared-text',
        '.feed-shared-actor__name',
        '.feed-shared-actor__sub-description',
        '.social-details-social-counts__reactions-count'
      ],
      dataType: 'company_posts',
      platform: 'LinkedIn'
    });
  }

  // Twitter Trending Intelligence (Lightweight, High Frequency)
  async scrapeTwitterTrends(location: string = 'worldwide'): Promise<any> {
    debugLogger.info('Scraping Twitter trending intelligence', { 
      location,
      mode: 'trending-only'
    });

    const twitterUrl = `https://twitter.com/explore/tabs/trending`;
    
    return this.executeSocialScraping('twitter_trends', twitterUrl, {
      selectors: [
        '[data-testid="trend"]',
        '[data-testid="trendMetadata"]',
        '.r-18u37iz',
        '.css-1dbjc4n.r-1awozwy'
      ],
      dataType: 'trending_topics',
      platform: 'Twitter'
    });
  }

  // Instagram Hashtag Intelligence (Enhanced Coverage)
  async scrapeInstagramHashtags(hashtags: string[]): Promise<any> {
    debugLogger.info('Scraping Instagram hashtag intelligence', { 
      hashtags,
      mode: 'enhanced-coverage'
    });

    // Expanded hashtag coverage for comprehensive trend detection
    const businessHashtags = ['startup', 'entrepreneur', 'innovation', 'ai', 'saas', 'business', 'marketing', 'growth'];
    const allHashtags = [...hashtags, ...businessHashtags].slice(0, 8); // Increased to 8 hashtags

    const results = [];
    for (const hashtag of allHashtags) {
      const instagramUrl = `https://www.instagram.com/explore/tags/${hashtag}/`;
      
      const result = await this.executeSocialScraping('instagram_hashtag', instagramUrl, {
        selectors: [
          '._ac7v._aang', // Post captions
          '._aacl._aaco._aacw._aacx._aada._aade', // Engagement metrics
          '._ab8w._ab94._ab99._ab9f._ab9m._ab9p._abcm', // Hashtag info
          'article', // Full post content
          'span[title]' // Engagement counts
        ],
        dataType: 'hashtag_analysis',
        platform: 'Instagram',
        hashtag
      });
      
      results.push(result);
      
      // Reduced rate limiting for faster data collection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // TikTok Trending Intelligence (Discover Page Only)
  async scrapeTikTokTrends(): Promise<any> {
    debugLogger.info('Scraping TikTok trending intelligence', { 
      mode: 'discover-page-only'
    });

    const tiktokUrl = `https://www.tiktok.com/discover`;
    
    return this.executeSocialScraping('tiktok_trends', tiktokUrl, {
      selectors: [
        '[data-e2e="challenge-item"]',
        '[data-e2e="hashtag-title"]',
        '[data-e2e="hashtag-desc"]',
        '.tiktok-1w9h2lc-StyledNumber'
      ],
      dataType: 'trending_challenges',
      platform: 'TikTok'
    });
  }

  // Executive LinkedIn Posts (High-Value Target Monitoring)
  async scrapeExecutiveLinkedIn(executiveProfile: string): Promise<any> {
    debugLogger.info('Scraping executive LinkedIn posts', { 
      executive: executiveProfile,
      mode: 'recent-posts-only'
    });

    const profileUrl = `https://www.linkedin.com/in/${executiveProfile}/recent-activity/`;
    
    return this.executeSocialScraping('executive_posts', profileUrl, {
      selectors: [
        '.feed-shared-update-v2__description-wrapper',
        '.feed-shared-text',
        '.feed-shared-actor__name',
        '.social-details-social-counts__reactions-count',
        '.feed-shared-update-v2__action-menu'
      ],
      dataType: 'executive_insights',
      platform: 'LinkedIn'
    });
  }

  // Core social media scraping with cost controls
  private async executeSocialScraping(
    operation: string,
    url: string,
    config: {
      selectors: string[];
      dataType: string;
      platform: string;
      hashtag?: string;
    }
  ): Promise<any> {
    try {
      debugLogger.info(`Social media scraping: ${operation}`, { 
        url: url.substring(0, 50) + '...',
        platform: config.platform,
        dataType: config.dataType
      });

      // Build cost-efficient scraping command
      const command = this.buildSocialScrapingCommand(url, config.selectors);
      
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 60000 // 1 minute timeout for social media
      });
      const endTime = Date.now();

      if (!stderr.includes('ERROR') && stdout) {
        const scrapedData = this.parseSocialData(stdout, config.platform);
        const dataSize = Buffer.byteLength(stdout, 'utf8');
        
        debugLogger.info(`Social scraping successful: ${operation}`, { 
          platform: config.platform,
          dataType: config.dataType,
          posts: scrapedData?.posts?.length || 0,
          dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
          duration: `${endTime - startTime}ms`
        });
        
        return { 
          success: true, 
          platform: config.platform,
          dataType: config.dataType,
          data: scrapedData,
          metadata: {
            operation,
            timestamp: new Date().toISOString(),
            dataSize: dataSize,
            duration: endTime - startTime,
            costEstimate: this.calculateCost(dataSize)
          }
        };
      } else {
        debugLogger.warn(`Social scraping failed: ${operation}`, { 
          platform: config.platform,
          error: stderr.substring(0, 200)
        });
        return { success: false, error: stderr, platform: config.platform };
      }

    } catch (error) {
      debugLogger.error(`Social scraping error: ${operation}`, { 
        platform: config.platform,
        error: (error as Error).message 
      });
      return { success: false, error: (error as Error).message, platform: config.platform };
    }
  }

  private buildSocialScrapingCommand(url: string, selectors: string[]): string {
    // Ultra-lightweight scraping command focused on text content only
    return `node -e "
      const puppeteer = require('puppeteer-core');
      (async () => {
        const browser = await puppeteer.connect({
          browserWSEndpoint: 'wss://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9222'
        });
        const page = await browser.newPage();
        
        // Block images and media to reduce data usage
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resourceType = req.resourceType();
          if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        await page.goto('${url}', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        const data = {};
        ${selectors.map((selector, index) => `
        try {
          data['selector_${index}'] = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('${selector}'));
            return elements.slice(0, ${this.config.sampleSize}).map(el => ({
              text: el.textContent?.trim().substring(0, 200) || '',
              href: el.href || null
            })).filter(item => item.text);
          });
        } catch (e) { data['selector_${index}'] = []; }
        `).join('')}
        
        console.log(JSON.stringify(data));
        await browser.close();
      })().catch(console.error);
    "`;
  }

  private parseSocialData(output: string, platform: string): any {
    try {
      const rawData = JSON.parse(output);
      const posts = [];
      
      // Combine all selector results into posts array
      Object.values(rawData).forEach((selectorData: any) => {
        if (Array.isArray(selectorData)) {
          posts.push(...selectorData);
        }
      });

      return {
        platform,
        posts: posts.slice(0, this.config.sampleSize),
        summary: {
          totalPosts: posts.length,
          avgLength: posts.reduce((acc, post) => acc + post.text.length, 0) / posts.length || 0,
          topKeywords: this.extractKeywords(posts)
        }
      };
    } catch {
      return { rawOutput: output, platform };
    }
  }

  private extractKeywords(posts: any[]): string[] {
    const text = posts.map(p => p.text).join(' ').toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private calculateCost(dataSize: number): string {
    const costPerGB = 8.50;
    const costPerByte = costPerGB / (1024 * 1024 * 1024);
    const estimatedCost = dataSize * costPerByte;
    return `$${estimatedCost.toFixed(4)}`;
  }

  // Get social media intelligence capabilities
  getSocialCapabilities() {
    return {
      platforms: ['LinkedIn', 'Twitter', 'Instagram', 'TikTok'],
      costControls: {
        maxDataPerRequest: `${this.config.maxDataPerRequest}KB`,
        imageBlocking: this.config.enableImageSkipping,
        sampleSize: this.config.sampleSize,
        estimatedCostPerRequest: '$0.005-0.02'
      },
      dataTypes: [
        'Company posts and updates',
        'Trending topics and hashtags',
        'Executive insights and announcements',
        'Cultural moments and viral content',
        'Engagement metrics and sentiment'
      ]
    };
  }

  // Update cost controls
  updateCostControls(newConfig: Partial<SocialMediaConfig>) {
    this.config = { ...this.config, ...newConfig };
    debugLogger.info('Social media cost controls updated', this.config);
  }
}

export const socialMediaIntelligence = new SocialMediaIntelligence();