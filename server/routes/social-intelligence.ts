/**
 * Social Intelligence API Routes
 * Beta testing endpoints for social media scraping
 */

import { Router } from 'express';
import { socialMediaIntelligence } from '../services/social-media-intelligence';
import { requireAuth } from '../middleware/auth';
import { debugLogger } from '../services/debug-logger';

const router = Router();

// LinkedIn Company Intelligence
router.post('/linkedin/company/:slug', requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    debugLogger.info('LinkedIn company intelligence request', { slug, userId: req.session.userId });
    
    const result = await socialMediaIntelligence.scrapeLinkedInCompany(slug);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: result.metadata,
        platform: 'LinkedIn'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        platform: 'LinkedIn'
      });
    }
  } catch (error) {
    debugLogger.error('LinkedIn company scraping error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to scrape LinkedIn company data'
    });
  }
});

// Twitter Trending Intelligence
router.get('/twitter/trends', requireAuth, async (req, res) => {
  try {
    const { location = 'worldwide' } = req.query;
    debugLogger.info('Twitter trends request', { location, userId: req.session.userId });
    
    const result = await socialMediaIntelligence.scrapeTwitterTrends(location as string);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: result.metadata,
        platform: 'Twitter'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        platform: 'Twitter'
      });
    }
  } catch (error) {
    debugLogger.error('Twitter trends scraping error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Twitter trends'
    });
  }
});

// Instagram Hashtag Intelligence
router.post('/instagram/hashtags', requireAuth, async (req, res) => {
  try {
    const { hashtags } = req.body;
    if (!Array.isArray(hashtags) || hashtags.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hashtags array is required'
      });
    }
    
    debugLogger.info('Instagram hashtag intelligence request', { hashtags, userId: req.session.userId });
    
    const results = await socialMediaIntelligence.scrapeInstagramHashtags(hashtags);
    
    res.json({
      success: true,
      data: results,
      platform: 'Instagram',
      hashtagsAnalyzed: hashtags.length
    });
  } catch (error) {
    debugLogger.error('Instagram hashtag scraping error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Instagram hashtag data'
    });
  }
});

// TikTok Trending Intelligence
router.get('/tiktok/trends', requireAuth, async (req, res) => {
  try {
    debugLogger.info('TikTok trends request', { userId: req.session.userId });
    
    const result = await socialMediaIntelligence.scrapeTikTokTrends();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: result.metadata,
        platform: 'TikTok'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        platform: 'TikTok'
      });
    }
  } catch (error) {
    debugLogger.error('TikTok trends scraping error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to scrape TikTok trends'
    });
  }
});

// Executive LinkedIn Intelligence
router.post('/linkedin/executive/:profile', requireAuth, async (req, res) => {
  try {
    const { profile } = req.params;
    debugLogger.info('Executive LinkedIn intelligence request', { profile, userId: req.session.userId });
    
    const result = await socialMediaIntelligence.scrapeExecutiveLinkedIn(profile);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        metadata: result.metadata,
        platform: 'LinkedIn'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        platform: 'LinkedIn'
      });
    }
  } catch (error) {
    debugLogger.error('Executive LinkedIn scraping error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to scrape executive LinkedIn data'
    });
  }
});

// Get social media capabilities and cost controls
router.get('/capabilities', requireAuth, async (req, res) => {
  try {
    const capabilities = socialMediaIntelligence.getSocialCapabilities();
    
    res.json({
      success: true,
      capabilities,
      betaStatus: 'Active',
      costEstimation: {
        dailyBudget: '$5-15',
        monthlyEstimate: '$150-450',
        perRequestCost: '$0.005-0.02'
      }
    });
  } catch (error) {
    debugLogger.error('Social capabilities error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve social capabilities'
    });
  }
});

// Update cost controls (admin only)
router.post('/cost-controls', requireAuth, async (req, res) => {
  try {
    // Simple admin check (you can enhance this)
    if (req.session.userId !== 14) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { maxDataPerRequest, sampleSize, enableImageSkipping } = req.body;
    
    socialMediaIntelligence.updateCostControls({
      maxDataPerRequest,
      sampleSize,
      enableImageSkipping
    });
    
    res.json({
      success: true,
      message: 'Cost controls updated',
      newSettings: socialMediaIntelligence.getSocialCapabilities().costControls
    });
  } catch (error) {
    debugLogger.error('Cost controls update error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Failed to update cost controls'
    });
  }
});

export default router;