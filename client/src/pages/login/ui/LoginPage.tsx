import { useEffect } from "react"
import { useNavigate } from "react-router"
import { LoginForm, useAuthStore } from "@/features/auth"

export function LoginPage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true })
    }
  }, [token, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <LoginForm onSuccess={() => navigate("/", { replace: true })} />
    </div>
  )
}
