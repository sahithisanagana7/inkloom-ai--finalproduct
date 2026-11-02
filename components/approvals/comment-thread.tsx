"use client"

import { MessageSquare, Send } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useApp, useAuth } from "../app-provider"
import { Badge, Card, CategoryBadge, inputClass, relativeTime } from "../kit"
import { Button } from "@/components/ui/button"
import type { Comment, IssueCategory, Post } from "@/lib/types"

const TAGS: (IssueCategory | "General")[] = [
  "General",
  "Profanity",
  "Tone",
  "Terminology",
  "Unsupported Claim",
  "Visual Consistency",
  "Accessibility",
]

export function CommentThread({ post }: { post: Post }) {
  const { upsertPost, user } = useApp()
  const { canManage } = useAuth()
  const [body, setBody] = useState("")
  const [tag, setTag] = useState<(typeof TAGS)[number]>("General")

  const grouped = TAGS.map((t) => ({ tag: t, comments: post.comments.filter((c) => (c.issueTag ?? "General") === t) })).filter(
    (g) => g.comments.length > 0,
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim() || !user) return
    const comment: Comment = {
      id: `c-${Date.now()}`,
      author: user.name,
      role: user.role,
      body: body.trim(),
      issueTag: tag,
      createdAt: new Date().toISOString(),
    }
    upsertPost({ ...post, comments: [...post.comments, comment] })
    setBody("")
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <MessageSquare className="size-4 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold">Review threads</h3>
        <span className="text-xs text-muted-foreground">{post.comments.length}</span>
      </div>
      <div className="flex flex-col gap-4 p-4">
        {grouped.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
        {grouped.map((g) => (
          <section key={g.tag} className="flex flex-col gap-2">
            {g.tag === "General" ? <Badge>General</Badge> : <CategoryBadge category={g.tag} className="self-start" />}
            <ul className="flex flex-col gap-3 border-l-2 pl-4">
              {g.comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                    {c.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium">{c.author}</span>
                      <span className="capitalize text-muted-foreground">{c.role}</span>
                      <span className="text-muted-foreground">· {relativeTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-pretty">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {canManage ? (
        <form onSubmit={submit} className="flex flex-col gap-2 border-t p-4">
          <label htmlFor="comment-body" className="sr-only">
            Add a review comment
          </label>
          <textarea
            id="comment-body"
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add feedback for the creator…"
            className={inputClass}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Thread
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as typeof tag)}
                className="rounded-md border bg-background px-2 py-1 text-xs"
              >
                {TAGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" disabled={!body.trim()} className="hover:bg-primary/90">
              <Send data-icon="inline-start" />
              Comment
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  )
}
