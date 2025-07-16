import axios from 'axios';
import type { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  author: string;
  permalink: string;
  ups: number;
  downs: number;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export class RedditService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private clientId: string,
    private clientSecret: string
  ) {}

  async authenticate(): Promise<void> {
    try {
      // Check if token is still valid (with 5 minute buffer)
      if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
        return;
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Strategic-Analysis-Platform:1.0.0'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      debugLogger.info('Reddit API authenticated successfully');
    } catch (error) {
      debugLogger.error('Reddit authentication failed:', error);
      throw new Error('Failed to authenticate with Reddit API');
    }
  }

  async getTrendingPosts(subreddits: string[] = ['marketing', 'business', 'entrepreneur', 'socialmedia']): Promise<TrendingTopic[]> {
    try {
      await this.authenticate();

      const allPosts: TrendingTopic[] = [];

      for (const subreddit of subreddits) {
        const posts = await this.getSubredditPosts(subreddit, 'hot', 5);
        allPosts.push(...posts);
      }

      // Sort by score and return top 10
      return allPosts
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10);
    } catch (error) {
      debugLogger.error('Error fetching Reddit trending posts:', error);
      return [];
    }
  }

  async getSubredditPosts(subreddit: string, sort: 'hot' | 'top' | 'new' = 'hot', limit: number = 10): Promise<TrendingTopic[]> {
    try {
      await this.authenticate();

      const response = await axios.get<RedditResponse>(
        `https://oauth.reddit.com/r/${subreddit}/${sort}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': 'Strategic-Analysis-Platform:1.0.0'
          },
          params: {
            limit,
            t: sort === 'top' ? 'day' : undefined
          }
        }
      );

      const posts = response.data.data.children.map((child, index) => {
        const post = child.data;
        return this.formatRedditPost(post, index);
      });

      return posts;
    } catch (error) {
      debugLogger.error(`Error fetching posts from r/${subreddit}:`, error);
      return [];
    }
  }

  async searchPosts(query: string, subreddit?: string, limit: number = 10): Promise<TrendingTopic[]> {
    try {
      await this.authenticate();

      const searchUrl = subreddit 
        ? `https://oauth.reddit.com/r/${subreddit}/search`
        : 'https://oauth.reddit.com/search';

      const response = await axios.get<RedditResponse>(searchUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'User-Agent': 'Strategic-Analysis-Platform:1.0.0'
        },
        params: {
          q: query,
          sort: 'relevance',
          t: 'week',
          limit,
          restrict_sr: subreddit ? 'true' : 'false'
        }
      });

      const posts = response.data.data.children.map((child, index) => {
        const post = child.data;
        return this.formatRedditPost(post, index, query);
      });

      return posts;
    } catch (error) {
      debugLogger.error('Error searching Reddit posts:', error);
      return [];
    }
  }

  private formatRedditPost(post: RedditPost, index: number, searchQuery?: string): TrendingTopic {
    // Create a summary from the post content
    let summary = post.selftext || post.title;
    if (summary.length > 200) {
      summary = summary.substring(0, 200) + '...';
    }

    // Calculate engagement score
    const engagement = post.score + post.num_comments;
    
    // Calculate trending score based on engagement and recency
    const hoursAgo = (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
    const recencyMultiplier = Math.max(0.1, 1 - (hoursAgo / 24)); // Reduce score for older posts
    const trendingScore = Math.min(100, Math.round((engagement * recencyMultiplier) / 10));

    return {
      id: `reddit-${post.id}`,
      platform: 'reddit',
      title: post.title,
      summary: summary || 'No description available',
      url: `https://reddit.com${post.permalink}`,
      score: trendingScore,
      fetchedAt: new Date().toISOString(),
      engagement,
      source: `r/${post.subreddit}`,
      keywords: this.extractKeywords(post.title, searchQuery)
    };
  }

  private extractKeywords(title: string, searchQuery?: string): string[] {
    // Basic keyword extraction from title
    const keywords = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);

    if (searchQuery) {
      keywords.unshift(searchQuery);
    }

    return [...new Set(keywords)]; // Remove duplicates
  }
}

export const createRedditService = (clientId?: string, clientSecret?: string): RedditService | null => {
  if (!clientId || !clientSecret) {
    debugLogger.warn('Reddit API credentials not provided');
    return null;
  }
  
  return new RedditService(clientId, clientSecret);
};