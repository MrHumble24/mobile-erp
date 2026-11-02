import { useI18n } from "@/shared/i18n"
import { useUsers } from "@/entities/user"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

function userName(profile: { firstName: string; lastName?: string | null } | null, email: string): string {
  if (!profile) return email
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || email
}

/** Cashier filter — only mounted for callers with `user.read`. */
export function CashierFilter({
  value,
  onChange,
}: {
  value?: string
  onChange: (id?: string) => void
}) {
  const { t } = useI18n()
  const { data: users } = useUsers()

  return (
    <div className="space-y-1">
      <Label>{t("sales.soldBy")}</Label>
      <Select
        value={value ?? "all"}
        onValueChange={(v) => onChange(v && v !== "all" ? v : undefined)}
      >
        <SelectTrigger className="h-10 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          {(users ?? []).map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {userName(u.profile, u.email)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
