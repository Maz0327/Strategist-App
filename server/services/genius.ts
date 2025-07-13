import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface GeniusSong {
  id: number;
  title: string;
  url: string;
  lyrics_state: string;
  header_image_thumbnail_url: string;
  header_image_url: string;
  release_date_for_display: string;
  stats: {
    pageviews: number;
  };
  primary_artist: {
    id: number;
    name: string;
    url: string;
    image_url: string;
  };
  annotation_count: number;
  hot: boolean;
}

export class GeniusService {
  private readonly accessToken: string | undefined;
  private readonly baseUrl = 'https://api.genius.com';

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
  }

  async getTrendingSongs(limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.accessToken) {
      debugLogger.warn('Genius API token not configured, returning fallback data');
      return this.getFallbackSongs();
    }

    try {
      // Get trending songs by searching for popular recent tracks
      const queries = ['trending', 'viral', 'popular', 'new music', 'hit songs'];
      const allSongs: TrendingTopic[] = [];

      for (const query of queries.slice(0, 2)) { // Limit to avoid rate limits
        const songs = await this.searchSongs(query, 5);
        allSongs.push(...songs);
      }

      // Remove duplicates and sort by score
      const uniqueSongs = allSongs.filter((song, index, self) => 
        index === self.findIndex(s => s.id === song.id)
      );

      return uniqueSongs
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);

    } catch (error) {
      debugLogger.error('Failed to fetch Genius trending songs', error);
      return this.getFallbackSongs();
    }
  }

  async searchSongs(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.accessToken) {
      return this.getFallbackSongs();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          q: query,
          per_page: limit
        }
      });

      const hits = response.data.response.hits;

      return hits.map((hit: any, index: number) => {
        const song = hit.result;
        return {
          id: `genius-${song.id}`,
          platform: 'genius',
          title: `${song.primary_artist.name} - ${song.title}`,
          summary: this.generateSummary(song, query),
          url: song.url,
          score: this.calculateSongScore(song, index),
          fetchedAt: new Date().toISOString(),
          engagement: this.calculateEngagement(song),
          source: 'Genius Lyrics',
          keywords: this.extractKeywords(song.title, song.primary_artist.name, query)
        };
      });

    } catch (error) {
      debugLogger.error('Failed to search Genius songs', error);
      return [];
    }
  }

  async getSongAnnotations(songId: number): Promise<any[]> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/songs/${songId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data.response.song.annotation_count || 0;

    } catch (error) {
      debugLogger.error('Failed to fetch song annotations', error);
      return [];
    }
  }

  async getArtistSongs(artistId: number, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}/songs`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          per_page: limit,
          sort: 'popularity'
        }
      });

      const songs = response.data.response.songs;

      return songs.map((song: GeniusSong, index: number) => ({
        id: `genius-artist-${song.id}`,
        platform: 'genius',
        title: `${song.primary_artist.name} - ${song.title}`,
        summary: this.generateSummary(song),
        url: song.url,
        score: this.calculateSongScore(song, index),
        fetchedAt: new Date().toISOString(),
        engagement: this.calculateEngagement(song),
        source: `Genius - ${song.primary_artist.name}`,
        keywords: this.extractKeywords(song.title, song.primary_artist.name)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch artist songs', error);
      return [];
    }
  }

  private generateSummary(song: GeniusSong, searchQuery?: string): string {
    const parts = [];
    
    if (searchQuery) {
      parts.push(`Search result for "${searchQuery}"`);
    }
    
    if (song.stats?.pageviews) {
      parts.push(`${song.stats.pageviews.toLocaleString()} pageviews`);
    }
    
    if (song.annotation_count > 0) {
      parts.push(`${song.annotation_count} annotations`);
    }
    
    if (song.hot) {
      parts.push('trending on Genius');
    }
    
    if (song.release_date_for_display) {
      parts.push(`released ${song.release_date_for_display}`);
    }

    return parts.length > 0 ? parts.join(', ') : `${song.title} by ${song.primary_artist.name}`;
  }

  private calculateSongScore(song: GeniusSong, position: number): number {
    let score = 80 - (position * 2); // Base score decreases with position
    
    // Boost for high engagement
    if (song.stats?.pageviews > 1000000) score += 20;
    else if (song.stats?.pageviews > 500000) score += 15;
    else if (song.stats?.pageviews > 100000) score += 10;
    
    // Boost for annotations (cultural engagement)
    if (song.annotation_count > 50) score += 15;
    else if (song.annotation_count > 20) score += 10;
    else if (song.annotation_count > 10) score += 5;
    
    // Boost for trending
    if (song.hot) score += 25;
    
    // Boost for recent releases
    if (song.release_date_for_display) {
      const releaseYear = parseInt(song.release_date_for_display);
      const currentYear = new Date().getFullYear();
      if (currentYear - releaseYear < 1) score += 15;
      else if (currentYear - releaseYear < 2) score += 10;
    }
    
    return Math.max(Math.min(score, 100), 1);
  }

  private calculateEngagement(song: GeniusSong): number {
    let engagement = 0;
    
    if (song.stats?.pageviews) {
      engagement += song.stats.pageviews;
    }
    
    if (song.annotation_count) {
      engagement += song.annotation_count * 100; // Weight annotations highly
    }
    
    return engagement;
  }

  private extractKeywords(title: string, artist?: string, query?: string): string[] {
    const keywords = [];
    
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (artist) {
      keywords.push(...artist.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (query) {
      keywords.push(...query.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    const commonWords = ['the', 'and', 'feat', 'remix', 'version', 'official'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private getFallbackSongs(): TrendingTopic[] {
    return [
      {
        id: 'genius-fallback-1',
        platform: 'genius',
        title: 'Genius API Integration Ready',
        summary: 'Configure Genius API token to fetch lyrical analysis and cultural context',
        url: 'https://genius.com/api-clients',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['genius', 'lyrics', 'api', 'culture', 'music']
      }
    ];
  }
}

export const createGeniusService = (accessToken?: string): GeniusService | null => {
  return new GeniusService(accessToken);
};