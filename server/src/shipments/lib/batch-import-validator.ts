import { validateSpecs } from '../../device-models/lib/attribute-schema.js';
import type { DeviceModelView } from '../../device-models/types/device-model.types.js';
import { matchCustomsFee } from '../../customs/lib/customs-match.js';
import type { ImportShipmentRowDto } from '../dto/import-shipment.dto.js';
import type {
  ImportShipmentProblem,
  ImportShipmentWarning,
  RegisterDeviceInput,
} from '../types/shipment.types.js';
import {
  computeAcquisitionCost,
  parseStorageAndModelName,
  resolveModelForImport,
  splitExpense,
} from './batch-row-calc.js';

export interface BatchValidationResult {
  problems: ImportShipmentProblem[];
  deviceInputs: RegisterDeviceInput[];
  warnings: ImportShipmentWarning[];
}

function buildImeiRowMap(rows: ImportShipmentRowDto[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const r of rows) {
    for (const imei of [r.imei, r.imei2].filter((x): x is string => !!x)) {
      const list = map.get(imei) ?? [];
      list.push(r.row);
      map.set(imei, list);
    }
  }
  return map;
}

function checkRowImeis(
  r: ImportShipmentRowDto,
  imeiRowMap: Map<string, number[]>,
  dbImeis: Set<string>,
): ImportShipmentProblem[] {
  const problems: ImportShipmentProblem[] = [];
  if (r.imei && (imeiRowMap.get(r.imei)?.length ?? 0) > 1) {
    problems.push({
      row: r.row,
      code: 'DUPLICATE_IMEI',
      detail: `Duplicate IMEI ${r.imei} in batch sheet`,
    });
  }
  if (r.imei2 && (imeiRowMap.get(r.imei2)?.length ?? 0) > 1) {
    problems.push({
      row: r.row,
      code: 'DUPLICATE_IMEI',
      detail: `Duplicate IMEI 2 ${r.imei2} in batch sheet`,
    });
  }
  if (r.imei2 && r.imei2 === r.imei) {
    problems.push({
      row: r.row,
      code: 'DUPLICATE_IMEI',
      detail: `IMEI 2 equals IMEI 1 (${r.imei})`,
    });
  }
  if (r.imei && dbImeis.has(r.imei)) {
    problems.push({
      row: r.row,
      code: 'IMEI_ALREADY_EXISTS',
      detail: `IMEI ${r.imei} already exists in database`,
    });
  }
  if (r.imei2 && dbImeis.has(r.imei2)) {
    problems.push({
      row: r.row,
      code: 'IMEI_ALREADY_EXISTS',
      detail: `IMEI 2 ${r.imei2} already exists in database`,
    });
  }
  return problems;
}

interface RowModelCheck {
  model?: DeviceModelView;
  storage?: string;
  problems: ImportShipmentProblem[];
}

function checkRowModel(
  r: ImportShipmentRowDto,
  models: DeviceModelView[],
): RowModelCheck {
  const { storage, baseModelName } = parseStorageAndModelName(r.modelName);
  const resolved = resolveModelForImport(models, baseModelName, r.modelName);
  if (resolved.error || !resolved.model) {
    return {
      problems: [
        {
          row: r.row,
          code: 'MODEL_NOT_FOUND',
          detail: resolved.error ?? `Model "${r.modelName}" not found`,
        },
      ],
    };
  }
  const model = resolved.model as DeviceModelView;
  if (model.kindCode !== 'IMEI') {
    return {
      problems: [
        {
          row: r.row,
          code: 'INVALID_MODEL_KIND',
          detail: `Model ${model.name} is ${model.kindCode}, expected IMEI`,
        },
      ],
    };
  }
  return { model, storage, problems: [] };
}

function checkRowSpecs(
  r: ImportShipmentRowDto,
  model: DeviceModelView,
  storage?: string,
): { specs: Record<string, unknown>; problems: ImportShipmentProblem[] } {
  const modelSpecs: Record<string, unknown> = {};
  if (storage) modelSpecs.storage = storage;

  const specProblems = validateSpecs(model.attributes ?? [], modelSpecs);
  const problems: ImportShipmentProblem[] = specProblems.map((p) => ({
    row: r.row,
    code: 'INVALID_SPECS',
    detail: p.message,
  }));

  const specs: Record<string, unknown> = { ...modelSpecs };
  if (r.batteryHealth != null) specs.batteryHealth = r.batteryHealth;
  if (r.defects && r.defects.trim()) specs.defects = r.defects.trim();
  return { specs, problems };
}

function prepareDeviceInput(
  r: ImportShipmentRowDto,
  model: DeviceModelView,
  specs: Record<string, unknown>,
  storage: string | undefined,
  exchangeRate: number,
  feeMap: Map<string, number>,
): { input: RegisterDeviceInput; warning?: ImportShipmentWarning } {
  const cost = computeAcquisitionCost(r.price, exchangeRate);
  const fee = matchCustomsFee(feeMap, model.customsCode, storage);
  const split = splitExpense(r.expense, fee);
  const targetPrice =
    r.markup != null ? Number((cost + r.markup).toFixed(2)) : undefined;

  const warning = split.warning
    ? {
        row: r.row,
        code: 'EXPENSE_LESS_THAN_FEE' as const,
        detail: split.warning,
      }
    : undefined;

  const input: RegisterDeviceInput = {
    imei: r.imei,
    imei2: r.imei2,
    modelId: model.id,
    kindCode: 'IMEI',
    specs,
    acquisitionCost: cost,
    acquisitionCostOriginal: r.price,
    customsFee: split.customsFee,
    unitExpense: split.unitExpense,
    unitExpenseNote: split.unitExpenseNote,
    targetPrice,
  };
  return { input, warning };
}

export function validateAndPrepareBatchImport(
  rows: ImportShipmentRowDto[],
  exchangeRate: number,
  models: DeviceModelView[],
  dbImeis: Set<string>,
  feeMap: Map<string, number>,
): BatchValidationResult {
  const problems: ImportShipmentProblem[] = [];
  const warnings: ImportShipmentWarning[] = [];
  const deviceInputs: RegisterDeviceInput[] = [];
  const imeiRowMap = buildImeiRowMap(rows);

  for (const r of rows) {
    const imeiProblems = checkRowImeis(r, imeiRowMap, dbImeis);
    const modelCheck = checkRowModel(r, models);
    problems.push(...imeiProblems, ...modelCheck.problems);

    if (imeiProblems.length > 0 || !modelCheck.model) continue;

    const { specs, problems: specProblems } = checkRowSpecs(
      r,
      modelCheck.model,
      modelCheck.storage,
    );
    problems.push(...specProblems);
    if (specProblems.length > 0) continue;

    const { input, warning } = prepareDeviceInput(
      r,
      modelCheck.model,
      specs,
      modelCheck.storage,
      exchangeRate,
      feeMap,
    );
    if (warning) warnings.push(warning);
    deviceInputs.push(input);
  }

  return { problems, deviceInputs, warnings };
}
