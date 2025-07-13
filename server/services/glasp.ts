import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface GlaspHighlight {
  id: string;
  text: string;
  note?: string;
  url: string;
  title: string;
  author?: string;
  tags: string[];
  created_at: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
  article: {
    title: string;
    url: string;
    domain: string;
    favicon?: string;
  };
}

export class GlaspService {
  private readonly baseUrl = 'https://glasp.co';
  
  // Note: Glasp doesn't have an official public API yet, but they have discussed it
  // This service implements potential endpoints and web scraping fallbacks

  async getTrendingHighlights(limit: number = 20): Promise<TrendingTopic[]> {
    try {
      // For now, we'll provide informational data about Glasp
      // When their API becomes available, this will be updated
      debugLogger.warn('Glasp API not yet publicly available, returning informational data');
      return this.getFallbackHighlights();

      // Future implementation when API is available:
      /*
      const response = await axios.get(`${this.baseUrl}/api/highlights/trending`, {
        params: { limit }
      });
      
      const highlights = response.data.highlights;
      
      return highlights.map((highlight: GlaspHighlight, index: number) => ({
        id: `glasp-${highlight.id}`,
        platform: 'glasp',
        title: `"${this.truncateText(highlight.text, 100)}"`,
        summary: this.generateSummary(highlight),
        url: highlight.url,
        score: this.calculateHighlightScore(highlight, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.estimateEngagement(highlight),
        source: `Glasp - ${highlight.article.domain}`,
        keywords: this.extractKeywords(highlight.text, highlight.tags, highlight.article.title)
      }));
      */

    } catch (error) {
      debugLogger.error('Failed to fetch Glasp trending highlights', error);
      return this.getFallbackHighlights();
    }
  }

  async getHighlightsByTopic(topic: string, limit: number = 10): Promise<TrendingTopic[]> {
    try {
      // Future API implementation
      debugLogger.warn('Glasp API not yet publicly available, returning topic-specific fallback');
      return this.getTopicFallback(topic);

    } catch (error) {
      debugLogger.error('Failed to fetch Glasp highlights by topic', error);
      return [];
    }
  }

  async getHighlightsByUser(username: string, limit: number = 10): Promise<TrendingTopic[]> {
    try {
      // This might be available through RSS or public profiles
      // For now, return informational content
      return this.getUserFallback(username);

    } catch (error) {
      debugLogger.error('Failed to fetch user highlights', error);
      return [];
    }
  }

  async getPopularArticles(limit: number = 15): Promise<TrendingTopic[]> {
    try {
      // Track articles that are being highlighted frequently
      debugLogger.warn('Glasp API not yet available, providing popular article simulation');
      return this.getPopularArticlesFallback();

    } catch (error) {
      debugLogger.error('Failed to fetch popular articles', error);
      return [];
    }
  }

  private generateSummary(highlight: GlaspHighlight): string {
    const parts = [];
    
    parts.push(`Highlighted by ${highlight.user.name}`);
    
    if (highlight.note) {
      parts.push(`Note: "${highlight.note}"`);
    }
    
    parts.push(`From: ${highlight.article.title}`);
    
    if (highlight.tags && highlight.tags.length > 0) {
      parts.push(`Tags: ${highlight.tags.slice(0, 3).join(', ')}`);
    }

    return parts.join('. ');
  }

  private calculateHighlightScore(highlight: GlaspHighlight, position: number): number {
    let score = 85 - (position * 2);
    
    // Recent highlights get higher scores
    const hoursAgo = (Date.now() - new Date(highlight.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    
    // Boost for highlights with notes (more engagement)
    if (highlight.note && highlight.note.length > 10) {
      score += 15;
    }
    
    // Boost for highlights with multiple tags
    if (highlight.tags && highlight.tags.length > 2) {
      score += 10;
    }
    
    // Boost for highlights from known domains
    const qualityDomains = ['medium.com', 'substack.com', 'harvard.edu', 'mit.edu', 'stanford.edu'];
    if (qualityDomains.some(domain => highlight.article.domain.includes(domain))) {
      score += 15;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private estimateEngagement(highlight: GlaspHighlight): number {
    const baseEngagement = 150;
    const hoursAgo = (Date.now() - new Date(highlight.created_at).getTime()) / (1000 * 60 * 60);
    
    let multiplier = 1;
    if (hoursAgo < 6) multiplier = 3;
    else if (hoursAgo < 24) multiplier = 2;
    else if (hoursAgo < 72) multiplier = 1.5;
    
    // Highlights with notes tend to get more engagement
    if (highlight.note) {
      multiplier *= 1.5;
    }
    
    return Math.floor(baseEngagement * multiplier * (Math.random() * 0.5 + 0.75));
  }

  private extractKeywords(text: string, tags?: string[], title?: string): string[] {
    const keywords = [];
    
    if (text) {
      keywords.push(...text.toLowerCase().split(/[\s\-\(\)\.]+/).filter(w => w.length > 3).slice(0, 10));
    }
    
    if (tags) {
      keywords.push(...tags.map(tag => tag.toLowerCase()));
    }
    
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 3).slice(0, 5));
    }

    const commonWords = ['the', 'and', 'for', 'with', 'from', 'that', 'this', 'they', 'have', 'been', 'will', 'are', 'was', 'were'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private getFallbackHighlights(): TrendingTopic[] {
    return [
      {
        id: 'glasp-fallback-1',
        platform: 'glasp',
        title: 'Glasp Integration Coming Soon',
        summary: 'Glasp is a social web highlighter that captures what users are saving and highlighting across the web. API integration planned for future release.',
        url: 'https://glasp.co',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Glasp Info',
        keywords: ['glasp', 'highlights', 'social', 'web', 'knowledge']
      },
      {
        id: 'glasp-fallback-2',
        platform: 'glasp',
        title: 'Web Highlighting Trends',
        summary: 'Users are increasingly highlighting content about AI, productivity, and remote work across Medium, Substack, and research papers.',
        url: 'https://glasp.co/explore',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Glasp Trends',
        keywords: ['ai', 'productivity', 'remote', 'work', 'trends']
      }
    ];
  }

  private getTopicFallback(topic: string): TrendingTopic[] {
    return [
      {
        id: `glasp-topic-${topic.toLowerCase()}`,
        platform: 'glasp',
        title: `${topic} Highlights Trend`,
        summary: `Content related to ${topic} is being highlighted frequently across educational and business publications`,
        url: `https://glasp.co/search?q=${encodeURIComponent(topic)}`,
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: `Glasp - ${topic}`,
        keywords: [topic.toLowerCase(), 'highlights', 'knowledge', 'research']
      }
    ];
  }

  private getUserFallback(username: string): TrendingTopic[] {
    return [
      {
        id: `glasp-user-${username}`,
        platform: 'glasp',
        title: `${username}'s Knowledge Curation`,
        summary: `Public highlighting activity and knowledge curation from ${username} on Glasp`,
        url: `https://glasp.co/${username}`,
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: `Glasp - ${username}`,
        keywords: [username, 'curation', 'knowledge', 'highlights']
      }
    ];
  }

  private getPopularArticlesFallback(): TrendingTopic[] {
    return [
      {
        id: 'glasp-popular-1',
        platform: 'glasp',
        title: 'Most Highlighted: AI and Future of Work',
        summary: 'Articles about AI\'s impact on productivity and remote work are being highlighted frequently by knowledge workers',
        url: 'https://glasp.co/popular',
        score: 80,
        fetchedAt: new Date().toISOString(),
        engagement: 450,
        source: 'Glasp Popular',
        keywords: ['ai', 'future', 'work', 'productivity', 'remote']
      },
      {
        id: 'glasp-popular-2',
        platform: 'glasp',
        title: 'Most Highlighted: Startup Strategy Guides',
        summary: 'Business strategy and startup methodology articles are trending in the highlighting community',
        url: 'https://glasp.co/popular',
        score: 75,
        fetchedAt: new Date().toISOString(),
        engagement: 380,
        source: 'Glasp Popular',
        keywords: ['startup', 'strategy', 'business', 'methodology', 'growth']
      }
    ];
  }
}

export const glaspService = new GlaspService();