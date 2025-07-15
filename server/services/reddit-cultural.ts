import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface RedditCulturalPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
  upvote_ratio: number;
  awards?: any[];
  flair_text?: string;
}

export class RedditCulturalService {
  private readonly baseUrl = 'https://www.reddit.com';
  private readonly userAgent = 'TrendingCulturalBot/1.0';

  async getCulturalTrends(limit: number = 20): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching cultural trends from Reddit');
      
      const culturalSubreddits = [
        'popculturechat',
        'OutOfTheLoop',
        'TrendingReddits',
        'SubredditDrama',
        'tiktokgossip',
        'Fauxmoi',
        'GenZ',
        'Millennials'
      ];

      const allPosts: TrendingTopic[] = [];

      for (const subreddit of culturalSubreddits) {
        try {
          const posts = await this.getSubredditTrends(subreddit, Math.ceil(limit / culturalSubreddits.length));
          allPosts.push(...posts);
        } catch (error) {
          debugLogger.warn(`Failed to fetch from r/${subreddit}:`, error);
        }
      }

      // Sort by score and take top results
      const sortedPosts = allPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      debugLogger.info(`Successfully fetched ${sortedPosts.length} cultural trends`);
      return sortedPosts;

    } catch (error) {
      debugLogger.error('Failed to fetch cultural trends', error);
      return this.getFallbackCulturalTrends();
    }
  }

  async getViralContent(limit: number = 15): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching viral content from Reddit');
      
      const viralSubreddits = [
        'viral',
        'InternetIsBeautiful',
        'nextfuckinglevel',
        'BeAmazed',
        'Damnthatsinteresting',
        'MildlyInteresting',
        'todayilearned'
      ];

      const allPosts: TrendingTopic[] = [];

      for (const subreddit of viralSubreddits) {
        try {
          const posts = await this.getSubredditTrends(subreddit, Math.ceil(limit / viralSubreddits.length));
          allPosts.push(...posts);
        } catch (error) {
          debugLogger.warn(`Failed to fetch from r/${subreddit}:`, error);
        }
      }

      const sortedPosts = allPosts
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, limit);

      debugLogger.info(`Successfully fetched ${sortedPosts.length} viral content items`);
      return sortedPosts;

    } catch (error) {
      debugLogger.error('Failed to fetch viral content', error);
      return this.getFallbackViralContent();
    }
  }

  async getGenerationalTrends(limit: number = 12): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching generational trends from Reddit');
      
      const generationalSubreddits = [
        'GenZ',
        'Millennials',
        'GenX',
        'Boomers',
        'teenagers',
        'youngadults'
      ];

      const allPosts: TrendingTopic[] = [];

      for (const subreddit of generationalSubreddits) {
        try {
          const posts = await this.getSubredditTrends(subreddit, Math.ceil(limit / generationalSubreddits.length));
          allPosts.push(...posts);
        } catch (error) {
          debugLogger.warn(`Failed to fetch from r/${subreddit}:`, error);
        }
      }

      const sortedPosts = allPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      debugLogger.info(`Successfully fetched ${sortedPosts.length} generational trends`);
      return sortedPosts;

    } catch (error) {
      debugLogger.error('Failed to fetch generational trends', error);
      return this.getFallbackGenerationalTrends();
    }
  }

  async getTrendingSubreddits(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching trending subreddits');
      
      const response = await axios.get(`${this.baseUrl}/r/TrendingReddits/hot.json`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        timeout: 10000
      });

      const posts = response.data.data.children.slice(0, limit);
      const trendingSubreddits: TrendingTopic[] = [];

      for (const post of posts) {
        const data = post.data;
        
        trendingSubreddits.push({
          id: `reddit-trending-sub-${data.id}`,
          platform: 'reddit-cultural',
          title: `Trending: ${data.title}`,
          summary: data.selftext ? this.truncateText(data.selftext, 200) : `r/${data.subreddit} is trending with ${data.num_comments} comments`,
          url: `${this.baseUrl}${data.permalink}`,
          score: this.calculateCulturalScore(data.score, data.num_comments, data.upvote_ratio, 'trending'),
          fetchedAt: new Date().toISOString(),
          engagement: data.score + data.num_comments,
          source: `Reddit - r/${data.subreddit}`,
          keywords: this.extractKeywords(data.title, data.selftext, data.subreddit)
        });
      }

      debugLogger.info(`Successfully fetched ${trendingSubreddits.length} trending subreddits`);
      return trendingSubreddits;

    } catch (error) {
      debugLogger.error('Failed to fetch trending subreddits', error);
      return [];
    }
  }

  private async getSubredditTrends(subreddit: string, limit: number): Promise<TrendingTopic[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/r/${subreddit}/hot.json?limit=${limit}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        timeout: 8000
      });

      const posts = response.data.data.children;
      const topics: TrendingTopic[] = [];

      for (const post of posts) {
        const data = post.data;
        
        topics.push({
          id: `reddit-cultural-${data.id}`,
          platform: 'reddit-cultural',
          title: data.title,
          summary: data.selftext ? this.truncateText(data.selftext, 200) : `Popular post in r/${subreddit} with ${data.num_comments} comments`,
          url: `${this.baseUrl}${data.permalink}`,
          score: this.calculateCulturalScore(data.score, data.num_comments, data.upvote_ratio, subreddit),
          fetchedAt: new Date().toISOString(),
          engagement: data.score + data.num_comments,
          source: `Reddit - r/${subreddit}`,
          keywords: this.extractKeywords(data.title, data.selftext, subreddit)
        });
      }

      return topics;

    } catch (error) {
      debugLogger.warn(`Failed to fetch from r/${subreddit}:`, error);
      return [];
    }
  }

  private calculateCulturalScore(score: number, comments: number, upvoteRatio: number, context: string): number {
    let calculatedScore = 60;
    
    // Base score from upvotes
    if (score > 10000) calculatedScore += 30;
    else if (score > 5000) calculatedScore += 25;
    else if (score > 1000) calculatedScore += 20;
    else if (score > 500) calculatedScore += 15;
    else if (score > 100) calculatedScore += 10;
    
    // Comments indicate engagement
    if (comments > 1000) calculatedScore += 20;
    else if (comments > 500) calculatedScore += 15;
    else if (comments > 100) calculatedScore += 10;
    else if (comments > 50) calculatedScore += 5;
    
    // Upvote ratio indicates quality
    if (upvoteRatio > 0.9) calculatedScore += 15;
    else if (upvoteRatio > 0.8) calculatedScore += 10;
    else if (upvoteRatio > 0.7) calculatedScore += 5;
    
    // Context-specific boosts
    if (context === 'popculturechat' || context === 'OutOfTheLoop') calculatedScore += 10;
    else if (context === 'GenZ' || context === 'Millennials') calculatedScore += 8;
    else if (context === 'trending') calculatedScore += 12;
    
    return Math.max(Math.min(calculatedScore, 100), 30);
  }

  private extractKeywords(title: string, selftext: string, subreddit: string): string[] {
    const keywords: string[] = [];
    
    // Extract from title
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 3));
    }
    
    // Extract from selftext
    if (selftext) {
      keywords.push(...selftext.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 5));
    }
    
    // Add subreddit context
    keywords.push(subreddit.toLowerCase(), 'reddit', 'cultural', 'trending');
    
    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'are', 'was', 'were', 'but', 'not', 'can', 'all', 'any', 'had', 'her', 'his', 'our', 'out', 'day', 'get', 'has', 'him', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'you', 'may', 'one', 'like', 'when', 'what', 'more', 'time', 'very', 'well', 'come', 'make', 'over', 'such', 'take', 'than', 'only', 'good', 'some', 'could', 'would', 'other', 'into', 'first', 'after', 'being', 'these', 'many', 'most', 'also', 'where', 'much', 'before', 'right', 'through', 'just', 'should', 'those', 'people', 'never', 'here', 'each', 'which', 'their', 'said', 'them', 'there', 'think', 'want', 'does', 'part', 'even', 'back', 'work', 'life', 'become', 'same', 'tell', 'why', 'ask', 'came', 'show', 'every', 'large', 'find', 'still', 'between', 'name', 'home', 'give', 'water', 'room', 'turn', 'move', 'because', 'thing', 'place', 'case', 'most', 'used', 'during', 'without', 'again', 'around', 'however', 'got', 'usually', 'run', 'important', 'until', 'children', 'side', 'feet', 'car', 'mile', 'began', 'grow', 'took', 'river', 'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'second', 'later', 'miss', 'idea', 'enough', 'eat', 'face', 'watch', 'far', 'really', 'almost', 'above', 'girl', 'sometimes', 'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'leave', 'family', 'below', 'never', 'started', 'city', 'earth', 'eyes', 'light', 'thought', 'head', 'under', 'story', 'saw', 'left', 'don', 'few', 'while', 'along', 'might', 'close', 'something', 'seem', 'next', 'hard', 'open', 'example', 'begin', 'always', 'both', 'paper', 'together', 'group', 'often'];
    
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word) && word.length > 2)
      .slice(0, 8);
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private getFallbackCulturalTrends(): TrendingTopic[] {
    return [
      {
        id: 'reddit-cultural-fallback-1',
        platform: 'reddit-cultural',
        title: 'Gen Z Workplace Culture Discussion',
        summary: 'Discussion about generational differences in workplace expectations and remote work culture',
        url: 'https://www.reddit.com/r/GenZ',
        score: 85,
        fetchedAt: new Date().toISOString(),
        engagement: 2500,
        source: 'Reddit - r/GenZ',
        keywords: ['genz', 'workplace', 'culture', 'remote', 'work', 'generation']
      },
      {
        id: 'reddit-cultural-fallback-2',
        platform: 'reddit-cultural',
        title: 'Viral TikTok Trend Analysis',
        summary: 'Analysis of current TikTok trends and their cultural impact across different age groups',
        url: 'https://www.reddit.com/r/popculturechat',
        score: 80,
        fetchedAt: new Date().toISOString(),
        engagement: 1800,
        source: 'Reddit - r/popculturechat',
        keywords: ['tiktok', 'viral', 'trend', 'culture', 'analysis', 'social']
      }
    ];
  }

  private getFallbackViralContent(): TrendingTopic[] {
    return [
      {
        id: 'reddit-viral-fallback-1',
        platform: 'reddit-cultural',
        title: 'Incredible Technology Breakthrough',
        summary: 'Amazing technological innovation that\'s capturing everyone\'s attention',
        url: 'https://www.reddit.com/r/nextfuckinglevel',
        score: 90,
        fetchedAt: new Date().toISOString(),
        engagement: 5000,
        source: 'Reddit - r/nextfuckinglevel',
        keywords: ['technology', 'breakthrough', 'innovation', 'amazing', 'viral']
      }
    ];
  }

  private getFallbackGenerationalTrends(): TrendingTopic[] {
    return [
      {
        id: 'reddit-gen-fallback-1',
        platform: 'reddit-cultural',
        title: 'Millennial vs Gen Z Lifestyle Differences',
        summary: 'Discussion about the key differences in lifestyle choices between Millennials and Gen Z',
        url: 'https://www.reddit.com/r/Millennials',
        score: 75,
        fetchedAt: new Date().toISOString(),
        engagement: 1200,
        source: 'Reddit - r/Millennials',
        keywords: ['millennial', 'genz', 'lifestyle', 'differences', 'generation']
      }
    ];
  }
}

export const redditCulturalService = new RedditCulturalService();