import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useCredits } from "@/entities/credit"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import { useCreditsFilters } from "../model/use-credits-filters"
import { CreditsFilters } from "./CreditsFilters"
import { CreditsTable } from "./CreditsTable"
import { CreditDetailSheet } from "./CreditDetailSheet"

export function CreditsPage() {
  const { t } = useI18n()
  const filters = useCreditsFilters()
  const { data, isLoading } = useCredits(filters.queryFilters)
  const [detailId, setDetailId] = React.useState<string | null>(null)

  const rows = React.useMemo(() => {
    const term = filters.searchTerm
    if (!term) return data ?? []
    return (data ?? []).filter((c) => {
      const name = c.customer.name.toLowerCase()
      const phone = (c.customer.phone ?? "").toLowerCase()
      return name.includes(term) || phone.includes(term)
    })
  }, [data, filters.searchTerm])

  return (
    <div className="space-y-6">
      <PageHeader title={t("credit.title")} description={t("credit.pageDescription")} />
      <CreditsFilters filters={filters} />
      {isLoading ? (
        <Skeleton className="h-96 rounded-[16px]" />
      ) : (
        <CreditsTable credits={rows} onOpen={setDetailId} />
      )}
      <CreditDetailSheet
        creditId={detailId}
        open={Boolean(detailId)}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  )
}

export default CreditsPage
