import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const topicProfileSchema = z.object({
  interests: z.array(z.string().min(1, 'Interest cannot be empty')).max(20, 'Too many interests'),
  industries: z.array(z.string().min(1, 'Industry cannot be empty')).max(10, 'Too many industries'),
  preferredSources: z.array(z.string().url('Invalid source URL')).max(50, 'Too many sources').optional(),
  excludeKeywords: z.array(z.string().min(1, 'Keyword cannot be empty')).max(100, 'Too many keywords').optional()
});

const feedSourceSchema = z.object({
  name: z.string().min(1, 'Feed name is required').max(100, 'Name too long'),
  url: z.string().url('Invalid URL format'),
  category: z.enum(['news', 'blog', 'social', 'research', 'other']).default('other'),
  isActive: z.boolean().default(true)
});

// User profile routes
router.get("/topic-profile", requireAuth, async (req, res) => {
  try {
    const profile = await storage.getUserTopicProfile(req.session.userId!);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: "Topic profile not found",
        code: 'TOPIC_PROFILE_NOT_FOUND'
      });
    }
    res.json({ success: true, data: profile });
  } catch (error: any) {
    debugLogger.error("Failed to get topic profile", error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get topic profile",
      code: 'GET_TOPIC_PROFILE_FAILED'
    });
  }
});

router.post("/topic-profile", requireAuth, async (req, res) => {
  try {
    const result = topicProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const profile = await storage.createUserTopicProfile({
      userId: req.session.userId!,
      ...result.data
    });
    
    debugLogger.info('Topic profile created successfully', { 
      userId: req.session.userId,
      interestsCount: result.data.interests.length,
      industriesCount: result.data.industries.length
    }, req);
    
    res.status(201).json({ success: true, data: profile });
  } catch (error: any) {
    debugLogger.error("Failed to create topic profile", error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create topic profile",
      code: 'CREATE_TOPIC_PROFILE_FAILED'
    });
  }
});

router.put("/topic-profile", requireAuth, async (req, res) => {
  try {
    const result = topicProfileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const profile = await storage.updateUserTopicProfile(req.session.userId!, result.data);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: "Topic profile not found",
        code: 'TOPIC_PROFILE_NOT_FOUND'
      });
    }
    
    debugLogger.info('Topic profile updated successfully', { 
      userId: req.session.userId,
      interestsCount: result.data.interests.length,
      industriesCount: result.data.industries.length
    }, req);
    
    res.json({ success: true, data: profile });
  } catch (error: any) {
    debugLogger.error("Failed to update topic profile", error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update topic profile",
      code: 'UPDATE_TOPIC_PROFILE_FAILED'
    });
  }
});

// Feed source management routes
router.get("/feed-sources", requireAuth, async (req, res) => {
  try {
    const sources = await storage.getUserFeedSources(req.session.userId!);
    res.json({ 
      success: true, 
      data: { 
        sources,
        count: sources.length
      }
    });
  } catch (error: any) {
    debugLogger.error("Failed to get feed sources", error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get feed sources",
      code: 'GET_FEED_SOURCES_FAILED'
    });
  }
});

router.post("/feed-sources", requireAuth, async (req, res) => {
  try {
    const result = feedSourceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: result.error.errors,
        code: 'VALIDATION_ERROR'
      });
    }

    const source = await storage.createUserFeedSource({
      userId: req.session.userId!,
      name: result.data.name,
      feedType: result.data.category,
      sourceType: 'rss',
      sourceUrl: result.data.url,
      isActive: result.data.isActive
    });
    
    debugLogger.info('Feed source created successfully', { 
      userId: req.session.userId,
      sourceName: result.data.name,
      sourceUrl: result.data.url,
      category: result.data.category
    }, req);
    
    res.status(201).json({ success: true, data: source });
  } catch (error: any) {
    debugLogger.error("Failed to create feed source", error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create feed source",
      code: 'CREATE_FEED_SOURCE_FAILED'
    });
  }
});

export default router;