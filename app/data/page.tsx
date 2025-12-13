"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Pause, Play, RefreshCcw, RotateCcw, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Hdf5Folder, Hdf5File, Hdf5ProcessResult } from "@/lib/types"

export default function Hdf5Page() {
  const [loading, setLoading] = useState(true)
  const [hdf5Folders, setHdf5Folders] = useState<Hdf5Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [hdf5Files, setHdf5Files] = useState<Hdf5File[]>([])
  const [selectedFile, setSelectedFile] = useState<Hdf5File | null>(null)
  const [hdf5Result, setHdf5Result] = useState<Hdf5ProcessResult | null>(null)
  const [hdf5Loading, setHdf5Loading] = useState(false)

  const [playing, setPlaying] = useState(false)
  const [frameIndex, setFrameIndex] = useState(0)
  const { toast } = useToast()

  const cameraNames = hdf5Result?.camera_names ?? []

  const frameCount = useMemo(() => {
    if (!hdf5Result || cameraNames.length === 0) return 0
    const lengths = cameraNames.map((c) => (hdf5Result.camera_images[c] ?? []).length)
    return lengths.length ? Math.min(...lengths) : 0
  }, [hdf5Result, cameraNames])

  const currentFrameIndex = Math.min(frameIndex, Math.max(frameCount - 1, 0))
  const fpsAssumed = 12

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    if (!playing || frameCount === 0) return
    const timer = setInterval(() => {
      setFrameIndex((idx) => (idx + 1) % Math.max(frameCount, 1))
    }, 1000 / fpsAssumed)
    return () => clearInterval(timer)
  }, [playing, frameCount])

  useEffect(() => {
    setFrameIndex(0)
  }, [selectedFile?.name])

  const loadFolders = async () => {
    try {
      setLoading(true)
      const folders = await apiClient.getHdf5Folders()
      setHdf5Folders(folders)
      if (folders.length > 0) {
        await selectFolder(folders[0].name)
      } else {
        setSelectedFolder(null)
        setHdf5Files([])
        setSelectedFile(null)
        setHdf5Result(null)
      }
    } catch (error) {
      toast({
        title: "加载HDF5目录失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectFolder = async (folderName: string) => {
    setSelectedFolder(folderName)
    setHdf5Result(null)
    setFrameIndex(0)
    try {
      const files = await apiClient.getHdf5Files(folderName)
      setHdf5Files(files)
      if (files.length > 0) {
        setSelectedFile(files[0])
        await handleProcessHdf5(files[0])
      } else {
        setSelectedFile(null)
      }
    } catch (error) {
      toast({
        title: "加载文件失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  const handleProcessHdf5 = async (file: Hdf5File) => {
    try {
      setHdf5Loading(true)
      setPlaying(false)
      const result = await apiClient.processHdf5(file.folder, file.name)
      setHdf5Result(result)
      setFrameIndex(0)
    } catch (error) {
      toast({
        title: "解析HDF5失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setHdf5Loading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Header />
          <main className="mt-16 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="mt-16 p-4 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <Card className="p-0 shadow-sm">
              <div className="border-b px-4 py-3">
                <h1 className="text-xl font-semibold text-foreground">HDF5 文件管理器</h1>
              </div>
              <div className="grid grid-cols-2 border-t">
                <div className="border-r p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">数据库</span>
                    <Button variant="destructive" size="sm" onClick={loadFolders}>
                      刷新
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {hdf5Folders.length === 0 && <p className="text-sm text-muted-foreground">暂无目录</p>}
                    {hdf5Folders.map((folder) => (
                      <button
                        key={folder.name}
                        onClick={() => selectFolder(folder.name)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                          selectedFolder === folder.name
                            ? "bg-blue-600 text-white shadow"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <div className="font-medium">{folder.name}</div>
                        <div className="text-xs text-muted-foreground">{folder.hdf5_count} 个</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">文件列表</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => selectedFolder && selectFolder(selectedFolder)}
                    >
                      刷新文件列表
                    </Button>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {selectedFolder ? `当前：${selectedFolder}` : "选择数据库目录"}
                  </p>
                  <div className="space-y-2">
                    {selectedFolder && hdf5Files.length === 0 && (
                      <p className="text-sm text-muted-foreground">暂无文件</p>
                    )}
                    {hdf5Files.map((file) => (
                      <button
                        key={file.name}
                        onClick={() => {
                          setSelectedFile(file)
                          handleProcessHdf5(file)
                        }}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                          selectedFile?.name === file.name
                            ? "bg-blue-600 text-white shadow"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground">{file.size}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">上传可接入 /api/hdf5/upload_chunk</span>
                  <Button variant="outline" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    上传
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">多视角播放器</h2>
                {hdf5Loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              {hdf5Result && cameraNames.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cameraNames.map((cam) => {
                      const frames = hdf5Result.camera_images[cam] ?? []
                      const frame = frames[currentFrameIndex] ?? frames[0]
                      return (
                        <div key={cam} className="rounded-lg border bg-muted/20 p-2">
                          <div className="mb-2 text-center text-sm text-muted-foreground">{cam}</div>
                          {frame ? (
                            <img
                              src={frame.data}
                              alt={`${cam}-frame-${frame.index}`}
                              className="h-64 w-full rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                              无图像
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" onClick={() => setPlaying((p) => !p)}>
                      {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {playing ? "暂停" : "播放"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFrameIndex(0)
                        setPlaying(false)
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      重置
                    </Button>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(frameCount - 1, 0)}
                      value={Math.min(currentFrameIndex, Math.max(frameCount - 1, 0))}
                      onChange={(e) => {
                        setFrameIndex(Number(e.target.value))
                        setPlaying(false)
                      }}
                      className="h-1 w-64 cursor-pointer"
                    />
                    <div className="text-xs text-muted-foreground">
                      {frameCount > 0 ? `${currentFrameIndex + 1}/${frameCount}` : "0/0"} 帧
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frameCount > 0
                        ? `${(currentFrameIndex / fpsAssumed).toFixed(2)}s / ${(frameCount / fpsAssumed).toFixed(2)}s`
                        : "0.00s / 0.00s"}
                    </div>
                    <div className="text-xs text-muted-foreground">视角：{cameraNames.length}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">请选择数据库与 HDF5 文件以查看图像</p>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
