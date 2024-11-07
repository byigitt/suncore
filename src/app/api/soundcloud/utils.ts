import { Readable } from 'stream';
import { SoundcloudInfo, RateLimit } from './types';

// Constants
export const MAX_DURATION = 600; // 10 minutes in seconds
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Simple in-memory rate limiting
export const rateLimits = new Map<string, RateLimit>();

export async function streamToUrl(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  let totalSize = 0;

  for await (const chunk of stream) {
    totalSize += chunk.length;
    if (totalSize > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the 50MB limit');
    }
    chunks.push(Buffer.from(chunk));
  }
  
  const buffer = Buffer.concat(chunks);
  return `data:audio/mpeg;base64,${buffer.toString('base64')}`;
}

export function validateTrackInfo(info: SoundcloudInfo): void {
  if (!info.title?.trim()) {
    throw new Error('Invalid track: missing title');
  }
  
  if (!info.duration || info.duration > MAX_DURATION * 1000) {
    throw new Error('Track duration exceeds 10 minutes limit');
  }

  if (!info.user?.username?.trim()) {
    throw new Error('Invalid track: missing artist information');
  }
}

export function sanitizeString(str: string | undefined | null): string {
  return (str || '').replace(/[<>]/g, '').trim();
}

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const current = rateLimits.get(ip) || { count: 0, timestamp: now };
  
  if (now - current.timestamp > windowMs) {
    // Reset if window has passed
    current.count = 1;
    current.timestamp = now;
  } else if (current.count >= maxRequests) {
    return false;
  } else {
    current.count++;
  }
  
  rateLimits.set(ip, current);
  return true;
}

export function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  
  // In development, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };
  }

  // In production, check against allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    };
  }

  return {};
}

export function validateSoundcloudUrl(url: string): boolean {
  const soundcloudUrlPattern = /^https?:\/\/(www\.)?soundcloud\.com\/[\w-]+\/[\w-]+(\?.*)?$/;
  return soundcloudUrlPattern.test(url);
} 