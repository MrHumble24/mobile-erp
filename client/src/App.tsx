import { BrowserRouter } from "react-router"
import { QueryProvider } from "./app/providers/query-provider"
import { AppRoutes } from "./app/router/routes"
import { Toaster } from "./shared/ui/sonner"
import { RestoreOverlay } from "./widgets/restore-overlay"

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
        <RestoreOverlay />
      </BrowserRouter>
    </QueryProvider>
  )
}
