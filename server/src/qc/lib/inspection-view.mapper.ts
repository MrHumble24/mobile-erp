import { QcInspectionListItem, QcInspectionView } from '../types/qc.types.js';

/** Prisma args that hydrate a list row with device + inspector context. */
export const inspectionListInclude = {
  include: {
    defects: { select: { defectCode: true, notes: true } },
    device: {
      select: {
        id: true,
        imei: true,
        imei2: true,
        modelId: true,
        statusCode: true,
        model: { select: { brand: true, name: true } },
      },
    },
    inspectedBy: {
      select: {
        id: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    },
  },
} as const;

interface InspectionRow {
  id: string;
  deviceId: string;
  inspectedById: string;
  passed: boolean;
  gradeCode: string | null;
  batteryHealth: number | null;
  repairCostEstimate: { toString(): string } | null;
  notes: string | null;
  inspectedAt: Date;
  defects: { defectCode: string; notes: string | null }[];
}

export interface InspectionListRow extends InspectionRow {
  device: {
    id: string;
    imei: string;
    imei2: string | null;
    modelId: string;
    statusCode: string;
    model: { brand: string; name: string };
  };
  inspectedBy: {
    id: string;
    profile: { firstName: string; lastName: string | null } | null;
  };
}

export function toInspectionView(row: InspectionRow): QcInspectionView {
  return {
    id: row.id,
    deviceId: row.deviceId,
    inspectedById: row.inspectedById,
    passed: row.passed,
    gradeCode: row.gradeCode,
    batteryHealth: row.batteryHealth,
    repairCostEstimate: row.repairCostEstimate
      ? row.repairCostEstimate.toString()
      : null,
    notes: row.notes,
    inspectedAt: row.inspectedAt,
    defects: row.defects,
  };
}

export function toInspectionListItem(
  row: InspectionListRow,
): QcInspectionListItem {
  return {
    ...toInspectionView(row),
    device: {
      id: row.device.id,
      imei: row.device.imei,
      imei2: row.device.imei2,
      modelId: row.device.modelId,
      model: row.device.model,
      statusCode: row.device.statusCode,
    },
    inspectedBy: {
      id: row.inspectedBy.id,
      name: fullName(row.inspectedBy.profile),
    },
  };
}

function fullName(
  profile: { firstName: string; lastName: string | null } | null,
): string {
  if (!profile) return '';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}
