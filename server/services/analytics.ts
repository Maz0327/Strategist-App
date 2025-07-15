import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  userAnalytics, 
  userFeedback, 
  featureUsage, 
  systemPerformance,
  abTestResults,
  apiCalls,
  externalApiCalls,
  type InsertUserAnalytics,
  type InsertUserFeedback,
  type InsertFeatureUsage,
  type InsertSystemPerformance,
  type InsertApiCalls,
  type InsertExternalApiCalls
} from "../../shared/admin-schema";
import { users } from "../../shared/schema";
import { eq, desc, count, avg, sql } from "drizzle-orm";

const sql_conn = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql_conn);

export class AnalyticsService {
  // Track user actions
  async trackUserAction(data: InsertUserAnalytics) {
    try {
      await db.insert(userAnalytics).values({
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to track user action:', error);
    }
  }

  // Track onboarding steps
  async trackOnboardingStep(userId: number, step: string, completed: boolean, metadata?: any) {
    try {
      await db.insert(userAnalytics).values({
        userId,
        action: `onboarding_${step}`,
        feature: 'onboarding',
        details: { completed, ...metadata },
        userAgent: 'system',
        ipAddress: 'system'
      });
    } catch (error) {
      console.error('Error tracking onboarding step:', error);
    }
  }

  // Track feature discovery
  async trackFeatureDiscovery(userId: number, feature: string, discoveryMethod: 'organic' | 'guided' | 'search') {
    try {
      await db.insert(userAnalytics).values({
        userId,
        action: 'feature_discovery',
        feature: 'engagement',
        details: { feature, discoveryMethod },
        userAgent: 'system',
        ipAddress: 'system'
      });
    } catch (error) {
      console.error('Error tracking feature discovery:', error);
    }
  }

  // Track feature usage
  async trackFeatureUsage(feature: string, userId: number, duration?: number) {
    try {
      // Check if feature usage exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingUsage = await db
        .select()
        .from(featureUsage)
        .where(eq(featureUsage.feature, feature))
        .where(eq(featureUsage.userId, userId))
        .where(sql`DATE(${featureUsage.date}) = ${today.toISOString().split('T')[0]}`)
        .limit(1);

      if (existingUsage.length > 0) {
        // Update existing usage
        await db
          .update(featureUsage)
          .set({
            usageCount: existingUsage[0].usageCount + 1,
            lastUsed: new Date(),
            avgSessionDuration: duration ? Math.round((existingUsage[0].avgSessionDuration || 0 + duration) / 2) : existingUsage[0].avgSessionDuration,
          })
          .where(eq(featureUsage.id, existingUsage[0].id));
      } else {
        // Create new usage record
        await db.insert(featureUsage).values({
          feature,
          userId,
          usageCount: 1,
          lastUsed: new Date(),
          avgSessionDuration: duration,
          date: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to track feature usage:', error);
    }
  }

  // Record system performance metrics with alerts
  async recordPerformanceMetric(metric: string, value: number, details?: any) {
    try {
      await db.insert(systemPerformance).values({
        metric,
        value,
        details,
        timestamp: new Date(),
      });

      // Check for performance alerts
      this.checkPerformanceAlerts(metric, value);
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  // Check performance thresholds and log alerts
  private checkPerformanceAlerts(metric: string, value: number) {
    const thresholds = {
      'response_time': 5, // 5ms threshold
      'error_rate': 1,    // 1% threshold
      'memory_usage': 80, // 80% threshold
      'cpu_usage': 90     // 90% threshold
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (threshold && value > threshold) {
      console.warn(`⚠️  PERFORMANCE ALERT: ${metric} (${value}) exceeded threshold (${threshold})`);
      
      // Track alert in analytics
      this.trackUserAction({
        userId: 0, // System user
        action: 'performance_alert',
        feature: 'system',
        details: { metric, value, threshold },
        userAgent: 'system',
        ipAddress: 'system'
      });
    }
  }

  // Get user analytics dashboard data
  async getDashboardData(timeRange: 'day' | 'week' | 'month' = 'week') {
    const timeAgo = this.getTimeAgo(timeRange);
    
    try {
      // Active users
      const activeUsers = await db
        .select({ count: count() })
        .from(userAnalytics)
        .where(sql`${userAnalytics.timestamp} >= ${timeAgo.toISOString()}`);

      // Most used features
      const topFeatures = await db
        .select({
          feature: featureUsage.feature,
          totalUsage: sql<number>`sum(${featureUsage.usageCount})`,
          uniqueUsers: sql<number>`count(distinct ${featureUsage.userId})`,
          avgDuration: sql<number>`avg(${featureUsage.avgSessionDuration})`,
        })
        .from(featureUsage)
        .where(sql`${featureUsage.date} >= ${timeAgo.toISOString()}`)
        .groupBy(featureUsage.feature)
        .orderBy(sql`sum(${featureUsage.usageCount}) desc`)
        .limit(10);

      // User engagement patterns
      const userEngagement = await db
        .select({
          userId: userAnalytics.userId,
          totalActions: count(),
          uniqueFeatures: sql<number>`count(distinct ${userAnalytics.feature})`,
          avgSessionDuration: sql<number>`avg(${userAnalytics.duration})`,
        })
        .from(userAnalytics)
        .where(sql`${userAnalytics.timestamp} >= ${timeAgo.toISOString()}`)
        .groupBy(userAnalytics.userId)
        .orderBy(sql`count(*) desc`)
        .limit(20);

      // System performance
      const avgResponseTime = await db
        .select({ value: avg(systemPerformance.value) })
        .from(systemPerformance)
        .where(eq(systemPerformance.metric, 'response_time'))
        .where(sql`${systemPerformance.timestamp} >= ${timeAgo.toISOString()}`);

      // Recent feedback
      const recentFeedback = await db
        .select({
          id: userFeedback.id,
          type: userFeedback.type,
          category: userFeedback.category,
          rating: userFeedback.rating,
          title: userFeedback.title,
          status: userFeedback.status,
          createdAt: userFeedback.createdAt,
        })
        .from(userFeedback)
        .where(sql`${userFeedback.createdAt} >= ${timeAgo.toISOString()}`)
        .orderBy(desc(userFeedback.createdAt))
        .limit(10);

      return {
        activeUsers: activeUsers[0]?.count || 0,
        topFeatures,
        userEngagement,
        avgResponseTime: avgResponseTime[0]?.value || 0,
        recentFeedback,
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return {
        activeUsers: 0,
        topFeatures: [],
        userEngagement: [],
        avgResponseTime: 0,
        recentFeedback: [],
      };
    }
  }

  // Get detailed user behavior
  async getUserBehavior(userId: number, timeRange: 'day' | 'week' | 'month' = 'week') {
    const timeAgo = this.getTimeAgo(timeRange);
    
    try {
      const userActions = await db
        .select()
        .from(userAnalytics)
        .where(eq(userAnalytics.userId, userId))
        .where(sql`${userAnalytics.timestamp} >= ${timeAgo.toISOString()}`)
        .orderBy(desc(userAnalytics.timestamp));

      const userFeatureUsage = await db
        .select()
        .from(featureUsage)
        .where(eq(featureUsage.userId, userId))
        .where(sql`${featureUsage.date} >= ${timeAgo.toISOString()}`)
        .orderBy(desc(featureUsage.lastUsed));

      return {
        actions: userActions,
        featureUsage: userFeatureUsage,
      };
    } catch (error) {
      console.error('Failed to get user behavior:', error);
      return { actions: [], featureUsage: [] };
    }
  }

  // Submit user feedback
  async submitFeedback(feedback: InsertUserFeedback) {
    try {
      const result = await db.insert(userFeedback).values({
        ...feedback,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  // Get all feedback for admin
  async getAllFeedback(status?: string) {
    try {
      let query = db
        .select({
          id: userFeedback.id,
          userId: userFeedback.userId,
          userEmail: users.email,
          type: userFeedback.type,
          category: userFeedback.category,
          rating: userFeedback.rating,
          title: userFeedback.title,
          description: userFeedback.description,
          status: userFeedback.status,
          adminResponse: userFeedback.adminResponse,
          createdAt: userFeedback.createdAt,
          updatedAt: userFeedback.updatedAt,
        })
        .from(userFeedback)
        .leftJoin(users, eq(userFeedback.userId, users.id));

      if (status) {
        query = query.where(eq(userFeedback.status, status));
      }

      return await query.orderBy(desc(userFeedback.createdAt));
    } catch (error) {
      console.error('Failed to get feedback:', error);
      return [];
    }
  }

  // Update feedback status
  async updateFeedbackStatus(id: number, status: string, adminResponse?: string) {
    try {
      await db
        .update(userFeedback)
        .set({
          status,
          adminResponse,
          updatedAt: new Date(),
        })
        .where(eq(userFeedback.id, id));
    } catch (error) {
      console.error('Failed to update feedback status:', error);
      throw error;
    }
  }

  // Track API calls
  async trackApiCall(data: InsertApiCalls) {
    try {
      await db.insert(apiCalls).values({
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to track API call:', error);
    }
  }

  // Track external API calls (OpenAI, Google Trends, etc.)
  async trackExternalApiCall(data: InsertExternalApiCalls) {
    try {
      await db.insert(externalApiCalls).values({
        ...data,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to track external API call:', error);
    }
  }

  // Get API call statistics
  async getApiCallStats(timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const timeAgo = this.getTimeAgo(timeRange);
      
      // Internal API calls stats
      const internalStats = await db
        .select({
          endpoint: apiCalls.endpoint,
          method: apiCalls.method,
          totalCalls: count(),
          avgResponseTime: avg(apiCalls.responseTime),
          successRate: sql<number>`(COUNT(CASE WHEN status_code < 400 THEN 1 END) * 100.0 / COUNT(*))`,
          totalErrors: sql<number>`COUNT(CASE WHEN status_code >= 400 THEN 1 END)`,
        })
        .from(apiCalls)
        .where(sql`${apiCalls.timestamp} >= ${timeAgo.toISOString()}`)
        .groupBy(apiCalls.endpoint, apiCalls.method)
        .orderBy(desc(count()));

      // External API calls stats
      const externalStats = await db
        .select({
          service: externalApiCalls.service,
          totalCalls: count(),
          avgResponseTime: avg(externalApiCalls.responseTime),
          totalTokens: sql<number>`COALESCE(SUM(tokens_used), 0)`,
          totalCost: sql<number>`COALESCE(SUM(cost), 0)`,
          successRate: sql<number>`(COUNT(CASE WHEN status_code < 400 THEN 1 END) * 100.0 / COUNT(*))`,
        })
        .from(externalApiCalls)
        .where(sql`${externalApiCalls.timestamp} >= ${timeAgo.toISOString()}`)
        .groupBy(externalApiCalls.service)
        .orderBy(desc(count()));

      return {
        internal: internalStats,
        external: externalStats,
      };
    } catch (error) {
      console.error('Failed to get API call stats:', error);
      return { internal: [], external: [] };
    }
  }

  // Get recent API calls for debugging
  async getRecentApiCalls(limit: number = 100, service?: string) {
    try {
      if (service) {
        // For external API calls
        return await db
          .select()
          .from(externalApiCalls)
          .where(eq(externalApiCalls.service, service))
          .orderBy(desc(externalApiCalls.timestamp))
          .limit(limit);
      } else {
        // For internal API calls
        return await db
          .select()
          .from(apiCalls)
          .orderBy(desc(apiCalls.timestamp))
          .limit(limit);
      }
    } catch (error) {
      console.error('Failed to get recent API calls:', error);
      return [];
    }
  }

  // Helper method to get time ago date
  private getTimeAgo(timeRange: 'day' | 'week' | 'month') {
    const now = new Date();
    const timeAgo = new Date();
    
    switch (timeRange) {
      case 'day':
        timeAgo.setDate(now.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(now.getDate() - 7);
        break;
      case 'month':
        timeAgo.setMonth(now.getMonth() - 1);
        break;
    }
    
    return timeAgo;
  }
}

export const analyticsService = new AnalyticsService();