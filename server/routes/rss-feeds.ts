import { Router } from 'express';
import { rssService } from '../services/rss-service.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get articles from a specific RSS feed
router.get('/:feedId/articles', requireAuth, async (req, res) => {
  try {
    const feedId = parseInt(req.params.feedId);
    const userId = req.session.userId!;
    
    // Get the feed details
    const feed = await req.storage.getRssFeedById(feedId, userId);
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    
    // Fetch and parse the RSS feed
    const articles = await rssService.fetchFeedArticles(feed.rssUrl);
    
    res.json({ articles });
  } catch (error) {
    console.error('Error fetching feed articles:', error);
    res.status(500).json({ 
      message: 'Failed to fetch feed articles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as rssFeedsRouter };