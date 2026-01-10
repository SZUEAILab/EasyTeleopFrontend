"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Server, Wifi, WifiOff, Settings } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Node } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMqttNodeStatus } from "@/hooks/use-mqtt-status"
import { useSidebar } from "@/components/sidebar-context"
import cn from "classnames"

function NodeCard({ node }: { node: Node }) {
  const router = useRouter()
  const mqttStatus = useMqttNodeStatus(node.id)
  const isOnline = mqttStatus === 1

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              isOnline ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <Server className={`h-6 w-6 ${isOnline ? "text-green-500" : "text-gray-400"}`} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">节点 {node.id}</h3>
            <p className="text-xs text-muted-foreground">{node.uuid}</p>
          </div>
        </div>
        {isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{new Date(node.updated_at).toLocaleString("zh-CN")}</span>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              isOnline ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {isOnline ? "在线" : "离线"}
          </span>
          <Button variant="outline" size="sm" onClick={() => router.push(`/nodes/${node.id}`)}>
            <Settings className="mr-1 h-3 w-3" />
            管理
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newNodeUuid, setNewNodeUuid] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { isCollapsed } = useSidebar()

  useEffect(() => {
    loadNodes()
  }, [])

  const loadNodes = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getNodes()
      setNodes(data)
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

  const handleAddNode = async () => {
    if (!newNodeUuid.trim()) {
      toast({
        title: "请输入节点UUID",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await apiClient.registerNode(newNodeUuid)
      toast({
        title: "节点注册成功",
      })
      setShowAddDialog(false)
      setNewNodeUuid("")
      loadNodes()
    } catch (error) {
      toast({
        title: "注册失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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
              <h1 className="text-2xl font-semibold text-foreground">节点管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理所有遥操作节点</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              注册节点
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>

          {nodes.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium text-foreground">暂无节点</h3>
                <p className="mt-2 text-sm text-muted-foreground">点击"注册节点"按钮添加新节点</p>
              </div>
            </Card>
          )}
        </main>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>注册节点</DialogTitle>
            <DialogDescription>输入节点的UUID进行注册</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="uuid">节点UUID</Label>
              <Input
                id="uuid"
                placeholder="请输入节点UUID"
                value={newNodeUuid}
                onChange={(e) => setNewNodeUuid(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddNode} disabled={submitting}>
              {submitting ? "注册中..." : "确定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
