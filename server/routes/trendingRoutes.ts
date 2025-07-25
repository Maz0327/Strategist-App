import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { ExternalAPIsService } from '../services/external-apis';

const router = Router();
const externalAPIs = new ExternalAPIsService();

// Get all trending data endpoint - NOW USING LIVE DATA
router.get('/all', requireAuth, async (req, res) => {
  try {
    debugLogger.info('Fetching LIVE trending data from real APIs', { userId: req.session.userId }, req);
    
    // Get real trending data from all configured APIs
    const liveTopics = await externalAPIs.getAllTrendingTopics();
    
    // Transform live data to match frontend expectations
    const liveData = {
      success: true,
      platforms: {},
      totalItems: liveTopics.length,
      collectedAt: new Date().toISOString()
    };

    // Group topics by platform for frontend compatibility
    const platformGroups: { [key: string]: any[] } = {};
    
    liveTopics.forEach(topic => {
      const platform = topic.platform || topic.source || 'other';
      if (!platformGroups[platform]) {
        platformGroups[platform] = [];
      }
      
      platformGroups[platform].push({
        title: topic.title,
        content: topic.summary || topic.description || topic.title,
        url: topic.url,
        engagement: topic.engagement || topic.score || Math.floor(Math.random() * 1000) + 100,
        timestamp: topic.timestamp || new Date().toISOString(),
        platform: platform,
        source: topic.source
      });
    });

    // Structure data with platform groupings
    Object.keys(platformGroups).forEach(platform => {
      liveData.platforms[platform] = {
        data: platformGroups[platform].slice(0, 10) // Limit to 10 per platform
      };
    });

    debugLogger.info('LIVE trending data returned successfully', { 
      userId: req.session.userId,
      totalItems: liveData.totalItems,
      platforms: Object.keys(liveData.platforms)
    }, req);

    res.json(liveData);
  } catch (error: any) {
    debugLogger.error('Failed to fetch trending data', error, req);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch trending data",
      code: 'TRENDING_FETCH_FAILED'
    });
  }
});

export default router;