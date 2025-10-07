"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface DataItem {
  id: string
  name: string
  size: string
  date: string
  type: "recording" | "teaching" | "cache"
}

export default function CleanupPage() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [cleaning, setCleaning] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const [dataItems] = useState<DataItem[]>([
    { id: "1", name: "过期录制数据 2025-01", size: "2.3 GB", date: "2025-01-15", type: "recording" },
    { id: "2", name: "临时缓存文件", size: "450 MB", date: "2025-08-20", type: "cache" },
    { id: "3", name: "旧版示教数据", size: "1.1 GB", date: "2025-02-10", type: "teaching" },
    { id: "4", name: "系统日志文件", size: "320 MB", date: "2025-07-01", type: "cache" },
  ])

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const toggleAll = () => {
    if (selectedItems.size === dataItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(dataItems.map((item) => item.id)))
    }
  }

  const handleCleanup = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "请选择要清理的数据",
        variant: "destructive",
      })
      return
    }

    setCleaning(true)
    setProgress(0)

    // Simulate cleanup process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setProgress(i)
    }

    setCleaning(false)
    setProgress(0)
    setSelectedItems(new Set())

    toast({
      title: "清理完成",
      description: `已清理 ${selectedItems.size} 项数据`,
    })
  }

  const totalSize = dataItems
    .filter((item) => selectedItems.has(item.id))
    .reduce((acc, item) => {
      const size = Number.parseFloat(item.size)
      const unit = item.size.includes("GB") ? 1024 : 1
      return acc + size * unit
    }, 0)

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header />
        <main className="mt-16 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">作业数据清理演示</h1>
            <p className="mt-1 text-sm text-muted-foreground">清理过期和不需要的数据以释放存储空间</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Trash2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">可清理数据</p>
                  <p className="text-xl font-semibold">{dataItems.length} 项</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">已选择</p>
                  <p className="text-xl font-semibold">{selectedItems.size} 项</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">可释放空间</p>
                  <p className="text-xl font-semibold">{totalSize.toFixed(2)} MB</p>
                </div>
              </div>
            </Card>
          </div>

          {cleaning && (
            <Card className="mb-6 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">清理进度</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </Card>
          )}

          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={selectedItems.size === dataItems.length} onCheckedChange={toggleAll} />
                <span className="text-sm font-medium">全选</span>
              </div>
              <Button onClick={handleCleanup} disabled={cleaning || selectedItems.size === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                清理选中项
              </Button>
            </div>
          </Card>

          <div className="space-y-3">
            {dataItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                    <div>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>大小: {item.size}</span>
                        <span>日期: {item.date}</span>
                        <span className="capitalize">类型: {item.type}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setSelectedItems(new Set([item.id]))
                      handleCleanup()
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
