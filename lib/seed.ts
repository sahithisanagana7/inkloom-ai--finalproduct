import type { ApiKey, AuditLog, Guideline, Post, Role, Tenant, TenantId, User } from "./types"

export const TENANTS: Tenant[] = [
  { id: "alpha", name: "Brand Alpha", tier: "Primary" },
  { id: "beta", name: "Brand Beta", tier: "Enterprise" },
]

export const DEMO_USERS: Record<Role, User> = {
  creator: { name: "Maya Chen", email: "maya@inkloom.ai", role: "creator", initials: "MC" },
  manager: { name: "Jordan Reyes", email: "jordan@inkloom.ai", role: "manager", initials: "JR" },
  admin: { name: "Priya Natarajan", email: "priya@inkloom.ai", role: "admin", initials: "PN" },
}

export const DEMO_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  creator: { email: "creator@inkloom.ai", password: "password123" },
  manager: { email: "manager@inkloom.ai", password: "password123" },
  admin: { email: "admin@inkloom.ai", password: "password123" },
}

const alphaGuidelines: Guideline[] = [
  {
    id: "t-1",
    category: "tone",
    title: "Confident, never hype",
    description:
      "Speak with calm authority. Avoid hyperbolic slang and stacked exclamation marks that undermine credibility.",
    avoid: ["insane", "crazy", "mind-blowing", "super awesome", "!!!"],
  },
  {
    id: "t-2",
    category: "tone",
    title: "No pressure tactics",
    description: "We invite, we never rush. Remove urgency language that pressures the reader.",
    avoid: ["act now", "hurry", "asap", "don't miss out"],
  },
  {
    id: "term-1",
    category: "terminology",
    title: "Members, not customers",
    description: "People who use our platform are always referred to as members.",
    preferred: "members",
    avoid: ["customers", "users"],
  },
  {
    id: "term-2",
    category: "terminology",
    title: "AI-assisted, not AI-powered",
    description: "Humans stay in control. Describe features as AI-assisted.",
    preferred: "AI-assisted",
    avoid: ["AI-powered", "fully automated"],
  },
  {
    id: "term-3",
    category: "terminology",
    title: "Affordable, not cheap",
    description: "Position pricing as accessible value.",
    preferred: "affordable",
    avoid: ["cheap"],
  },
  {
    id: "f-1",
    category: "fact",
    title: "40% faster review cycles",
    description: "Teams using Inkloom reduce content review cycles by 40% on average.",
    source: "2026 Customer Impact Study, p.12",
    keywords: ["40%"],
  },
  {
    id: "f-2",
    category: "fact",
    title: "SOC 2 Type II certified",
    description: "Inkloom maintains SOC 2 Type II certification, renewed annually.",
    source: "Trust Center, audit ref. SOC-2026-04",
    keywords: ["soc 2"],
  },
  {
    id: "v-1",
    category: "visual",
    title: "Primary Indigo",
    description: "Hero surfaces, primary CTAs and brand marks.",
    hex: "#4F46E5",
  },
  {
    id: "v-2",
    category: "visual",
    title: "Signal Emerald",
    description: "Success states and positive data only.",
    hex: "#10B981",
  },
  {
    id: "v-3",
    category: "visual",
    title: "Ink Slate",
    description: "Body copy and dark surfaces.",
    hex: "#1E293B",
  },
  {
    id: "v-4",
    category: "visual",
    title: "Paper White",
    description: "Default canvas for light layouts.",
    hex: "#F8FAFC",
  },
]

const betaGuidelines: Guideline[] = [
  {
    id: "bt-1",
    category: "tone",
    title: "Formal enterprise register",
    description: "Address decision-makers professionally. Avoid casual slang.",
    avoid: ["awesome", "gonna", "super", "!!!"],
  },
  {
    id: "bterm-1",
    category: "terminology",
    title: "Clients, not customers",
    description: "Enterprise accounts are referred to as clients.",
    preferred: "clients",
    avoid: ["customers", "buyers"],
  },
  {
    id: "bf-1",
    category: "fact",
    title: "99.99% uptime SLA",
    description: "Contractual uptime guarantee for Enterprise plans.",
    source: "Master Services Agreement §4.2",
    keywords: ["99.99%"],
  },
  {
    id: "bv-1",
    category: "visual",
    title: "Midnight Navy",
    description: "Primary brand color.",
    hex: "#0F172A",
  },
  {
    id: "bv-2",
    category: "visual",
    title: "Copper Accent",
    description: "Highlights and CTAs.",
    hex: "#C2410C",
  },
]

export const SEED_GUIDELINES: Record<TenantId, Guideline[]> = {
  alpha: alphaGuidelines,
  beta: betaGuidelines,
}

export const SEED_DRAFT = `Introducing Inkloom Studio — the AI-powered way to ship on-brand content!!!

Our customers are seeing insane results: review cycles are 40% faster, and we are the #1 governance platform in the world. Every launch is guaranteed to be 100% compliant.

It's cheap, it's fast, and it's built for teams that move quickly. Act now and click here to start your trial.`

const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()

export const SEED_POSTS: Record<TenantId, Post[]> = {
  alpha: [
    {
      id: "p-101",
      title: "Q4 Launch Announcement",
      originalBody:
        "Our customers love the new AI-powered dashboard. It's the best analytics tool ever built!!!",
      body: "Our members love the new AI-assisted dashboard. It helps teams understand performance at a glance.",
      media: [],
      status: "pending",
      author: "Maya Chen",
      score: 96,
      updatedAt: iso(42),
      comments: [
        {
          id: "c-1",
          author: "Maya Chen",
          role: "creator",
          body: "Applied the terminology fixes flagged by the inspector. Ready for a look.",
          issueTag: "Terminology",
          createdAt: iso(40),
        },
      ],
    },
    {
      id: "p-102",
      title: "Partner Newsletter — October",
      originalBody: "Hurry, our cheap partner tier is going away. Don't miss out!",
      body: "Our affordable partner tier closes to new sign-ups on Nov 30. Explore what's included.",
      media: [],
      status: "revision",
      author: "Maya Chen",
      score: 88,
      updatedAt: iso(180),
      comments: [
        {
          id: "c-2",
          author: "Jordan Reyes",
          role: "manager",
          body: "Better tone. Please add the source date for the tier change before resubmitting.",
          issueTag: "Unsupported Claim",
          createdAt: iso(170),
        },
      ],
    },
    {
      id: "p-103",
      title: "Trust Center Blog Post",
      originalBody: "We are totally secure and SOC 2 certified.",
      body: "Inkloom maintains SOC 2 Type II certification, renewed annually.",
      media: [],
      status: "approved",
      author: "Maya Chen",
      score: 100,
      updatedAt: iso(1440),
      comments: [
        {
          id: "c-3",
          author: "Priya Natarajan",
          role: "admin",
          body: "Approved. Claim matches Trust Center citation.",
          issueTag: "General",
          createdAt: iso(1400),
        },
      ],
    },
  ],
  beta: [
    {
      id: "p-201",
      title: "Enterprise SLA Overview",
      originalBody: "Our customers get awesome uptime, guaranteed!!!",
      body: "Our clients receive a contractual 99.99% uptime SLA.",
      media: [],
      status: "pending",
      author: "Maya Chen",
      score: 94,
      updatedAt: iso(90),
      comments: [],
    },
  ],
}

export const SEED_KEYS: ApiKey[] = [
  { id: "key_9f2a", label: "CMS Production Hook", prefix: "ink_live_9f2a", tenant: "alpha", createdAt: iso(60 * 24 * 30), revoked: false },
  { id: "key_4c71", label: "Figma Plugin", prefix: "ink_live_4c71", tenant: "alpha", createdAt: iso(60 * 24 * 12), revoked: false },
  { id: "key_b803", label: "Salesforce Marketing Cloud", prefix: "ink_live_b803", tenant: "beta", createdAt: iso(60 * 24 * 7), revoked: false },
  { id: "key_1e0d", label: "Legacy Zapier Bridge", prefix: "ink_live_1e0d", tenant: "alpha", createdAt: iso(60 * 24 * 90), revoked: true },
]

export const SEED_LOGS: AuditLog[] = [
  { id: "l-1", timestamp: iso(2), tenant: "Brand Alpha", keyId: "ink_live_9f2a", feature: "Compliance Scan", model: "gemini-2.5-flash", status: "Success" },
  { id: "l-2", timestamp: iso(6), tenant: "Brand Beta", keyId: "ink_live_b803", feature: "Tone Rewrite", model: "gemini-2.5-pro", status: "Success" },
  { id: "l-3", timestamp: iso(11), tenant: "Brand Alpha", keyId: "ink_live_1e0d", feature: "Compliance Scan", model: "gemini-2.5-flash", status: "Denied" },
  { id: "l-4", timestamp: iso(19), tenant: "Brand Alpha", keyId: "ink_live_4c71", feature: "Visual Palette Check", model: "gemini-2.5-pro", status: "Success" },
  { id: "l-5", timestamp: iso(27), tenant: "Brand Alpha", keyId: "ink_live_9f2a", feature: "Guideline Ingestion", model: "gemini-2.5-pro", status: "Success" },
]

/** Rules "extracted" from an uploaded document in the demo ingestion flow. */
export function extractedRulesFor(fileName: string): Guideline[] {
  const stamp = Date.now().toString(36)
  return [
    {
      id: `x-${stamp}-1`,
      category: "tone",
      title: "Inclusive, plain language",
      description: "Prefer plain words over jargon; write at an 8th-grade reading level.",
      avoid: ["synergy", "leverage"],
      origin: fileName,
    },
    {
      id: `x-${stamp}-2`,
      category: "terminology",
      title: "Workspace, not dashboard",
      description: "The product surface is called a workspace in all external copy.",
      preferred: "workspace",
      avoid: ["dashboard"],
      origin: fileName,
    },
    {
      id: `x-${stamp}-3`,
      category: "fact",
      title: "12,000+ teams",
      description: "More than 12,000 teams use Inkloom worldwide.",
      source: `${fileName}, §2.1`,
      keywords: ["12,000"],
      origin: fileName,
    },
  ]
}
