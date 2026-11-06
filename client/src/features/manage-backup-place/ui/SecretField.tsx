import { useState } from "react"
import { useI18n } from "@/shared/i18n"
import { useSetPlaceSecret, backupErrorMessage, type PlaceSecretKind } from "@/entities/backup"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/sonner"

/** A write-only secret: type a new value and save it. The current value is
 * never shown — the server only ever says whether one is set. */
export function SecretField({
  code,
  kind,
  label,
}: {
  code: string
  kind: PlaceSecretKind
  label: string
}) {
  const { t } = useI18n()
  const setSecret = useSetPlaceSecret()
  const [value, setValue] = useState("")

  const save = () => {
    if (!value) return
    setSecret.mutate(
      { code, kind, value },
      {
        onSuccess: () => {
          toast.success(t("backups.secretSaved"))
          setValue("")
        },
        onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
      },
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold">{label}</label>
      <div className="flex gap-2">
        <Input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("backups.secretPlaceholder")}
          className="h-8 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          className="h-8 text-xs shrink-0"
          disabled={!value || setSecret.isPending}
          onClick={save}
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  )
}
