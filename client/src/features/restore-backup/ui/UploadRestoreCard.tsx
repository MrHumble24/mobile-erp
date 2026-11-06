import { useState } from "react"
import { Upload, FileCheck2, Loader2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatBytes, formatDateTime } from "@/shared/lib/format"
import { useStageUpload, backupErrorMessage, type StagedUpload } from "@/entities/backup"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { FilePicker } from "@/shared/ui/file-picker"
import { toast } from "@/shared/ui/sonner"
import { RestoreDialog } from "./RestoreDialog"

/** Choose a `.mbk` file, upload it to staging, see what the server reads from
 * it (date, size), then go through the same red confirmation. */
export function UploadRestoreCard() {
  const { t } = useI18n()
  const stage = useStageUpload()
  const [staged, setStaged] = useState<StagedUpload | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const onPick = (file: File) => {
    setStaged(null)
    stage.mutate(file, {
      onSuccess: (data) => setStaged(data),
      onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="size-4" />
          {t("backups.uploadTitle")}
        </CardTitle>
        <CardDescription>{t("backups.uploadDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FilePicker accept=".mbk" disabled={stage.isPending} onPick={onPick}>
          <Button type="button" variant="outline" disabled={stage.isPending} className="h-9 text-xs">
            {stage.isPending ? (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="size-4 mr-1.5" />
            )}
            {stage.isPending ? t("backups.uploadWorking") : t("backups.uploadChoose")}
          </Button>
        </FilePicker>

        {staged && (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <FileCheck2 className="size-4 text-emerald-600" />
              {t("backups.uploadReady")}
            </div>
            <div className="text-muted-foreground">
              {t("backups.colDate")}: {formatDateTime(staged.createdAt)}
            </div>
            <div className="text-muted-foreground">
              {t("backups.colSize")}: {formatBytes(staged.sizeBytes)}
            </div>
            <Button
              type="button"
              variant="destructive"
              className="h-8 text-xs mt-1"
              onClick={() => setDialogOpen(true)}
            >
              {t("backups.restoreFromFile")}
            </Button>
          </div>
        )}
      </CardContent>

      <RestoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        source={staged ? { kind: "upload", uploadId: staged.uploadId } : null}
        backupDate={staged?.createdAt ?? null}
      />
    </Card>
  )
}
