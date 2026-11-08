import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { useCurrentPriceList } from "@/entities/customs"
import { CreatePriceListForm } from "@/features/create-price-list"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import { buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { CustomsLoadError } from "./CustomsStates"

/** Dedicated page for the full import + model-linking task — never a modal. */
export function CreatePriceListPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const current = useCurrentPriceList()
  const back = () => navigate("/customs")

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("customs.newList")}
        description={t("customs.newListHint")}
        breadcrumbs={[
          { label: t("customs.title"), href: "/customs" },
          { label: t("customs.newList") },
        ]}
        actions={
          <Link to="/customs" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("common.back")}
          </Link>
        }
      />
      {current.isLoading ? (
        <Skeleton className="h-64 w-full max-w-4xl rounded-[16px]" />
      ) : current.isError ? (
        <CustomsLoadError onRetry={() => void current.refetch()} />
      ) : (
        <CreatePriceListForm current={current.data ?? null} onSaved={back} onCancel={back} />
      )}
    </div>
  )
}
