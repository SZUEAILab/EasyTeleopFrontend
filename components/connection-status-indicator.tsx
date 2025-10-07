"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { mqttClient } from "@/lib/mqtt-client"
import { cn } from "@/lib/utils"

export function ConnectionStatusIndicator() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const checkConnection = () => {
      setConnected(mqttClient.isConnected())
    }

    checkConnection()
    const interval = setInterval(checkConnection, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
        connected ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      <span>{connected ? "实时连接" : "连接断开"}</span>
    </div>
  )
}
