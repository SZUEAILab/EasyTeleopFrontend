"use client"

import { Home, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/": "仪表盘",
  "/devices": "设备管理",
  "/data": "数据管理",
  "/settings": "系统设置",
}

export function Header() {
  const pathname = usePathname()
  const pageTitle = pageTitles[pathname] || "遥操作管理平台"

  return (
    <header className="fixed left-56 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Home className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground">管理员</span>
      </div>
    </header>
  )
}
