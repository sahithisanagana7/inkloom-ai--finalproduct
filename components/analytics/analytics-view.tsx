"use client"

import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock, FileSearch, HelpCircle, Sparkles } from "lucide-react"
import { useApp } from "../app-provider"
import { Card, SectionHeader } from "../kit"
import { cn } from "@/lib/utils"

const METRICS = [
  { label: "Total Content Audited", value: "1,284", delta: "+12.4%", up: true, good: true, icon: FileSearch },
  { label: "Approval Rate", value: "87.2%", delta: "+4.1%", up: true, good: true, icon: CheckCircle2 },
  { label: "Review Hours Saved", value: "312h", delta: "+18.6%", up: true, good: true, icon: Clock },
  { label: "Open Ambiguities", value: "7", delta: "-2", up: false, good: true, icon: HelpCircle },
]

const MISTAKES = [
  { label: "Tone Mismatch", pct: 35, color: "var(--chart-3)" },
  { label: "Unsupported Claims", pct: 25, color: "var(--chart-4)" },
  { label: "Terminology", pct: 20, color: "var(--chart-1)" },
  { label: "Visual Hex Codes", pct: 20, color: "var(--chart-2)" },
]

const LEADERBOARD = [
  {
    rule: "Avoid hype language",
    category: "Tone & Voice",
    failRate: 42,
    recommendation:
      "Add 5 concrete before/after examples and define \"hype\" as superlatives without evidence (e.g. \"best\", \"revolutionary\").",
  },
  {
    rule: "Customers → Members",
    category: "Terminology",
    failRate: 31,
    recommendation: "Clarify whether \"Members\" applies to B2B buyers. 60% of failures occur in enterprise sales copy.",
  },
  {
    rule: "Performance claims need citation",
    category: "Fact Database",
    failRate: 27,
    recommendation: "Link each benchmark to an approved report and list acceptable phrasing like \"up to 40% faster\".",
  },
  {
    rule: "Accent color usage",
    category: "Visual Rules",
    failRate: 18,
    recommendation: "Specify a maximum surface-area ratio for Emerald accents and provide approved tint values.",
  },
]

export function AnalyticsView() {
  const { tenant } = useApp()
  let acc = 0
  const gradient = MISTAKES.map((m) => {
    const seg = `${m.color} ${acc}% ${acc + m.pct}%`
    acc += m.pct
    return seg
  }).join(", ")

  return (
    <>
      <SectionHeader title="Governance Analytics" description={`Last 30 days across ${tenant.name}.`} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map(({ label, value, delta, up, good, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
                  good ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-600",
                )}
              >
                {up ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
                {delta}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Recurring Mistake Insights</h2>
            <p className="text-xs text-muted-foreground">Share of flagged issues by category</p>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
            <div
              role="img"
              aria-label={MISTAKES.map((m) => `${m.label} ${m.pct}%`).join(", ")}
              className="relative size-40 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${gradient})` }}
            >
              <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-card">
                <span className="text-2xl font-semibold tabular-nums">2,418</span>
                <span className="text-xs text-muted-foreground">issues</span>
              </div>
            </div>
            <ul className="flex w-full flex-col gap-3">
              {MISTAKES.map((m) => (
                <li key={m.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ backgroundColor: m.color }} aria-hidden />
                      {m.label}
                    </span>
                    <span className="font-medium tabular-nums">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex flex-col gap-1 border-b p-5">
            <h2 className="text-sm font-semibold">Ambiguous Guidelines Leaderboard</h2>
            <p className="text-xs text-muted-foreground">Rules most frequently failed by creators</p>
          </div>
          <ol className="flex flex-col divide-y">
            {LEADERBOARD.map((r, idx) => (
              <li key={r.rule} className="flex gap-4 p-5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tabular-nums">
                  {idx + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{r.rule}</span>
                      <span className="text-xs text-muted-foreground">{r.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 tabular-nums dark:text-red-400">
                      {r.failRate}% fail
                    </span>
                  </div>
                  <p className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-pretty">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                    <span>
                      <span className="font-medium text-primary">AI recommendation: </span>
                      {r.recommendation}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
