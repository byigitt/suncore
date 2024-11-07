import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import scdl from 'soundcloud-downloader';
import { SoundcloudInfo, TrackResponse } from './types';
import {
  streamToUrl,
  validateTrackInfo,
  sanitizeString,
  checkRateLimit,
  corsHeaders,
  validateSoundcloudUrl
} from './utils';

// Main API handler
export async function OPTIONS() {
  const headersList = await headers();
  const origin = headersList.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const origin = headersList.get('origin');
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: corsHeaders(origin) }
      );
    }

    if (!process.env.SOUNDCLOUD_CLIENT_ID) {
      console.error('Soundcloud client ID not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    // Request validation
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { url } = body;

    if (!url || typeof url !== 'string' || !validateSoundcloudUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid Soundcloud URL format' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    try {
      const info = await scdl.getInfo(url) as SoundcloudInfo;
      validateTrackInfo(info);

      const stream = await scdl.download(url);
      const audioUrl = await streamToUrl(stream);

      const response: TrackResponse = {
        streamUrl: audioUrl,
        title: sanitizeString(info.title),
        duration: info.duration,
        thumbnail: info.artwork_url || null,
        artist: sanitizeString(info.user.username),
        description: sanitizeString(info.description),
        genre: sanitizeString(info.genre) || 'Unknown',
        likes: info.likes_count || 0,
        plays: info.playback_count || 0
      };

      return NextResponse.json({
        success: true,
        track: response,
      }, {
        headers: {
          ...corsHeaders(origin),
          'Cache-Control': 'private, max-age=3600',
          'Content-Security-Policy': "default-src 'self'",
        }
      });

    } catch (songError) {
      console.error('Soundcloud track error:', songError);
      const errorMessage = songError instanceof Error ? songError.message : 'Unknown error';
      return NextResponse.json(
        { error: `Could not fetch track: ${errorMessage}` },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

  } catch (error) {
    console.error('Soundcloud API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
} 