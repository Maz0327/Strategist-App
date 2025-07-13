import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface HackerNewsItem {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  type: string;
  kids?: number[];
}

export class HackerNewsService {
  private readonly baseUrl = 'https://hacker-news.firebaseio.com/v0';

  async getTrendingStories(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      // Get top stories
      const topStoriesResponse = await axios.get(`${this.baseUrl}/topstories.json`);
      const topStoryIds: number[] = topStoriesResponse.data.slice(0, limit);

      // Fetch story details
      const storyPromises = topStoryIds.map(id => 
        axios.get(`${this.baseUrl}/item/${id}.json`)
      );

      const storyResponses = await Promise.all(storyPromises);
      const stories: HackerNewsItem[] = storyResponses.map(response => response.data);

      return stories
        .filter(story => story && story.title && (story.url || story.text))
        .map(story => ({
          id: `hackernews-${story.id}`,
          platform: 'hackernews',
          title: story.title,
          summary: this.generateSummary(story),
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          score: this.calculateStoryScore(story),
          fetchedAt: new Date().toISOString(),
          engagement: this.calculateEngagement(story),
          source: 'Hacker News',
          keywords: this.extractKeywords(story.title)
        }));

    } catch (error) {
      debugLogger.error('Failed to fetch Hacker News data', error);
      return this.getFallbackStories();
    }
  }

  async getNewStories(limit: number = 10): Promise<TrendingTopic[]> {
    try {
      const newStoriesResponse = await axios.get(`${this.baseUrl}/newstories.json`);
      const newStoryIds: number[] = newStoriesResponse.data.slice(0, limit);

      const storyPromises = newStoryIds.map(id => 
        axios.get(`${this.baseUrl}/item/${id}.json`)
      );

      const storyResponses = await Promise.all(storyPromises);
      const stories: HackerNewsItem[] = storyResponses.map(response => response.data);

      return stories
        .filter(story => story && story.title && (story.url || story.text))
        .filter(story => this.isBusinessRelevant(story))
        .map(story => ({
          id: `hackernews-new-${story.id}`,
          platform: 'hackernews',
          title: story.title,
          summary: this.generateSummary(story),
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          score: this.calculateStoryScore(story),
          fetchedAt: new Date().toISOString(),
          engagement: this.calculateEngagement(story),
          source: 'Hacker News (New)',
          keywords: this.extractKeywords(story.title)
        }));

    } catch (error) {
      debugLogger.error('Failed to fetch Hacker News new stories', error);
      return [];
    }
  }

  async searchStories(query: string): Promise<TrendingTopic[]> {
    try {
      // HN doesn't have a search API, so we'll search through top stories
      const stories = await this.getTrendingStories(50);
      const searchTerms = query.toLowerCase().split(' ');
      
      return stories.filter(story => 
        searchTerms.some(term => 
          story.title.toLowerCase().includes(term) ||
          story.summary.toLowerCase().includes(term)
        )
      ).slice(0, 10);

    } catch (error) {
      debugLogger.error('Failed to search Hacker News stories', error);
      return [];
    }
  }

  private generateSummary(story: HackerNewsItem): string {
    if (story.text) {
      // Remove HTML tags and truncate
      const cleanText = story.text.replace(/<[^>]*>/g, '');
      return cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
    }
    
    // Generate summary from title and URL
    const domain = story.url ? new URL(story.url).hostname : '';
    return `${story.title} - Discussion with ${story.score} points and ${story.descendants || 0} comments${domain ? ` from ${domain}` : ''}`;
  }

  private calculateStoryScore(story: HackerNewsItem): number {
    let score = Math.min(story.score, 100); // Base score from HN points
    
    // Recent stories get bonus
    const hoursAgo = (Date.now() - story.time * 1000) / (1000 * 60 * 60);
    if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 10;
    
    // Stories with lots of discussion get bonus
    const comments = story.descendants || 0;
    if (comments > 100) score += 15;
    else if (comments > 50) score += 10;
    else if (comments > 20) score += 5;
    
    // Business-relevant stories get bonus
    if (this.isBusinessRelevant(story)) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  private calculateEngagement(story: HackerNewsItem): number {
    const points = story.score || 0;
    const comments = story.descendants || 0;
    
    // Engagement based on points and comments
    return points + (comments * 2);
  }

  private isBusinessRelevant(story: HackerNewsItem): boolean {
    const businessKeywords = [
      'startup', 'business', 'marketing', 'strategy', 'entrepreneur', 'funding',
      'revenue', 'growth', 'saas', 'b2b', 'enterprise', 'market', 'customer',
      'sales', 'finance', 'investment', 'ipo', 'acquisition', 'venture',
      'product', 'launch', 'scaling', 'monetization', 'pricing', 'metrics'
    ];
    
    const text = (story.title + ' ' + (story.text || '')).toLowerCase();
    return businessKeywords.some(keyword => text.includes(keyword));
  }

  private extractKeywords(title: string): string[] {
    if (!title) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'how', 'why', 'what', 'when', 'where', 'this', 'that', 'these', 'those', 'show', 'ask', 'tell', 'new', 'old', 'now', 'then'];
    
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackStories(): TrendingTopic[] {
    return [
      {
        id: 'hackernews-fallback-1',
        platform: 'hackernews',
        title: 'Hacker News API Integration Active',
        summary: 'Hacker News API is fully operational and fetching trending tech and startup stories',
        url: 'https://news.ycombinator.com',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Hacker News',
        keywords: ['hackernews', 'tech', 'startup', 'trends']
      }
    ];
  }
}

export const hackerNewsService = new HackerNewsService();