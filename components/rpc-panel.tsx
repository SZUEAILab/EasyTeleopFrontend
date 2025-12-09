"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Terminal,
  Play,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Code,
  FormInput,
} from "lucide-react"
import { apiClient, type RpcMethodInfo } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface RpcPanelProps {
  nodeId: number
  isNodeOnline: boolean
}

interface RpcResult {
  success: boolean
  method: string
  data?: unknown
  error?: string
  timestamp: Date
}

export function RpcPanel({ nodeId, isNodeOnline }: RpcPanelProps) {
  const [methods, setMethods] = useState<RpcMethodInfo[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [rawParams, setRawParams] = useState<string>("{}")
  const [formParams, setFormParams] = useState<Record<string, string>>({})
  const [isFormMode, setIsFormMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [methodsLoading, setMethodsLoading] = useState(false)
  const [results, setResults] = useState<RpcResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // 获取当前选中的方法信息
  const currentMethod = methods.find((m) => m.name === selectedMethod)

  // 加载可用的RPC方法
  const loadMethods = async () => {
    if (!isNodeOnline) return

    try {
      setMethodsLoading(true)
      const methodsList = await apiClient.getNodeRpcMethods(nodeId)
      setMethods(methodsList)
      if (methodsList.length > 0 && !selectedMethod) {
        setSelectedMethod(methodsList[0].name)
        initFormParams(methodsList[0])
      }
    } catch (error) {
      toast({
        title: "获取RPC方法失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setMethodsLoading(false)
    }
  }

  // 初始化表单参数
  const initFormParams = (method: RpcMethodInfo) => {
    const params: Record<string, string> = {}
    Object.keys(method.params).forEach((key) => {
      const type = method.params[key]
      if (type === "object") {
        params[key] = "{}"
      } else if (type === "number") {
        params[key] = "0"
      } else if (type === "boolean") {
        params[key] = "false"
      } else {
        params[key] = ""
      }
    })
    setFormParams(params)
    setRawParams(JSON.stringify(params, null, 2))
  }

  useEffect(() => {
    if (isNodeOnline && isOpen) {
      loadMethods()
    }
  }, [nodeId, isNodeOnline, isOpen])

  // 从表单参数构建实际参数对象
  const buildParamsFromForm = (): Record<string, unknown> => {
    if (!currentMethod) return {}

    const result: Record<string, unknown> = {}
    Object.keys(currentMethod.params).forEach((key) => {
      const type = currentMethod.params[key]
      const value = formParams[key] || ""

      if (type === "object") {
        try {
          result[key] = JSON.parse(value || "{}")
        } catch {
          result[key] = {}
        }
      } else if (type === "number") {
        result[key] = Number.parseFloat(value) || 0
      } else if (type === "boolean") {
        result[key] = value === "true"
      } else {
        result[key] = value
      }
    })
    return result
  }

  // 执行RPC调用
  const executeRpc = async () => {
    if (!selectedMethod) return

    try {
      setLoading(true)
      let parsedParams: Record<string, unknown> | undefined

      if (isFormMode) {
        parsedParams = buildParamsFromForm()
        // 如果参数为空对象，设为 undefined
        if (Object.keys(parsedParams).length === 0) {
          parsedParams = undefined
        }
      } else {
        if (rawParams.trim() && rawParams.trim() !== "{}") {
          try {
            parsedParams = JSON.parse(rawParams)
          } catch {
            toast({
              title: "参数格式错误",
              description: "请输入有效的JSON格式参数",
              variant: "destructive",
            })
            return
          }
        }
      }

      const result = await apiClient.callNodeRpc(nodeId, selectedMethod, parsedParams)

      setResults((prev) => [
        {
          success: true,
          method: selectedMethod,
          data: result,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ])

      toast({
        title: "RPC调用成功",
        description: `方法 ${selectedMethod} 执行成功`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      setResults((prev) => [
        {
          success: false,
          method: selectedMethod,
          error: errorMessage,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ])

      toast({
        title: "RPC调用失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMethodChange = (methodName: string) => {
    setSelectedMethod(methodName)
    const method = methods.find((m) => m.name === methodName)
    if (method) {
      initFormParams(method)
    }
  }

  // 切换输入模式
  const toggleInputMode = () => {
    if (isFormMode) {
      // 表单模式 -> JSON模式：同步表单数据到JSON
      const params = buildParamsFromForm()
      setRawParams(JSON.stringify(params, null, 2))
    } else {
      // JSON模式 -> 表单模式：尝试解析JSON到表单
      try {
        const parsed = JSON.parse(rawParams)
        const newFormParams: Record<string, string> = {}
        Object.keys(parsed).forEach((key) => {
          const value = parsed[key]
          if (typeof value === "object") {
            newFormParams[key] = JSON.stringify(value)
          } else {
            newFormParams[key] = String(value)
          }
        })
        setFormParams(newFormParams)
      } catch {
        // 解析失败，保持当前表单状态
      }
    }
    setIsFormMode(!isFormMode)
  }

  // 更新表单参数
  const updateFormParam = (key: string, value: string) => {
    setFormParams((prev) => ({ ...prev, [key]: value }))
  }

  // 获取参数类型的显示标签
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "string":
        return "字符串"
      case "number":
        return "数字"
      case "boolean":
        return "布尔值"
      case "object":
        return "JSON对象"
      default:
        return type
    }
  }

  // 渲染参数输入控件
  const renderParamInput = (key: string, type: string) => {
    const value = formParams[key] || ""

    if (type === "boolean") {
      return (
        <Select value={value} onValueChange={(v) => updateFormParam(key, v)}>
          <SelectTrigger>
            <SelectValue placeholder="选择值" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (type === "object") {
      return (
        <Textarea
          value={value}
          onChange={(e) => updateFormParam(key, e.target.value)}
          placeholder='{"key": "value"}'
          className="font-mono text-sm"
          rows={3}
        />
      )
    }

    return (
      <Input
        type={type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => updateFormParam(key, e.target.value)}
        placeholder={`输入${getTypeLabel(type)}`}
      />
    )
  }

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">RPC 控制台</h3>
                <p className="text-sm text-muted-foreground">直接调用节点RPC方法</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isNodeOnline ? (
                <Badge variant="default" className="gap-1">
                  <Zap className="h-3 w-3" />
                  已连接
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  离线
                </Badge>
              )}
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4">
            {!isNodeOnline ? (
              <div className="py-8 text-center">
                <Terminal className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">节点离线，无法使用RPC功能</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 方法选择和刷新 */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="mb-2 block text-sm">RPC 方法</Label>
                    <Select value={selectedMethod} onValueChange={handleMethodChange} disabled={methodsLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择RPC方法" />
                      </SelectTrigger>
                      <SelectContent>
                        {methods.map((method) => (
                          <SelectItem key={method.name} value={method.name}>
                            <div className="flex flex-col items-start">
                              <span>{method.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="icon" onClick={loadMethods} disabled={methodsLoading}>
                    <RefreshCw className={`h-4 w-4 ${methodsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {/* 方法描述 */}
                {currentMethod && currentMethod.description && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">{currentMethod.description}</p>
                  </div>
                )}

                {/* 输入模式切换 */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm">参数输入</Label>
                  <Button variant="outline" size="sm" onClick={toggleInputMode} className="gap-2 bg-transparent">
                    {isFormMode ? (
                      <>
                        <Code className="h-4 w-4" />
                        切换到 JSON 模式
                      </>
                    ) : (
                      <>
                        <FormInput className="h-4 w-4" />
                        切换到表单模式
                      </>
                    )}
                  </Button>
                </div>

                {/* 参数输入区域 */}
                {isFormMode ? (
                  <div className="space-y-4 rounded-lg border p-4">
                    {currentMethod && Object.keys(currentMethod.params).length > 0 ? (
                      Object.entries(currentMethod.params).map(([key, type]) => (
                        <div key={key}>
                          <Label className="mb-2 flex items-center gap-2 text-sm">
                            <span>{key}</span>
                            <Badge variant="secondary" className="text-xs font-normal">
                              {getTypeLabel(type)}
                            </Badge>
                          </Label>
                          {renderParamInput(key, type)}
                        </div>
                      ))
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">该方法无需参数</p>
                    )}
                  </div>
                ) : (
                  <Textarea
                    value={rawParams}
                    onChange={(e) => setRawParams(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm"
                    rows={6}
                  />
                )}

                {/* 执行按钮 */}
                <Button onClick={executeRpc} disabled={!selectedMethod || loading} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  {loading ? "执行中..." : "执行"}
                </Button>

                {/* 结果历史 */}
                {results.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">执行结果</Label>
                    <div className="max-h-64 space-y-2 overflow-y-auto">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className={`rounded-lg border p-3 ${
                            result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium">{result.method}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {result.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="overflow-x-auto rounded bg-background/80 p-2 text-xs">
                            {result.success ? JSON.stringify(result.data, null, 2) : result.error}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
