'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Loader2 } from 'lucide-react'
import * as Tone from 'tone'
import lamejs from '@breezystack/lamejs'
import { saveAs } from 'file-saver'
import { motion } from 'framer-motion'

interface CustomAudioPlayerProps {
  src: string | null
  audioName?: string
  volume: number
  speed: number
  reverbDecay: number
  bassBoost: number
  onDownload: (format: 'mp3' | 'wav', blob: Blob) => void
  resetAudio: () => void
}

export function CustomAudioPlayer({ src, audioName = "Unknown Audio", volume, speed, reverbDecay, bassBoost, onDownload, resetAudio }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const playerRef = useRef<Tone.Player | null>(null)
  const reverbRef = useRef<Tone.Reverb | null>(null)
  const dryWetRef = useRef<Tone.CrossFade | null>(null)
  const bassBoostRef = useRef<Tone.EQ3 | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const [isProcessingMp3, setIsProcessingMp3] = useState(false)
  const [isProcessingWav, setIsProcessingWav] = useState(false)

  useEffect(() => {
    if (src) {
      const player = new Tone.Player(src)
      const reverb = new Tone.Reverb()
      const dryWet = new Tone.CrossFade(0)
      const bassBoost = new Tone.EQ3()

      player.chain(bassBoost, dryWet.a)
      player.connect(reverb)
      reverb.connect(dryWet.b)
      dryWet.toDestination()
      
      playerRef.current = player
      reverbRef.current = reverb
      dryWetRef.current = dryWet
      bassBoostRef.current = bassBoost

      player.load(src).then(() => {
        setDuration(player.buffer.duration)
      })

      return () => {
        player.dispose()
        reverb.dispose()
        dryWet.dispose()
        bassBoost.dispose()
      }
    }
  }, [src])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume.value = Tone.gainToDb(volume / 100)
    }
  }, [volume])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.playbackRate = speed
    }
  }, [speed])

  useEffect(() => {
    if (reverbRef.current && dryWetRef.current) {
      reverbRef.current.decay = reverbDecay
      const wetness = Math.min(reverbDecay / 10, 1)
      dryWetRef.current.fade.value = wetness
    }
  }, [reverbDecay])

  useEffect(() => {
    if (bassBoostRef.current) {
      bassBoostRef.current.low.value = bassBoost
    }
  }, [bassBoost])

  useEffect(() => {
    let animationFrame: number

    const updateTime = () => {
      if (playerRef.current && isPlaying && startTimeRef.current !== null) {
        const elapsed = (Tone.now() - startTimeRef.current) * speed
        setCurrentTime(Math.min(elapsed, duration))
        animationFrame = requestAnimationFrame(updateTime)
      }
    }

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateTime)
    }

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [isPlaying, duration, speed])

  const togglePlayPause = async () => {
    if (!playerRef.current) return

    await Tone.start()
    if (isPlaying) {
      playerRef.current.stop()
      startTimeRef.current = null
    } else {
      startTimeRef.current = Tone.now() - (currentTime / speed)
      playerRef.current.start(0, currentTime)
    }
    setIsPlaying(!isPlaying)
  }

  const handleSliderChange = (value: number[]) => {
    if (!playerRef.current) return

    const [newTime] = value
    setCurrentTime(newTime)
    
    if (isPlaying) {
      playerRef.current.stop()
      startTimeRef.current = Tone.now() - (newTime / speed)
      playerRef.current.start(0, newTime)
    } else {
      playerRef.current.seek(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!src) {
    return <div>No audio file selected</div>
  }

  function createImpulseResponse(
    context: AudioContext | OfflineAudioContext,
    decay: number,
    duration = 2,
    reverse = false
  ): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
  
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const n = reverse ? length - i : i;
        channelData[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
      }
    }
  
    return impulse;
  }  

  async function getProcessedAudioBuffer(reverbDecay: number): Promise<AudioBuffer> {
    if (!playerRef.current || !playerRef.current.buffer) {
      throw new Error('Audio buffer not loaded');
    }
  
    const originalBuffer = playerRef.current.buffer;
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const newLength = Math.floor(originalBuffer.length / speed);
  
    const offlineContext = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      newLength,
      originalBuffer.sampleRate
    );
  
    const source = offlineContext.createBufferSource();
    source.buffer = originalBuffer.get() as unknown as AudioBuffer;
  
    // Create the reverb (ConvolverNode) with impulse response
    const convolver = offlineContext.createConvolver();
    convolver.buffer = createImpulseResponse(offlineContext, reverbDecay);
  
    // Create wet and dry gain nodes for mix control
    const dryGain = offlineContext.createGain();
    const wetGain = offlineContext.createGain();
    dryGain.gain.value = 0.7; // 70% original (dry) signal
    wetGain.gain.value = 0.3; // 30% reverb (wet) signal
  
    const gainNode = offlineContext.createGain();
    const fadeDuration = 0.1; // 100ms fade-in
  
    // Smooth gain ramp to avoid sudden bursts
    gainNode.gain.setValueAtTime(0.001, 0);
    gainNode.gain.exponentialRampToValueAtTime(volume / 100, fadeDuration);
    gainNode.gain.setValueAtTime(volume / 100, newLength / originalBuffer.sampleRate - fadeDuration);
    gainNode.gain.exponentialRampToValueAtTime(0.001, newLength / originalBuffer.sampleRate);
  
    // Connect nodes: source -> [dry/wet] -> gain node -> destination
    source.connect(dryGain);
    source.connect(convolver);
    convolver.connect(wetGain);
  
    // Mix wet and dry signals
    dryGain.connect(gainNode);
    wetGain.connect(gainNode);
  
    gainNode.connect(offlineContext.destination);
  
    source.playbackRate.value = speed;
    source.start();
  
    return offlineContext.startRendering();
  }  
  
  // Helper to merge two audio buffers (silence + original)
  function mergeBuffers(
    buffer1: AudioBuffer,
    buffer2: AudioBuffer,
    context: AudioContext
  ): AudioBuffer {
    const numberOfChannels = buffer1.numberOfChannels;
    const newLength = buffer1.length + buffer2.length;
    const mergedBuffer = context.createBuffer(numberOfChannels, newLength, buffer1.sampleRate);
  
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = mergedBuffer.getChannelData(channel);
      channelData.set(buffer1.getChannelData(channel));
      channelData.set(buffer2.getChannelData(channel), buffer1.length);
    }
  
    return mergedBuffer;
  }
  
  
  const handleDownload = async (format: 'mp3' | 'wav') => {
    if (format === 'mp3') {
      setIsProcessingMp3(true)
    } else {
      setIsProcessingWav(true)
    }

    try {
      const processedBuffer = await getProcessedAudioBuffer(reverbDecay);
      
      let blob: Blob
      if (format === 'wav') {
        blob = await audioBufferToWav(processedBuffer)
      } else {
        blob = await audioBufferToMp3(processedBuffer)
      }

      const fileName = `${audioName.split('.')[0]}_processed.${format}`
      saveAs(blob, fileName)
    } catch (error) {
      console.error('Error processing audio for download:', error)
    } finally {
      if (format === 'mp3') {
        setIsProcessingMp3(false)
      } else {
        setIsProcessingWav(false)
      }
    }
  }

  return (
    <motion.div 
      className="flex flex-col gap-2"
      initial={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-lg font-semibold mb-2">{audioName}</div>
      <div className="flex items-center gap-4">
        <Button onClick={togglePlayPause} variant="outline" size="icon">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-grow">
          <Slider
            min={0}
            max={duration}
            step={0.1}
            value={[currentTime]}
            onValueChange={handleSliderChange}
            className="mb-1"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <Button 
          onClick={() => handleDownload('mp3')} 
          disabled={isProcessingMp3 || isProcessingWav}
        >
          {isProcessingMp3 ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Download MP3'
          )}
        </Button>
        <Button 
          onClick={() => handleDownload('wav')} 
          disabled={isProcessingMp3 || isProcessingWav}
        >
          {isProcessingWav ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Download WAV'
          )}
        </Button>
        <Button 
          onClick={resetAudio} 
          disabled={isProcessingMp3 || isProcessingWav}
        >
          Convert Another Song
        </Button>
      </div>
    </motion.div>
  )
}

function createImpulseResponse(
  context: AudioContext | OfflineAudioContext,
  decay: number,
  duration = 2,  // Shorter duration for subtle reverb
  reverse = false
): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const n = reverse ? length - i : i;
      // Reduce randomness for subtle reverb
      channelData[i] = (Math.random() * 2 - 1) * (1 - n / length) ** decay;
    }
  }

  return impulse;
}


async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const wavFile = await import('wavefile').then(m => new m.WaveFile())
  
  const interleavedSamples = new Float32Array(audioBuffer.length * audioBuffer.numberOfChannels)
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel)
    for (let i = 0; i < audioBuffer.length; i++) {
      interleavedSamples[i * audioBuffer.numberOfChannels + channel] = channelData[i]
    }
  }
  
  wavFile.fromScratch(audioBuffer.numberOfChannels, audioBuffer.sampleRate, '32f', interleavedSamples)
  return new Blob([wavFile.toBuffer()], { type: 'audio/wav' })
}

function normalizeWithBlocks(
  samples: Float32Array,
  noiseThreshold = 0.01,
  noiseFloor = 0.001,
  blockSize = 1024, // Process audio in small blocks
): Int16Array {
  const normalizedSamples = new Int16Array(samples.length);

  for (let i = 0; i < samples.length; i += blockSize) {
    const block = samples.subarray(i, i + blockSize);

    // Find the max value in this block (local peak normalization)
    let maxSample = Math.max(...block.map(Math.abs));
    if (maxSample < noiseThreshold) maxSample = 0; // Ignore noise-like blocks

    const scale = maxSample > 0 ? 32767 / maxSample : 1;

    // Normalize this block and apply a noise gate
    for (let j = 0; j < block.length; j++) {
      let sample = block[j];
      if (Math.abs(sample) < noiseFloor) sample = 0; // Noise gate

      sample *= scale;
      normalizedSamples[i + j] = Math.round(Math.max(-32767, Math.min(32767, sample)));
    }
  }

  return normalizedSamples;
}

async function audioBufferToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  const mp3Data: Int8Array[] = [];

  const left = audioBuffer.getChannelData(0);
  const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

  const sampleBlockSize = 1152;

  for (let i = 0; i < left.length; i += sampleBlockSize) {
    const leftChunk = left.subarray(i, i + sampleBlockSize);
    const rightChunk = right.subarray(i, i + sampleBlockSize);

    // Convert Float32Array to Int16Array
    const leftChunkInt16 = new Int16Array(leftChunk.length);
    const rightChunkInt16 = new Int16Array(rightChunk.length);

    for (let j = 0; j < leftChunk.length; j++) {
      leftChunkInt16[j] = Math.max(-32768, Math.min(32767, Math.round(leftChunk[j] * 32767)));
      rightChunkInt16[j] = Math.max(-32768, Math.min(32767, Math.round(rightChunk[j] * 32767)));
    }

    const mp3buf = mp3encoder.encodeBuffer(leftChunkInt16, rightChunkInt16);
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }

  const end = mp3encoder.flush();
  if (end.length > 0) {
    mp3Data.push(new Int8Array(end));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}