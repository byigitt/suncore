'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomAudioPlayer } from "@/components/CustomAudioPlayer"
import { Upload, Music } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveAs } from 'file-saver'

export default function Home() {
  const [volume, setVolume] = useState(100)
  const [speed, setSpeed] = useState(1)
  const [reverbDecay, setReverbDecay] = useState(0.01)
  const [bassBoost, setBassBoost] = useState(0)
  const [audioSrc, setAudioSrc] = useState<string | null>(null)
  const [audioName, setAudioName] = useState<string>('')
  const [isExiting, setIsExiting] = useState(false)

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

  const handleResetAudio = () => {
    setIsExiting(true)
    setTimeout(() => {
      setAudioSrc(null)
      setAudioName('')
      setIsExiting(false)
    }, 200)
  }

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

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto p-4"
    >
      <header className="mb-12 text-center">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-purple-600 mt-4 leading-tight"
        >
          suncore
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-600 -mt-[7px]"
        >
          transform your music into nightcore magic.
        </motion.p>
      </header>

      <AnimatePresence mode="wait">
        {!audioSrc ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: isExiting ? 30 : -30 }}
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
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">MP3, WAV or OGG (MAX. 10MB)</p>
                      </div>
                      <Input id="dropzone-file" type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
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
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 30 : 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Audio Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  <div>
                    <label className="block mb-2">Volume: {volume}%</label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Playback Speed: {speed.toFixed(2)}x</label>
                    <Slider
                      min={0.5}
                      max={2}
                      step={0.01}
                      value={[speed]}
                      onValueChange={handleSpeedChange}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Reverb Decay: {reverbDecay.toFixed(2)}</label>
                    <Slider
                      min={0.01}
                      max={10}
                      step={0.01}
                      value={[reverbDecay]}
                      onValueChange={handleReverbDecayChange}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Bass Boost: {bassBoost.toFixed(2)} dB</label>
                    <Slider
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
                  resetAudio={handleResetAudio}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
