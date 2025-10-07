"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { config } from "@/lib/config"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-56 flex-1">
        <Header />
        <main className="mt-14 p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">系统设置</h1>
            <p className="mt-1 text-sm text-muted-foreground">配置系统参数和连接信息</p>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">后端服务配置</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-url">API 地址</Label>
                  <Input id="api-url" value={config.apiUrl} disabled className="bg-muted" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">MQTT 服务配置</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mqtt-url">MQTT 地址</Label>
                  <Input id="mqtt-url" value={config.mqttUrl} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mqtt-username">用户名</Label>
                  <Input id="mqtt-username" value={config.mqttUsername} disabled className="bg-muted" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground">关于</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>机器人遥操控制平台 v1.0.0</p>
                <p>© 2025 SZUEAILab. All rights reserved.</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
