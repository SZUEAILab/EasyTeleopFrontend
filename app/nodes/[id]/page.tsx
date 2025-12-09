"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, Boxes, ArrowLeft, Server, Circle, Play, Square, Trash } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Device, TeleopGroup, Node } from "@/lib/types"
import { DeviceConfigModal } from "@/components/device-config-modal"
import { TeleopConfigModal } from "@/components/teleop-config-modal"
import { RealTimeDeviceCard } from "@/components/real-time-device-card"
import {
  useMqttNodeStatus,
  useMqttTeleopStatus,
  useMqttCollectingStatus,
  useMqttDeviceStatus,
} from "@/hooks/use-mqtt-status"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function DeviceStatusCard({ device, nodeId }: { device: Device; nodeId: number }) {
  const status = useMqttDeviceStatus(nodeId, device.id)

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
  devices,
  onStart,
  onStop,
  onEdit,
  onDelete,
  actionLoading,
}: {
  group: TeleopGroup
  devices: Device[]
  onStart: (id: number) => void
  onStop: (id: number) => void
  onEdit: (group: TeleopGroup) => void
  onDelete: (id: number) => void
  actionLoading: number | null
}) {
  const runningStatus = useMqttTeleopStatus(group.node_id, group.id)
  const collectingStatus = useMqttCollectingStatus(group.node_id, group.id)

  const isRunning = runningStatus === 1
  const isCollecting = collectingStatus === 1
  const groupDevices = devices.filter((d) => group.config.includes(d.id))

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
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
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onStart(group.id)}
              disabled={actionLoading === group.id}
            >
              <Play className="mr-1 h-3 w-3" />
              {actionLoading === group.id ? "启动中..." : "启动"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit(group)}>
            配置
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除遥操组 "{group.name}" 吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(group.id)
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function NodeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const nodeId = Number(params.id)

  const [node, setNode] = useState<Node | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [teleopGroups, setTeleopGroups] = useState<TeleopGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [teleopModalOpen, setTeleopModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | undefined>()
  const [editingTeleop, setEditingTeleop] = useState<TeleopGroup | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDeviceId, setDeletingDeviceId] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const { toast } = useToast()

  // 使用MQTT获取节点状态
  const mqttNodeStatus = useMqttNodeStatus(nodeId)

  useEffect(() => {
    loadData()
  }, [nodeId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [nodesData, devicesData, teleopData] = await Promise.all([
        apiClient.getNodes(),
        apiClient.getDevices(),
        apiClient.getTeleopGroups(),
      ])

      const currentNode = nodesData.find((n) => n.id === nodeId)
      setNode(currentNode || null)

      // 过滤出属于该节点的设备和遥操组
      setDevices(devicesData.filter((d) => d.node_id === nodeId))
      setTeleopGroups(teleopData.filter((t) => t.node_id === nodeId))
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

  // Device handlers
  const handleAddDevice = () => {
    setEditingDevice(undefined)
    setDeviceModalOpen(true)
  }

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device)
    setDeviceModalOpen(true)
  }

  const handleDeleteDevice = (id: number) => {
    setDeletingDeviceId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteDevice = async () => {
    if (!deletingDeviceId) return

    try {
      await apiClient.deleteDevice(deletingDeviceId)
      toast({
        title: "删除成功",
        description: "设备已删除",
      })
      loadData()
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingDeviceId(null)
    }
  }

  // Teleop handlers
  const handleAddTeleop = () => {
    setEditingTeleop(undefined)
    setTeleopModalOpen(true)
  }

  const handleEditTeleop = (group: TeleopGroup) => {
    setEditingTeleop(group)
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

  const handleDeleteTeleop = async (id: number) => {
    try {
      setActionLoading(id)
      await apiClient.deleteTeleopGroup(id)
      toast({
        title: "删除成功",
        description: "遥操作组已删除",
      })
      loadData()
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  // 计算节点在线状态（优先使用MQTT状态）
  const isNodeOnline = mqttNodeStatus !== null ? mqttNodeStatus === 1 : node?.status === true

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

  if (!node) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-56 flex-1">
          <Header />
          <main className="mt-14 p-6">
            <Card className="p-12">
              <div className="text-center">
                <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium text-foreground">节点不存在</h3>
                <p className="mt-2 text-sm text-muted-foreground">请返回节点列表</p>
                <Button className="mt-4" onClick={() => router.push("/nodes")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回节点列表
                </Button>
              </div>
            </Card>
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
          {/* 返回按钮和节点信息 */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push("/nodes")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回节点列表
            </Button>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      isNodeOnline ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    <Server className={`h-7 w-7 ${isNodeOnline ? "text-green-500" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">节点 {node.id}</h1>
                    <p className="text-sm text-muted-foreground">UUID: {node.uuid}</p>
                  </div>
                </div>
                <Badge variant={isNodeOnline ? "default" : "outline"} className="gap-1.5">
                  <Circle className={`h-2 w-2 ${isNodeOnline ? "fill-current" : ""}`} />
                  {isNodeOnline ? "在线" : "离线"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">设备数量:</span>
                  <span className="ml-2 font-medium">{devices.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">遥操组数量:</span>
                  <span className="ml-2 font-medium">{teleopGroups.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">创建时间:</span>
                  <span className="ml-2 font-medium">
                    {node.created_at ? new Date(node.created_at).toLocaleString() : "-"}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* 设备管理区域 */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">设备管理</h2>
                <p className="text-sm text-muted-foreground">该节点下的所有设备</p>
              </div>
              <Button onClick={handleAddDevice} disabled={!isNodeOnline}>
                <Plus className="mr-2 h-4 w-4" />
                添加设备
              </Button>
            </div>

            {devices.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => (
                  <RealTimeDeviceCard
                    key={device.id}
                    device={device}
                    onEdit={handleEditDevice}
                    onDelete={handleDeleteDevice}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8">
                <div className="text-center">
                  <Bot className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <h3 className="mt-3 text-sm font-medium text-foreground">暂无设备</h3>
                  <p className="mt-1 text-sm text-muted-foreground">点击"添加设备"按钮添加新设备</p>
                </div>
              </Card>
            )}
          </div>

          {/* 遥操组管理区域 */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">遥操组管理</h2>
                <p className="text-sm text-muted-foreground">该节点下的所有遥操组</p>
              </div>
              <Button onClick={handleAddTeleop} disabled={!isNodeOnline}>
                <Plus className="mr-2 h-4 w-4" />
                新建遥操组
              </Button>
            </div>

            {teleopGroups.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {teleopGroups.map((group) => (
                  <TeleopGroupCard
                    key={group.id}
                    group={group}
                    devices={devices}
                    onStart={handleStartTeleop}
                    onStop={handleStopTeleop}
                    onEdit={handleEditTeleop}
                    onDelete={handleDeleteTeleop}
                    actionLoading={actionLoading}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8">
                <div className="text-center">
                  <Boxes className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <h3 className="mt-3 text-sm font-medium text-foreground">暂无遥操组</h3>
                  <p className="mt-1 text-sm text-muted-foreground">点击"新建遥操组"按钮创建新的遥操作组</p>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      <DeviceConfigModal
        open={deviceModalOpen}
        onOpenChange={setDeviceModalOpen}
        device={editingDevice}
        nodeId={nodeId}
        onSuccess={loadData}
      />

      <TeleopConfigModal
        open={teleopModalOpen}
        onOpenChange={setTeleopModalOpen}
        teleopGroup={editingTeleop}
        nodeId={nodeId}
        devices={devices}
        onSuccess={loadData}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销，确定要删除该设备吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDevice}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
