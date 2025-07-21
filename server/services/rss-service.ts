import RSSParser from 'rss-parser';
import { db } from '../storage';
import { rssFeeds, rssArticles } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import type { InsertRssFeed, InsertRssArticle, RssFeed, RssArticle } from '@shared/schema';

interface CustomRSSItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  categories?: string[];
  isoDate?: string;
  creator?: string;
  pubDate?: string;
}

interface CustomRSSFeed {
  title?: string;
  description?: string;
  link?: string;
  language?: string;
  items?: CustomRSSItem[];
}

export class RSSService {
  private parser: RSSParser<CustomRSSFeed, CustomRSSItem>;

  constructor() {
    this.parser = new RSSParser({
      timeout: 10000, // 10 second timeout
    });
  }

  /**
   * Add a new RSS feed for a user
   */
  async addFeed(userId: number, feedData: Omit<InsertRssFeed, 'userId'>): Promise<RssFeed> {
    try {
      // Test the RSS URL first
      await this.validateRSSFeed(feedData.rssUrl);

      const [feed] = await db
        .insert(rssFeeds)
        .values({
          userId,
          ...feedData,
          status: 'active',
          errorCount: 0,
        })
        .returning();

      return feed;
    } catch (error) {
      throw new Error(`Failed to add RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all feeds for a user by category
   */
  async getUserFeeds(userId: number, category?: string): Promise<RssFeed[]> {
    const conditions = [eq(rssFeeds.userId, userId)];
    if (category) {
      conditions.push(eq(rssFeeds.category, category));
    }

    return await db
      .select()
      .from(rssFeeds)
      .where(and(...conditions))
      .orderBy(rssFeeds.createdAt);
  }

  /**
   * Fetch and process articles from a specific feed
   */
  async fetchFeedArticles(feedId: number): Promise<RssArticle[]> {
    const [feed] = await db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.id, feedId));

    if (!feed) {
      throw new Error('Feed not found');
    }

    try {
      const parsed = await this.parser.parseURL(feed.rssUrl);
      const articles: InsertRssArticle[] = [];

      for (const item of parsed.items || []) {
        if (!item.title || !item.link) continue;

        // Check if article already exists
        const existing = await db
          .select()
          .from(rssArticles)
          .where(and(
            eq(rssArticles.feedId, feedId),
            eq(rssArticles.url, item.link)
          ));

        if (existing.length > 0) continue;

        articles.push({
          feedId,
          title: item.title,
          content: item.content || item.contentSnippet || '',
          url: item.link,
          summary: item.contentSnippet?.substring(0, 500) || '',
          author: item.creator || '',
          publishedAt: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date(),
          guid: item.guid || item.link,
          categories: item.categories || [],
          processed: false,
          metadata: {
            originalItem: item,
            feedTitle: parsed.title,
            feedLink: parsed.link,
          },
        });
      }

      // Insert new articles
      if (articles.length > 0) {
        const inserted = await db
          .insert(rssArticles)
          .values(articles)
          .returning();

        // Update feed last fetched time
        await db
          .update(rssFeeds)
          .set({
            lastFetched: new Date(),
            errorCount: 0,
            lastError: null,
            metadata: {
              title: parsed.title,
              description: parsed.description,
              link: parsed.link,
              language: parsed.language,
            },
          })
          .where(eq(rssFeeds.id, feedId));

        return inserted;
      }

      return [];
    } catch (error) {
      // Update feed with error information
      await db
        .update(rssFeeds)
        .set({
          errorCount: feed.errorCount + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          status: feed.errorCount >= 5 ? 'error' : 'active',
        })
        .where(eq(rssFeeds.id, feedId));

      throw error;
    }
  }

  /**
   * Get recent articles from feeds by category
   */
  async getRecentArticles(userId: number, category: string, limit: number = 10): Promise<(RssArticle & { feedName: string })[]> {
    const result = await db
      .select({
        id: rssArticles.id,
        feedId: rssArticles.feedId,
        title: rssArticles.title,
        content: rssArticles.content,
        url: rssArticles.url,
        summary: rssArticles.summary,
        author: rssArticles.author,
        publishedAt: rssArticles.publishedAt,
        extractedAt: rssArticles.extractedAt,
        processed: rssArticles.processed,
        signalId: rssArticles.signalId,
        guid: rssArticles.guid,
        categories: rssArticles.categories,
        metadata: rssArticles.metadata,
        feedName: rssFeeds.name,
      })
      .from(rssArticles)
      .innerJoin(rssFeeds, eq(rssArticles.feedId, rssFeeds.id))
      .where(and(
        eq(rssFeeds.userId, userId),
        eq(rssFeeds.category, category),
        eq(rssFeeds.status, 'active')
      ))
      .orderBy(rssArticles.publishedAt)
      .limit(limit);

    return result;
  }

  /**
   * Fetch all active feeds for a user
   */
  async fetchAllUserFeeds(userId: number): Promise<{ feedId: number; articles: number }[]> {
    const userFeeds = await db
      .select()
      .from(rssFeeds)
      .where(and(
        eq(rssFeeds.userId, userId),
        eq(rssFeeds.status, 'active')
      ));

    const results = [];
    for (const feed of userFeeds) {
      try {
        const articles = await this.fetchFeedArticles(feed.id);
        results.push({ feedId: feed.id, articles: articles.length });
      } catch (error) {
        console.error(`Failed to fetch feed ${feed.id}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return results;
  }

  /**
   * Update feed settings
   */
  async updateFeed(feedId: number, userId: number, updates: Partial<InsertRssFeed>): Promise<RssFeed> {
    const [updated] = await db
      .update(rssFeeds)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(rssFeeds.id, feedId),
        eq(rssFeeds.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new Error('Feed not found or access denied');
    }

    return updated;
  }

  /**
   * Delete a feed and its articles
   */
  async deleteFeed(feedId: number, userId: number): Promise<void> {
    // Delete articles first (foreign key constraint)
    await db
      .delete(rssArticles)
      .where(eq(rssArticles.feedId, feedId));

    // Delete the feed
    const deleted = await db
      .delete(rssFeeds)
      .where(and(
        eq(rssFeeds.id, feedId),
        eq(rssFeeds.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) {
      throw new Error('Feed not found or access denied');
    }
  }

  /**
   * Validate RSS feed URL
   */
  private async validateRSSFeed(url: string): Promise<void> {
    try {
      const parsed = await this.parser.parseURL(url);
      if (!parsed.title || !parsed.items || parsed.items.length === 0) {
        throw new Error('Invalid RSS feed - no content found');
      }
    } catch (error) {
      throw new Error(`Invalid RSS feed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get feed statistics
   */
  async getFeedStats(userId: number): Promise<{
    totalFeeds: number;
    activeFeeds: number;
    totalArticles: number;
    recentArticles: number;
    categoryBreakdown: { category: string; count: number }[];
  }> {
    const feeds = await db
      .select()
      .from(rssFeeds)
      .where(eq(rssFeeds.userId, userId));

    const totalFeeds = feeds.length;
    const activeFeeds = feeds.filter((f: RssFeed) => f.status === 'active').length;

    const articles = await db
      .select()
      .from(rssArticles)
      .innerJoin(rssFeeds, eq(rssArticles.feedId, rssFeeds.id))
      .where(eq(rssFeeds.userId, userId));

    const totalArticles = articles.length;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentArticles = articles.filter((a: any) => 
      a.rss_articles.extractedAt && a.rss_articles.extractedAt > oneDayAgo
    ).length;

    const categoryBreakdown = feeds.reduce((acc: { category: string; count: number }[], feed: RssFeed) => {
      const existing = acc.find((c: { category: string; count: number }) => c.category === feed.category);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ category: feed.category, count: 1 });
      }
      return acc;
    }, [] as { category: string; count: number }[]);

    return {
      totalFeeds,
      activeFeeds,
      totalArticles,
      recentArticles,
      categoryBreakdown,
    };
  }
}

export const rssService = new RSSService();