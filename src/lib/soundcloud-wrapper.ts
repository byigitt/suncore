import * as scdl from 'soundcloud-downloader';
import type { Readable } from 'node:stream';
import type { AxiosError } from 'axios';

interface SoundCloudTrackInfo {
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

// Add a safe error handler wrapper
function safeHandleRequestErrs(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }
    if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
        return new Error((error as AxiosError).message || 'An unknown error occurred');
    }
    return new Error('An unknown error occurred');
}

export async function safeDownload(
    url: string | undefined, 
    clientID: string, 
    axiosInstance?: unknown
): Promise<Readable> {
    if (!url) {
        throw new Error('URL is required for download');
    }
    try {
        // @ts-expect-error - External package type issues
        return await scdl.download(url, clientID, axiosInstance);
    } catch (err) {
        throw safeHandleRequestErrs(err);
    }
}

export async function safeGetInfo(
    url: string,
    clientID: string,
    axiosInstance?: unknown
): Promise<SoundCloudTrackInfo> {
    try {
        // @ts-expect-error - External package type issues
        return await scdl.getInfo(url, clientID, axiosInstance);
    } catch (err) {
        throw safeHandleRequestErrs(err);
    }
}

export async function safeGetSetInfo(
    url: string,
    clientID: string,
    axiosInstance?: unknown
): Promise<SoundCloudTrackInfo[]> {
    try {
        // @ts-expect-error - External package type issues
        return await scdl.getSetInfo(url, clientID, axiosInstance);
    } catch (err) {
        throw safeHandleRequestErrs(err);
    }
}

export async function safeDownloadPlaylist(
    url: string,
    clientID: string,
    axiosInstance?: unknown
): Promise<Readable[]> {
    try {
        // @ts-expect-error - External package type issues
        return await scdl.downloadPlaylist(url, clientID, axiosInstance);
    } catch (err) {
        throw safeHandleRequestErrs(err);
    }
}