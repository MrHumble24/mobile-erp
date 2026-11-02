import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useRoles, useSetUserRoles, type UserView } from "@/entities/user"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { toast } from "@/shared/ui/sonner"

export function UserRolesSection({
  user,
  isSelf,
}: {
  user: UserView
  isSelf: boolean
}) {
  const { t } = useI18n()
  const { data: roles } = useRoles()
  const setRoles = useSetUserRoles()
  const [selected, setSelected] = React.useState<string[]>(user.roles)

  const dirty =
    selected.length !== user.roles.length ||
    selected.some((c) => !user.roles.includes(c))

  const toggle = (code: string) =>
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )

  const save = () =>
    setRoles.mutate(
      { id: user.id, dto: { roleCodes: selected } },
      {
        onSuccess: () => toast.success(t("users.rolesSaved")),
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )

  return (
    <div className="space-y-3">
      {isSelf && (
        <p className="text-xs text-muted-foreground">{t("users.selfRolesLocked")}</p>
      )}
      <div className="grid grid-cols-2 gap-2 rounded-[12px] border border-[#e8e8e8] bg-[#f8f9fa] p-3">
        {roles?.map((r) => (
          <label
            key={r.code}
            className="flex cursor-pointer items-center gap-2 text-sm font-medium"
          >
            <Checkbox
              checked={selected.includes(r.code)}
              onCheckedChange={() => toggle(r.code)}
              disabled={isSelf}
            />
            <span>{r.name}</span>
          </label>
        ))}
      </div>
      <Button
        size="sm"
        onClick={save}
        disabled={isSelf || !dirty || setRoles.isPending}
      >
        {setRoles.isPending ? t("common.loading") : t("users.saveRoles")}
      </Button>
    </div>
  )
}
