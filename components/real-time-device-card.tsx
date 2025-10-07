"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { useMqttDeviceStatus } from "@/hooks/use-mqtt-status"
import { SettingsIcon, Trash2 } from "lucide-react"
import type { Device } from "@/lib/types"

interface RealTimeDeviceCardProps {
  device: Device
  onEdit: (device: Device) => void
  onDelete: (id: number) => void
}

export function RealTimeDeviceCard({ device, onEdit, onDelete }: RealTimeDeviceCardProps) {
  const liveStatus = useMqttDeviceStatus(device.node_id, device.id)

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{device.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{device.description}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(device)}>
            <SettingsIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(device.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <StatusBadge status={liveStatus} type="device" />
    </Card>
  )
}
