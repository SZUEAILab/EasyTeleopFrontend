"use client"

import { Home, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

const pageTitles: Record<string, string> = {
  "/": "仪表盘",
  "/nodes": "节点管理",
  "/vrs": "VR头显管理",
  "/devices": "设备管理",
  "/teleop-groups": "遥操组管理",
  "/data": "数据管理",
  "/settings": "系统设置",
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { isCollapsed, toggleSidebar } = useSidebar()

  let pageTitle = pageTitles[pathname] || "遥操作管理平台"
  if (pathname.startsWith("/nodes/") && pathname !== "/nodes") {
    pageTitle = "节点详情"
  }

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6 transition-all duration-300",
        isCollapsed ? "left-0 md:left-16" : "left-0 md:left-56",
      )}
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push("/")}>
          <Home className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold text-foreground hidden sm:block">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground hidden sm:inline">管理员</span>
      </div>
    </header>
  )
}
