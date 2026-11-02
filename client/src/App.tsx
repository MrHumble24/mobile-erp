import { BrowserRouter } from "react-router"
import { QueryProvider } from "./app/providers/query-provider"
import { AppRoutes } from "./app/router/routes"
import { Toaster } from "./shared/ui/sonner"

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryProvider>
  )
}
