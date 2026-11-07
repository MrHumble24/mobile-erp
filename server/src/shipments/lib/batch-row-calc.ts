import { normalizeCustomsKey } from '../../customs/lib/customs-match.js';

export interface ParseModelResult {
  storage?: string;
  baseModelName: string;
}

/**
 * Strips the storage suffix (`(\d+)\s*(GB|TB)` at the end) from a model name.
 * Returns the normalized storage (e.g. "256GB") and the remaining base name.
 */
export function parseStorageAndModelName(rawName: string): ParseModelResult {
  const trimmed = rawName.trim();
  const match = trimmed.match(/(?:^|\s+)(\d+)\s*(GB|TB)$/i);
  if (match && match.index !== undefined) {
    const digits = match[1];
    const unit = match[2].toUpperCase();
    const storage = `${digits}${unit}`;
    const baseModelName = trimmed.slice(0, match.index).trim();
    return { storage, baseModelName: baseModelName || trimmed };
  }
  return { baseModelName: trimmed };
}

/**
 * Computes acquisition cost in dollars from price in source currency (e.g. won)
 * and exchange rate: `round(price / exchangeRate, 2)`.
 */
export function computeAcquisitionCost(
  price: number,
  exchangeRate: number,
): number {
  if (exchangeRate <= 0) return 0;
  return Number((Math.round((price / exchangeRate) * 100) / 100).toFixed(2));
}

export interface ExpenseSplitResult {
  customsFee: number;
  unitExpense: number;
  unitExpenseNote?: string;
  warning?: string;
}

/**
 * Splits `Расход` into customsFee and unitExpense:
 * - fee <= 0: customsFee = 0, unitExpense = expense
 * - expense >= fee: customsFee = fee, unitExpense = expense - fee
 * - expense < fee: customsFee = expense, unitExpense = 0, warning
 * unitExpenseNote is "Приход" when unitExpense > 0 or expense was provided.
 */
export function splitExpense(expense: number, fee: number): ExpenseSplitResult {
  if (fee <= 0) {
    return {
      customsFee: 0,
      unitExpense: Number(expense.toFixed(2)),
      unitExpenseNote: expense > 0 ? 'Приход' : undefined,
    };
  }
  if (expense < fee) {
    return {
      customsFee: Number(expense.toFixed(2)),
      unitExpense: 0,
      unitExpenseNote: 'Приход',
      warning: `Расход (${expense}) меньше таможенной пошлины (${fee}); пошлина ограничена суммой ${expense}`,
    };
  }
  return {
    customsFee: Number(fee.toFixed(2)),
    unitExpense: Number((expense - fee).toFixed(2)),
    unitExpenseNote: 'Приход',
  };
}

export interface CandidateModel {
  id: string;
  brand: string;
  name: string;
  kindCode: string;
  customsCode?: string | null;
  attributes?: unknown;
}

/**
 * Matches a row's model name against catalog models:
 * 1. Match baseModelName against DeviceModel.customsCode
 * 2. If nothing, match against model name or brand + name
 * Returns matched model, or error message.
 */
export function resolveModelForImport(
  models: CandidateModel[],
  baseModelName: string,
  fullModelName: string,
): { model?: CandidateModel; error?: string } {
  const normBase = normalizeCustomsKey(baseModelName);
  const normFull = normalizeCustomsKey(fullModelName);

  // 1. Try customsCode match first
  let matches = models.filter(
    (m) => m.customsCode && normalizeCustomsKey(m.customsCode) === normBase,
  );

  // 2. Fall back to name match
  if (matches.length === 0) {
    matches = models.filter((m) => {
      const nameNorm = normalizeCustomsKey(m.name);
      const brandNameNorm = normalizeCustomsKey(`${m.brand} ${m.name}`);
      return (
        nameNorm === normBase ||
        brandNameNorm === normBase ||
        nameNorm === normFull ||
        brandNameNorm === normFull
      );
    });
  }

  if (matches.length === 0) {
    return { error: `Model "${fullModelName}" not found` };
  }
  if (matches.length > 1) {
    const list = matches.map((m) => `${m.brand} ${m.name}`).join(', ');
    return { error: `Multiple models matched "${fullModelName}": ${list}` };
  }
  return { model: matches[0] };
}
