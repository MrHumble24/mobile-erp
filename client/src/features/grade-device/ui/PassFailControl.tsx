import { Check, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"

/** Segmented pass/fail control composed from shared/ui Buttons. */
export function PassFailControl({
  passed,
  onChange,
}: {
  passed: boolean
  onChange: (passed: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant={passed ? "default" : "outline"}
        onClick={() => onChange(true)}
        className="justify-center"
      >
        <Check className="size-4" />
        {t("qc.passed")}
      </Button>
      <Button
        type="button"
        variant={passed ? "outline" : "destructive"}
        onClick={() => onChange(false)}
        className="justify-center"
      >
        <X className="size-4" />
        {t("qc.failed")}
      </Button>
    </div>
  )
}
