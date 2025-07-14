import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string; id: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  images: Array<{ url: string; height: number; width: number }>;
  tracks: {
    total: number;
  };
}

export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData: SpotifyToken = response.data;
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  async getFeaturedPlaylists(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get('https://api.spotify.com/v1/browse/featured-playlists', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 10
        }
      });

      return response.data.playlists.items.map((playlist: SpotifyPlaylist) => ({
        id: `spotify_playlist_${playlist.id}`,
        title: playlist.name,
        description: playlist.description || `${playlist.tracks.total} tracks`,
        url: playlist.external_urls.spotify,
        platform: 'Spotify',
        category: 'Music Playlists',
        score: 85, // Featured playlists are high-quality
        engagement: playlist.tracks.total,
        publishedAt: new Date().toISOString(),
        metadata: {
          type: 'playlist',
          tracks_total: playlist.tracks.total,
          image: playlist.images[0]?.url || null
        }
      }));
    } catch (error) {
      console.error('Error fetching Spotify featured playlists:', error);
      return [];
    }
  }

  async getNewReleases(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 10
        }
      });

      return response.data.albums.items.map((album: any) => ({
        id: `spotify_album_${album.id}`,
        title: album.name,
        description: `New release by ${album.artists.map((a: any) => a.name).join(', ')}`,
        url: album.external_urls.spotify,
        platform: 'Spotify',
        category: 'New Music',
        score: 80, // New releases are generally relevant
        engagement: album.popularity || 75,
        publishedAt: album.release_date,
        metadata: {
          type: 'album',
          artists: album.artists.map((a: any) => a.name),
          image: album.images[0]?.url || null,
          total_tracks: album.total_tracks
        }
      }));
    } catch (error) {
      console.error('Error fetching Spotify new releases:', error);
      return [];
    }
  }

  async getTopTracks(country: string = 'US'): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`https://api.spotify.com/v1/playlists/37i9dQZEVXbLRQDuF5jeBp/tracks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 10
        }
      });

      return response.data.items.map((item: any) => {
        const track = item.track;
        return {
          id: `spotify_track_${track.id}`,
          title: track.name,
          description: `Top track by ${track.artists.map((a: any) => a.name).join(', ')}`,
          url: track.external_urls.spotify,
          platform: 'Spotify',
          category: 'Top Tracks',
          score: Math.round(track.popularity),
          engagement: track.popularity,
          publishedAt: new Date().toISOString(),
          metadata: {
            type: 'track',
            artists: track.artists.map((a: any) => a.name),
            album: track.album.name,
            image: track.album.images[0]?.url || null,
            popularity: track.popularity
          }
        };
      });
    } catch (error) {
      console.error('Error fetching Spotify top tracks:', error);
      return [];
    }
  }
}

export const spotifyService = new SpotifyService();