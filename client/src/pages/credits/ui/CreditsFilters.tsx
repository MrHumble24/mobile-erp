import { Search } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import type { useCreditsFilters, CreditStatusTab } from "../model/use-credits-filters"

const TABS: { value: CreditStatusTab; labelKey: string }[] = [
  { value: "all", labelKey: "credit.allCredits" },
  { value: "open", labelKey: "credit.open" },
  { value: "overdue", labelKey: "credit.overdue" },
  { value: "settled", labelKey: "credit.settled" },
]

export function CreditsFilters({ filters }: { filters: ReturnType<typeof useCreditsFilters> }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={filters.status === tab.value ? "default" : "outline"}
            onClick={() => filters.setStatus(tab.value)}
          >
            {t(tab.labelKey)}
          </Button>
        ))}
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          placeholder={t("customers.searchPlaceholder")}
          className="h-9 pl-9"
        />
      </div>
    </div>
  )
}
