// MVP SIMPLIFIED RSS Service - Basic RSS functionality for future enhancement
import { debugLogger } from './debug-logger';

export interface RssFeed {
  id: number;
  name: string;
  rssUrl: string;
  category: 'client' | 'custom' | 'project';
  status: 'active' | 'inactive' | 'error';
  lastFetched?: Date;
  errorCount: number;
  lastError?: string;
  createdAt: Date;
}

export interface RssArticle {
  id: number;
  feedId: number;
  title: string;
  content?: string;
  url: string;
  summary?: string;
  author?: string;
  publishedAt?: Date;
  extractedAt: Date;
  categories?: string[];
}

class SimpleRSSService {
  
  async getFeeds(): Promise<RssFeed[]> {
    debugLogger.info('MVP: RSS feeds temporarily disabled - returning empty array');
    return [];
  }

  async getFeedArticles(feedId: number): Promise<RssArticle[]> {
    debugLogger.info('MVP: RSS articles temporarily disabled - returning empty array', { feedId });
    return [];
  }

  async createFeed(feedData: Partial<RssFeed>): Promise<RssFeed> {
    debugLogger.info('MVP: RSS feed creation temporarily disabled', feedData);
    throw new Error('RSS functionality temporarily disabled in MVP');
  }

  async updateFeed(feedId: number, updates: Partial<RssFeed>): Promise<RssFeed> {
    debugLogger.info('MVP: RSS feed updates temporarily disabled', { feedId, updates });
    throw new Error('RSS functionality temporarily disabled in MVP');
  }

  async deleteFeed(feedId: number): Promise<boolean> {
    debugLogger.info('MVP: RSS feed deletion temporarily disabled', { feedId });
    return false;
  }

  async getFeedStats() {
    return {
      totalFeeds: 0,
      activeFeeds: 0,
      totalArticles: 0,
      recentArticles: 0,
      categoryBreakdown: []
    };
  }
}

export const rssService = new SimpleRSSService();