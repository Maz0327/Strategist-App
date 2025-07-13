import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export class GNewsService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://gnews.io/api/v4';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getTrendingNews(category?: string, limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('GNews API key not configured, returning fallback data');
      return this.getFallbackNews();
    }

    try {
      const params: any = {
        token: this.apiKey,
        lang: 'en',
        country: 'us',
        max: limit
      };

      if (category) {
        params.category = category;
      }

      const response = await axios.get(`${this.baseUrl}/top-headlines`, { params });
      const articles = response.data.articles;

      return articles.map((article: GNewsArticle, index: number) => ({
        id: `gnews-${Date.now()}-${index}`,
        platform: 'gnews',
        title: article.title,
        summary: article.description || article.content?.substring(0, 200) + '...' || article.title,
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `GNews - ${article.source.name}`,
        keywords: this.extractKeywords(article.title, article.description)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch GNews trending news', error);
      return this.getFallbackNews();
    }
  }

  async searchNews(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackNews();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: query,
          token: this.apiKey,
          lang: 'en',
          max: limit,
          sortBy: 'relevance'
        }
      });

      const articles = response.data.articles;

      return articles.map((article: GNewsArticle, index: number) => ({
        id: `gnews-search-${Date.now()}-${index}`,
        platform: 'gnews',
        title: article.title,
        summary: article.description || `Search result for "${query}"`,
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `GNews Search - ${article.source.name}`,
        keywords: this.extractKeywords(article.title, article.description, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search GNews', error);
      return [];
    }
  }

  private calculateNewsScore(article: GNewsArticle, position: number): number {
    let score = 90 - (position * 2);
    
    // Recent articles get higher scores
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 2) score += 25;
    else if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    
    // Boost for quality sources
    const qualitySources = ['reuters', 'bbc', 'cnn', 'bloomberg', 'wall street journal', 'financial times'];
    if (qualitySources.some(source => article.source.name.toLowerCase().includes(source))) {
      score += 15;
    }
    
    // Boost for business-related content
    const businessKeywords = ['business', 'economy', 'market', 'finance', 'startup', 'technology', 'innovation'];
    const content = (article.title + ' ' + (article.description || '')).toLowerCase();
    if (businessKeywords.some(keyword => content.includes(keyword))) {
      score += 10;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private estimateEngagement(article: GNewsArticle): number {
    const baseEngagement = 1500;
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 2) multiplier = 4;
    else if (hoursAgo < 6) multiplier = 3;
    else if (hoursAgo < 24) multiplier = 2;
    else if (hoursAgo < 72) multiplier = 1.5;
    
    return Math.floor(baseEngagement * multiplier * (Math.random() * 0.5 + 0.75));
  }

  private extractKeywords(title: string, description?: string, query?: string): string[] {
    const keywords = [];
    
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 3));
    }
    
    if (description) {
      keywords.push(...description.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 5));
    }
    
    if (query) {
      keywords.push(...query.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'said', 'says', 'news', 'report'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackNews(): TrendingTopic[] {
    return [
      {
        id: 'gnews-fallback-1',
        platform: 'gnews',
        title: 'GNews API Integration Ready',
        summary: 'Configure GNews API key to fetch real-time news with sentiment analysis and full-text search',
        url: 'https://gnews.io/',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['gnews', 'news', 'api', 'sentiment', 'search']
      }
    ];
  }
}

export const createGNewsService = (apiKey?: string): GNewsService | null => {
  return new GNewsService(apiKey);
};