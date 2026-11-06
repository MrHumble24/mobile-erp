import { Controller, type UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { useUsers, type UserView } from "@/entities/user"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { cn } from "@/shared/lib/utils"
import { MASTER_MODES, type MasterMode, type RepairFormValues } from "../model/repair-ticket-schema"

type Form = UseFormReturn<RepairFormValues>

function userName(u: UserView): string {
  const first = u.profile?.firstName?.trim()
  const last = u.profile?.lastName?.trim()
  const full = [first, last].filter(Boolean).join(" ")
  return full || u.email
}

function modeLabelKey(mode: MasterMode): string {
  if (mode === "OWN") return "repairs.masterOwn"
  if (mode === "OUTSIDE") return "repairs.masterOutside"
  return "common.no"
}

function OwnMaster({ form }: { form: Form }) {
  const { t } = useI18n()
  const { data: users } = useUsers()
  return (
    <Controller
      control={form.control}
      name="masterUserId"
      render={({ field }) => (
        <div className="space-y-1">
          <Label>{t("repairs.masterUser")}</Label>
          <Select value={field.value || undefined} onValueChange={(v) => field.onChange(v ?? "")}>
            <SelectTrigger className="h-10"><SelectValue placeholder={t("repairs.masterUser")} /></SelectTrigger>
            <SelectContent>
              {(users ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>{userName(u)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  )
}

function OutsideMaster({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={form.control}
          name="outsideMasterName"
          render={({ field }) => (
            <div className="space-y-1">
              <Label>{t("repairs.outsideMasterName")}</Label>
              <Input {...field} className="h-10" />
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="outsideMasterPhone"
          render={({ field }) => (
            <div className="space-y-1">
              <Label>{t("repairs.outsideMasterPhone")}</Label>
              <Input {...field} className="h-10" />
            </div>
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="outsideCost"
        render={({ field }) => (
          <div className="space-y-1">
            <Label>{t("repairs.outsideCost")}</Label>
            <Input
              type="number"
              min={0}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="h-10 text-base font-bold"
            />
          </div>
        )}
      />
    </div>
  )
}

/** Who repairs the phone: nobody yet, our master, or an outside master. */
export function MasterField({ form }: { form: Form }) {
  const { t } = useI18n()
  const mode = form.watch("masterMode")
  return (
    <div className="space-y-3 rounded-[12px] border border-border bg-muted p-3">
      <Label>{t("repairs.masterTitle")}</Label>
      <div className="flex gap-2">
        {MASTER_MODES.map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? "default" : "outline"}
            className={cn("flex-1", mode === m && "shadow-xs")}
            onClick={() => form.setValue("masterMode", m, { shouldValidate: true })}
          >
            {t(modeLabelKey(m))}
          </Button>
        ))}
      </div>
      {mode === "OWN" && <OwnMaster form={form} />}
      {mode === "OUTSIDE" && <OutsideMaster form={form} />}
    </div>
  )
}
