import axios from 'axios';
import type { TrendingTopic } from './trends';

interface TwitterTrend {
  name: string;
  url: string;
  promoted_content: null;
  query: string;
  tweet_volume: number | null;
}

interface TwitterTrendResponse {
  trends: TwitterTrend[];
  as_of: string;
  created_at: string;
  locations: Array<{
    name: string;
    woeid: number;
  }>;
}

export class TwitterService {
  constructor(private bearerToken: string) {}

  async getTrendingTopics(woeid: number = 1): Promise<TrendingTopic[]> {
    try {
      // Note: Twitter API v1.1 trends endpoint requires OAuth 1.0a
      // For now, we'll use a different approach with search tweets
      const trends = await this.searchTrendingHashtags();
      return trends;
    } catch (error) {
      console.error('Error fetching Twitter trends:', error);
      return [];
    }
  }

  async searchTrendingHashtags(): Promise<TrendingTopic[]> {
    try {
      // Search for trending marketing and business hashtags
      const hashtags = [
        '#marketing',
        '#business',
        '#entrepreneur',
        '#socialmedia',
        '#digitalmarketing',
        '#AI',
        '#startup',
        '#innovation'
      ];

      const allTweets: TrendingTopic[] = [];

      for (const hashtag of hashtags.slice(0, 4)) { // Limit to avoid rate limits
        const tweets = await this.searchTweets(hashtag, 5);
        allTweets.push(...tweets);
      }

      // Sort by engagement and return top 10
      return allTweets
        .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error searching trending hashtags:', error);
      return [];
    }
  }

  async searchTweets(query: string, maxResults: number = 10): Promise<TrendingTopic[]> {
    try {
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'User-Agent': 'Strategic-Analysis-Platform:1.0.0'
        },
        params: {
          query: `${query} -is:retweet`,
          max_results: maxResults,
          'tweet.fields': 'author_id,created_at,public_metrics,context_annotations',
          'user.fields': 'username,verified',
          expansions: 'author_id'
        }
      });

      const tweets = response.data.data || [];
      const users = response.data.includes?.users || [];

      return tweets.map((tweet: any, index: number) => {
        const author = users.find((user: any) => user.id === tweet.author_id);
        const metrics = tweet.public_metrics || {};
        const engagement = (metrics.retweet_count || 0) + 
                          (metrics.like_count || 0) + 
                          (metrics.reply_count || 0) + 
                          (metrics.quote_count || 0);

        return {
          id: `twitter-${tweet.id}`,
          platform: 'twitter',
          title: this.extractTweetTitle(tweet.text),
          summary: this.cleanTweetText(tweet.text),
          url: `https://twitter.com/${author?.username || 'unknown'}/status/${tweet.id}`,
          score: this.calculateTweetScore(engagement, tweet.created_at),
          fetchedAt: new Date().toISOString(),
          engagement,
          source: `@${author?.username || 'unknown'}${author?.verified ? ' ✓' : ''}`,
          keywords: this.extractHashtags(tweet.text)
        };
      });
    } catch (error) {
      console.error('Error searching tweets:', error);
      return [];
    }
  }

  async getTrendingTopicsByLocation(location: string = 'worldwide'): Promise<TrendingTopic[]> {
    try {
      // Map location to WOEID (Where On Earth ID)
      const woeidMap: { [key: string]: number } = {
        'worldwide': 1,
        'united states': 23424977,
        'united kingdom': 23424975,
        'canada': 23424775,
        'australia': 23424748
      };

      const woeid = woeidMap[location.toLowerCase()] || 1;
      
      // Note: This endpoint requires OAuth 1.0a, not Bearer token
      // For now, we'll use search approach
      return await this.searchTrendingHashtags();
    } catch (error) {
      console.error('Error fetching trending topics by location:', error);
      return [];
    }
  }

  private extractTweetTitle(text: string): string {
    // Extract the first sentence or up to 100 characters as title
    const sentences = text.split(/[.!?]+/);
    const title = sentences[0] || text;
    
    return title.length > 100 
      ? title.substring(0, 100) + '...' 
      : title;
  }

  private cleanTweetText(text: string): string {
    // Remove URLs, mentions, and excessive whitespace
    return text
      .replace(/https?:\/\/\S+/g, '') // Remove URLs
      .replace(/@\w+/g, '') // Remove mentions
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private extractHashtags(text: string): string[] {
    const hashtags = text.match(/#\w+/g) || [];
    return hashtags.map(tag => tag.toLowerCase()).slice(0, 5);
  }

  private calculateTweetScore(engagement: number, createdAt: string): number {
    // Calculate score based on engagement and recency
    const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    const recencyMultiplier = Math.max(0.1, 1 - (hoursAgo / 24));
    
    // Normalize engagement to 0-100 scale
    const engagementScore = Math.min(100, engagement / 10);
    
    return Math.round(engagementScore * recencyMultiplier);
  }
}

export const createTwitterService = (bearerToken?: string): TwitterService | null => {
  if (!bearerToken) {
    console.warn('Twitter API bearer token not provided');
    return null;
  }
  
  return new TwitterService(bearerToken);
};