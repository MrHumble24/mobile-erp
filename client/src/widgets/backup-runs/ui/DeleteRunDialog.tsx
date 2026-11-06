import { Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import { useDeleteRun, backupErrorMessage, type BackupRunView } from "@/entities/backup"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"

export function DeleteRunDialog({
  run,
  open,
  onOpenChange,
}: {
  run: BackupRunView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const del = useDeleteRun()

  const onConfirm = () => {
    if (!run) return
    del.mutate(run.id, {
      onSuccess: () => {
        toast.success(t("backups.deleteDone"))
        onOpenChange(false)
      },
      onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <div className="size-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
            <Trash2 className="size-5 stroke-[2.2]" />
          </div>
          <DialogTitle>{t("backups.deleteTitle")}</DialogTitle>
          <DialogDescription className="mt-1">
            {t("backups.deleteConfirm", { date: run ? formatDateTime(run.startedAt) : "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={del.isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={del.isPending}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
