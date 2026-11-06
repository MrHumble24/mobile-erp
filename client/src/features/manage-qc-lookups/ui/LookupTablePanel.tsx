import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { LookupView } from "@/entities/qc"
import { Button } from "@/shared/ui/button"
import { LookupTable } from "./LookupTable"
import { LookupDialog, type CreateMut, type UpdateMut } from "./LookupDialog"

export function LookupTablePanel({
  title,
  rows,
  isLoading,
  create,
  update,
}: {
  title: string
  rows: LookupView[]
  isLoading: boolean
  create: CreateMut
  update: UpdateMut
}) {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<LookupView | null>(null)

  const openCreate = () => { setEditing(null); setOpen(true) }
  const openEdit = (row: LookupView) => { setEditing(row); setOpen(true) }

  return (
    <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </div>
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">{t("common.loading")}</div>
      ) : (
        <LookupTable rows={rows} onEdit={openEdit} />
      )}
      <LookupDialog
        title={title}
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        create={create}
        update={update}
      />
    </div>
  )
}
