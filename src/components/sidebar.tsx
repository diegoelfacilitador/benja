"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  DollarSign,
  MessageSquare,
  BarChart3,
  LogOut,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "Plan Semanal", icon: ClipboardList },
  { href: "/operativo", label: "Operativo", icon: CheckSquare },
  { href: "/financiero", label: "Financiero", icon: DollarSign },
  { href: "/centro", label: "Centro", icon: MessageSquare },
  { href: "/el-centro", label: "El Centro GTM", icon: ClipboardList },
  { href: "/gestion", label: "Gestión", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold tracking-tight">Control Hub</h1>
        <p className="text-xs text-muted-foreground mt-1">Gestión semanal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Salir
        </Button>
      </div>
    </aside>
  )
}
