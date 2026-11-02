"use client"

import { Copy, KeyRound, Lock, Plus, ShieldCheck } from "lucide-react"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useApp, useAuth } from "../app-provider"
import { Badge, Card, Modal, SectionHeader, Switch, formatTime, inputClass, relativeTime } from "../kit"
import { Button } from "@/components/ui/button"
import { TENANTS } from "@/lib/seed"
import type { ApiKey } from "@/lib/types"

export function SettingsView() {
  return (
    <>
      <SectionHeader title="Settings & Audit" description="API access, privacy controls, and real-time AI usage logs." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiKeysCard />
        <PrivacyCard />
      </div>
      <AuditLogTable />
    </>
  )
}

function ApiKeysCard() {
  const { keys, issueKey, revokeKey, tenant, logEvent } = useApp()
  const { isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [created, setCreated] = useState<ApiKey | null>(null)
  const tenantKeys = keys.filter((k) => k.tenant === tenant.id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setCreated(issueKey(label.trim()))
    logEvent("API Key Issued", "—")
    setLabel("")
  }

  const close = () => {
    setOpen(false)
    setCreated(null)
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b p-5">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4 text-muted-foreground" aria-hidden />
            Active Third-Party API Keys
          </h2>
          <p className="text-xs text-muted-foreground">Scoped to {tenant.name}</p>
        </div>
        {isAdmin ? (
          <Button size="sm" onClick={() => setOpen(true)} className="hover:bg-primary/90">
            <Plus data-icon="inline-start" />
            Issue key
          </Button>
        ) : (
          <Badge>
            <Lock className="size-3" aria-hidden /> Admin only
          </Badge>
        )}
      </div>
      <ul className="flex flex-col divide-y">
        {tenantKeys.map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{k.label}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {k.prefix}•••• · created {relativeTime(k.createdAt)}
              </span>
            </div>
            {k.revoked ? (
              <Badge tone="danger">Revoked</Badge>
            ) : isAdmin ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  revokeKey(k.id)
                  toast.success(`Revoked ${k.label}`, { description: "Subsequent requests will be denied." })
                }}
              >
                Revoke
              </Button>
            ) : (
              <Badge tone="success">Active</Badge>
            )}
          </li>
        ))}
        {tenantKeys.length === 0 ? <li className="px-5 py-6 text-sm text-muted-foreground">No keys for this tenant.</li> : null}
      </ul>

      <Modal open={open} onClose={close} title={created ? "Key issued" : "Issue API key"} description={created ? "Copy this key now. It will not be shown again." : `New key scoped to ${tenant.name}.`}>
        {created ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <code className="min-w-0 flex-1 truncate font-mono text-sm">{`${created.prefix}_${created.id.slice(4)}x8Kq2vLmN7`}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`${created.prefix}_${created.id.slice(4)}x8Kq2vLmN7`)
                  toast.success("Copied to clipboard")
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Copy key"
              >
                <Copy className="size-4" />
              </button>
            </div>
            <Button onClick={close} className="self-end hover:bg-primary/90">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Label</span>
              <input
                autoFocus
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Figma Plugin"
                className={inputClass}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" className="hover:bg-primary/90">
                Issue key
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </Card>
  )
}

function PrivacyCard() {
  const { discloseAi, setDiscloseAi, tenant } = useApp()
  const { isAdmin } = useAuth()
  return (
    <Card className="flex flex-col">
      <div className="flex flex-col gap-1 border-b p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
          Data Privacy
        </h2>
        <p className="text-xs text-muted-foreground">Controls apply to all published artifacts.</p>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Disclose AI Model Usage on Published Artifacts</span>
            <span className="text-xs text-muted-foreground">
              Appends an &ldquo;AI-assisted with Google Gemini&rdquo; attribution to approved content.
            </span>
          </div>
          <Switch
            checked={discloseAi}
            onChange={(v) => {
              setDiscloseAi(v)
              toast.success(v ? "AI disclosure enabled" : "AI disclosure disabled")
            }}
            disabled={!isAdmin}
            label="Disclose AI model usage on published artifacts"
          />
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="size-4" aria-hidden />
            Guideline data sandboxing verified
          </span>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            <li>Vector namespace isolated: tenant_{tenant.id}_kb</li>
            <li>Cross-tenant retrieval blocked ({TENANTS.length} tenants checked)</li>
            <li>Zero data retention for model training</li>
          </ul>
        </div>
        {!isAdmin ? <p className="text-xs text-muted-foreground">Only Admins can change privacy settings.</p> : null}
      </div>
    </Card>
  )
}

function AuditLogTable() {
  const { logs } = useApp()
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">AI Usage & External API Audit Logs</h2>
          <p className="text-xs text-muted-foreground">Streaming across all tenants</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Real-time
        </span>
      </div>
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card/95 text-left text-xs text-muted-foreground backdrop-blur">
            <tr className="border-b">
              {["Timestamp", "Tenant", "API Key", "Feature", "Model", "Status"].map((h) => (
                <th key={h} scope="col" className="px-5 py-2.5 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-muted/40 animate-in fade-in">
                <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">{formatTime(l.timestamp)}</td>
                <td className="px-5 py-2.5 whitespace-nowrap">{l.tenant}</td>
                <td className="px-5 py-2.5 font-mono text-xs whitespace-nowrap">{l.keyId}</td>
                <td className="px-5 py-2.5 whitespace-nowrap">{l.feature}</td>
                <td className="px-5 py-2.5 font-mono text-xs whitespace-nowrap text-muted-foreground">{l.model}</td>
                <td className="px-5 py-2.5">
                  <Badge tone={l.status === "Success" ? "success" : "danger"}>{l.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
