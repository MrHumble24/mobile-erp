import { useI18n } from "@/shared/i18n"
import {
  useDefectTypes,
  useGrades,
  useCreateDefectType,
  useUpdateDefectType,
  useCreateGrade,
  useUpdateGrade,
} from "@/entities/qc"
import { LookupTablePanel } from "./LookupTablePanel"

/** Two runtime-managed QC lookups: defect types and cosmetic grades (settings.manage). */
export function QcLookupsPanel() {
  const { t } = useI18n()
  const defects = useDefectTypes(true)
  const grades = useGrades(true)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <LookupTablePanel
        title={t("qc.defectTypes")}
        rows={defects.data || []}
        isLoading={defects.isLoading}
        create={useCreateDefectType()}
        update={useUpdateDefectType()}
      />
      <LookupTablePanel
        title={t("qc.grades")}
        rows={grades.data || []}
        isLoading={grades.isLoading}
        create={useCreateGrade()}
        update={useUpdateGrade()}
      />
    </div>
  )
}
