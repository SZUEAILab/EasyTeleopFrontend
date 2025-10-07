"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Database, Upload, Loader2 } from "lucide-react"

interface RecordingControlBarProps {
  teleopGroupId: number
  onStop: () => void
}

export function RecordingControlBar({ teleopGroupId, onStop }: RecordingControlBarProps) {
  const [duration, setDuration] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStop = async () => {
    setUploading(true)
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setUploading(false)
    onStop()
  }

  return (
    <Card className="mb-6 border-destructive/20 bg-destructive/5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <div className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-destructive">录制中</h3>
              <p className="text-sm text-destructive/80">{formatDuration(duration)}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>视频录制中</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>数据采集中</span>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-4 w-4" />
                <span>上传中...</span>
              </div>
            )}
          </div>
        </div>

        <Button variant="destructive" onClick={handleStop} disabled={uploading}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          停止录制
        </Button>
      </div>
    </Card>
  )
}
