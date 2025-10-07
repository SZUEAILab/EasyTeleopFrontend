"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react"
import type { Recording } from "@/lib/types"

interface VideoPlaybackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recording: Recording
}

export function VideoPlaybackModal({ open, onOpenChange, recording }: VideoPlaybackModalProps) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }, [open])

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlaying(!playing)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl p-0">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="grid gap-4 p-6 lg:grid-cols-[1fr,400px]">
            {/* Video Player */}
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setPlaying(false)}
                >
                  <source src={recording.video_path} type="video/mp4" />
                </video>
              </div>

              <div className="space-y-3">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleSkip(-10)}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSkip(10)}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>

              {/* Additional camera views */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <img
                      src={`/robot-camera-view-.jpg?height=100&width=150&query=robot camera view ${i}`}
                      alt={`Camera ${i}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Robot Pose Visualization */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-medium">机器人姿态</h3>
                <div className="relative aspect-square">
                  <img src="/futuristic-helper-robot.png" alt="Robot pose" className="h-full w-full object-contain" />
                  {/* Joint labels */}
                  {[
                    { label: "Head", pos: "top-[10%] left-1/2 -translate-x-1/2" },
                    { label: "LeftArm1", pos: "top-[25%] left-[20%]" },
                    { label: "LeftArm1", pos: "top-[35%] right-[20%]" },
                    { label: "Body", pos: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" },
                    { label: "LeftArm1", pos: "bottom-[35%] left-[25%]" },
                    { label: "LeftArm1", pos: "bottom-[35%] right-[25%]" },
                  ].map((joint, i) => (
                    <div
                      key={i}
                      className={`absolute ${joint.pos} rounded bg-primary/10 px-2 py-1 text-xs text-primary`}
                    >
                      {joint.label}
                      <div className="text-[10px] text-muted-foreground">
                        ({(Math.random() * 360).toFixed(1)}, {(Math.random() * 180).toFixed(1)},{" "}
                        {(Math.random() * 360).toFixed(1)}, {(Math.random() * 1).toFixed(2)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-sm font-medium">录制信息</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">录制ID</dt>
                    <dd className="font-mono text-xs">{recording.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">机器人类型</dt>
                    <dd>{recording.operator_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">机器人编号</dt>
                    <dd>{recording.robot_id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">录制时长</dt>
                    <dd>{recording.duration}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
