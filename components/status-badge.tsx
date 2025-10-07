import { cn } from "@/lib/utils"
import type { DeviceStatus, TeleopGroupStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: DeviceStatus | TeleopGroupStatus
  type?: "device" | "teleop"
  className?: string
}

export function StatusBadge({ status, type = "device", className }: StatusBadgeProps) {
  const getStatusInfo = () => {
    if (type === "device") {
      switch (status as DeviceStatus) {
        case 0:
          return { label: "设备离线", color: "bg-muted text-muted-foreground" }
        case 1:
          return { label: "设备在线", color: "bg-success/10 text-success border-success/20" }
        case 2:
          return { label: "设备重连中", color: "bg-warning/10 text-warning border-warning/20" }
        default:
          return { label: "未知", color: "bg-muted text-muted-foreground" }
      }
    } else {
      switch (status as TeleopGroupStatus) {
        case 0:
          return { label: "未录制", color: "bg-muted text-muted-foreground" }
        case 1:
          return { label: "录制中", color: "bg-destructive/10 text-destructive border-destructive/20" }
        default:
          return { label: "未知", color: "bg-muted text-muted-foreground" }
      }
    }
  }

  const { label, color } = getStatusInfo()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        color,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
