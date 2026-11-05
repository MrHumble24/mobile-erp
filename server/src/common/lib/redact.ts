/**
 * Cost keys, visible only with `device.cost.view`. Includes report aggregate
 * aliases (COGS, landed-value and rolling-average cost columns) so derived
 * cost figures are redacted the same as raw device cost columns.
 */
export const COST_KEYS = [
  'acquisitionCost',
  'landedCost',
  'landedCostSnapshot',
  'unitExpense',
  'unitExpenseNote',
  'unitExpenseTotal',
  'customsFee',
  'customsFeeTotal',
  'repairCostEstimate',
  'cogs',
  'inStockLandedValue',
  'landedValue',
  'avgAcquisitionCost',
  'avgLandedCost',
] as const;

/**
 * Profit keys, visible only with `sale.profit.view`. Includes the derived
 * gross-profit and net-operating-income aggregates exposed by reports.
 */
export const PROFIT_KEYS = [
  'netProfit',
  'grossProfit',
  'netOperatingIncome',
] as const;

/**
 * Recursively deletes `keys` from a response in place. Only descends into plain
 * objects and arrays — Date, Decimal and other class instances are left intact.
 */
export function stripKeys(value: unknown, keys: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) {
    for (const item of value) stripKeys(item, keys);
    return value;
  }
  if (isPlainRecord(value)) {
    for (const key of Object.keys(value)) {
      if (keys.has(key)) {
        delete value[key];
        continue;
      }
      stripKeys(value[key], keys);
    }
  }
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}
