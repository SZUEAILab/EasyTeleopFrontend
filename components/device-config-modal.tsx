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
    return { error: "\u9700\u8981\u5b57\u7b26\u4e32" }
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
    return { error: "\u9700\u8981\u6570\u5b57" }
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
    return { error: "\u9700\u8981\u5e03\u5c14\u503c(true/false)" }
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
        return { error: "\u9700\u8981\u6709\u6548\u7684JSON\u5bf9\u8c61" }
      }
    }
    return { error: "\u9700\u8981JSON\u5bf9\u8c61" }
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
        return { error: "\u9700\u8981\u6709\u6548\u7684JSON\u6570\u7ec4" }
      }
    }
    return { error: "\u9700\u8981JSON\u6570\u7ec4" }
  }

  return { error: "\u4e0d\u652f\u6301\u7684\u7c7b\u578b" }
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
        errors[key] = "\u5fc5\u586b"
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
        title: "\u8bf7\u9009\u62e9\u8282\u70b9",
        variant: "destructive",
      })
      return
    }

    const { config: configWithDefaults, errors } = buildConfigWithDefaults()
    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors)
      toast({
        title: "\u914d\u7f6e\u6709\u8bef",
        description: "\u8bf7\u6839\u636e\u63d0\u793a\u4fee\u6b63\u8bbe\u5907\u914d\u7f6e\u540e\u518d\u6d4b\u8bd5",
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
        title: "\u6d4b\u8bd5\u6210\u529f",
        description: "\u8bbe\u5907\u8fde\u63a5\u6b63\u5e38",
      })
    } catch (error) {
      setTestSuccess(false)
      toast({
        title: "\u6d4b\u8bd5\u5931\u8d25",
        description: error instanceof Error ? error.message : "\u8bf7\u7a0d\u540e\u91cd\u8bd5",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.type) {
      toast({
        title: "\u8bf7\u586b\u5199\u5fc5\u586b\u9879",
        variant: "destructive",
      })
      return
    }

    if (!selectedNodeId) {
      toast({
        title: "\u8bf7\u9009\u62e9\u8282\u70b9",
        variant: "destructive",
      })
      return
    }

    if (!testSuccess) {
      toast({
        title: "\u8bf7\u5148\u8fdb\u884c\u8fde\u901a\u6027\u6d4b\u8bd5",
        description: "\u5728\u63d0\u4ea4\u914d\u7f6e\u524d\u5fc5\u987b\u5148\u901a\u8fc7\u8fde\u901a\u6027\u6d4b\u8bd5",
        variant: "destructive",
      })
      return
    }

    const { config: configWithDefaults, errors } = buildConfigWithDefaults()
    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors)
      toast({
        title: "\u914d\u7f6e\u6709\u8bef",
        description: "\u8bf7\u6839\u636e\u63d0\u793a\u4fee\u6b63\u8bbe\u5907\u914d\u7f6e\u540e\u518d\u63d0\u4ea4",
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
          title: "\u66f4\u65b0\u6210\u529f",
          description: "\u8bbe\u5907\u914d\u7f6e\u5df2\u66f4\u65b0",
        })
      } else {
        await apiClient.createDevice({
          node_id: selectedNodeId,
          ...formData,
          category: formData.category as "VR" | "Robot" | "Camera",
          config: configWithDefaults,
        } as any)
        toast({
          title: "\u6dfb\u52a0\u6210\u529f",
          description: "\u8bbe\u5907\u5df2\u6dfb\u52a0",
        })
      }
      onSuccess()
      onOpenChange(false)
      setTestSuccess(false)
    } catch (error) {
      toast({
        title: device ? "\u66f4\u65b0\u5931\u8d25" : "\u6dfb\u52a0\u5931\u8d25",
        description: error instanceof Error ? error.message : "\u8bf7\u7a0d\u540e\u91cd\u8bd5",
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
          <DialogTitle>{device ? "\u7f16\u8f91\u8bbe\u5907" : "\u6dfb\u52a0\u8bbe\u5907"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showNodeSelector && (
            <div className="space-y-2">
              <Label htmlFor="node">\u6240\u5c5e\u8282\u70b9 *</Label>
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
                  <SelectValue placeholder="\u9009\u62e9\u8282\u70b9" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id.toString()}>
                      \u8282\u70b9 {node.id} - {node.uuid} {node.status === true ? "(\u5728\u7ebf)" : "(\u79bb\u7ebf)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedNodeId && !nodes.find((n) => n.id === selectedNodeId)?.status && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  \u6ce8\u610f\uff1a\u5f53\u524d\u9009\u62e9\u7684\u8282\u70b9\u5904\u4e8e\u79bb\u7ebf\u72b6\u6001\uff0c\u53ef\u80fd\u65e0\u6cd5\u6b63\u5e38\u6dfb\u52a0\u8bbe\u5907
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">\u8bbe\u5907\u540d\u79f0 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="\u4f8b\u5982\uff1a\u5de6\u81c2\u673a\u68b0\u81c2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">\u8bbe\u5907\u7c7b\u522b *</Label>
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
                  <SelectValue placeholder="\u9009\u62e9\u7c7b\u522b" />
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
            <Label htmlFor="description">\u8bbe\u5907\u63cf\u8ff0</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="\u8bbe\u5907\u7684\u8be6\u7ec6\u63cf\u8ff0"
              rows={2}
            />
          </div>

          {formData.category && (
            <div className="space-y-2">
              <Label htmlFor="type">\u8bbe\u5907\u7c7b\u578b *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value, config: {} })
                  setTestSuccess(false)
                  setConfigErrors({})
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="\u9009\u62e9\u7c7b\u578b" />
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
                <h4 className="text-sm font-medium">\u8bbe\u5907\u914d\u7f6e</h4>
                {testSuccess && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    \u6d4b\u8bd5\u901a\u8fc7
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
                    ? "\u4ec5\u652f\u6301\u6570\u5b57\uff0c\u53ef\u8f93\u5165\u5c0f\u6570"
                    : normalizedType === "boolean"
                      ? "\u8bf7\u9009\u62e9 true \u6216 false"
                      : normalizedType === "object"
                        ? "\u8bf7\u8f93\u5165 JSON \u5bf9\u8c61\uff0c\u4f8b\u5982\uff1a{\"key\":\"value\"}"
                        : normalizedType === "array"
                          ? "\u8bf7\u8f93\u5165 JSON \u6570\u7ec4\uff0c\u4f8b\u5982\uff1a[1,2,3]"
                          : normalizedType === "null"
                            ? "\u8be5\u5b57\u6bb5\u56fa\u5b9a\u4e3a null"
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
                        <span className="ml-1 text-xs text-muted-foreground">(\u9ed8\u8ba4: {String(config.default)})</span>
                      )}
                    </Label>
                    {normalizedType === "boolean" ? (
                      <Select value={String(inputValue)} onValueChange={(value) => updateValue(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="\u8bf7\u9009\u62e9 true/false" />
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
                        placeholder={`\u8bf7\u8f93\u5165${config.description}\uff08JSON\uff09`}
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
                        placeholder={`\u8bf7\u8f93\u5165${config.description}`}
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
            \u53d6\u6d88
          </Button>
          {currentTypeInfo && (
            <Button variant="secondary" onClick={handleTest} disabled={loading || testing || hasConfigErrors}>
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              \u8fde\u901a\u6027\u6d4b\u8bd5
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
            \u786e\u5b9a
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

