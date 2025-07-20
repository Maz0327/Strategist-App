/**
 * Advanced Scraping Service using Bright Data Browser API
 * High-value content extraction for strategic intelligence
 */

import { debugLogger } from './debug-logger';
import { browserAPIService } from './browser-api-service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AdvancedScrapingService {
  constructor() {
    debugLogger.info('Advanced Scraping Service initialized with Browser API');
  }

  // 1. SOCIAL MEDIA INTELLIGENCE
  async scrapeLinkedInPosts(companyName: string, limit: number = 20) {
    debugLogger.info('Scraping LinkedIn company posts', { companyName, limit });
    
    const searchUrl = `https://www.linkedin.com/company/${companyName}/posts/`;
    return this.executeBrowserScraping('linkedin_posts', searchUrl, {
      target: 'LinkedIn company posts',
      selectors: [
        '.feed-shared-update-v2',
        '.feed-shared-text',
        '.feed-shared-actor__name',
        '.feed-shared-actor__sub-description'
      ]
    });
  }

  async scrapeTwitterTrends(location: string = 'worldwide') {
    debugLogger.info('Scraping Twitter trending topics', { location });
    
    const trendUrl = `https://twitter.com/explore/tabs/trending`;
    return this.executeBrowserScraping('twitter_trends', trendUrl, {
      target: 'Twitter trending topics',
      selectors: [
        '[data-testid="trend"]',
        '[data-testid="trendMetadata"]',
        '.r-18u37iz'
      ]
    });
  }

  // 2. NEWS & MEDIA INTELLIGENCE  
  async scrapeNewsOutlets(outlets: string[] = ['techcrunch.com', 'wired.com', 'theverge.com']) {
    debugLogger.info('Scraping news outlets for trending stories', { outlets });
    
    const results = [];
    for (const outlet of outlets) {
      const result = await this.executeBrowserScraping('news_scraping', `https://${outlet}`, {
        target: `${outlet} headlines`,
        selectors: [
          'h1', 'h2', 'h3',
          '.article-title',
          '.headline',
          '[data-module="ArticleHeadline"]'
        ]
      });
      results.push({ outlet, ...result });
    }
    return results;
  }

  // 3. COMPETITOR INTELLIGENCE
  async scrapeCompetitorWebsite(domain: string) {
    debugLogger.info('Scraping competitor website', { domain });
    
    return this.executeBrowserScraping('competitor_analysis', `https://${domain}`, {
      target: 'Competitor website analysis',
      selectors: [
        'title',
        'meta[name="description"]',
        'h1', 'h2',
        '.pricing',
        '.features',
        '.testimonial'
      ]
    });
  }

  // 4. PRODUCT INTELLIGENCE
  async scrapeProductHuntDaily() {
    debugLogger.info('Scraping Product Hunt daily launches');
    
    return this.executeBrowserScraping('product_hunt', 'https://www.producthunt.com/', {
      target: 'Product Hunt daily launches',
      selectors: [
        '[data-test="post-name"]',
        '[data-test="post-description"]',
        '[data-test="vote-button"]'
      ]
    });
  }

  // 5. FINANCIAL INTELLIGENCE
  async scrapeCrunchbaseStartups(category: string = 'artificial-intelligence') {
    debugLogger.info('Scraping Crunchbase startup data', { category });
    
    const crunchbaseUrl = `https://www.crunchbase.com/discover/organization.companies/${category}`;
    return this.executeBrowserScraping('crunchbase_startups', crunchbaseUrl, {
      target: 'Crunchbase startup data',
      selectors: [
        '.cb-card',
        '.cb-card__title',
        '.cb-card__description',
        '.funding-rounds'
      ]
    });
  }

  // 6. JOB MARKET INTELLIGENCE
  async scrapeJobPostings(skills: string[] = ['AI', 'Machine Learning', 'React']) {
    debugLogger.info('Scraping job market data', { skills });
    
    const results = [];
    for (const skill of skills) {
      const linkedinJobs = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(skill)}`;
      const result = await this.executeBrowserScraping('job_market', linkedinJobs, {
        target: `${skill} job postings`,
        selectors: [
          '.job-search-card',
          '.job-search-card__title',
          '.job-search-card__company',
          '.job-search-card__location'
        ]
      });
      results.push({ skill, ...result });
    }
    return results;
  }

  // 7. E-COMMERCE INTELLIGENCE
  async scrapeEcommerceData(domain: string, productCategory: string) {
    debugLogger.info('Scraping e-commerce data', { domain, productCategory });
    
    const searchUrl = `https://${domain}/search?q=${encodeURIComponent(productCategory)}`;
    return this.executeBrowserScraping('ecommerce_data', searchUrl, {
      target: 'E-commerce product data',
      selectors: [
        '.product-item',
        '.product-title',
        '.price',
        '.rating',
        '.reviews'
      ]
    });
  }

  // Core Browser API scraping execution
  private async executeBrowserScraping(
    operation: string, 
    url: string, 
    config: { target: string; selectors: string[] }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      debugLogger.info(`Executing browser scraping: ${operation}`, { url, target: config.target });

      // Use Browser API for advanced scraping with real browser instances
      const command = this.buildScrapingCommand(url, config.selectors);
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 120000 // 2 minutes for complex scraping
      });

      if (!stderr.includes('ERROR')) {
        const scrapedData = this.parseScrapingOutput(stdout);
        
        debugLogger.info(`Browser scraping successful: ${operation}`, { 
          url,
          dataPoints: scrapedData?.length || 0
        });
        
        return { 
          success: true, 
          data: scrapedData,
          operation,
          timestamp: new Date().toISOString()
        };
      } else {
        debugLogger.warn(`Browser scraping failed: ${operation}`, { url, error: stderr });
        return { success: false, error: stderr };
      }

    } catch (error) {
      debugLogger.error(`Browser scraping error: ${operation}`, { url, error: (error as Error).message });
      return { success: false, error: (error as Error).message };
    }
  }

  private buildScrapingCommand(url: string, selectors: string[]): string {
    // Build puppeteer/playwright command using Browser API
    return `node -e "
      const puppeteer = require('puppeteer-core');
      (async () => {
        const browser = await puppeteer.connect({
          browserWSEndpoint: 'wss://brd-customer-hl_d2c6dd0f-zone-scraping_browser1:wl58vcxlx0ph@brd.superproxy.io:9222'
        });
        const page = await browser.newPage();
        await page.goto('${url}', { waitUntil: 'networkidle2' });
        
        const data = {};
        ${selectors.map(selector => `
        try {
          data['${selector}'] = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('${selector}'));
            return elements.map(el => el.textContent?.trim()).filter(Boolean);
          });
        } catch (e) { data['${selector}'] = []; }
        `).join('')}
        
        console.log(JSON.stringify(data));
        await browser.close();
      })().catch(console.error);
    "`;
  }

  private parseScrapingOutput(output: string): any {
    try {
      return JSON.parse(output);
    } catch {
      return { rawOutput: output };
    }
  }

  // Get available scraping capabilities
  getScrapingCapabilities() {
    return {
      socialMedia: [
        'LinkedIn company posts and updates',
        'Twitter trending topics and hashtags',
        'Instagram trending content',
        'TikTok viral videos and trends'
      ],
      newsIntelligence: [
        'Tech news aggregation (TechCrunch, Wired, Verge)',
        'Industry publications',
        'Press release monitoring',
        'Breaking news alerts'
      ],
      competitorAnalysis: [
        'Website content analysis',
        'Pricing page monitoring',
        'Feature comparison data',
        'Customer testimonials'
      ],
      productIntelligence: [
        'Product Hunt daily launches',
        'App store trending apps',
        'Beta product announcements',
        'Feature release tracking'
      ],
      financialData: [
        'Crunchbase startup funding',
        'IPO announcements',
        'Acquisition news',
        'Investment trend analysis'
      ],
      jobMarketTrends: [
        'Skill demand analysis',
        'Salary trend tracking',
        'Remote work patterns',
        'Hiring surge indicators'
      ],
      ecommerceInsights: [
        'Product pricing trends',
        'Review sentiment analysis',
        'Inventory availability',
        'Seasonal demand patterns'
      ]
    };
  }
}

export const advancedScrapingService = new AdvancedScrapingService();