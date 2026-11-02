"use client"

import { GitPullRequestArrow, Lock, PenSquare } from "lucide-react"
import { useApp } from "../app-provider"
import { Button } from "@/components/ui/button"

const VIEW_LABEL = { analytics: "Analytics", settings: "Settings & Audit" } as const

export function AccessDenied({ view }: { view: keyof typeof VIEW_LABEL }) {
  const { setView } = useApp()

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center md:p-12"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Lock className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-balance">Access Denied: Requires Manager/Admin privileges</h2>
        <p className="max-w-md text-sm text-muted-foreground text-pretty">
          {VIEW_LABEL[view]} is restricted to Manager and Admin accounts. Ask a workspace manager if you need access.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => setView("approvals")}>
          <GitPullRequestArrow aria-hidden />
          View my submissions
        </Button>
        <Button onClick={() => setView("workspace")}>
          <PenSquare aria-hidden />
          Back to Workspace
        </Button>
      </div>
    </div>
  )
}
