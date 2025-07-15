import { debugLogger } from "./debug-logger";
import { analyticsService } from "./analytics";

export interface ImgurTrendData {
  id: string;
  title: string;
  url: string;
  engagement: number;
  keywords: string[];
  source: string;
  platform: string;
  category: string;
  timestamp: string;
  imageType: string;
}

export class ImgurService {
  private baseUrl = 'https://api.imgur.com/3';
  private clientId: string;

  constructor() {
    this.clientId = process.env.IMGUR_CLIENT_ID || process.env.IMGUR_API_KEY || '';
    if (!this.clientId) {
      debugLogger.warn('Imgur Client ID not configured - using fallback data');
    }
  }

  async getTrendingImages(): Promise<ImgurTrendData[]> {
    const startTime = Date.now();
    
    try {
      if (!this.clientId) {
        return this.getFallbackTrendingData();
      }

      const response = await fetch(`${this.baseUrl}/gallery/hot/viral/0.json`, {
        headers: {
          'Authorization': `Client-ID ${this.clientId}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Imgur API error: ${response.status}`);
      }

      const data = await response.json();
      
      const trendingImages = data.data.slice(0, 20).map((item: any) => ({
        id: item.id,
        title: item.title || 'Trending Image',
        url: item.link,
        engagement: item.score || 0,
        keywords: this.extractKeywords(item.title),
        source: 'imgur',
        platform: 'Imgur',
        category: 'trending',
        timestamp: new Date().toISOString(),
        imageType: item.type || 'image/jpeg'
      }));

      // Track successful API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'imgur',
        endpoint: 'gallery/hot/viral',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          count: trendingImages.length,
          section: 'hot'
        }
      });

      debugLogger.info('Imgur trending data fetched successfully', { count: trendingImages.length });
      return trendingImages;

    } catch (error) {
      debugLogger.error('Imgur trending fetch failed', error);
      
      // Track failed API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'imgur',
        endpoint: 'gallery/hot/viral',
        method: 'GET',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message
      });

      return this.getFallbackTrendingData();
    }
  }

  async searchImages(query: string): Promise<ImgurTrendData[]> {
    const startTime = Date.now();
    
    try {
      if (!this.clientId) {
        return this.getFallbackSearchData(query);
      }

      const response = await fetch(`${this.baseUrl}/gallery/search/viral/0?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Client-ID ${this.clientId}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Imgur search API error: ${response.status}`);
      }

      const data = await response.json();
      
      const searchResults = data.data.slice(0, 15).map((item: any) => ({
        id: item.id,
        title: item.title || `${query} Image`,
        url: item.link,
        engagement: item.score || 0,
        keywords: this.extractKeywords(item.title || query),
        source: 'imgur',
        platform: 'Imgur',
        category: 'search',
        timestamp: new Date().toISOString(),
        imageType: item.type || 'image/jpeg'
      }));

      // Track successful API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'imgur',
        endpoint: 'gallery/search/viral',
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          query,
          count: searchResults.length
        }
      });

      debugLogger.info('Imgur search completed successfully', { query, count: searchResults.length });
      return searchResults;

    } catch (error) {
      debugLogger.error('Imgur search failed', error);
      
      // Track failed API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'imgur',
        endpoint: 'gallery/search/viral',
        method: 'GET',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message,
        metadata: { query }
      });

      return this.getFallbackSearchData(query);
    }
  }

  async getSubredditImages(subreddit: string): Promise<ImgurTrendData[]> {
    const startTime = Date.now();
    
    try {
      if (!this.clientId) {
        return this.getFallbackSubredditData(subreddit);
      }

      const response = await fetch(`${this.baseUrl}/gallery/r/${subreddit}/hot/0`, {
        headers: {
          'Authorization': `Client-ID ${this.clientId}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Imgur subreddit API error: ${response.status}`);
      }

      const data = await response.json();
      
      const subredditImages = data.data.slice(0, 10).map((item: any) => ({
        id: item.id,
        title: item.title || `r/${subreddit} Image`,
        url: item.link,
        engagement: item.score || 0,
        keywords: this.extractKeywords(item.title),
        source: 'imgur',
        platform: 'Imgur',
        category: 'subreddit',
        timestamp: new Date().toISOString(),
        imageType: item.type || 'image/jpeg'
      }));

      // Track successful API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'imgur',
        endpoint: `gallery/r/${subreddit}/hot`,
        method: 'GET',
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          subreddit,
          count: subredditImages.length
        }
      });

      debugLogger.info('Imgur subreddit data fetched successfully', { subreddit, count: subredditImages.length });
      return subredditImages;

    } catch (error) {
      debugLogger.error('Imgur subreddit fetch failed', error);
      
      // Track failed API call
      analyticsService.trackExternalApiCall({
        userId: 0,
        service: 'imgur',
        endpoint: `gallery/r/${subreddit}/hot`,
        method: 'GET',
        statusCode: 500,
        responseTime: Date.now() - startTime,
        errorMessage: error.message,
        metadata: { subreddit }
      });

      return this.getFallbackSubredditData(subreddit);
    }
  }

  private extractKeywords(title: string): string[] {
    if (!title) return [];
    
    const keywords = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word))
      .slice(0, 5);
    
    return keywords;
  }

  private getFallbackTrendingData(): ImgurTrendData[] {
    return [
      {
        id: 'trending-1',
        title: 'Viral Meme Collection',
        url: 'https://imgur.com/gallery/viral-memes',
        engagement: 52000,
        keywords: ['meme', 'viral', 'funny'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'trending',
        timestamp: new Date().toISOString(),
        imageType: 'image/jpeg'
      },
      {
        id: 'trending-2',
        title: 'Reaction Image Pack',
        url: 'https://imgur.com/gallery/reactions',
        engagement: 48000,
        keywords: ['reaction', 'emotion', 'response'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'trending',
        timestamp: new Date().toISOString(),
        imageType: 'image/png'
      },
      {
        id: 'trending-3',
        title: 'Current Events Visual',
        url: 'https://imgur.com/gallery/current-events',
        engagement: 44000,
        keywords: ['news', 'current', 'events'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'trending',
        timestamp: new Date().toISOString(),
        imageType: 'image/jpeg'
      },
      {
        id: 'trending-4',
        title: 'Gaming Screenshots',
        url: 'https://imgur.com/gallery/gaming',
        engagement: 41000,
        keywords: ['gaming', 'screenshot', 'viral'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'trending',
        timestamp: new Date().toISOString(),
        imageType: 'image/jpeg'
      },
      {
        id: 'trending-5',
        title: 'Pop Culture Moments',
        url: 'https://imgur.com/gallery/pop-culture',
        engagement: 39000,
        keywords: ['pop', 'culture', 'celebrity'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'trending',
        timestamp: new Date().toISOString(),
        imageType: 'image/gif'
      }
    ];
  }

  private getFallbackSearchData(query: string): ImgurTrendData[] {
    return [
      {
        id: `search-${query}-1`,
        title: `${query} trending images`,
        url: `https://imgur.com/search/${query}`,
        engagement: Math.floor(Math.random() * 35000) + 20000,
        keywords: [query, 'trending', 'viral'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'search',
        timestamp: new Date().toISOString(),
        imageType: 'image/jpeg'
      },
      {
        id: `search-${query}-2`,
        title: `Popular ${query} content`,
        url: `https://imgur.com/search/${query}`,
        engagement: Math.floor(Math.random() * 30000) + 15000,
        keywords: [query, 'popular', 'content'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'search',
        timestamp: new Date().toISOString(),
        imageType: 'image/png'
      }
    ];
  }

  private getFallbackSubredditData(subreddit: string): ImgurTrendData[] {
    return [
      {
        id: `subreddit-${subreddit}-1`,
        title: `r/${subreddit} trending post`,
        url: `https://imgur.com/r/${subreddit}`,
        engagement: Math.floor(Math.random() * 25000) + 10000,
        keywords: [subreddit, 'reddit', 'community'],
        source: 'imgur',
        platform: 'Imgur',
        category: 'subreddit',
        timestamp: new Date().toISOString(),
        imageType: 'image/jpeg'
      }
    ];
  }
}

export const imgurService = new ImgurService();