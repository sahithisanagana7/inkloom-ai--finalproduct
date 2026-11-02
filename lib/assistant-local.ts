import { KNOWLEDGE_BASE, type KnowledgeChunk } from "./help-knowledge"
import { retrieve, tokenize, type RetrievedChunk } from "./rag"
import type { AssistantMetadata } from "./assistant-types"
import type { GuidelineCategory, Role } from "./types"

export type AssistantGuideline = {
  id: string
  category: GuidelineCategory
  title: string
  description: string
  avoid?: string[]
  preferred?: string
  source?: string
  hex?: string
}

export type AssistantContext = {
  role: Role
  view: string
  tenantName: string
  guidelines: AssistantGuideline[]
}

export const MIN_RELEVANCE = 1.2

const CATEGORY_LABEL: Record<GuidelineCategory, string> = {
  tone: "Tone & Voice",
  terminology: "Terminology",
  fact: "Fact Database",
  visual: "Visual",
}

const ROLE_LABEL: Record<Role, string> = { creator: "Creator", manager: "Manager", admin: "Admin" }

export function guidelineChunks(guidelines: AssistantGuideline[], tenantName: string): KnowledgeChunk[] {
  return guidelines.map((g) => {
    const details = [
      g.description,
      g.avoid?.length ? `Avoid: ${g.avoid.join(", ")}.` : "",
      g.preferred ? `Approved term: ${g.preferred}.` : "",
      g.source ? `Source: ${g.source}.` : "",
      g.hex ? `Hex: ${g.hex}.` : "",
    ]
      .filter(Boolean)
      .join(" ")
    return {
      id: `guideline-${g.id}`,
      topic: "Brand Guideline",
      title: `${tenantName} ${CATEGORY_LABEL[g.category]} rule: ${g.title}`,
      content: details,
      keywords: [CATEGORY_LABEL[g.category], g.category, "guideline", "rule", ...(g.avoid ?? []), g.preferred ?? ""],
    }
  })
}

export function retrieveRelevant(question: string, previousQuestion: string | undefined, context: AssistantContext) {
  const corpus = [...KNOWLEDGE_BASE, ...guidelineChunks(context.guidelines, context.tenantName)]
  let retrieved = retrieve(question, corpus)
  if (retrieved.filter((c) => c.score >= MIN_RELEVANCE).length === 0 && previousQuestion) {
    // Follow-ups like "and for managers?" rarely carry enough terms on their own.
    retrieved = retrieve(`${previousQuestion} ${question}`, corpus)
  }
  return retrieved.filter((c) => c.score >= MIN_RELEVANCE)
}

/** Step-by-step answers for the most common how-to questions, keyed by knowledge base chunk. */
const HOW_TO_STEPS: Record<string, { match: string[]; steps: string[] }[]> = {
  "nav-workspace": [
    {
      match: ["submit", "review", "send"],
      steps: [
        "Open Content Workspace from the sidebar.",
        "Write a title and body, and drag any images into the media uploader.",
        "Check the AI compliance inspector and resolve flagged issues to raise your score.",
        "Click Submit for Review. The post moves to Pending Review and appears in Approvals for a Manager or Admin.",
      ],
    },
    {
      match: ["revise", "resubmit", "change", "edit"],
      steps: [
        "Open Approvals and select the post marked Revision Requested.",
        "Read the reviewer's comments in the review thread.",
        "Click Revise in Workspace, update the draft, and click Submit for Review again.",
      ],
    },
  ],
  "publish-flow": [
    {
      match: ["publish", "schedule", "post", "linkedin", "twitter", "instagram", "facebook", "blog", "cms", "distribute"],
      steps: [
        "Open Approvals and select your approved post.",
        "Click Publish / Schedule.",
        "Select one or more target platforms: LinkedIn, X / Twitter, Instagram, Facebook or CMS / Blog.",
        "Enter the account handle or ID for each selected social platform (for example a LinkedIn Profile URL / Account ID or an Instagram @username).",
        "Click Publish Immediately, or pick a future date and time and click Schedule.",
      ],
    },
  ],
  "nav-approvals": [
    {
      match: ["approve", "request", "change", "review", "reject", "comment"],
      steps: [
        "Open Approvals and filter by Pending.",
        "Select a submission to see its compliance score, revision diff, media and review threads.",
        "Click Approve Content to approve it, or leave a review comment and click Request Changes to send it back to the Creator.",
      ],
    },
  ],
  "nav-brand-hub": [
    {
      match: ["import", "upload", "document", "pdf", "docx", "txt", "add", "edit", "delete", "create"],
      steps: [
        "Open Brand Hub from the sidebar (Manager or Admin).",
        "Use Import brand guidelines to upload a PDF, DOCX or TXT file, or add a guideline manually.",
        "Review the extracted rules. They apply to the AI compliance inspector immediately.",
      ],
    },
  ],
  "nav-settings": [
    {
      match: ["revoke", "issue", "key", "api"],
      steps: [
        "Open Settings & Audit from the sidebar (Admin).",
        "Under API access, issue a new key with a label, or click revoke on an existing key.",
        "Revoked keys are immediately denied and show as Denied in the audit log.",
      ],
    },
  ],
  "nav-tenants": [
    {
      match: ["switch", "change", "tenant", "brand"],
      steps: [
        "Open the brand switcher in the top header.",
        "Choose the brand (for example Brand Alpha or Brand Beta).",
        "Brand Hub, posts, approvals and analytics switch to that tenant.",
      ],
    },
  ],
  "nav-compliance": [
    {
      match: ["fix", "resolve", "improve", "score", "suggestion", "apply"],
      steps: [
        "Open your draft in Content Workspace.",
        "Select a flagged issue in the inspector panel to jump to the highlighted text.",
        "Apply the suggested revision with one click. The compliance score recalculates automatically.",
      ],
    },
  ],
}

/** Which roles can actually use the feature a chunk describes. */
const ACCESS: Record<string, { roles: Role[]; note: string }> = {
  "nav-overview": { roles: ["admin"], note: "The Overview dashboard is available only to Admins." },
  "nav-workspace": { roles: ["creator"], note: "Content Workspace is available only to Creators." },
  "nav-analytics": { roles: ["manager", "admin"], note: "Analytics is available to Managers and Admins; it is locked for Creators." },
  "nav-settings": { roles: ["manager", "admin"], note: "Settings & Audit is available to Managers and Admins; it is locked for Creators." },
  "publish-flow": { roles: ["creator"], note: "Publish / Schedule is reserved for the Creator who wrote the approved post." },
}

const GREETING = /^(hi|hello|hey|hiya|yo|good (morning|afternoon|evening)|greetings)\b[\s!.,]*$/i
const THANKS = /^(thanks|thank you|thx|ty|cheers|great|perfect|awesome|ok|okay|got it)\b[\s\S]{0,30}$/i
const HOW_TO = /\b(how|steps?|where|can i|way to|guide|walk me)\b/i

const ROLE_SUGGESTIONS: Record<Role, string[]> = {
  creator: ["How do I submit a draft for review?", "How do I publish to LinkedIn?", "What is an Unsupported Claim?"],
  manager: ["How do I request changes on a post?", "How do I import brand guidelines?", "What can Creators edit?"],
  admin: ["What does the Overview chart show?", "How do I revoke an API key?", "Who can publish approved content?"],
}

function sentences(text: string) {
  return text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text]
}

function relevantSentences(chunk: KnowledgeChunk, queryTerms: Set<string>, max: number) {
  return sentences(chunk.content)
    .map((s, index) => ({ s, index, hits: tokenize(s).filter((t) => queryTerms.has(t)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.index - b.index)
    .slice(0, max)
    .sort((a, b) => a.index - b.index)
    .map((x) => x.s)
}

function stepsFor(chunk: RetrievedChunk, question: string, queryTerms: Set<string>) {
  if (!HOW_TO.test(question)) return null
  const candidates = HOW_TO_STEPS[chunk.id]
  if (!candidates) return null
  const best = candidates
    .map((c) => ({ c, hits: c.match.filter((m) => tokenize(m).some((t) => queryTerms.has(t))).length }))
    .sort((a, b) => b.hits - a.hits)[0]
  return best && best.hits > 0 ? best.c.steps : null
}

function roleNote(chunk: RetrievedChunk, role: Role) {
  const access = ACCESS[chunk.id]
  if (!access) {
    if (chunk.id === "nav-brand-hub" && role === "creator") {
      return "As a Creator you see Brand Hub in Read-Only Mode; a Manager or Admin can add, edit or import guidelines."
    }
    if (chunk.id === "nav-approvals" && role === "creator") {
      return "As a Creator you see your own submissions; a Manager or Admin approves or requests changes."
    }
    return null
  }
  if (access.roles.includes(role)) return null
  return `Note for your ${ROLE_LABEL[role]} role: ${access.note}`
}

function outOfScope(context: AssistantContext) {
  const suggestions = ROLE_SUGGESTIONS[context.role].map((s) => `- ${s}`).join("\n")
  return `I can help with anything in Inkloom AI: Content Workspace, AI compliance scanning, ${context.tenantName}'s Brand Hub rules, the Approvals pipeline, the Overview dashboard, publishing and role permissions (RBAC).

Try asking:
${suggestions}`
}

export function answerLocally(
  question: string,
  context: AssistantContext,
  previousQuestion?: string,
  relevant = retrieveRelevant(question, previousQuestion, context),
): { text: string; metadata: AssistantMetadata } {
  const trimmed = question.trim()
  const sources = relevant.map((c) => ({ id: c.id, title: c.title, topic: c.topic }))

  if (GREETING.test(trimmed)) {
    return {
      text: `Hi! I'm the Inkloom AI assistant. Ask me about workflows, Brand Hub rules, compliance scanning, approvals, the Overview dashboard or what your ${ROLE_LABEL[context.role]} role can do.`,
      metadata: { inScope: false, sources: [] },
    }
  }
  if (THANKS.test(trimmed) && relevant.length === 0) {
    return { text: "You're welcome! Let me know if you have any other questions about Inkloom AI.", metadata: { inScope: false, sources: [] } }
  }
  if (relevant.length === 0) {
    return { text: outOfScope(context), metadata: { inScope: false, sources: [] } }
  }

  const queryTerms = new Set(tokenize(`${previousQuestion ?? ""} ${question}`))
  const [top, ...rest] = relevant
  const parts: string[] = []

  const steps = stepsFor(top, trimmed, queryTerms)
  if (steps) {
    parts.push(`${top.title}:`)
    parts.push(steps.map((s, i) => `${i + 1}. ${s}`).join("\n"))
  } else {
    parts.push(top.content)
  }

  const note = roleNote(top, context.role)
  if (note) parts.push(note)

  const related = rest.find((c) => c.score >= top.score * 0.6 && c.topic !== top.topic) ?? rest.find((c) => c.score >= top.score * 0.75)
  if (related) {
    const extra = relevantSentences(related, queryTerms, 2)
    if (extra.length) parts.push(`Related — ${related.title}: ${extra.join(" ")}`)
  }

  return { text: parts.join("\n\n"), metadata: { inScope: true, sources } }
}
