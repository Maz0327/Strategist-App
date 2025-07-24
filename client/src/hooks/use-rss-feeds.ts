import { useQuery } from "@tanstack/react-query";

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  rssUrl: string;
  category: string;
  status: 'active' | 'inactive';
  lastUpdated?: string;
  lastFetched?: string;
  errorCount?: number;
}

interface RSSArticle {
  id: string;
  title: string;
  url: string;
  pubDate: string;
  publishedAt: string;
  description: string;
  feedId: string;
  feedName: string;
  author?: string;
}

interface RSSFeedsResponse {
  feeds: RSSFeed[];
}

interface RSSArticlesResponse {
  articles: RSSArticle[];
}

// Hook to fetch RSS feeds by category
export function useRssFeeds(category: 'client' | 'custom' | 'project') {
  return useQuery<RSSFeedsResponse>({
    queryKey: ['/api/rss/feeds', category],
    queryFn: async () => {
      // Return empty data for now to prevent errors
      return { feeds: [] };
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch RSS articles by category with limit
export function useRssArticles(category: 'client' | 'custom' | 'project', limit: number = 10) {
  return useQuery<RSSArticlesResponse>({
    queryKey: ['/api/rss/articles', category, limit],
    queryFn: async () => {
      // Return empty data for now to prevent errors
      return { articles: [] };
    },
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - articles update more frequently
  });
}

// Hook to fetch all RSS articles across categories
export function useAllRssArticles(limit: number = 20) {
  return useQuery<RSSArticlesResponse>({
    queryKey: ['/api/rss/articles/all', limit],
    queryFn: async () => {
      // Return empty data for now to prevent errors
      return { articles: [] };
    },
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
}

// Mock hook for adding RSS feeds - returns empty function to prevent errors
export function useAddRssFeed() {
  return {
    mutate: () => {},
    isLoading: false,
    error: null
  };
}