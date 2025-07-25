import { exec } from 'child_process';
import { promisify } from 'util';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

const execAsync = promisify(exec);

export class GoogleTrendsPythonService {
  private pythonScript = 'server/python/google_trends_service.py';

  async executePythonScript(command: string, args: string[] = []): Promise<TrendingTopic[]> {
    try {
      const argString = args.join(' ');
      const fullCommand = `python3 ${this.pythonScript} ${command} ${argString}`;
      
      debugLogger.info(`Executing Python command: ${fullCommand}`);
      
      const { stdout, stderr } = await execAsync(fullCommand, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      if (stderr) {
        debugLogger.warn(`Python stderr: ${stderr}`);
      }

      if (!stdout.trim()) {
        debugLogger.warn('Python script returned empty output');
        return [];
      }

      const result = JSON.parse(stdout);
      debugLogger.info(`Python script returned ${result.length} trends`);
      return result;

    } catch (error) {
      debugLogger.error(`Python script execution failed: ${error.message}`);
      return [];
    }
  }

  async getTrendingSearches(country: string = 'US', limit: number = 50): Promise<TrendingTopic[]> {
    return this.executePythonScript('trending', [country, limit.toString()]);
  }

  async getInterestOverTime(keywords: string[], timeframe: string = 'today 3-m', geo: string = 'US'): Promise<TrendingTopic[]> {
    return this.executePythonScript('interest', [keywords.join(','), timeframe, geo]);
  }

  async getRelatedQueries(keyword: string, geo: string = 'US'): Promise<TrendingTopic[]> {
    return this.executePythonScript('related', [keyword, geo]);
  }

  async getBusinessTrends(): Promise<TrendingTopic[]> {
    return this.executePythonScript('business');
  }

  async getAllGoogleTrends(): Promise<TrendingTopic[]> {
    try {
      debugLogger.info('Fetching comprehensive Google Trends data via Python');
      
      // Get business trends (includes trending searches, interest over time, and related queries)
      const businessTrends = await this.getBusinessTrends();
      
      debugLogger.info(`Successfully fetched ${businessTrends.length} Google Trends topics`);
      return businessTrends;
      
    } catch (error) {
      debugLogger.error('Failed to fetch Google Trends data via Python:', error);
      return this.getFallbackTrends();
    }
  }

  private getFallbackTrends(): TrendingTopic[] {
    return [
      {
        id: 'google-fallback-1',
        platform: 'google',
        title: 'AI Marketing Tools',
        summary: 'Search interest: 85/100 - Artificial intelligence in marketing',
        url: 'https://trends.google.com/trends/explore?q=ai+marketing+tools',
        score: 85,
        fetchedAt: new Date().toISOString(),
        engagement: 85000,
        source: 'Google Trends (Fallback)',
        keywords: ['ai', 'marketing', 'tools', 'artificial intelligence']
      },
      {
        id: 'google-fallback-2',
        platform: 'google',
        title: 'Digital Transformation',
        summary: 'Search interest: 78/100 - Business digital transformation',
        url: 'https://trends.google.com/trends/explore?q=digital+transformation',
        score: 78,
        fetchedAt: new Date().toISOString(),
        engagement: 78000,
        source: 'Google Trends (Fallback)',
        keywords: ['digital', 'transformation', 'business', 'technology']
      },
      {
        id: 'google-fallback-3',
        platform: 'google',
        title: 'Customer Experience',
        summary: 'Search interest: 72/100 - Customer experience optimization',
        url: 'https://trends.google.com/trends/explore?q=customer+experience',
        score: 72,
        fetchedAt: new Date().toISOString(),
        engagement: 72000,
        source: 'Google Trends (Fallback)',
        keywords: ['customer', 'experience', 'optimization', 'satisfaction']
      },
      {
        id: 'google-fallback-4',
        platform: 'google',
        title: 'Remote Work',
        summary: 'Search interest: 69/100 - Remote work trends and tools',
        url: 'https://trends.google.com/trends/explore?q=remote+work',
        score: 69,
        fetchedAt: new Date().toISOString(),
        engagement: 69000,
        source: 'Google Trends (Fallback)',
        keywords: ['remote', 'work', 'hybrid', 'collaboration']
      },
      {
        id: 'google-fallback-5',
        platform: 'google',
        title: 'Sustainability',
        summary: 'Search interest: 74/100 - Sustainability and ESG trends',
        url: 'https://trends.google.com/trends/explore?q=sustainability',
        score: 74,
        fetchedAt: new Date().toISOString(),
        engagement: 74000,
        source: 'Google Trends (Fallback)',
        keywords: ['sustainability', 'esg', 'green', 'environment']
      }
    ];
  }
}

export const googleTrendsPythonService = new GoogleTrendsPythonService();