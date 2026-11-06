import * as React from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"

export function StorefrontUrlBanner() {
  const { t } = useI18n()
  const [copied, setCopied] = React.useState(false)
  const storefrontUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/shop`
      : "/shop"

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl)
      setCopied(true)
      toast.success(t("settings.storefrontUrlCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.info(storefrontUrl)
    }
  }

  return (
    <div className="p-3.5 rounded-xl bg-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-xs font-semibold text-muted-foreground block">
          {t("settings.storefrontUrl")}
        </span>
        <span className="font-mono text-xs text-foreground truncate block">
          {storefrontUrl}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyUrl}
          className="gap-1.5 h-8 text-xs font-semibold"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
          <span>
            {copied ? t("common.copied") : t("settings.copyStorefrontUrl")}
          </span>
        </Button>
        <a
          href="/shop"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center size-8 rounded-full border border-border hover:bg-muted transition-colors"
        >
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      </div>
    </div>
  )
}
