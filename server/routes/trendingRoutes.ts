import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';

const router = Router();

// Get all trending data endpoint
router.get('/all', requireAuth, async (req, res) => {
  try {
    debugLogger.info('Fetching trending data', { userId: req.session.userId }, req);
    
    // Mock trending data for now - you can integrate real APIs later
    const mockData = {
      success: true,
      platforms: {
        reddit: {
          trends: [
            {
              id: '1',
              platform: 'reddit',
              title: 'AI Revolution in Content Creation',
              summary: 'Discussion about AI tools transforming how content is created',
              url: 'https://reddit.com/r/technology/post1',
              score: 95,
              fetchedAt: new Date().toISOString(),
              engagement: 1200
            }
          ]
        },
        google: {
          trends: [
            {
              id: '2', 
              platform: 'google',
              title: 'Strategic Content Planning',
              summary: 'Rising search trend for strategic content planning tools',
              url: 'https://trends.google.com/trends/explore?q=strategic+content',
              score: 88,
              fetchedAt: new Date().toISOString(),
              engagement: 850
            }
          ]
        }
      },
      totalItems: 2,
      collectedAt: new Date().toISOString()
    };

    debugLogger.info('Trending data returned successfully', { 
      userId: req.session.userId,
      totalItems: mockData.totalItems 
    }, req);

    res.json(mockData);
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