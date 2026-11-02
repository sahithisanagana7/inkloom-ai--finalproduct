"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { DEMO_USERS, SEED_GUIDELINES, SEED_KEYS, SEED_LOGS, SEED_POSTS, TENANTS } from "@/lib/seed"
import type { ApiKey, AuditLog, Guideline, Post, Role, Tenant, TenantId, User } from "@/lib/types"
import type { ReviewRecord } from "@/lib/governance"

import { VIEWS, type View } from "@/lib/views"

export type { View }

const CREATOR_VIEWS: readonly View[] = ["workspace", "brand-hub", "approvals"]
const CREATOR_LOCKED_VIEWS: readonly View[] = ["analytics", "settings"]

export function canAccessView(role: Role, view: View) {
  if (view === "overview") return role === "admin"
  if (role === "creator") return CREATOR_VIEWS.includes(view)
  return view !== "workspace"
}

export function isLockedView(role: Role, view: View) {
  return role === "creator" && CREATOR_LOCKED_VIEWS.includes(view)
}

function canNavigateTo(role: Role, view: View) {
  return canAccessView(role, view) || isLockedView(role, view)
}

const HOME_VIEW: Record<Role, View> = { creator: "workspace", manager: "approvals", admin: "overview" }

function defaultView(role: Role): View {
  return HOME_VIEW[role]
}

function resolveView(role: Role, requested: string | undefined): View {
  const view = VIEWS.find((v) => v === requested)
  return view && canNavigateTo(role, view) ? view : defaultView(role)
}

function viewFromPath() {
  return window.location.pathname.split("/").filter(Boolean)[0]
}

function syncPath(view: View, mode: "push" | "replace") {
  const path = `/${view}`
  if (window.location.pathname === path) return
  if (mode === "push") window.history.pushState(null, "", path)
  else window.history.replaceState(null, "", path)
}

type AppState = {
  user: User | null
  signIn: (role: Role) => void
  signOut: () => void
  tenant: Tenant
  setTenantId: (id: TenantId) => void
  view: View
  setView: (v: View) => void
  guidelines: Guideline[]
  addGuidelines: (g: Guideline[]) => void
  updateGuideline: (g: Guideline) => void
  deleteGuideline: (id: string) => void
  posts: Post[]
  upsertPost: (p: Post) => void
  liveReviewRecords: ReviewRecord[]
  activePostId: string | null
  openPostInWorkspace: (id: string | null) => void
  keys: ApiKey[]
  issueKey: (label: string) => ApiKey
  revokeKey: (id: string) => void
  logs: AuditLog[]
  logEvent: (feature: string, model?: string) => void
  discloseAi: boolean
  setDiscloseAi: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

const SESSION_KEY = "inkloom.session.role"

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<TenantId>("alpha")
  const [view, setView] = useState<View>("workspace")
  const [guidelineMap, setGuidelineMap] = useState(SEED_GUIDELINES)
  const [postMap, setPostMap] = useState(SEED_POSTS)
  const [liveRecordMap, setLiveRecordMap] = useState<Record<TenantId, ReviewRecord[]>>({ alpha: [], beta: [] })
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>(SEED_KEYS)
  const [logs, setLogs] = useState<AuditLog[]>(SEED_LOGS)
  const [discloseAi, setDiscloseAi] = useState(true)
  const keysRef = useRef(keys)
  useEffect(() => {
    keysRef.current = keys
  }, [keys])

  const tenant = TENANTS.find((t) => t.id === tenantId)!

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY) as Role | null
    if (stored && DEMO_USERS[stored]) {
      const next = resolveView(stored, viewFromPath())
      setUser(DEMO_USERS[stored])
      setView(next)
      syncPath(next, "replace")
    }
  }, [])

  const role = user?.role
  const isCreator = role === "creator"

  useEffect(() => {
    if (!role) return
    const onPopState = () => {
      const next = resolveView(role, viewFromPath())
      setView(next)
      syncPath(next, "replace")
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [role])

  const setViewGuarded = useCallback(
    (v: View) => {
      if (!role) return
      const next = canNavigateTo(role, v) ? v : defaultView(role)
      setView(next)
      syncPath(next, "push")
    },
    [role],
  )

  const signIn = useCallback((role: Role) => {
    const next = defaultView(role)
    sessionStorage.setItem(SESSION_KEY, role)
    setUser(DEMO_USERS[role])
    setView(next)
    syncPath(next, "replace")
    setActivePostId(null)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
    window.history.replaceState(null, "", "/")
  }, [])

  const logEvent = useCallback(
    (feature: string, model = "gemini-2.5-flash") => {
      setLogs((prev) =>
        [
          {
            id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            tenant: tenant.name,
            keyId: "session_ui",
            feature,
            model,
            status: "Success" as const,
          },
          ...prev,
        ].slice(0, 60),
      )
    },
    [tenant.name],
  )

  // Simulated external API traffic so the audit log feels live.
  useEffect(() => {
    if (!user) return
    const features = ["Compliance Scan", "Tone Rewrite", "Visual Palette Check", "Claim Verification"]
    const models = ["gemini-2.5-flash", "gemini-2.5-pro"]
    const interval = setInterval(() => {
      const currentKeys = keysRef.current
      const key = currentKeys[Math.floor(Math.random() * currentKeys.length)]
      if (!key) return
      const entry: AuditLog = {
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tenant: TENANTS.find((t) => t.id === key.tenant)!.name,
        keyId: key.prefix,
        feature: features[Math.floor(Math.random() * features.length)],
        model: models[Math.floor(Math.random() * models.length)],
        status: key.revoked ? "Denied" : "Success",
      }
      setLogs((prev) => [entry, ...prev].slice(0, 60))
    }, 9000)
    return () => clearInterval(interval)
  }, [user])

  const value = useMemo<AppState>(
    () => ({
      user,
      signIn,
      signOut,
      tenant,
      setTenantId: (id) => {
        setTenantId(id)
        setActivePostId(null)
      },
      view,
      setView: setViewGuarded,
      guidelines: guidelineMap[tenantId],
      addGuidelines: (g) => {
        if (isCreator) return
        setGuidelineMap((m) => ({ ...m, [tenantId]: [...m[tenantId], ...g] }))
      },
      updateGuideline: (g) => {
        if (isCreator) return
        setGuidelineMap((m) => ({ ...m, [tenantId]: m[tenantId].map((x) => (x.id === g.id ? g : x)) }))
      },
      deleteGuideline: (id) => {
        if (isCreator) return
        setGuidelineMap((m) => ({ ...m, [tenantId]: m[tenantId].filter((x) => x.id !== id) }))
      },
      posts: postMap[tenantId],
      upsertPost: (p) => {
        const previous = postMap[tenantId].find((x) => x.id === p.id)
        const now = new Date().toISOString()
        if (p.status === "pending" && previous?.status !== "pending") {
          const record: ReviewRecord = {
            id: `live-${p.id}-${Date.now()}`,
            postTitle: p.title,
            creator: p.author,
            submittedAt: now,
            decision: "pending",
            live: { postId: p.id, submitted: true, decided: false },
          }
          setLiveRecordMap((m) => ({ ...m, [tenantId]: [record, ...m[tenantId]] }))
        } else if (previous?.status === "pending" && (p.status === "approved" || p.status === "revision")) {
          const decision = p.status
          const reviewer = user?.name
          setLiveRecordMap((m) => {
            const list = m[tenantId]
            const open = list.find((r) => r.live?.postId === p.id && r.decision === "pending")
            const decided = { decision, reviewer, decidedAt: now }
            const next = open
              ? list.map((r) => (r === open ? { ...r, ...decided, live: { ...r.live!, decided: true } } : r))
              : [
                  {
                    id: `live-${p.id}-${Date.now()}`,
                    postTitle: p.title,
                    creator: p.author,
                    submittedAt: previous.updatedAt,
                    ...decided,
                    live: { postId: p.id, submitted: false, decided: true },
                  },
                  ...list,
                ]
            return { ...m, [tenantId]: next }
          })
        }
        setPostMap((m) => {
          const list = m[tenantId]
          const exists = list.some((x) => x.id === p.id)
          return { ...m, [tenantId]: exists ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list] }
        })
      },
      liveReviewRecords: liveRecordMap[tenantId],
      activePostId,
      openPostInWorkspace: (id) => {
        if (!isCreator) return
        setActivePostId(id)
        setViewGuarded("workspace")
      },
      keys,
      issueKey: (label) => {
        const rand = Math.random().toString(16).slice(2, 6)
        const key: ApiKey = {
          id: `key_${rand}`,
          label,
          prefix: `ink_live_${rand}`,
          tenant: tenantId,
          createdAt: new Date().toISOString(),
          revoked: false,
        }
        setKeys((k) => [key, ...k])
        return key
      },
      revokeKey: (id) => setKeys((k) => k.map((x) => (x.id === id ? { ...x, revoked: true } : x))),
      logs,
      logEvent,
      discloseAi,
      setDiscloseAi,
    }),
    [user, signIn, signOut, tenant, view, setViewGuarded, isCreator, guidelineMap, tenantId, postMap, liveRecordMap, activePostId, keys, logs, logEvent, discloseAi],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

export function useAuth() {
  const { user, signIn, signOut } = useApp()
  const role = user?.role
  return {
    user,
    signIn,
    signOut,
    canManage: role === "manager" || role === "admin",
    isAdmin: role === "admin",
  }
}
