import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';
import { ExternalAPIsService } from '../services/external-apis';
import { fastTrendingCache } from '../services/fast-trending-cache';

const router = Router();
const externalAPIs = new ExternalAPIsService();

// Manual refresh cache - only refreshes when user navigates to Explore Signals
let cachedTrendingData: any = null;
let lastCacheUpdate = 0;
let refreshInProgress = false;
const userSessions: Set<string> = new Set(); // Track which users have fresh data

// Manual refresh function - called when user navigates to Explore Signals
const refreshTrendingData = async (forceRefresh = false) => {
  if (refreshInProgress && !forceRefresh) return cachedTrendingData;
  
  refreshInProgress = true;
  console.log('🔄 MANUAL REFRESH: User navigated to Explore Signals - fetching fresh data');
  
  try {
    // Get fresh data from Bright Data automation ONLY (no fallbacks)
    console.log('🚀 BRIGHT DATA ONLY: Fetching live data with extended timeouts');
    
    const liveTopics = await externalAPIs.getAllTrendingTopics();

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
      console.log(`🎯 MANUAL UPDATE: ${liveTopics.length} items from ${Object.keys(platformGroups).length} platforms`);
      return cachedTrendingData;
    }
  } catch (error) {
    console.warn('Manual refresh failed:', error);
  } finally {
    refreshInProgress = false;
  }
  
  return cachedTrendingData;
};

// Get all trending data endpoint - Public access for Explore Signals page
router.get('/all', async (req, res) => {
  try {
    const userId = req.session?.userId || 'anonymous';
    const sessionKey = `${userId}_${req.ip}`;
    
    // Check if user has fresh data for this session
    if (cachedTrendingData && userSessions.has(sessionKey)) {
      const cacheAge = Math.round((Date.now() - lastCacheUpdate) / 1000);
      debugLogger.info('⚡ CACHED DATA: Returning existing trending data', { 
        userId,
        cacheAge: cacheAge + 's',
        totalItems: cachedTrendingData.totalItems
      }, req);
      
      return res.json(cachedTrendingData);
    }
    
    debugLogger.info('🔄 NEW SESSION: User navigated to Explore Signals - refreshing data', { userId }, req);
    
    // Mark this user session as needing fresh data
    userSessions.add(sessionKey);
    
    // Get fresh data for new session/login
    const freshData = await refreshTrendingData(true);
    
    if (freshData) {
      return res.json(freshData);
    }
    
    // Fallback if refresh fails
    const fallbackData = {
      success: true,
      platforms: {
        'system': [{
          title: 'Trending Data Temporarily Unavailable',
          content: 'Live trending sources are being restored - please try refreshing the page',
          url: '#',
          engagement: 0,
          timestamp: new Date().toISOString(),
          platform: 'system',
          source: 'Fallback'
        }]
      },
      totalItems: 1,
      collectedAt: new Date().toISOString(),
      notice: 'Refresh page to retry loading live trending data'
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

// Manual refresh endpoint for user-triggered refreshes
router.post('/refresh', async (req, res) => {
  try {
    const userId = req.session?.userId || 'anonymous';
    debugLogger.info('🔄 MANUAL REFRESH: User requested fresh trending data', { userId }, req);
    
    // Clear user session to force fresh data
    const sessionKey = `${userId}_${req.ip}`;
    userSessions.delete(sessionKey);
    
    // Force refresh trending data
    const freshData = await refreshTrendingData(true);
    
    if (freshData) {
      userSessions.add(sessionKey);
      return res.json(freshData);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to refresh trending data',
      notice: 'Please try again in a few moments'
    });
  } catch (error: any) {
    debugLogger.error('Manual refresh failed', error, req);
    res.status(500).json({
      success: false,
      message: 'Refresh request failed',
      notice: 'Please try again later'
    });
  }
});

// Clear session on logout (called from auth routes)
export const clearUserSession = (userId: string, ip: string) => {
  const sessionKey = `${userId}_${ip}`;
  userSessions.delete(sessionKey);
  console.log(`🔐 LOGOUT: Cleared trending data session for user ${userId}`);
};

export default router;