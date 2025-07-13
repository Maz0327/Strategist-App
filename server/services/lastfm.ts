import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface LastFmTrack {
  name: string;
  artist: {
    name: string;
    url: string;
  };
  url: string;
  playcount: string;
  listeners: string;
  image: Array<{
    '#text': string;
    size: string;
  }>;
  toptags?: {
    tag: Array<{
      name: string;
      count: number;
    }>;
  };
}

export class LastFmService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'http://ws.audioscrobbler.com/2.0/';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getTrendingTracks(limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('Last.fm API key not configured, returning fallback data');
      return this.getFallbackTracks();
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'chart.gettoptracks',
          api_key: this.apiKey,
          format: 'json',
          limit
        }
      });

      const tracks = response.data.tracks.track;

      return tracks.map((track: LastFmTrack, index: number) => ({
        id: `lastfm-${index}-${Date.now()}`,
        platform: 'lastfm',
        title: `${track.artist.name} - ${track.name}`,
        summary: `Trending track with ${parseInt(track.listeners).toLocaleString()} listeners and ${parseInt(track.playcount).toLocaleString()} plays`,
        url: track.url,
        score: this.calculateTrackScore(track, index),
        fetchedAt: new Date().toISOString(),
        engagement: parseInt(track.listeners) + parseInt(track.playcount),
        source: 'Last.fm Charts',
        keywords: this.extractKeywords(track.name, track.artist.name)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch Last.fm trending tracks', error);
      return this.getFallbackTracks();
    }
  }

  async getTopArtists(limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackTracks();
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'chart.gettopartists',
          api_key: this.apiKey,
          format: 'json',
          limit
        }
      });

      const artists = response.data.artists.artist;

      return artists.map((artist: any, index: number) => ({
        id: `lastfm-artist-${index}-${Date.now()}`,
        platform: 'lastfm',
        title: `${artist.name} (Artist)`,
        summary: `Trending artist with ${parseInt(artist.listeners).toLocaleString()} listeners and ${parseInt(artist.playcount).toLocaleString()} plays`,
        url: artist.url,
        score: this.calculateArtistScore(artist, index),
        fetchedAt: new Date().toISOString(),
        engagement: parseInt(artist.listeners) + parseInt(artist.playcount),
        source: 'Last.fm Artist Charts',
        keywords: this.extractKeywords(artist.name)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch Last.fm top artists', error);
      return [];
    }
  }

  async searchTracks(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackTracks();
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'track.search',
          track: query,
          api_key: this.apiKey,
          format: 'json',
          limit
        }
      });

      const tracks = response.data.results.trackmatches.track;

      return tracks.map((track: any, index: number) => ({
        id: `lastfm-search-${index}-${Date.now()}`,
        platform: 'lastfm',
        title: `${track.artist} - ${track.name}`,
        summary: `Search result for "${query}". Listeners: ${parseInt(track.listeners || '0').toLocaleString()}`,
        url: track.url,
        score: parseInt(track.listeners || '0') / 1000,
        fetchedAt: new Date().toISOString(),
        engagement: parseInt(track.listeners || '0'),
        source: 'Last.fm Search',
        keywords: this.extractKeywords(track.name, track.artist, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search Last.fm tracks', error);
      return [];
    }
  }

  async getTopTags(limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          method: 'chart.gettoptags',
          api_key: this.apiKey,
          format: 'json',
          limit
        }
      });

      const tags = response.data.tags.tag;

      return tags.map((tag: any, index: number) => ({
        id: `lastfm-tag-${index}-${Date.now()}`,
        platform: 'lastfm',
        title: `${tag.name} (Genre/Tag)`,
        summary: `Trending music tag with ${parseInt(tag.count).toLocaleString()} uses`,
        url: tag.url,
        score: Math.min(parseInt(tag.count) / 1000, 100),
        fetchedAt: new Date().toISOString(),
        engagement: parseInt(tag.count),
        source: 'Last.fm Tags',
        keywords: [tag.name.toLowerCase()]
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch Last.fm top tags', error);
      return [];
    }
  }

  private calculateTrackScore(track: LastFmTrack, position: number): number {
    const listeners = parseInt(track.listeners);
    const playcount = parseInt(track.playcount);
    
    let score = 100 - (position * 3); // Higher position = lower score
    
    // Boost for high engagement
    if (listeners > 1000000) score += 20;
    else if (listeners > 500000) score += 15;
    else if (listeners > 100000) score += 10;
    
    // Boost for play frequency (plays per listener)
    const playsPerListener = playcount / listeners;
    if (playsPerListener > 10) score += 15;
    else if (playsPerListener > 5) score += 10;
    
    return Math.max(Math.min(score, 100), 1);
  }

  private calculateArtistScore(artist: any, position: number): number {
    const listeners = parseInt(artist.listeners);
    
    let score = 100 - (position * 5);
    
    if (listeners > 5000000) score += 25;
    else if (listeners > 1000000) score += 20;
    else if (listeners > 500000) score += 15;
    
    return Math.max(Math.min(score, 100), 1);
  }

  private extractKeywords(name: string, artist?: string, query?: string): string[] {
    const keywords = [];
    
    if (name) {
      keywords.push(...name.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (artist) {
      keywords.push(...artist.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (query) {
      keywords.push(...query.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    return [...new Set(keywords)].slice(0, 5);
  }

  private getFallbackTracks(): TrendingTopic[] {
    return [
      {
        id: 'lastfm-fallback-1',
        platform: 'lastfm',
        title: 'Last.fm API Integration Ready',
        summary: 'Configure Last.fm API key to fetch music trends and cultural metadata',
        url: 'https://www.last.fm/api/account/create',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['lastfm', 'music', 'api', 'culture', 'trends']
      }
    ];
  }
}

export const createLastFmService = (apiKey?: string): LastFmService | null => {
  return new LastFmService(apiKey);
};