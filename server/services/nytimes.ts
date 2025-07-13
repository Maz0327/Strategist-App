import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface NYTimesArticle {
  section: string;
  subsection: string;
  title: string;
  abstract: string;
  url: string;
  uri: string;
  byline: string;
  item_type: string;
  updated_date: string;
  created_date: string;
  published_date: string;
  material_type_facet: string;
  kicker: string;
  des_facet: string[];
  org_facet: string[];
  per_facet: string[];
  geo_facet: string[];
  multimedia: Array<{
    url: string;
    format: string;
    height: number;
    width: number;
    type: string;
    subtype: string;
    caption: string;
    copyright: string;
  }>;
  short_url: string;
}

export class NYTimesService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.nytimes.com/svc';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getTopStories(section: string = 'business', limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('NYTimes API key not configured, returning fallback data');
      return this.getFallbackStories();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/topstories/v2/${section}.json`, {
        params: { 'api-key': this.apiKey }
      });

      const articles = response.data.results.slice(0, limit);

      return articles.map((article: NYTimesArticle, index: number) => ({
        id: `nytimes-${article.uri.split('/').pop()}`,
        platform: 'nytimes',
        title: article.title,
        summary: article.abstract || article.title,
        url: article.url,
        score: this.calculateArticleScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: `NY Times - ${article.section}`,
        keywords: this.extractKeywords(article.title, article.abstract, article.des_facet)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch NYTimes top stories', error);
      return this.getFallbackStories();
    }
  }

  async getMostPopular(period: number = 7): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackStories();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/mostpopular/v2/viewed/${period}.json`, {
        params: { 'api-key': this.apiKey }
      });

      const articles = response.data.results;

      return articles.map((article: any, index: number) => ({
        id: `nytimes-popular-${article.id}`,
        platform: 'nytimes',
        title: article.title,
        summary: article.abstract || article.title,
        url: article.url,
        score: this.calculatePopularityScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: article.views || this.estimateEngagement(article),
        source: `NY Times - Most Popular (${period}d)`,
        keywords: this.extractKeywords(article.title, article.abstract, article.des_facet)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch NYTimes most popular', error);
      return [];
    }
  }

  async searchArticles(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackStories();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search/v2/articlesearch.json`, {
        params: {
          'api-key': this.apiKey,
          q: query,
          sort: 'relevance',
          page: 0
        }
      });

      const articles = response.data.response.docs.slice(0, limit);

      return articles.map((article: any, index: number) => ({
        id: `nytimes-search-${article._id}`,
        platform: 'nytimes',
        title: article.headline.main,
        summary: article.abstract || article.snippet || `Search result for "${query}"`,
        url: article.web_url,
        score: this.calculateSearchScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: 'NY Times Search',
        keywords: this.extractKeywords(article.headline.main, article.abstract, [], query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search NYTimes articles', error);
      return [];
    }
  }

  async getWireStories(limit: number = 15): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/news/v3/content/nyt/business.json`, {
        params: { 'api-key': this.apiKey }
      });

      const articles = response.data.results.slice(0, limit);

      return articles.map((article: any, index: number) => ({
        id: `nytimes-wire-${article.slug_name}`,
        platform: 'nytimes',
        title: article.title,
        summary: article.abstract || article.title,
        url: article.url,
        score: this.calculateArticleScore(article, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(article),
        source: 'NY Times - Breaking News',
        keywords: this.extractKeywords(article.title, article.abstract)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch NYTimes wire stories', error);
      return [];
    }
  }

  private calculateArticleScore(article: NYTimesArticle, position: number): number {
    let score = 95 - (position * 3);
    
    // Recent articles get higher scores
    const hoursAgo = (Date.now() - new Date(article.published_date).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 2) score += 25;
    else if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    
    // Boost for important sections
    const importantSections = ['business', 'technology', 'politics', 'world'];
    if (importantSections.includes(article.section.toLowerCase())) {
      score += 15;
    }
    
    // Boost for multimedia content
    if (article.multimedia && article.multimedia.length > 0) {
      score += 10;
    }
    
    // Boost for articles with many tags/facets
    const totalFacets = (article.des_facet?.length || 0) + 
                       (article.org_facet?.length || 0) + 
                       (article.per_facet?.length || 0);
    if (totalFacets > 5) score += 10;
    else if (totalFacets > 3) score += 5;
    
    return Math.max(Math.min(score, 100), 1);
  }

  private calculatePopularityScore(article: any, position: number): number {
    let score = 100 - (position * 2);
    
    // Already popular, so base score is higher
    if (article.views > 100000) score += 20;
    else if (article.views > 50000) score += 15;
    else if (article.views > 10000) score += 10;
    
    return Math.max(Math.min(score, 100), 1);
  }

  private calculateSearchScore(article: any, position: number): number {
    let score = 80 - (position * 3);
    
    // Boost for recent articles
    if (article.pub_date) {
      const hoursAgo = (Date.now() - new Date(article.pub_date).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 24) score += 15;
      else if (hoursAgo < 72) score += 10;
      else if (hoursAgo < 168) score += 5;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private estimateEngagement(article: any): number {
    const baseEngagement = 2000;
    const publishedDate = new Date(article.published_date || article.pub_date || Date.now());
    const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 2) multiplier = 5;
    else if (hoursAgo < 6) multiplier = 3;
    else if (hoursAgo < 24) multiplier = 2;
    else if (hoursAgo < 72) multiplier = 1.5;
    
    return Math.floor(baseEngagement * multiplier * (Math.random() * 0.5 + 0.75));
  }

  private extractKeywords(title: string, abstract?: string, facets?: string[], query?: string): string[] {
    const keywords = [];
    
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 3));
    }
    
    if (abstract) {
      keywords.push(...abstract.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 5));
    }
    
    if (facets && facets.length > 0) {
      keywords.push(...facets.map(f => f.toLowerCase().replace(/[\s\-\(\)]+/g, ' ')).join(' ').split(' ').filter(w => w.length > 2));
    }
    
    if (query) {
      keywords.push(...query.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'says', 'said', 'new', 'york', 'times'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackStories(): TrendingTopic[] {
    return [
      {
        id: 'nytimes-fallback-1',
        platform: 'nytimes',
        title: 'NY Times API Integration Ready',
        summary: 'Configure NY Times API key to fetch top stories, most popular articles, and search results',
        url: 'https://developer.nytimes.com/',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['nytimes', 'news', 'api', 'journalism', 'stories']
      }
    ];
  }
}

export const createNYTimesService = (apiKey?: string): NYTimesService | null => {
  return new NYTimesService(apiKey);
};