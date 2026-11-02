"use client"

import { Building2, Check, ChevronsUpDown, LogOut, Lock, Sparkles } from "lucide-react"
import { useState } from "react"
import { useApp } from "../app-provider"
import { Badge, Modal, Popover } from "../kit"
import { Logo } from "../logo"
import { ThemeToggle } from "./theme-toggle"
import { TENANTS } from "@/lib/seed"
import { cn } from "@/lib/utils"

const ROLE_LABEL = { creator: "Creator", manager: "Manager", admin: "Admin" } as const

export function AppHeader() {
  const { user, signOut, tenant, setTenantId } = useApp()
  const [geminiOpen, setGeminiOpen] = useState(false)
  if (!user) return null

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur-xl">
      <Logo className="mr-1" />
      <span className="h-5 w-px bg-border" aria-hidden />

      <Popover
        label="Switch tenant"
        align="start"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Building2 className="size-4 text-muted-foreground" aria-hidden />
            <span>{tenant.name}</span>
            <Badge tone="primary" className="hidden sm:inline-flex">
              {tenant.tier}
            </Badge>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" aria-hidden />
          </button>
        )}
      >
        {(close) => (
          <div className="flex flex-col">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Tenants</p>
            {TENANTS.map((t) => (
              <button
                key={t.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  setTenantId(t.id)
                  close()
                }}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.tier} workspace</span>
                </span>
                {t.id === tenant.id ? <Check className="size-4 text-primary" aria-hidden /> : null}
              </button>
            ))}
          </div>
        )}
      </Popover>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setGeminiOpen(true)}
          className="hidden items-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"
        >
          <Sparkles className="size-3.5 text-primary" aria-hidden />
          Powered by Google Gemini API
        </button>
        <ThemeToggle />

        <Popover
          label="Account menu"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Open account menu"
              className={cn(
                "flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-xs font-semibold text-white ring-2 ring-background transition-shadow hover:ring-primary/30",
                open && "ring-primary/40",
              )}
            >
              {user.initials}
            </button>
          )}
        >
          {(close) => (
            <div className="flex flex-col">
              <div className="flex flex-col gap-1 px-2 py-2">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge tone="primary">{ROLE_LABEL[user.role]}</Badge>
                  <Badge>{tenant.name}</Badge>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <p className="flex items-start gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                <Lock className="mt-0.5 size-3 shrink-0" aria-hidden />
                Role is locked for this session. Sign out to switch accounts.
              </p>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  close()
                  signOut()
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" aria-hidden />
                Log Out / Switch Account
              </button>
            </div>
          )}
        </Popover>
      </div>

      <Modal
        open={geminiOpen}
        onClose={() => setGeminiOpen(false)}
        title="AI Model & Privacy Disclosure"
        description="How Inkloom uses the Google Gemini API."
      >
        <ul className="flex flex-col gap-3 text-sm">
          {[
            ["Model usage", "Compliance analysis, tone suggestions and document ingestion are processed by Gemini 2.5 Flash and Gemini 2.5 Pro."],
            ["Tenant sandboxing", "Guidelines and drafts are scoped to the active tenant and never shared across brands."],
            ["No training on your data", "Content sent via the API is not used to train Google foundation models."],
            ["Human in the loop", "AI output is advisory. Publishing always requires Manager or Admin approval."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3 rounded-lg border bg-muted/40 p-3">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{title}</span>
                <span className="text-muted-foreground">{body}</span>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </header>
  )
}
