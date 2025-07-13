import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface YouTubeVideo {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
    publishTime: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubeResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: YouTubeVideo[];
}

export class YouTubeService {
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';
  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getTrendingVideos(query?: string): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('YouTube API key not provided, returning fallback data');
      return this.getFallbackVideos();
    }

    try {
      const searchQuery = query || 'business marketing strategy 2025';
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          order: 'relevance',
          publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxResults: 10,
          key: this.apiKey
        }
      });

      const youtubeData: YouTubeResponse = response.data;

      // Get video statistics for better scoring
      const videoIds = youtubeData.items.map(item => item.id.videoId).join(',');
      const statsResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'statistics',
          id: videoIds,
          key: this.apiKey
        }
      });

      const videoStats = statsResponse.data.items.reduce((acc: any, item: any) => {
        acc[item.id] = item.statistics;
        return acc;
      }, {});

      return youtubeData.items.map((video, index) => {
        const stats = videoStats[video.id.videoId] || {};
        return {
          id: `youtube-${video.id.videoId}`,
          platform: 'youtube',
          title: video.snippet.title,
          summary: this.truncateDescription(video.snippet.description),
          url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          score: this.calculateVideoScore(video, stats),
          fetchedAt: new Date().toISOString(),
          engagement: this.calculateEngagement(stats),
          source: video.snippet.channelTitle,
          keywords: this.extractKeywords(video.snippet.title)
        };
      });

    } catch (error: any) {
      debugLogger.error('Failed to fetch YouTube data', error);
      
      // Check if it's an API key permission issue
      if (error.response?.status === 403 && error.response?.data?.error?.reason === 'API_KEY_SERVICE_BLOCKED') {
        debugLogger.warn('YouTube API key blocked - requires additional permissions for search API');
        return this.getBlockedAPIFallback();
      }
      
      return this.getFallbackVideos();
    }
  }

  async searchVideos(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('YouTube API key not provided for search, returning fallback data');
      return this.getFallbackVideos();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          order: 'relevance',
          maxResults: limit,
          key: this.apiKey
        }
      });

      const youtubeData: YouTubeResponse = response.data;

      return youtubeData.items.map((video, index) => ({
        id: `youtube-search-${video.id.videoId}`,
        platform: 'youtube',
        title: video.snippet.title,
        summary: this.truncateDescription(video.snippet.description),
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        score: this.calculateVideoScore(video),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(video),
        source: video.snippet.channelTitle,
        keywords: this.extractKeywords(video.snippet.title)
      }));

    } catch (error) {
      debugLogger.error('Failed to search YouTube videos', error);
      return [];
    }
  }

  private calculateVideoScore(video: YouTubeVideo, stats?: any): number {
    let score = 50; // Base score
    
    // Recent videos get higher scores
    const hoursAgo = (Date.now() - new Date(video.snippet.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) score += 20;
    else if (hoursAgo < 72) score += 15;
    else if (hoursAgo < 168) score += 10; // 1 week
    
    // Boost for business/marketing channels
    const businessKeywords = ['business', 'marketing', 'strategy', 'entrepreneur', 'startup', 'leadership'];
    if (businessKeywords.some(keyword => 
      video.snippet.channelTitle.toLowerCase().includes(keyword) ||
      video.snippet.title.toLowerCase().includes(keyword)
    )) {
      score += 15;
    }
    
    // Boost based on engagement if available
    if (stats?.viewCount) {
      const views = parseInt(stats.viewCount);
      if (views > 100000) score += 15;
      else if (views > 10000) score += 10;
      else if (views > 1000) score += 5;
    }
    
    return Math.min(score, 100);
  }

  private calculateEngagement(stats: any): number {
    if (!stats?.viewCount) return this.estimateEngagement();
    
    const views = parseInt(stats.viewCount) || 0;
    const likes = parseInt(stats.likeCount) || 0;
    const comments = parseInt(stats.commentCount) || 0;
    
    // Engagement score based on likes + comments relative to views
    const engagementRate = (likes + comments * 2) / Math.max(views, 1);
    return Math.floor(views * engagementRate * 100);
  }

  private estimateEngagement(video?: YouTubeVideo): number {
    // Estimate engagement based on channel and recency
    const baseEngagement = 2000;
    
    if (!video) return baseEngagement;
    
    const hoursAgo = (Date.now() - new Date(video.snippet.publishedAt).getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 24) multiplier = 2;
    else if (hoursAgo < 72) multiplier = 1.5;
    
    return Math.floor(baseEngagement * multiplier * (Math.random() * 0.5 + 0.75));
  }

  private truncateDescription(description: string): string {
    if (!description) return '';
    return description.length > 200 ? description.substring(0, 200) + '...' : description;
  }

  private extractKeywords(title: string): string[] {
    if (!title) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'how', 'why', 'what', 'when', 'where', 'this', 'that', 'these', 'those', 'your', 'you', 'my', 'me', 'we', 'us'];
    
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackVideos(): TrendingTopic[] {
    return [
      {
        id: 'youtube-fallback-1',
        platform: 'youtube',
        title: 'YouTube Data API Integration Ready',
        summary: 'Configure YouTube API key to fetch trending business and marketing videos',
        url: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['youtube', 'api', 'setup', 'business', 'marketing']
      }
    ];
  }

  private getBlockedAPIFallback(): TrendingTopic[] {
    return [
      {
        id: 'youtube-blocked-1',
        platform: 'youtube',
        title: 'YouTube Search API Requires Additional Permissions',
        summary: 'Current API key has restrictions. YouTube Search API requires quota approval for production use.',
        url: 'https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'API Status',
        keywords: ['youtube', 'api', 'permissions', 'quota', 'approval']
      },
      {
        id: 'youtube-blocked-2',
        platform: 'youtube',
        title: 'Alternative: YouTube Trending Categories Available',
        summary: 'Consider using YouTube Trending Categories API which has fewer restrictions than Search API.',
        url: 'https://developers.google.com/youtube/v3/docs/videoCategories/list',
        score: 2,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'API Alternative',
        keywords: ['youtube', 'trending', 'categories', 'alternative']
      }
    ];
  }
}

export const createYouTubeService = (apiKey?: string): YouTubeService | null => {
  return new YouTubeService(apiKey);
};