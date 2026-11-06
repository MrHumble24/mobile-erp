import { BrowserRouter } from "react-router"
import { QueryProvider } from "./app/providers/query-provider"
import { AppInitializer } from "./app/providers/app-initializer"
import { AppRoutes } from "./app/router/routes"
import { Toaster } from "./shared/ui/sonner"

export default function App() {
  return (
    <QueryProvider>
      <AppInitializer>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AppInitializer>
    </QueryProvider>
  )
}
