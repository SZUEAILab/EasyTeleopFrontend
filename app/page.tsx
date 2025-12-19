"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Bot, Boxes, Activity, Server, Wifi } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Device, TeleopGroup, Node } from "@/lib/types"
import { mqttClient } from "@/lib/mqtt-client"
import cn from "classnames"
import { useSidebar } from "@/components/sidebar-context"

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [teleopGroups, setTeleopGroups] = useState<TeleopGroup[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineNodes, setOnlineNodes] = useState(0)
  const { toast } = useToast()
  const { isCollapsed } = useSidebar()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (nodes.length === 0) return

    const unsubscribers: (() => void)[] = []
    const statusMap = new Map<number, number>()

    nodes.forEach((node) => {
      const unsubscribe = mqttClient.subscribeNodeStatus(node.id, (status: number) => {
        statusMap.set(node.id, status)
        const count = Array.from(statusMap.values()).filter((s) => s === 1).length
        setOnlineNodes(count)
      })
      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [nodes])

  const loadData = async () => {
    try {
      setLoading(true)
      const [devicesData, groupsData, nodesData] = await Promise.all([
        apiClient.getDevices(),
        apiClient.getTeleopGroups(),
        apiClient.getNodes(),
      ])
      setDevices(devicesData)
      setTeleopGroups(groupsData)
      setNodes(nodesData)
      setOnlineNodes(nodesData.filter((n) => n.status === 1).length)
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

  const totalDevices = devices.length
  const totalGroups = teleopGroups.length

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "md:ml-16" : "md:ml-56")}>
          <Header />
          <main className="mt-14 p-4 md:p-6">
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
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "md:ml-16" : "md:ml-56")}>
        <Header />
        <main className="mt-14 p-4 md:p-6">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">设备总数</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{totalDevices}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Bot className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">遥操作组</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{totalGroups}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                  <Boxes className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">在线节点</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{onlineNodes}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">系统状态</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Server className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">后端服务</p>
                    <p className="text-xs text-muted-foreground">运行中</p>
                  </div>
                </div>
                <div className="rounded-full bg-success px-3 py-1 text-xs font-medium text-success-foreground">
                  正常
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Wifi className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">节点连接</p>
                    <p className="text-xs text-muted-foreground">
                      {onlineNodes} / {nodes.length} 在线
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    onlineNodes > 0 ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {onlineNodes > 0 ? "已连接" : "离线"}
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
