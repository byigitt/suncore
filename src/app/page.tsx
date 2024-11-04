'use client'

import { useState, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomAudioPlayer } from "@/components/CustomAudioPlayer"
import { Upload, Music } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMediaQuery } from 'react-responsive'

export default function Home() {
  const [volume, setVolume] = useState(100)
  const [speed, setSpeed] = useState(1)
  const [reverbDecay, setReverbDecay] = useState(0.01)
  const [bassBoost, setBassBoost] = useState(0)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [audioName, setAudioName] = useState<string>('')
  const [isExiting, setIsExiting] = useState(false)
  const isMobile = useMediaQuery({ maxWidth: 767 })
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile) {
      setAudioSrc(URL.createObjectURL(uploadedFile))
      setAudioName(uploadedFile.name)
    } else {
      setAudioSrc(null)
      setAudioName('')
    }
  }

  const resetAudio = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setAudioSrc(null)
      setAudioName('')
      setVolume(100)
      setSpeed(1)
      setReverbDecay(0.01)
      setBassBoost(0)
      setIsExiting(false)
    }, 200)
  }, [])

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  const handleSpeedChange = (value: number[]) => {
    setSpeed(value[0])
  }

  const handleReverbDecayChange = (value: number[]) => {
    setReverbDecay(value[0])
  }

  const handleBassBoostChange = (value: number[]) => {
    setBassBoost(value[0])
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer?.files?.[0]
    if (droppedFile?.type.startsWith('audio/')) {
      setAudioSrc(URL.createObjectURL(droppedFile))
      setAudioName(droppedFile.name)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto p-4 max-w-3xl"
    >
      <header className="mb-8 md:mb-12 text-center">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold mt-16 text-purple-600"
        >
          suncore
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-gray-600"
        >
          transform your music into nightcore magic.
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        {!audioSrc ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: isExiting ? -30 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isExiting ? 30 : -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-6 w-6" />
                  Upload Music
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center w-full"
                  >
                    <label
                      htmlFor="dropzone-file"
                      className={`
                        flex flex-col items-center justify-center w-full h-64 
                        border-2 border-dashed rounded-lg cursor-pointer 
                        transition-all duration-300 ease-in-out
                        ${isDragging 
                          ? 'border-blue-500 bg-blue-50 scale-105' 
                          : 'border-purple-400 bg-gray-50 hover:bg-purple-50'
                        }
                      `}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <motion.div 
                        className="flex flex-col items-center justify-center pt-5 pb-6"
                        animate={{
                          scale: isDragging ? 1.1 : 1,
                          y: isDragging ? -10 : 0
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Upload 
                          className={`w-10 h-10 mb-3 transition-colors duration-300 ${
                            isDragging ? 'text-blue-500' : 'text-purple-500'
                          }`} 
                        />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">
                            {isDragging ? 'Drop your audio file here' : 'Click to upload'}
                          </span>
                          {!isDragging && ' or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">MP3, WAV or OGG (MAX. 10MB)</p>
                      </motion.div>
                      <Input
                        id="dropzone-file"
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Audio Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:gap-6">
                  <div>
                    <label htmlFor="volume-slider" className="block mb-2">
                      Volume: {volume}%
                    </label>
                    <Slider
                      id="volume-slider"
                      min={0}
                      max={100}
                      step={1}
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="speed-slider" className="block mb-2">
                      Playback Speed: {speed.toFixed(2)}x
                    </label>
                    <Slider
                      id="speed-slider"
                      min={0.5}
                      max={2}
                      step={0.01}
                      value={[speed]}
                      onValueChange={handleSpeedChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="reverb-slider" className="block mb-2">
                      Reverb Decay: {reverbDecay.toFixed(2)}
                    </label>
                    <Slider
                      id="reverb-slider"
                      min={0.01}
                      max={10}
                      step={0.01}
                      value={[reverbDecay]}
                      onValueChange={handleReverbDecayChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="bass-slider" className="block mb-2">
                      Bass Boost: {bassBoost.toFixed(2)} dB
                    </label>
                    <Slider
                      id="bass-slider"
                      min={0}
                      max={12}
                      step={0.1}
                      value={[bassBoost]}
                      onValueChange={handleBassBoostChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Audio Player</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomAudioPlayer 
                  key={audioSrc}
                  src={audioSrc} 
                  audioName={audioName} 
                  volume={volume} 
                  speed={speed}
                  reverbDecay={reverbDecay}
                  bassBoost={bassBoost}
                  resetAudio={resetAudio}
                  isMobile={isMobile}
                  isExiting={isExiting}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
