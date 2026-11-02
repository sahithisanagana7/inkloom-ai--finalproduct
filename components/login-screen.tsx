"use client"

import { ArrowRight, LogIn, PenLine, ShieldCheck, UserCog } from "lucide-react"
import { useCallback, useState, type FormEvent } from "react"
import { useAuth } from "./app-provider"
import { inputClass, Modal } from "./kit"
import { Logo } from "./logo"
import { ThemeToggle } from "./shell/theme-toggle"
import { Button } from "@/components/ui/button"
import { DEMO_CREDENTIALS } from "@/lib/seed"
import type { Role } from "@/lib/types"

const ROLES: { role: Role; label: string; description: string; icon: typeof PenLine; perms: string[] }[] = [
  {
    role: "creator",
    label: "Login as Creator",
    description: "Draft content and run the AI compliance inspector.",
    icon: PenLine,
    perms: ["Draft & inspect", "Submit for review", "Read-only Brand Hub"],
  },
  {
    role: "manager",
    label: "Login as Manager",
    description: "Govern brand guidelines and approve submissions.",
    icon: UserCog,
    perms: ["Approve & request changes", "Edit Brand Hub", "Ingest documents"],
  },
  {
    role: "admin",
    label: "Login as Admin",
    description: "Full control including API keys and privacy settings.",
    icon: ShieldCheck,
    perms: ["All manager permissions", "Issue & revoke API keys", "Data privacy controls"],
  },
]

function roleForCredentials(email: string, password: string): Role | null {
  const normalized = email.trim().toLowerCase()
  const match = (Object.keys(DEMO_CREDENTIALS) as Role[]).find(
    (role) => DEMO_CREDENTIALS[role].email === normalized && DEMO_CREDENTIALS[role].password === password,
  )
  return match ?? null
}

export function LoginScreen() {
  const { signIn } = useAuth()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const role = roleForCredentials(email, password)
    if (!role) {
      setError("Invalid email or password.")
      return
    }
    setError(null)
    signIn(role)
  }

  const openSignIn = (role: Role) => {
    setSelectedRole(role)
    setEmail(DEMO_CREDENTIALS[role].email)
    setPassword(DEMO_CREDENTIALS[role].password)
    setError(null)
  }

  const closeSignIn = useCallback(() => setSelectedRole(null), [])
  const selectedLabel = ROLES.find((r) => r.role === selectedRole)?.label.replace("Login as ", "")

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <header className="relative flex items-center justify-between px-6 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Enterprise Brand Governance
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Every word, every pixel, on brand.
            </h1>
            <p className="max-w-lg text-muted-foreground text-pretty">
              Inkloom inspects drafts against your living brand guidelines in real time, then routes them through a
              governed approval pipeline.
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-3">
            {ROLES.map(({ role, label, description, icon: Icon, perms }) => (
              <button
                key={role}
                type="button"
                onClick={() => openSignIn(role)}
                aria-haspopup="dialog"
                className="group flex flex-col gap-4 rounded-xl border bg-card/70 p-5 text-left shadow-xs backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center justify-between text-sm font-semibold">
                    {label}
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
                <ul className="flex flex-col gap-1.5 border-t pt-3">
                  {perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="size-1 rounded-full bg-primary/60" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Demo environment — role permissions are enforced throughout the session.
          </p>
        </div>
      </main>

      <Modal
        open={selectedRole !== null}
        onClose={closeSignIn}
        title={`Sign in as ${selectedLabel ?? ""}`}
        description="Demo credentials for this role have been filled in for you."
      >
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@inkloom.ai"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "login-error" : undefined}
                className={inputClass}
              />
            </div>
            {error ? (
              <p id="login-error" role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="h-11 w-full text-sm font-semibold">
              <LogIn data-icon="inline-start" />
              Sign In
            </Button>
          </form>
      </Modal>
    </div>
  )
}
