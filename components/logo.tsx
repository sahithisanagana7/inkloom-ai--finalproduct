import { Feather } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm ring-1 ring-inset ring-white/20">
        <Feather className="size-4" aria-hidden />
      </span>
      {showText ? (
        <span className="text-sm font-semibold tracking-tight">
          Inkloom <span className="text-muted-foreground">AI</span>
        </span>
      ) : null}
    </div>
  )
}
