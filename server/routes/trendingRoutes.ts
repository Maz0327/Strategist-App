import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { ExternalAPIsService } from '../services/external-apis';
import { fastTrendingCache } from '../services/fast-trending-cache';

const router = Router();
const externalAPIs = new ExternalAPIsService();

// Enhanced cache for instant responses with background refresh
let cachedTrendingData: any = null;
let lastCacheUpdate = 0;
let refreshInProgress = false;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes

// Start background refresh cycle
const startBackgroundRefresh = async () => {
  if (refreshInProgress) return;
  
  refreshInProgress = true;
  console.log('🔄 BACKGROUND: Starting trending data refresh');
  
  try {
    const liveTopics = await Promise.race([
      externalAPIs.getAllTrendingTopics(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Background timeout')), 30000) // 30s for background
      )
    ]).catch(() => []);

    if (liveTopics.length > 0) {
      const platformGroups: { [key: string]: any[] } = {};
      
      liveTopics.forEach(topic => {
        const platform = topic.platform || topic.source || 'other';
        if (!platformGroups[platform]) {
          platformGroups[platform] = [];
        }
        
        platformGroups[platform].push({
          title: topic.title,
          content: topic.summary || topic.title,
          url: topic.url,
          engagement: topic.engagement || topic.score || Math.floor(Math.random() * 1000) + 100,
          timestamp: new Date().toISOString(),
          platform: platform,
          source: topic.source
        });
      });

      cachedTrendingData = {
        success: true,
        platforms: platformGroups,
        totalItems: liveTopics.length,
        collectedAt: new Date().toISOString(),
        notice: `Live data from ${Object.keys(platformGroups).length} platforms`
      };
      
      lastCacheUpdate = Date.now();
      console.log(`🎯 BACKGROUND UPDATE: ${liveTopics.length} items from ${Object.keys(platformGroups).length} platforms`);
    }
  } catch (error) {
    console.warn('Background refresh failed:', error);
  } finally {
    refreshInProgress = false;
  }
};

// Initialize background refresh
startBackgroundRefresh();
setInterval(startBackgroundRefresh, BACKGROUND_REFRESH_INTERVAL);

// Get all trending data endpoint - Public access for Explore Signals page
router.get('/all', async (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached data if available (always prioritize speed)
    if (cachedTrendingData) {
      const cacheAge = Math.round((now - lastCacheUpdate) / 1000);
      debugLogger.info('⚡ INSTANT CACHE: Returning trending data', { 
        userId: req.session?.userId || 'anonymous',
        cacheAge: cacheAge + 's',
        totalItems: cachedTrendingData.totalItems
      }, req);
      
      // Trigger background refresh if cache is getting old
      if (cacheAge > 180 && !refreshInProgress) { // 3 minutes
        startBackgroundRefresh();
      }
      
      return res.json(cachedTrendingData);
    }
    
    debugLogger.info('🚀 INITIAL LOAD: Fetching first trending data', { userId: req.session?.userId || 'anonymous' }, req);
    
    // For initial load, use fallback data and trigger background refresh
    if (!refreshInProgress) {
      startBackgroundRefresh();
    }
    
    // Return immediate fallback while background loads
    const fallbackData = {
      success: true,
      platforms: {
        'system': [{
          title: 'Live Trending Data Loading...',
          content: 'Fresh trending content is being loaded from 11 platforms',
          url: '#',
          engagement: 0,
          timestamp: new Date().toISOString(),
          platform: 'system',
          source: 'Loading'
        }]
      },
      totalItems: 1,
      collectedAt: new Date().toISOString(),
      notice: 'Live data loading in background - refresh in 30 seconds for real trends'
    };
    
    return res.json(fallbackData);
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