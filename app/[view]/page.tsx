import { notFound } from "next/navigation"
import { AppProvider } from "@/components/app-provider"
import { VIEWS } from "@/lib/views"
import { AppRoot } from "@/components/app-root"

export const dynamicParams = false

export function generateStaticParams() {
  return VIEWS.map((view) => ({ view }))
}

export default async function ViewPage({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params
  if (!(VIEWS as readonly string[]).includes(view)) notFound()

  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  )
}
