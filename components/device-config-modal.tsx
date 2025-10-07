"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Device, DeviceTypeInfo } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface DeviceConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
  nodeId: number
  onSuccess: () => void
}

export function DeviceConfigModal({ open, onOpenChange, device, nodeId, onSuccess }: DeviceConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [deviceTypes, setDeviceTypes] = useState<Record<string, Record<string, DeviceTypeInfo>>>({})
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    type: "",
    config: {} as Record<string, any>,
  })

  useEffect(() => {
    if (open) {
      loadDeviceInfo()
      if (device) {
        setFormData({
          name: device.name,
          description: device.description,
          category: device.category,
          type: device.type,
          config: device.config,
        })
      } else {
        setFormData({
          name: "",
          description: "",
          category: "",
          type: "",
          config: {},
        })
      }
    }
  }, [open, device])

  const loadDeviceInfo = async () => {
    try {
      const [cats, types] = await Promise.all([apiClient.getDeviceCategories(nodeId), apiClient.getDeviceTypes(nodeId)])
      setCategories(cats)
      setDeviceTypes(types)
    } catch (error) {
      console.error("Failed to load device info:", error)
    }
  }

  const { toast } = useToast()

  const currentTypeInfo = formData.category && formData.type ? deviceTypes[formData.category]?.[formData.type] : null

  const handleTest = async () => {
    setTesting(true)
    try {
      await apiClient.testDevice({
        node_id: nodeId,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        type: formData.type,
        config: formData.config,
      })
      toast({
        title: "测试成功",
        description: "设备配置成功",
      })
    } catch (error) {
      toast({
        title: "测试失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.type) {
      toast({
        title: "请填写必填项",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (device) {
        await apiClient.updateDevice(device.id, formData)
        toast({
          title: "更新成功",
          description: "设备配置已更新",
        })
      } else {
        await apiClient.createDevice({
          node_id: nodeId,
          ...formData,
        } as any)
        toast({
          title: "添加成功",
          description: "设备已添加",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: device ? "更新失败" : "添加失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{device ? "编辑设备" : "添加设备"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">设备名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：左臂机械臂"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">设备类别 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value, type: "", config: {} })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">设备描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="设备的详细描述"
              rows={2}
            />
          </div>

          {formData.category && (
            <div className="space-y-2">
              <Label htmlFor="type">设备类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, config: {} })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(deviceTypes[formData.category] || {}).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentTypeInfo && <p className="text-xs text-muted-foreground">{currentTypeInfo.description}</p>}
            </div>
          )}

          {currentTypeInfo && Object.keys(currentTypeInfo.need_config).length > 0 && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <h4 className="text-sm font-medium">设备配置</h4>
              {Object.entries(currentTypeInfo.need_config).map(([key, config]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>
                    {config.description}
                    {config.default !== undefined && (
                      <span className="ml-1 text-xs text-muted-foreground">(默认: {config.default})</span>
                    )}
                  </Label>
                  <Input
                    id={key}
                    type={config.type === "integer" ? "number" : "text"}
                    value={formData.config[key] ?? config.default ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          [key]: config.type === "integer" ? Number.parseInt(e.target.value) : e.target.value,
                        },
                      })
                    }
                    placeholder={`请输入${config.description}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || testing}>
            取消
          </Button>
          {currentTypeInfo && (
            <Button variant="secondary" onClick={handleTest} disabled={loading || testing}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              连通性测试
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={loading || testing}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
