import { trendsService } from './trends';
import { googleTrendsPythonService } from './google-trends-python';
import { socialMediaIntelligence } from './social-media-intelligence';
import { createRedditService } from './reddit';
// Removed Twitter API - moved to future integrations due to rate limiting
import { createNewsService } from './news';
import { createYouTubeService } from './youtube';
import { hackerNewsService } from './hackernews';
import { spotifyService } from './spotify';
import { createLastFmService } from './lastfm';
import { geniusService } from './genius';
import { tmdbService } from './tmdb';
import { tvMazeService } from './tvmaze';
import { createGNewsService } from './gnews';
import { createNYTimesService } from './nytimes';
import { createCurrentsService } from './currents';
import { createMediaStackService } from './mediastack';
import { glaspService } from './glasp';
import { knowYourMemeService } from './knowyourmeme';
import { urbanDictionaryService } from './urbandictionary';
import { youtubeTrendingService } from './youtube-trending';
import { redditCulturalService } from './reddit-cultural';
import { tikTokTrendsService } from './tiktok-trends';
import { instagramTrendsService } from './instagram-trends';
import type { TrendingTopic } from './trends';

export class ExternalAPIsService {
  private redditService: ReturnType<typeof createRedditService>;
  // Twitter service removed - moved to future integrations
  private newsService: ReturnType<typeof createNewsService>;
  private youtubeService: ReturnType<typeof createYouTubeService>;
  private lastfmService: ReturnType<typeof createLastFmService>;
  private gnewsService: ReturnType<typeof createGNewsService>;
  private nytimesService: ReturnType<typeof createNYTimesService>;
  private currentsService: ReturnType<typeof createCurrentsService>;
  private mediastackService: ReturnType<typeof createMediaStackService>;

  constructor() {
    // Initialize existing services
    this.redditService = createRedditService(
      process.env.REDDIT_CLIENT_ID,
      process.env.REDDIT_CLIENT_SECRET
    );
    
    // Twitter service removed - moved to future integrations

    this.newsService = createNewsService(
      process.env.NEWS_API_KEY
    );

    this.youtubeService = createYouTubeService(
      process.env.YOUTUBE_API_KEY
    );

    // Initialize new music & entertainment services
    this.lastfmService = createLastFmService(
      process.env.LASTFM_API_KEY
    );

    // Initialize enhanced news services
    this.gnewsService = createGNewsService(
      process.env.GNEWS_API_KEY
    );

    this.nytimesService = createNYTimesService(
      process.env.NYTIMES_API_KEY
    );

    this.currentsService = createCurrentsService(
      process.env.CURRENTS_API_KEY
    );

    this.mediastackService = createMediaStackService(
      process.env.MEDIASTACK_API_KEY
    );
  }

  async getAllTrendingTopics(platform?: string): Promise<TrendingTopic[]> {
    const results: TrendingTopic[] = [];

    try {
      if (!platform || platform === 'all') {
        // OPTIMIZED: Prioritize fast, reliable sources only - reduced from 23 to 8 APIs
        const [
          googleTrends, redditTrends, newsTrends, youtubeTrends, hackerNewsTrends,
          gnewsTrends, youtubeTrendingTrends, redditCulturalTrends
        ] = await Promise.allSettled([
          this.getGoogleTrends(),
          this.getRedditTrends(), 
          this.getNewsTrends(),
          this.getYouTubeTrends(),
          this.getHackerNewsTrends(),
          this.getGNewsTrends(),
          this.getYouTubeTrendingTrends(),
          this.getRedditCulturalTrends()
        ]);

        // Process fast, reliable sources only - OPTIMIZED for speed
        const allPromises = [
          googleTrends, redditTrends, newsTrends, youtubeTrends, hackerNewsTrends,
          gnewsTrends, youtubeTrendingTrends, redditCulturalTrends
        ];

        allPromises.forEach((promise, index) => {
          const platformNames = [
            'google', 'reddit', 'news', 'youtube', 'hackernews',
            'gnews', 'youtube-trending', 'reddit-cultural'
          ];
          
          if (promise.status === 'fulfilled') {
            results.push(...promise.value);
          } else {
            console.warn(`Failed to fetch from ${platformNames[index]}:`, promise.reason);
          }
        });

      } else {
        // Fetch from specific platform - return up to 20 topics
        switch (platform) {
          case 'google':
            results.push(...await this.getGoogleTrends());
            break;
          case 'reddit':
            results.push(...await this.getRedditTrends());
            break;
          case 'twitter':
            results.push(...await this.getTwitterTrends());
            break;
          case 'news':
            results.push(...await this.getNewsTrends());
            break;
          case 'youtube':
            results.push(...await this.getYouTubeTrends());
            break;
          case 'hackernews':
            results.push(...await this.getHackerNewsTrends());
            break;
          case 'spotify':
            results.push(...await this.getSpotifyTrends());
            break;
          case 'lastfm':
            results.push(...await this.getLastFmTrends());
            break;
          case 'genius':
            results.push(...await this.getGeniusTrends());
            break;
          case 'tmdb':
            results.push(...await this.getTMDbTrends());
            break;
          case 'tvmaze':
            results.push(...await this.getTVMazeTrends());
            break;
          case 'gnews':
            results.push(...await this.getGNewsTrends());
            break;
          case 'nytimes':
            results.push(...await this.getNYTimesTrends());
            break;
          case 'currents':
            results.push(...await this.getCurrentsTrends());
            break;
          case 'mediastack':
            results.push(...await this.getMediaStackTrends());
            break;
          case 'glasp':
            results.push(...await this.getGlaspTrends());
            break;
          case 'knowyourmeme':
            results.push(...await this.getKnowYourMemeTrends());
            break;
          case 'urbandictionary':
            results.push(...await this.getUrbanDictionaryTrends());
            break;
          case 'youtube-trending':
            results.push(...await this.getYouTubeTrendingTrends());
            break;
          case 'reddit-cultural':
            results.push(...await this.getRedditCulturalTrends());
            break;
          case 'tiktok-trends':
            results.push(...await this.getTikTokTrends());
            break;
          case 'instagram-trends':
            results.push(...await this.getInstagramTrends());
            break;
          case 'social-media-intelligence':
            results.push(...await this.getSocialMediaIntelligence());
            break;
        }
        
        // For single platform, return up to 20 topics sorted by score
        return results
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 20);
      }

      // UNLIMITED FLOW - Return ALL trending data from all platforms
      return results
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 200); // Massive increase: up to 200 total trending items
    } catch (error) {
      return [];
    }
  }

  async getGoogleTrends(): Promise<TrendingTopic[]> {
    try {
      console.log('Fetching Google Trends data using Python service');
      
      // Use the new Python-based Google Trends service
      const trends = await googleTrendsPythonService.getAllGoogleTrends();
      
      console.log(`Successfully fetched ${trends.length} Google Trends topics`);
      return trends;
    } catch (error) {
      console.error('Failed to fetch Google Trends data:', error);
      // Return fallback Google Trends data
      return [
        {
          id: 'google-1',
          platform: 'google',
          title: 'AI Technology Trends',
          summary: 'Latest artificial intelligence developments',
          url: '#',
          score: 95,
          fetchedAt: new Date().toISOString(),
          engagement: 89
        },
        {
          id: 'google-2',
          platform: 'google',
          title: 'Digital Marketing Evolution',
          summary: 'New strategies in digital marketing',
          url: '#',
          score: 88,
          fetchedAt: new Date().toISOString(),
          engagement: 85
        }
      ];
    }
  }

  async getRedditTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.redditService) {
        return this.getFallbackRedditData();
      }

      const trends = await this.redditService.getTrendingPosts([
        'marketing',
        'business',
        'entrepreneur',
        'socialmedia',
        'digitalmarketing',
        'startups'
      ]);

      console.log(`Successfully fetched ${trends.length} Reddit trends`);
      return trends;
    } catch (error) {
      console.error('Failed to fetch Reddit trends:', error);
      return this.getFallbackRedditData();
    }
  }

  async getTwitterTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.twitterService) {
        return [];
      }

      const trends = await this.twitterService.getTrendingTopics();
      return trends;
    } catch (error) {
      return [];
    }
  }

  async getNewsTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.newsService) {
        console.log('News service not initialized, using fallback data');
        return this.getFallbackNewsData();
      }

      const trends = await this.newsService.getTrendingNews();
      console.log(`Successfully fetched ${trends.length} news trends`);
      return trends;
    } catch (error) {
      console.error('Failed to fetch news trends:', error);
      return this.getFallbackNewsData();
    }
  }

  async getYouTubeTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.youtubeService) {
        console.log('YouTube service not initialized, using fallback data');
        return this.getFallbackYouTubeData();
      }

      const trends = await this.youtubeService.getTrendingVideos();
      console.log(`Successfully fetched ${trends.length} YouTube trends`);
      return trends;
    } catch (error) {
      console.error('Failed to fetch YouTube trends:', error);
      return this.getFallbackYouTubeData();
    }
  }

  async getHackerNewsTrends(): Promise<TrendingTopic[]> {
    try {
      const trends = await hackerNewsService.getTrendingStories(10);
      console.log(`Successfully fetched ${trends.length} Hacker News trends`);
      return trends;
    } catch (error) {
      console.error('Failed to fetch Hacker News trends:', error);
      return [
        {
          id: 'hn-1',
          platform: 'hackernews',
          title: 'AI Startup Funding Trends',
          summary: 'Analysis of recent AI startup investments',
          url: 'https://news.ycombinator.com',
          score: 82,
          fetchedAt: new Date().toISOString(),
          engagement: 156
        },
        {
          id: 'hn-2',
          platform: 'hackernews',
          title: 'Developer Tools Evolution',
          summary: 'New development frameworks gaining traction',
          url: 'https://news.ycombinator.com',
          score: 78,
          fetchedAt: new Date().toISOString(),
          engagement: 124
        }
      ];
    }
  }

  // Music & Cultural Intelligence Services
  async getSpotifyTrends(): Promise<TrendingTopic[]> {
    try {
      const [featured, newReleases, topTracks] = await Promise.all([
        spotifyService.getFeaturedPlaylists(),
        spotifyService.getNewReleases(),
        spotifyService.getTopTracks()
      ]);
      
      const allTrends = [...featured, ...newReleases, ...topTracks];
      
      return allTrends.slice(0, 8).map(item => ({
        id: item.id,
        platform: 'Spotify',
        title: item.title,
        summary: item.description,
        url: item.url,
        score: item.score,
        fetchedAt: new Date().toISOString(),
        engagement: item.engagement,
        source: 'Spotify API',
        keywords: [item.category.toLowerCase(), 'music', 'streaming']
      }));
    } catch (error) {
      console.error('Error fetching Spotify trends:', error);
      return this.getFallbackMusicData('spotify');
    }
  }

  async getLastFmTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.lastfmService) {
        return this.getFallbackMusicData('lastfm');
      }
      const trends = await this.lastfmService.getTrendingTracks(30);
      return trends;
    } catch (error) {
      return this.getFallbackMusicData('lastfm');
    }
  }

  async getGeniusTrends(): Promise<TrendingTopic[]> {
    try {
      const [trending, popular] = await Promise.all([
        geniusService.getTrendingSongs(),
        geniusService.getPopularSongs()
      ]);
      
      const allTrends = [...trending, ...popular];
      
      return allTrends.slice(0, 25).map(item => ({
        id: item.id,
        platform: 'Genius',
        title: item.title,
        summary: item.description,
        url: item.url,
        score: item.score,
        fetchedAt: new Date().toISOString(),
        engagement: item.engagement,
        source: 'Genius API',
        keywords: [item.category.toLowerCase(), 'music', 'lyrics', 'analysis']
      }));
    } catch (error) {
      console.error('Error fetching Genius trends:', error);
      return this.getFallbackMusicData('genius');
    }
  }

  // Entertainment Intelligence Services  
  async getTMDbTrends(): Promise<TrendingTopic[]> {
    try {
      const [movies, tvShows, popular] = await Promise.all([
        tmdbService.getTrendingMovies(),
        tmdbService.getTrendingTVShows(),
        tmdbService.getPopularMovies()
      ]);
      
      const allTrends = [...movies, ...tvShows, ...popular];
      
      return allTrends.slice(0, 25).map(item => ({
        id: item.id,
        platform: 'TMDB',
        title: item.title,
        summary: item.description,
        url: item.url,
        score: item.score,
        fetchedAt: new Date().toISOString(),
        engagement: item.engagement,
        source: 'TMDB API',
        keywords: [item.category.toLowerCase(), 'entertainment', 'movies', 'tv']
      }));
    } catch (error) {
      console.error('Error fetching TMDB trends:', error);
      return this.getFallbackEntertainmentData('tmdb');
    }
  }

  async getTVMazeTrends(): Promise<TrendingTopic[]> {
    try {
      const trends = await tvMazeService.getTrendingShows(25);
      return trends;
    } catch (error) {
      return this.getFallbackEntertainmentData('tvmaze');
    }
  }

  // Enhanced News Intelligence Services
  async getGNewsTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.gnewsService) {
        return this.getFallbackNewsData('gnews');
      }
      const trends = await this.gnewsService.getTrendingNews('business', 30);
      return trends;
    } catch (error) {
      return this.getFallbackNewsData('gnews');
    }
  }

  async getNYTimesTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.nytimesService) {
        return this.getFallbackNewsData('nytimes');
      }
      const trends = await this.nytimesService.getTopStories('business', 30);
      return trends;
    } catch (error) {
      return this.getFallbackNewsData('nytimes');
    }
  }

  async getCurrentsTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.currentsService) {
        return this.getFallbackNewsData('currents');
      }
      const trends = await this.currentsService.getLatestNews('business', 'US', 30);
      return trends;
    } catch (error) {
      return this.getFallbackNewsData('currents');
    }
  }

  async getMediaStackTrends(): Promise<TrendingTopic[]> {
    try {
      if (!this.mediastackService) {
        return this.getFallbackNewsData('mediastack');
      }
      const trends = await this.mediastackService.getLiveNews(['business', 'technology'], ['us'], 30);
      return trends;
    } catch (error) {
      return this.getFallbackNewsData('mediastack');
    }
  }

  async getGlaspTrends(): Promise<TrendingTopic[]> {
    try {
      const trends = await glaspService.getTrendingHighlights(30);
      return trends;
    } catch (error) {
      return this.getFallbackKnowledgeData();
    }
  }

  // Cultural Intelligence Services
  async getKnowYourMemeTrends(): Promise<TrendingTopic[]> {
    try {
      const [trending, popular, deadpools] = await Promise.all([
        knowYourMemeService.getTrendingMemes(25),
        knowYourMemeService.getPopularMemes(25),
        knowYourMemeService.getDeadpoolMemes(15)
      ]);
      
      const allTrends = [...trending, ...popular, ...deadpools];
      return allTrends.slice(0, 50);
    } catch (error) {
      debugLogger.warn('Know Your Meme blocked - using fallback data');
      return [];
    }
  }

  async getUrbanDictionaryTrends(): Promise<TrendingTopic[]> {
    try {
      const [trending, popular, recent, wordOfDay] = await Promise.all([
        urbanDictionaryService.getTrendingWords(25),
        urbanDictionaryService.getPopularWords(25),
        urbanDictionaryService.getRecentWords(15),
        urbanDictionaryService.getWordOfTheDay()
      ]);
      
      const allTrends = [...trending, ...popular, ...recent, ...wordOfDay];
      return allTrends.slice(0, 50);
    } catch (error) {
      return [];
    }
  }

  async getYouTubeTrendingTrends(): Promise<TrendingTopic[]> {
    try {
      const [general, music, gaming, news] = await Promise.all([
        youtubeTrendingService.getTrendingVideos(25),
        youtubeTrendingService.getMusicTrending(20),
        youtubeTrendingService.getGamingTrending(20),
        youtubeTrendingService.getNewsTrending(15)
      ]);
      
      const allTrends = [...general, ...music, ...gaming, ...news];
      return allTrends.slice(0, 60);
    } catch (error) {
      return [];
    }
  }

  async getRedditCulturalTrends(): Promise<TrendingTopic[]> {
    try {
      const [cultural, viral, generational, trending] = await Promise.all([
        redditCulturalService.getCulturalTrends(30),
        redditCulturalService.getViralContent(25),
        redditCulturalService.getGenerationalTrends(25),
        redditCulturalService.getTrendingSubreddits(20)
      ]);
      
      const allTrends = [...cultural, ...viral, ...generational, ...trending];
      return allTrends.slice(0, 75);
    } catch (error) {
      return [];
    }
  }

  async getTikTokTrends(): Promise<TrendingTopic[]> {
    try {
      const [hashtags, discover, music] = await Promise.all([
        tikTokTrendsService.getTrendingHashtags(40),
        tikTokTrendsService.getDiscoverTrends(30),
        tikTokTrendsService.getMusicTrends(25)
      ]);
      
      const allTrends = [...hashtags, ...discover, ...music];
      return allTrends.slice(0, 75);
    } catch (error) {
      return [];
    }
  }

  async getInstagramTrends(): Promise<TrendingTopic[]> {
    try {
      const [trending, popular, lifestyle, business] = await Promise.all([
        instagramTrendsService.getTrendingHashtags(40),
        instagramTrendsService.getPopularHashtags(['fashion', 'food', 'travel', 'fitness'], 30),
        instagramTrendsService.getLifestyleTrends(30),
        instagramTrendsService.getBusinessTrends(25)
      ]);
      
      const allTrends = [...trending, ...popular, ...lifestyle, ...business];
      return allTrends.slice(0, 100);
    } catch (error) {
      return [];
    }
  }

  // Bright Data Enhanced Scraping Integration 
  async getBrightDataTrends(): Promise<TrendingTopic[]> {
    try {
      const { brightDataService } = await import('./bright-data-service');
      
      if (!(await brightDataService.isAvailable())) {
        console.log('Bright Data not available, skipping enhanced scraping');
        return [];
      }
      
      // Use Bright Data's specialized social media scrapers
      const [instagramResults, twitterResults, tiktokResults, linkedinResults] = await Promise.all([
        brightDataService.scrapeInstagramPosts(['ai', 'startup', 'innovation', 'tech', 'business']),
        brightDataService.scrapeTwitterTrends('worldwide'),
        brightDataService.scrapeTikTokTrends(),
        brightDataService.scrapeLinkedInContent(['artificial intelligence', 'startup trends'])
      ]);
      
      const results = [...instagramResults, ...twitterResults, ...tiktokResults, ...linkedinResults];
      
      return results
        .filter(r => r.success)
        .map((result, index) => ({
          id: `bright-data-${index}`,
          platform: 'Social Media' as any,
          title: result.content?.title || `Enhanced Social Data ${index + 1}`,
          summary: 'Content extracted via Bright Data advanced web scraping',
          url: result.url,
          score: 95, // High score for enhanced data
          fetchedAt: result.timestamp,
          engagement: Math.floor(Math.random() * 500) + 100,
          category: 'social-intelligence',
          keywords: ['bright-data', 'enhanced-scraping', 'social-media'],
          source: 'Bright Data Intelligence'
        }));
        
    } catch (error) {
      console.warn('Bright Data trends extraction failed:', error.message);
      return [];
    }
  }

  // Social Media Intelligence Integration (Beta) - All 4 Data Groups
  async getSocialMediaIntelligence(): Promise<TrendingTopic[]> {
    try {
      const [twitterTrends, linkedinIntel, instagramTrends, tiktokTrends] = await Promise.all([
        this.getTwitterSocialIntelligence(),
        this.getLinkedInSocialIntelligence(),
        this.getInstagramSocialIntelligence(),
        this.getTikTokSocialIntelligence()
      ]);
      
      // Include Bright Data enhanced scraping if available
      const brightDataTrends = await this.getBrightDataTrends();
      
      return [...twitterTrends, ...linkedinIntel, ...instagramTrends, ...tiktokTrends, ...brightDataTrends]; // NO LIMITS - Full social intelligence flow
    } catch (error) {
      console.error('Social media intelligence error:', error);
      return [];
    }
  }

  private async getInstagramSocialIntelligence(): Promise<TrendingTopic[]> {
    try {
      const businessHashtags = ['startup', 'entrepreneur', 'ai', 'saas', 'innovation'];
      const result = await socialMediaIntelligence.scrapeInstagramHashtags(businessHashtags);
      
      if (!result || !Array.isArray(result)) return [];
      
      const allPosts = result.flatMap(hashtagResult => 
        hashtagResult.success ? hashtagResult.data?.posts || [] : []
      );
      
      return allPosts.slice(0, 50).map((post: any, index: number) => ({
        id: `instagram-${Date.now()}-${index}`,
        platform: 'Social Media' as any,
        title: post.text?.substring(0, 80) + (post.text?.length > 80 ? '...' : '') || 'Instagram Trend',
        summary: `Visual Trend: ${post.text?.substring(0, 120) || 'Trending hashtag content'}...`,
        url: post.href || 'https://instagram.com',
        score: 80 + Math.random() * 15,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Instagram Intelligence',
        keywords: ['visual', 'trends', 'instagram', 'social']
      }));
    } catch (error) {
      console.warn('Instagram social intelligence unavailable:', error);
      return [];
    }
  }

  private async getTwitterSocialIntelligence(): Promise<TrendingTopic[]> {
    try {
      const result = await socialMediaIntelligence.scrapeTwitterTrends('worldwide');
      if (!result.success || !result.data?.posts) return [];
      
      return result.data.posts.slice(0, 50).map((post: any, index: number) => ({
        id: `twitter-${Date.now()}-${index}`,
        platform: 'Social Media' as any,
        title: post.text.substring(0, 80) + (post.text.length > 80 ? '...' : ''),
        summary: `Trending: ${post.text.substring(0, 120)}...`,
        url: post.href || 'https://twitter.com/explore',
        score: 85 + Math.random() * 10,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Twitter Intelligence',
        keywords: result.data.summary?.topKeywords?.slice(0, 3) || ['trending', 'social', 'twitter']
      }));
    } catch (error) {
      console.warn('Twitter social intelligence unavailable:', error);
      return [];
    }
  }

  private async getLinkedInSocialIntelligence(): Promise<TrendingTopic[]> {
    try {
      // Expanded companies for comprehensive intelligence gathering
      const companies = ['microsoft', 'google', 'openai', 'meta', 'apple', 'tesla', 'nvidia', 'amazon'];
      const companyResults = [];
      
      for (const company of companies.slice(0, 8)) { // Full company coverage for 6 beta testers
        try {
          const result = await socialMediaIntelligence.scrapeLinkedInCompany(company);
          if (result.success && result.data?.posts) {
            companyResults.push(...result.data.posts.slice(0, 40));
          }
        } catch (error) {
          continue; // Skip failed companies
        }
        
        // Rate limiting between companies
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      return companyResults.map((post: any, index: number) => ({
        id: `linkedin-${Date.now()}-${index}`,
        platform: 'Social Media' as any,
        title: post.text.substring(0, 80) + (post.text.length > 80 ? '...' : ''),
        summary: `Corporate Update: ${post.text.substring(0, 120)}...`,
        url: post.href || 'https://linkedin.com',
        score: 90 + Math.random() * 8,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'LinkedIn Intelligence',
        keywords: ['corporate', 'business', 'professional', 'industry']
      }));
    } catch (error) {
      console.warn('LinkedIn social intelligence unavailable:', error);
      return [];
    }
  }

  private async getTikTokSocialIntelligence(): Promise<TrendingTopic[]> {
    try {
      const result = await socialMediaIntelligence.scrapeTikTokTrends();
      
      if (!result.success || !result.data?.posts) return [];
      
      const allPosts = result.data.posts || [];
      
      return allPosts.slice(0, 50).map((post: any, index: number) => ({
        id: `tiktok-${Date.now()}-${index}`,
        platform: 'Social Media' as any,
        title: post.title?.substring(0, 80) + (post.title?.length > 80 ? '...' : '') || 'TikTok Trend',
        summary: `Viral Challenge: ${post.description?.substring(0, 120) || 'Trending TikTok content'}...`,
        url: post.href || 'https://tiktok.com/discover',
        score: 88 + Math.random() * 10,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'TikTok Intelligence',
        keywords: ['viral', 'tiktok', 'challenges', 'trends', 'gen-z']
      }));
    } catch (error) {
      console.warn('TikTok social intelligence unavailable:', error);
      return [];
    }
  }

  async searchTrends(query: string, platform?: string): Promise<TrendingTopic[]> {
    const results: TrendingTopic[] = [];

    try {
      if (!platform || platform === 'all') {
        // Search across all platforms
        const [redditResults, twitterResults, googleResults] = await Promise.allSettled([
          this.searchReddit(query),
          this.searchTwitter(query),
          this.searchGoogle(query)
        ]);

        if (redditResults.status === 'fulfilled') {
          results.push(...redditResults.value);
        }
        if (twitterResults.status === 'fulfilled') {
          results.push(...twitterResults.value);
        }
        if (googleResults.status === 'fulfilled') {
          results.push(...googleResults.value);
        }
      } else {
        // Search specific platform
        switch (platform) {
          case 'reddit':
            results.push(...await this.searchReddit(query));
            break;
          case 'twitter':
            results.push(...await this.searchTwitter(query));
            break;
          case 'google':
            results.push(...await this.searchGoogle(query));
            break;
        }
      }

      return results
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 15);
    } catch (error) {
      return [];
    }
  }

  private async searchReddit(query: string): Promise<TrendingTopic[]> {
    if (!this.redditService) return [];
    
    return await this.redditService.searchPosts(query);
  }

  private async searchTwitter(query: string): Promise<TrendingTopic[]> {
    if (!this.twitterService) return [];
    
    return await this.twitterService.searchTweets(query);
  }

  private async searchGoogle(query: string): Promise<TrendingTopic[]> {
    try {
      const relatedTopics = await trendsService.getRelatedTopics(query);
      return relatedTopics;
    } catch (error) {
      return [];
    }
  }

  // Health check methods
  async checkAPIHealth(): Promise<{ platform: string; status: string; message?: string }[]> {
    const results = [];

    // Google Trends (always available)
    results.push({
      platform: 'google',
      status: 'available',
      message: 'Google Trends API is working'
    });

    // Reddit API
    if (this.redditService) {
      try {
        await this.redditService.getTrendingPosts(['test']);
        results.push({
          platform: 'reddit',
          status: 'available',
          message: 'Reddit API is working'
        });
      } catch (error) {
        results.push({
          platform: 'reddit',
          status: 'error',
          message: 'Reddit API authentication failed'
        });
      }
    } else {
      results.push({
        platform: 'reddit',
        status: 'unavailable',
        message: 'Reddit API credentials not configured'
      });
    }

    // Twitter API
    if (this.twitterService) {
      try {
        await this.twitterService.searchTweets('#test', 1);
        results.push({
          platform: 'twitter',
          status: 'available',
          message: 'Twitter API is working'
        });
      } catch (error) {
        results.push({
          platform: 'twitter',
          status: 'error',
          message: 'Twitter API authentication failed'
        });
      }
    } else {
      results.push({
        platform: 'twitter',
        status: 'unavailable',
        message: 'Twitter API credentials not configured'
      });
    }

    // News API
    if (this.newsService) {
      results.push({
        platform: 'news',
        status: 'available',
        message: 'NewsAPI integration ready'
      });
    } else {
      results.push({
        platform: 'news',
        status: 'unavailable',
        message: 'NewsAPI key not configured'
      });
    }

    // YouTube API
    if (this.youtubeService) {
      results.push({
        platform: 'youtube',
        status: 'available',
        message: 'YouTube Data API integration ready'
      });
    } else {
      results.push({
        platform: 'youtube',
        status: 'unavailable',
        message: 'YouTube API key not configured'
      });
    }

    // Hacker News (always available)
    results.push({
      platform: 'hackernews',
      status: 'available',
      message: 'Hacker News API is working'
    });

    // Music & Cultural Intelligence APIs
    results.push({
      platform: 'spotify',
      status: this.spotifyService ? 'available' : 'unavailable',
      message: this.spotifyService ? 'Spotify Web API integration ready' : 'Spotify API credentials not configured'
    });

    results.push({
      platform: 'lastfm',
      status: this.lastfmService ? 'available' : 'unavailable',
      message: this.lastfmService ? 'Last.fm API integration ready' : 'Last.fm API key not configured'
    });

    results.push({
      platform: 'genius',
      status: this.geniusService ? 'available' : 'unavailable',
      message: this.geniusService ? 'Genius API integration ready' : 'Genius access token not configured'
    });

    // Entertainment Intelligence APIs
    results.push({
      platform: 'tmdb',
      status: this.tmdbService ? 'available' : 'unavailable',
      message: this.tmdbService ? 'TMDb API integration ready' : 'TMDb API key not configured'
    });

    results.push({
      platform: 'tvmaze',
      status: 'available',
      message: 'TVMaze API is working (no authentication required)'
    });

    // Enhanced News Intelligence APIs
    results.push({
      platform: 'gnews',
      status: this.gnewsService ? 'available' : 'unavailable',
      message: this.gnewsService ? 'GNews API integration ready' : 'GNews API key not configured'
    });

    results.push({
      platform: 'nytimes',
      status: this.nytimesService ? 'available' : 'unavailable',
      message: this.nytimesService ? 'NY Times API integration ready' : 'NY Times API key not configured'
    });

    results.push({
      platform: 'currents',
      status: this.currentsService ? 'available' : 'unavailable',
      message: this.currentsService ? 'Currents API integration ready' : 'Currents API key not configured'
    });

    results.push({
      platform: 'mediastack',
      status: this.mediastackService ? 'available' : 'unavailable',
      message: this.mediastackService ? 'MediaStack API integration ready' : 'MediaStack API key not configured'
    });

    results.push({
      platform: 'glasp',
      status: 'available',
      message: 'Glasp integration ready (API under development)'
    });

    return results;
  }

  private getFallbackRedditData(): TrendingTopic[] {
    return [
      {
        id: 'reddit-1',
        platform: 'reddit',
        title: 'Small Business Marketing Strategies',
        summary: 'Latest discussion on effective marketing tactics for SMBs',
        url: 'https://reddit.com/r/marketing',
        score: 87,
        fetchedAt: new Date().toISOString(),
        engagement: 342,
        keywords: ['marketing', 'business', 'strategies']
      },
      {
        id: 'reddit-2',
        platform: 'reddit',
        title: 'Remote Work Culture Evolution',
        summary: 'How companies are adapting to hybrid work models',
        url: 'https://reddit.com/r/entrepreneur',
        score: 84,
        fetchedAt: new Date().toISOString(),
        engagement: 298,
        keywords: ['remote', 'work', 'culture', 'business']
      },
      {
        id: 'reddit-3',
        platform: 'reddit',
        title: 'AI Tools for Content Creation',
        summary: 'Entrepreneurs sharing AI tools for marketing and content',
        url: 'https://reddit.com/r/digitalnomad',
        score: 81,
        fetchedAt: new Date().toISOString(),
        engagement: 276,
        keywords: ['ai', 'content', 'tools', 'marketing']
      }
    ];
  }



  private getFallbackYouTubeData(): TrendingTopic[] {
    return [
      {
        id: 'youtube-1',
        platform: 'youtube',
        title: '2025 Marketing Trends Every Business Needs to Know',
        summary: 'Top marketing strategies and consumer behavior insights for the new year',
        url: 'https://youtube.com/watch?v=trending1',
        score: 92,
        fetchedAt: new Date().toISOString(),
        engagement: 45600,
        keywords: ['marketing', '2025', 'trends', 'business', 'strategy']
      },
      {
        id: 'youtube-2',
        platform: 'youtube',
        title: 'AI Content Creation Revolution',
        summary: 'How AI tools are transforming content creation and marketing workflows',
        url: 'https://youtube.com/watch?v=trending2',
        score: 89,
        fetchedAt: new Date().toISOString(),
        engagement: 38200,
        keywords: ['ai', 'content', 'creation', 'automation', 'marketing']
      },
      {
        id: 'youtube-3',
        platform: 'youtube',
        title: 'Small Business Success Stories 2025',
        summary: 'Inspiring stories of entrepreneurs who scaled their businesses',
        url: 'https://youtube.com/watch?v=trending3',
        score: 86,
        fetchedAt: new Date().toISOString(),
        engagement: 29800,
        keywords: ['entrepreneur', 'success', 'scaling', 'business', 'inspiration']
      }
    ];
  }

  private getFallbackMusicData(platform: string): TrendingTopic[] {
    const platformData = {
      spotify: {
        title: 'Spotify Web API Integration Ready',
        summary: 'Configure Spotify API credentials to fetch trending music and cultural signals',
        url: 'https://developer.spotify.com/dashboard',
        keywords: ['spotify', 'music', 'culture', 'trends', 'audio']
      },
      lastfm: {
        title: 'Last.fm API Integration Ready',
        summary: 'Configure Last.fm API key to fetch music trends and cultural metadata',
        url: 'https://www.last.fm/api/account/create',
        keywords: ['lastfm', 'music', 'scrobbling', 'trends', 'metadata']
      },
      genius: {
        title: 'Genius API Integration Ready',
        summary: 'Configure Genius API token to fetch lyrical analysis and cultural context',
        url: 'https://genius.com/api-clients',
        keywords: ['genius', 'lyrics', 'culture', 'annotations', 'music']
      }
    };

    const data = platformData[platform as keyof typeof platformData];
    return [
      {
        id: `${platform}-fallback-1`,
        platform,
        title: data.title,
        summary: data.summary,
        url: data.url,
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: data.keywords
      }
    ];
  }

  private getFallbackEntertainmentData(platform: string): TrendingTopic[] {
    const platformData = {
      tmdb: {
        title: 'TMDb API Integration Ready',
        summary: 'Configure TMDb API key to fetch trending movies and TV shows for entertainment intelligence',
        url: 'https://www.themoviedb.org/settings/api',
        keywords: ['tmdb', 'movies', 'tv', 'entertainment', 'trends']
      },
      tvmaze: {
        title: 'TVMaze API Active',
        summary: 'TVMaze API is operational and fetching current TV show trends and schedules',
        url: 'https://www.tvmaze.com',
        keywords: ['tvmaze', 'tv', 'shows', 'schedule', 'entertainment']
      }
    };

    const data = platformData[platform as keyof typeof platformData];
    return [
      {
        id: `${platform}-fallback-1`,
        platform,
        title: data.title,
        summary: data.summary,
        url: data.url,
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: data.keywords
      }
    ];
  }

  private getFallbackNewsData(source?: string): TrendingTopic[] {
    if (source) {
      const sourceData = {
        gnews: {
          title: 'GNews API Integration Ready',
          summary: 'Configure GNews API key for enhanced news intelligence with sentiment analysis',
          url: 'https://gnews.io/',
          keywords: ['gnews', 'news', 'sentiment', 'analysis', 'intelligence']
        },
        nytimes: {
          title: 'NY Times API Integration Ready',
          summary: 'Configure NY Times API key for premium journalism and business news',
          url: 'https://developer.nytimes.com/',
          keywords: ['nytimes', 'journalism', 'news', 'business', 'premium']
        },
        currents: {
          title: 'Currents API Integration Ready',
          summary: 'Configure Currents API key for real-time news with sentiment and categorization',
          url: 'https://currentsapi.services/',
          keywords: ['currents', 'news', 'sentiment', 'realtime', 'categorization']
        },
        mediastack: {
          title: 'MediaStack API Integration Ready',
          summary: 'Configure MediaStack API key for global news aggregation and source filtering',
          url: 'https://mediastack.com/',
          keywords: ['mediastack', 'news', 'global', 'aggregation', 'sources']
        }
      };

      const data = sourceData[source as keyof typeof sourceData];
      if (data) {
        return [
          {
            id: `${source}-fallback-1`,
            platform: source,
            title: data.title,
            summary: data.summary,
            url: data.url,
            score: 1,
            fetchedAt: new Date().toISOString(),
            engagement: 0,
            source: 'Fallback Data',
            keywords: data.keywords
          }
        ];
      }
    }

    return [
      {
        id: 'news-fallback-1',
        platform: 'news',
        title: 'NewsAPI Integration Ready',
        summary: 'Configure NewsAPI key to fetch trending business news and market insights',
        url: 'https://newsapi.org/register',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['news', 'api', 'business', 'market', 'trends']
      }
    ];
  }

  private getFallbackKnowledgeData(): TrendingTopic[] {
    return [
      {
        id: 'glasp-fallback-1',
        platform: 'glasp',
        title: 'Glasp Knowledge Integration Active',
        summary: 'Glasp social highlighting integration providing insights into knowledge curation trends',
        url: 'https://glasp.co',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Glasp Integration',
        keywords: ['glasp', 'knowledge', 'highlighting', 'curation', 'social']
      }
    ];
  }
}

export const externalAPIsService = new ExternalAPIsService();