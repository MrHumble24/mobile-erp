import * as React from "react"
import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useDeviceModels, type DeviceModelView } from "@/entities/device-model"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { DeviceModelDialog } from "./DeviceModelDialog"

type DialogState = { open: boolean; model: DeviceModelView | null }

function ModelsTable({ models, onEdit }: { models: DeviceModelView[]; onEdit: (m: DeviceModelView) => void }) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.brand")}</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("inventory.modelActive")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.brand}</TableCell>
              <TableCell>{m.name}</TableCell>
              <TableCell>
                <Badge variant={m.isActive ? "mint" : "outline"} size="sm">
                  {m.isActive ? t("common.yes") : t("common.no")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(m)}>
                  {t("common.edit")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function DeviceModelsPanel() {
  const { t } = useI18n()
  const { data: models, isLoading } = useDeviceModels()
  const [dialog, setDialog] = React.useState<DialogState>({ open: false, model: null })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">{t("inventory.modelsTitle")}</h3>
        <Button size="sm" onClick={() => setDialog({ open: true, model: null })}>
          <Plus className="size-4" />
          {t("inventory.newModel")}
        </Button>
      </div>
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (models?.length ?? 0) === 0 ? (
        <div className="py-12 text-center text-muted-foreground border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
          {t("inventory.empty")}
        </div>
      ) : (
        <ModelsTable models={models ?? []} onEdit={(m) => setDialog({ open: true, model: m })} />
      )}
      <DeviceModelDialog
        model={dialog.model}
        open={dialog.open}
        onOpenChange={(open) => setDialog((s) => ({ ...s, open }))}
      />
    </div>
  )
}
