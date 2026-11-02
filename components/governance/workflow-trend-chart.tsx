"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card } from "../kit"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { ReviewRecord } from "@/lib/governance"
import { cn } from "@/lib/utils"

const DAY = 24 * 60 * 60 * 1000

const chartConfig = {
  submitted: { label: "Submitted", color: "var(--chart-1)" },
  approved: { label: "Approved", color: "var(--chart-2)" },
  revision: { label: "Revision Requested", color: "var(--chart-3)" },
  rejected: { label: "Rejected", color: "var(--chart-4)" },
} satisfies ChartConfig

type Series = keyof typeof chartConfig
const SERIES = Object.keys(chartConfig) as Series[]

type Bucket = { label: string } & Record<Series, number>

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function buildBuckets(records: ReviewRecord[], days: number): Bucket[] {
  const size = days > 30 ? 7 : 1
  const count = Math.ceil(days / size)
  const firstStart = startOfToday() - (count - 1) * size * DAY
  const buckets: Bucket[] = Array.from({ length: count }, (_, i) => ({
    label: new Date(firstStart + i * size * DAY).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    submitted: 0,
    approved: 0,
    revision: 0,
    rejected: 0,
  }))
  const indexFor = (iso: string) =>
    Math.min(count - 1, Math.max(0, Math.floor((new Date(iso).getTime() - firstStart) / (size * DAY))))

  for (const r of records) {
    buckets[indexFor(r.submittedAt)].submitted++
    if (r.decision !== "pending" && r.decidedAt) buckets[indexFor(r.decidedAt)][r.decision]++
  }
  return buckets
}

export function WorkflowTrendChart({ records, days }: { records: ReviewRecord[]; days: number }) {
  const [hidden, setHidden] = useState<Set<Series>>(new Set())
  const data = useMemo(() => buildBuckets(records, days), [records, days])

  const totals = useMemo(() => {
    const t = { submitted: 0, approved: 0, revision: 0, rejected: 0 }
    for (const b of data) for (const s of SERIES) t[s] += b[s]
    return t
  }, [data])

  const liveDelta = useMemo(() => {
    const d = { submitted: 0, approved: 0, revision: 0, rejected: 0 }
    for (const r of records) {
      if (!r.live) continue
      if (r.live.submitted) d.submitted++
      if (r.live.decided && r.decision !== "pending") d[r.decision]++
    }
    return d
  }, [records])

  const toggle = (s: Series) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Workflow Trends</h2>
          <p className="text-xs text-muted-foreground">
            Submitted, approved, and flagged requests {days > 30 ? "per week" : "per day"}. Select a series to toggle it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle chart series">
          {SERIES.map((s) => {
            const off = hidden.has(s)
            const delta = liveDelta[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                aria-pressed={!off}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted",
                  off && "opacity-50",
                )}
              >
                <span className="size-2.5 rounded-sm" style={{ background: chartConfig[s].color }} aria-hidden />
                <span className="text-muted-foreground">{chartConfig[s].label}</span>
                <span className="font-semibold tabular-nums">{totals[s]}</span>
                {delta > 0 ? (
                  <span
                    key={delta}
                    className="flex items-center gap-1 rounded-full px-1.5 font-semibold tabular-nums animate-in fade-in zoom-in-50"
                    style={{
                      color: chartConfig[s].color,
                      background: `color-mix(in oklch, ${chartConfig[s].color} 15%, transparent)`,
                    }}
                    title={`${delta} added this session`}
                  >
                    <span className="relative flex size-1.5" aria-hidden>
                      <span
                        className="absolute inline-flex size-full animate-ping rounded-full opacity-75"
                        style={{ background: chartConfig[s].color }}
                      />
                      <span className="relative inline-flex size-1.5 rounded-full" style={{ background: chartConfig[s].color }} />
                    </span>
                    +{delta}
                    <span className="sr-only"> this session</span>
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
      <div className="p-4 pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <BarChart data={data} margin={{ left: -16, right: 8 }} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
            <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent />} />
            {!hidden.has("submitted") && (
              <Bar dataKey="submitted" stackId="submitted" fill="var(--color-submitted)" radius={[3, 3, 0, 0]} />
            )}
            {!hidden.has("approved") && (
              <Bar dataKey="approved" stackId="approved" fill="var(--color-approved)" radius={[3, 3, 0, 0]} />
            )}
            {!hidden.has("revision") && (
              <Bar
                dataKey="revision"
                stackId="flagged"
                fill="var(--color-revision)"
                radius={hidden.has("rejected") ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            )}
            {!hidden.has("rejected") && (
              <Bar dataKey="rejected" stackId="flagged" fill="var(--color-rejected)" radius={[3, 3, 0, 0]} />
            )}
          </BarChart>
        </ChartContainer>
      </div>
    </Card>
  )
}
