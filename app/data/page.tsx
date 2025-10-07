"use client"

import { useEffect, useState } from "react"
import { Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StatusBadge } from "@/components/status-badge"
import { RecordingControlBar } from "@/components/recording-control-bar"
import { VideoPlaybackModal } from "@/components/video-playback-modal"
import { apiClient } from "@/lib/api-client"
import { mqttClient } from "@/lib/mqtt-client"
import { useToast } from "@/hooks/use-toast"
import type { TeleopGroup, Recording } from "@/lib/types"

export default function DataManagementPage() {
  const [teleopGroups, setTeleopGroups] = useState<TeleopGroup[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [recordingStatus, setRecordingStatus] = useState<Record<number, 0 | 1>>({})
  const [playbackOpen, setPlaybackOpen] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const groupsData = await apiClient.getTeleopGroups()
      setTeleopGroups(groupsData)

      // Mock recordings data - in production this would come from API
      const mockRecordings: Recording[] = groupsData.flatMap((group, groupIndex) =>
        Array.from({ length: 12 }, (_, i) => ({
          id: `RM${group.id.toString().padStart(6, "0")}${Date.now()}${i}`,
          teleop_group_id: group.id,
          operator_name: "曾尔曼双臂机器人",
          robot_id: `RM${group.id.toString().padStart(6, "0")}`,
          start_time: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          duration: "00:02:37",
          video_path: "/videos/demo.mp4",
          data_path: "/data/demo.json",
        })),
      )
      setRecordings(mockRecordings)

      // Subscribe to collecting status via MQTT
      groupsData.forEach((group) => {
        mqttClient.subscribeTeleopGroupCollecting(group.node_id, group.id, (status) => {
          setRecordingStatus((prev) => ({ ...prev, [group.id]: status as 0 | 1 }))
        })
      })
    } catch (error) {
      toast({
        title: "加载失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartRecording = async (groupId: number) => {
    try {
      await apiClient.startTeleopGroup(groupId)
      toast({
        title: "开始录制",
        description: "遥操作组已启动录制",
      })
    } catch (error) {
      toast({
        title: "启动失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  const handleStopRecording = async (groupId: number) => {
    try {
      await apiClient.stopTeleopGroup(groupId)
      toast({
        title: "停止录制",
        description: "遥操作组已停止录制",
      })
      loadData()
    } catch (error) {
      toast({
        title: "停止失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  const handlePlayRecording = (recording: Recording) => {
    setSelectedRecording(recording)
    setPlaybackOpen(true)
  }

  const handleDeleteRecording = async (id: string) => {
    if (!confirm("确认删除这条录制数据吗？")) return

    try {
      // In production, call API to delete recording
      setRecordings((prev) => prev.filter((r) => r.id !== id))
      toast({
        title: "删除成功",
        description: "录制数据已删除",
      })
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Header />
          <main className="mt-16 p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const activeRecording = Object.entries(recordingStatus).find(([_, status]) => status === 1)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="mt-16 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">数据管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">查看和管理遥操作录制数据</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              开始录制
            </Button>
          </div>

          {activeRecording && (
            <RecordingControlBar
              teleopGroupId={Number.parseInt(activeRecording[0])}
              onStop={() => handleStopRecording(Number.parseInt(activeRecording[0]))}
            />
          )}

          <div className="space-y-6">
            {teleopGroups.map((group) => {
              const groupRecordings = recordings.filter((r) => r.teleop_group_id === group.id)
              const isRecording = recordingStatus[group.id] === 1

              if (groupRecordings.length === 0 && !isRecording) return null

              return (
                <div key={group.id}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">{group.name}</h2>
                    {isRecording ? (
                      <StatusBadge status={1} type="teleop" />
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleStartRecording(group.id)}>
                        开始录制
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupRecordings.map((recording, index) => (
                      <Card key={recording.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          <img
                            src="/robot-arm-operation.jpg"
                            alt="Recording thumbnail"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <Button
                              size="icon"
                              className="h-12 w-12 rounded-full"
                              onClick={() => handlePlayRecording(recording)}
                            >
                              <Play className="h-6 w-6" />
                            </Button>
                          </div>
                          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                            {recording.duration}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-foreground">{recording.id}</h3>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                录制时间：{new Date(recording.start_time).toLocaleString("zh-CN")}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                机器人类型：{recording.operator_name}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">机器人类型：{recording.robot_id}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">录制时长：{recording.duration}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteRecording(recording.id)}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {recordings.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Play className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">暂无录制数据</h3>
                <p className="mt-2 text-sm text-muted-foreground">开始录制您的第一个遥操作数据</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  开始录制
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>

      {selectedRecording && (
        <VideoPlaybackModal open={playbackOpen} onOpenChange={setPlaybackOpen} recording={selectedRecording} />
      )}
    </div>
  )
}
