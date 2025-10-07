"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Settings, Database, Boxes } from "lucide-react"

const navigation = [
  {
    name: "仪表盘",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "设备管理",
    href: "/devices",
    icon: Boxes,
  },
  {
    name: "数据管理",
    href: "/data",
    icon: Database,
  },
  {
    name: "系统设置",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Boxes className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">遥操作管理平台</span>
      </div>

      <nav className="space-y-0.5 p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
