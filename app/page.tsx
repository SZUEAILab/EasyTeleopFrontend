"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Bot, Boxes, Activity, Server, Wifi } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Device, TeleopGroup } from "@/lib/types"

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [teleopGroups, setTeleopGroups] = useState<TeleopGroup[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [devicesData, groupsData] = await Promise.all([apiClient.getDevices(), apiClient.getTeleopGroups()])
      setDevices(devicesData)
      setTeleopGroups(groupsData)
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

  const onlineDevices = devices.filter((d) => d.status === 1).length
  const totalDevices = devices.length
  const totalGroups = teleopGroups.length

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
          <div className="grid gap-4 md:grid-cols-3 mb-6">
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
                  <p className="mt-2 text-3xl font-semibold text-foreground">{onlineDevices}</p>
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
                    <p className="text-xs text-muted-foreground">Node-1</p>
                  </div>
                </div>
                <div className="rounded-full bg-success px-3 py-1 text-xs font-medium text-success-foreground">
                  已连接
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
