"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot } from "lucide-react"
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
import { RealTimeDeviceCard } from "@/components/real-time-device-card"
import { useSidebar } from "@/components/sidebar-context"
import cn from "classnames"

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
  const { isCollapsed } = useSidebar()

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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "md:ml-16" : "md:ml-56")}>
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
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "md:ml-16" : "md:ml-56")}>
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
              return (
                <RealTimeDeviceCard
                  key={device.id}
                  device={device}
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
