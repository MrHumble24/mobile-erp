import * as React from "react"
import { useStores } from "@/entities/store"
import { useUpdateUser, type UserView } from "@/entities/user"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"

export function UserStoresSection({ user }: { user: UserView }) {
  const { t } = useI18n()
  const { data: stores, isLoading } = useStores()
  const update = useUpdateUser()

  const assigned = React.useMemo(
    () => user.stores?.map((s) => s.id) ?? [],
    [user.stores],
  )
  const [selected, setSelected] = React.useState<string[]>(assigned)

  React.useEffect(() => {
    setSelected(assigned)
  }, [assigned])

  const handleToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  const handleSave = () => {
    update.mutate(
      { id: user.id, dto: { storeIds: selected } },
      {
        onSuccess: () => toast.success(t("users.userSaved")),
        onError: (err: { message?: string }) =>
          toast.error(err?.message || t("common.error")),
      },
    )
  }

  if (isLoading) return <div>{t("common.loading")}</div>

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("users.stores")}</Label>
        <div className="grid grid-cols-1 gap-2 p-3 bg-[#f8f9fa] border border-[#e8e8e8] rounded-[12px]">
          {stores?.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2.5 text-sm font-medium cursor-pointer py-1"
            >
              <Checkbox
                checked={selected.includes(s.id)}
                onCheckedChange={() => handleToggle(s.id)}
              />
              <span>{s.name}</span>
              {s.address && (
                <span className="text-xs text-muted-foreground">
                  ({s.address})
                </span>
              )}
            </label>
          ))}
        </div>
      </div>
      <Button size="sm" onClick={handleSave} disabled={update.isPending}>
        {update.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </div>
  )
}
