"use client"

import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Eraser, Sparkles, Wand2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { CategoryBadge } from "../kit"
import { Button } from "@/components/ui/button"
import { VIOLATION_CATEGORIES } from "@/lib/compliance"
import type { Issue, IssueCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

const CATEGORIES: IssueCategory[] = ["Profanity", "Tone", "Terminology", "Unsupported Claim", "Visual Consistency", "Accessibility"]

function ScoreGauge({ score }: { score: number }) {
  const r = 42
  const c = 2 * Math.PI * r
  const color = score >= 90 ? "text-emerald-500" : score >= 70 ? "text-amber-500" : "text-red-500"
  const label = score >= 90 ? "On brand" : score >= 70 ? "Needs polish" : "Off brand"
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`Compliance score ${score}%`}>
          <circle cx="50" cy="50" r={r} className="fill-none stroke-muted" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            className={cn("fill-none stroke-current transition-[stroke-dashoffset] duration-700 ease-out", color)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
          {score}
          <span className="text-sm text-muted-foreground">%</span>
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compliance score</span>
        <span className={cn("text-lg font-semibold", color)}>{label}</span>
      </div>
    </div>
  )
}

export function InspectorPanel({
  score,
  issues,
  activeIssueId,
  onSelect,
  onApply,
  scanning,
  disabled,
}: {
  score: number
  issues: Issue[]
  activeIssueId: string | null
  onSelect: (i: Issue) => void
  onApply: (i: Issue, replacement?: string) => void
  scanning?: boolean
  disabled?: boolean
}) {
  const [filter, setFilter] = useState<IssueCategory | null>(null)
  const cardRefs = useRef(new Map<string, HTMLDivElement>())
  const visible = filter ? issues.filter((i) => i.category === filter) : issues

  useEffect(() => {
    if (!activeIssueId) return
    cardRefs.current.get(activeIssueId)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [activeIssueId])

  return (
    <aside
      aria-label="AI compliance inspector"
      className="flex flex-col gap-4 rounded-xl border bg-card/80 p-4 shadow-xs backdrop-blur-xl lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]"
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden />
          AI Compliance Inspector
        </h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <span className="relative flex size-2">
            <span
              className={cn(
                "absolute inline-flex size-full animate-ping rounded-full opacity-60",
                scanning ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
            <span className={cn("relative inline-flex size-2 rounded-full", scanning ? "bg-amber-500" : "bg-emerald-500")} />
          </span>
          {scanning ? "Scanning…" : "Live"}
        </span>
      </div>

      <ScoreGauge score={score} />

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter issues by category">
        {CATEGORIES.map((cat) => {
          const count = issues.filter((i) => i.category === cat).length
          const active = filter === cat
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              disabled={count === 0}
              onClick={() => setFilter(active ? null : cat)}
              className={cn(
                "relative rounded-md transition-opacity disabled:opacity-40",
                filter && !active && "opacity-50",
              )}
            >
              <CategoryBadge category={cat} className={cn(active && "ring-2")} />
              {count > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                  <span className="absolute inset-0 animate-ping rounded-full bg-foreground/30" aria-hidden />
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pb-1">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
            <CheckCircle2 className="size-6 text-emerald-500" aria-hidden />
            <p className="text-sm font-medium">No issues found</p>
            <p className="text-xs text-muted-foreground">This draft follows every active brand rule.</p>
          </div>
        ) : null}
        {visible.map((issue) => {
          const expanded = issue.id === activeIssueId
          const violation = VIOLATION_CATEGORIES.has(issue.category)
          const isTextFix = issue.suggestion !== undefined && !issue.mediaId
          const canRemove = violation && issue.start !== undefined && issue.suggestion !== ""
          const removeLabel = issue.category === "Profanity" ? "Remove profanity" : "Remove word"
          const replaceLabel = violation ? "Replace word" : "Apply Suggestion"
          return (
            <div
              key={issue.id}
              ref={(el) => {
                if (el) cardRefs.current.set(issue.id, el)
                else cardRefs.current.delete(issue.id)
              }}
              className={cn(
                "rounded-lg border bg-background transition-all",
                violation && "border-l-2 border-l-red-500/70",
                expanded
                  ? violation
                    ? "border-red-500/60 bg-red-500/5 shadow-md ring-3 ring-red-500/15"
                    : "border-primary/50 shadow-md ring-3 ring-primary/10"
                  : "hover:border-foreground/20",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(issue)}
                aria-expanded={expanded}
                className="flex w-full items-start gap-2 p-3 text-left"
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    issue.severity === "high" ? "bg-red-500" : "bg-amber-500",
                  )}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={issue.category} />
                    <span className="sr-only">{issue.severity} severity</span>
                  </div>
                  {issue.match ? (
                    <span className="flex min-w-0 items-center gap-1.5 text-sm">
                      <span
                        className={cn(
                          "truncate font-medium",
                          violation && "text-red-400 underline decoration-red-500 decoration-wavy underline-offset-4",
                        )}
                      >
                        {issue.match}
                      </span>
                      {isTextFix ? (
                        <>
                          <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-label="replace with" />
                          <span className="truncate text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {issue.suggestion === "" ? "remove" : issue.suggestion}
                          </span>
                        </>
                      ) : null}
                    </span>
                  ) : null}
                </div>
                <ChevronDown
                  className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                  aria-hidden
                />
              </button>
              {expanded ? (
                <div className="flex flex-col gap-3 border-t px-3 pt-3 pb-3 animate-in fade-in slide-in-from-top-1">
                  <p className="text-sm text-muted-foreground text-pretty">{issue.message}</p>
                  <div className="flex items-start gap-2 rounded-md bg-muted/60 px-2.5 py-2 text-xs">
                    <BookOpen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      <span className="text-muted-foreground">Rule cited: </span>
                      <span className="font-medium">{issue.ruleTitle}</span>
                    </span>
                  </div>
                  {isTextFix ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-muted-foreground">Suggested revision</span>
                      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                        {issue.suggestion === "" ? removeLabel : `Replace with “${issue.suggestion}”`}
                      </span>
                    </div>
                  ) : null}
                  {isTextFix ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {canRemove ? (
                        <Button size="sm" variant="outline" onClick={() => onApply(issue, "")} disabled={disabled}>
                          <Eraser data-icon="inline-start" />
                          {removeLabel}
                        </Button>
                      ) : null}
                      <Button size="sm" onClick={() => onApply(issue)} disabled={disabled} className="hover:bg-primary/90">
                        {issue.suggestion === "" ? <Eraser data-icon="inline-start" /> : <Wand2 data-icon="inline-start" />}
                        {issue.suggestion === "" ? removeLabel : replaceLabel}
                      </Button>
                    </div>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" aria-hidden />
                    AI-generated · Gemini 2.5 Flash
                  </span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
