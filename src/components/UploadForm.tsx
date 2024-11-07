import { useToast } from "@/hooks/use-toast"
import { useState } from 'react';
import { SoundcloudInput } from './SoundcloudInput';
import { Label } from './ui/label';
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";

interface TrackData {
  streamUrl: string;
  title: string;
  duration: number;
  thumbnail: string;
  artist: string;
  description: string;
  genre: string;
  likes: number;
  plays: number;
}

interface UploadFormProps {
  onTrackSelect: (audioSrc: string, audioName: string) => void;
}

export function UploadForm({ onTrackSelect }: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [showInput, setShowInput] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSoundcloudTrack = async (trackUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching Soundcloud track:', trackUrl);
      const response = await fetch('/api/soundcloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trackUrl }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        console.error('API Error:', data.error);
        setError(data.error || 'Failed to fetch Soundcloud track');
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch Soundcloud track',
          variant: 'destructive',
        });
        return;
      }

      const { track } = data;
      console.log('Track data received:', track);

      if (typeof track.streamUrl !== 'string') {
        throw new Error('Invalid stream URL format');
      }

      setTrackData(track);
      setShowInput(false);
      
      toast({
        title: "Success",
        description: `Track found: ${track.title}`,
      });
      
    } catch (error) {
      console.error('Final error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Soundcloud track';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setShowInput(true);
      setTrackData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTrackData(null);
    setShowInput(true);
    setError(null);
    onTrackSelect('', '');
  };

  const handleUseTrack = () => {
    if (trackData && typeof trackData.streamUrl === 'string') {
      onTrackSelect(trackData.streamUrl, trackData.title);
      setShowInput(false);
      toast({
        title: "Success",
        description: `Using track: ${trackData.title}`,
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div className="space-y-2 w-full">
          {showInput && (
            <>
              <Label>Add from Soundcloud</Label>
              <SoundcloudInput 
                onSoundcloudTrack={handleSoundcloudTrack} 
                disabled={isLoading} 
              />
              {error && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <p className="text-sm text-red-500">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </>
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">Loading track data...</span>
            </div>
          )}
          
          {!isLoading && trackData && (
            <div className="mt-4 p-4 border rounded-lg w-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">{trackData.title}</h3>
                  <p className="text-sm text-gray-500">by {trackData.artist}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                  >
                    Try Different Track
                  </Button>
                  <Button 
                    variant="default"
                    size="sm" 
                    onClick={handleUseTrack}
                  >
                    Use This Track
                  </Button>
                </div>
              </div>
              {trackData.thumbnail && (
                <Image 
                  src={trackData.thumbnail} 
                  alt={trackData.title}
                  width={400}
                  height={200}
                  className="w-full h-32 object-cover mt-2 rounded"
                />
              )}
              <div className="mt-2 text-sm text-gray-600">
                <p>Genre: {trackData.genre}</p>
                <p>Likes: {trackData.likes}</p>
                <p>Plays: {trackData.plays}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 