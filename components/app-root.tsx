"use client"

import { canAccessView, isLockedView, useApp } from "./app-provider"
import { AccessDenied } from "./shell/access-denied"
import { AnalyticsView } from "./analytics/analytics-view"
import { ApprovalsView } from "./approvals/approvals-view"
import { BrandHubView } from "./brand-hub/brand-hub-view"
import { GovernanceView } from "./governance/governance-view"
import { HelpdeskWidget } from "./helpdesk/helpdesk-widget"
import { LoginScreen } from "./login-screen"
import { SettingsView } from "./settings/settings-view"
import { AppHeader } from "./shell/app-header"
import { AppSidebar } from "./shell/app-sidebar"
import { WorkspaceView } from "./workspace/workspace-view"

export function AppRoot() {
  const { user, view, tenant } = useApp()
  if (!user) return <LoginScreen />
  const allowed = canAccessView(user.role, view)

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <div className="flex flex-col md:flex-row">
        <AppSidebar />
        <main key={`${tenant.id}-${view}`} className="min-w-0 flex-1 p-4 animate-in fade-in md:p-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {allowed && view === "overview" && <GovernanceView />}
            {allowed && view === "brand-hub" && <BrandHubView />}
            {allowed && view === "workspace" && <WorkspaceView />}
            {allowed && view === "approvals" && <ApprovalsView />}
            {allowed && view === "analytics" && <AnalyticsView />}
            {allowed && view === "settings" && <SettingsView />}
            {isLockedView(user.role, view) && (view === "analytics" || view === "settings") && (
              <AccessDenied view={view} />
            )}
          </div>
        </main>
      </div>
      <HelpdeskWidget />
    </div>
  )
}
