import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface MediaStackArticle {
  author: string;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string;
  category: string;
  language: string;
  country: string;
  published_at: string;
}

export class MediaStackService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'http://api.mediastack.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getLiveNews(categories?: string[], countries: string[] = ['us'], limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('MediaStack API key not configured, returning fallback data');
      return this.getFallbackNews();
    }

    try {
      const params: any = {
        access_key: this.apiKey,
        countries: countries.join(','),
        limit,
        sort: 'published_desc'
      };

      if (categories && categories.length > 0) {
        params.categories = categories.join(',');
      }

      const response = await axios.get(`${this.baseUrl}/news`, { params });
      const articles = response.data.data;

      return articles.map((article: MediaStackArticle, index: number) => ({
        id: `mediastack-${Date.now()}-${index}`,
        platform: 'mediastack',
        title: article.title,
        summary: this.generateSummary(article),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `MediaStack - ${article.source}`,
        keywords: this.extractKeywords(article.title, article.description)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch MediaStack live news', error);
      return this.getFallbackNews();
    }
  }

  async searchNews(keywords: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackNews();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          access_key: this.apiKey,
          keywords,
          limit,
          sort: 'published_desc'
        }
      });

      const articles = response.data.data;

      return articles.map((article: MediaStackArticle, index: number) => ({
        id: `mediastack-search-${Date.now()}-${index}`,
        platform: 'mediastack',
        title: article.title,
        summary: this.generateSummary(article, keywords),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `MediaStack Search - ${article.source}`,
        keywords: this.extractKeywords(article.title, article.description, keywords)
      }));

    } catch (error) {
      debugLogger.error('Failed to search MediaStack news', error);
      return [];
    }
  }

  async getNewsByCategory(category: string, limit: number = 15): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          access_key: this.apiKey,
          categories: category,
          countries: 'us',
          limit,
          sort: 'published_desc'
        }
      });

      const articles = response.data.data;

      return articles.map((article: MediaStackArticle, index: number) => ({
        id: `mediastack-category-${Date.now()}-${index}`,
        platform: 'mediastack',
        title: article.title,
        summary: this.generateSummary(article, `${category} category`),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `MediaStack - ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        keywords: this.extractKeywords(article.title, article.description, category)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch MediaStack news by category', error);
      return [];
    }
  }

  async getNewsBySource(source: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          access_key: this.apiKey,
          sources: source,
          limit,
          sort: 'published_desc'
        }
      });

      const articles = response.data.data;

      return articles.map((article: MediaStackArticle, index: number) => ({
        id: `mediastack-source-${Date.now()}-${index}`,
        platform: 'mediastack',
        title: article.title,
        summary: this.generateSummary(article, `from ${source}`),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `MediaStack - ${source}`,
        keywords: this.extractKeywords(article.title, article.description)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch MediaStack news by source', error);
      return [];
    }
  }

  private generateSummary(article: MediaStackArticle, context?: string): string {
    const parts = [];
    
    if (context) {
      parts.push(context);
    }
    
    if (article.description) {
      parts.push(article.description.length > 150 ? 
        article.description.substring(0, 150) + '...' : 
        article.description);
    }
    
    if (article.category) {
      parts.push(`Category: ${article.category}`);
    }
    
    if (article.author) {
      parts.push(`By ${article.author}`);
    }
    
    if (article.country) {
      parts.push(`Source: ${article.country.toUpperCase()}`);
    }

    return parts.join('. ');
  }

  private calculateNewsScore(article: MediaStackArticle, position: number): number {
    let score = 80 - (position * 2);
    
    // Recent articles get higher scores
    const hoursAgo = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 1) score += 25;
    else if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    
    // Boost for important categories
    const importantCategories = ['business', 'technology', 'science', 'politics', 'health'];
    if (article.category && importantCategories.includes(article.category.toLowerCase())) {
      score += 15;
    }
    
    // Boost for well-known sources
    const premiumSources = ['reuters', 'bloomberg', 'cnn', 'bbc', 'wall street journal', 'financial times'];
    if (article.source && premiumSources.some(source => 
      article.source.toLowerCase().includes(source))) {
      score += 15;
    }
    
    // Boost for articles with images
    if (article.image) {
      score += 5;
    }
    
    // Boost for articles with authors
    if (article.author) {
      score += 5;
    }
    
    // Boost for comprehensive descriptions
    if (article.description && article.description.length > 100) {
      score += 5;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private estimateEngagement(article: MediaStackArticle): number {
    const baseEngagement = 1000;
    const hoursAgo = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 1) multiplier = 3.5;
    else if (hoursAgo < 6) multiplier = 2.5;
    else if (hoursAgo < 24) multiplier = 1.8;
    else if (hoursAgo < 72) multiplier = 1.3;
    
    // Boost for business/tech content
    if (article.category) {
      const engagingCategories = ['business', 'technology', 'entertainment', 'sports'];
      if (engagingCategories.includes(article.category.toLowerCase())) {
        multiplier *= 1.5;
      }
    }
    
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

    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'says', 'said', 'news', 'report', 'according', 'new'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackNews(): TrendingTopic[] {
    return [
      {
        id: 'mediastack-fallback-1',
        platform: 'mediastack',
        title: 'MediaStack API Integration Ready',
        summary: 'Configure MediaStack API key to fetch global news aggregation with source filtering',
        url: 'https://mediastack.com/',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['mediastack', 'news', 'api', 'aggregation', 'global']
      }
    ];
  }
}

export const createMediaStackService = (apiKey?: string): MediaStackService | null => {
  return new MediaStackService(apiKey);
};