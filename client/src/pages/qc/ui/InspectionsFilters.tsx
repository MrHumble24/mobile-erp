import { useI18n } from "@/shared/i18n"
import { useUsers } from "@/entities/user"
import type { LookupView } from "@/entities/qc"
import { Input } from "@/shared/ui/input"
import { Combobox } from "@/shared/ui/combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import type { InspectionFilterState } from "../model/use-inspection-browser"

type OnChange = (val: string | undefined) => void

function toValue(val: string | null): string | undefined {
  return !val || val === "all" ? undefined : val
}

function ResultSelect({ value, onChange }: { value?: string; onChange: OnChange }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10"><SelectValue placeholder={t("qc.result")} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("common.all")}</SelectItem>
        <SelectItem value="true">{t("qc.passed")}</SelectItem>
        <SelectItem value="false">{t("qc.failed")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

function LookupSelect({ value, onChange, options, placeholder }: { value?: string; onChange: OnChange; options: LookupView[]; placeholder: string }) {
  const { t } = useI18n()
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(toValue(v))}>
      <SelectTrigger className="h-10"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("common.all")}</SelectItem>
        {options.map((o) => <SelectItem key={o.code} value={o.code}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function InspectorFilter({ value, onChange }: { value?: string; onChange: OnChange }) {
  const { t } = useI18n()
  const { data: users } = useUsers()
  const options = [
    { value: "", label: t("qc.allInspectors") },
    ...(users || []).map((u) => ({
      value: u.id,
      label: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || u.email,
    })),
  ]
  return (
    <Combobox
      value={value || ""}
      onChange={(v) => onChange(v || undefined)}
      options={options}
      placeholder={t("qc.inspector")}
      searchPlaceholder={t("common.search")}
      emptyText={t("common.notFound")}
    />
  )
}

function DateRange({ filters }: { filters: InspectionFilterState }) {
  return (
    <>
      <Input type="date" className="h-10" value={filters.from || ""} onChange={(e) => filters.setFrom(e.target.value || undefined)} />
      <Input type="date" className="h-10" value={filters.to || ""} onChange={(e) => filters.setTo(e.target.value || undefined)} />
    </>
  )
}

export function InspectionsFilters({
  filters,
  grades,
  defectTypes,
  canReadUsers,
}: {
  filters: InspectionFilterState
  grades: LookupView[]
  defectTypes: LookupView[]
  canReadUsers: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <ResultSelect value={filters.passed} onChange={filters.setPassed} />
      <LookupSelect value={filters.gradeCode} onChange={filters.setGradeCode} options={grades} placeholder={t("qc.grade")} />
      <LookupSelect value={filters.defectCode} onChange={filters.setDefectCode} options={defectTypes} placeholder={t("qc.defectType")} />
      {canReadUsers ? (
        <InspectorFilter value={filters.inspectedById} onChange={filters.setInspectedById} />
      ) : (
        <Input className="h-10" placeholder={t("qc.inspector")} value={filters.inspectedById || ""} onChange={(e) => filters.setInspectedById(e.target.value || undefined)} />
      )}
      <DateRange filters={filters} />
    </div>
  )
}
