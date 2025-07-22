// MVP SIMPLIFIED RSS Hooks - Basic functionality temporarily disabled
import { useQuery } from '@tanstack/react-query';

interface RssFeed {
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

interface RssArticle {
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

interface RssFeedStats {
  totalFeeds: number;
  activeFeeds: number;
  totalArticles: number;
  recentArticles: number;
  categoryBreakdown: { category: string; count: number }[];
}

export function useRssFeeds() {
  return useQuery<RssFeed[]>({
    queryKey: ['/api/rss-feeds'],
    queryFn: async () => {
      console.log('MVP: RSS feeds temporarily disabled');
      return [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

export function useRssArticles(feedId?: number) {
  return useQuery<RssArticle[]>({
    queryKey: ['/api/rss-feeds', feedId, 'articles'],
    queryFn: async () => {
      console.log('MVP: RSS articles temporarily disabled');
      return [];
    },
    enabled: !!feedId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useRssFeedStats() {
  return useQuery<RssFeedStats>({
    queryKey: ['/api/rss-feeds/stats'],
    queryFn: async () => ({
      totalFeeds: 0,
      activeFeeds: 0,
      totalArticles: 0,
      recentArticles: 0,
      categoryBreakdown: []
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}