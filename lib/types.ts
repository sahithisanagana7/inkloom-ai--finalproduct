export type Role = "creator" | "manager" | "admin"

export type User = {
  name: string
  email: string
  role: Role
  initials: string
}

export type TenantId = "alpha" | "beta"

export type Tenant = {
  id: TenantId
  name: string
  tier: string
}

export type GuidelineCategory = "tone" | "terminology" | "fact" | "visual"

export type Guideline = {
  id: string
  category: GuidelineCategory
  title: string
  description: string
  /** tone: words/phrases to avoid. terminology: non-preferred terms. */
  avoid?: string[]
  /** terminology: the approved replacement term */
  preferred?: string
  /** fact: verified source citation */
  source?: string
  /** fact: keywords that mark a claim as supported */
  keywords?: string[]
  /** visual: palette hex */
  hex?: string
  origin?: string
}

export type IssueCategory =
  | "Profanity"
  | "Tone"
  | "Terminology"
  | "Unsupported Claim"
  | "Visual Consistency"
  | "Accessibility"

export type Issue = {
  id: string
  category: IssueCategory
  severity: "high" | "medium"
  /** character range in the draft body; absent for media issues */
  start?: number
  end?: number
  match?: string
  message: string
  ruleId: string
  ruleTitle: string
  suggestion?: string
  mediaId?: string
}

export type MediaAsset = {
  id: string
  name: string
  url: string
  alt: string
  dominantHex?: string
}

export type PostStatus = "draft" | "pending" | "revision" | "approved"

export type Comment = {
  id: string
  author: string
  role: Role
  body: string
  issueTag?: IssueCategory | "General"
  createdAt: string
}

export type PublishPlatform = "linkedin" | "x" | "instagram" | "facebook" | "cms"

export type Publication = {
  platforms: PublishPlatform[]
  mode: "published" | "scheduled"
  /** publish time for "published", target time for "scheduled" */
  at: string
  /** account handle / ID per social platform */
  accounts?: Partial<Record<PublishPlatform, string>>
}

export type Post = {
  id: string
  title: string
  originalBody: string
  body: string
  media: MediaAsset[]
  status: PostStatus
  author: string
  score: number
  updatedAt: string
  comments: Comment[]
  publication?: Publication
}

export type ApiKey = {
  id: string
  label: string
  prefix: string
  tenant: TenantId
  createdAt: string
  revoked: boolean
}

export type AuditLog = {
  id: string
  timestamp: string
  tenant: string
  keyId: string
  feature: string
  model: string
  status: "Success" | "Denied"
}
