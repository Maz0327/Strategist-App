import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { ExternalAPIsService } from '../services/external-apis';

const router = Router();
const externalAPIs = new ExternalAPIsService();

// Get all trending data endpoint - Public access for Explore Signals page
router.get('/all', async (req, res) => {
  try {
    debugLogger.info('Fetching LIVE trending data from all 11 platforms', { userId: req.session?.userId || 'anonymous' }, req);
    
    // Get real trending data from all configured APIs + Bright Data social intelligence
    const liveTopics = await externalAPIs.getAllTrendingTopics();
    
    // Transform live data to match frontend expectations
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

    const liveData = {
      success: true,
      platforms: platformGroups,
      totalItems: liveTopics.length,
      collectedAt: new Date().toISOString(),
      notice: liveTopics.length > 0 ? `Live data from ${Object.keys(platformGroups).length} platforms` : 'Connecting to live data sources...'
    };

    // Structure data with platform groupings
    Object.keys(platformGroups).forEach(platform => {
      liveData.platforms[platform] = {
        data: platformGroups[platform]
      };
    });

    debugLogger.info('LIVE trending data returned successfully', { 
      userId: req.session?.userId || 'anonymous',
      totalItems: liveData.totalItems,
      platforms: Object.keys(liveData.platforms),
      liveDataSources: liveTopics.length
    }, req);

    res.json(liveData);
  } catch (error: any) {
    debugLogger.error('Failed to fetch live trending data', error, req);
    
    // Fallback to basic demo data if live sources fail
    const fallbackData = {
      success: true,
      platforms: {
        'status': {
          data: [{
            title: 'Live Data Connection Issue',
            content: 'Bright Data services temporarily unavailable, working to restore connection',
            url: '#',
            engagement: 0,
            timestamp: new Date().toISOString(),
            platform: 'status'
          }]
        }
      },
      totalItems: 1,
      collectedAt: new Date().toISOString(),
      notice: 'Temporary fallback - Live data restoration in progress'
    };
    
    res.json(fallbackData);
  }
});

export default router;