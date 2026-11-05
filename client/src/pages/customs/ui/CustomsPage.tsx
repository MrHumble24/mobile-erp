import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  useCurrentPriceList,
  usePriceListVersions,
  useUnmatchedModels,
} from "@/entities/customs"
import { CreatePriceListDialog } from "@/features/create-price-list"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { CurrentListTable } from "./CurrentListTable"
import { VersionsList } from "./VersionsList"
import { UnmatchedModelsList } from "./UnmatchedModelsList"

export function CustomsPage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("customs.manage"))
  const [createOpen, setCreateOpen] = React.useState(false)

  const current = useCurrentPriceList()
  const versions = usePriceListVersions()
  const unmatched = useUnmatchedModels()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customs.title")}
        description={t("customs.pageDescription")}
        actions={
          canManage ? (
            <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t("customs.newList")}
            </Button>
          ) : undefined
        }
      />

      {current.isLoading ? (
        <Skeleton className="h-40 w-full rounded-[16px]" />
      ) : current.data ? (
        <CurrentListTable list={current.data} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("customs.emptyList")}</p>
      )}

      {!unmatched.isLoading && <UnmatchedModelsList models={unmatched.data ?? []} />}

      {!versions.isLoading && <VersionsList versions={versions.data ?? []} />}

      <CreatePriceListDialog
        current={current.data ?? null}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
