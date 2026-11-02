"use client"

import { BookText, Database, Eye, Lock, MessageSquareQuote, Palette, Plus } from "lucide-react"
import { useState } from "react"
import { useApp, useAuth } from "../app-provider"
import { SectionHeader } from "../kit"
import { DocumentImporter } from "./document-importer"
import { GuidelineCard } from "./guideline-card"
import { GuidelineForm } from "./guideline-form"
import { Button } from "@/components/ui/button"
import type { Guideline, GuidelineCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

const TABS: { id: GuidelineCategory; label: string; icon: typeof BookText }[] = [
  { id: "tone", label: "Tone & Voice", icon: MessageSquareQuote },
  { id: "terminology", label: "Approved Terminology", icon: BookText },
  { id: "fact", label: "Fact Database", icon: Database },
  { id: "visual", label: "Visual Rules", icon: Palette },
]

export function BrandHubView() {
  const { guidelines, tenant } = useApp()
  const { canManage } = useAuth()
  const [tab, setTab] = useState<GuidelineCategory>("tone")
  const [editing, setEditing] = useState<Guideline | "new" | null>(null)
  const items = guidelines.filter((g) => g.category === tab)

  return (
    <>
      <SectionHeader
        title="Brand Hub"
        description={`The living knowledge base the AI inspector enforces for ${tenant.name}.`}
        actions={
          canManage ? (
            <Button onClick={() => setEditing("new")} className="hover:bg-primary/90">
              <Plus data-icon="inline-start" />
              Add rule
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200"
        >
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Read-Only Mode</span>
            <span>Creators can view brand guidelines but cannot modify knowledge base assets.</span>
          </div>
        </div>
      ) : (
        <DocumentImporter />
      )}

      <div role="tablist" aria-label="Guideline categories" className="flex gap-1 overflow-x-auto border-b">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = guidelines.filter((g) => g.category === id).length
          const active = tab === id
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">{count}</span>
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className={cn("grid gap-3", tab === "visual" ? "sm:grid-cols-2 lg:grid-cols-4" : "lg:grid-cols-2")}>
        {items.map((g) => (
          <GuidelineCard key={g.id} guideline={g} onEdit={() => setEditing(g)} />
        ))}
        {items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            <Eye className="size-5" aria-hidden />
            No rules in this category yet.
          </div>
        ) : null}
      </div>

      {canManage && editing ? (
        <GuidelineForm
          initial={editing === "new" ? undefined : editing}
          defaultCategory={tab}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  )
}
