"use client"

import { useState } from "react"
import { Upload, Download, Trash2, FileVideo, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface TeachingData {
  id: string
  name: string
  robot_type: string
  file_size: string
  created_at: string
  data_type: "video" | "trajectory"
}

export default function TeachingManagementPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const { toast } = useToast()

  // Mock data
  const [teachingData] = useState<TeachingData[]>([
    {
      id: "TD001",
      name: "抓取物体示教数据",
      robot_type: "睿尔曼双臂机器人",
      file_size: "125 MB",
      created_at: "2025-08-27 14:30:00",
      data_type: "trajectory",
    },
    {
      id: "TD002",
      name: "装配操作示教视频",
      robot_type: "睿尔曼双臂机器人",
      file_size: "450 MB",
      created_at: "2025-08-26 10:15:00",
      data_type: "video",
    },
    {
      id: "TD003",
      name: "精密操作轨迹数据",
      robot_type: "睿尔曼双臂机器人",
      file_size: "89 MB",
      created_at: "2025-08-25 16:45:00",
      data_type: "trajectory",
    },
  ])

  const handleUpload = () => {
    toast({
      title: "上传功能",
      description: "文件上传功能开发中",
    })
  }

  const handleDownload = (id: string) => {
    toast({
      title: "下载中",
      description: `正在下载 ${id}`,
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("确认删除这条示教数据吗？")) {
      toast({
        title: "删除成功",
        description: "示教数据已删除",
      })
    }
  }

  const filteredData = teachingData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || item.data_type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="mt-16 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">遥操教学管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理和查看机器人示教数据</p>
            </div>
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              上传示教数据
            </Button>
          </div>

          <Card className="mb-6 p-4">
            <div className="flex gap-4">
              <Input
                placeholder="搜索示教数据..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="数据类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="video">视频数据</SelectItem>
                  <SelectItem value="trajectory">轨迹数据</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <div className="space-y-3">
            {filteredData.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        item.data_type === "video" ? "bg-primary/10" : "bg-success/10"
                      }`}
                    >
                      {item.data_type === "video" ? (
                        <FileVideo
                          className={`h-6 w-6 ${item.data_type === "video" ? "text-primary" : "text-success"}`}
                        />
                      ) : (
                        <Database
                          className={`h-6 w-6 ${item.data_type === "video" ? "text-primary" : "text-success"}`}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>ID: {item.id}</span>
                        <span>机器人: {item.robot_type}</span>
                        <span>大小: {item.file_size}</span>
                        <span>创建时间: {item.created_at}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(item.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredData.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Database className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">暂无示教数据</h3>
                <p className="mt-2 text-sm text-muted-foreground">上传您的第一个示教数据文件</p>
                <Button className="mt-4" onClick={handleUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  上传示教数据
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
