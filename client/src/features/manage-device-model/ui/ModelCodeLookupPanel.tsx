import { Sparkles } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { BarcodeInput } from "@/shared/ui/barcode-input"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import type { useModelCodeLookup } from "../model/use-model-code-lookup"

type Lookup = ReturnType<typeof useModelCodeLookup>

/**
 * "Kod bo'yicha to'ldirish": the same box-code lookup intake uses, offered while
 * keying a new model. A known code fills brand, name, model code and the
 * storage/color spec options; an unknown code is a quiet hint, never a gate.
 */
export function ModelCodeLookupPanel({ lookup }: { lookup: Lookup }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2 rounded-[12px] border border-border bg-muted p-3">
      <Label>{t("catalog.boxCode")}</Label>
      <BarcodeInput
        value={lookup.boxCode}
        onChange={(e) => lookup.setBoxCode(e.target.value)}
        onClear={() => lookup.setBoxCode("")}
        onKeyDown={(e) => {
          // Enter in the lookup box must not submit the whole model form.
          if (e.key === "Enter") e.preventDefault()
          if (e.key === "Escape") lookup.dismissSearch()
        }}
        placeholder={t("catalog.boxCodeHint")}
        autoFocus
        className="h-10 font-mono"
      />
      <SearchResultsList lookup={lookup} />
      <LookupStatus lookup={lookup} />
      <p className="pt-1 text-[11px] text-muted-foreground">{t("catalog.dataCredit")}</p>
    </div>
  )
}

function SearchResultsList({ lookup }: { lookup: Lookup }) {
  const { searchResults, selectSearchResult } = lookup
  if (searchResults.length === 0) return null

  return (
    <div className="max-h-56 overflow-y-auto rounded-[10px] border border-border bg-card p-1 shadow-md">
      {searchResults.map((item) => (
        <Button
          key={`${item.brand}-${item.model}-${item.modelCode ?? ""}`}
          type="button"
          variant="ghost"
          onClick={() => selectSearchResult(item)}
          className="h-auto w-full items-center justify-between gap-2 rounded-[8px] px-2.5 py-2 text-left text-xs font-normal transition-colors hover:bg-accent"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                {item.brand}
              </span>
              <span className="truncate">{item.model}</span>
              {item.series && (
                <span className="text-[11px] text-muted-foreground">
                  ({item.series})
                </span>
              )}
            </div>
            {item.modelCode && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {item.modelCode}
              </span>
            )}
          </div>
          <div className="shrink-0 text-right text-[11px] text-muted-foreground">
            {item.storageOptions.length > 0 && `${item.storageOptions.length} storages`}
            {item.storageOptions.length > 0 && item.colorOptions.length > 0 && " • "}
            {item.colorOptions.length > 0 && `${item.colorOptions.length} colors`}
          </div>
        </Button>
      ))}
    </div>
  )
}

function LookupStatus({ lookup }: { lookup: Lookup }) {
  const { t } = useI18n()
  const { status, isFetching } = lookup
  if (isFetching) {
    return <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
  }
  if (!status) return null
  if (status.kind === "notFound") {
    return <p className="text-xs text-muted-foreground">{t("catalog.lookupNotFound")}</p>
  }
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <Sparkles className="size-3.5" />
      <span>
        {t("catalog.lookupFound", { model: status.model })}
        {status.details ? (
          <span className="ml-1 text-[11px] font-normal text-muted-foreground">
            ({status.details})
          </span>
        ) : null}
      </span>
    </p>
  )
}
