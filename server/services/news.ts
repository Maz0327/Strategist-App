import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author?: string;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export class NewsService {
  private readonly baseUrl = 'https://newsapi.org/v2';
  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getTrendingNews(query?: string, category?: string): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('NewsAPI key not provided, returning fallback data');
      return this.getFallbackNews();
    }

    try {
      const params: any = {
        apiKey: this.apiKey,
        country: 'us',
        pageSize: 10,
        sortBy: 'popularity'
      };

      let endpoint = '/top-headlines';
      
      if (query) {
        endpoint = '/everything';
        params.q = query;
        params.sortBy = 'publishedAt';
        delete params.country;
      } else if (category) {
        params.category = category;
      } else {
        // Default to business news for strategic intelligence
        params.category = 'business';
      }

      const response = await axios.get(`${this.baseUrl}${endpoint}`, { params });
      const newsData: NewsResponse = response.data;

      if (newsData.status !== 'ok') {
        throw new Error(`NewsAPI error: ${newsData.status}`);
      }

      return newsData.articles
        .filter(article => article.title && article.url)
        .map((article, index) => ({
          id: `news-${Date.now()}-${index}`,
          platform: 'news',
          title: article.title,
          summary: article.description || article.title,
          url: article.url,
          score: this.calculateNewsScore(article),
          fetchedAt: new Date().toISOString(),
          engagement: this.estimateEngagement(article),
          source: article.source.name,
          keywords: this.extractKeywords(article.title)
        }));

    } catch (error) {
      debugLogger.error('Failed to fetch news data', error);
      return this.getFallbackNews();
    }
  }

  async searchNews(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('NewsAPI key not provided for search, returning fallback data');
      return this.getFallbackNews();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: query,
          apiKey: this.apiKey,
          pageSize: limit,
          sortBy: 'publishedAt',
          language: 'en'
        }
      });

      const newsData: NewsResponse = response.data;

      return newsData.articles
        .filter(article => article.title && article.url)
        .map((article, index) => ({
          id: `news-search-${Date.now()}-${index}`,
          platform: 'news',
          title: article.title,
          summary: article.description || article.title,
          url: article.url,
          score: this.calculateNewsScore(article),
          fetchedAt: new Date().toISOString(),
          engagement: this.estimateEngagement(article),
          source: article.source.name,
          keywords: this.extractKeywords(article.title + ' ' + (article.description || ''))
        }));

    } catch (error) {
      debugLogger.error('Failed to search news', error);
      return [];
    }
  }

  private calculateNewsScore(article: NewsArticle): number {
    let score = 50; // Base score
    
    // Recent articles get higher scores
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 6) score += 30;
    else if (hoursAgo < 24) score += 20;
    else if (hoursAgo < 72) score += 10;
    
    // Boost for business/tech sources
    const businessSources = ['bloomberg', 'reuters', 'wall street journal', 'techcrunch', 'fortune'];
    if (businessSources.some(source => article.source.name.toLowerCase().includes(source))) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  private estimateEngagement(article: NewsArticle): number {
    // Estimate engagement based on source and recency
    const baseEngagement = 1000;
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 6) multiplier = 3;
    else if (hoursAgo < 24) multiplier = 2;
    else if (hoursAgo < 72) multiplier = 1.5;
    
    return Math.floor(baseEngagement * multiplier * (Math.random() * 0.5 + 0.75));
  }

  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackNews(): TrendingTopic[] {
    return [
      {
        id: 'news-fallback-1',
        platform: 'news',
        title: 'NewsAPI Integration Ready',
        summary: 'Configure NewsAPI key to fetch real-time news trends and breaking stories',
        url: 'https://newsapi.org/register',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['news', 'api', 'setup', 'trends']
      }
    ];
  }
}

export const createNewsService = (apiKey?: string): NewsService | null => {
  return new NewsService(apiKey);
};