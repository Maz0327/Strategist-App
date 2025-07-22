import googleTrends from 'google-trends-api';

export interface TrendingTopic {
  id: string;
  platform: string;
  title: string;
  summary?: string;
  url: string;
  score?: number;
  fetchedAt: string;
  engagement?: number;
  source?: string;
  keywords?: string[];
}

export class TrendsService {
  async getGoogleTrends(geo: string = 'US', category: number = 12): Promise<TrendingTopic[]> {
    try {
      // First try Browser API to bypass rate limits and blocks
      try {
        const { browserApiService } = await import('./browser-api-service');
        const browserResult = await browserApiService.scrapeGoogleTrends({
          geo,
          timeframe: 'now 1-d',
          category
        });
        
        if (browserResult.success && browserResult.data?.length > 0) {
          console.log(`✅ Google Trends via Browser API: ${browserResult.data.length} trends`);
          
          // Convert browser API format to TrendingTopic format
          return browserResult.data.map((trend: any, index: number) => ({
            id: `google-browser-${index}`,
            platform: 'google',
            title: trend.keyword || trend.query || 'Trending Topic',
            summary: `Trending in ${browserResult.geo} - ${trend.category || 'General'}`,
            url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(trend.keyword || trend.query)}&geo=${geo}`,
            score: 100 - (index * 5), // Decrease score by ranking
            fetchedAt: trend.extractedAt || new Date().toISOString(),
            engagement: (100 - index * 5) * 1000,
            source: 'Google Trends (Browser API)',
            keywords: [trend.keyword || trend.query]
          }));
        }
      } catch (browserError) {
        console.warn('Browser API failed, falling back to direct API:', browserError.message);
      }

      // Fallback to direct Google Trends API
      const keywords = [
        'AI marketing', 'digital transformation', 'customer experience', 
        'sustainable business', 'remote work', 'data analytics',
        'social media marketing', 'e-commerce trends', 'startup funding'
      ];

      const trends: TrendingTopic[] = [];
      
      // Use interest over time for specific business keywords
      for (let i = 0; i < Math.min(keywords.length, 5); i++) {
        try {
          const keyword = keywords[i];
          const interest = await googleTrends.interestOverTime({
            keyword,
            geo,
            startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            endTime: new Date(),
            granularTimeResolution: true
          });

          // Check if response is HTML (blocked/CAPTCHA)
          if (typeof interest === 'string' && (interest.includes('<HTML>') || interest.includes('<!DOCTYPE'))) {
            console.warn('Google Trends API blocked with CAPTCHA for keyword:', keyword);
            continue;
          }

          const interestData = JSON.parse(interest);
          if (interestData.default?.timelineData?.length > 0) {
            const recentData = interestData.default.timelineData.slice(-3); // Last 3 data points
            const avgValue = recentData.reduce((sum: number, point: any) => sum + (point.value?.[0] || 0), 0) / recentData.length;
            
            if (avgValue > 10) { // Only include if there's meaningful search volume
              const topic: TrendingTopic = {
                id: `google-${i}`,
                platform: 'google',
                title: keyword,
                summary: `Search interest: ${Math.round(avgValue)}/100 over the past week`,
                url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&geo=${geo}`,
                score: Math.min(100, Math.round(avgValue * 1.2)), // Boost score slightly
                fetchedAt: new Date().toISOString(),
                engagement: Math.round(avgValue * 1000),
                source: 'Google Trends',
                keywords: keyword.split(' ')
              };
              trends.push(topic);
            }
          }
        } catch (keywordError) {
          console.warn(`Error fetching trends for keyword "${keywords[i]}":`, keywordError);
          continue;
        }
      }

      // If we got some results, return them
      if (trends.length > 0) {
        return trends.sort((a, b) => (b.score || 0) - (a.score || 0));
      }

      // If no results from real API, return fallback
      console.warn('No Google Trends data available, using fallback');
      return this.getFallbackTrends();
      
    } catch (error) {
      console.error('Error fetching Google Trends:', error);
      return this.getFallbackTrends();
    }
  }

  private getFallbackTrends(): TrendingTopic[] {
    // Note: This fallback is used when Google Trends API is unavailable
    // In production, this would be replaced with a more robust API or data source
    console.warn('Using fallback trends - Google Trends API appears to be blocked or rate limited');
    
    return [
      {
        id: 'google-trend-1',
        platform: 'google',
        title: 'AI marketing automation',
        summary: 'Search interest: 85/100 - Growing queries for AI-powered marketing tools',
        url: 'https://trends.google.com/trends/explore?q=ai+marketing+automation',
        score: 85,
        fetchedAt: new Date().toISOString(),
        engagement: 15000,
        source: 'Google Trends (API Unavailable)',
        keywords: ['AI', 'marketing', 'automation', 'tools']
      },
      {
        id: 'google-trend-2',
        platform: 'google',
        title: 'sustainable business practices',
        summary: 'Search interest: 78/100 - Rising interest in eco-friendly business strategies',
        url: 'https://trends.google.com/trends/explore?q=sustainable+business+practices',
        score: 78,
        fetchedAt: new Date().toISOString(),
        engagement: 12000,
        source: 'Google Trends (API Unavailable)',
        keywords: ['sustainable', 'business', 'eco-friendly', 'green']
      },
      {
        id: 'google-trend-3',
        platform: 'google',
        title: 'digital transformation strategy',
        summary: 'Search interest: 82/100 - Companies seeking digital modernization approaches',
        url: 'https://trends.google.com/trends/explore?q=digital+transformation+strategy',
        score: 82,
        fetchedAt: new Date().toISOString(),
        engagement: 18000,
        source: 'Google Trends (API Unavailable)',
        keywords: ['digital', 'transformation', 'strategy', 'modernization']
      },
      {
        id: 'google-trend-4',
        platform: 'google',
        title: 'remote work productivity',
        summary: 'Search interest: 72/100 - Continued interest in remote work solutions',
        url: 'https://trends.google.com/trends/explore?q=remote+work+productivity',
        score: 72,
        fetchedAt: new Date().toISOString(),
        engagement: 14000,
        source: 'Google Trends (API Unavailable)',
        keywords: ['remote', 'work', 'productivity', 'tools']
      },
      {
        id: 'google-trend-5',
        platform: 'google',
        title: 'customer experience optimization',
        summary: 'Search interest: 79/100 - Businesses focusing on CX improvement',
        url: 'https://trends.google.com/trends/explore?q=customer+experience+optimization',
        score: 79,
        fetchedAt: new Date().toISOString(),
        engagement: 16000,
        source: 'Google Trends (API Unavailable)',
        keywords: ['customer', 'experience', 'optimization', 'satisfaction']
      }
    ];
  }

  async getInterestByRegion(keyword: string, geo: string = 'US'): Promise<any> {
    try {
      const interest = await googleTrends.interestByRegion({
        keyword,
        geo,
        resolution: 'COUNTRY',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endTime: new Date(),
      });

      return JSON.parse(interest);
    } catch (error) {
      console.error('Error fetching interest by region:', error);
      return null;
    }
  }

  async getRelatedTopics(keyword: string, geo: string = 'US'): Promise<TrendingTopic[]> {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const related = await googleTrends.relatedTopics({
        keyword,
        geo,
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endTime: new Date(),
      });

      // Check if response is HTML (blocked/CAPTCHA)
      if (typeof related === 'string' && related.includes('<HTML>')) {
        console.warn('Google Trends API blocked with CAPTCHA for keyword:', keyword);
        return this.getFallbackRelatedTopics(keyword);
      }

      const relatedData = JSON.parse(related);
      const topics: TrendingTopic[] = [];

      if (relatedData.default?.rankedList?.[0]?.rankedKeyword) {
        relatedData.default.rankedList[0].rankedKeyword.forEach((item: any, index: number) => {
          const topic: TrendingTopic = {
            id: `related-${index}`,
            platform: 'google',
            title: item.topic.title,
            summary: `Related to "${keyword}" - ${item.topic.type}`,
            url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(item.topic.title)}&geo=${geo}`,
            score: Math.min(100, item.value),
            fetchedAt: new Date().toISOString(),
            engagement: item.value,
            source: 'Google Trends - Related Topics',
            keywords: [keyword, item.topic.title]
          };
          topics.push(topic);
        });
      }

      return topics.slice(0, 5); // Limit to top 5
    } catch (error) {
      console.error('Error fetching related topics:', error);
      return this.getFallbackRelatedTopics(keyword);
    }
  }

  private getFallbackRelatedTopics(keyword: string): TrendingTopic[] {
    // Provide relevant fallback topics based on keyword
    const fallbackMaps: Record<string, TrendingTopic[]> = {
      'business strategy': [
        {
          id: 'fallback-bs-1',
          platform: 'google',
          title: 'Digital Transformation Strategy',
          summary: 'Companies adapting to digital-first approaches',
          url: 'https://trends.google.com/trends/explore?q=digital+transformation',
          score: 75,
          fetchedAt: new Date().toISOString(),
          engagement: 15000,
          source: 'Google Trends (Fallback)',
          keywords: ['digital', 'transformation', 'strategy']
        },
        {
          id: 'fallback-bs-2',
          platform: 'google',
          title: 'Customer Experience Strategy',
          summary: 'Focus on improving customer journey and satisfaction',
          url: 'https://trends.google.com/trends/explore?q=customer+experience',
          score: 82,
          fetchedAt: new Date().toISOString(),
          engagement: 18000,
          source: 'Google Trends (Fallback)',
          keywords: ['customer', 'experience', 'strategy']
        }
      ],
      'digital marketing': [
        {
          id: 'fallback-dm-1',
          platform: 'google',
          title: 'AI Marketing Tools',
          summary: 'Artificial intelligence in marketing automation',
          url: 'https://trends.google.com/trends/explore?q=ai+marketing',
          score: 88,
          fetchedAt: new Date().toISOString(),
          engagement: 22000,
          source: 'Google Trends (Fallback)',
          keywords: ['ai', 'marketing', 'automation']
        },
        {
          id: 'fallback-dm-2',
          platform: 'google',
          title: 'Social Commerce',
          summary: 'Selling directly through social media platforms',
          url: 'https://trends.google.com/trends/explore?q=social+commerce',
          score: 79,
          fetchedAt: new Date().toISOString(),
          engagement: 16000,
          source: 'Google Trends (Fallback)',
          keywords: ['social', 'commerce', 'selling']
        }
      ]
    };

    return fallbackMaps[keyword] || [];
  }

  private calculateTrendScore(formattedTraffic: string): number {
    // Convert formatted traffic to a score out of 100
    const traffic = this.parseTrafficNumber(formattedTraffic);
    
    if (traffic > 1000000) return 100;
    if (traffic > 500000) return 90;
    if (traffic > 100000) return 80;
    if (traffic > 50000) return 70;
    if (traffic > 10000) return 60;
    if (traffic > 5000) return 50;
    if (traffic > 1000) return 40;
    return 30;
  }

  private parseTrafficNumber(formattedTraffic: string): number {
    // Parse traffic strings like "1M+", "500K+", "50K+"
    const match = formattedTraffic.match(/(\d+(?:\.\d+)?)\s*([MKB]?)\+?/i);
    if (!match) return 0;
    
    const [, num, unit] = match;
    const number = parseFloat(num);
    
    switch (unit.toLowerCase()) {
      case 'm':
        return number * 1000000;
      case 'k':
        return number * 1000;
      case 'b':
        return number * 1000000000;
      default:
        return number;
    }
  }
}

export const trendsService = new TrendsService();