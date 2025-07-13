import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface CurrentsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  author: string;
  image: string;
  language: string;
  category: string[];
  published: string;
  sentiment?: {
    polarity: number;
    subjectivity: number;
  };
}

export class CurrentsService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.currentsapi.services/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getLatestNews(category?: string, region: string = 'US', limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('Currents API key not configured, returning fallback data');
      return this.getFallbackNews();
    }

    try {
      const params: any = {
        apiKey: this.apiKey,
        region,
        limit
      };

      if (category) {
        params.category = category;
      }

      const response = await axios.get(`${this.baseUrl}/latest-news`, { params });
      const articles = response.data.news;

      return articles.map((article: CurrentsArticle, index: number) => ({
        id: `currents-${article.id}`,
        platform: 'currents',
        title: article.title,
        summary: this.generateSummary(article),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `Currents API - ${article.category.join(', ')}`,
        keywords: this.extractKeywords(article.title, article.description)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch Currents latest news', error);
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
          apiKey: this.apiKey,
          keywords: query,
          limit
        }
      });

      const articles = response.data.news;

      return articles.map((article: CurrentsArticle, index: number) => ({
        id: `currents-search-${article.id}`,
        platform: 'currents',
        title: article.title,
        summary: this.generateSummary(article, query),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `Currents Search - ${article.category.join(', ')}`,
        keywords: this.extractKeywords(article.title, article.description, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search Currents news', error);
      return [];
    }
  }

  async getNewsByCategory(category: string, limit: number = 15): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/latest-news`, {
        params: {
          apiKey: this.apiKey,
          category,
          limit
        }
      });

      const articles = response.data.news;

      return articles.map((article: CurrentsArticle, index: number) => ({
        id: `currents-category-${article.id}`,
        platform: 'currents',
        title: article.title,
        summary: this.generateSummary(article, `${category} category`),
        url: article.url,
        score: this.calculateNewsScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `Currents - ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        keywords: this.extractKeywords(article.title, article.description, category)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch news by category', error);
      return [];
    }
  }

  private generateSummary(article: CurrentsArticle, context?: string): string {
    const parts = [];
    
    if (context) {
      parts.push(`${context}`);
    }
    
    if (article.description) {
      parts.push(article.description.length > 150 ? 
        article.description.substring(0, 150) + '...' : 
        article.description);
    }
    
    if (article.sentiment) {
      const sentiment = article.sentiment.polarity > 0.1 ? 'positive' : 
                       article.sentiment.polarity < -0.1 ? 'negative' : 'neutral';
      parts.push(`Sentiment: ${sentiment}`);
    }
    
    if (article.category && article.category.length > 0) {
      parts.push(`Categories: ${article.category.slice(0, 2).join(', ')}`);
    }

    return parts.join('. ');
  }

  private calculateNewsScore(article: CurrentsArticle, position: number): number {
    let score = 85 - (position * 2);
    
    // Recent articles get higher scores
    const hoursAgo = (Date.now() - new Date(article.published).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 1) score += 30;
    else if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    
    // Boost for business/tech categories
    const importantCategories = ['business', 'technology', 'science', 'finance', 'politics'];
    if (article.category && article.category.some(cat => 
      importantCategories.includes(cat.toLowerCase()))) {
      score += 15;
    }
    
    // Boost for sentiment analysis availability
    if (article.sentiment) {
      score += 10;
      
      // Boost for strongly emotional content (tends to be more engaging)
      const sentimentStrength = Math.abs(article.sentiment.polarity);
      if (sentimentStrength > 0.5) score += 10;
      else if (sentimentStrength > 0.3) score += 5;
    }
    
    // Boost for articles with images
    if (article.image) {
      score += 5;
    }
    
    // Boost for articles with authors
    if (article.author) {
      score += 5;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private estimateEngagement(article: CurrentsArticle): number {
    const baseEngagement = 1200;
    const hoursAgo = (Date.now() - new Date(article.published).getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 1) multiplier = 4;
    else if (hoursAgo < 6) multiplier = 3;
    else if (hoursAgo < 24) multiplier = 2;
    else if (hoursAgo < 72) multiplier = 1.5;
    
    // Boost engagement for emotional content
    if (article.sentiment) {
      const sentimentStrength = Math.abs(article.sentiment.polarity);
      multiplier *= (1 + sentimentStrength);
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

    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'says', 'said', 'news', 'report', 'according'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackNews(): TrendingTopic[] {
    return [
      {
        id: 'currents-fallback-1',
        platform: 'currents',
        title: 'Currents API Integration Ready',
        summary: 'Configure Currents API key to fetch real-time news with sentiment analysis and categorization',
        url: 'https://currentsapi.services/',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['currents', 'news', 'api', 'sentiment', 'categorization']
      }
    ];
  }
}

export const createCurrentsService = (apiKey?: string): CurrentsService | null => {
  return new CurrentsService(apiKey);
};