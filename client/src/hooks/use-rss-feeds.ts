import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export function useRssFeeds(category?: string) {
  return useQuery<{ feeds: RssFeed[] }>({
    queryKey: ['/api/rss-feeds', category],
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    queryFn: async () => {
      const url = category ? `/api/rss-feeds?category=${category}` : '/api/rss-feeds';
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch RSS feeds');
      }
      return response.json();
    },
  });
}

export function useRssArticles(category: string, limit = 10) {
  return useQuery<{ articles: RssArticle[] }>({
    queryKey: ['/api/rss-feeds/category', category, 'articles', limit],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    queryFn: async () => {
      const response = await fetch(`/api/rss-feeds/category/${category}/articles?limit=${limit}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch RSS articles');
      }
      return response.json();
    },
  });
}

export function useRssFeedStats() {
  return useQuery<RssFeedStats>({
    queryKey: ['/api/rss-feeds/stats'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    queryFn: async () => {
      const response = await fetch('/api/rss-feeds/stats', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch RSS feed stats');
      }
      return response.json();
    },
  });
}

export function useAddRssFeed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, rssUrl, category, fetchFrequency }: {
      name: string;
      rssUrl: string;
      category: 'client' | 'custom' | 'project';
      fetchFrequency?: number;
    }) => {
      const response = await fetch('/api/rss-feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, rssUrl, category, fetchFrequency }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add RSS feed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all RSS feed queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/rss-feeds'] });
    },
  });
}

export function useRefreshFeeds() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/rss-feeds/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh feeds');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all RSS feed and article queries
      queryClient.invalidateQueries({ queryKey: ['/api/rss-feeds'] });
    },
  });
}