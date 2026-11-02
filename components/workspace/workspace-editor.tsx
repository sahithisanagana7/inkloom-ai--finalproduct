"use client"

import { FilePlus2, Loader2, ScanSearch, Send } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useApp } from "../app-provider"
import { Badge, SectionHeader } from "../kit"
import { HighlightedEditor, type HighlightedEditorHandle } from "./highlighted-editor"
import { InspectorPanel } from "./inspector-panel"
import { MediaUploader } from "./media-uploader"
import { Button } from "@/components/ui/button"
import { analyzeDraft, applySuggestion } from "@/lib/compliance"
import type { Issue, MediaAsset, Post } from "@/lib/types"

const SCAN_DEBOUNCE_MS = 500

const STATUS_LABEL = {
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending Review", tone: "primary" },
  revision: { label: "Revision Requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
} as const

export function WorkspaceEditor({ initial, isNew }: { initial: Post; isNew: boolean }) {
  const { guidelines, upsertPost, logEvent, openPostInWorkspace, setView, user } = useApp()
  const [title, setTitle] = useState(initial.title)
  const [body, setBody] = useState(initial.body)
  const [media, setMedia] = useState<MediaAsset[]>(initial.media)
  const [status, setStatus] = useState(initial.status)
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null)
  const editorRef = useRef<HighlightedEditorHandle>(null)

  const [scan, setScan] = useState(() => ({
    ...analyzeDraft(initial.body, initial.media, guidelines),
    body: initial.body,
    media: initial.media,
    guidelines,
    at: new Date(),
  }))

  const runScan = useCallback(
    (nextBody: string, nextMedia: MediaAsset[]) => {
      const result = analyzeDraft(nextBody, nextMedia, guidelines)
      setScan({ ...result, body: nextBody, media: nextMedia, guidelines, at: new Date() })
      return result
    },
    [guidelines],
  )

  const scanning = scan.body !== body || scan.media !== media || scan.guidelines !== guidelines

  useEffect(() => {
    if (!scanning) return
    const timer = setTimeout(() => runScan(body, media), SCAN_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [scanning, body, media, runScan])

  const { issues, score } = scan
  // While a rescan is pending, keep only highlights whose offsets still point at the same text.
  const editorIssues = useMemo(
    () =>
      scanning
        ? issues.filter((i) => i.start === undefined || body.slice(i.start, i.end) === i.match)
        : issues,
    [scanning, issues, body],
  )
  const locked = status === "pending" || status === "approved"

  const runManualCheck = () => {
    const result = runScan(body, media)
    logEvent("Run AI Compliance Check")
    if (result.issues.length === 0) {
      toast.success("Compliance check passed", { description: `Score ${result.score}% — no violations found.` })
    } else {
      toast.warning(`${result.issues.length} issue${result.issues.length === 1 ? "" : "s"} found`, {
        description: `Compliance score ${result.score}%. Review the flagged items in the inspector.`,
      })
      const first = result.issues[0]
      setActiveIssueId(first.id)
    }
  }

  const handleApply = (issue: Issue, replacement?: string) => {
    if (issue.mediaId || issue.start === undefined) return
    if (body.slice(issue.start, issue.end) !== issue.match) {
      runScan(body, media)
      toast.info("Draft changed — rescanned. Try the suggestion again.")
      return
    }
    const fix = replacement === undefined ? issue : { ...issue, suggestion: replacement }
    const next = applySuggestion(body, fix)
    setBody(next)
    runScan(next, media)
    setActiveIssueId(null)
    logEvent("Apply Suggestion")
    toast.success(fix.suggestion === "" ? "Word removed" : "Suggestion applied", {
      description: `${issue.category} issue resolved — score recalculated.`,
    })
  }

  const handleSelectIssue = (issue: Issue) => {
    setActiveIssueId(issue.id)
    if (issue.start !== undefined && issue.end !== undefined) editorRef.current?.select(issue.start, issue.end)
  }

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Add a title and body before submitting.")
      return
    }
    const { score } = runScan(body, media)
    upsertPost({
      ...initial,
      title: title.trim(),
      body,
      media,
      status: "pending",
      score,
      author: initial.author || user?.name || "",
      updatedAt: new Date().toISOString(),
    })
    setStatus("pending")
    logEvent("Submit for Review")
    toast.success("Submitted for review", {
      description: "Forwarded to the approval pipeline. You'll be notified when a manager responds.",
      action: { label: "View", onClick: () => setView("approvals") },
    })
  }

  const statusMeta = STATUS_LABEL[status]

  return (
    <>
      <SectionHeader
        title="Content Workspace"
        description="Draft content and let the AI inspector check it against your Brand Hub in real time."
        actions={
          <>
            {!isNew ? (
              <Button variant="outline" onClick={() => openPostInWorkspace(null)}>
                <FilePlus2 data-icon="inline-start" />
                New draft
              </Button>
            ) : null}
            <Button onClick={submit} disabled={locked} className="hover:bg-primary/90">
              <Send data-icon="inline-start" />
              Submit for Review
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="post-title" className="sr-only">
                Post title
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={locked}
                placeholder="Untitled draft"
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground disabled:opacity-70"
              />
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            </div>
            {locked ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                This post is {statusMeta.label.toLowerCase()} and locked for editing. Creators cannot publish or
                self-approve content.
              </p>
            ) : null}
            <HighlightedEditor
              ref={editorRef}
              value={body}
              onChange={setBody}
              issues={editorIssues}
              activeIssueId={activeIssueId}
              onIssueClick={(id) => setActiveIssueId(id)}
              disabled={locked}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {scanning ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                    Auto-scanning as you type…
                  </span>
                ) : (
                  <>
                    Auto-scan on · last checked{" "}
                    <time dateTime={scan.at.toISOString()} suppressHydrationWarning>
                      {scan.at.toLocaleTimeString()}
                    </time>
                    {" · "}
                    {issues.length} issue{issues.length === 1 ? "" : "s"}
                  </>
                )}
              </p>
              <Button onClick={runManualCheck} disabled={locked} className="w-full hover:bg-primary/90 sm:w-auto">
                <ScanSearch data-icon="inline-start" />
                Run AI Compliance Check
              </Button>
            </div>
          </div>
          <MediaUploader
            media={media}
            onChange={setMedia}
            issues={issues}
            disabled={locked}
            onIssueClick={(id) => setActiveIssueId(id)}
          />
        </div>

        <InspectorPanel
          score={score}
          issues={issues}
          activeIssueId={activeIssueId}
          onSelect={handleSelectIssue}
          onApply={handleApply}
          scanning={scanning}
          disabled={locked}
        />
      </div>
    </>
  )
}
