"use client"

import { ArrowRight, FileText, Pencil, Quote, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useApp, useAuth } from "../app-provider"
import { Badge, Card } from "../kit"
import type { Guideline } from "@/lib/types"

export function GuidelineCard({ guideline: g, onEdit }: { guideline: Guideline; onEdit: () => void }) {
  const { deleteGuideline } = useApp()
  const { canManage } = useAuth()

  const actions = canManage ? (
    <div className="flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Edit ${g.title}`}
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          deleteGuideline(g.id)
          toast.success(`Removed "${g.title}"`)
        }}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${g.title}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  ) : null

  if (g.category === "visual") {
    return (
      <Card className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="h-24 border-b" style={{ backgroundColor: g.hex }} />
        <div className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{g.title}</span>
            {actions}
          </div>
          <span className="font-mono text-xs text-muted-foreground uppercase">{g.hex}</span>
          <p className="text-xs text-muted-foreground">{g.description}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{g.title}</h3>
          <p className="text-sm text-muted-foreground text-pretty">{g.description}</p>
        </div>
        {actions}
      </div>

      {g.category === "terminology" ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(g.avoid ?? []).map((a) => (
            <Badge key={a} tone="danger" className="line-through decoration-1">
              {a}
            </Badge>
          ))}
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
          <Badge tone="success">{g.preferred}</Badge>
        </div>
      ) : null}

      {g.category === "tone" && g.avoid?.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Avoid:</span>
          {g.avoid.map((a) => (
            <Badge key={a} tone="warning">
              {a}
            </Badge>
          ))}
        </div>
      ) : null}

      {g.category === "fact" ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Quote className="size-3.5 shrink-0" aria-hidden />
          <span>
            Source: <span className="font-medium text-foreground">{g.source}</span>
          </span>
        </div>
      ) : null}

      {g.origin ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="size-3" aria-hidden />
          Ingested from {g.origin}
        </span>
      ) : null}
    </Card>
  )
}
