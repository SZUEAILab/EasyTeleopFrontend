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
import type { TeleopGroup, TeleopGroupTypeInfo, Device, Node } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface TeleopConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teleopGroup?: TeleopGroup
  nodeId?: number
  nodes?: Node[]
  devices: Device[]
  onSuccess: () => void
}

export function TeleopConfigModal({
  open,
  onOpenChange,
  teleopGroup,
  nodeId,
  nodes,
  devices,
  onSuccess,
}: TeleopConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [groupTypes, setGroupTypes] = useState<Record<string, TeleopGroupTypeInfo>>({})
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(nodeId)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    config: [] as number[],
  })

  useEffect(() => {
    if (open) {
      if (teleopGroup) {
        setSelectedNodeId(teleopGroup.node_id)
        setFormData({
          name: teleopGroup.name,
          description: teleopGroup.description,
          type: teleopGroup.type,
          config: teleopGroup.config,
        })
      } else {
        setSelectedNodeId(nodeId)
        setFormData({
          name: "",
          description: "",
          type: "",
          config: [],
        })
      }
    }
  }, [open, teleopGroup, nodeId])

  useEffect(() => {
    if (selectedNodeId) {
      loadGroupTypes(selectedNodeId)
    }
  }, [selectedNodeId])

  const loadGroupTypes = async (nId: number) => {
    try {
      const types = await apiClient.getTeleopGroupTypes(nId)
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

    if (!selectedNodeId) {
      toast({
        title: "请选择节点",
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
          node_id: selectedNodeId,
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
    if (!selectedNodeId) return []
    // 过滤出属于选定节点的设备
    const nodeDevices = devices.filter((d) => d.node_id === selectedNodeId)
    
    // 如果没有该类别的设备，显示所有设备并标记类别不匹配
    const categoryDevices = nodeDevices.filter((d) => d.category === category)
    
    // 调试信息，可以在控制台查看
    console.log(`设备过滤信息: 
      选定节点ID: ${selectedNodeId}
      节点下总设备数: ${nodeDevices.length}
      请求的设备类别: ${category}
      匹配类别设备数: ${categoryDevices.length}
      所有设备:`, devices)
    
    return categoryDevices
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teleopGroup ? "编辑遥操作组" : "创建遥操作组"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {nodes && nodes.length > 0 && !teleopGroup && (
            <div className="space-y-2">
              <Label htmlFor="node">所属节点 *</Label>
              <Select
                value={selectedNodeId?.toString()}
                onValueChange={(value) => {
                  setSelectedNodeId(Number.parseInt(value))
                  setFormData({ ...formData, type: "", config: [] })
                  setGroupTypes({})
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择节点" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id.toString()}>
                      节点 {node.id} - {node.uuid} {node.status === 1 ? "(在线)" : "(离线)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 添加调试信息 */}
              {selectedNodeId && (
                <p className="text-xs text-muted-foreground">
                  当前节点设备数: {devices.filter(d => d.node_id === selectedNodeId).length}
                </p>
              )}
            </div>
          )}

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
              disabled={!selectedNodeId}
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
                <h4 className="text-sm font-medium">设备配置</h4>
                <p className="text-xs text-muted-foreground">为遥操作组选择所需设备</p>
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
                        disabled={!selectedNodeId || categoryDevices.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={categoryDevices.length === 0 ? "暂无可用设备" : "请选择"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id.toString()}>
                              {device.name} 
                              {/* {device.status === 1 ? "(在线)" : "(离线)"} */}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {categoryDevices.length === 0 && selectedNodeId && (
                        <p className="text-xs text-destructive">
                          暂无可用的{configItem.category}设备，请先在设备管理中添加
                        </p>
                      )}
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