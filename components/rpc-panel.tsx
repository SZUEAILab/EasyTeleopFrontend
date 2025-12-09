"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Terminal, Play, RefreshCw, ChevronDown, CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react'
import { apiClient } from "@/lib/api-client"
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
  const [methods, setMethods] = useState<string[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [params, setParams] = useState<string>("{}")
  const [loading, setLoading] = useState(false)
  const [methodsLoading, setMethodsLoading] = useState(false)
  const [results, setResults] = useState<RpcResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // 加载可用的RPC方法
  const loadMethods = async () => {
    if (!isNodeOnline) return

    try {
      setMethodsLoading(true)
      const methodsList = await apiClient.getNodeRpcMethods(nodeId)
      setMethods(methodsList)
      if (methodsList.length > 0 && !selectedMethod) {
        setSelectedMethod(methodsList[0])
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

  useEffect(() => {
    if (isNodeOnline && isOpen) {
      loadMethods()
    }
  }, [nodeId, isNodeOnline, isOpen])

  // 执行RPC调用
  const executeRpc = async () => {
    if (!selectedMethod) return

    try {
      setLoading(true)
      let parsedParams: Record<string, unknown> | undefined

      if (params.trim() && params.trim() !== "{}") {
        try {
          parsedParams = JSON.parse(params)
        } catch {
          toast({
            title: "参数格式错误",
            description: "请输入有效的JSON格式参数",
            variant: "destructive",
          })
          return
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
        ...prev.slice(0, 9), // 保留最近10条记录
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

  // 根据方法设置默认参数模板
  const getParamsTemplate = (method: string): string => {
    switch (method) {
      case "node.test_device":
        return JSON.stringify(
          {
            category: "robot",
            type: "realman",
            config: { ip: "192.168.1.100" },
          },
          null,
          2
        )
      case "node.update_config":
        return JSON.stringify(
          {
            config_key: "value",
          },
          null,
          2
        )
      case "node.start_teleop_group":
      case "node.stop_teleop_group":
        return JSON.stringify(
          {
            group_id: 1,
          },
          null,
          2
        )
      default:
        return "{}"
    }
  }

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method)
    setParams(getParamsTemplate(method))
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
                <p className="text-sm text-muted-foreground">
                  直接调用节点RPC方法
                </p>
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
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4">
            {!isNodeOnline ? (
              <div className="py-8 text-center">
                <Terminal className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  节点离线，无法使用RPC功能
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 方法选择和刷新 */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label className="mb-2 block text-sm">RPC 方法</Label>
                    <Select
                      value={selectedMethod}
                      onValueChange={handleMethodChange}
                      disabled={methodsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择RPC方法" />
                      </SelectTrigger>
                      <SelectContent>
                        {methods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={loadMethods}
                    disabled={methodsLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${methodsLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>

                {/* 参数输入 */}
                <div>
                  <Label className="mb-2 block text-sm">参数 (JSON)</Label>
                  <Textarea
                    value={params}
                    onChange={(e) => setParams(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="font-mono text-sm"
                    rows={5}
                  />
                </div>

                {/* 执行按钮 */}
                <Button
                  onClick={executeRpc}
                  disabled={!selectedMethod || loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
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
                            result.success
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm font-medium">
                                {result.method}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {result.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="overflow-x-auto rounded bg-background/80 p-2 text-xs">
                            {result.success
                              ? JSON.stringify(result.data, null, 2)
                              : result.error}
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
