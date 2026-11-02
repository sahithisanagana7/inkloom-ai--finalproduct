"use client"

import { FileStack, RotateCcw, Timer, UserCheck } from "lucide-react"
import { useMemo, useState } from "react"
import { useApp } from "../app-provider"
import { Badge, Card, SectionHeader, inputClass } from "../kit"
import { WorkflowTrendChart } from "./workflow-trend-chart"
import { getReviewRecords, type ReviewRecord } from "@/lib/governance"
import { cn } from "@/lib/utils"

const RANGES = [
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
] as const

type RangeId = (typeof RANGES)[number]["id"]

const ALL = "all"
const HOUR = 60 * 60 * 1000

function formatDuration(ms: number | null) {
  if (ms === null) return "—"
  const hours = ms / HOUR
  if (hours < 24) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

function turnaround(r: ReviewRecord) {
  return r.decidedAt ? new Date(r.decidedAt).getTime() - new Date(r.submittedAt).getTime() : null
}

function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-44">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function GovernanceView() {
  const { tenant, liveReviewRecords } = useApp()
  const seedRecords = useMemo(() => getReviewRecords(tenant.id), [tenant.id])
  const records = useMemo(() => [...liveReviewRecords, ...seedRecords], [liveReviewRecords, seedRecords])
  const [range, setRange] = useState<RangeId>("30")
  const [creator, setCreator] = useState<string>(ALL)
  const [manager, setManager] = useState<string>(ALL)

  const creators = useMemo(() => [...new Set(records.map((r) => r.creator))].sort(), [records])
  const managers = useMemo(
    () => [...new Set(records.flatMap((r) => (r.reviewer ? [r.reviewer] : [])))].sort(),
    [records],
  )

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)!.days
    const cutoff = Date.now() - days * 24 * HOUR
    return records.filter(
      (r) =>
        new Date(r.submittedAt).getTime() >= cutoff &&
        (creator === ALL || r.creator === creator) &&
        (manager === ALL || r.reviewer === manager),
    )
  }, [records, range, creator, manager])

  const reviewed = filtered.filter((r) => r.decision !== "pending")
  const approved = reviewed.filter((r) => r.decision === "approved")
  const avgToApproval = average(approved.map((r) => turnaround(r)!))
  const pendingCount = filtered.length - reviewed.length

  const byCreator = useMemo(() => {
    const map = new Map<string, { total: number; approved: number; pending: number }>()
    for (const r of filtered) {
      const row = map.get(r.creator) ?? { total: 0, approved: 0, pending: 0 }
      row.total++
      if (r.decision === "approved") row.approved++
      if (r.decision === "pending") row.pending++
      map.set(r.creator, row)
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total)
  }, [filtered])

  const byManager = useMemo(() => {
    const map = new Map<string, { approved: number; revision: number; rejected: number; approvalTimes: number[] }>()
    for (const r of filtered) {
      if (!r.reviewer || r.decision === "pending") continue
      const row = map.get(r.reviewer) ?? { approved: 0, revision: 0, rejected: 0, approvalTimes: [] }
      row[r.decision]++
      if (r.decision === "approved") row.approvalTimes.push(turnaround(r)!)
      map.set(r.reviewer, row)
    }
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        ...v,
        total: v.approved + v.revision + v.rejected,
        avg: average(v.approvalTimes),
      }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])

  const maxSubmissions = Math.max(1, ...byCreator.map((c) => c.total))
  const filtersActive = range !== "30" || creator !== ALL || manager !== ALL
  const rangeLabel = RANGES.find((r) => r.id === range)!.label.toLowerCase()

  const metrics = [
    {
      label: "Total Requests Submitted",
      value: filtered.length.toLocaleString(),
      hint: `${byCreator.length} creator${byCreator.length === 1 ? "" : "s"} · ${pendingCount} awaiting review`,
      icon: FileStack,
    },
    {
      label: "Total Reviews Processed",
      value: reviewed.length.toLocaleString(),
      hint: `${byManager.length} reviewer${byManager.length === 1 ? "" : "s"} · ${approved.length} approved`,
      icon: UserCheck,
    },
    {
      label: "Avg. Submission → Approval",
      value: formatDuration(avgToApproval),
      hint: `Pipeline efficiency across ${approved.length} approval${approved.length === 1 ? "" : "s"}`,
      icon: Timer,
    },
  ]

  return (
    <>
      <SectionHeader
        title="Overview"
        description={`Pipeline analytics and team activity for ${tenant.name}, ${rangeLabel}.`}
        actions={<Badge tone="primary">Admin only</Badge>}
      />

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <FilterSelect
          id="gov-range"
          label="Date range"
          value={range}
          onChange={(v) => setRange(v as RangeId)}
          options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
        />
        <FilterSelect
          id="gov-creator"
          label="Creator"
          value={creator}
          onChange={setCreator}
          options={[{ value: ALL, label: "All creators" }, ...creators.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          id="gov-manager"
          label="Manager"
          value={manager}
          onChange={setManager}
          options={[{ value: ALL, label: "All managers" }, ...managers.map((m) => ({ value: m, label: m }))]}
        />
        <button
          type="button"
          onClick={() => {
            setRange("30")
            setCreator(ALL)
            setManager(ALL)
          }}
          disabled={!filtersActive}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reset
        </button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map(({ label, value, hint, icon: Icon }) => (
          <Card key={label} className="flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </Card>
        ))}
      </div>

      <WorkflowTrendChart records={filtered} days={RANGES.find((r) => r.id === range)!.days} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="flex flex-col">
          <div className="flex flex-col gap-1 border-b p-5">
            <h2 className="text-sm font-semibold">Requests by Creator</h2>
            <p className="text-xs text-muted-foreground">Submission count per creator</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-medium">Creator</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Submissions</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byCreator.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium">{c.name}</span>
                        <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(c.total / maxSubmissions) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{c.total}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {byCreator.length === 0 ? (
              <p className="p-5 text-center text-sm text-muted-foreground">No submissions match these filters.</p>
            ) : null}
          </div>
        </Card>

        <Card className="flex flex-col">
          <div className="flex flex-col gap-1 border-b p-5">
            <h2 className="text-sm font-semibold">Reviews by Manager</h2>
            <p className="text-xs text-muted-foreground">Decision breakdown and average time to approval</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-medium">Manager</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Approved</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Revision Requested</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Rejected</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Total</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Avg. to Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byManager.map((m) => (
                  <tr key={m.name}>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-medium whitespace-nowrap">{m.name}</span>
                        <div className="flex h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div className="h-full bg-emerald-500" style={{ width: `${(m.approved / m.total) * 100}%` }} />
                          <div className="h-full bg-amber-500" style={{ width: `${(m.revision / m.total) * 100}%` }} />
                          <div className="h-full bg-red-500" style={{ width: `${(m.rejected / m.total) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <Badge tone="success">{m.approved}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <Badge tone="warning">{m.revision}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <Badge tone="danger">{m.rejected}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{m.total}</td>
                    <td
                      className={cn(
                        "px-5 py-3 text-right tabular-nums",
                        m.avg === null ? "text-muted-foreground" : "font-medium",
                      )}
                    >
                      {formatDuration(m.avg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {byManager.length === 0 ? (
              <p className="p-5 text-center text-sm text-muted-foreground">No reviews match these filters.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  )
}
