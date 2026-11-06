import * as React from "react"
import { Sparkles } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Combobox } from "@/shared/ui/combobox"
import { Label } from "@/shared/ui/label"
import type { DeviceModelView } from "@/entities/device-model"
import type { useIntakeLookup } from "../model/use-intake-lookup"

type Lookup = ReturnType<typeof useIntakeLookup>

/** The box-code input, the lookup outcome, and the one-time product pick. */
export function IntakeLookupPanel({ lookup, models }: { lookup: Lookup; models: DeviceModelView[] }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2 rounded-[12px] border border-border bg-muted p-3">
      <Label>{t("catalog.boxCode")}</Label>
      <BarcodeInput
        value={lookup.boxCode}
        onChange={(e) => lookup.setBoxCode(e.target.value)}
        onClear={() => lookup.setBoxCode("")}
        placeholder={t("catalog.boxCodeHint")}
        className="h-10"
      />
      <LookupStatus lookup={lookup} models={models} />
      <p className="pt-1 text-[11px] text-muted-foreground">{t("catalog.dataCredit")}</p>
    </div>
  )
}

function LookupStatus({ lookup, models }: { lookup: Lookup; models: DeviceModelView[] }) {
  const { t } = useI18n()
  const { status } = lookup
  if (!status) return null
  if (status.kind === "notFound") {
    return <p className="text-xs text-muted-foreground">{t("catalog.lookupNotFound")}</p>
  }
  if (status.kind === "found") {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <Sparkles className="size-3.5" />
        {t("catalog.lookupFound", { model: status.model })}
      </p>
    )
  }
  return <PickProduct lookup={lookup} models={models} reference={`${status.brand} ${status.model}`} />
}

function PickProduct({
  lookup,
  models,
  reference,
}: {
  lookup: Lookup
  models: DeviceModelView[]
  reference: string
}) {
  const { t } = useI18n()
  const [modelId, setModelId] = React.useState("")
  const [remember, setRemember] = React.useState(true)

  if (lookup.remembered) {
    return <p className="text-xs font-medium text-emerald-700">{t("catalog.lookupRemembered")}</p>
  }

  return (
    <div className="space-y-2 rounded-[10px] border border-border bg-card p-2.5">
      <p className="text-xs font-medium">{t("catalog.lookupPickProduct")}</p>
      <p className="text-xs text-muted-foreground">{reference}</p>
      <Combobox
        value={modelId}
        onChange={setModelId}
        options={models.map((m) => ({ value: m.id, label: `${m.brand} ${m.name}` }))}
        placeholder={t("shipments.selectModel")}
        searchPlaceholder={t("shipments.selectModel")}
        emptyText={t("inventory.empty")}
      />
      {lookup.canUpdate && (
        <Label className="flex items-center gap-2 text-xs font-normal cursor-pointer">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
          {t("catalog.lookupRemember")}
        </Label>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!modelId}
        onClick={() => lookup.pickProduct(modelId, remember)}
        className="w-full"
      >
        {t("catalog.lookupFill")}
      </Button>
    </div>
  )
}
