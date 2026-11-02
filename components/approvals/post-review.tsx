"use client"

import { Check, CheckCircle2, Eye, PenSquare, RotateCcw, Send } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useApp, useAuth } from "../app-provider"
import { Card, formatTime } from "../kit"
import { STATUS_META } from "./approvals-view"
import { CommentThread } from "./comment-thread"
import { PublicationBadge } from "./publication-badge"
import { PublishDialog } from "./publish-dialog"
import { Button } from "@/components/ui/button"
import { diffWords } from "@/lib/diff"
import { platformMeta } from "@/lib/platforms"
import type { Post, PostStatus, Publication } from "@/lib/types"
import { cn } from "@/lib/utils"

const STAGES: PostStatus[] = ["draft", "pending", "revision", "approved"]

function PipelineTracker({ status }: { status: PostStatus }) {
  const currentIdx = STAGES.indexOf(status)
  return (
    <ol className="flex items-center" aria-label="Approval pipeline">
      {STAGES.map((s, idx) => {
        const done = idx < currentIdx || status === "approved"
        const current = idx === currentIdx
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  current && !done && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15",
                  !done && !current && "bg-background text-muted-foreground",
                  current && s === "revision" && "border-amber-500 bg-amber-500 ring-amber-500/15",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : idx + 1}
              </span>
              <span className={cn("text-[11px] whitespace-nowrap", current ? "font-semibold" : "text-muted-foreground")}>
                {STATUS_META[s].label}
              </span>
            </div>
            {idx < STAGES.length - 1 ? (
              <span className={cn("mx-2 mb-5 h-px flex-1", idx < currentIdx ? "bg-emerald-500" : "bg-border")} aria-hidden />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export function PostReview({ post }: { post: Post }) {
  const { upsertPost, openPostInWorkspace, logEvent, user } = useApp()
  const { canManage } = useAuth()
  const diff = useMemo(() => diffWords(post.originalBody, post.body), [post.originalBody, post.body])
  const [publishOpen, setPublishOpen] = useState(false)
  const canPublish = !canManage && post.status === "approved" && post.publication?.mode !== "published"

  const confirmPublication = (publication: Publication) => {
    upsertPost({ ...post, publication, updatedAt: new Date().toISOString() })
    setPublishOpen(false)
    logEvent(publication.mode === "published" ? "Social Publish" : "Social Schedule")
    const names = publication.platforms.map((p) => platformMeta(p).label).join(", ")
    toast.success(publication.mode === "published" ? "Content published" : "Content scheduled", {
      description:
        publication.mode === "published"
          ? `${post.title} is live on ${names}.`
          : `${post.title} will go out on ${names} at ${formatTime(publication.at)}.`,
    })
  }

  const decide = (status: "approved" | "revision") => {
    if (status === "revision" && !post.comments.some((c) => c.role !== "creator")) {
      toast.error("Leave a comment explaining the requested changes first.")
      return
    }
    upsertPost({
      ...post,
      status,
      updatedAt: new Date().toISOString(),
      comments:
        status === "approved"
          ? [
              ...post.comments,
              {
                id: `c-${Date.now()}`,
                author: user!.name,
                role: user!.role,
                body: "Approved for publishing.",
                issueTag: "General",
                createdAt: new Date().toISOString(),
              },
            ]
          : post.comments,
    })
    logEvent(status === "approved" ? "Content Approval" : "Revision Request")
    toast.success(status === "approved" ? "Content approved" : "Changes requested", {
      description: `${post.title} moved to ${STATUS_META[status].label}.`,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight text-balance">{post.title}</h2>
            <p className="text-xs text-muted-foreground">
              Submitted by {post.author} · Compliance score{" "}
              <span className="font-medium text-foreground tabular-nums">{post.score}%</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && post.status === "pending" ? (
              <>
                <Button variant="outline" onClick={() => decide("revision")}>
                  <RotateCcw data-icon="inline-start" />
                  Request Changes
                </Button>
                <Button onClick={() => decide("approved")} className="bg-emerald-600 text-white hover:bg-emerald-600/90">
                  <CheckCircle2 data-icon="inline-start" />
                  Approve Content
                </Button>
              </>
            ) : null}
            {!canManage && post.status === "revision" ? (
              <Button onClick={() => openPostInWorkspace(post.id)} className="hover:bg-primary/90">
                <PenSquare data-icon="inline-start" />
                Revise in Workspace
              </Button>
            ) : null}
            {canPublish ? (
              <Button onClick={() => setPublishOpen(true)} className="hover:bg-primary/90">
                <Send data-icon="inline-start" />
                {post.publication ? "Reschedule / Publish" : "Publish / Schedule"}
              </Button>
            ) : null}
            {!canManage && post.status !== "revision" && post.status !== "approved" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                <Eye className="size-3.5" aria-hidden />
                View only — approvals require Manager or Admin
              </span>
            ) : null}
          </div>
        </div>
        <PipelineTracker status={post.status} />
        {post.status === "approved" && post.publication ? (
          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="text-xs font-medium text-muted-foreground">Distribution</span>
            <PublicationBadge publication={post.publication} />
          </div>
        ) : null}
      </Card>
      {publishOpen ? (
        <PublishDialog
          open
          onClose={() => setPublishOpen(false)}
          postTitle={post.title}
          initial={post.publication}
          onConfirm={confirmPublication}
        />
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h3 className="text-sm font-semibold">Revision diff</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-red-500/60" aria-hidden /> Removed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-emerald-500/60" aria-hidden /> Added
            </span>
          </div>
        </div>
        <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="flex flex-col gap-2 p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Original draft</span>
            <p className="text-sm leading-7 whitespace-pre-wrap">
              {diff
                .filter((d) => d.type !== "added")
                .map((d, i) =>
                  d.type === "removed" ? (
                    <del key={i} className="rounded-sm bg-red-500/15 text-red-700 decoration-red-500/60 dark:text-red-300">
                      {d.value}
                    </del>
                  ) : (
                    <span key={i}>{d.value}</span>
                  ),
                )}
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Submitted revision</span>
            <p className="text-sm leading-7 whitespace-pre-wrap">
              {diff
                .filter((d) => d.type !== "removed")
                .map((d, i) =>
                  d.type === "added" ? (
                    <ins key={i} className="rounded-sm bg-emerald-500/15 text-emerald-700 no-underline dark:text-emerald-300">
                      {d.value}
                    </ins>
                  ) : (
                    <span key={i}>{d.value}</span>
                  ),
                )}
            </p>
          </div>
        </div>
        {post.media.length > 0 ? (
          <div className="flex flex-col gap-2 border-t p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uploaded media</span>
            <ul className="flex flex-wrap gap-3">
              {post.media.map((m) => (
                <li key={m.id} className="flex w-36 flex-col gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews */}
                  <img src={m.url || "/placeholder.svg"} alt={m.alt || m.name} className="aspect-video w-full rounded-lg border object-cover ring-2 ring-emerald-500/40" />
                  <span className="truncate text-xs text-muted-foreground">{m.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <CommentThread post={post} />
    </div>
  )
}
