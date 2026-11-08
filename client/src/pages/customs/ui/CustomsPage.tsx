import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  useCurrentPriceList,
  usePriceListVersions,
  useUnmatchedModels,
} from "@/entities/customs"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import { buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { CurrentListTable } from "./CurrentListTable"
import { VersionsList } from "./VersionsList"
import { UnmatchedModelsList } from "./UnmatchedModelsList"
import { CustomsEmptyState, CustomsInlineError, CustomsLoadError } from "./CustomsStates"

export function CustomsPage() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canManage = hasPermission("customs.manage")
  const canManageModels = hasPermission("device.update")
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
            <Link to="/customs/new" className={buttonVariants({ size: "sm", className: "gap-1.5" })}>
              <Plus className="size-4" />
              {t("customs.newList")}
            </Link>
          ) : undefined
        }
      />

      {current.isLoading ? (
        <Skeleton className="h-40 w-full rounded-[16px]" />
      ) : current.isError ? (
        <CustomsLoadError onRetry={() => void current.refetch()} />
      ) : current.data ? (
        <CurrentListTable list={current.data} />
      ) : (
        <CustomsEmptyState canManage={canManage} />
      )}

      {unmatched.isError ? (
        <CustomsInlineError onRetry={() => void unmatched.refetch()} />
      ) : (
        !unmatched.isLoading && (
          <UnmatchedModelsList models={unmatched.data ?? []} canManageModels={canManageModels} />
        )
      )}

      {versions.isError ? (
        <CustomsInlineError onRetry={() => void versions.refetch()} />
      ) : (
        !versions.isLoading && <VersionsList versions={versions.data ?? []} />
      )}
    </div>
  )
}
