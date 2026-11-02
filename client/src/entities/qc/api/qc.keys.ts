export const qcKeys = {
  all: ["qc"] as const,
  inspections: (deviceId?: string) => [...qcKeys.all, "inspections", deviceId] as const,
  defectTypes: () => [...qcKeys.all, "defect-types"] as const,
  grades: () => [...qcKeys.all, "grades"] as const,
}
