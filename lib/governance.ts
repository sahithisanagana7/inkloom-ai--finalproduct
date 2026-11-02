import type { TenantId } from "./types"

export type ReviewDecision = "approved" | "revision" | "rejected" | "pending"

export type ReviewRecord = {
  id: string
  postTitle: string
  creator: string
  submittedAt: string
  reviewer?: string
  decision: ReviewDecision
  decidedAt?: string
  /** set for records produced by workflow actions taken during the current session */
  live?: { postId: string; submitted: boolean; decided: boolean }
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const CREATORS: Record<TenantId, string[]> = {
  alpha: ["Maya Chen", "Leo Park", "Amara Okafor", "Sam Rivera"],
  beta: ["Maya Chen", "Noah Fischer", "Isla Moreno"],
}

const REVIEWERS: Record<TenantId, string[]> = {
  alpha: ["Jordan Reyes", "Elena Voss", "Priya Natarajan"],
  beta: ["Jordan Reyes", "Marcus Bell"],
}

const TITLES = [
  "Spring launch announcement",
  "Customer story: Northwind",
  "Q3 product roadmap recap",
  "Holiday campaign teaser",
  "Feature deep dive: Smart Scan",
  "Partner webinar invite",
  "Security update notice",
  "Brand refresh blog post",
  "Onboarding email sequence",
  "Case study: Lumen Health",
  "Weekly newsletter",
  "Pricing page update",
]

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function buildRecords(tenant: TenantId, count: number, seed: number): ReviewRecord[] {
  const rand = seeded(seed)
  const now = Date.now()
  const creators = CREATORS[tenant]
  const reviewers = REVIEWERS[tenant]
  return Array.from({ length: count }, (_, i) => {
    const submittedMs = now - Math.floor(rand() * 85 * DAY) - HOUR
    const creator = creators[Math.floor(rand() * creators.length)]
    const roll = rand()
    const decision: ReviewDecision =
      submittedMs > now - 2 * DAY && roll < 0.6 ? "pending" : roll < 0.62 ? "approved" : roll < 0.88 ? "revision" : "rejected"
    const base: ReviewRecord = {
      id: `rv-${tenant}-${i}`,
      postTitle: TITLES[Math.floor(rand() * TITLES.length)],
      creator,
      submittedAt: new Date(submittedMs).toISOString(),
      decision,
    }
    if (decision === "pending") return base
    const turnaroundMs = Math.min(HOUR * (2 + rand() * 70), now - submittedMs)
    return {
      ...base,
      reviewer: reviewers[Math.floor(rand() * reviewers.length)],
      decidedAt: new Date(submittedMs + turnaroundMs).toISOString(),
    }
  }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function getReviewRecords(tenant: TenantId): ReviewRecord[] {
  return tenant === "alpha" ? buildRecords("alpha", 64, 4217) : buildRecords("beta", 38, 9133)
}
