export const VIEWS = ["overview", "workspace", "brand-hub", "approvals", "analytics", "settings"] as const
export type View = (typeof VIEWS)[number]
