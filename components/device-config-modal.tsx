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
import type { Device, DeviceTypeInfo, JsonType, JsonValue, Node } from "@/lib/types"
import { Loader2, CheckCircle } from "lucide-react"

interface DeviceConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device
  nodeId?: number
  nodes?: Node[]
  onSuccess: () => void
}

const normalizeConfigType = (rawType?: string): JsonType => {
  const typeValue = (rawType ?? "").toLowerCase().trim()
  switch (typeValue) {
    case "int":
    case "integer":
    case "float":
    case "double":
    case "number":
      return "number"
    case "bool":
    case "boolean":
      return "boolean"
    case "array":
    case "list":
      return "array"
    case "object":
    case "dict":
    case "map":
      return "object"
    case "null":
    case "none":
      return "null"
    case "string":
    default:
      return "string"
  }
}

const coerceToJsonValue = (
  value: unknown,
  configType: JsonType
): { value?: JsonValue; error?: string } => {
  if (value === undefined) {
    return { value: undefined }
  }

  if (configType === "null") {
    return { value: null }
  }

  if (configType === "string") {
    if (typeof value === "string") {
      return { value }
    }
    return { error: "需要字符串" }
  }

  if (configType === "number") {
    if (typeof value === "number" && Number.isFinite(value)) {
      return { value }
    }
    if (typeof value === "string") {
      if (value.trim() === "") {
        return { value: undefined }
      }
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return { value: parsed }
      }
    }
    return { error: "需要数字" }
  }

  if (configType === "boolean") {
    if (typeof value === "boolean") {
      return { value }
    }
    if (typeof value === "string") {
      if (value.trim() === "") {
        return { value: undefined }
      }
      const lowered = value.toLowerCase()
      if (lowered === "true") {
        return { value: true }
      }
      if (lowered === "false") {
        return { value: false }
      }
    }
    return { error: "需要布尔值(true/false)" }
  }

  if (configType === "object") {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return { value: value as Record<string, JsonValue> }
    }
    if (typeof value === "string") {
      if (value.trim() === "") {
        return { value: undefined }
      }
      try {
        const parsed = JSON.parse(value)
        if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { value: parsed as Record<string, JsonValue> }
        }
      } catch {
        return { error: "需要有效的JSON对象" }
      }
    }
    return { error: "需要JSON对象" }
  }

  if (configType === "array") {
    if (Array.isArray(value)) {
      return { value: value as JsonValue[] }
    }
    if (typeof value === "string") {
      if (value.trim() === "") {
        return { value: undefined }
      }
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return { value: parsed as JsonValue[] }
        }
      } catch {
        return { error: "需要有效的JSON数组" }
      }
    }
    return { error: "需要JSON数组" }
  }

  return { error: "不支持的类型" }
}

const formatValueForInput = (value: JsonValue | undefined, configType: JsonType): string | number => {
  if (configType === "null") {
    return "null"
  }
  if (configType === "number") {
    return typeof value === "number" && Number.isFinite(value) ? value : ""
  }
  if (configType === "boolean") {
    if (typeof value === "boolean") {
      return value ? "true" : "false"
    }
    return ""
  }
  if (configType === "object" || configType === "array") {
    if (value === undefined) {
      return ""
    }
    if (typeof value === "string") {
      return value
    }
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return ""
    }
  }
  return typeof value === "string" ? value : ""
}

export function DeviceConfigModal({ open, onOpenChange, device, nodeId, nodes, onSuccess }: DeviceConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [deviceTypes, setDeviceTypes] = useState<Record<string, Record<string, DeviceTypeInfo>>>({})
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(nodeId)
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    type: "",
    config: {} as Record<string, JsonValue>,
  })

  useEffect(() => {
    if (open) {
      // reset data when modal opens to avoid stale cross-modal data
      setCategories([])
      setDeviceTypes({})
      setTestSuccess(false)
      setConfigErrors({})

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
    }
  }, [open, device, nodeId])

  useEffect(() => {
    if (open && selectedNodeId) {
      loadDeviceInfo(selectedNodeId)
    }
  }, [open, selectedNodeId])

  const loadDeviceInfo = async (nId: number) => {
    try {
      const types = await apiClient.getDeviceTypes(nId)
      setCategories(Object.keys(types))
      setDeviceTypes(types)
    } catch (error) {
      console.error("Failed to load device info:", error)
    }
  }

  const { toast } = useToast()

  const currentTypeInfo = formData.category && formData.type ? deviceTypes[formData.category]?.[formData.type] : null
  const hasConfigErrors = Object.values(configErrors).some((message) => message)

  const buildConfigWithDefaults = () => {
    if (!currentTypeInfo) {
      return { config: { ...formData.config }, errors: {} as Record<string, string> }
    }

    const normalizedConfig: Record<string, JsonValue> = {}
    const errors: Record<string, string> = {}

    Object.entries(currentTypeInfo.need_config).forEach(([key, config]) => {
      const normalizedType = normalizeConfigType(config.type)
      const rawValue = formData.config[key] ?? config.default
      const { value, error } = coerceToJsonValue(rawValue, normalizedType)

      if (value === undefined) {
        errors[key] = "必填"
        return
      }
      if (error) {
        errors[key] = error
        return
      }
      normalizedConfig[key] = value
    })

    return { config: normalizedConfig, errors }
  }

  const handleTest = async () => {
    if (!selectedNodeId) {
      toast({
        title: "请选择节点",
        variant: "destructive",
      })
      return
    }

    const { config: configWithDefaults, errors } = buildConfigWithDefaults()
    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors)
      toast({
        title: "配置有误",
        description: "请根据提示修正设备配置后再测试",
        variant: "destructive",
      })
      return
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

    const { config: configWithDefaults, errors } = buildConfigWithDefaults()
    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors)
      toast({
        title: "配置有误",
        description: "请根据提示修正设备配置后再提交",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (device) {
        const updateData: Partial<Omit<Device, "id" | "node_id" | "created_at" | "updated_at">> = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          config: configWithDefaults,
        }

        if (formData.category) {
          updateData.category = formData.category as "VR" | "Robot" | "Camera"
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
          config: configWithDefaults,
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

  const showNodeSelector = nodes && nodes.length > 0 && !device

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{device ? "编辑设备" : "添加设备"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showNodeSelector && (
            <div className="space-y-2">
              <Label htmlFor="node">所属节点 *</Label>
              <Select
                value={selectedNodeId?.toString()}
                onValueChange={(value) => {
                  setSelectedNodeId(Number.parseInt(value))
                  setFormData({ ...formData, category: "", type: "", config: {} })
                  setTestSuccess(false)
                  setConfigErrors({})
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
              {selectedNodeId && !nodes.find((n) => n.id === selectedNodeId)?.status && (
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
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value, type: "", config: {} })
                  setTestSuccess(false)
                  setConfigErrors({})
                }}
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
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value, config: {} })
                  setTestSuccess(false)
                  setConfigErrors({})
                }}
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
              {Object.entries(currentTypeInfo.need_config).map(([key, config]) => {
                const normalizedType = normalizeConfigType(config.type)
                const fieldValue = (formData.config[key] ?? config.default) as JsonValue | undefined
                const inputValue = formatValueForInput(fieldValue, normalizedType)
                const fieldError = configErrors[key]
                const helperText =
                  normalizedType === "number"
                    ? "仅支持数字，可输入小数"
                    : normalizedType === "boolean"
                      ? "请选择 true 或 false"
                      : normalizedType === "object"
                        ? "请输入 JSON 对象，例如：{\"key\":\"value\"}"
                        : normalizedType === "array"
                          ? "请输入 JSON 数组，例如：[1,2,3]"
                          : normalizedType === "null"
                            ? "该字段固定为 null"
                            : ""

                const updateValue = (rawValue: string) => {
                  const { value, error } = coerceToJsonValue(rawValue, normalizedType)
                  setFormData((prev) => {
                    const nextConfig = { ...prev.config }
                    if (error) {
                      nextConfig[key] = rawValue
                    } else if (value === undefined) {
                      delete nextConfig[key]
                    } else {
                      nextConfig[key] = value
                    }
                    return { ...prev, config: nextConfig }
                  })
                  setConfigErrors((prev) => {
                    const next = { ...prev }
                    if (error) {
                      next[key] = error
                    } else {
                      delete next[key]
                    }
                    return next
                  })
                }

                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key}>
                      {config.description}
                      {config.default !== undefined && (
                        <span className="ml-1 text-xs text-muted-foreground">(默认: {String(config.default)})</span>
                      )}
                    </Label>
                    {normalizedType === "boolean" ? (
                      <Select value={String(inputValue)} onValueChange={(value) => updateValue(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择 true/false" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : normalizedType === "object" || normalizedType === "array" ? (
                      <Textarea
                        id={key}
                        className="font-mono text-sm"
                        value={String(inputValue)}
                        onChange={(e) => updateValue(e.target.value)}
                        placeholder={`请输入${config.description}（JSON）`}
                        rows={4}
                      />
                    ) : normalizedType === "null" ? (
                      <Input id={key} value="null" disabled />
                    ) : (
                      <Input
                        id={key}
                        type={normalizedType === "number" ? "number" : "text"}
                        inputMode={normalizedType === "number" ? "decimal" : undefined}
                        step={normalizedType === "number" ? "any" : undefined}
                        value={inputValue}
                        onChange={(e) => updateValue(e.target.value)}
                        placeholder={`请输入${config.description}`}
                      />
                    )}
                    {helperText && !fieldError && (
                      <p className="text-xs text-muted-foreground">{helperText}</p>
                    )}
                    {fieldError && <p className="text-xs text-red-600">{fieldError}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading || testing || hasConfigErrors}>
            取消
          </Button>
          {currentTypeInfo && (
            <Button variant="secondary" onClick={handleTest} disabled={loading || testing || hasConfigErrors}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              连通性测试
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              loading ||
              testing ||
              hasConfigErrors ||
              !currentTypeInfo ||
              (currentTypeInfo && Object.keys(currentTypeInfo.need_config).length > 0 && !testSuccess)
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
