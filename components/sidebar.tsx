"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Settings, Database, Boxes, ChevronDown, Server, Bot, Headphones } from "lucide-react"
import { useState } from "react"

const navigation = [
  {
    name: "仪表盘",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "遥操管理",
    icon: Boxes,
    children: [
      {
        name: "节点管理",
        href: "/nodes",
        icon: Server,
      },
      {
        name: "VR头显管理",
        href: "/vrs",
        icon: Headphones,
      },
      {
        name: "设备管理",
        href: "/devices",
        icon: Bot,
      },
      {
        name: "遥操组管理",
        href: "/teleop-groups",
        icon: Boxes,
      }
    ],
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["遥操管理"])

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

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
          if (item.children) {
            const isExpanded = expandedMenus.includes(item.name)
            const hasActiveChild = item.children.some((child) => pathname === child.href)

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    hasActiveChild
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "")} />
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          )}
                        >
                          <child.icon className="h-4 w-4" />
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

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
