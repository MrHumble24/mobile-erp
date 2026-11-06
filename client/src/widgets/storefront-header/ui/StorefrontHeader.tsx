import { Phone, Send, Globe } from "lucide-react"
import { useBranding } from "@/entities/company"
import { useI18n, type Locale } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"

export interface StorefrontHeaderProps {
  contactPhone?: string | null
  contactTelegram?: string | null
}

export function StorefrontHeader({
  contactPhone,
  contactTelegram,
}: StorefrontHeaderProps) {
  const { locale, setLocale } = useI18n()
  const { data: branding } = useBranding()
  const shopName = branding?.name?.trim() ?? ""

  const toggleLocale = () => {
    const next: Locale = locale === "uz" ? "en" : "uz"
    setLocale(next)
  }

  const telegramUrl = contactTelegram
    ? contactTelegram.startsWith("http")
      ? contactTelegram
      : `https://t.me/${contactTelegram.replace(/^@/, "")}`
    : null

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/shop" className="flex items-center gap-2.5 no-underline text-foreground">
          {(shopName || branding?.logoUrl) && (
            <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm shrink-0 shadow-xs overflow-hidden">
              {branding?.logoUrl ? (
                <img src={branding.logoUrl} alt={shopName} className="size-full object-cover" />
              ) : (
                shopName.charAt(0).toUpperCase()
              )}
            </div>
          )}
          {shopName && (
            <div>
              <span className="font-display font-bold text-base tracking-tight leading-tight block">
                {shopName}
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:block">
                Online Catalog
              </span>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-muted text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              <Phone className="size-3.5 text-emerald-600" />
              <span className="hidden sm:inline font-mono">{contactPhone}</span>
            </a>
          )}

          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Telegram</span>
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            className="h-8 px-2 rounded-full gap-1 text-xs font-semibold"
          >
            <Globe className="size-3.5 text-muted-foreground" />
            <span className="uppercase">{locale}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
