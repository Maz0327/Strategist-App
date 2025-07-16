import axios from 'axios';
import type { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
const BASE_URL = 'https://api.genius.com';

interface GeniusSong {
  id: number;
  title: string;
  full_title: string;
  url: string;
  primary_artist: {
    name: string;
    id: number;
  };
  stats: {
    pageviews: number;
  };
  song_art_image_url: string;
  release_date_for_display: string;
}

interface GeniusArtist {
  id: number;
  name: string;
  url: string;
  image_url: string;
  followers_count: number;
}

export class GeniusService {
  private headers = {
    'Authorization': `Bearer ${GENIUS_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };

  async getTrendingSongs(): Promise<any[]> {
    try {
      // Get trending songs by searching for popular terms
      const response = await axios.get(`${BASE_URL}/search`, {
        headers: this.headers,
        params: {
          q: 'trending',
          per_page: 10
        }
      });

      return response.data.response.hits.map((hit: any) => {
        const song = hit.result;
        return {
          id: `genius_song_${song.id}`,
          title: song.title,
          description: `${song.full_title} - Lyrics and analysis`,
          url: song.url,
          platform: 'Genius',
          category: 'Music Analysis',
          score: Math.min(Math.round(song.stats.pageviews / 1000), 100), // Scale pageviews
          engagement: song.stats.pageviews,
          publishedAt: song.release_date_for_display || new Date().toISOString(),
          metadata: {
            type: 'song',
            artist: song.primary_artist.name,
            full_title: song.full_title,
            pageviews: song.stats.pageviews,
            image: song.song_art_image_url
          }
        };
      });
    } catch (error) {
      debugLogger.error('Error fetching Genius trending songs:', error);
      return [];
    }
  }

  async getPopularSongs(): Promise<any[]> {
    try {
      // Search for popular music-related terms
      const searchTerms = ['rap', 'pop', 'rock', 'hip hop', 'viral'];
      const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      
      const response = await axios.get(`${BASE_URL}/search`, {
        headers: this.headers,
        params: {
          q: randomTerm,
          per_page: 8,
          sort: 'popularity'
        }
      });

      return response.data.response.hits.map((hit: any) => {
        const song = hit.result;
        return {
          id: `genius_popular_${song.id}`,
          title: song.title,
          description: `Popular ${randomTerm} track - ${song.primary_artist.name}`,
          url: song.url,
          platform: 'Genius',
          category: 'Popular Music',
          score: Math.min(Math.round(song.stats.pageviews / 2000), 100),
          engagement: song.stats.pageviews,
          publishedAt: song.release_date_for_display || new Date().toISOString(),
          metadata: {
            type: 'popular_song',
            artist: song.primary_artist.name,
            genre: randomTerm,
            pageviews: song.stats.pageviews,
            image: song.song_art_image_url
          }
        };
      });
    } catch (error) {
      debugLogger.error('Error fetching Genius popular songs:', error);
      return [];
    }
  }

  async searchSongs(query: string): Promise<any[]> {
    try {
      const response = await axios.get(`${BASE_URL}/search`, {
        headers: this.headers,
        params: {
          q: query,
          per_page: 5
        }
      });

      return response.data.response.hits.map((hit: any) => {
        const song = hit.result;
        return {
          id: `genius_search_${song.id}`,
          title: song.title,
          description: `${song.primary_artist.name} - Lyrics and meaning`,
          url: song.url,
          platform: 'Genius',
          category: 'Music Search',
          score: Math.min(Math.round(song.stats.pageviews / 1500), 100),
          engagement: song.stats.pageviews,
          publishedAt: song.release_date_for_display || new Date().toISOString(),
          metadata: {
            type: 'search_result',
            artist: song.primary_artist.name,
            query: query,
            pageviews: song.stats.pageviews,
            image: song.song_art_image_url
          }
        };
      });
    } catch (error) {
      debugLogger.error('Error searching Genius songs:', error);
      return [];
    }
  }
}

export const geniusService = new GeniusService();