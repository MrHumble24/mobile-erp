import * as React from "react"
import { Check, Plus, RefreshCw, X } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { DeviceModelView } from "@/entities/device-model"
import { badgeVariants } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Combobox } from "@/shared/ui/combobox"
import { cn } from "@/shared/lib/utils"
import { rowMatchView } from "../model/model-match"

export interface RowModelLinksProps {
  /** The row's customs code as typed/imported. */
  code: string
  models: DeviceModelView[]
  /** Model ids pending to be linked from a row with this code; applied on save. */
  pendingIds: string[]
  onLink: (modelId: string) => void
  onUnlink: (modelId: string) => void
}

const CHIP_BASE = "h-8 max-w-[260px] gap-1.5 shrink-0 focus-visible:ring-2 focus-visible:ring-ring/30"

function modelLabel(model: DeviceModelView): string {
  return `${model.brand} ${model.name}`.trim()
}

const CHIP_COPY = {
  linked: "customs.chipLinked",
  pending: "customs.chipPending",
  suggest: "customs.chipSuggest",
  conflict: "customs.chipConflict",
} as const

type ChipKind = keyof typeof CHIP_COPY
type Translate = ReturnType<typeof useI18n>["t"]

function chipIcon(kind: ChipKind) {
  if (kind === "suggest") return <Plus className="size-3.5 shrink-0" />
  if (kind === "conflict") return <RefreshCw className="size-3.5 shrink-0" />
  return <Check className="size-3.5 shrink-0" />
}

function chipMeta(kind: ChipKind, model: DeviceModelView, t: Translate) {
  const label = modelLabel(model)
  if (kind === "linked") return { title: t("customs.linkedTitle"), aria: label }
  if (kind === "conflict") {
    return {
      title: t("customs.conflictLinkTitle", { code: model.customsCode ?? "" }),
      aria: t("customs.overwriteAria", { model: label }),
    }
  }
  if (kind === "pending") {
    return { title: t("customs.unlinkLink"), aria: t("customs.unlinkAria", { model: label }) }
  }
  return { title: t("customs.suggestLinkTitle"), aria: t("customs.linkAria", { model: label }) }
}

/** A chip always states its action in words — colour alone never carries meaning. */
function Chip({
  model,
  kind,
  onClick,
}: {
  model: DeviceModelView
  /** linked: display only; pending: cancel; suggest: link; conflict: overwrite. */
  kind: ChipKind
  onClick?: () => void
}) {
  const { t } = useI18n()
  const variant = kind === "conflict" ? "amber" : kind === "suggest" ? "violet" : "emerald"
  const cls = cn(badgeVariants({ variant, size: "sm" }) as string, CHIP_BASE)
  const { title, aria } = chipMeta(kind, model, t)
  const text = t(CHIP_COPY[kind], { model: modelLabel(model) })
  const icon = chipIcon(kind)
  if (!onClick) {
    return (
      <span title={title} className={cls}>
        {icon}
        <span className="truncate">{text}</span>
      </span>
    )
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      aria-label={aria}
      className={cn(cls, "cursor-pointer hover:brightness-95")}
      onClick={onClick}
    >
      {icon}
      <span className="truncate">{text}</span>
      {kind === "pending" && <X className="size-3 shrink-0 opacity-70" />}
    </Button>
  )
}

/** The "+ other model" chip: searchable pick from every model not already shown. */
function AddLinkChip({
  code,
  models,
  excludeIds,
  onLink,
}: {
  code: string
  models: DeviceModelView[]
  excludeIds: Set<string>
  onLink: (modelId: string) => void
}) {
  const { t } = useI18n()
  const options = models
    .filter((m) => m.isActive && !excludeIds.has(m.id))
    .map((m) => ({ value: m.id, label: modelLabel(m) }))
  return (
    <Combobox
      value=""
      onChange={onLink}
      options={options}
      placeholder={t("customs.addModelLink")}
      ariaLabel={t("customs.addModelLinkAria", { code })}
      searchPlaceholder={t("customs.searchModel")}
      emptyText={t("customs.searchModelEmpty")}
      className="h-8 w-auto shrink-0 rounded-full border-dashed px-3 font-medium text-xs"
    />
  )
}

/**
 * Per-row model connection strip. Every chip says what it does in words and
 * carries an accessible name; the row is announced as a labelled group.
 * Pending links are PATCHed to the models right after the list is saved.
 */
export function RowModelLinks({ code, models, pendingIds, onLink, onUnlink }: RowModelLinksProps) {
  const { t } = useI18n()
  const view = React.useMemo(
    () => rowMatchView(code.trim(), models, pendingIds),
    [code, models, pendingIds]
  )
  if (!view.hasAny && !code.trim()) return null
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("customs.chipsGroup", { code })}>
      {view.pendingModels.map((model) => (
        <Chip key={model.id} model={model} kind="pending" onClick={() => onUnlink(model.id)} />
      ))}
      {view.linked.map((model) => (
        <Chip key={model.id} model={model} kind="linked" />
      ))}
      {view.suggestions.map((model) => (
        <Chip key={model.id} model={model} kind="suggest" onClick={() => onLink(model.id)} />
      ))}
      {view.conflicts.map((model) => (
        <Chip key={model.id} model={model} kind="conflict" onClick={() => onLink(model.id)} />
      ))}
      <AddLinkChip code={code} models={models} excludeIds={view.excludeIds} onLink={onLink} />
    </div>
  )
}
