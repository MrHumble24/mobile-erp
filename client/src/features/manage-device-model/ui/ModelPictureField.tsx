import { useEffect, useMemo, useState } from "react"
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

/** Shows the model's main picture and lets the admin upload, replace or remove it. */
export function ModelPictureField({
  model,
  stagedFile,
  onStagedFileChange,
}: {
  model?: DeviceModelView | null
  stagedFile?: File | null
  onStagedFileChange?: (file: File | null) => void
}) {
  const { t } = useI18n()
  const upload = useUploadDeviceModelImage()
  const remove = useRemoveDeviceModelImage()
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const busy = upload.isPending || remove.isPending

  const stagedUrl = useMemo(() => {
    if (!stagedFile) return null
    return URL.createObjectURL(stagedFile)
  }, [stagedFile])

  useEffect(() => {
    return () => {
      if (stagedUrl) URL.revokeObjectURL(stagedUrl)
    }
  }, [stagedUrl])

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const onFile = (file: File) => {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t("catalog.errorPictureType"))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("catalog.errorPictureSize"))
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPreview(preview)

    if (model) {
      upload.mutate(
        { id: model.id, file },
        {
          onSuccess: () => toast.success(t("catalog.pictureSaved")),
          onError: (err: { statusCode?: number; message?: string }) => {
            setLocalPreview(null)
            toast.error(serverMessage(t, err))
          },
        }
      )
    } else if (onStagedFileChange) {
      onStagedFileChange(file)
    }
  }

  const onRemove = () => {
    setLocalPreview(null)
    if (model) {
      remove.mutate(model.id, {
        onSuccess: () => toast.success(t("catalog.pictureRemoved")),
        onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
      })
    } else if (onStagedFileChange) {
      onStagedFileChange(null)
    }
  }

  const displayBlob = localPreview || stagedUrl
  const hasImage = Boolean(displayBlob || model?.imageUrl)

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("catalog.mainPicture")}</p>
      <div className="flex items-start gap-3">
        {displayBlob ? (
          <img
            src={displayBlob}
            alt={model?.name ?? "Model preview"}
            className="size-20 shrink-0 rounded-[12px] border border-border object-cover"
          />
        ) : (
          <AssetImage
            path={model?.imageUrl ?? null}
            alt={model?.name ?? ""}
            className="size-20 shrink-0 rounded-[12px] border border-border"
          />
        )}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <FilePicker accept={ACCEPTED_IMAGE_TYPES.join(",")} disabled={busy} onPick={onFile}>
              <Button type="button" variant="outline" size="sm" disabled={busy} className="gap-1.5">
                <ImagePlus className="size-4" />
                {hasImage ? t("catalog.replacePicture") : t("catalog.uploadPicture")}
              </Button>
            </FilePicker>
            {hasImage && (
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
