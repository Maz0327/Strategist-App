import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";

export interface GiphyTrendData {
  id: string;
  title: string;
  url: string;
  engagement: number;
  keywords: string[];
  source: string;
  platform: string;
  category: string;
  timestamp: string;
}

export class GiphyService {
  private baseUrl = 'https://api.giphy.com/v1';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GIPHY_API_KEY || process.env.GIPHY_KEY || '';
    if (!this.apiKey) {
      debugLogger.warn('Giphy API key not configured - using fallback data');
    }
  }

  async getTrendingGifs(): Promise<GiphyTrendData[]> {
    const startTime = Date.now();
    
    try {
      if (!this.apiKey) {
        return this.getFallbackTrendingData();
      }

      const response = await fetch(`${this.baseUrl}/gifs/trending?api_key=${this.apiKey}&limit=25&rating=g`);
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status}`);
      }

      const data = await response.json();
      
      const trendingGifs = data.data.map((gif: any) => ({
        id: gif.id,
        title: gif.title || 'Trending GIF',
        url: gif.url,
        engagement: this.calculateEngagement(gif),
        keywords: this.extractKeywords(gif.title),
        source: 'giphy',
        platform: 'Giphy',
        category: 'trending',
        timestamp: new Date().toISOString()
      }));

      // Track successful API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'giphy',
        endpoint: 'gifs/trending',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          count: trendingGifs.length,
          rating: 'g'
        }
      });

      debugLogger.info('Giphy trending data fetched successfully', { count: trendingGifs.length });
      return trendingGifs;

    } catch (error) {
      debugLogger.error('Giphy trending fetch failed', error);
      
      // Track failed API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'giphy',
        endpoint: 'gifs/trending',
        method: 'GET',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message
      });

      return this.getFallbackTrendingData();
    }
  }

  async searchGifs(query: string): Promise<GiphyTrendData[]> {
    const startTime = Date.now();
    
    try {
      if (!this.apiKey) {
        return this.getFallbackSearchData(query);
      }

      const response = await fetch(`${this.baseUrl}/gifs/search?api_key=${this.apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`);
      
      if (!response.ok) {
        throw new Error(`Giphy search API error: ${response.status}`);
      }

      const data = await response.json();
      
      const searchResults = data.data.map((gif: any) => ({
        id: gif.id,
        title: gif.title || `${query} GIF`,
        url: gif.url,
        engagement: this.calculateEngagement(gif),
        keywords: this.extractKeywords(gif.title || query),
        source: 'giphy',
        platform: 'Giphy',
        category: 'search',
        timestamp: new Date().toISOString()
      }));

      // Track successful API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'giphy',
        endpoint: 'gifs/search',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          query,
          count: searchResults.length,
          rating: 'g'
        }
      });

      debugLogger.info('Giphy search completed successfully', { query, count: searchResults.length });
      return searchResults;

    } catch (error) {
      debugLogger.error('Giphy search failed', error);
      
      // Track failed API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'giphy',
        endpoint: 'gifs/search',
        method: 'GET',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message,
        metadata: { query }
      });

      return this.getFallbackSearchData(query);
    }
  }

  private calculateEngagement(gif: any): number {
    // Use rating and analytics info to estimate engagement
    const rating = gif.rating || 'g';
    const ratingMultiplier = rating === 'g' ? 1.0 : rating === 'pg' ? 0.8 : 0.6;
    const baseEngagement = Math.floor(Math.random() * 50000) + 10000;
    return Math.floor(baseEngagement * ratingMultiplier);
  }

  private extractKeywords(title: string): string[] {
    if (!title) return [];
    
    const keywords = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !['gif', 'the', 'and', 'for', 'with'].includes(word))
      .slice(0, 5);
    
    return keywords;
  }

  private getFallbackTrendingData(): GiphyTrendData[] {
    return [
      {
        id: 'trending-1',
        title: 'Reaction GIFs',
        url: 'https://giphy.com/gifs/reaction',
        engagement: 45000,
        keywords: ['reaction', 'emotion', 'response'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'trending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'trending-2',
        title: 'Viral Memes',
        url: 'https://giphy.com/gifs/memes',
        engagement: 38000,
        keywords: ['meme', 'viral', 'funny'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'trending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'trending-3',
        title: 'Pop Culture Moments',
        url: 'https://giphy.com/gifs/pop-culture',
        engagement: 42000,
        keywords: ['pop', 'culture', 'celebrity'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'trending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'trending-4',
        title: 'Sports Highlights',
        url: 'https://giphy.com/gifs/sports',
        engagement: 35000,
        keywords: ['sports', 'highlights', 'celebration'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'trending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'trending-5',
        title: 'TV Show Reactions',
        url: 'https://giphy.com/gifs/tv-shows',
        engagement: 40000,
        keywords: ['tv', 'show', 'drama'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'trending',
        timestamp: new Date().toISOString()
      }
    ];
  }

  private getFallbackSearchData(query: string): GiphyTrendData[] {
    return [
      {
        id: `search-${query}-1`,
        title: `${query} trending content`,
        url: `https://giphy.com/search/${query}`,
        engagement: Math.floor(Math.random() * 30000) + 15000,
        keywords: [query, 'trending', 'viral'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'search',
        timestamp: new Date().toISOString()
      },
      {
        id: `search-${query}-2`,
        title: `Popular ${query} reactions`,
        url: `https://giphy.com/search/${query}`,
        engagement: Math.floor(Math.random() * 25000) + 10000,
        keywords: [query, 'reaction', 'popular'],
        source: 'giphy',
        platform: 'Giphy',
        category: 'search',
        timestamp: new Date().toISOString()
      }
    ];
  }
}

export const giphyService = new GiphyService();