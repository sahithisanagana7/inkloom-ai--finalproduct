import type { Role } from "./types"
import type { View } from "./views"

export type TourStep = { view: View; title: string; body: string }

export type Tour = { id: string; title: string; description: string; roles: Role[]; steps: TourStep[] }

export const TOURS: Tour[] = [
  {
    id: "workspace",
    title: "Workspace navigation",
    description: "Draft, attach media and submit your first post.",
    roles: ["creator"],
    steps: [
      {
        view: "workspace",
        title: "Your Content Workspace",
        body: "This is where you draft content. Add a title and body in the editor, then drag images into the media uploader below it.",
      },
      {
        view: "brand-hub",
        title: "Check the Brand Hub",
        body: "Brand Hub lists the Tone & Voice, Terminology, Fact Database and Visual rules your content is checked against. Creators have read-only access.",
      },
      {
        view: "workspace",
        title: "Submit for review",
        body: "When your draft is ready, click Submit for Review. It moves to Pending Review and a Manager is notified.",
      },
    ],
  },
  {
    id: "compliance",
    title: "AI compliance scanning",
    description: "Understand scores, flagged issues and one-click fixes.",
    roles: ["creator"],
    steps: [
      {
        view: "workspace",
        title: "Live compliance score",
        body: "The AI compliance inspector scans your draft in real time and shows a score from 0 to 100% against the active brand's rules.",
      },
      {
        view: "workspace",
        title: "Review flagged issues",
        body: "Issues are grouped as Profanity, Tone, Terminology, Unsupported Claim, Visual Consistency and Accessibility. Select one to highlight it in the editor.",
      },
      {
        view: "workspace",
        title: "Apply suggestions",
        body: "Apply a suggested revision with one click. The issue resolves and your score is recalculated instantly.",
      },
    ],
  },
  {
    id: "approvals",
    title: "Approvals pipeline",
    description: "Follow a post from Pending Review to Approved.",
    roles: ["creator", "manager", "admin"],
    steps: [
      {
        view: "approvals",
        title: "The review pipeline",
        body: "Every post moves through Draft, Pending Review, Revision Requested and Approved. Use the filters to focus on a stage.",
      },
      {
        view: "approvals",
        title: "Diffs and review threads",
        body: "Select a submission to compare the original and submitted text, view media and discuss changes in tagged review threads.",
      },
      {
        view: "approvals",
        title: "Decisions and publishing",
        body: "Managers and Admins Approve Content or Request Changes. Once approved, the Creator can Publish / Schedule to LinkedIn, X, Instagram, Facebook or the blog.",
      },
    ],
  },
  {
    id: "admin",
    title: "Admin oversight",
    description: "Monitor the pipeline, rules and platform controls.",
    roles: ["admin"],
    steps: [
      {
        view: "overview",
        title: "Overview dashboard",
        body: "Overview is Admin-only. Track submissions, reviews and time to approval, and use the Workflow Trends chart with Date range, Creator and Manager filters.",
      },
      {
        view: "brand-hub",
        title: "Govern brand rules",
        body: "Add or edit guidelines, or import a PDF, DOCX or TXT brand document. Changes apply to the AI inspector immediately.",
      },
      {
        view: "approvals",
        title: "Review submissions",
        body: "Approve content or request changes with a comment. Every decision feeds the Overview metrics.",
      },
      {
        view: "settings",
        title: "Keys, privacy and audit",
        body: "Issue or revoke API keys, control AI disclosure and data retention, and monitor the real-time AI usage audit log.",
      },
    ],
  },
]
