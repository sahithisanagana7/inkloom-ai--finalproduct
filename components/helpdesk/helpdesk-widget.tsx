"use client"

import { Compass, LifeBuoy, PlayCircle, Sparkles, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { canAccessView, useApp } from "../app-provider"
import { AssistantChat } from "./assistant-chat"
import { GuidedTour } from "./guided-tour"
import { TOURS, type Tour } from "@/lib/help-tours"
import { cn } from "@/lib/utils"

type Tab = "guides" | "assistant"

export function HelpdeskWidget() {
  const { user } = useApp()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("guides")
  const [activeTour, setActiveTour] = useState<{ tour: Tour; step: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const exitTour = useCallback(() => setActiveTour(null), [])

  if (!user) return null

  const tours = TOURS.filter((t) => t.roles.includes(user.role))
    .map((t) => ({ ...t, steps: t.steps.filter((s) => canAccessView(user.role, s.view)) }))
    .filter((t) => t.steps.length > 0)

  return (
    <>
      {activeTour ? (
        <GuidedTour
          tour={activeTour.tour}
          stepIndex={activeTour.step}
          onStep={(step) => setActiveTour((t) => (t ? { ...t, step } : t))}
          onExit={exitTour}
        />
      ) : null}

      <div
          id="helpdesk-panel"
          role="dialog"
          aria-label="Help and onboarding"
          hidden={!open || !!activeTour}
          className={cn(
            "fixed right-4 bottom-20 z-50 flex h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-popover/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2",
            (!open || activeTour) && "hidden",
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold">Help & Onboarding</h2>
              <p className="text-xs text-muted-foreground">Guides and answers for your workflow</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-1 border-b p-1.5" role="tablist" aria-label="Help sections">
            {(
              [
                { id: "guides", label: "Guides", icon: Compass },
                { id: "assistant", label: "Ask AI", icon: Sparkles },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  tab === id ? "bg-card text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <div
            className={cn("flex flex-1 flex-col gap-2 overflow-y-auto p-4", tab !== "guides" && "hidden")}
            role="tabpanel"
            aria-label="Guides"
          >
              <p className="pb-1 text-xs text-muted-foreground">Quick-start tours for the {user.role} role.</p>
              {tours.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTour({ tour: t, step: 0 })
                    setOpen(false)
                  }}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PlayCircle className="size-4.5" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.description} · {t.steps.length} steps
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTab("assistant")}
                className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Sparkles className="size-3.5" aria-hidden />
                Have a question? Ask the AI assistant
              </button>
          </div>
          <div
            className={cn("flex min-h-0 flex-1 flex-col", tab !== "assistant" && "hidden")}
            role="tabpanel"
            aria-label="Ask AI"
          >
            <AssistantChat />
          </div>
        </div>

      <button
        type="button"
        onClick={() => {
          if (activeTour) setActiveTour(null)
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-controls="helpdesk-panel"
        aria-label={open ? "Close help" : "Open help and onboarding"}
        className="fixed right-4 bottom-4 z-50 flex h-12 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
      >
        {open ? <X className="size-4.5" aria-hidden /> : <LifeBuoy className="size-4.5" aria-hidden />}
        <span className="hidden sm:inline">{open ? "Close" : "Help"}</span>
      </button>
    </>
  )
}
