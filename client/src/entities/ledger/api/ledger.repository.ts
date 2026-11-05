import { http } from "@/shared/api/http"
import type {
  CreateLedgerEntryDto,
  LedgerAccountOption,
  LedgerBalances,
  LedgerFilters,
  LedgerTransactionPage,
  LedgerTransferDto,
  Money,
} from "../model/ledger.types"

/** `balance` / `total` are numbers today, decimal strings after a pending server change. */
interface BalancesDto {
  accounts: { accountCode: string; label: string; balance: Money }[]
  total: Money
}

const toNumber = (value: Money): number =>
  typeof value === "string" ? Number(value) : value

export const ledgerRepository = {
  accounts: async (): Promise<LedgerAccountOption[]> => {
    return http<LedgerAccountOption[]>("/ledger/accounts")
  },

  balances: async (): Promise<LedgerBalances> => {
    const dto = await http<BalancesDto>("/ledger/balances")
    return {
      accounts: dto.accounts.map((a) => ({
        accountCode: a.accountCode,
        label: a.label,
        balance: toNumber(a.balance),
      })),
      total: toNumber(dto.total),
    }
  },

  list: async (filters?: LedgerFilters): Promise<LedgerTransactionPage> => {
    return http<LedgerTransactionPage>("/ledger/transactions", {
      params: filters as Record<string, string | number | boolean | undefined>,
    })
  },

  createEntry: async (dto: CreateLedgerEntryDto): Promise<void> => {
    await http("/ledger/transactions", { method: "POST", body: dto })
  },

  transfer: async (dto: LedgerTransferDto): Promise<void> => {
    await http("/ledger/transfers", { method: "POST", body: dto })
  },
}
