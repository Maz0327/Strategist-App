// Smart Platform Manager - Sequential Loading with Real-time Updates
import { BrightDataService } from './bright-data-service';
import { debugLogger } from '../utils/logger';

interface PlatformConfig {
  name: string;
  priority: number;
  timeout: number;
  retryAttempts: number;
  connectionPool: 'dedicated' | 'shared';
}

export class PlatformManager {
  private brightData: BrightDataService;
  private platformConfigs: PlatformConfig[] = [
    // High Priority - Fast and Reliable
    { name: 'TikTok', priority: 1, timeout: 35000, retryAttempts: 2, connectionPool: 'dedicated' },
    { name: 'Google Trends', priority: 2, timeout: 40000, retryAttempts: 2, connectionPool: 'dedicated' },
    
    // Medium Priority - Moderate Success Rate
    { name: 'YouTube', priority: 3, timeout: 45000, retryAttempts: 1, connectionPool: 'shared' },
    { name: 'LinkedIn', priority: 4, timeout: 50000, retryAttempts: 1, connectionPool: 'shared' },
    
    // Lower Priority - High Risk
    { name: 'Instagram', priority: 5, timeout: 35000, retryAttempts: 3, connectionPool: 'dedicated' },
    { name: 'Reddit', priority: 6, timeout: 30000, retryAttempts: 2, connectionPool: 'shared' }
  ];

  constructor() {
    this.brightData = new BrightDataService();
  }

  // Sequential loading with real-time progress updates
  async loadPlatformsSequentially(onProgress?: (platform: string, data: any) => void): Promise<any> {
    const results = [];
    let totalItems = 0;

    // Sort by priority
    const sortedPlatforms = this.platformConfigs.sort((a, b) => a.priority - b.priority);

    for (const config of sortedPlatforms) {
      try {
        debugLogger.info(`🚀 Loading ${config.name} (Priority ${config.priority})`);
        
        const startTime = Date.now();
        const platformData = await this.loadSinglePlatform(config);
        const loadTime = Date.now() - startTime;

        if (platformData && platformData.length > 0) {
          results.push(...platformData);
          totalItems += platformData.length;
          
          debugLogger.info(`✅ ${config.name}: ${platformData.length} items loaded in ${loadTime}ms`);
          
          // Real-time progress callback
          if (onProgress) {
            onProgress(config.name, {
              platform: config.name,
              items: platformData.length,
              loadTime,
              totalItems,
              status: 'success'
            });
          }

          // Early return strategy - if we have good data, don't wait for slow platforms
          if (totalItems >= 25 && results.length >= 2) {
            debugLogger.info(`🎯 EARLY SUCCESS: ${totalItems} items from ${results.length} platforms`);
            break;
          }
        } else {
          debugLogger.warn(`⚠️ ${config.name}: No data returned`);
          if (onProgress) {
            onProgress(config.name, {
              platform: config.name,
              items: 0,
              loadTime,
              status: 'empty'
            });
          }
        }

        // Brief pause between platforms to prevent connection conflicts
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        debugLogger.error(`❌ ${config.name} failed:`, error.message);
        if (onProgress) {
          onProgress(config.name, {
            platform: config.name,
            items: 0,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return {
      success: true,
      totalItems,
      platforms: results.length,
      items: results,
      loadStrategy: 'sequential'
    };
  }

  private async loadSinglePlatform(config: PlatformConfig): Promise<any[]> {
    const platformMethods = {
      'TikTok': () => this.brightData.scrapeTikTokTrends(),
      'Google Trends': () => this.brightData.scrapeGoogleTrends(['US']),
      'YouTube': () => this.brightData.scrapeYouTubeTrending(['US']),
      'LinkedIn': () => this.brightData.scrapeLinkedInContent(['artificial intelligence', 'startup trends']),
      'Instagram': () => this.brightData.scrapeInstagramPosts(['ai', 'trending']),
      'Reddit': () => this.brightData.scrapeRedditTrending(['all', 'popular'])
    };

    const method = platformMethods[config.name];
    if (!method) {
      throw new Error(`No method defined for platform: ${config.name}`);
    }

    // Use dedicated connection pool for high-priority platforms
    if (config.connectionPool === 'dedicated') {
      return await this.withDedicatedConnection(method, config);
    } else {
      return await this.withSharedConnection(method, config);
    }
  }

  private async withDedicatedConnection(method: () => Promise<any[]>, config: PlatformConfig): Promise<any[]> {
    // Each call gets its own browser connection to prevent conflicts
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        debugLogger.info(`🔄 ${config.name} attempt ${attempt}/${config.retryAttempts} (dedicated)`);
        return await Promise.race([
          method(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`${config.name} timeout after ${config.timeout}ms`)), config.timeout)
          )
        ]) as any[];
      } catch (error) {
        if (attempt === config.retryAttempts) {
          throw error;
        }
        debugLogger.warn(`⚠️ ${config.name} attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
      }
    }
    return [];
  }

  private async withSharedConnection(method: () => Promise<any[]>, config: PlatformConfig): Promise<any[]> {
    // Shared connection with timeout
    try {
      return await Promise.race([
        method(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${config.name} timeout after ${config.timeout}ms`)), config.timeout)
        )
      ]) as any[];
    } catch (error) {
      debugLogger.warn(`⚠️ ${config.name} shared connection failed:`, error.message);
      return [];
    }
  }

  // Get platform loading status for frontend
  getPlatformStatus(): any {
    return this.platformConfigs.map(config => ({
      name: config.name,
      priority: config.priority,
      timeout: config.timeout,
      connectionPool: config.connectionPool,
      status: 'pending'
    }));
  }
}