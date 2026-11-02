"use client"

import { BarChart3, BookOpen, GitPullRequestArrow, Lock, PenSquare, Settings, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { canAccessView, isLockedView, useApp, type View } from "../app-provider"
import { cn } from "@/lib/utils"

const NAV: { id: View; label: string; icon: typeof BookOpen }[] = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "workspace", label: "Content Workspace", icon: PenSquare },
  { id: "brand-hub", label: "Brand Hub", icon: BookOpen },
  { id: "approvals", label: "Approvals", icon: GitPullRequestArrow },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings & Audit", icon: Settings },
]

export function AppSidebar() {
  const { view, setView, posts, user } = useApp()
  const isCreator = user?.role === "creator"
  const visiblePosts = isCreator ? posts.filter((p) => p.author === user.name) : posts
  const pending = visiblePosts.filter((p) => p.status === "pending").length
  const navItems = user
    ? NAV.filter((item) => canAccessView(user.role, item.id) || isLockedView(user.role, item.id))
    : []

  return (
    <nav
      aria-label="Primary"
      className="sticky top-14 z-30 flex shrink-0 gap-1 overflow-x-auto border-b bg-sidebar/80 p-2 backdrop-blur md:h-[calc(100dvh-3.5rem)] md:w-60 md:flex-col md:border-r md:border-b-0 md:p-3"
    >
      <p className="hidden px-2 pb-1 text-xs font-medium text-muted-foreground md:block">Workspace</p>
      {navItems.map(({ id, label, icon: Icon }) => {
        const active = view === id
        const locked = !!user && isLockedView(user.role, id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              setView(id)
              if (locked) toast.error("Access Denied: Requires Manager/Admin privileges")
            }}
            data-tour-nav={id}
            aria-current={active ? "page" : undefined}
            aria-label={locked ? `${label} (locked, requires Manager or Admin)` : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-card font-medium text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              locked && !active && "opacity-70",
            )}
          >
            <Icon className={cn("size-4", active && !locked && "text-primary")} aria-hidden />
            {label}
            {locked ? <Lock className="ml-auto size-3.5 text-muted-foreground" aria-hidden /> : null}
            {id === "approvals" && pending > 0 ? (
              <span className="ml-auto rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {pending}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
