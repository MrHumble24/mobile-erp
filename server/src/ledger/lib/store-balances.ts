import { Prisma } from '../../generated/client/client.js';
import type {
  AccountBalance,
  BalanceSummary,
  StoreBalanceBreakdown,
} from '../types/ledger.types.js';

interface RawAccount {
  code: string;
  label: string;
}

export function buildMultiStoreBalances(
  accounts: RawAccount[],
  storeIds: string[],
  storeMap: Map<string, string>,
  sumsByStore: Map<string, Map<string, Prisma.Decimal>>,
): BalanceSummary {
  const storeBreakdowns: StoreBalanceBreakdown[] = [];
  const companyTotals = new Map<string, Prisma.Decimal>();
  let grandTotal = new Prisma.Decimal(0);

  for (const storeId of storeIds) {
    const byCode =
      sumsByStore.get(storeId) ?? new Map<string, Prisma.Decimal>();
    let storeTotal = new Prisma.Decimal(0);
    const storeAccounts: AccountBalance[] = accounts.map((a) => {
      const bal = byCode.get(a.code) ?? new Prisma.Decimal(0);
      storeTotal = storeTotal.plus(bal);
      const cur = companyTotals.get(a.code) ?? new Prisma.Decimal(0);
      companyTotals.set(a.code, cur.plus(bal));
      return { accountCode: a.code, label: a.label, balance: bal.toFixed(2) };
    });
    grandTotal = grandTotal.plus(storeTotal);
    storeBreakdowns.push({
      storeId,
      storeName: storeMap.get(storeId) ?? storeId,
      accounts: storeAccounts,
      total: storeTotal.toFixed(2),
    });
  }

  const companyAccounts = accounts.map((a) => ({
    accountCode: a.code,
    label: a.label,
    balance: (companyTotals.get(a.code) ?? new Prisma.Decimal(0)).toFixed(2),
  }));

  return {
    accounts: companyAccounts,
    total: grandTotal.toFixed(2),
    stores: storeBreakdowns,
  };
}
