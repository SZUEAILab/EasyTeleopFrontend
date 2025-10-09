"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { config } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import type { Device } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface VRHeadset {
  uuid: string
  device_id: number | null
  info: Record<string, any>
  created_at: string
  updated_at: string
}

export default function VRHeadsetsPage() {
  const [headsets, setHeadsets] = useState<VRHeadset[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingHeadset, setEditingHeadset] = useState<VRHeadset | null>(null)
  const [formData, setFormData] = useState({
    uuid: "",
    device_id: "",
    info: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // 获取VR头显列表
      const headsetsResponse = await fetch(`${config.apiUrl}/api/vrs`)
      const headsetsData: VRHeadset[] = await headsetsResponse.json()
      
      // 获取所有设备
      const devicesData = await apiClient.getDevices()
      
      setHeadsets(headsetsData)
      setDevices(devicesData)
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

  const handleAddHeadset = () => {
    setEditingHeadset(null)
    setFormData({
      uuid: "",
      device_id: "",
      info: "",
    })
    setDialogOpen(true)
  }

  const handleEditHeadset = (headset: VRHeadset) => {
    setEditingHeadset(headset)
    setFormData({
      uuid: headset.uuid,
      device_id: headset.device_id?.toString() || "",
      info: JSON.stringify(headset.info, null, 2),
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const info = formData.info ? JSON.parse(formData.info) : {}
      
      if (editingHeadset) {
        // 更新VR头显
        const response = await fetch(`${config.apiUrl}/api/vrs/${formData.uuid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid: formData.uuid,
            device_id: formData.device_id ? parseInt(formData.device_id) : null,
            info,
          }),
        })
        
        if (!response.ok) {
          throw new Error("更新失败")
        }
        
        toast({
          title: "更新成功",
          description: "VR头显配置已更新",
        })
      } else {
        // 创建VR头显
        const response = await fetch(`${config.apiUrl}/api/vrs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid: formData.uuid,
            info,
          }),
        })
        
        if (!response.ok) {
          throw new Error("创建失败")
        }
        
        toast({
          title: "创建成功",
          description: "VR头显已添加",
        })
      }
      
      setDialogOpen(false)
      loadData()
    } catch (error) {
      toast({
        title: editingHeadset ? "更新失败" : "创建失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-56 flex-1">
          <Header />
          <main className="mt-14 p-6">
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-56 flex-1">
        <Header />
        <main className="mt-14 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">VR头显管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理VR头显设备及其配置</p>
            </div>
            <Button onClick={handleAddHeadset}>
              <Plus className="mr-2 h-4 w-4" />
              添加头显
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {headsets.map((headset) => {
              const device = devices.find(d => d.id === headset.device_id)
              return (
                <Card key={headset.uuid} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                        <Bot className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">
                          {headset.uuid.substring(0, 8)}...
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {device ? device.name : "未绑定设备"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={device ? "default" : "outline"}>
                      {device ? "已绑定" : "未绑定"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <div>UUID: {headset.uuid}</div>
                      <div>创建时间: {new Date(headset.created_at).toLocaleString()}</div>
                      <div>更新时间: {new Date(headset.updated_at).toLocaleString()}</div>
                    </div>
                    
                    {Object.keys(headset.info).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <div>配置信息:</div>
                        {Object.entries(headset.info).map(([key, value]) => (
                          <div key={key} className="ml-2">
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleEditHeadset(headset)}
                    >
                      配置
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {headsets.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium text-foreground">暂无VR头显</h3>
                <p className="mt-2 text-sm text-muted-foreground">点击"添加头显"按钮添加新的VR头显设备</p>
              </div>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingHeadset ? "编辑VR头显" : "添加VR头显"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uuid">UUID *</Label>
              <Input
                id="uuid"
                value={formData.uuid}
                onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                placeholder="输入VR头显的UUID"
                disabled={!!editingHeadset}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="device_id">绑定设备</Label>
              <Select
                value={formData.device_id || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, device_id: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择要绑定的设备" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">无</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.name} ({device.category})
                    </SelectItem>
                  ))}

                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="info">配置信息</Label>
              <Textarea
                id="info"
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                placeholder='{ "ip": "192.168.1.100" }'
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                以JSON格式输入配置信息
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}