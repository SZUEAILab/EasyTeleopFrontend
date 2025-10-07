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
import type { Device, DeviceTypeInfo, Node } from "@/lib/types"
import { Loader2, CheckCircle } from "lucide-react"

interface DeviceConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
  nodeId?: number
  nodes?: Node[]
  onSuccess: () => void
}

export function DeviceConfigModal({ open, onOpenChange, device, nodeId, nodes, onSuccess }: DeviceConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [deviceTypes, setDeviceTypes] = useState<Record<string, Record<string, DeviceTypeInfo>>>({})
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(nodeId)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    type: "",
    config: {} as Record<string, any>,
  })

  useEffect(() => {
    if (open) {
      if (device) {
        setSelectedNodeId(device.node_id)
        setFormData({
          name: device.name,
          description: device.description,
          category: device.category,
          type: device.type,
          config: device.config,
        })
      } else {
        setSelectedNodeId(nodeId)
        setFormData({
          name: "",
          description: "",
          category: "",
          type: "",
          config: {},
        })
      }
      setTestSuccess(false)
    }
  }, [open, device, nodeId])

  useEffect(() => {
    if (selectedNodeId) {
      loadDeviceInfo(selectedNodeId)
    }
  }, [selectedNodeId])

  const loadDeviceInfo = async (nId: number) => {
    try {
      const [cats, types] = await Promise.all([apiClient.getDeviceCategories(nId), apiClient.getDeviceTypes(nId)])
      setCategories(cats)
      setDeviceTypes(types)
    } catch (error) {
      console.error("Failed to load device info:", error)
    }
  }

  const { toast } = useToast()

  const currentTypeInfo = formData.category && formData.type ? deviceTypes[formData.category]?.[formData.type] : null

  const handleTest = async () => {
    if (!selectedNodeId) {
      toast({
        title: "请选择节点",
        variant: "destructive",
      })
      return
    }

    // 创建包含默认值的配置
    const configWithDefaults = { ...formData.config };
    if (currentTypeInfo) {
      Object.entries(currentTypeInfo.need_config).forEach(([key, config]) => {
        if (configWithDefaults[key] === undefined && config.default !== undefined) {
          configWithDefaults[key] = config.default;
        }
      });
    }

    setTesting(true)
    try {
      await apiClient.testDevice({
        node_id: selectedNodeId,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        type: formData.type,
        config: configWithDefaults,
      })
      setTestSuccess(true)
      toast({
        title: "测试成功",
        description: "设备连接正常",
      })
    } catch (error) {
      setTestSuccess(false)
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

    if (!selectedNodeId) {
      toast({
        title: "请选择节点",
        variant: "destructive",
      })
      return
    }

    if (!testSuccess) {
      toast({
        title: "请先进行连通性测试",
        description: "在提交配置前必须先通过连通性测试",
        variant: "destructive",
      })
      return
    }

    // 创建包含默认值的配置
    const configWithDefaults = { ...formData.config };
    if (currentTypeInfo) {
      Object.entries(currentTypeInfo.need_config).forEach(([key, config]) => {
        if (configWithDefaults[key] === undefined && config.default !== undefined) {
          configWithDefaults[key] = config.default;
        }
      });
    }

    setLoading(true)
    try {
      if (device) {
        // 创建一个新对象，正确处理category字段
        const updateData: Partial<Omit<Device, "id" | "node_id" | "created_at" | "updated_at">> = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          config: configWithDefaults,
        };
        
        // 只有当category不是空字符串时才添加到更新数据中
        if (formData.category) {
          updateData.category = formData.category as "VR" | "Robot" | "Camera";
        }
        
        await apiClient.updateDevice(device.id, updateData)
        toast({
          title: "更新成功",
          description: "设备配置已更新",
        })
      } else {
        await apiClient.createDevice({
          node_id: selectedNodeId,
          ...formData,
          category: formData.category as "VR" | "Robot" | "Camera",
          config: configWithDefaults
        } as any)
        toast({
          title: "添加成功",
          description: "设备已添加",
        })
      }
      onSuccess()
      onOpenChange(false)
      setTestSuccess(false)
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
          {nodes && nodes.length > 0 && !device && (
            <div className="space-y-2">
              <Label htmlFor="node">所属节点 *</Label>
              <Select
                value={selectedNodeId?.toString()}
                onValueChange={(value) => {
                  setSelectedNodeId(Number.parseInt(value))
                  setFormData({ ...formData, category: "", type: "", config: {} })
                  setTestSuccess(false)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择节点" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id.toString()}>
                      节点 {node.id} - {node.uuid} {node.status === true ? "(在线)" : "(离线)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNodeId && !nodes.find(n => n.id === selectedNodeId)?.status && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  注意：当前选择的节点处于离线状态，可能无法正常添加设备
                </p>
              )}
            </div>
          )}

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
                disabled={!selectedNodeId}
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
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">设备配置</h4>
                {testSuccess && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    测试通过
                  </span>
                )}
              </div>
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
          <Button 
            onClick={handleSubmit} 
            disabled={loading || testing || !currentTypeInfo || (currentTypeInfo && Object.keys(currentTypeInfo.need_config).length > 0 && !testSuccess)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
