import type React from 'react';
import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Loader2 } from "lucide-react";

interface SoundcloudInputProps {
  onSoundcloudTrack: (trackUrl: string) => void;
  disabled?: boolean;
}

export function SoundcloudInput({ onSoundcloudTrack, disabled }: SoundcloudInputProps) {
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname.includes('soundcloud.com')) {
        setUrlError('Please enter a valid Soundcloud URL');
        return false;
      }
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (soundcloudUrl.trim() && validateUrl(soundcloudUrl)) {
      onSoundcloudTrack(soundcloudUrl);
      setSoundcloudUrl('');
      setUrlError('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setSoundcloudUrl(newUrl);
    if (newUrl.trim()) {
      validateUrl(newUrl);
    } else {
      setUrlError('');
    }
  };

  return (
    <div className="space-y-2 w-full">
      <form onSubmit={handleSubmit} className="flex gap-2 w-full">
        <Input
          type="url"
          placeholder="Paste Soundcloud URL here..."
          value={soundcloudUrl}
          onChange={handleUrlChange}
          className={`flex-1 ${urlError ? 'border-red-500' : ''}`}
          disabled={disabled}
        />
        <Button 
          type="submit" 
          disabled={!soundcloudUrl.trim() || !!urlError || disabled}
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Add Track'
          )}
        </Button>
      </form>
      {urlError && (
        <p className="text-sm text-red-500">{urlError}</p>
      )}
    </div>
  );
} 