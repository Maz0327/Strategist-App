import { debugLogger } from "./debug-logger";
import Parser from "rss-parser";
import { FeedItem, UserFeedSource, UserTopicProfile } from "@shared/schema";

interface RSSItem {
  title: string;
  link: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  author?: string;
  guid?: string;
  categories?: string[];
}

interface ParsedFeedItem {
  title: string;
  content: string;
  url: string;
  summary: string;
  publishedAt: Date;
  tags: string[];
}

export class RSSFeedService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          'description',
          'content:encoded',
          'dc:creator',
          'category'
        ]
      }
    });
  }

  async fetchRSSFeed(url: string): Promise<ParsedFeedItem[]> {
    try {
      debugLogger.info(`Fetching RSS feed from: ${url}`);
      
      const feed = await this.parser.parseURL(url);
      debugLogger.info(`RSS feed parsed successfully: ${feed.title} (${feed.items.length} items)`);
      
      return feed.items.map(item => this.transformRSSItem(item as RSSItem));
    } catch (error: any) {
      debugLogger.error(`Failed to fetch RSS feed from ${url}`, error);
      throw new Error(`Failed to fetch RSS feed: ${error.message}`);
    }
  }

  private transformRSSItem(item: RSSItem): ParsedFeedItem {
    const content = item.content || item.contentSnippet || item.title;
    const summary = this.generateSummary(content);
    const publishedAt = item.isoDate ? new Date(item.isoDate) : 
                       item.pubDate ? new Date(item.pubDate) : new Date();
    
    return {
      title: item.title || 'Untitled',
      content: content || '',
      url: item.link || '',
      summary,
      publishedAt,
      tags: item.categories || []
    };
  }

  private generateSummary(content: string): string {
    if (!content) return '';
    
    // Remove HTML tags and get first 200 characters
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= 200) return plainText;
    
    // Find the last complete sentence within 200 characters
    const truncated = plainText.substring(0, 200);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > 100) {
      return truncated.substring(0, lastSentence + 1);
    }
    
    return truncated + '...';
  }

  async fetchCustomFeed(feedSource: UserFeedSource): Promise<ParsedFeedItem[]> {
    try {
      switch (feedSource.sourceType) {
        case 'rss':
          return await this.fetchRSSFeed(feedSource.sourceUrl);
        
        case 'reddit':
          return await this.fetchRedditFeed(feedSource.sourceUrl);
        
        case 'social_api':
          return await this.fetchSocialFeed(feedSource);
        
        case 'website':
          return await this.fetchWebsiteFeed(feedSource.sourceUrl);
        
        default:
          throw new Error(`Unsupported source type: ${feedSource.sourceType}`);
      }
    } catch (error: any) {
      debugLogger.error(`Failed to fetch custom feed: ${feedSource.name}`, error);
      throw error;
    }
  }

  private async fetchRedditFeed(url: string): Promise<ParsedFeedItem[]> {
    try {
      // Convert Reddit URL to RSS format
      const rssUrl = url.includes('.rss') ? url : `${url}.rss`;
      return await this.fetchRSSFeed(rssUrl);
    } catch (error: any) {
      debugLogger.error(`Failed to fetch Reddit feed: ${url}`, error);
      throw new Error(`Failed to fetch Reddit feed: ${error.message}`);
    }
  }

  private async fetchSocialFeed(feedSource: UserFeedSource): Promise<ParsedFeedItem[]> {
    // This would integrate with social media APIs
    // For now, return empty array with logging
    debugLogger.info(`Social feed integration not yet implemented for: ${feedSource.name}`);
    return [];
  }

  private async fetchWebsiteFeed(url: string): Promise<ParsedFeedItem[]> {
    try {
      // Try to find RSS feed on website
      const rssUrl = await this.discoverRSSFeed(url);
      if (rssUrl) {
        return await this.fetchRSSFeed(rssUrl);
      }
      
      // If no RSS found, return empty array
      debugLogger.info(`No RSS feed discovered for website: ${url}`);
      return [];
    } catch (error: any) {
      debugLogger.error(`Failed to fetch website feed: ${url}`, error);
      throw new Error(`Failed to fetch website feed: ${error.message}`);
    }
  }

  private async discoverRSSFeed(url: string): Promise<string | null> {
    // Simple RSS discovery - check common RSS paths
    const commonPaths = [
      '/rss',
      '/rss.xml',
      '/feed',
      '/feed.xml',
      '/feeds/all.atom.xml',
      '/atom.xml'
    ];
    
    const baseUrl = new URL(url).origin;
    
    for (const path of commonPaths) {
      try {
        const rssUrl = `${baseUrl}${path}`;
        await this.parser.parseURL(rssUrl);
        return rssUrl;
      } catch {
        // Continue to next path
      }
    }
    
    return null;
  }

  // Calculate relevance score based on user profile
  calculateRelevanceScore(item: ParsedFeedItem, userProfile: UserTopicProfile): number {
    if (!userProfile) return 0.5;
    
    let score = 0.0;
    const itemText = `${item.title} ${item.content} ${item.summary}`.toLowerCase();
    
    // Check interests (high weight)
    if (userProfile.interests && userProfile.interests.length > 0) {
      const matchedInterests = userProfile.interests.filter(interest => 
        itemText.includes(interest.toLowerCase())
      );
      score += (matchedInterests.length / userProfile.interests.length) * 0.4;
    }
    
    // Check industries (medium weight)
    if (userProfile.industries && userProfile.industries.length > 0) {
      const matchedIndustries = userProfile.industries.filter(industry => 
        itemText.includes(industry.toLowerCase())
      );
      score += (matchedIndustries.length / userProfile.industries.length) * 0.3;
    }
    
    // Check keywords (high weight)
    if (userProfile.keywords && userProfile.keywords.length > 0) {
      const matchedKeywords = userProfile.keywords.filter(keyword => 
        itemText.includes(keyword.toLowerCase())
      );
      score += (matchedKeywords.length / userProfile.keywords.length) * 0.3;
    }
    
    return Math.min(1.0, score);
  }

  // Determine urgency level based on relevance score
  determineUrgencyLevel(item: ParsedFeedItem, relevanceScore: number): string {
    if (relevanceScore >= 0.8) return "critical";
    if (relevanceScore >= 0.6) return "high";
    if (relevanceScore >= 0.4) return "medium";
    return "low";
  }
}

export const rssFeedService = new RSSFeedService();