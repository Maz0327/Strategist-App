import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface TVMazeShow {
  id: number;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime: number;
  averageRuntime: number;
  premiered: string;
  ended?: string;
  officialSite?: string;
  schedule: {
    time: string;
    days: string[];
  };
  rating: {
    average: number;
  };
  weight: number;
  network?: {
    id: number;
    name: string;
    country: {
      name: string;
      code: string;
      timezone: string;
    };
  };
  webChannel?: {
    id: number;
    name: string;
  };
  image?: {
    medium: string;
    original: string;
  };
  summary: string;
  updated: number;
  url: string;
}

export class TVMazeService {
  private readonly baseUrl = 'https://api.tvmaze.com';

  async getTrendingShows(limit: number = 20): Promise<TrendingTopic[]> {
    try {
      // Get shows scheduled for today
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${this.baseUrl}/schedule?date=${today}&country=US`);
      
      const episodes = response.data;
      const showsWithEpisodes = episodes.map((episode: any) => episode.show);
      
      // Remove duplicates and get unique shows
      const uniqueShows = showsWithEpisodes.filter((show: TVMazeShow, index: number, self: TVMazeShow[]) => 
        index === self.findIndex(s => s.id === show.id)
      );

      // Also get popular shows to supplement
      const popularShows = await this.getPopularShows(10);
      
      // Combine and deduplicate
      const allShows = [...uniqueShows, ...popularShows];
      const deduplicatedShows = allShows.filter((show: TVMazeShow, index: number, self: TVMazeShow[]) => 
        index === self.findIndex(s => s.id === show.id)
      );

      return deduplicatedShows
        .slice(0, limit)
        .map((show: TVMazeShow, index: number) => ({
          id: `tvmaze-${show.id}`,
          platform: 'tvmaze',
          title: show.name,
          summary: this.generateSummary(show),
          url: show.url,
          score: this.calculateShowScore(show, index),
          fetchedAt: new Date().toISOString(),
          engagement: this.calculateEngagement(show),
          source: 'TVMaze',
          keywords: this.extractKeywords(show.name, show.genres, show.summary)
        }));

    } catch (error) {
      debugLogger.error('Failed to fetch TVMaze trending shows', error);
      return this.getFallbackShows();
    }
  }

  async getPopularShows(limit: number = 10): Promise<TVMazeShow[]> {
    try {
      // Get shows ordered by weight (popularity indicator)
      const response = await axios.get(`${this.baseUrl}/shows?page=0`);
      
      return response.data
        .sort((a: TVMazeShow, b: TVMazeShow) => (b.weight || 0) - (a.weight || 0))
        .slice(0, limit);

    } catch (error) {
      debugLogger.error('Failed to fetch popular shows', error);
      return [];
    }
  }

  async searchShows(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/search/shows?q=${encodeURIComponent(query)}`);
      
      const shows = response.data
        .map((result: any) => result.show)
        .slice(0, limit);

      return shows.map((show: TVMazeShow, index: number) => ({
        id: `tvmaze-search-${show.id}`,
        platform: 'tvmaze',
        title: show.name,
        summary: this.generateSummary(show, query),
        url: show.url,
        score: this.calculateShowScore(show, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.calculateEngagement(show),
        source: 'TVMaze Search',
        keywords: this.extractKeywords(show.name, show.genres, show.summary, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search TVMaze shows', error);
      return [];
    }
  }

  async getShowsByGenre(genre: string, limit: number = 10): Promise<TrendingTopic[]> {
    try {
      // Get popular shows and filter by genre
      const popularShows = await this.getPopularShows(50);
      
      const genreShows = popularShows
        .filter(show => show.genres.some(g => g.toLowerCase().includes(genre.toLowerCase())))
        .slice(0, limit);

      return genreShows.map((show: TVMazeShow, index: number) => ({
        id: `tvmaze-genre-${show.id}`,
        platform: 'tvmaze',
        title: show.name,
        summary: this.generateSummary(show, `${genre} genre`),
        url: show.url,
        score: this.calculateShowScore(show, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.calculateEngagement(show),
        source: `TVMaze - ${genre} Shows`,
        keywords: this.extractKeywords(show.name, show.genres, show.summary, genre)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch shows by genre', error);
      return [];
    }
  }

  async getCurrentlyAiring(limit: number = 15): Promise<TrendingTopic[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`${this.baseUrl}/schedule?date=${today}&country=US`);
      
      const episodes = response.data.slice(0, limit);

      return episodes.map((episode: any, index: number) => {
        const show = episode.show;
        return {
          id: `tvmaze-airing-${show.id}-${episode.id}`,
          platform: 'tvmaze',
          title: `${show.name} - ${episode.name || 'Episode'}`,
          summary: `Currently airing: ${episode.name || 'New episode'} at ${episode.airtime || 'TBA'}. ${this.cleanSummary(show.summary)}`,
          url: show.url,
          score: this.calculateShowScore(show, index) + 10, // Boost for currently airing
          fetchedAt: new Date().toISOString(),
          engagement: this.calculateEngagement(show),
          source: 'TVMaze - Currently Airing',
          keywords: this.extractKeywords(show.name, show.genres, episode.name)
        };
      });

    } catch (error) {
      debugLogger.error('Failed to fetch currently airing shows', error);
      return [];
    }
  }

  private generateSummary(show: TVMazeShow, context?: string): string {
    const parts = [];
    
    if (context) {
      parts.push(`Search result for "${context}"`);
    }
    
    if (show.genres && show.genres.length > 0) {
      parts.push(`${show.genres.slice(0, 2).join(', ')} series`);
    }
    
    if (show.rating?.average) {
      parts.push(`${show.rating.average}/10 rating`);
    }
    
    if (show.status) {
      parts.push(`Status: ${show.status}`);
    }
    
    if (show.network?.name) {
      parts.push(`on ${show.network.name}`);
    } else if (show.webChannel?.name) {
      parts.push(`on ${show.webChannel.name}`);
    }
    
    if (show.summary) {
      const cleanSummary = this.cleanSummary(show.summary);
      if (cleanSummary.length > 100) {
        parts.push(cleanSummary.substring(0, 100) + '...');
      } else {
        parts.push(cleanSummary);
      }
    }

    return parts.join('. ');
  }

  private calculateShowScore(show: TVMazeShow, position: number): number {
    let score = 85 - (position * 2);
    
    // Boost for high ratings
    if (show.rating?.average) {
      if (show.rating.average > 8) score += 20;
      else if (show.rating.average > 7) score += 15;
      else if (show.rating.average > 6) score += 10;
    }
    
    // Boost for high weight (popularity)
    if (show.weight > 90) score += 15;
    else if (show.weight > 80) score += 10;
    else if (show.weight > 70) score += 5;
    
    // Boost for currently running shows
    if (show.status === 'Running') score += 10;
    else if (show.status === 'To Be Determined') score += 5;
    
    // Boost for recent shows
    if (show.premiered) {
      const premiereDate = new Date(show.premiered);
      const daysSincePremiere = (Date.now() - premiereDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePremiere < 30) score += 15;
      else if (daysSincePremiere < 90) score += 10;
      else if (daysSincePremiere < 365) score += 5;
    }
    
    // Boost for popular genres
    const popularGenres = ['Drama', 'Comedy', 'Action', 'Crime', 'Thriller'];
    if (show.genres && show.genres.some(genre => popularGenres.includes(genre))) {
      score += 5;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private calculateEngagement(show: TVMazeShow): number {
    let engagement = 0;
    
    if (show.weight) {
      engagement += show.weight * 10;
    }
    
    if (show.rating?.average) {
      engagement += show.rating.average * 100;
    }
    
    // Add base engagement for active shows
    if (show.status === 'Running') {
      engagement += 500;
    }
    
    return Math.floor(engagement);
  }

  private extractKeywords(name: string, genres?: string[], summary?: string, query?: string): string[] {
    const keywords = [];
    
    if (name) {
      keywords.push(...name.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (genres) {
      keywords.push(...genres.map(g => g.toLowerCase()));
    }
    
    if (summary) {
      const summaryWords = this.cleanSummary(summary)
        .toLowerCase()
        .split(/[\s\-\(\)\.]+/)
        .filter(w => w.length > 3)
        .slice(0, 5);
      keywords.push(...summaryWords);
    }
    
    if (query) {
      keywords.push(...query.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    const commonWords = ['the', 'and', 'with', 'for', 'from', 'show', 'series', 'when', 'after', 'their', 'that', 'this', 'they', 'have', 'been', 'will'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private cleanSummary(summary: string): string {
    if (!summary) return '';
    // Remove HTML tags
    return summary.replace(/<[^>]*>/g, '').trim();
  }

  private getFallbackShows(): TrendingTopic[] {
    return [
      {
        id: 'tvmaze-fallback-1',
        platform: 'tvmaze',
        title: 'TVMaze API Integration Active',
        summary: 'TVMaze API is fully operational and fetching current TV show trends and schedules',
        url: 'https://www.tvmaze.com',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'TVMaze',
        keywords: ['tvmaze', 'tv', 'shows', 'entertainment', 'schedule']
      }
    ];
  }
}

export const tvMazeService = new TVMazeService();