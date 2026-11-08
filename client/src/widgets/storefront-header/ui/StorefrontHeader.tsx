import * as React from "react"
import { useNavigate } from "react-router"
import { Phone, Send, Globe, PackageSearch, Sparkles } from "lucide-react"
import { useBranding } from "@/entities/company"
import { useI18n, type Locale } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { AssetImage } from "@/shared/ui/asset-image"
import { Input } from "@/shared/ui/input"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"

export interface StorefrontHeaderProps {
  contactPhone?: string | null
  contactTelegram?: string | null
}

export function StorefrontHeader({
  contactPhone,
  contactTelegram,
}: StorefrontHeaderProps) {
  const { locale, setLocale, t } = useI18n()
  const { data: branding } = useBranding()
  const navigate = useNavigate()
  const shopName = branding?.name?.trim() || "T-Mobile"

  const [trackOpen, setTrackOpen] = React.useState(false)
  const [orderIdInput, setOrderIdInput] = React.useState("")

  const toggleLocale = () => {
    const cycle: Record<Locale, Locale> = { uz: "ru", ru: "en", en: "uz" }
    setLocale(cycle[locale] || "uz")
  }

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = orderIdInput.trim()
    if (!trimmed) return
    setTrackOpen(false)
    navigate(`/shop/order/${trimmed}`)
  }

  const telegramUrl = contactTelegram
    ? contactTelegram.startsWith("http")
      ? contactTelegram
      : `https://t.me/${contactTelegram.replace(/^@/, "")}`
    : "https://t.me/tmobile_malika"

  const phone = contactPhone || "+998 90 999 88 77"

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border/80 shadow-[var(--shadow-xs)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand & Store Name */}
          <Link to="/shop" className="flex items-center gap-2.5 no-underline text-foreground group">
            <div className="relative size-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-display font-bold text-base shrink-0 shadow-xs overflow-hidden transition-transform group-hover:scale-105">
              {branding?.logoUrl ? (
                <AssetImage path={branding.logoUrl} alt={shopName} className="size-full object-contain p-1" />
              ) : (
                <span className="font-extrabold tracking-wider">{shopName.charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-base tracking-tight leading-tight block text-foreground group-hover:text-primary transition-colors">
                  {shopName}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Sparkles className="size-2.5" />
                  {t("storefront.storeOpenStatus")}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                {t("storefront.openHours")}
              </span>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Track order modal button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrackOpen(true)}
              className="h-9 px-2.5 sm:px-3 rounded-full text-xs font-semibold gap-1.5 border-border/70 hover:border-primary/50 cursor-pointer"
            >
              <PackageSearch className="size-3.5 text-primary" />
              <span className="hidden sm:inline">{t("storefront.trackOrder")}</span>
            </Button>

            {/* Telegram Channel */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold hover:bg-sky-500/20 transition-all cursor-pointer"
            >
              <Send className="size-3.5" />
              <span className="hidden md:inline">Telegram</span>
            </a>

            {/* Phone Call */}
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              <Phone className="size-3.5" />
              <span className="hidden md:inline font-mono">{phone}</span>
            </a>

            {/* Language Switch */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              className="h-9 px-2.5 rounded-full gap-1 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Globe className="size-3.5" />
              <span className="uppercase">{locale}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Order Status Lookup Modal */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogPopup className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PackageSearch className="size-5 text-primary" />
              <span>{t("storefront.trackOrderModalTitle")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {t("storefront.trackOrderModalDesc")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTrackSubmit} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Input
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder={t("storefront.trackOrderPlaceholder")}
                className="h-11 rounded-xl text-sm"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTrackOpen(false)}
                className="rounded-full text-xs font-medium"
              >
                {t("storefront.close")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!orderIdInput.trim()}
                className="rounded-full text-xs font-semibold px-4"
              >
                {t("storefront.trackOrderSubmit")}
              </Button>
            </div>
          </form>
        </DialogPopup>
      </Dialog>
    </>
  )
}
