import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Printer } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useCreditContract, ContractPaper } from "@/entities/credit"
import { Button } from "@/shared/ui/button"

export function CreditContractPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { data: contract, isLoading } = useCreditContract(id || null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          <span>{t("common.back")}</span>
        </Button>
        {contract && (
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 rounded-full text-xs shadow-xs">
            <Printer className="size-3.5" />
            <span>{t("credit.printContract")}</span>
          </Button>
        )}
      </div>

      <div className="flex justify-center py-4">
        {isLoading && <div className="py-20 text-center text-sm text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && !contract && (
          <div className="py-20 text-center text-sm text-muted-foreground">{t("common.notFound")}</div>
        )}
        {contract && <ContractPaper contract={contract} />}
      </div>
    </div>
  )
}

export default CreditContractPage
