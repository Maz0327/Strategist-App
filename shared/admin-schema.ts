import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Analytics Table
export const userAnalytics = pgTable("user_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  action: text("action").notNull(), // 'page_view', 'button_click', 'feature_usage', 'api_call'
  feature: text("feature"), // 'content_analysis', 'brief_builder', 'signal_mining', etc.
  details: jsonb("details"), // Additional context data
  timestamp: timestamp("timestamp").defaultNow(),
  duration: integer("duration"), // Time spent on action in milliseconds
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

// User Feedback Table
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // 'bug', 'feature_request', 'general', 'rating'
  category: text("category"), // 'ui', 'performance', 'functionality', 'content'
  rating: integer("rating"), // 1-5 star rating
  title: text("title"),
  description: text("description"),
  screenshot: text("screenshot"), // Base64 or URL
  status: text("status").default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feature Usage Stats Table
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  feature: text("feature").notNull(),
  userId: integer("user_id").references(() => users.id),
  usageCount: integer("usage_count").default(1),
  lastUsed: timestamp("last_used").defaultNow(),
  avgSessionDuration: integer("avg_session_duration"), // in milliseconds
  successRate: integer("success_rate"), // percentage
  date: timestamp("date").defaultNow(),
});

// System Performance Table
export const systemPerformance = pgTable("system_performance", {
  id: serial("id").primaryKey(),
  metric: text("metric").notNull(), // 'response_time', 'error_rate', 'active_users'
  value: integer("value").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  details: jsonb("details"),
});

// A/B Test Results Table
export const abTestResults = pgTable("ab_test_results", {
  id: serial("id").primaryKey(),
  testName: text("test_name").notNull(),
  userId: integer("user_id").references(() => users.id),
  variant: text("variant").notNull(), // 'A', 'B', 'control'
  outcome: text("outcome"), // 'conversion', 'bounce', 'engagement'
  value: integer("value"), // numeric outcome value
  timestamp: timestamp("timestamp").defaultNow(),
});

// Export schemas
export const insertUserAnalyticsSchema = createInsertSchema(userAnalytics).omit({
  id: true,
  timestamp: true,
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  lastUsed: true,
  date: true,
});

export const insertSystemPerformanceSchema = createInsertSchema(systemPerformance).omit({
  id: true,
  timestamp: true,
});

export const insertAbTestResultsSchema = createInsertSchema(abTestResults).omit({
  id: true,
  timestamp: true,
});

// Types
export type UserAnalytics = typeof userAnalytics.$inferSelect;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;

export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;

export type SystemPerformance = typeof systemPerformance.$inferSelect;
export type InsertSystemPerformance = z.infer<typeof insertSystemPerformanceSchema>;

export type AbTestResults = typeof abTestResults.$inferSelect;
export type InsertAbTestResults = z.infer<typeof insertAbTestResultsSchema>;

// Import users table reference
import { users } from "./schema";