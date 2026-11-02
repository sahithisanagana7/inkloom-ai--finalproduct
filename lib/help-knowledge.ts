export type KnowledgeChunk = {
  id: string
  topic: "Navigation" | "Governance Rules" | "Permissions" | "Publishing" | "Brand Guideline"
  title: string
  content: string
  /** extra search terms and synonyms that may not appear in the content */
  keywords?: string[]
}

export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "nav-overview",
    topic: "Navigation",
    title: "Overview dashboard (Admin only)",
    content:
      "Overview is the first item in the sidebar and is visible only to Admins at /overview. It shows pipeline analytics for the active tenant: Total Requests Submitted, Total Reviews Processed and Avg. Submission to Approval time. Below the metric cards, the Workflow Trends chart plots Submitted, Approved, Revision Requested and Rejected requests per day (7 or 30 day ranges) or per week (90 days); click a legend item to hide or show a series, and +N badges show changes made during the current session. Filters for Date range, Creator and Manager apply to the cards, chart and the Requests by Creator and Reviews by Manager tables. Managers and Creators who open /overview are redirected to their default page.",
    keywords: ["dashboard", "metrics", "chart", "trends", "kpi", "oversight", "governance oversight", "filters", "reports"],
  },
  {
    id: "nav-workspace",
    topic: "Navigation",
    title: "Content Workspace (Creators)",
    content:
      "Content Workspace is where Creators draft content. Write a title and body in the editor, upload media assets by dragging images into the uploader, and the AI compliance inspector checks the draft against the Brand Hub in real time. When ready, click Submit for Review: the post moves to Pending Review and appears in Approvals. If a manager requests changes, open the post from Approvals and choose Revise in Workspace to edit and resubmit. Content Workspace is available only to the Creator role.",
    keywords: ["draft", "write", "editor", "create post", "new post", "submit", "media", "upload", "images", "resubmit"],
  },
  {
    id: "nav-compliance",
    topic: "Navigation",
    title: "AI compliance scanning",
    content:
      "The AI compliance inspector scans every draft against the active tenant's Brand Hub rules and produces a compliance score from 0 to 100%. Issues are grouped into categories: Profanity, Tone, Terminology, Unsupported Claim, Visual Consistency and Accessibility, with high or medium severity. Flagged text is highlighted in the editor; select an issue to jump to it, and apply the suggested revision with one click to fix it and recalculate the score. Media is checked for palette consistency against the visual guidelines and for missing alt text. You can filter issues by category in the inspector panel.",
    keywords: ["scan", "inspector", "score", "issues", "flagged", "highlight", "suggestion", "fix", "check", "violations", "alt text"],
  },
  {
    id: "nav-brand-hub",
    topic: "Navigation",
    title: "Brand Hub",
    content:
      "Brand Hub is the governed knowledge base of brand guidelines for the active tenant. Guidelines have four categories: Tone & Voice, Terminology, Fact Database and Visual (palette colors). Managers and Admins can add, edit and delete guidelines and use Import brand guidelines to upload a PDF, DOCX or TXT file; rules are extracted into the knowledge base. Creators see Brand Hub in Read-Only Mode: they can view guidelines but cannot modify knowledge base assets. Changes apply to the AI inspector immediately.",
    keywords: ["guidelines", "rules", "knowledge base", "import", "upload document", "pdf", "docx", "edit rules", "brand book", "style guide"],
  },
  {
    id: "nav-approvals",
    topic: "Navigation",
    title: "Approvals pipeline",
    content:
      "Approvals is the governed review pipeline. Every post moves through four stages: Draft, Pending Review, Revision Requested and Approved. Filter the list by All, Pending, Revisions or Approved and select a submission to see its compliance score, pipeline tracker, a revision diff of original vs submitted text, uploaded media and review threads. Managers and Admins review pending posts with Approve Content or Request Changes; requesting changes requires leaving a review comment first. Comments can be tagged to an issue thread such as Tone or Terminology. Creators see only their own submissions.",
    keywords: ["review", "approve", "reject", "request changes", "pending", "revision", "diff", "comments", "workflow", "pipeline", "status"],
  },
  {
    id: "nav-analytics",
    topic: "Navigation",
    title: "Analytics",
    content:
      "Analytics (Governance Analytics) shows the last 30 days for the active tenant, including the share of flagged issues by category, an Ambiguous Guidelines Leaderboard of rules most frequently failed by creators, and Recurring Mistake Insights. Analytics is available to Managers and Admins; Creators see it as locked.",
    keywords: ["insights", "leaderboard", "mistakes", "stats", "statistics", "reporting"],
  },
  {
    id: "nav-settings",
    topic: "Navigation",
    title: "Settings & Audit",
    content:
      "Settings & Audit contains API access, privacy controls and real-time AI usage logs. Admins can issue and revoke API keys per tenant; revoked keys are denied in the audit log. The AI Usage & External API Audit Logs table streams every AI call with timestamp, tenant, key, feature, model and status. Privacy controls include Disclose AI Model Usage on Published Artifacts and zero data retention for model training; only Admins can change privacy settings. Settings is available to Managers and Admins; Creators see it as locked.",
    keywords: ["api key", "keys", "revoke", "audit", "logs", "privacy", "disclosure", "data retention", "security"],
  },
  {
    id: "nav-tenants",
    topic: "Navigation",
    title: "Switching brands (tenants)",
    content:
      "Use the brand switcher in the top header (for example Brand Alpha or Brand Beta) to change the active tenant. Each tenant has its own Brand Hub guidelines, posts, approvals and Overview analytics.",
    keywords: ["tenant", "brand switcher", "switch brand", "workspace switch", "multi-tenant", "brand alpha", "brand beta"],
  },
  {
    id: "rules-tone",
    topic: "Governance Rules",
    title: "Tone & Voice rules",
    content:
      "Tone & Voice guidelines define how the brand should sound and list words or phrases to avoid, such as hype or pressure tactics. When a draft uses an avoided phrase, the inspector flags a Tone issue and suggests a rewrite that keeps the brand voice.",
    keywords: ["tone", "voice", "hype", "wording", "style", "avoid words", "register"],
  },
  {
    id: "rules-terminology",
    topic: "Governance Rules",
    title: "Terminology rules",
    content:
      "Terminology guidelines map non-preferred terms to an approved term (for example 'customers' to 'members'). The inspector flags the non-preferred term as a Terminology issue and offers the approved term as a one-click replacement.",
    keywords: ["terminology", "terms", "approved term", "glossary", "wording", "replace", "preferred"],
  },
  {
    id: "rules-facts",
    topic: "Governance Rules",
    title: "Fact Database",
    content:
      "The Fact Database stores verified claims with a source citation and supporting keywords. Statistics, superlatives or guarantees in a draft that are not backed by a fact entry are flagged as Unsupported Claim issues. Rephrase the claim or align it with a verified fact to resolve it.",
    keywords: ["facts", "claims", "citation", "source", "statistics", "unsupported claim", "verify", "fact database"],
  },
  {
    id: "rules-visual",
    topic: "Governance Rules",
    title: "Visual consistency",
    content:
      "Visual guidelines store the approved brand palette as hex colors. Uploaded images are checked for a dominant color that matches the palette; off-palette media is flagged as a Visual Consistency issue. Images without alt text are flagged as Accessibility issues.",
    keywords: ["colors", "palette", "hex", "images", "visual", "accessibility", "alt text"],
  },
  {
    id: "rbac-roles",
    topic: "Permissions",
    title: "Roles and permissions (RBAC)",
    content:
      "Inkloom has three roles. Creator: Content Workspace, read-only Brand Hub, own submissions in Approvals, and Publish / Schedule for their own approved posts; Analytics and Settings are locked. Manager: Brand Hub editing and document import, approve or request changes in Approvals, Analytics and Settings & Audit; no Content Workspace and no Overview. Admin: all Manager permissions plus the Overview dashboard, issuing and revoking API keys and data privacy controls. Restricted pages redirect to the role's default page.",
    keywords: ["role", "roles", "rbac", "permission", "access", "admin", "manager", "creator", "locked", "access denied", "who can"],
  },
  {
    id: "publish-flow",
    topic: "Publishing",
    title: "Publishing and scheduling approved content",
    content:
      "After a Manager or Admin approves a post, the Creator who wrote it can distribute it. Open the approved post in Approvals and click Publish / Schedule. Select one or more target platforms: LinkedIn, X / Twitter, Instagram, Facebook or CMS / Blog. For each selected social platform, enter the account handle or ID (LinkedIn Profile URL / Account ID, X / Twitter @username, Instagram @username, Facebook Page URL / Page ID); publishing and scheduling stay disabled until every required account is filled in. Click Publish Immediately to go live now, or pick a date and time in the scheduler and click Schedule. The post card then shows a status badge with the platform logos, for example Published or Scheduled for a date. A scheduled post can be rescheduled or published immediately later. Managers and Admins cannot publish; the action is reserved for the Creator.",
    keywords: ["publish", "schedule", "social", "linkedin", "twitter", "x", "instagram", "facebook", "blog", "cms", "post live", "distribute", "channels", "reschedule"],
  },
  {
    id: "help-tours",
    topic: "Navigation",
    title: "Guided tours and help",
    content:
      "Open the Help button in the bottom-right corner on any page. The Guides tab has quick-start tours for your role, such as Workspace navigation, AI compliance scanning, the Approvals pipeline and Admin oversight. The Ask AI tab answers questions about Inkloom features, brand rules, permissions and publishing.",
    keywords: ["tour", "onboarding", "help", "guide", "getting started", "tutorial", "walkthrough"],
  },
]
