import { storage } from "../storage";
import { rssFeedService } from "./rss-feed";
import { debugLogger } from "./debug-logger";
import { UserFeedSource, FeedItem, InsertFeedItem, UserTopicProfile } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class FeedManagerService {
  
  async getUserFeedSources(userId: number): Promise<UserFeedSource[]> {
    try {
      return await storage.getUserFeedSources(userId);
    } catch (error: any) {
      debugLogger.error(`Failed to get user feed sources for user ${userId}`, error);
      throw error;
    }
  }

  async createUserFeedSource(userId: number, feedSource: Omit<UserFeedSource, 'id' | 'userId' | 'createdAt' | 'lastFetched'>): Promise<UserFeedSource> {
    try {
      const newFeedSource = await storage.createUserFeedSource({
        ...feedSource,
        userId
      });
      
      debugLogger.info(`Created new feed source: ${feedSource.name}`, { userId, feedType: feedSource.feedType });
      return newFeedSource;
    } catch (error: any) {
      debugLogger.error(`Failed to create feed source: ${feedSource.name}`, error);
      throw error;
    }
  }

  async updateUserFeedSource(id: number, updates: Partial<UserFeedSource>): Promise<UserFeedSource> {
    try {
      const updatedFeedSource = await storage.updateUserFeedSource(id, updates);
      if (!updatedFeedSource) {
        throw new Error('Feed source not found');
      }
      
      debugLogger.info(`Updated feed source: ${updatedFeedSource.name}`, { id, updates });
      return updatedFeedSource;
    } catch (error: any) {
      debugLogger.error(`Failed to update feed source ${id}`, error);
      throw error;
    }
  }

  async deleteUserFeedSource(id: number): Promise<void> {
    try {
      await storage.deleteUserFeedSource(id);
      debugLogger.info(`Deleted feed source: ${id}`);
    } catch (error: any) {
      debugLogger.error(`Failed to delete feed source ${id}`, error);
      throw error;
    }
  }

  async fetchFeedItems(userId: number, feedType?: string, limit: number = 20): Promise<FeedItem[]> {
    try {
      return await storage.getFeedItems(userId, feedType, limit);
    } catch (error: any) {
      debugLogger.error(`Failed to fetch feed items for user ${userId}`, error);
      throw error;
    }
  }

  // AI relevance filtering
  private async calculateRelevanceScore(
    feedItem: { title: string; content?: string; url?: string },
    userProfile: UserTopicProfile | null
  ): Promise<{ score: number; reasoning: string }> {
    if (!userProfile || !openai) {
      return { score: 5, reasoning: "No profile or OpenAI available" };
    }

    try {
      const userContext = {
        industries: userProfile.industries || [],
        interests: userProfile.interests || [],
        keywords: userProfile.keywords || [],
        geographicFocus: userProfile.geographicFocus || [],
        excludedTopics: userProfile.excludedTopics || []
      };

      const prompt = `
        You are analyzing content relevance for a strategic analyst. 
        
        User Profile:
        - Industries: ${userContext.industries.join(", ")}
        - Interests: ${userContext.interests.join(", ")}
        - Keywords: ${userContext.keywords.join(", ")}
        - Geographic Focus: ${userContext.geographicFocus.join(", ")}
        - Excluded Topics: ${userContext.excludedTopics.join(", ")}
        
        Content to analyze:
        Title: ${feedItem.title}
        Content: ${feedItem.content?.substring(0, 500) || "No content"}
        
        Rate the relevance on a scale of 1-10 where:
        - 1-3: Not relevant or matches excluded topics
        - 4-6: Somewhat relevant
        - 7-8: Highly relevant to user's interests
        - 9-10: Critical strategic intelligence
        
        Respond with JSON: {"score": number, "reasoning": "brief explanation"}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 150,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        score: Math.max(1, Math.min(10, result.score || 5)),
        reasoning: result.reasoning || "Automatic relevance scoring"
      };
    } catch (error) {
      debugLogger.error("Failed to calculate relevance score", error);
      return { score: 5, reasoning: "Error in relevance calculation" };
    }
  }

  async refreshUserFeeds(userId: number): Promise<{ success: number; errors: string[] }> {
    const feedSources = await this.getUserFeedSources(userId);
    const userProfile = await storage.getUserTopicProfile(userId);
    
    let success = 0;
    const errors: string[] = [];
    
    for (const feedSource of feedSources) {
      if (!feedSource.isActive) continue;
      
      try {
        await this.refreshSingleFeed(feedSource, userProfile);
        success++;
        
        // Update last fetched timestamp
        await this.updateUserFeedSource(feedSource.id, {
          lastFetched: new Date()
        });
        
      } catch (error: any) {
        errors.push(`${feedSource.name}: ${error.message}`);
        debugLogger.error(`Failed to refresh feed: ${feedSource.name}`, error);
      }
    }
    
    debugLogger.info(`Feed refresh completed for user ${userId}`, { success, errors: errors.length });
    return { success, errors };
  }

  private async refreshSingleFeed(feedSource: UserFeedSource, userProfile: UserTopicProfile | null): Promise<void> {
    let feedItems: any[] = [];
    
    switch (feedSource.feedType) {
      case 'custom_feed':
        feedItems = await rssFeedService.fetchCustomFeed(feedSource);
        break;
        
      case 'intelligence_feed':
        feedItems = await this.fetchIntelligenceFeedItems(feedSource, userProfile);
        break;
        
      case 'project_data':
        feedItems = await this.fetchProjectDataItems(feedSource);
        break;
        
      default:
        throw new Error(`Unknown feed type: ${feedSource.feedType}`);
    }
    
    // Process and store feed items with AI relevance filtering
    for (const item of feedItems) {
      // Calculate AI-powered relevance score
      const relevanceResult = await this.calculateRelevanceScore(item, userProfile);
      
      // Only store items with relevance score >= 6 (highly relevant)
      if (relevanceResult.score >= 6) {
        const urgencyLevel = this.determineUrgencyLevel(item, relevanceResult.score);
        
        const feedItem: InsertFeedItem = {
          userId: feedSource.userId,
          feedSourceId: feedSource.id,
          title: item.title,
          content: item.content,
          url: item.url,
          summary: item.summary,
          publishedAt: item.publishedAt,
          relevanceScore: `${relevanceResult.score}/10 - ${relevanceResult.reasoning}`,
          urgencyLevel,
          tags: item.tags || []
        };
        
        await storage.createFeedItem(feedItem);
        debugLogger.info(`Stored relevant feed item: ${item.title}`, { 
          score: relevanceResult.score, 
          reasoning: relevanceResult.reasoning 
        });
      } else {
        debugLogger.debug(`Filtered out low relevance item: ${item.title}`, { 
          score: relevanceResult.score, 
          reasoning: relevanceResult.reasoning 
        });
      }
    }
  }

  private determineUrgencyLevel(item: any, relevanceScore: number): string {
    // Determine urgency based on relevance score and other factors
    if (relevanceScore >= 9) return "critical";
    if (relevanceScore >= 8) return "high";
    if (relevanceScore >= 7) return "medium";
    return "low";
  }

  private async fetchIntelligenceFeedItems(feedSource: UserFeedSource, userProfile: UserTopicProfile | null): Promise<any[]> {
    try {
      // Use existing external APIs service to get trending topics
      const { externalAPIsService } = await import('./external-apis');
      const topics = await externalAPIsService.getAllTrendingTopics();
      
      // Transform external API topics to feed item format
      return topics.map(topic => ({
        title: topic.topic,
        content: topic.summary,
        url: topic.url,
        summary: topic.summary,
        publishedAt: new Date(),
        tags: topic.keywords || []
      }));
    } catch (error: any) {
      debugLogger.error(`Failed to fetch intelligence feed items for: ${feedSource.name}`, error);
      return [];
    }
  }

  private async fetchProjectDataItems(feedSource: UserFeedSource): Promise<any[]> {
    // This would integrate with analytics APIs like Google Analytics, Tracer, etc.
    // For now, return empty array as project data would come from uploads/integrations
    debugLogger.info(`Project data feed not yet implemented for: ${feedSource.name}`);
    return [];
  }

  async getUserTopicProfile(userId: number): Promise<UserTopicProfile | null> {
    try {
      return await storage.getUserTopicProfile(userId);
    } catch (error: any) {
      debugLogger.error(`Failed to get user topic profile for user ${userId}`, error);
      throw error;
    }
  }

  async updateUserTopicProfile(userId: number, profile: Partial<UserTopicProfile>): Promise<UserTopicProfile> {
    try {
      const existingProfile = await storage.getUserTopicProfile(userId);
      
      if (existingProfile) {
        const updatedProfile = await storage.updateUserTopicProfile(userId, profile);
        if (!updatedProfile) {
          throw new Error('Failed to update user topic profile');
        }
        return updatedProfile;
      } else {
        return await storage.createUserTopicProfile({
          userId,
          ...profile
        });
      }
    } catch (error: any) {
      debugLogger.error(`Failed to update user topic profile for user ${userId}`, error);
      throw error;
    }
  }

  async markFeedItemAsRead(userId: number, feedItemId: number): Promise<void> {
    try {
      await storage.updateFeedItem(feedItemId, { isRead: true });
      debugLogger.info(`Marked feed item ${feedItemId} as read for user ${userId}`);
    } catch (error: any) {
      debugLogger.error(`Failed to mark feed item ${feedItemId} as read`, error);
      throw error;
    }
  }

  async bookmarkFeedItem(userId: number, feedItemId: number): Promise<void> {
    try {
      await storage.updateFeedItem(feedItemId, { isBookmarked: true });
      debugLogger.info(`Bookmarked feed item ${feedItemId} for user ${userId}`);
    } catch (error: any) {
      debugLogger.error(`Failed to bookmark feed item ${feedItemId}`, error);
      throw error;
    }
  }
}

export const feedManagerService = new FeedManagerService();