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
import type { TeleopGroup, TeleopGroupTypeInfo, Device } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface TeleopConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teleopGroup?: TeleopGroup
  nodeId: number
  devices: Device[]
  onSuccess: () => void
}

export function TeleopConfigModal({
  open,
  onOpenChange,
  teleopGroup,
  nodeId,
  devices,
  onSuccess,
}: TeleopConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [groupTypes, setGroupTypes] = useState<Record<string, TeleopGroupTypeInfo>>({})
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    config: [] as number[],
  })

  useEffect(() => {
    if (open) {
      loadGroupTypes()
      if (teleopGroup) {
        setFormData({
          name: teleopGroup.name,
          description: teleopGroup.description,
          type: teleopGroup.type,
          config: teleopGroup.config,
        })
      } else {
        setFormData({
          name: "",
          description: "",
          type: "",
          config: [],
        })
      }
    }
  }, [open, teleopGroup])

  const loadGroupTypes = async () => {
    try {
      const types = await apiClient.getTeleopGroupTypes(nodeId)
      setGroupTypes(types)
    } catch (error) {
      console.error("Failed to load group types:", error)
    }
  }

  const { toast } = useToast()

  const currentTypeInfo = formData.type ? groupTypes[formData.type] : null

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) {
      toast({
        title: "请填写必填项",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (teleopGroup) {
        await apiClient.updateTeleopGroup(teleopGroup.id, formData)
        toast({
          title: "更新成功",
          description: "遥操作组配置已更新",
        })
      } else {
        await apiClient.createTeleopGroup({
          node_id: nodeId,
          ...formData,
        } as any)
        toast({
          title: "创建成功",
          description: "遥操作组已创建",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: teleopGroup ? "更新失败" : "创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getDevicesByCategory = (category: string) => {
    return devices.filter((d) => d.category === category)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teleopGroup ? "编辑遥操作组" : "创建遥操作组"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">遥操作组名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：主操作组"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="遥操作组的详细描述"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">遥操作组类型 *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value, config: [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupTypes).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTypeInfo && <p className="text-xs text-muted-foreground">{currentTypeInfo.description}</p>}
          </div>

          {currentTypeInfo && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-2">
                <h4 className="text-sm font-medium">请选择要遥操的机器人类型</h4>
                <p className="text-xs text-muted-foreground">已选择：{formData.type}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {currentTypeInfo.need_config.map((configItem, index) => {
                  const categoryDevices = getDevicesByCategory(configItem.category)
                  return (
                    <div key={index} className="space-y-2">
                      <Label>{configItem.description}</Label>
                      <Select
                        value={formData.config[index]?.toString() || ""}
                        onValueChange={(value) => {
                          const newConfig = [...formData.config]
                          newConfig[index] = Number.parseInt(value)
                          setFormData({ ...formData, config: newConfig })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id.toString()}>
                              {device.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
