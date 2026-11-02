"use client"

import { useApp } from "../app-provider"
import { WorkspaceEditor } from "./workspace-editor"
import { SEED_DRAFT } from "@/lib/seed"
import type { Post } from "@/lib/types"

export function WorkspaceView() {
  const { posts, activePostId, tenant, user } = useApp()
  const existing = posts.find((p) => p.id === activePostId)
  const initial: Post = existing ?? {
    id: `p-${Date.now().toString(36)}`,
    title: "Inkloom Studio Launch",
    originalBody: SEED_DRAFT,
    body: SEED_DRAFT,
    media: [],
    status: "draft",
    author: user?.name ?? "",
    score: 0,
    updatedAt: new Date().toISOString(),
    comments: [],
  }
  return <WorkspaceEditor key={`${tenant.id}-${activePostId ?? "new"}`} initial={initial} isNew={!existing} />
}
