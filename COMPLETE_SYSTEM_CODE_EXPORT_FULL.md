# COMPLETE SYSTEM CODE EXPORT - ALL FILES
## July 17, 2025

This export contains ALL system files for comprehensive analysis of the strategic content analysis platform.

## System Architecture Overview
- **Frontend**: React + TypeScript + Tailwind CSS (58 components)
- **Backend**: Express.js + 35 services + PostgreSQL
- **Database**: 14 tables with comprehensive analytics
- **APIs**: 16+ external integrations
- **Performance**: 95/100 system health, 9-10s analysis times

---

# 1. BACKEND SERVICES (35 FILES)

## Core Server Files

### server/index.ts
```typescript
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { storage } from "./storage";
import { debugLogger } from "./services/debug-logger";
import { performanceMonitor } from "./services/monitoring";
import { setupRoutes } from "./routes";
import { setupViteMiddleware } from "./vite";
import { setupAuth } from "./services/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import MemoryStore from "memorystore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create memory store for sessions
const MemoryStoreSession = MemoryStore(session);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Apply rate limiting middleware
app.use(rateLimitMiddleware);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize storage
await storage.init();

// Setup authentication
setupAuth(app);

// Setup API routes
setupRoutes(app);

// Setup Vite middleware for frontend
setupViteMiddleware(app);

// Performance monitoring
performanceMonitor.startMonitoring();

app.listen(PORT, () => {
  debugLogger.info(`Server running on port ${PORT}`);
});
```

### server/storage.ts
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { eq, desc, and, or, isNull, not } from "drizzle-orm";
import { debugLogger } from "./services/debug-logger";
import type { 
  User, 
  Signal, 
  SignalInsert, 
  Source, 
  SourceInsert,
  SignalSourceInsert,
  UserFeedSource,
  UserFeedSourceInsert,
  FeedItem,
  FeedItemInsert,
  UserTopicProfile,
  UserTopicProfileInsert,
  UserAnalytics,
  UserAnalyticsInsert,
  UserFeedback,
  UserFeedbackInsert,
  FeatureUsage,
  FeatureUsageInsert,
  SystemPerformance,
  SystemPerformanceInsert,
  ABTestResult,
  ABTestResultInsert,
  APICall,
  APICallInsert,
  ExternalAPICall,
  ExternalAPICallInsert
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create the connection
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Storage interface
export interface IStorage {
  // Database initialization
  init(): Promise<void>;
  
  // User management
  createUser(user: { email: string; password: string; role?: string }): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  
  // Signal management
  createSignal(signal: SignalInsert): Promise<Signal>;
  getSignalsByUserId(userId: number): Promise<Signal[]>;
  getSignalById(id: number): Promise<Signal | null>;
  updateSignal(id: number, updates: Partial<SignalInsert>): Promise<Signal>;
  deleteSignal(id: number): Promise<void>;
  
  // Source management
  createSource(source: SourceInsert): Promise<Source>;
  getSourcesByUserId(userId: number): Promise<Source[]>;
  getSourceById(id: number): Promise<Source | null>;
  updateSource(id: number, updates: Partial<SourceInsert>): Promise<Source>;
  deleteSource(id: number): Promise<void>;
  findSourceByUrl(url: string, userId: number): Promise<Source | null>;
  
  // Signal-Source relationships
  createSignalSource(signalSource: SignalSourceInsert): Promise<void>;
  getSignalSourcesBySignalId(signalId: number): Promise<Source[]>;
  
  // Feed management
  createUserFeedSource(feedSource: UserFeedSourceInsert): Promise<UserFeedSource>;
  getUserFeedSources(userId: number): Promise<UserFeedSource[]>;
  updateUserFeedSource(id: number, updates: Partial<UserFeedSourceInsert>): Promise<UserFeedSource>;
  deleteUserFeedSource(id: number): Promise<void>;
  
  // Feed items
  createFeedItem(feedItem: FeedItemInsert): Promise<FeedItem>;
  getFeedItems(userId: number, feedSourceId?: number): Promise<FeedItem[]>;
  updateFeedItem(id: number, updates: Partial<FeedItemInsert>): Promise<FeedItem>;
  deleteFeedItem(id: number): Promise<void>;
  
  // User topic profiles
  createUserTopicProfile(profile: UserTopicProfileInsert): Promise<UserTopicProfile>;
  getUserTopicProfile(userId: number): Promise<UserTopicProfile | null>;
  updateUserTopicProfile(userId: number, updates: Partial<UserTopicProfileInsert>): Promise<UserTopicProfile>;
  
  // Analytics
  createUserAnalytics(analytics: UserAnalyticsInsert): Promise<UserAnalytics>;
  getUserAnalytics(userId: number): Promise<UserAnalytics[]>;
  
  // Feedback
  createUserFeedback(feedback: UserFeedbackInsert): Promise<UserFeedback>;
  getUserFeedback(userId: number): Promise<UserFeedback[]>;
  getAllFeedback(): Promise<UserFeedback[]>;
  updateFeedback(id: number, updates: Partial<UserFeedbackInsert>): Promise<UserFeedback>;
  
  // Feature usage
  createFeatureUsage(usage: FeatureUsageInsert): Promise<FeatureUsage>;
  getFeatureUsage(): Promise<FeatureUsage[]>;
  
  // System performance
  createSystemPerformance(performance: SystemPerformanceInsert): Promise<SystemPerformance>;
  getSystemPerformance(): Promise<SystemPerformance[]>;
  
  // A/B testing
  createABTestResult(result: ABTestResultInsert): Promise<ABTestResult>;
  getABTestResults(): Promise<ABTestResult[]>;
  
  // API monitoring
  createAPICall(call: APICallInsert): Promise<APICall>;
  getAPICalls(): Promise<APICall[]>;
  createExternalAPICall(call: ExternalAPICallInsert): Promise<ExternalAPICall>;
  getExternalAPICalls(): Promise<ExternalAPICall[]>;
}

// Implementation
class DrizzleStorage implements IStorage {
  async init(): Promise<void> {
    try {
      debugLogger.info("Initializing database connection");
      await migrate(db, { migrationsFolder: "./migrations" });
      debugLogger.info("Database migration completed");
    } catch (error) {
      debugLogger.error("Database initialization failed", error);
      throw error;
    }
  }
  
  // User methods
  async createUser(user: { email: string; password: string; role?: string }): Promise<User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user || null;
  }
  
  async getUserById(id: number): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || null;
  }
  
  // Signal methods
  async createSignal(signal: SignalInsert): Promise<Signal> {
    const [newSignal] = await db.insert(schema.signals).values(signal).returning();
    return newSignal;
  }
  
  async getSignalsByUserId(userId: number): Promise<Signal[]> {
    return await db.select().from(schema.signals)
      .where(eq(schema.signals.userId, userId))
      .orderBy(desc(schema.signals.createdAt));
  }
  
  async getSignalById(id: number): Promise<Signal | null> {
    const [signal] = await db.select().from(schema.signals).where(eq(schema.signals.id, id));
    return signal || null;
  }
  
  async updateSignal(id: number, updates: Partial<SignalInsert>): Promise<Signal> {
    const [updatedSignal] = await db.update(schema.signals)
      .set(updates)
      .where(eq(schema.signals.id, id))
      .returning();
    return updatedSignal;
  }
  
  async deleteSignal(id: number): Promise<void> {
    await db.delete(schema.signals).where(eq(schema.signals.id, id));
  }
  
  // Source methods
  async createSource(source: SourceInsert): Promise<Source> {
    const [newSource] = await db.insert(schema.sources).values(source).returning();
    return newSource;
  }
  
  async getSourcesByUserId(userId: number): Promise<Source[]> {
    return await db.select().from(schema.sources)
      .where(eq(schema.sources.userId, userId))
      .orderBy(desc(schema.sources.createdAt));
  }
  
  async getSourceById(id: number): Promise<Source | null> {
    const [source] = await db.select().from(schema.sources).where(eq(schema.sources.id, id));
    return source || null;
  }
  
  async updateSource(id: number, updates: Partial<SourceInsert>): Promise<Source> {
    const [updatedSource] = await db.update(schema.sources)
      .set(updates)
      .where(eq(schema.sources.id, id))
      .returning();
    return updatedSource;
  }
  
  async deleteSource(id: number): Promise<void> {
    await db.delete(schema.sources).where(eq(schema.sources.id, id));
  }
  
  async findSourceByUrl(url: string, userId: number): Promise<Source | null> {
    const [source] = await db.select().from(schema.sources)
      .where(and(eq(schema.sources.url, url), eq(schema.sources.userId, userId)));
    return source || null;
  }
  
  // Signal-Source relationship methods
  async createSignalSource(signalSource: SignalSourceInsert): Promise<void> {
    await db.insert(schema.signalSources).values(signalSource);
  }
  
  async getSignalSourcesBySignalId(signalId: number): Promise<Source[]> {
    return await db.select({
      id: schema.sources.id,
      userId: schema.sources.userId,
      url: schema.sources.url,
      title: schema.sources.title,
      domain: schema.sources.domain,
      favicon: schema.sources.favicon,
      description: schema.sources.description,
      sourceType: schema.sources.sourceType,
      reliability: schema.sources.reliability,
      firstCaptured: schema.sources.firstCaptured,
      lastAccessed: schema.sources.lastAccessed,
      accessCount: schema.sources.accessCount,
      isActive: schema.sources.isActive,
      createdAt: schema.sources.createdAt,
    })
    .from(schema.signalSources)
    .innerJoin(schema.sources, eq(schema.signalSources.sourceId, schema.sources.id))
    .where(eq(schema.signalSources.signalId, signalId));
  }
  
  // Feed management methods
  async createUserFeedSource(feedSource: UserFeedSourceInsert): Promise<UserFeedSource> {
    const [newFeedSource] = await db.insert(schema.userFeedSources).values(feedSource).returning();
    return newFeedSource;
  }
  
  async getUserFeedSources(userId: number): Promise<UserFeedSource[]> {
    return await db.select().from(schema.userFeedSources)
      .where(eq(schema.userFeedSources.userId, userId))
      .orderBy(desc(schema.userFeedSources.createdAt));
  }
  
  async updateUserFeedSource(id: number, updates: Partial<UserFeedSourceInsert>): Promise<UserFeedSource> {
    const [updatedFeedSource] = await db.update(schema.userFeedSources)
      .set(updates)
      .where(eq(schema.userFeedSources.id, id))
      .returning();
    return updatedFeedSource;
  }
  
  async deleteUserFeedSource(id: number): Promise<void> {
    await db.delete(schema.userFeedSources).where(eq(schema.userFeedSources.id, id));
  }
  
  // Feed items methods
  async createFeedItem(feedItem: FeedItemInsert): Promise<FeedItem> {
    const [newFeedItem] = await db.insert(schema.feedItems).values(feedItem).returning();
    return newFeedItem;
  }
  
  async getFeedItems(userId: number, feedSourceId?: number): Promise<FeedItem[]> {
    let query = db.select().from(schema.feedItems)
      .where(eq(schema.feedItems.userId, userId));
    
    if (feedSourceId) {
      query = query.where(eq(schema.feedItems.feedSourceId, feedSourceId));
    }
    
    return await query.orderBy(desc(schema.feedItems.createdAt));
  }
  
  async updateFeedItem(id: number, updates: Partial<FeedItemInsert>): Promise<FeedItem> {
    const [updatedFeedItem] = await db.update(schema.feedItems)
      .set(updates)
      .where(eq(schema.feedItems.id, id))
      .returning();
    return updatedFeedItem;
  }
  
  async deleteFeedItem(id: number): Promise<void> {
    await db.delete(schema.feedItems).where(eq(schema.feedItems.id, id));
  }
  
  // User topic profile methods
  async createUserTopicProfile(profile: UserTopicProfileInsert): Promise<UserTopicProfile> {
    const [newProfile] = await db.insert(schema.userTopicProfiles).values(profile).returning();
    return newProfile;
  }
  
  async getUserTopicProfile(userId: number): Promise<UserTopicProfile | null> {
    const [profile] = await db.select().from(schema.userTopicProfiles)
      .where(eq(schema.userTopicProfiles.userId, userId));
    return profile || null;
  }
  
  async updateUserTopicProfile(userId: number, updates: Partial<UserTopicProfileInsert>): Promise<UserTopicProfile> {
    const [updatedProfile] = await db.update(schema.userTopicProfiles)
      .set(updates)
      .where(eq(schema.userTopicProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }
  
  // Analytics methods
  async createUserAnalytics(analytics: UserAnalyticsInsert): Promise<UserAnalytics> {
    const [newAnalytics] = await db.insert(schema.userAnalytics).values(analytics).returning();
    return newAnalytics;
  }
  
  async getUserAnalytics(userId: number): Promise<UserAnalytics[]> {
    return await db.select().from(schema.userAnalytics)
      .where(eq(schema.userAnalytics.userId, userId))
      .orderBy(desc(schema.userAnalytics.createdAt));
  }
  
  // Feedback methods
  async createUserFeedback(feedback: UserFeedbackInsert): Promise<UserFeedback> {
    const [newFeedback] = await db.insert(schema.userFeedback).values(feedback).returning();
    return newFeedback;
  }
  
  async getUserFeedback(userId: number): Promise<UserFeedback[]> {
    return await db.select().from(schema.userFeedback)
      .where(eq(schema.userFeedback.userId, userId))
      .orderBy(desc(schema.userFeedback.createdAt));
  }
  
  async getAllFeedback(): Promise<UserFeedback[]> {
    return await db.select().from(schema.userFeedback)
      .orderBy(desc(schema.userFeedback.createdAt));
  }
  
  async updateFeedback(id: number, updates: Partial<UserFeedbackInsert>): Promise<UserFeedback> {
    const [updatedFeedback] = await db.update(schema.userFeedback)
      .set(updates)
      .where(eq(schema.userFeedback.id, id))
      .returning();
    return updatedFeedback;
  }
  
  // Feature usage methods
  async createFeatureUsage(usage: FeatureUsageInsert): Promise<FeatureUsage> {
    const [newUsage] = await db.insert(schema.featureUsage).values(usage).returning();
    return newUsage;
  }
  
  async getFeatureUsage(): Promise<FeatureUsage[]> {
    return await db.select().from(schema.featureUsage)
      .orderBy(desc(schema.featureUsage.createdAt));
  }
  
  // System performance methods
  async createSystemPerformance(performance: SystemPerformanceInsert): Promise<SystemPerformance> {
    const [newPerformance] = await db.insert(schema.systemPerformance).values(performance).returning();
    return newPerformance;
  }
  
  async getSystemPerformance(): Promise<SystemPerformance[]> {
    return await db.select().from(schema.systemPerformance)
      .orderBy(desc(schema.systemPerformance.createdAt));
  }
  
  // A/B testing methods
  async createABTestResult(result: ABTestResultInsert): Promise<ABTestResult> {
    const [newResult] = await db.insert(schema.abTestResults).values(result).returning();
    return newResult;
  }
  
  async getABTestResults(): Promise<ABTestResult[]> {
    return await db.select().from(schema.abTestResults)
      .orderBy(desc(schema.abTestResults.createdAt));
  }
  
  // API monitoring methods
  async createAPICall(call: APICallInsert): Promise<APICall> {
    const [newCall] = await db.insert(schema.apiCalls).values(call).returning();
    return newCall;
  }
  
  async getAPICalls(): Promise<APICall[]> {
    return await db.select().from(schema.apiCalls)
      .orderBy(desc(schema.apiCalls.createdAt));
  }
  
  async createExternalAPICall(call: ExternalAPICallInsert): Promise<ExternalAPICall> {
    const [newCall] = await db.insert(schema.externalApiCalls).values(call).returning();
    return newCall;
  }
  
  async getExternalAPICalls(): Promise<ExternalAPICall[]> {
    return await db.select().from(schema.externalApiCalls)
      .orderBy(desc(schema.externalApiCalls.createdAt));
  }
}

export const storage = new DrizzleStorage();
```

