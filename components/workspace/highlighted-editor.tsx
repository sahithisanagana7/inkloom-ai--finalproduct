"use client"

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react"
import { VIOLATION_CATEGORIES } from "@/lib/compliance"
import type { Issue } from "@/lib/types"
import { cn } from "@/lib/utils"

export type HighlightedEditorHandle = { select: (start: number, end: number) => void }

const SHARED =
  "col-start-1 row-start-1 min-h-72 w-full whitespace-pre-wrap break-words px-4 py-3 font-sans text-[15px] leading-7"

/**
 * A transparent textarea layered over a visible mirror div. The mirror renders the text
 * (with wavy-underlined violations); the textarea on top handles editing, caret and selection.
 */
export const HighlightedEditor = forwardRef<
  HighlightedEditorHandle,
  {
    value: string
    onChange: (v: string) => void
    issues: Issue[]
    activeIssueId: string | null
    onIssueClick: (id: string) => void
    disabled?: boolean
  }
>(function HighlightedEditor({ value, onChange, issues, activeIssueId, onIssueClick, disabled }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    select: (start, end) => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus({ preventScroll: true })
      ta.setSelectionRange(start, end)
      ta.closest("[data-editor]")?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    },
  }))

  const textIssues = issues.filter((i) => i.start !== undefined && i.end !== undefined)

  const nodes: ReactNode[] = []
  let cursor = 0
  for (const issue of textIssues) {
    if (issue.start! < cursor) continue
    if (issue.start! > cursor) nodes.push(value.slice(cursor, issue.start))
    const active = issue.id === activeIssueId
    const violation = VIOLATION_CATEGORIES.has(issue.category)
    nodes.push(
      <mark
        key={issue.id}
        data-issue-category={issue.category}
        className={cn(
          "rounded-sm bg-transparent underline decoration-wavy decoration-[1.5px] underline-offset-4 transition-colors",
          violation ? "decoration-red-500 text-red-400" : "decoration-amber-500 text-foreground",
          active && (violation ? "bg-red-500/20" : "bg-amber-400/25"),
        )}
      >
        {value.slice(issue.start, issue.end)}
      </mark>,
    )
    cursor = issue.end!
  }
  nodes.push(value.slice(cursor))
  nodes.push("\n")

  const handleCaret = () => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const hit = textIssues.find((i) => pos >= i.start! && pos <= i.end!)
    if (hit) onIssueClick(hit.id)
  }

  return (
    <div
      data-editor
      className={cn(
        "grid rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
        disabled && "opacity-70",
      )}
    >
      <div ref={mirrorRef} aria-hidden className={cn(SHARED, "pointer-events-none overflow-hidden text-foreground")}>
        {nodes}
      </div>
      <label htmlFor="draft-body" className="sr-only">
        Draft body
      </label>
      <textarea
        id="draft-body"
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleCaret}
        onKeyUp={(e) => e.key.startsWith("Arrow") && handleCaret()}
        onScroll={(e) => {
          if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop
        }}
        spellCheck={false}
        placeholder="Start writing your draft…"
        className={cn(
          SHARED,
          "field-sizing-content resize-none bg-transparent text-transparent caret-foreground outline-none selection:bg-primary/30 placeholder:text-muted-foreground disabled:cursor-not-allowed",
        )}
      />
    </div>
  )
})
