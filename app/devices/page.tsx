"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot, Edit, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Device, Node } from "@/lib/types"
import { DeviceConfigModal } from "@/components/device-config-modal"
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
import { Badge } from "@/components/ui/badge"
import { useMqttDeviceStatus } from "@/hooks/use-mqtt-status"

// 创建一个独立的组件来处理设备状态显示，确保Hook调用的一致性
function DeviceStatusBadge({ nodeId, deviceId, initialStatus }: { nodeId: number; deviceId: number; initialStatus: 0 | 1 | 2 }) {
  const mqttStatus = useMqttDeviceStatus(nodeId, deviceId)
  const status = mqttStatus !== undefined ? mqttStatus : initialStatus

  switch (status) {
    case 1:
      return <Badge className="bg-success text-success-foreground">在线</Badge>
    case 2:
      return (
        <Badge variant="outline" className="border-warning text-warning">
          重连中
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
          离线
        </Badge>
      )
  }
}

// 创建一个独立的组件来处理设备卡片，确保Hook调用的一致性
function DeviceCard({ 
  device, 
  node, 
  onEdit, 
  onDelete 
}: { 
  device: Device; 
  node: Node | undefined; 
  onEdit: (device: Device) => void;
  onDelete: (id: number) => void;
}) {
  const mqttStatus = useMqttDeviceStatus(device.node_id, device.id)
  const status = mqttStatus !== undefined ? mqttStatus : device.status

  const getCategoryIcon = (category: string) => {
    return <Bot className="h-5 w-5" />
  }

  return (
    <Card key={device.id} className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              status === 1 ? "bg-blue-50" : "bg-gray-50"
            }`}
          >
            {getCategoryIcon(device.category)}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{device.name}</h3>
            <p className="text-xs text-muted-foreground">{device.type}</p>
          </div>
        </div>
        <DeviceStatusBadge nodeId={device.node_id} deviceId={device.id} initialStatus={device.status} />
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground">{device.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>节点: {node?.uuid || device.node_id}</span>
          <span>•</span>
          <span>{device.category}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-transparent"
          onClick={() => onEdit(device)}
        >
          <Edit className="mr-1 h-3 w-3" />
          编辑
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
          onClick={() => onDelete(device.id)}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          删除
        </Button>
      </div>
    </Card>
  )
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | undefined>()
  const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDeviceId, setDeletingDeviceId] = useState<number | null>(null)
  const { toast } = useToast()


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [devicesData, nodesData] = await Promise.all([apiClient.getDevices(), apiClient.getNodes()])
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

  const handleAddDevice = () => {
    setEditingDevice(undefined)
    setSelectedNodeId(undefined)
    setDeviceModalOpen(true)
  }

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device)
    setSelectedNodeId(device.node_id)
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

  const getStatusBadge = (status: 0 | 1 | 2) => {
    switch (status) {
      case 1:
        return <Badge className="bg-success text-success-foreground">在线</Badge>
      case 2:
        return (
          <Badge variant="outline" className="border-warning text-warning">
            重连中
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
            离线
          </Badge>
        )
    }
  }

  const getCategoryIcon = (category: string) => {
    return <Bot className="h-5 w-5" />
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
              <h1 className="text-2xl font-semibold text-foreground">设备管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理所有设备，包括在线和离线设备</p>
            </div>
            <Button onClick={handleAddDevice}>
              <Plus className="mr-2 h-4 w-4" />
              添加设备
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => {
              const node = nodes.find((n) => n.id === device.node_id)
              return (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  node={node}
                  onEdit={handleEditDevice}
                  onDelete={handleDeleteDevice}
                />
              )
            })}
          </div>

          {devices.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium text-foreground">暂无设备</h3>
                <p className="mt-2 text-sm text-muted-foreground">点击"添加设备"按钮添加新设备</p>
              </div>
            </Card>
          )}
        </main>
      </div>

      <DeviceConfigModal
        open={deviceModalOpen}
        onOpenChange={setDeviceModalOpen}
        device={editingDevice}
        nodeId={selectedNodeId}
        nodes={nodes}
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
