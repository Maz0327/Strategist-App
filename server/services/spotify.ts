import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  popularity: number;
  preview_url?: string;
  external_urls: {
    spotify: string;
  };
  album: {
    name: string;
    release_date: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  audio_features?: {
    danceability: number;
    energy: number;
    valence: number;
    tempo: number;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
  }>;
}

export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async authenticate(): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify client credentials not configured');
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    } catch (error) {
      debugLogger.error('Failed to authenticate with Spotify', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  async getTrendingTracks(market: string = 'US', limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.clientId || !this.clientSecret) {
      debugLogger.warn('Spotify credentials not configured, returning fallback data');
      return this.getFallbackTracks();
    }

    try {
      await this.ensureAuthenticated();

      // Get featured playlists to find trending content
      const playlistsResponse = await axios.get('https://api.spotify.com/v1/browse/featured-playlists', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: { country: market, limit: 5 }
      });

      const trendingTopics: TrendingTopic[] = [];

      // Get tracks from trending playlists
      for (const playlist of playlistsResponse.data.playlists.items.slice(0, 3)) {
        const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` },
          params: { limit: 10, market }
        });

        const tracks = tracksResponse.data.items
          .filter((item: any) => item.track && item.track.name)
          .slice(0, 3)
          .map((item: any, index: number) => {
            const track = item.track;
            return {
              id: `spotify-${track.id}`,
              platform: 'spotify',
              title: `${track.artists[0]?.name} - ${track.name}`,
              summary: `Trending track from ${playlist.name} playlist. Popularity: ${track.popularity}/100`,
              url: track.external_urls.spotify,
              score: this.calculateTrackScore(track, playlist.name),
              fetchedAt: new Date().toISOString(),
              engagement: track.popularity * 100,
              source: `Spotify - ${playlist.name}`,
              keywords: this.extractKeywords(track.name, track.artists[0]?.name)
            };
          });

        trendingTopics.push(...tracks);
      }

      return trendingTopics.slice(0, limit);

    } catch (error) {
      debugLogger.error('Failed to fetch Spotify trending tracks', error);
      return this.getFallbackTracks();
    }
  }

  async searchTracks(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.clientId || !this.clientSecret) {
      return this.getFallbackTracks();
    }

    try {
      await this.ensureAuthenticated();

      const response = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: {
          q: query,
          type: 'track',
          limit,
          market: 'US'
        }
      });

      return response.data.tracks.items.map((track: SpotifyTrack, index: number) => ({
        id: `spotify-search-${track.id}`,
        platform: 'spotify',
        title: `${track.artists[0]?.name} - ${track.name}`,
        summary: `Search result for "${query}". Popularity: ${track.popularity}/100`,
        url: track.external_urls.spotify,
        score: track.popularity,
        fetchedAt: new Date().toISOString(),
        engagement: track.popularity * 100,
        source: 'Spotify Search',
        keywords: this.extractKeywords(track.name, track.artists[0]?.name, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search Spotify tracks', error);
      return [];
    }
  }

  private calculateTrackScore(track: any, playlistName: string): number {
    let score = track.popularity || 50;
    
    // Boost for certain playlist types
    if (playlistName.toLowerCase().includes('viral') || 
        playlistName.toLowerCase().includes('trending') ||
        playlistName.toLowerCase().includes('hot')) {
      score += 20;
    }

    // Recent releases get boost
    const releaseDate = new Date(track.album.release_date);
    const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease < 30) score += 15;
    else if (daysSinceRelease < 90) score += 10;

    return Math.min(score, 100);
  }

  private extractKeywords(trackName: string, artistName?: string, searchQuery?: string): string[] {
    const keywords = [];
    
    if (trackName) {
      keywords.push(...trackName.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (artistName) {
      keywords.push(...artistName.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (searchQuery) {
      keywords.push(...searchQuery.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    return [...new Set(keywords)].slice(0, 5);
  }

  private getFallbackTracks(): TrendingTopic[] {
    return [
      {
        id: 'spotify-fallback-1',
        platform: 'spotify',
        title: 'Spotify Web API Integration Ready',
        summary: 'Configure Spotify API credentials to fetch trending music and cultural signals',
        url: 'https://developer.spotify.com/dashboard',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['spotify', 'music', 'api', 'setup', 'culture']
      }
    ];
  }
}

export const createSpotifyService = (clientId?: string, clientSecret?: string): SpotifyService | null => {
  return new SpotifyService(clientId, clientSecret);
};