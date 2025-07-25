import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth';
import { debugLogger } from '../services/debug-logger';

const router = Router();

// Get all trending data endpoint
router.get('/all', requireAuth, async (req, res) => {
  try {
    debugLogger.info('Fetching trending data', { userId: req.session.userId }, req);
    
    // Mock trending data with structure that matches frontend expectations
    const mockData = {
      success: true,
      platforms: {
        reddit: {
          data: [
            {
              title: 'AI Revolution in Content Creation',
              content: 'Discussion about AI tools transforming how content is created and how brands can leverage these emerging technologies for competitive advantage',
              url: 'https://reddit.com/r/technology/post1',
              engagement: 1200,
              timestamp: new Date().toISOString()
            },
            {
              title: 'Cultural Shift in Remote Work',
              content: 'Analysis of changing work culture and what it means for brand communication strategies in the post-pandemic era',
              url: 'https://reddit.com/r/remotework/post2',
              engagement: 950,
              timestamp: new Date().toISOString()
            }
          ]
        },
        google: {
          data: [
            {
              title: 'Strategic Content Planning',
              content: 'Rising search trend for strategic content planning tools and methodologies as brands seek data-driven approaches',
              url: 'https://trends.google.com/trends/explore?q=strategic+content',
              engagement: 850,
              timestamp: new Date().toISOString()
            },
            {
              title: 'Visual Storytelling Trends',
              content: 'Emerging trends in visual storytelling and how brands are adapting their creative strategies for maximum impact',
              url: 'https://trends.google.com/trends/explore?q=visual+storytelling',
              engagement: 720,
              timestamp: new Date().toISOString()
            }
          ]
        }
      },
      totalItems: 4,
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