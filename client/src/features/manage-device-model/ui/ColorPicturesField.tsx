import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Trash2, Palette } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { AssetImage } from "@/shared/ui/asset-image"
import { FilePicker } from "@/shared/ui/file-picker"
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  useUploadDeviceModelColorImage,
  useRemoveDeviceModelColorImage,
  type DeviceModelView,
} from "@/entities/device-model"

function serverMessage(t: (k: string) => string, err: { statusCode?: number; message?: string }): string {
  if (err?.statusCode === 413) return t("catalog.errorPictureSize")
  if (err?.statusCode === 400) return t("catalog.errorPictureType")
  return err?.message || t("common.error")
}

interface ColorRowProps {
  color: string
  existingUrl?: string | null
  stagedFile?: File
  localPreview?: string | null
  busy: boolean
  onPick: (file: File) => void
  onRemove: () => void
}

function ColorRow({
  color,
  existingUrl,
  stagedFile,
  localPreview,
  busy,
  onPick,
  onRemove,
}: ColorRowProps) {
  const { t } = useI18n()

  const stagedUrl = useMemo(() => {
    if (!stagedFile) return null
    return URL.createObjectURL(stagedFile)
  }, [stagedFile])

  useEffect(() => {
    return () => {
      if (stagedUrl) URL.revokeObjectURL(stagedUrl)
    }
  }, [stagedUrl])

  const displayBlob = localPreview || stagedUrl
  const hasPhoto = Boolean(displayBlob || existingUrl)

  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border bg-card p-2.5">
      <div className="flex items-center gap-3 min-w-0">
        {displayBlob ? (
          <img
            src={displayBlob}
            alt={color}
            className="size-12 shrink-0 rounded-[8px] border border-border object-cover"
          />
        ) : (
          <AssetImage
            path={existingUrl ?? null}
            alt={color}
            className="size-12 shrink-0 rounded-[8px] border border-border"
          />
        )}
        <div className="min-w-0">
          <Badge variant="outline" className="font-semibold text-xs truncate max-w-48">
            {color}
          </Badge>
          <p className="text-[11px] text-muted-foreground truncate">
            {hasPhoto ? t("catalog.pictureSaved") : t("common.optional")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <FilePicker accept={ACCEPTED_IMAGE_TYPES.join(",")} disabled={busy} onPick={onPick}>
          <Button type="button" variant="outline" size="sm" disabled={busy} className="h-8 gap-1 text-xs">
            <ImagePlus className="size-3.5" />
            {hasPhoto ? t("catalog.replacePicture") : t("catalog.addColorPicture")}
          </Button>
        </FilePicker>
        {hasPhoto && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={onRemove}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function ColorPicturesField({
  model,
  colors,
  stagedColorFiles,
  onStagedColorChange,
}: {
  model: DeviceModelView | null
  colors: string[]
  stagedColorFiles?: Record<string, File>
  onStagedColorChange?: (color: string, file: File | null) => void
}) {
  const { t } = useI18n()
  const upload = useUploadDeviceModelColorImage()
  const remove = useRemoveDeviceModelColorImage()
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({})
  const busy = upload.isPending || remove.isPending

  useEffect(() => {
    return () => {
      Object.values(localPreviews).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [localPreviews])

  const handlePick = (color: string, file: File) => {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      toast.error(t("catalog.errorPictureType"))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("catalog.errorPictureSize"))
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPreviews((prev) => ({ ...prev, [color]: preview }))

    if (model) {
      upload.mutate(
        { id: model.id, color, file },
        {
          onSuccess: () => toast.success(t("catalog.pictureSaved")),
          onError: (err: { statusCode?: number; message?: string }) => {
            setLocalPreviews((prev) => {
              const next = { ...prev }
              delete next[color]
              return next
            })
            toast.error(serverMessage(t, err))
          },
        }
      )
    } else if (onStagedColorChange) {
      onStagedColorChange(color, file)
    }
  }

  const handleRemove = (color: string) => {
    setLocalPreviews((prev) => {
      const next = { ...prev }
      delete next[color]
      return next
    })
    if (model) {
      remove.mutate(
        { id: model.id, color },
        {
          onSuccess: () => toast.success(t("catalog.pictureRemoved")),
          onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
        }
      )
    } else if (onStagedColorChange) {
      onStagedColorChange(color, null)
    }
  }

  return (
    <div className="space-y-3 rounded-[12px] border border-border bg-muted/40 p-3">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <Palette className="size-4 text-primary" />
          <p className="text-sm font-semibold">{t("catalog.colorPictures")}</p>
        </div>
        <p className="text-xs text-muted-foreground">{t("catalog.colorPicturesHint")}</p>
      </div>

      {colors.length === 0 ? (
        <p className="text-xs italic text-muted-foreground py-2 text-center bg-card rounded-[8px] border border-dashed border-border">
          {t("catalog.noColorsYet")}
        </p>
      ) : (
        <div className="space-y-2">
          {colors.map((color) => (
            <ColorRow
              key={color}
              color={color}
              existingUrl={model?.colorImages?.[color]}
              stagedFile={stagedColorFiles?.[color]}
              localPreview={localPreviews[color]}
              busy={busy}
              onPick={(file) => handlePick(color, file)}
              onRemove={() => handleRemove(color)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
