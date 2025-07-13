import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { openaiService } from "./services/openai";
import { scraperService } from "./services/scraper";
import { sourceManagerService } from "./services/source-manager";
import { dailyReportsService } from "./services/daily-reports";
import { feedManagerService } from "./services/feed-manager";
import { 
  loginSchema, 
  registerSchema, 
  analyzeContentSchema,
  insertSignalSchema,
  type User 
} from "@shared/schema";
import { debugLogger } from "./services/debug-logger";
import { performanceMonitor, performanceMiddleware } from "./services/performance-monitor";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  const MemoryStoreSession = MemoryStore(session);
  
  // Add CORS headers for credentials (including Chrome extension)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    const origin = req.headers.origin;
    // Allow Chrome extension origins
    if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://'))) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', origin || 'http://localhost:5000');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: false, // Set to false for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Add performance monitoring middleware
  app.use(performanceMiddleware);

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    debugLogger.debug("Session check", { userId: req.session?.userId, sessionId: req.sessionID }, req);
    if (!req.session?.userId) {
      debugLogger.warn("Authentication required - no session userId", { sessionId: req.sessionID }, req);
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      req.session.userId = user.id;
      
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await authService.login(data);
      req.session.userId = user.id;
      
      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email } 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await authService.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        user: { id: user.id, email: user.email } 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Content analysis routes
  app.post("/api/analyze", requireAuth, async (req, res) => {
    try {
      debugLogger.info("Content analysis request received", { title: req.body.title, hasUrl: !!req.body.url, contentLength: req.body.content?.length }, req);
      const data = analyzeContentSchema.parse(req.body);
      debugLogger.info("Content data parsed successfully", { title: data.title, url: data.url }, req);
      
      const lengthPreference = req.body.lengthPreference || 'medium';
      const userNotes = req.body.userNotes || '';
      const analysis = await openaiService.analyzeContent(data, lengthPreference);
      debugLogger.info("OpenAI analysis completed", { sentiment: analysis.sentiment, confidence: analysis.confidence, keywordCount: analysis.keywords.length }, req);
      
      // Save as potential signal after analysis
      const signalData = {
        userId: req.session.userId!,
        title: data.title || "Untitled Analysis",
        content: data.content,
        url: data.url,
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        tone: analysis.tone,
        keywords: analysis.keywords,
        tags: [],
        confidence: analysis.confidence,
        status: "capture", // Start as capture, user decides if it becomes potential_signal
        // Enhanced analysis fields
        truthFact: analysis.truthAnalysis.fact,
        truthObservation: analysis.truthAnalysis.observation,
        truthInsight: analysis.truthAnalysis.insight,
        humanTruth: analysis.truthAnalysis.humanTruth,
        culturalMoment: analysis.truthAnalysis.culturalMoment,
        attentionValue: analysis.truthAnalysis.attentionValue,
        platformContext: analysis.platformContext,
        viralPotential: analysis.viralPotential,
        cohortSuggestions: analysis.cohortSuggestions,
        competitiveInsights: analysis.competitiveInsights,
        nextActions: analysis.nextActions,
        userNotes: userNotes
      };
      
      const signal = await storage.createSignal(signalData);
      debugLogger.info("Signal created successfully", { signalId: signal.id, status: signal.status }, req);
      
      // Track source if URL was provided
      if (data.url) {
        try {
          debugLogger.info("Creating source for URL", { url: data.url }, req);
          const source = await sourceManagerService.findOrCreateSource(
            data.url,
            analysis.summary || data.title || 'Untitled',
            req.session.userId!,
            analysis.summary
          );
          await sourceManagerService.linkSignalToSource(signal.id, source.id);
          debugLogger.info("Source linked to signal", { signalId: signal.id, sourceId: source.id }, req);
        } catch (error) {
          debugLogger.error('Error tracking source', error, req);
          // Don't fail the entire request if source tracking fails
        }
      }
      
      res.json({
        success: true,
        analysis,
        signalId: signal.id
      });
      debugLogger.info("Analysis request completed successfully", { signalId: signal.id }, req);
    } catch (error: any) {
      debugLogger.error('Content analysis failed', error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Chrome extension draft endpoint
  app.post("/api/signals/draft", requireAuth, async (req, res) => {
    try {
      debugLogger.info("Draft capture request received", { title: req.body.title, hasUrl: !!req.body.url }, req);
      
      const { title, content, url, user_notes, browser_context } = req.body;
      
      if (!title && !content) {
        return res.status(400).json({ message: "Title or content is required" });
      }
      
      const signalData = {
        userId: req.session.userId!,
        title: title || "Untitled Capture",
        content: content || "",
        url: url || null,
        userNotes: user_notes || "",
        status: "capture",
        isDraft: true,
        capturedAt: new Date(),
        browserContext: browser_context || null
      };
      
      const signal = await storage.createSignal(signalData);
      debugLogger.info("Draft signal created successfully", { signalId: signal.id, isDraft: signal.isDraft }, req);
      
      res.json({
        success: true,
        signal: {
          id: signal.id,
          title: signal.title,
          status: signal.status,
          isDraft: signal.isDraft,
          createdAt: signal.createdAt
        }
      });
    } catch (error: any) {
      debugLogger.error('Draft creation failed', error, req);
      res.status(400).json({ message: error.message });
    }
  });

  // Re-analyze with different length preference
  app.post("/api/reanalyze", requireAuth, async (req, res) => {
    try {
      const { content, title, url, lengthPreference } = req.body;
      
      if (!content || !lengthPreference) {
        return res.status(400).json({ message: "Content and length preference are required" });
      }

      debugLogger.info("Re-analysis request received", { title, lengthPreference, hasUrl: !!url }, req);
      
      const data = { content, title: title || "Re-analysis", url };
      const analysis = await openaiService.analyzeContent(data, lengthPreference);
      
      debugLogger.info("Re-analysis completed", { sentiment: analysis.sentiment, lengthPreference }, req);
      
      res.json({ 
        success: true, 
        analysis,
        lengthPreference
      });
    } catch (error: any) {
      debugLogger.error('Re-analysis failed', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  // Debug and monitoring routes
  app.get("/api/debug/logs", (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const level = req.query.level as 'info' | 'warn' | 'error' | 'debug';
      const logs = debugLogger.getRecentLogs(limit, level);
      res.json({ logs, count: logs.length });
    } catch (error: any) {
      debugLogger.error('Failed to retrieve debug logs', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/debug/errors", (req, res) => {
    try {
      const errorSummary = debugLogger.getErrorSummary();
      res.json(errorSummary);
    } catch (error: any) {
      debugLogger.error('Failed to retrieve error summary', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/debug/performance", (req, res) => {
    try {
      const performanceMetrics = debugLogger.getPerformanceMetrics();
      res.json(performanceMetrics);
    } catch (error: any) {
      debugLogger.error('Failed to retrieve performance metrics', error, req);
      res.status(500).json({ 
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowRequests: 0
      });
    }
  });

  app.post("/api/debug/clear-logs", (req, res) => {
    try {
      debugLogger.clearLogs();
      res.json({ message: 'Debug logs cleared successfully' });
    } catch (error: any) {
      debugLogger.error('Failed to clear debug logs', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/extract-url", requireAuth, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      const extracted = await scraperService.extractContent(url);
      res.json({
        success: true,
        ...extracted
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Topic profile routes
  app.get("/api/user/topic-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getUserTopicProfile(req.session.userId!);
      if (!profile) {
        return res.status(404).json({ message: "Topic profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      debugLogger.error("Failed to get topic profile", error, req);
      res.status(500).json({ message: "Failed to get topic profile" });
    }
  });

  app.post("/api/user/topic-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.createUserTopicProfile({
        userId: req.session.userId!,
        ...req.body
      });
      res.json(profile);
    } catch (error: any) {
      debugLogger.error("Failed to create topic profile", error, req);
      res.status(500).json({ message: "Failed to create topic profile" });
    }
  });

  app.put("/api/user/topic-profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.updateUserTopicProfile(req.session.userId!, req.body);
      if (!profile) {
        return res.status(404).json({ message: "Topic profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      debugLogger.error("Failed to update topic profile", error, req);
      res.status(500).json({ message: "Failed to update topic profile" });
    }
  });

  // Signals routes
  app.get("/api/signals", requireAuth, async (req, res) => {
    try {
      const signals = await storage.getSignalsByUserId(req.session.userId!);
      res.json({ signals });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/signals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const signal = await storage.getSignal(id);
      
      if (!signal || signal.userId !== req.session.userId) {
        return res.status(404).json({ message: "Signal not found" });
      }
      
      res.json({ signal });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/signals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const signal = await storage.getSignal(id);
      if (!signal || signal.userId !== req.session.userId) {
        return res.status(404).json({ message: "Signal not found" });
      }
      
      // Track promotion timestamps
      if (updates.status && updates.status !== signal.status) {
        if (updates.status === "potential_signal") {
          updates.flaggedAt = new Date();
        } else if (updates.status === "signal") {
          updates.promotedAt = new Date();
        }
      }
      
      const updatedSignal = await storage.updateSignal(id, updates);
      res.json({ signal: updatedSignal });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/signals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const signal = await storage.getSignal(id);
      if (!signal || signal.userId !== req.session.userId) {
        return res.status(404).json({ message: "Signal not found" });
      }
      
      await storage.deleteSignal(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // System suggestions for captures that should become potential signals
  app.get("/api/suggestions", requireAuth, async (req, res) => {
    try {
      const captures = await storage.getSignalsByUserId(req.session.userId!);
      const captureOnly = captures.filter(s => s.status === "capture");
      
      // Generate AI suggestions for why captures should become potential signals
      const suggestions = captureOnly.slice(0, 5).map(capture => {
        let reason = "";
        let priority = "medium";
        
        // High attention value
        if (capture.attentionValue === "high") {
          reason = "High attention value detected - this could be an underpriced opportunity";
          priority = "high";
        }
        // High viral potential
        else if (capture.viralPotential === "high") {
          reason = "High viral potential - consider for cross-platform strategy";
          priority = "high";
        }
        // Cultural moment
        else if (capture.culturalMoment && capture.culturalMoment.includes("shift")) {
          reason = "Cultural shift identified - early adoption opportunity";
          priority = "medium";
        }
        // Multiple cohort opportunities
        else if (capture.cohortSuggestions && capture.cohortSuggestions.length >= 3) {
          reason = `Multiple cohort opportunities (${capture.cohortSuggestions.length}) - broad strategic value`;
          priority = "medium";
        }
        else {
          reason = "Contains strategic insights worth exploring further";
          priority = "low";
        }
        
        return {
          capture,
          reason,
          priority,
          suggestedAction: "Flag as Potential Signal"
        };
      });
      
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get trending topics from external APIs
  app.get("/api/topics", requireAuth, async (req, res) => {
    try {
      const { platform } = req.query;
      const platformFilter = platform as string | undefined;
      
      debugLogger.info(`Fetching trending topics`, { platform: platformFilter, userId: req.session.userId }, req);
      
      const { externalAPIsService } = await import('./services/external-apis');
      const topics = await externalAPIsService.getAllTrendingTopics(platformFilter);
      
      debugLogger.info(`Retrieved ${topics.length} trending topics`, { count: topics.length, platform: platformFilter }, req);
      res.json({ topics });
    } catch (error: any) {
      debugLogger.error('Error fetching trending topics', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  // Search trending topics
  app.get("/api/topics/search", requireAuth, async (req, res) => {
    try {
      const { q: query, platform } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query parameter is required' });
      }

      const { externalAPIsService } = await import('./services/external-apis');
      const topics = await externalAPIsService.searchTrends(query, platform as string);
      
      res.json({ topics });
    } catch (error: any) {
      debugLogger.error('Error searching trending topics', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  // Check API health status
  app.get("/api/topics/health", requireAuth, async (req, res) => {
    try {
      const { externalAPIsService } = await import('./services/external-apis');
      const health = await externalAPIsService.checkAPIHealth();
      
      res.json({ health });
    } catch (error: any) {
      debugLogger.error('Error checking API health', error, req);
      res.status(500).json({ message: error.message });
    }
  });

  // Individual platform trending routes (legacy - kept for backward compatibility)
  app.get("/api/trending/:platform", requireAuth, async (req, res) => {
    try {
      const { platform } = req.params;
      const { externalAPIsService } = await import('./services/external-apis');
      
      // Use the same logic as the main /api/topics route
      const topics = await externalAPIsService.getAllTrendingTopics(platform === 'all' ? undefined : platform);
      
      debugLogger.info(`Retrieved ${topics.length} topics for platform: ${platform}`, { platform, count: topics.length }, req);
      res.json({ topics });
    } catch (error: any) {
      debugLogger.error(`Error fetching ${req.params.platform} trends`, error, req);
      res.status(500).json({ message: error.message });
    }
  });

  // Daily reports
  app.get("/api/reports/daily", requireAuth, async (req, res) => {
    try {
      const { date } = req.query;
      const reportDate = date as string | undefined;
      
      debugLogger.info("Generating daily report", { userId: req.session.userId, date: reportDate }, req);
      
      const report = await dailyReportsService.generateDailyReport(req.session.userId!, reportDate);
      
      debugLogger.info("Daily report generated successfully", { 
        userId: req.session.userId, 
        signalCount: report.stats.totalSignals,
        reportId: report.id
      }, req);
      
      res.json(report);
    } catch (error: any) {
      debugLogger.error("Error generating daily report", error, req);
      res.status(500).json({ message: error.message });
    }
  });

  // Brief generation
  app.post("/api/brief/generate", requireAuth, async (req, res) => {
    try {
      const { title, signalIds } = req.body;
      
      if (!title || !signalIds || !Array.isArray(signalIds)) {
        return res.status(400).json({ message: "Title and signal IDs are required" });
      }
      
      const signals = await Promise.all(
        signalIds.map(id => storage.getSignal(id))
      );
      
      const validSignals = signals.filter(signal => 
        signal && signal.userId === req.session.userId
      );
      
      if (validSignals.length === 0) {
        return res.status(400).json({ message: "No valid signals found" });
      }
      
      const briefSections = validSignals.map(signal => {
        if (!signal) return '';
        return `## ${signal.title || 'Untitled Signal'}

**Source:** ${signal.url || 'Manual Entry'}
**Sentiment:** ${signal.sentiment || 'Neutral'}
**Tone:** ${signal.tone || 'Professional'}
**Confidence:** ${signal.confidence || 'N/A'}

### Summary
${signal.summary || 'No summary available'}

### Key Insights
${signal.keywords?.map(keyword => `- ${keyword}`).join('\n') || 'No keywords available'}

---
`;
      });

      const content = `# ${title}

*Generated on ${new Date().toLocaleDateString()}*

## Executive Summary

This strategic brief analyzes ${validSignals.length} key signals to provide actionable insights for strategic decision-making.

## Key Signals

${briefSections.join('\n')}

## Strategic Recommendations

Based on the analyzed signals, consider the following strategic actions:

1. **Immediate Actions:** Focus on high-confidence signals with positive sentiment
2. **Trend Monitoring:** Track emerging patterns across multiple signals
3. **Risk Assessment:** Address any negative sentiment signals promptly
4. **Opportunity Identification:** Leverage insights from trending keywords

## Conclusion

The analyzed signals provide a comprehensive view of current market trends and strategic opportunities. Regular monitoring and analysis of these signals will enable proactive strategic decision-making.

---

*Brief generated using ${validSignals.length} signals*`;

      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Sources routes
  app.get("/api/sources", requireAuth, async (req, res) => {
    try {
      const sources = await storage.getSourcesByUserId(req.session.userId!);
      res.json({ sources });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sources/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await sourceManagerService.getSourceAnalytics(req.session.userId!);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });



  app.get("/api/sources/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const source = await storage.getSource(id);
      
      if (!source || source.userId !== req.session.userId) {
        return res.status(404).json({ message: "Source not found" });
      }
      
      const relatedSignals = await storage.getSignalsForSource(id);
      res.json({ source, relatedSignals });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/sources/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const source = await storage.getSource(id);
      if (!source || source.userId !== req.session.userId) {
        return res.status(404).json({ message: "Source not found" });
      }
      
      const updatedSource = await storage.updateSource(id, updates);
      res.json({ source: updatedSource });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Debug and performance monitoring routes
  app.get('/api/debug/logs', requireAuth, (req, res) => {
    const logs = debugLogger.getRecentLogs(100);
    res.json({ logs });
  });

  app.get('/api/debug/errors', requireAuth, (req, res) => {
    const errorSummary = debugLogger.getErrorSummary();
    res.json({ errorSummary });
  });

  app.get('/api/debug/performance', requireAuth, (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    const endpointStats = performanceMonitor.getEndpointStats();
    res.json({ metrics, endpointStats });
  });

  app.delete('/api/debug/logs', requireAuth, (req, res) => {
    debugLogger.clearLogs();
    performanceMonitor.clearMetrics();
    res.json({ message: 'Logs and metrics cleared' });
  });

  // Feed management routes
  app.get("/api/feeds/sources", requireAuth, async (req, res) => {
    try {
      const feedSources = await feedManagerService.getUserFeedSources(req.session.userId!);
      res.json({ feedSources });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/feeds/sources", requireAuth, async (req, res) => {
    try {
      const { name, feedType, sourceType, sourceUrl, sourceConfig, updateFrequency } = req.body;
      
      const feedSource = await feedManagerService.createUserFeedSource(req.session.userId!, {
        name,
        feedType,
        sourceType,
        sourceUrl,
        sourceConfig,
        updateFrequency: updateFrequency || "4h"
      });
      
      res.json({ feedSource });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/feeds/sources/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const feedSource = await feedManagerService.updateUserFeedSource(id, updates);
      res.json({ feedSource });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/feeds/sources/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await feedManagerService.deleteUserFeedSource(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/feeds/items", requireAuth, async (req, res) => {
    try {
      const feedType = req.query.feedType as string;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const feedItems = await feedManagerService.fetchFeedItems(req.session.userId!, feedType, limit);
      res.json({ feedItems });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/feeds/refresh", requireAuth, async (req, res) => {
    try {
      const result = await feedManagerService.refreshUserFeeds(req.session.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/feeds/profile", requireAuth, async (req, res) => {
    try {
      const profile = await feedManagerService.getUserTopicProfile(req.session.userId!);
      res.json({ profile });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/topic-profile", requireAuth, async (req, res) => {
    try {
      const profile = await feedManagerService.getUserTopicProfile(req.session.userId!);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user/topic-profile", requireAuth, async (req, res) => {
    try {
      const profile = await feedManagerService.updateUserTopicProfile(req.session.userId!, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/user/topic-profile", requireAuth, async (req, res) => {
    try {
      const profile = await feedManagerService.updateUserTopicProfile(req.session.userId!, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/feeds/profile", requireAuth, async (req, res) => {
    try {
      const profile = await feedManagerService.updateUserTopicProfile(req.session.userId!, req.body);
      res.json({ profile });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/feeds/items/:id/read", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await feedManagerService.markFeedItemAsRead(req.session.userId!, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/feeds/items/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await feedManagerService.bookmarkFeedItem(req.session.userId!, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
