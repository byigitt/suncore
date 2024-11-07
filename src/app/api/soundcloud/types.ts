export interface SoundcloudInfo {
  title: string;
  duration: number;
  artwork_url?: string;
  user: {
    username: string;
  };
  description?: string;
  genre?: string;
  likes_count?: number;
  playback_count?: number;
}

export interface TrackResponse {
  streamUrl: string;
  title: string;
  duration: number;
  thumbnail: string | null;
  artist: string;
  description: string;
  genre: string;
  likes: number;
  plays: number;
}

export interface RateLimit {
  count: number;
  timestamp: number;
} 