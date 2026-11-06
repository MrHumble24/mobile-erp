import { BrowserRouter } from "react-router"
import { QueryProvider } from "./app/providers/query-provider"
import { AppInitializer } from "./app/providers/app-initializer"
import { AppRoutes } from "./app/router/routes"
import { Toaster } from "./shared/ui/sonner"
import { RestoreOverlay } from "./widgets/restore-overlay"

export default function App() {
  return (
    <QueryProvider>
      <AppInitializer>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
          <RestoreOverlay />
        </BrowserRouter>
      </AppInitializer>
    </QueryProvider>
  )
}
