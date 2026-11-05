import { z } from "zod"
import type {
  CreateLedgerEntryDto,
  LedgerAccountBalance,
  LedgerEntryType,
  LedgerTransferDto,
} from "@/entities/ledger"

export type Translate = (key: string) => string

/** The five owner actions; the first four are POST /ledger/transactions, the last a transfer. */
export type LedgerEntryMode = LedgerEntryType | "TRANSFER"

const POSITIVE_ONLY: LedgerEntryMode[] = ["DEPOSIT", "WITHDRAWAL", "TRANSFER"]

function todayIso(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function makeLedgerEntrySchema(mode: LedgerEntryMode, t: Translate) {
  return z
    .object({
      accountCode: z.string(),
      fromAccountCode: z.string(),
      toAccountCode: z.string(),
      amount: z.string(),
      note: z.string(),
      occurredAt: z.string(),
    })
    .superRefine((v, ctx) => {
      const amount = Number(v.amount)
      if (!v.amount || Number.isNaN(amount)) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: t("balance.errorAmountRequired") })
      } else if (POSITIVE_ONLY.includes(mode)) {
        if (amount <= 0)
          ctx.addIssue({ code: "custom", path: ["amount"], message: t("balance.errorAmountPositive") })
      } else if (amount === 0) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: t("balance.errorAmountRequired") })
      }

      if (mode === "CORRECTION" && !v.note.trim()) {
        ctx.addIssue({ code: "custom", path: ["note"], message: t("balance.errorReasonRequired") })
      }

      if (mode === "TRANSFER" && v.fromAccountCode === v.toAccountCode) {
        ctx.addIssue({ code: "custom", path: ["toAccountCode"], message: t("balance.errorSameAccount") })
      }
    })
}

export type LedgerEntryValues = z.infer<ReturnType<typeof makeLedgerEntrySchema>>

export function defaultValues(
  mode: LedgerEntryMode,
  accounts: LedgerAccountBalance[]
): LedgerEntryValues {
  const first = accounts[0]?.accountCode ?? ""
  const second = accounts[1]?.accountCode ?? first
  return {
    accountCode: first,
    fromAccountCode: first,
    toAccountCode: mode === "TRANSFER" ? second : first,
    amount: "",
    note: "",
    occurredAt: todayIso(),
  }
}

/** Omit occurredAt for today so the server stamps the real time; backdated days use local start-of-day. */
function toOccurredAt(date: string): string | undefined {
  if (!date || date === todayIso()) return undefined
  return new Date(`${date}T00:00:00`).toISOString()
}

function trimmed(note: string): string | undefined {
  const v = note.trim()
  return v ? v : undefined
}

export function toCreateDto(mode: LedgerEntryType, v: LedgerEntryValues): CreateLedgerEntryDto {
  return {
    accountCode: v.accountCode,
    typeCode: mode,
    amount: Number(v.amount),
    note: trimmed(v.note),
    occurredAt: toOccurredAt(v.occurredAt),
  }
}

export function toTransferDto(v: LedgerEntryValues): LedgerTransferDto {
  return {
    fromAccountCode: v.fromAccountCode,
    toAccountCode: v.toAccountCode,
    amount: Number(v.amount),
    note: trimmed(v.note),
    occurredAt: toOccurredAt(v.occurredAt),
  }
}
