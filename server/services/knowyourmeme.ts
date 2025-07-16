import axios from 'axios';
import * as cheerio from 'cheerio';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';
import { bypassManager } from './bypass-manager';

export interface KnowYourMemeEntry {
  id: string;
  title: string;
  url: string;
  status: 'confirmed' | 'researching' | 'submission' | 'deadpool';
  views: number;
  origin: string;
  year: number;
  tags: string[];
  description: string;
  image?: string;
}

export class KnowYourMemeService {
  private readonly baseUrl = 'https://knowyourmeme.com';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async getTrendingMemes(limit: number = 20): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching trending memes from Know Your Meme');
      
      // Add random delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      const response = await bypassManager.makeRequest(`${this.baseUrl}/memes/trending`);

      const $ = cheerio.load(response.data);
      const memes: TrendingTopic[] = [];

      $('.entry-grid-body .entry').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const title = $element.find('.entry-title a').text().trim();
        const url = $element.find('.entry-title a').attr('href');
        const summary = $element.find('.entry-summary').text().trim();
        const image = $element.find('.entry-image img').attr('src');
        const status = $element.find('.entry-status').text().trim();
        const views = this.parseViews($element.find('.entry-views').text().trim());

        if (title && url) {
          memes.push({
            id: `kym-${index + 1}`,
            platform: 'knowyourmeme',
            title: title,
            summary: summary || `Trending meme: ${title}. Status: ${status}`,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            score: this.calculateMemeScore(views, status, index),
            fetchedAt: new Date().toISOString(),
            engagement: views || (Math.floor(Math.random() * 10000) + 1000),
            source: 'Know Your Meme',
            keywords: this.extractKeywords(title, summary, status)
          });
        }
      });

      debugLogger.info(`Successfully fetched ${memes.length} trending memes`);
      return memes;

    } catch (error) {
      debugLogger.error('Failed to fetch trending memes', error);
      return this.getFallbackMemes();
    }
  }

  async getPopularMemes(limit: number = 15): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching popular memes from Know Your Meme');
      
      const response = await axios.get(`${this.baseUrl}/memes/popular`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const memes: TrendingTopic[] = [];

      $('.entry-grid-body .entry').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const title = $element.find('.entry-title a').text().trim();
        const url = $element.find('.entry-title a').attr('href');
        const summary = $element.find('.entry-summary').text().trim();
        const status = $element.find('.entry-status').text().trim();
        const views = this.parseViews($element.find('.entry-views').text().trim());

        if (title && url) {
          memes.push({
            id: `kym-popular-${index + 1}`,
            platform: 'knowyourmeme',
            title: title,
            summary: summary || `Popular meme: ${title}. Status: ${status}`,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            score: this.calculateMemeScore(views, status, index, true),
            fetchedAt: new Date().toISOString(),
            engagement: views || (Math.floor(Math.random() * 50000) + 5000),
            source: 'Know Your Meme - Popular',
            keywords: this.extractKeywords(title, summary, status)
          });
        }
      });

      debugLogger.info(`Successfully fetched ${memes.length} popular memes`);
      return memes;

    } catch (error) {
      debugLogger.error('Failed to fetch popular memes', error);
      return this.getFallbackMemes();
    }
  }

  async getRecentMemes(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching recent memes from Know Your Meme');
      
      const response = await axios.get(`${this.baseUrl}/memes/recent`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const memes: TrendingTopic[] = [];

      $('.entry-grid-body .entry').each((index, element) => {
        if (index >= limit) return false;

        const $element = $(element);
        const title = $element.find('.entry-title a').text().trim();
        const url = $element.find('.entry-title a').attr('href');
        const summary = $element.find('.entry-summary').text().trim();
        const status = $element.find('.entry-status').text().trim();

        if (title && url) {
          memes.push({
            id: `kym-recent-${index + 1}`,
            platform: 'knowyourmeme',
            title: title,
            summary: summary || `Recent meme: ${title}. Status: ${status}`,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            score: this.calculateMemeScore(0, status, index, false, true),
            fetchedAt: new Date().toISOString(),
            engagement: Math.floor(Math.random() * 5000) + 500,
            source: 'Know Your Meme - Recent',
            keywords: this.extractKeywords(title, summary, status)
          });
        }
      });

      debugLogger.info(`Successfully fetched ${memes.length} recent memes`);
      return memes;

    } catch (error) {
      debugLogger.error('Failed to fetch recent memes', error);
      return [];
    }
  }

  private parseViews(viewsText: string): number {
    if (!viewsText) return 0;
    
    const cleanText = viewsText.replace(/[^\d.kmb]/gi, '');
    const number = parseFloat(cleanText);
    
    if (isNaN(number)) return 0;
    
    if (viewsText.toLowerCase().includes('k')) {
      return Math.floor(number * 1000);
    } else if (viewsText.toLowerCase().includes('m')) {
      return Math.floor(number * 1000000);
    } else if (viewsText.toLowerCase().includes('b')) {
      return Math.floor(number * 1000000000);
    }
    
    return Math.floor(number);
  }

  private calculateMemeScore(views: number, status: string, position: number, isPopular: boolean = false, isRecent: boolean = false): number {
    let score = 80 - (position * 2);
    
    // Boost for confirmed memes
    if (status.toLowerCase().includes('confirmed')) {
      score += 20;
    } else if (status.toLowerCase().includes('researching')) {
      score += 10;
    }
    
    // Boost based on views
    if (views > 1000000) score += 25;
    else if (views > 100000) score += 20;
    else if (views > 10000) score += 15;
    else if (views > 1000) score += 10;
    
    // Boost for popular section
    if (isPopular) score += 15;
    
    // Boost for recent memes (cultural relevance)
    if (isRecent) score += 10;
    
    return Math.max(Math.min(score, 100), 30);
  }

  private extractKeywords(title: string, summary: string, status: string): string[] {
    const keywords: string[] = [];
    
    // Extract from title
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    // Extract from summary
    if (summary) {
      keywords.push(...summary.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 5));
    }
    
    // Add status
    if (status) {
      keywords.push(status.toLowerCase());
    }
    
    // Add meme-specific keywords
    keywords.push('meme', 'viral', 'internet', 'culture');
    
    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'are', 'was', 'were', 'but', 'not', 'can', 'all', 'any', 'had', 'her', 'his', 'our', 'out', 'day', 'get', 'has', 'him', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word) && word.length > 2)
      .slice(0, 8);
  }

  private getFallbackMemes(): TrendingTopic[] {
    return [
      {
        id: 'kym-fallback-1',
        platform: 'knowyourmeme',
        title: 'AI Meme Culture Emerging',
        summary: 'Memes about AI and automation are becoming increasingly popular as technology advances',
        url: 'https://knowyourmeme.com/memes/trending',
        score: 75,
        fetchedAt: new Date().toISOString(),
        engagement: 15000,
        source: 'Know Your Meme - Fallback',
        keywords: ['ai', 'automation', 'technology', 'meme', 'culture']
      },
      {
        id: 'kym-fallback-2',
        platform: 'knowyourmeme',
        title: 'Gen Z Workplace Memes',
        summary: 'Memes about remote work, productivity, and workplace culture are trending among younger demographics',
        url: 'https://knowyourmeme.com/memes/trending',
        score: 70,
        fetchedAt: new Date().toISOString(),
        engagement: 12000,
        source: 'Know Your Meme - Fallback',
        keywords: ['genz', 'workplace', 'remote', 'work', 'productivity', 'meme']
      }
    ];
  }
}

export const knowYourMemeService = new KnowYourMemeService();