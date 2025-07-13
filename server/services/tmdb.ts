import axios from 'axios';
import { TrendingTopic } from './trends';
import { debugLogger } from './debug-logger';

export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
}

export interface TMDbTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
}

export class TMDbService {
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      debugLogger.warn('TMDb API key not configured, returning fallback data');
      return this.getFallbackMovies();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/trending/movie/${timeWindow}`, {
        params: {
          api_key: this.apiKey,
          page: 1
        }
      });

      const movies = response.data.results.slice(0, limit);

      return movies.map((movie: TMDbMovie, index: number) => ({
        id: `tmdb-movie-${movie.id}`,
        platform: 'tmdb',
        title: movie.title,
        summary: this.truncateText(movie.overview, 200) || `Trending movie with ${movie.vote_average}/10 rating`,
        url: `https://www.themoviedb.org/movie/${movie.id}`,
        score: this.calculateMovieScore(movie, index),
        fetchedAt: new Date().toISOString(),
        engagement: Math.floor(movie.popularity * movie.vote_count),
        source: `TMDb - Trending Movies (${timeWindow})`,
        keywords: this.extractKeywords(movie.title, movie.overview)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch TMDb trending movies', error);
      return this.getFallbackMovies();
    }
  }

  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'week', limit: number = 20): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return this.getFallbackTVShows();
    }

    try {
      const response = await axios.get(`${this.baseUrl}/trending/tv/${timeWindow}`, {
        params: {
          api_key: this.apiKey,
          page: 1
        }
      });

      const shows = response.data.results.slice(0, limit);

      return shows.map((show: TMDbTVShow, index: number) => ({
        id: `tmdb-tv-${show.id}`,
        platform: 'tmdb',
        title: show.name,
        summary: this.truncateText(show.overview, 200) || `Trending TV show with ${show.vote_average}/10 rating`,
        url: `https://www.themoviedb.org/tv/${show.id}`,
        score: this.calculateTVScore(show, index),
        fetchedAt: new Date().toISOString(),
        engagement: Math.floor(show.popularity * show.vote_count),
        source: `TMDb - Trending TV (${timeWindow})`,
        keywords: this.extractKeywords(show.name, show.overview)
      }));

    } catch (error) {
      debugLogger.error('Failed to fetch TMDb trending TV shows', error);
      return this.getFallbackTVShows();
    }
  }

  async searchMovies(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page: 1
        }
      });

      const movies = response.data.results.slice(0, limit);

      return movies.map((movie: TMDbMovie) => ({
        id: `tmdb-search-movie-${movie.id}`,
        platform: 'tmdb',
        title: movie.title,
        summary: this.truncateText(movie.overview, 200) || `Search result for "${query}"`,
        url: `https://www.themoviedb.org/movie/${movie.id}`,
        score: movie.popularity,
        fetchedAt: new Date().toISOString(),
        engagement: Math.floor(movie.popularity * movie.vote_count),
        source: 'TMDb Movie Search',
        keywords: this.extractKeywords(movie.title, movie.overview, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search TMDb movies', error);
      return [];
    }
  }

  async searchTVShows(query: string, limit: number = 10): Promise<TrendingTopic[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search/tv`, {
        params: {
          api_key: this.apiKey,
          query,
          page: 1
        }
      });

      const shows = response.data.results.slice(0, limit);

      return shows.map((show: TMDbTVShow) => ({
        id: `tmdb-search-tv-${show.id}`,
        platform: 'tmdb',
        title: show.name,
        summary: this.truncateText(show.overview, 200) || `Search result for "${query}"`,
        url: `https://www.themoviedb.org/tv/${show.id}`,
        score: show.popularity,
        fetchedAt: new Date().toISOString(),
        engagement: Math.floor(show.popularity * show.vote_count),
        source: 'TMDb TV Search',
        keywords: this.extractKeywords(show.name, show.overview, query)
      }));

    } catch (error) {
      debugLogger.error('Failed to search TMDb TV shows', error);
      return [];
    }
  }

  async getCombinedTrending(limit: number = 20): Promise<TrendingTopic[]> {
    try {
      const [movies, tvShows] = await Promise.all([
        this.getTrendingMovies('week', 10),
        this.getTrendingTVShows('week', 10)
      ]);

      return [...movies, ...tvShows]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);

    } catch (error) {
      debugLogger.error('Failed to fetch combined trending content', error);
      return [...this.getFallbackMovies(), ...this.getFallbackTVShows()];
    }
  }

  private calculateMovieScore(movie: TMDbMovie, position: number): number {
    let score = 90 - (position * 2);
    
    // Boost for high ratings
    if (movie.vote_average > 8) score += 20;
    else if (movie.vote_average > 7) score += 15;
    else if (movie.vote_average > 6) score += 10;
    
    // Boost for high vote count (popular)
    if (movie.vote_count > 5000) score += 15;
    else if (movie.vote_count > 1000) score += 10;
    else if (movie.vote_count > 500) score += 5;
    
    // Boost for recent releases
    if (movie.release_date) {
      const releaseDate = new Date(movie.release_date);
      const daysSinceRelease = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRelease < 30) score += 15;
      else if (daysSinceRelease < 90) score += 10;
    }
    
    // Boost for very popular content
    if (movie.popularity > 1000) score += 10;
    
    return Math.max(Math.min(score, 100), 1);
  }

  private calculateTVScore(show: TMDbTVShow, position: number): number {
    let score = 90 - (position * 2);
    
    // Similar scoring to movies
    if (show.vote_average > 8) score += 20;
    else if (show.vote_average > 7) score += 15;
    else if (show.vote_average > 6) score += 10;
    
    if (show.vote_count > 2000) score += 15;
    else if (show.vote_count > 500) score += 10;
    else if (show.vote_count > 200) score += 5;
    
    if (show.first_air_date) {
      const airDate = new Date(show.first_air_date);
      const daysSinceAir = (Date.now() - airDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAir < 30) score += 15;
      else if (daysSinceAir < 90) score += 10;
    }
    
    if (show.popularity > 500) score += 10;
    
    return Math.max(Math.min(score, 100), 1);
  }

  private extractKeywords(title: string, overview?: string, query?: string): string[] {
    const keywords = [];
    
    if (title) {
      keywords.push(...title.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }
    
    if (overview) {
      const overviewWords = overview.toLowerCase()
        .split(/[\s\-\(\)\.]+/)
        .filter(w => w.length > 3)
        .slice(0, 10); // Limit overview words
      keywords.push(...overviewWords);
    }
    
    if (query) {
      keywords.push(...query.toLowerCase().split(/[\s\-\(\)]+/).filter(w => w.length > 2));
    }

    const commonWords = ['the', 'and', 'with', 'for', 'from', 'movie', 'film', 'show', 'series', 'when', 'after', 'before', 'their', 'that', 'this', 'they', 'have', 'been', 'will', 'are', 'his', 'her'];
    return [...new Set(keywords)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 5);
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private getFallbackMovies(): TrendingTopic[] {
    return [
      {
        id: 'tmdb-movie-fallback-1',
        platform: 'tmdb',
        title: 'TMDb Movies API Integration Ready',
        summary: 'Configure TMDb API key to fetch trending movies and entertainment signals',
        url: 'https://www.themoviedb.org/settings/api',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['tmdb', 'movies', 'api', 'entertainment', 'trends']
      }
    ];
  }

  private getFallbackTVShows(): TrendingTopic[] {
    return [
      {
        id: 'tmdb-tv-fallback-1',
        platform: 'tmdb',
        title: 'TMDb TV Shows API Integration Ready',
        summary: 'Configure TMDb API key to fetch trending TV shows and entertainment signals',
        url: 'https://www.themoviedb.org/settings/api',
        score: 1,
        fetchedAt: new Date().toISOString(),
        engagement: 0,
        source: 'Fallback Data',
        keywords: ['tmdb', 'tv', 'shows', 'api', 'entertainment']
      }
    ];
  }
}

export const createTMDbService = (apiKey?: string): TMDbService | null => {
  return new TMDbService(apiKey);
};