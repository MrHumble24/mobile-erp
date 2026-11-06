import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Check, ArrowRight, X } from "lucide-react"
import { Card, CardContent, Button } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import { useCompanyProfile, useTelegramStatus } from "@/entities/company"

const STORAGE_KEY = "mobile-erp-setup-checklist-dismissed"

export function SetupChecklist() {
  const { t } = useI18n()
  const { data: profile } = useCompanyProfile()
  const { data: telegram } = useTelegramStatus()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY) === "true"
    setDismissed(isDismissed)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
  }

  if (dismissed) return null

  const items = [
    {
      id: "logo",
      title: t("settings.uploadLogo"),
      desc: "Upload your store branding logo",
      completed: Boolean(profile?.logoUrl),
      href: "/settings",
    },
    {
      id: "telegram",
      title: t("setup.stepTelegram"),
      desc: "Configure bot token for daily reports",
      completed: Boolean(telegram?.isTokenSet),
      href: "/settings",
    },
    {
      id: "balance",
      title: "Opening Balances",
      desc: "Record starting cash and card drawer funds",
      completed: false,
      href: "/balance",
    },
    {
      id: "products",
      title: "Product Inventory",
      desc: "Add devices or intake initial inventory shipments",
      completed: false,
      href: "/inventory",
    },
    {
      id: "staff",
      title: "Staff Accounts",
      desc: "Invite cashiers and technicians",
      completed: false,
      href: "/users",
    },
  ]

  const allCompleted = items.every((i) => i.completed)
  if (allCompleted) return null

  return (
    <Card className="border border-border/80 bg-card/60 shadow-xs mb-6">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold tracking-tight">Setup Checklist</h3>
            <p className="text-xs text-muted-foreground">
              Finish onboarding your store by completing the skipped items below
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
            title="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                item.completed
                  ? "border-border/40 bg-muted/20 opacity-70"
                  : "border-border bg-background hover:border-primary/40 shadow-2xs"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{item.title}</span>
                  {item.completed ? (
                    <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
