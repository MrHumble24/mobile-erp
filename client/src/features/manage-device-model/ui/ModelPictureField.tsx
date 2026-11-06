import { ImagePlus, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import { AssetImage } from "@/shared/ui/asset-image"
import { FilePicker } from "@/shared/ui/file-picker"
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  useRemoveDeviceModelImage,
  useUploadDeviceModelImage,
  type DeviceModelView,
} from "@/entities/device-model"

function serverMessage(t: (k: string) => string, err: { statusCode?: number; message?: string }): string {
  if (err?.statusCode === 413) return t("catalog.errorPictureSize")
  if (err?.statusCode === 400) return t("catalog.errorPictureType")
  return err?.message || t("common.error")
}

/** Shows the model's picture and lets the admin upload, replace or remove it. */
export function ModelPictureField({ model }: { model: DeviceModelView }) {
  const { t } = useI18n()
  const upload = useUploadDeviceModelImage()
  const remove = useRemoveDeviceModelImage()
  const busy = upload.isPending || remove.isPending

  const onFile = (file: File) => {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t("catalog.errorPictureType"))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("catalog.errorPictureSize"))
      return
    }
    upload.mutate(
      { id: model.id, file },
      {
        onSuccess: () => toast.success(t("catalog.pictureSaved")),
        onError: (err: { statusCode?: number; message?: string }) => toast.error(serverMessage(t, err)),
      }
    )
  }

  const onRemove = () =>
    remove.mutate(model.id, {
      onSuccess: () => toast.success(t("catalog.pictureRemoved")),
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("catalog.picture")}</p>
      <div className="flex items-start gap-3">
        <AssetImage
          path={model.imageUrl}
          alt={model.name}
          className="size-20 shrink-0 rounded-[12px] border border-border"
        />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <FilePicker accept={ACCEPTED_IMAGE_TYPES.join(",")} disabled={busy} onPick={onFile}>
              <Button type="button" variant="outline" size="sm" disabled={busy} className="gap-1.5">
                <ImagePlus className="size-4" />
                {model.imageUrl ? t("catalog.replacePicture") : t("catalog.uploadPicture")}
              </Button>
            </FilePicker>
            {model.imageUrl && (
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove} className="gap-1.5 text-destructive">
                <Trash2 className="size-4" />
                {t("catalog.removePicture")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("catalog.pictureHint")}</p>
        </div>
      </div>
    </div>
  )
}
