"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Play, Square, Boxes, Circle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { TeleopGroup, Device, Node } from "@/lib/types"
import { TeleopConfigModal } from "@/components/teleop-config-modal"
import { Badge } from "@/components/ui/badge"
import { useMqttTeleopStatus, useMqttCollectingStatus } from "@/hooks/use-mqtt-status"

function DeviceStatusCard({ device, nodeId }: { device: Device; nodeId: number }) {
  const [status, setStatus] = useState(device.status)

  useEffect(() => {
    const unsubscribe = require("@/lib/mqtt-client").mqttClient.subscribeDeviceStatus(
      nodeId,
      device.id,
      (newStatus: number) => setStatus(newStatus),
    )
    return unsubscribe
  }, [nodeId, device.id])

  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background p-2">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            status === 1 ? "bg-green-500" : status === 2 ? "bg-yellow-500" : "bg-gray-300"
          }`}
        />
        <span className="text-xs font-medium">{device.name}</span>
      </div>
      <span className="text-xs text-muted-foreground">{device.category}</span>
    </div>
  )
}

function TeleopGroupCard({
  group,
  node,
  devices,
  onStart,
  onStop,
  onEdit,
  actionLoading,
}: {
  group: TeleopGroup
  node?: Node
  devices: Device[]
  onStart: (id: number) => void
  onStop: (id: number) => void
  onEdit: (group: TeleopGroup) => void
  actionLoading: number | null
}) {
  const runningStatus = useMqttTeleopStatus(group.node_id, group.id)
  const collectingStatus = useMqttCollectingStatus(group.node_id, group.id)

  const isRunning = runningStatus === 1
  const isCollecting = collectingStatus === 1
  const groupDevices = devices.filter((d) => group.config.includes(d.id))

  return (
    <Card className="flex flex-col p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              isRunning ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <Boxes className={`h-6 w-6 ${isRunning ? "text-green-500" : "text-gray-400"}`} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{group.name}</h3>
            <p className="text-xs text-muted-foreground">{group.type}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-sm text-muted-foreground">{group.description}</p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">运行状态:</span>
          <Badge variant={isRunning ? "default" : "outline"} className="gap-1">
            <Circle className={`h-2 w-2 ${isRunning ? "fill-current" : ""}`} />
            {isRunning ? "运行中" : "已停止"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">数据采集:</span>
          <Badge variant={isCollecting ? "default" : "outline"} className="gap-1">
            <Circle className={`h-2 w-2 ${isCollecting ? "fill-current" : ""}`} />
            {isCollecting ? "采集中" : "未采集"}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          <div>节点: {node?.uuid || group.node_id}</div>
          <div>设备数: {groupDevices.length}</div>
        </div>

        {groupDevices.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-medium text-foreground">关联设备:</div>
            <div className="space-y-1.5">
              {groupDevices.map((device) => (
                <DeviceStatusCard key={device.id} device={device} nodeId={group.node_id} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        {isRunning ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onStop(group.id)}
            disabled={actionLoading === group.id}
          >
            <Square className="mr-1 h-3 w-3" />
            {actionLoading === group.id ? "停止中..." : "停止"}
          </Button>
        ) : (
          <Button size="sm" className="flex-1" onClick={() => onStart(group.id)} disabled={actionLoading === group.id}>
            <Play className="mr-1 h-3 w-3" />
            {actionLoading === group.id ? "启动中..." : "启动"}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onEdit(group)}>
          配置
        </Button>
      </div>
    </Card>
  )
}

export default function TeleopGroupsPage() {
  const [teleopGroups, setTeleopGroups] = useState<TeleopGroup[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [teleopModalOpen, setTeleopModalOpen] = useState(false)
  const [editingTeleop, setEditingTeleop] = useState<TeleopGroup | undefined>()
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>()
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [groupsData, devicesData, nodesData] = await Promise.all([
        apiClient.getTeleopGroups(),
        apiClient.getDevices(),
        apiClient.getNodes(),
      ])
      setTeleopGroups(groupsData)
      setDevices(devicesData)
      setNodes(nodesData)
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

  const handleAddTeleop = () => {
    setEditingTeleop(undefined)
    setSelectedNodeId(undefined)
    setTeleopModalOpen(true)
  }

  const handleEditTeleop = (group: TeleopGroup) => {
    setEditingTeleop(group)
    setSelectedNodeId(group.node_id)
    setTeleopModalOpen(true)
  }

  const handleStartTeleop = async (id: number) => {
    try {
      setActionLoading(id)
      await apiClient.startTeleopGroup(id)
      toast({
        title: "启动成功",
        description: "遥操作组已启动",
      })
      loadData()
    } catch (error) {
      toast({
        title: "启动失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleStopTeleop = async (id: number) => {
    try {
      setActionLoading(id)
      await apiClient.stopTeleopGroup(id)
      toast({
        title: "停止成功",
        description: "遥操作组已停止",
      })
      loadData()
    } catch (error) {
      toast({
        title: "停止失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">遥操组管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理遥操作组，控制运行状态和数据采集</p>
            </div>
            <Button onClick={handleAddTeleop}>
              <Plus className="mr-2 h-4 w-4" />
              新建遥操组
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {teleopGroups.map((group) => {
              const node = nodes.find((n) => n.id === group.node_id)
              return (
                <TeleopGroupCard
                  key={group.id}
                  group={group}
                  node={node}
                  devices={devices}
                  onStart={handleStartTeleop}
                  onStop={handleStopTeleop}
                  onEdit={handleEditTeleop}
                  actionLoading={actionLoading}
                />
              )
            })}
          </div>

          {teleopGroups.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Boxes className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium text-foreground">暂无遥操组</h3>
                <p className="mt-2 text-sm text-muted-foreground">点击"新建遥操组"按钮创建新的遥操作组</p>
              </div>
            </Card>
          )}
        </main>
      </div>

      <TeleopConfigModal
        open={teleopModalOpen}
        onOpenChange={setTeleopModalOpen}
        teleopGroup={editingTeleop}
        nodeId={selectedNodeId}
        nodes={nodes}
        devices={devices}
        onSuccess={loadData}
      />
    </div>
  )
}
