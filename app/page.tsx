import { AppProvider } from "@/components/app-provider"
import { AppRoot } from "@/components/app-root"

export default function Page() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  )
}
