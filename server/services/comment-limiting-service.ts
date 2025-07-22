import { debugLogger } from './debug-logger';

interface CommentLimits {
  maxComments: number;
  maxCommentLength: number;
  maxTotalCommentCharacters: number;
  samplingStrategy: 'top' | 'recent' | 'balanced' | 'intelligent';
}

interface CommentSample {
  comments: any[];
  sampleStrategy: string;
  totalFound: number;
  processingTime: number;
  metadata: {
    topComments: number;
    recentComments: number;
    randomSample: number;
    truncatedComments: number;
  };
}

export class CommentLimitingService {
  private defaultLimits: CommentLimits = {
    maxComments: 50, // Maximum comments to extract
    maxCommentLength: 500, // Max characters per comment
    maxTotalCommentCharacters: 25000, // Total character limit across all comments
    samplingStrategy: 'intelligent'
  };

  // Enhanced comment extraction with intelligent limits
  async extractCommentsWithLimits(
    html: string, 
    platform: string, 
    customLimits?: Partial<CommentLimits>
  ): Promise<CommentSample> {
    const startTime = Date.now();
    const limits = { ...this.defaultLimits, ...customLimits };
    
    debugLogger.info(`Starting comment extraction with limits`, { 
      platform, 
      limits,
      htmlLength: html.length 
    });

    try {
      // Platform-specific comment extraction
      const allComments = await this.extractCommentsByPlatform(html, platform);
      
      if (allComments.length === 0) {
        return {
          comments: [],
          sampleStrategy: 'none',
          totalFound: 0,
          processingTime: Date.now() - startTime,
          metadata: { topComments: 0, recentComments: 0, randomSample: 0, truncatedComments: 0 }
        };
      }

      // Apply intelligent sampling if we have too many comments
      const sample = await this.applySamplingStrategy(allComments, limits);
      
      debugLogger.info(`Comment extraction completed`, {
        totalFound: allComments.length,
        sampled: sample.comments.length,
        strategy: sample.sampleStrategy,
        processingTime: Date.now() - startTime
      });

      return {
        ...sample,
        totalFound: allComments.length,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      debugLogger.error(`Comment extraction failed for ${platform}:`, error);
      return {
        comments: [],
        sampleStrategy: 'error',
        totalFound: 0,
        processingTime: Date.now() - startTime,
        metadata: { topComments: 0, recentComments: 0, randomSample: 0, truncatedComments: 0 }
      };
    }
  }

  // Platform-specific comment extraction
  private async extractCommentsByPlatform(html: string, platform: string): Promise<any[]> {
    switch (platform.toLowerCase()) {
      case 'reddit':
        return this.extractRedditComments(html);
      case 'twitter':
      case 'x':
        return this.extractTwitterReplies(html);
      case 'instagram':
        return this.extractInstagramComments(html);
      case 'linkedin':
        return this.extractLinkedInComments(html);
      case 'youtube':
        return this.extractYouTubeComments(html);
      case 'tiktok':
        return this.extractTikTokComments(html);
      default:
        return this.extractGenericComments(html);
    }
  }

  // Intelligent sampling strategy
  private async applySamplingStrategy(
    allComments: any[], 
    limits: CommentLimits
  ): Promise<CommentSample> {
    if (allComments.length <= limits.maxComments) {
      // No sampling needed
      const truncated = this.truncateComments(allComments, limits.maxCommentLength);
      return {
        comments: truncated.comments,
        sampleStrategy: 'all',
        totalFound: allComments.length,
        processingTime: 0,
        metadata: {
          topComments: allComments.length,
          recentComments: 0,
          randomSample: 0,
          truncatedComments: truncated.truncatedCount
        }
      };
    }

    let sample: any[] = [];
    let metadata = { topComments: 0, recentComments: 0, randomSample: 0, truncatedComments: 0 };

    switch (limits.samplingStrategy) {
      case 'top':
        sample = this.sampleTopComments(allComments, limits.maxComments);
        metadata.topComments = sample.length;
        break;
        
      case 'recent':
        sample = this.sampleRecentComments(allComments, limits.maxComments);
        metadata.recentComments = sample.length;
        break;
        
      case 'balanced':
        const balanced = this.sampleBalanced(allComments, limits.maxComments);
        sample = balanced.comments;
        metadata = balanced.metadata;
        break;
        
      case 'intelligent':
      default:
        const intelligent = this.sampleIntelligent(allComments, limits.maxComments);
        sample = intelligent.comments;
        metadata = intelligent.metadata;
        break;
    }

    // Apply character limits and truncation
    const truncated = this.truncateComments(sample, limits.maxCommentLength);
    const finalSample = this.applyTotalCharacterLimit(truncated.comments, limits.maxTotalCommentCharacters);
    
    metadata.truncatedComments += truncated.truncatedCount;

    return {
      comments: finalSample,
      sampleStrategy: limits.samplingStrategy,
      totalFound: allComments.length,
      processingTime: 0,
      metadata
    };
  }

  // Intelligent sampling - combines top engagement with recent activity
  private sampleIntelligent(comments: any[], maxComments: number): { comments: any[], metadata: any } {
    const sortedByEngagement = [...comments].sort((a, b) => (b.engagement || 0) - (a.engagement || 0));
    const sortedByTime = [...comments].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    
    // Take 70% top engagement, 20% recent, 10% random
    const topCount = Math.floor(maxComments * 0.7);
    const recentCount = Math.floor(maxComments * 0.2);
    const randomCount = maxComments - topCount - recentCount;
    
    const topComments = sortedByEngagement.slice(0, topCount);
    const recentComments = sortedByTime.slice(0, recentCount);
    
    // Random sample from remaining comments
    const remaining = comments.filter(c => 
      !topComments.includes(c) && !recentComments.includes(c)
    );
    const randomComments = this.randomSample(remaining, randomCount);
    
    return {
      comments: [...topComments, ...recentComments, ...randomComments],
      metadata: {
        topComments: topCount,
        recentComments: recentCount,
        randomSample: randomCount,
        truncatedComments: 0
      }
    };
  }

  // Balanced sampling - equal parts top, recent, and random
  private sampleBalanced(comments: any[], maxComments: number): { comments: any[], metadata: any } {
    const perCategory = Math.floor(maxComments / 3);
    
    const topComments = this.sampleTopComments(comments, perCategory);
    const recentComments = this.sampleRecentComments(comments, perCategory);
    const randomComments = this.randomSample(
      comments.filter(c => !topComments.includes(c) && !recentComments.includes(c)), 
      maxComments - topComments.length - recentComments.length
    );
    
    return {
      comments: [...topComments, ...recentComments, ...randomComments],
      metadata: {
        topComments: topComments.length,
        recentComments: recentComments.length,
        randomSample: randomComments.length,
        truncatedComments: 0
      }
    };
  }

  // Sample top comments by engagement
  private sampleTopComments(comments: any[], count: number): any[] {
    return [...comments]
      .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
      .slice(0, count);
  }

  // Sample recent comments by timestamp
  private sampleRecentComments(comments: any[], count: number): any[] {
    return [...comments]
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      .slice(0, count);
  }

  // Random sampling
  private randomSample(comments: any[], count: number): any[] {
    const shuffled = [...comments].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Truncate individual comments
  private truncateComments(comments: any[], maxLength: number): { comments: any[], truncatedCount: number } {
    let truncatedCount = 0;
    
    const truncated = comments.map(comment => {
      if (comment.text && comment.text.length > maxLength) {
        truncatedCount++;
        return {
          ...comment,
          text: comment.text.substring(0, maxLength) + '...',
          originalLength: comment.text.length,
          truncated: true
        };
      }
      return comment;
    });
    
    return { comments: truncated, truncatedCount };
  }

  // Apply total character limit across all comments
  private applyTotalCharacterLimit(comments: any[], maxTotalChars: number): any[] {
    let totalChars = 0;
    const limitedComments: any[] = [];
    
    for (const comment of comments) {
      const commentLength = comment.text?.length || 0;
      
      if (totalChars + commentLength <= maxTotalChars) {
        limitedComments.push(comment);
        totalChars += commentLength;
      } else {
        // Include partial comment if it fits
        const remainingChars = maxTotalChars - totalChars;
        if (remainingChars > 50) { // Only include if we have at least 50 chars left
          limitedComments.push({
            ...comment,
            text: comment.text?.substring(0, remainingChars - 3) + '...',
            truncated: true,
            reason: 'total-limit'
          });
        }
        break;
      }
    }
    
    return limitedComments;
  }

  // Platform-specific comment extraction methods
  private extractRedditComments(html: string): any[] {
    // Mock Reddit comment extraction - would use real selectors
    const comments: any[] = [];
    const commentPattern = /class=".*comment.*"/g;
    const matches = html.match(commentPattern) || [];
    
    for (let i = 0; i < Math.min(matches.length, 1000); i++) {
      comments.push({
        id: `reddit-${i}`,
        text: `Reddit comment ${i}`,
        author: `user${i}`,
        engagement: Math.floor(Math.random() * 100),
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        platform: 'reddit'
      });
    }
    
    return comments;
  }

  private extractTwitterReplies(html: string): any[] {
    // Mock Twitter reply extraction
    const replies: any[] = [];
    const replyPattern = /data-testid="reply"/g;
    const matches = html.match(replyPattern) || [];
    
    for (let i = 0; i < Math.min(matches.length, 500); i++) {
      replies.push({
        id: `twitter-${i}`,
        text: `Twitter reply ${i}`,
        author: `@user${i}`,
        engagement: Math.floor(Math.random() * 50),
        timestamp: new Date(Date.now() - Math.random() * 43200000).toISOString(),
        platform: 'twitter'
      });
    }
    
    return replies;
  }

  private extractInstagramComments(html: string): any[] {
    // Mock Instagram comment extraction
    const comments: any[] = [];
    if (html.includes('instagram.com')) {
      for (let i = 0; i < Math.min(200, Math.random() * 500); i++) {
        comments.push({
          id: `ig-${i}`,
          text: `Instagram comment ${i}`,
          author: `user${i}`,
          engagement: Math.floor(Math.random() * 20),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          platform: 'instagram'
        });
      }
    }
    
    return comments;
  }

  private extractLinkedInComments(html: string): any[] {
    // Mock LinkedIn comment extraction
    const comments: any[] = [];
    if (html.includes('linkedin.com')) {
      for (let i = 0; i < Math.min(100, Math.random() * 200); i++) {
        comments.push({
          id: `linkedin-${i}`,
          text: `LinkedIn comment ${i}`,
          author: `Professional User ${i}`,
          engagement: Math.floor(Math.random() * 30),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          platform: 'linkedin'
        });
      }
    }
    
    return comments;
  }

  private extractYouTubeComments(html: string): any[] {
    // Mock YouTube comment extraction
    const comments: any[] = [];
    if (html.includes('youtube.com')) {
      for (let i = 0; i < Math.min(300, Math.random() * 1000); i++) {
        comments.push({
          id: `youtube-${i}`,
          text: `YouTube comment ${i}`,
          author: `Viewer${i}`,
          engagement: Math.floor(Math.random() * 75),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          platform: 'youtube'
        });
      }
    }
    
    return comments;
  }

  private extractTikTokComments(html: string): any[] {
    // Mock TikTok comment extraction
    const comments: any[] = [];
    if (html.includes('tiktok.com')) {
      for (let i = 0; i < Math.min(150, Math.random() * 400); i++) {
        comments.push({
          id: `tiktok-${i}`,
          text: `TikTok comment ${i}`,
          author: `@user${i}`,
          engagement: Math.floor(Math.random() * 40),
          timestamp: new Date(Date.now() - Math.random() * 43200000).toISOString(),
          platform: 'tiktok'
        });
      }
    }
    
    return comments;
  }

  private extractGenericComments(html: string): any[] {
    // Generic comment extraction for other platforms
    const comments: any[] = [];
    const commentKeywords = ['comment', 'reply', 'response'];
    
    for (const keyword of commentKeywords) {
      const pattern = new RegExp(`class=".*${keyword}.*"`, 'gi');
      const matches = html.match(pattern) || [];
      
      for (let i = 0; i < Math.min(matches.length, 100); i++) {
        comments.push({
          id: `generic-${keyword}-${i}`,
          text: `Generic ${keyword} ${i}`,
          author: `User${i}`,
          engagement: Math.floor(Math.random() * 25),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          platform: 'generic'
        });
      }
    }
    
    return comments;
  }

  // Get processing statistics
  getProcessingStats(sample: CommentSample): any {
    const efficiency = sample.totalFound > 0 ? (sample.comments.length / sample.totalFound) : 0;
    
    return {
      totalCommentsFound: sample.totalFound,
      commentsProcessed: sample.comments.length,
      samplingEfficiency: Math.round(efficiency * 100) + '%',
      processingTime: sample.processingTime + 'ms',
      strategy: sample.sampleStrategy,
      breakdown: sample.metadata
    };
  }
}

export const commentLimitingService = new CommentLimitingService();