"use client"

import { Inbox } from "lucide-react"
import { useState } from "react"
import { useApp, useAuth } from "../app-provider"
import { Badge, SectionHeader, relativeTime } from "../kit"
import { PostReview } from "./post-review"
import { PublicationBadge } from "./publication-badge"
import type { PostStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export const STATUS_META: Record<PostStatus, { label: string; tone: "neutral" | "primary" | "warning" | "success" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending Review", tone: "primary" },
  revision: { label: "Revision Requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
}

const FILTERS: (PostStatus | "all")[] = ["all", "pending", "revision", "approved"]

export function ApprovalsView() {
  const { posts: allPosts, tenant } = useApp()
  const { user } = useAuth()
  const posts = user?.role === "creator" ? allPosts.filter((p) => p.author === user.name) : allPosts
  const [filter, setFilter] = useState<PostStatus | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(posts.find((p) => p.status === "pending")?.id ?? posts[0]?.id ?? null)
  const list = filter === "all" ? posts : posts.filter((p) => p.status === filter)
  const selected = posts.find((p) => p.id === selectedId)

  return (
    <>
      <SectionHeader title="Approvals" description={`Governed review pipeline for ${tenant.name}.`} />
      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 rounded-lg border bg-muted/40 p-1" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "revision" ? "Revisions" : f}
              </button>
            ))}
          </div>
          <ul className="flex flex-col gap-2">
            {list.map((p) => {
              const meta = STATUS_META[p.status]
              const active = p.id === selectedId
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
                      active && "border-primary/50 ring-3 ring-primary/10",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-pretty">{p.title}</span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{p.score}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {p.author} · {relativeTime(p.updatedAt)}
                      </span>
                    </div>
                    {p.status === "approved" && p.publication ? <PublicationBadge publication={p.publication} /> : null}
                  </button>
                </li>
              )
            })}
            {list.length === 0 ? (
              <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Inbox className="size-5" aria-hidden />
                Nothing here yet.
              </li>
            ) : null}
          </ul>
        </div>
        {selected ? (
          <PostReview key={selected.id} post={selected} />
        ) : (
          <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Select a submission to review.
          </div>
        )}
      </div>
    </>
  )
}
