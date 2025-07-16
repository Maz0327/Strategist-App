import { storage } from "../storage";
import type { InsertSource, Source } from "@shared/schema";

export class SourceManagerService {
  async extractSourceMetadata(url: string): Promise<Partial<InsertSource>> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // Extract basic metadata
      const metadata: Partial<InsertSource> = {
        url,
        domain,
        sourceType: this.categorizeSourceType(domain),
        reliability: this.assessReliability(domain),
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      };

      return metadata;
    } catch (error) {
      console.error('Error extracting source metadata:', error);
      return {
        url,
        domain: 'unknown',
        sourceType: 'article',
        reliability: 'unknown'
      };
    }
  }

  private categorizeSourceType(domain: string): string {
    // Major news outlets
    if (['cnn.com', 'bbc.com', 'reuters.com', 'nytimes.com', 'wsj.com', 'bloomberg.com'].includes(domain)) {
      return 'news';
    }
    
    // Social media platforms
    if (['twitter.com', 'linkedin.com', 'facebook.com', 'instagram.com', 'tiktok.com'].includes(domain)) {
      return 'social';
    }
    
    // Academic/research
    if (['scholar.google.com', 'arxiv.org', 'jstor.org', 'pubmed.ncbi.nlm.nih.gov'].includes(domain) || domain.includes('.edu')) {
      return 'research';
    }
    
    // Tech/industry blogs
    if (['techcrunch.com', 'wired.com', 'arstechnica.com', 'theverge.com', 'medium.com'].includes(domain)) {
      return 'tech_blog';
    }
    
    // Business/marketing
    if (['harvard.edu', 'mckinsey.com', 'bain.com', 'bcg.com', 'deloitte.com'].includes(domain)) {
      return 'business_research';
    }
    
    return 'article';
  }

  private assessReliability(domain: string): string {
    // High reliability sources
    const highReliability = [
      'reuters.com', 'bbc.com', 'nytimes.com', 'wsj.com', 'bloomberg.com',
      'harvard.edu', 'stanford.edu', 'mit.edu', 'mckinsey.com', 'bain.com',
      'scholar.google.com', 'arxiv.org', 'nature.com', 'science.org'
    ];
    
    // Medium reliability sources  
    const mediumReliability = [
      'cnn.com', 'techcrunch.com', 'wired.com', 'theverge.com', 'arstechnica.com',
      'forbes.com', 'businessinsider.com', 'mashable.com'
    ];
    
    if (highReliability.includes(domain) || domain.includes('.edu') || domain.includes('.gov')) {
      return 'high';
    }
    
    if (mediumReliability.includes(domain)) {
      return 'medium';
    }
    
    // Social media and unknown sources default to low
    if (['twitter.com', 'facebook.com', 'instagram.com', 'tiktok.com'].includes(domain)) {
      return 'low';
    }
    
    return 'unknown';
  }

  async findOrCreateSource(url: string, title: string, userId: number, description?: string): Promise<Source> {
    // Check if source already exists for this user
    const existingSource = await storage.getSourceByUrl(url, userId);
    
    if (existingSource) {
      // Update access count and last accessed time
      await storage.updateSource(existingSource.id, {
        accessCount: (existingSource.accessCount || 0) + 1,
        lastAccessed: new Date()
      });
      return existingSource;
    }
    
    // Create new source
    const metadata = await this.extractSourceMetadata(url);
    const sourceData: InsertSource = {
      userId,
      url,
      title: title || metadata.domain || 'Untitled Source',
      domain: metadata.domain!,
      favicon: metadata.favicon,
      description: description || '',
      sourceType: metadata.sourceType!,
      reliability: metadata.reliability!,
      accessCount: 1,
      isActive: true,
      firstCaptured: new Date(),
      lastAccessed: new Date()
    };
    
    return await storage.createSource(sourceData);
  }

  async linkSignalToSource(signalId: number, sourceId: number): Promise<void> {
    try {
      await storage.linkSignalToSource(signalId, sourceId);
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message?.includes('duplicate')) {
        throw error;
      }
    }
  }

  async getSourceAnalytics(userId: number): Promise<{
    totalSources: number;
    sourcesByType: Record<string, number>;
    sourcesByReliability: Record<string, number>;
    topDomains: Array<{ domain: string; count: number }>;
    recentSources: Source[];
  }> {
    const sources = await storage.getSourcesByUserId(userId);
    
    const sourcesByType = sources.reduce((acc, source) => {
      acc[source.sourceType] = (acc[source.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sourcesByReliability = sources.reduce((acc, source) => {
      acc[source.reliability] = (acc[source.reliability] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const domainCounts = sources.reduce((acc, source) => {
      acc[source.domain] = (acc[source.domain] || 0) + (source.accessCount || 1);
      return acc;
    }, {} as Record<string, number>);
    
    const topDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));
    
    return {
      totalSources: sources.length,
      sourcesByType,
      sourcesByReliability,
      topDomains,
      recentSources: sources.slice(0, 10)
    };
  }
}

export const sourceManagerService = new SourceManagerService();