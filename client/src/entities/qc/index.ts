export type {
  QcInspectionView,
  QcDefectView,
  LookupView,
  CreateInspectionDto,
} from "./model/qc.types"
export { qcRepository } from "./api/qc.repository"
export { qcKeys } from "./api/qc.keys"
export {
  useQcInspections,
  useDefectTypes,
  useGrades,
  useCreateInspection,
} from "./model/use-qc"
