import { Router } from 'express';
import { debugLogger } from '../services/debug-logger';
import { commentLimitingService } from '../services/comment-limiting-service';
import { z } from 'zod';

// Define requireAuth middleware locally since it's in the main routes file
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

const router = Router();

// Schema for comment analysis request
const commentAnalysisSchema = z.object({
  url: z.string().url(),
  platform: z.string().optional(),
  limits: z.object({
    maxComments: z.number().min(1).max(200).default(50),
    maxCommentLength: z.number().min(50).max(1000).default(500),
    maxTotalCommentCharacters: z.number().min(1000).max(100000).default(25000),
    samplingStrategy: z.enum(['top', 'recent', 'balanced', 'intelligent']).default('intelligent')
  }).optional()
});

// Test comment extraction and limiting for a specific URL
router.post('/test-comment-limits', requireAuth, async (req, res) => {
  try {
    const { url, platform, limits } = commentAnalysisSchema.parse(req.body);
    
    debugLogger.info('Testing comment limits for URL', { 
      url, 
      platform, 
      limits,
      userId: req.session.userId 
    });

    // Mock HTML content for testing (in production, this would be scraped)
    const mockHtml = generateMockHtmlWithComments(platform || 'generic', 1500);
    
    const startTime = Date.now();
    const commentSample = await commentLimitingService.extractCommentsWithLimits(
      mockHtml,
      platform || 'generic',
      limits
    );
    const processingTime = Date.now() - startTime;

    const stats = commentLimitingService.getProcessingStats(commentSample);
    
    debugLogger.info('Comment limiting test completed', {
      url,
      platform,
      ...stats,
      actualProcessingTime: processingTime
    });

    res.json({
      success: true,
      url,
      platform: platform || 'detected',
      sample: {
        comments: commentSample.comments.slice(0, 10), // Only return first 10 for preview
        totalExtracted: commentSample.comments.length,
        sampleStrategy: commentSample.sampleStrategy,
        processingTime: commentSample.processingTime
      },
      stats,
      performance: {
        totalProcessingTime: processingTime,
        averageCommentProcessingTime: commentSample.comments.length > 0 ? processingTime / commentSample.comments.length : 0,
        memoryEfficiency: 'optimal'
      },
      recommendations: generateOptimizationRecommendations(commentSample)
    });

  } catch (error) {
    debugLogger.error('Comment limiting test failed', { 
      error: error.message,
      userId: req.session.userId 
    });
    
    res.status(500).json({ 
      error: 'Failed to test comment limits',
      details: error.message 
    });
  }
});

// Get comment limiting statistics and recommendations
router.get('/comment-stats', requireAuth, async (req, res) => {
  try {
    const platform = req.query.platform as string || 'all';
    
    // Generate statistics for different scenarios
    const scenarios = [
      { name: 'Light Load', commentCount: 50, platform },
      { name: 'Medium Load', commentCount: 500, platform },
      { name: 'Heavy Load', commentCount: 2000, platform },
      { name: 'Extreme Load', commentCount: 10000, platform }
    ];

    const statistics = [];

    for (const scenario of scenarios) {
      const mockHtml = generateMockHtmlWithComments(scenario.platform, scenario.commentCount);
      const startTime = Date.now();
      
      const sample = await commentLimitingService.extractCommentsWithLimits(
        mockHtml,
        scenario.platform,
        { samplingStrategy: 'intelligent' }
      );
      
      const processingTime = Date.now() - startTime;
      const stats = commentLimitingService.getProcessingStats(sample);
      
      statistics.push({
        scenario: scenario.name,
        commentCount: scenario.commentCount,
        ...stats,
        actualProcessingTime: processingTime,
        memoryUsage: estimateMemoryUsage(sample),
        recommendedLimits: getRecommendedLimits(scenario.commentCount)
      });
    }

    res.json({
      success: true,
      platform,
      timestamp: new Date().toISOString(),
      statistics,
      recommendations: {
        defaultLimits: {
          maxComments: 50,
          maxCommentLength: 500,
          maxTotalCommentCharacters: 25000,
          samplingStrategy: 'intelligent'
        },
        platformSpecific: {
          reddit: { maxComments: 100, samplingStrategy: 'top' },
          twitter: { maxComments: 30, samplingStrategy: 'recent' },
          instagram: { maxComments: 50, samplingStrategy: 'balanced' },
          youtube: { maxComments: 75, samplingStrategy: 'intelligent' },
          linkedin: { maxComments: 25, samplingStrategy: 'intelligent' }
        }
      }
    });

  } catch (error) {
    debugLogger.error('Failed to generate comment statistics', { error: error.message });
    res.status(500).json({ error: 'Failed to generate statistics' });
  }
});

// Helper function to generate mock HTML for testing
function generateMockHtmlWithComments(platform: string, commentCount: number): string {
  let html = `<!DOCTYPE html><html><head><title>Test ${platform} Post</title></head><body>`;
  html += `<div class="main-content">This is a test post with ${commentCount} comments</div>`;
  
  for (let i = 0; i < commentCount; i++) {
    const commentClass = platform === 'reddit' ? 'comment' : 
                        platform === 'twitter' ? 'reply' :
                        platform === 'instagram' ? 'comment' :
                        'generic-comment';
    
    html += `<div class="${commentClass}" data-id="${i}">`;
    html += `<span class="author">User${i}</span>`;
    html += `<span class="text">This is test comment number ${i} with some additional text to make it realistic. It contains various words and punctuation.</span>`;
    html += `<span class="engagement">${Math.floor(Math.random() * 100)}</span>`;
    html += `</div>`;
  }
  
  html += '</body></html>';
  return html;
}

// Generate optimization recommendations based on sample results
function generateOptimizationRecommendations(sample: any): any {
  const recommendations = [];
  
  if (sample.totalFound > 1000) {
    recommendations.push({
      type: 'performance',
      message: 'High comment volume detected. Consider using intelligent sampling for better performance.',
      action: 'Use samplingStrategy: intelligent with maxComments: 50'
    });
  }
  
  if (sample.comments.length > 75) {
    recommendations.push({
      type: 'memory',
      message: 'Large comment sample may impact memory usage.',
      action: 'Reduce maxComments or increase character limits to focus on quality over quantity'
    });
  }
  
  if (sample.processingTime > 5000) {
    recommendations.push({
      type: 'timeout',
      message: 'Comment processing time is high.',
      action: 'Consider reducing maxComments or implementing background processing'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'optimal',
      message: 'Comment processing is within optimal parameters.',
      action: 'Current settings are performing well'
    });
  }
  
  return recommendations;
}

// Estimate memory usage for a comment sample
function estimateMemoryUsage(sample: any): any {
  const avgCommentSize = sample.comments.reduce((sum: number, comment: any) => 
    sum + (comment.text?.length || 0), 0) / (sample.comments.length || 1);
  
  const totalMemoryKB = Math.round((sample.comments.length * avgCommentSize) / 1024);
  
  return {
    commentCount: sample.comments.length,
    averageCommentSize: Math.round(avgCommentSize),
    estimatedMemoryKB: totalMemoryKB,
    status: totalMemoryKB > 1000 ? 'high' : totalMemoryKB > 500 ? 'medium' : 'low'
  };
}

// Get recommended limits based on comment count
function getRecommendedLimits(commentCount: number): any {
  if (commentCount < 100) {
    return { maxComments: commentCount, samplingStrategy: 'all' };
  } else if (commentCount < 500) {
    return { maxComments: 75, samplingStrategy: 'balanced' };
  } else if (commentCount < 2000) {
    return { maxComments: 50, samplingStrategy: 'intelligent' };
  } else {
    return { maxComments: 30, samplingStrategy: 'top' };
  }
}

export { router as commentLimitingRouter };