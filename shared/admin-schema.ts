import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

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

// API Calls Tracking Table
export const apiCalls = pgTable("api_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  endpoint: text("endpoint").notNull(), // '/api/analyze', '/api/signals', etc.
  method: text("method").notNull(), // 'GET', 'POST', 'PUT', 'DELETE'
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(), // in milliseconds
  requestSize: integer("request_size"), // in bytes
  responseSize: integer("response_size"), // in bytes
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
  errorMessage: text("error_message"), // for failed requests
  metadata: jsonb("metadata"), // additional context (OpenAI tokens, etc.)
});

// External API Calls Table (OpenAI, Google Trends, etc.)
export const externalApiCalls = pgTable("external_api_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  service: text("service").notNull(), // 'openai', 'google_trends', 'reddit', etc.
  endpoint: text("endpoint"), // specific API endpoint called
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time").notNull(),
  tokenUsage: integer("token_usage"), // for OpenAI calls
  cost: integer("cost"), // cost in cents
  timestamp: timestamp("timestamp").defaultNow(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
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

export const insertApiCallsSchema = createInsertSchema(apiCalls).omit({
  id: true,
  timestamp: true,
});

export const insertExternalApiCallsSchema = createInsertSchema(externalApiCalls).omit({
  id: true,
  timestamp: true,
});

export const insertAbTestResultsSchema = createInsertSchema(abTestResults).omit({
  id: true,
  timestamp: true,
});

export const insertApiCallSchema = createInsertSchema(apiCalls).omit({
  id: true,
  timestamp: true,
});

export const insertExternalApiCallSchema = createInsertSchema(externalApiCalls).omit({
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

export type ApiCalls = typeof apiCalls.$inferSelect;
export type InsertApiCalls = z.infer<typeof insertApiCallSchema>;

export type ExternalApiCalls = typeof externalApiCalls.$inferSelect;
export type InsertExternalApiCalls = z.infer<typeof insertExternalApiCallSchema>;

