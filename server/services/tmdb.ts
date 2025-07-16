import axios from 'axios';
import { debugLogger } from './debug-logger';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  popularity: number;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
}

interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  popularity: number;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
}

export class TMDBService {
  private headers = {
    'Authorization': `Bearer ${TMDB_READ_TOKEN}`,
    'Content-Type': 'application/json;charset=utf-8'
  };

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<any[]> {
    try {
      const response = await axios.get(`${BASE_URL}/trending/movie/${timeWindow}`, {
        headers: this.headers,
        params: {
          api_key: TMDB_API_KEY
        }
      });

      return response.data.results.slice(0, 10).map((movie: TMDBMovie) => ({
        id: `tmdb_movie_${movie.id}`,
        title: movie.title,
        description: movie.overview,
        url: `https://www.themoviedb.org/movie/${movie.id}`,
        platform: 'TMDB',
        category: 'Movies',
        score: Math.round(movie.vote_average * 10), // Convert to 0-100 scale
        engagement: Math.round(movie.popularity),
        publishedAt: movie.release_date,
        metadata: {
          type: 'movie',
          rating: movie.vote_average,
          popularity: movie.popularity,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
          genres: movie.genre_ids
        }
      }));
    } catch (error) {
      debugLogger.error('Error fetching TMDB trending movies:', error);
      return [];
    }
  }

  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'day'): Promise<any[]> {
    try {
      const response = await axios.get(`${BASE_URL}/trending/tv/${timeWindow}`, {
        headers: this.headers,
        params: {
          api_key: TMDB_API_KEY
        }
      });

      return response.data.results.slice(0, 10).map((show: TMDBTVShow) => ({
        id: `tmdb_tv_${show.id}`,
        title: show.name,
        description: show.overview,
        url: `https://www.themoviedb.org/tv/${show.id}`,
        platform: 'TMDB',
        category: 'TV Shows',
        score: Math.round(show.vote_average * 10), // Convert to 0-100 scale
        engagement: Math.round(show.popularity),
        publishedAt: show.first_air_date,
        metadata: {
          type: 'tv_show',
          rating: show.vote_average,
          popularity: show.popularity,
          poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
          backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}` : null,
          genres: show.genre_ids
        }
      }));
    } catch (error) {
      debugLogger.error('Error fetching TMDB trending TV shows:', error);
      return [];
    }
  }

  async getPopularMovies(): Promise<any[]> {
    try {
      const response = await axios.get(`${BASE_URL}/movie/popular`, {
        headers: this.headers,
        params: {
          api_key: TMDB_API_KEY
        }
      });

      return response.data.results.slice(0, 5).map((movie: TMDBMovie) => ({
        id: `tmdb_popular_movie_${movie.id}`,
        title: movie.title,
        description: movie.overview,
        url: `https://www.themoviedb.org/movie/${movie.id}`,
        platform: 'TMDB',
        category: 'Popular Movies',
        score: Math.round(movie.vote_average * 10),
        engagement: Math.round(movie.popularity),
        publishedAt: movie.release_date,
        metadata: {
          type: 'popular_movie',
          rating: movie.vote_average,
          popularity: movie.popularity,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
        }
      }));
    } catch (error) {
      console.error('Error fetching TMDB popular movies:', error);
      return [];
    }
  }
}

export const tmdbService = new TMDBService();