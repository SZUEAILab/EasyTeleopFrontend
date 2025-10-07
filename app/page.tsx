"use client"

import { useEffect, useState } from "react"
import { Plus, AlertCircle, SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DeviceConfigModal } from "@/components/device-config-modal"
import { TeleopConfigModal } from "@/components/teleop-config-modal"
import { RealTimeDeviceCard } from "@/components/real-time-device-card"
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
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Device, TeleopGroup } from "@/lib/types"

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [teleopGroups, setTeleopGroups] = useState<TeleopGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [teleopModalOpen, setTeleopModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | undefined>()
  const [editingTeleop, setEditingTeleop] = useState<TeleopGroup | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDeviceId, setDeletingDeviceId] = useState<number | null>(null)
  const { toast } = useToast()

  const nodeId = 1

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

  const handleAddTeleop = () => {
    setEditingTeleop(undefined)
    setTeleopModalOpen(true)
  }

  const handleEditTeleop = (group: TeleopGroup) => {
    setEditingTeleop(group)
    setTeleopModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Header />
          <main className="mt-16 p-6">
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

  const allDevicesOffline = devices.length > 0 && devices.every((d) => d.status === 0)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="mt-16 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">设备管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理您的机器人设备和遥操作组</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAddDevice}>
                <Plus className="mr-2 h-4 w-4" />
                添加设备
              </Button>
              <Button onClick={handleAddTeleop}>
                <Plus className="mr-2 h-4 w-4" />
                创建遥操作组
              </Button>
            </div>
          </div>

          {allDevicesOffline && (
            <Card className="mb-6 border-warning/20 bg-warning/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-warning">所有设备离线</h3>
                  <p className="mt-1 text-sm text-warning/80">当前没有设备在线，请检查设备连接状态</p>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {teleopGroups.map((group) => {
              const groupDevices = devices.filter((d) => group.config.includes(d.id))

              return (
                <Card key={group.id} className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                        <img src="/futuristic-helper-robot.png" alt={group.name} className="h-12 w-12 object-contain" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{group.name}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">适配型号：{group.type}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          最近上线：{new Date(group.updated_at).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => handleEditTeleop(group)}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      遥操配置
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupDevices.map((device) => (
                      <RealTimeDeviceCard
                        key={device.id}
                        device={device}
                        onEdit={handleEditDevice}
                        onDelete={handleDeleteDevice}
                      />
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>

          {teleopGroups.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <SettingsIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">暂无遥操作组</h3>
                <p className="mt-2 text-sm text-muted-foreground">开始添加您的第一个遥操作组</p>
                <Button className="mt-4" onClick={handleAddTeleop}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建遥操作组
                </Button>
              </div>
            </Card>
          )}
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
            <AlertDialogTitle>确认删除这设备信息吗？</AlertDialogTitle>
            <AlertDialogDescription>一系列的信息将会被删除，可能会影响长，也可以仅停用标签。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDevice} className="bg-primary text-primary-foreground">
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
